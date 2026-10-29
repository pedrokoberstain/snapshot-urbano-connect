package br.com.urbanoconnect.api.domain.model;

/**
 * Natureza de uma variável do IQC, que define como ela é normalizada para a
 * escala comum de 0 a 100 (metodologia: min-max, Likert, binária).
 */
public enum TipoVariavelIqc {
    /** Presença/ausência → 100 ou 0. */
    BINARIA,
    /** Escala ordinal (0..n) → Likert normalizado. */
    ORDINAL,
    /** Quantitativa contínua → Min-Max Scaling (pode ser invertida). */
    CONTINUA,
    /** Categórica ordenada (pior → melhor) → índice na lista normalizado. */
    CATEGORICA
}
