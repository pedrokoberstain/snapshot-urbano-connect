package br.com.urbanoconnect.api.domain.dto.iqc;

import java.util.List;

/**
 * Estrutura do questionário do morador para o front montar as telas.
 *
 * As telas são agrupadas por tema que o morador reconhece ("Dinheiro e
 * administração"), e não pelo nome da dimensão técnica. O campo
 * {@code dimensao} vai junto porque o laudo precisa dele para cruzar percepção
 * com vistoria — mas não é para aparecer na tela de quem responde.
 */
public record CatalogoOpiniaoResposta(
        List<Tela> telas,
        int minimoDeOpinioes,
        int mesesMinimosDeMoradia,
        int pesoPercentual
) {

    public record Tela(String titulo, List<Pergunta> perguntas) {}

    public record Pergunta(
            String chave,
            String enunciado,
            String tipo,
            String ancoraZero,
            String ancoraDez,
            List<String> opcoes,
            boolean permiteNaoSeAplica,
            String dimensao
    ) {}
}
