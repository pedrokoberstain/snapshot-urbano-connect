package br.com.urbanoconnect.api.domain.model;

/**
 * Faixas de classificação (tiers) do IQC, a partir do score final de 0 a 100.
 * Fonte: metodologia consolidada v1.0 (documento urbanoconnect_001).
 */
public enum TierIqc {

    BASICO      ( 0, 24, "Básico"),
    MEDIO       (25, 39, "Médio"),
    MEDIO_ALTO  (40, 54, "Médio-Alto"),
    ALTO_PADRAO (55, 69, "Alto Padrão"),
    LUXO        (70, 84, "Luxo"),
    ULTRA_LUXO  (85, 100, "Ultra Luxo");

    private final int min;
    private final int max;
    private final String rotulo;

    TierIqc(int min, int max, String rotulo) {
        this.min = min;
        this.max = max;
        this.rotulo = rotulo;
    }

    /** Classifica um score (0 a 100) na faixa correspondente. */
    public static TierIqc deScore(double score) {
        if (score >= ULTRA_LUXO.min)  return ULTRA_LUXO;
        if (score >= LUXO.min)        return LUXO;
        if (score >= ALTO_PADRAO.min) return ALTO_PADRAO;
        if (score >= MEDIO_ALTO.min)  return MEDIO_ALTO;
        if (score >= MEDIO.min)       return MEDIO;
        return BASICO;
    }

    public int getMin()       { return min; }
    public int getMax()       { return max; }
    public String getRotulo() { return rotulo; }
}
