package br.com.urbanoconnect.api.domain.model;

/**
 * Estado do ciclo de vida de uma avaliação IQC.
 *
 *  RASCUNHO  — respostas em preenchimento, ainda sem score calculado.
 *  CONCLUIDA — score e tier calculados e persistidos.
 */
public enum StatusAvaliacaoIqc {
    RASCUNHO,
    CONCLUIDA
}
