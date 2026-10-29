package br.com.urbanoconnect.api.domain.dto.iptu;

/**
 * Estatísticas agregadas de um bairro no cadastro municipal (IPTU + BCI).
 * Usado no cadastro do anúncio quando o corretor informa um endereço que
 * não bateu com nenhum imóvel específico — mostra o perfil médio do bairro
 * para ajudar a validar preço, infraestrutura e padrão construtivo.
 *
 * <p>Os percentuais são calculados sobre os imóveis do bairro que têm dado
 * BCI preenchido (nem todos têm — depende do que a prefeitura registrou).
 * {@code totalComBci} indica quantos imóveis entraram no cálculo.</p>
 */
public record PerfilBairro(
        String cidade,
        String bairro,
        int totalImoveis,
        int totalComBci,

        // ── Médias (podem ser null se não houver dado) ──
        Double valorVenalMedio,
        Double areaTerrenoMedio,
        Double areaConstruidaMedio,

        // ── Percentuais 0-100 (podem ser null se totalComBci == 0) ──
        Integer percentualComAgua,
        Integer percentualComEsgoto,
        Integer percentualComCalcamento,
        Integer percentualComColetaLixo,
        Integer percentualComIluminacaoPublica,
        Integer percentualComGaleriaPluvial,
        Integer percentualComRedeTelefonica,
        Integer percentualComPiscina
) {}
