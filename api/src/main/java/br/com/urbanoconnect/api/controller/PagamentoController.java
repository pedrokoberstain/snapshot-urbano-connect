package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.model.Usuario;
import br.com.urbanoconnect.api.domain.service.PagamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/pagamentos")
public class PagamentoController {

    @Autowired
    private PagamentoService pagamentoService;

    // =========================================================
    // 1. ROTA DE ASSINATURA (CARTÃO DE CRÉDITO)
    // Front-end recebe uma "url" e redireciona o usuário
    // =========================================================
    @PostMapping("/assinar")
    public ResponseEntity<Map<String, String>> iniciarAssinatura(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody Map<String, String> payload // Captura o JSON { "plano": "MENSAL" }
    ) {
        String tipoPlano = payload.get("plano");
        String urlPagamento = pagamentoService.criarAssinatura(usuario, tipoPlano);
        return ResponseEntity.ok(Map.of("url", urlPagamento));
    }

    // =========================================================
    // 2. ROTA DE PAGAMENTO AVULSO (PIX)
    // Front-end recebe o QR Code e o Copia-e-Cola para exibir na tela
    // =========================================================
    @PostMapping("/pix")
    public ResponseEntity<Map<String, String>> gerarPix(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody Map<String, String> payload // Captura o JSON { "plano": "MENSAL" ou "ANUAL" }
    ) {
        String tipoPlano = payload.get("plano");

        // Chama o service que criamos e devolve o Map com os dados do PIX
        Map<String, String> dadosPix = pagamentoService.criarPagamentoPix(usuario, tipoPlano);

        // Retorna HTTP 200 OK com o JSON contendo: qr_code_base64, qr_code_copia_e_cola e payment_id
        return ResponseEntity.ok(dadosPix);
    }
}