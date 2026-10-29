package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.ConfiguracaoPlano;
import br.com.urbanoconnect.api.domain.model.Usuario;
import br.com.urbanoconnect.api.domain.repository.ConfiguracaoPlanoRepository;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
import com.mercadopago.client.preapproval.PreApprovalAutoRecurringCreateRequest;
import com.mercadopago.client.preapproval.PreapprovalClient;
import com.mercadopago.client.preapproval.PreapprovalCreateRequest;
import com.mercadopago.core.MPRequestOptions;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preapproval.Preapproval;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class PagamentoService {

    @Value("${FRONTEND_URL:http://localhost:3000}")
    private String frontendUrl;

    @Value("${mercado.pago.token}")
    private String mercadoPagoToken;

    @Autowired
    private ConfiguracaoPlanoRepository configuracaoPlanoRepository;

    @PostConstruct
    public void initMercadoPago() {
        // 1. A MÁGICA: O .trim() remove espaços vazios ou quebras de linha invisíveis
        if (this.mercadoPagoToken != null) {
            this.mercadoPagoToken = this.mercadoPagoToken.trim();
        }

        MercadoPagoConfig.setAccessToken(this.mercadoPagoToken);

        if (this.mercadoPagoToken != null && this.mercadoPagoToken.length() > 12) {
            // Imprime um pedaço do token para você ter certeza visual que ele está limpo
            System.out.println("✅ M.P. Token limpo e carregado: " + this.mercadoPagoToken.substring(0, 12) + "...");
        } else {
            System.out.println("❌ ATENÇÃO: Token do Mercado Pago VAZIO ou INVÁLIDO!");
        }
    }

    // =========================================================
    // 1. ASSINATURA RECORRENTE (CARTÃO DE CRÉDITO)
    // =========================================================
    public String criarAssinatura(Usuario usuario, String tipoPlano) {
        try {
            PreapprovalClient client = new PreapprovalClient();
            boolean isAnual = tipoPlano.equalsIgnoreCase("ANUAL");
            BigDecimal valor = configuracaoPlanoRepository.findByTipo(isAnual ? "ANUAL" : "MENSAL")
                    .map(ConfiguracaoPlano::getValor)
                    .orElse(isAnual ? new BigDecimal("299.00") : new BigDecimal("29.90"));
            int frequencia = isAnual ? 12 : 1;

            PreapprovalCreateRequest request = PreapprovalCreateRequest.builder()
                    .externalReference(usuario.getId().toString())
                    .payerEmail(usuario.getEmail())
                    .reason("Urbano Connect PRO - " + tipoPlano)
                    .autoRecurring(
                            PreApprovalAutoRecurringCreateRequest.builder()
                                    .frequency(frequencia)
                                    .frequencyType("months")
                                    .transactionAmount(valor)
                                    .currencyId("BRL")
                                    .build()
                    )
                    .backUrl(frontendUrl + "/pagamentos/sucesso")
                    .status("pending")
                    .build();

            // 2. BLINDAGEM: Forçamos o envio do token diretamente na requisição (thread-safe)
            MPRequestOptions options = MPRequestOptions.builder()
                    .accessToken(this.mercadoPagoToken)
                    .build();

            Preapproval preapproval = client.create(request, options);
            return preapproval.getInitPoint();

        } catch (MPApiException e) {
            System.err.println("Erro da API do MP (Assinatura): " + e.getApiResponse().getContent());
            throw new RuntimeException("Erro na API do MP");
        } catch (Exception e) {
            throw new RuntimeException("Erro interno");
        }
    }

    // =========================================================
    // 2. PAGAMENTO ÚNICO (PIX)
    // =========================================================
    public Map<String, String> criarPagamentoPix(Usuario usuario, String tipoPlano) {
        try {
            PaymentClient client = new PaymentClient();
            boolean isAnual = tipoPlano.equalsIgnoreCase("ANUAL");
            BigDecimal valor = configuracaoPlanoRepository.findByTipo(isAnual ? "ANUAL" : "MENSAL")
                    .map(ConfiguracaoPlano::getValor)
                    .orElse(isAnual ? new BigDecimal("299.00") : new BigDecimal("29.90"));

            PaymentCreateRequest request = PaymentCreateRequest.builder()
                    .transactionAmount(valor)
                    .description("Urbano Connect PRO - " + tipoPlano + " (PIX)")
                    .paymentMethodId("pix")
                    .payer(PaymentPayerRequest.builder()
                            .email(usuario.getEmail())
                            .build())
                    .externalReference(usuario.getId().toString())
                    .build();

            // 2. BLINDAGEM: Forçamos o envio do token diretamente na requisição (thread-safe)
            MPRequestOptions options = MPRequestOptions.builder()
                    .accessToken(this.mercadoPagoToken)
                    .build();

            Payment payment = client.create(request, options);

            Map<String, String> respostaPix = new HashMap<>();
            if (payment.getPointOfInteraction() != null && payment.getPointOfInteraction().getTransactionData() != null) {
                respostaPix.put("qr_code_base64", payment.getPointOfInteraction().getTransactionData().getQrCodeBase64());
                respostaPix.put("qr_code_copia_e_cola", payment.getPointOfInteraction().getTransactionData().getQrCode());
            }
            respostaPix.put("payment_id", payment.getId().toString());

            return respostaPix;

        } catch (MPApiException e) {
            System.err.println("Erro da API do MP (PIX): " + e.getApiResponse().getContent());
            throw new RuntimeException("Erro ao gerar PIX");
        } catch (Exception e) {
            throw new RuntimeException("Erro interno ao gerar PIX", e);
        }
    }
}