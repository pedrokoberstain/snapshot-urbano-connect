package br.com.urbanoconnect.api.domain.model;

/**
 * Ciclo de vida do acesso. O AVALIADOR já nasce APROVADO (é concessão direta);
 * o MORADOR nasce PENDENTE e espera a análise do comprovante.
 *
 * RECUSADO e REVOGADO são estados distintos de propósito: o primeiro diz que a
 * prova de residência não convenceu, o segundo que um acesso legítimo foi
 * retirado depois — por exemplo, morador que se mudou.
 */
public enum StatusAcessoCondominio {
    PENDENTE,
    APROVADO,
    RECUSADO,
    REVOGADO
}
