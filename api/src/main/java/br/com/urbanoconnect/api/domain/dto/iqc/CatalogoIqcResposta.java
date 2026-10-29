package br.com.urbanoconnect.api.domain.dto.iqc;

import java.util.List;

/**
 * Estrutura do catálogo IQC exposta ao front (GET /iqc/catalogo) para montar
 * o formulário dinamicamente — evita manter um segundo catálogo na mão.
 */
public record CatalogoIqcResposta(List<DimensaoCatalogo> dimensoes) {

    public record DimensaoCatalogo(
            String id,
            String nome,
            int peso,            // % (0..100)
            String responsavel,  // Engenheiro | Arquiteto | Analista
            List<VariavelCatalogo> variaveis
    ) {}

    public record VariavelCatalogo(
            String chave,
            String label,
            String tipo,             // BINARIA | ORDINAL | CONTINUA | CATEGORICA
            String unidade,          // contínua
            Integer niveis,          // ordinal
            List<String> categorias  // categórica (ordenada pior → melhor)
    ) {}
}
