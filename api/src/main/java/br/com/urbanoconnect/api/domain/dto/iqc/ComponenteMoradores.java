package br.com.urbanoconnect.api.domain.dto.iqc;

import br.com.urbanoconnect.api.domain.model.DimensaoIqc;

import java.util.Map;

/**
 * Resultado do bloco de moradores dentro do IQC.
 *
 * {@code aplicado} é o campo que o laudo precisa mostrar: quando falso, o
 * score final é 100% técnico porque não houve opiniões suficientes — e isso
 * tem de ficar visível, não escondido atrás de um número que parece completo.
 *
 * {@code mediaProprietarios} e {@code mediaInquilinos} existem para expor o
 * viés: quem é dono ganha com nota alta, quem aluga não. A divergência entre
 * as duas médias é informação sobre a amostra, não ruído a ser eliminado.
 */
public record ComponenteMoradores(

        /** Nota do morador por dimensão (0–100). Dimensão sem resposta herda a técnica. */
        Map<DimensaoIqc, Double> scoresPorDimensao,

        /** Soma ponderada pelos mesmos pesos das 8 dimensões (0–100). */
        Double scoreMoradores,

        /** Opiniões que pontuaram: vínculo aprovado e ao menos 6 meses de moradia. */
        int opinioesConsideradas,

        /** Opiniões registradas no total, inclusive as que não pontuaram. */
        int opinioesRegistradas,

        /** Falso quando faltou quórum — nesse caso o final volta a ser só o técnico. */
        boolean aplicado,

        Double mediaProprietarios,
        Double mediaInquilinos
) {

    /** Nenhuma opinião computável: o componente não entra e o laudo diz por quê. */
    public static ComponenteMoradores naoAplicado(Map<DimensaoIqc, Double> tecnicos,
                                                  int registradas, int consideradas) {
        return new ComponenteMoradores(tecnicos, null, consideradas, registradas, false, null, null);
    }
}
