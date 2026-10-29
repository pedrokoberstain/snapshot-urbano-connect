package br.com.urbanoconnect.api.domain.dto.imovel;

import br.com.urbanoconnect.api.domain.model.TipoImovel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DadosCadastroImovel(

        @NotBlank(message = "O título é obrigatório")
        String titulo,

        @NotBlank(message = "A cidade é obrigatória")
        String cidade,

        String bairro,

        // ── Endereço ────────────────────────────────────────
        // Preenchidos a partir do CEP (ViaCEP) e editáveis: em cidade pequena
        // o CEP genérico às vezes traz a rua errada.
        String cep,
        String logradouro,
        String numero,
        String complemento,

        @NotNull(message = "O tipo do imóvel é obrigatório")
        TipoImovel tipo,

        @NotNull(message = "O preço é obrigatório")
        BigDecimal preco,

        @NotNull(message = "A área total é obrigatória")
        Double areaTotal,

        /** Área construída (m²). Opcional — alimenta a estimativa de valor venal. */
        Double areaConstruida,

        // ── Campos urbanos básicos ──────────────────────────
        Integer quartos,
        Integer banheiros,
        Integer vagasGaragem,

        // ── Motor hedônico ──────────────────────────────────
        String inscricao,
        BigDecimal valorVenal,
        Double distanciaCentro,
        Double precoM2Bairro,

        Map<String, Object> detalhes,
        String imagemPrincipal,
        List<String> galeria,
        String descricao
) {}