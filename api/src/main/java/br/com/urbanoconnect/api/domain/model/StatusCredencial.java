package br.com.urbanoconnect.api.domain.model;

/**
 * Ciclo de vida da credencial profissional.
 *
 * PENDENTE  — aguardando conferência do registro no conselho.
 * APROVADA  — verificada. Habilita assumir partes daquela especialidade.
 * RECUSADA  — a conferência não confirmou o registro.
 * REVOGADA  — era válida e deixou de ser: registro suspenso, anuidade em
 *             atraso, desligamento. Distinto de RECUSADA de propósito — um diz
 *             que nunca valeu, o outro que parou de valer, e a diferença
 *             importa para os laudos que a pessoa já assinou.
 */
public enum StatusCredencial {
    PENDENTE,
    APROVADA,
    RECUSADA,
    REVOGADA
}
