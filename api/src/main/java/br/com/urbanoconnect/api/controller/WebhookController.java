package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.model.Usuario;
import br.com.urbanoconnect.api.domain.repository.UsuarioRepository;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preapproval.PreapprovalClient;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preapproval.Preapproval;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/webhooks/mercadopago")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Segredo do webhook configurado no painel do Mercado Pago (Suas integrações > Webhooks).
    // Se não estiver definido, a validação de assinatura é pulada (com aviso no log).
    @Value("${mercado.pago.webhook.secret:}")
    private String webhookSecret;

    /**
     * Valida o header x-signature do Mercado Pago (formato "ts=...,v1=...").
     * O manifest assinado é: "id:[data.id];request-id:[x-request-id];ts:[ts];"
     * Referência: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
     */
    private boolean assinaturaValida(String xSignature, String xRequestId, String dataId) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("MP_WEBHOOK_SECRET não configurado — validação de assinatura do webhook desativada.");
            return true;
        }
        if (xSignature == null || xRequestId == null || dataId == null) {
            return false;
        }
        try {
            String ts = null, v1 = null;
            for (String parte : xSignature.split(",")) {
                String[] kv = parte.split("=", 2);
                if (kv.length != 2) continue;
                if ("ts".equals(kv[0].trim())) ts = kv[1].trim();
                if ("v1".equals(kv[0].trim())) v1 = kv[1].trim();
            }
            if (ts == null || v1 == null) return false;

            String manifest = "id:" + dataId.toLowerCase() + ";request-id:" + xRequestId + ";ts:" + ts + ";";

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));

            return java.security.MessageDigest.isEqual(
                    hex.toString().getBytes(StandardCharsets.UTF_8),
                    v1.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Erro ao validar assinatura do webhook MP", e);
            return false;
        }
    }

    @PostMapping
    public ResponseEntity<String> receberAvisoMercadoPago(
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestParam(required = false) String type,
            @RequestParam(name = "data.id", required = false) String dataIdUrl,
            @RequestHeader(name = "x-signature", required = false) String xSignature,
            @RequestHeader(name = "x-request-id", required = false) String xRequestId) {

        log.info("Webhook Mercado Pago recebido. Tipo (URL): {}", type);

        try {
            String eventType = type;
            String action = null;

            if (payload != null) {
                if (eventType == null && payload.containsKey("type")) {
                    eventType = (String) payload.get("type");
                }
                if (payload.containsKey("action")) {
                    action = (String) payload.get("action");
                }
            }

            String idExtraido = null;
            if (payload != null && payload.containsKey("data")) {
                Object dataObj = payload.get("data");
                if (dataObj instanceof Map) {
                    Map<String, Object> dataMap = (Map<String, Object>) dataObj;
                    if (dataMap.containsKey("id")) {
                        idExtraido = String.valueOf(dataMap.get("id"));
                    }
                }
            } else if (dataIdUrl != null) {
                idExtraido = dataIdUrl;
            }

            if (idExtraido != null) {
                final String finalId = idExtraido;

                // ── SEGURANÇA: valida a autenticidade da notificação antes de processar ──
                String idParaAssinatura = (dataIdUrl != null) ? dataIdUrl : finalId;
                if (!assinaturaValida(xSignature, xRequestId, idParaAssinatura)) {
                    log.warn("Webhook MP com assinatura inválida ou ausente. Notificação descartada.");
                    return ResponseEntity.status(401).body("assinatura inválida");
                }

                // ========================================================
                // FLUXO 1: ASSINATURAS (CARTÃO DE CRÉDITO)
                // ========================================================
                if ("subscription_preapproval".equals(eventType)) {
                    PreapprovalClient client = new PreapprovalClient();
                    Preapproval preapproval = client.get(finalId);

                    if (preapproval != null && preapproval.getExternalReference() != null) {
                        String usuarioIdStr = preapproval.getExternalReference();
                        String status = preapproval.getStatus();

                        usuarioRepository.findById(Long.parseLong(usuarioIdStr)).ifPresent(usuario -> {
                            usuario.setAssinaturaMpId(finalId);
                            usuario.setStatusAssinatura(status);

                            if ("authorized".equalsIgnoreCase(status)) {
                                usuario.setPlano("PRO");
                                log.info("Assinatura autorizada para o usuário id={}", usuario.getId());
                            }
                            else if ("cancelled".equalsIgnoreCase(status) || "expired".equalsIgnoreCase(status)) {
                                usuario.setPlano("GRATUITO");
                                log.info("Assinatura cancelada/expirada para o usuário id={}", usuario.getId());
                            }
                            usuarioRepository.save(usuario);
                        });
                    }
                }

                // ========================================================
                // FLUXO 2: PAGAMENTO AVULSO (PIX)
                // ========================================================
                else if ("payment".equals(eventType) || (action != null && action.startsWith("payment"))) {
                    PaymentClient paymentClient = new PaymentClient();
                    Payment payment = paymentClient.get(Long.parseLong(finalId));

                    if (payment != null && payment.getExternalReference() != null) {
                        String usuarioIdStr = payment.getExternalReference();
                        String status = payment.getStatus();

                        usuarioRepository.findById(Long.parseLong(usuarioIdStr)).ifPresent(usuario -> {
                            // Atualiza o status da assinatura no banco para o DTO ler
                            usuario.setStatusAssinatura(status);

                            if ("approved".equalsIgnoreCase(status)) {
                                usuario.setPlano("PRO");
                                log.info("Pagamento PIX aprovado para o usuário id={}", usuario.getId());
                            } else {
                                log.info("Notificação PIX recebida. Status: {}", status);
                            }

                            usuarioRepository.save(usuario);
                        });
                    }
                }
            }

        } catch (Exception e) {
            log.error("Erro no processamento do webhook MP", e);
            // Retornamos 200 mesmo no erro para o MP não ficar tentando reenviar infinitamente se for erro de lógica
        }

        return ResponseEntity.ok("OK");
    }
}