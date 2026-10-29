package br.com.urbanoconnect.api.domain.dto.iqc;

import br.com.urbanoconnect.api.domain.model.DimensaoIqc;
import br.com.urbanoconnect.api.domain.model.TierIqc;

import java.util.Map;

/**
 * Resultado puro do motor de cálculo do IQC: score por dimensão (0..100),
 * score final ponderado (0..100) e o tier classificado.
 */
public record ResultadoCalculoIqc(
        Map<DimensaoIqc, Double> scoresPorDimensao,
        double scoreFinal,
        TierIqc tier
) {}
