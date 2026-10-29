package br.com.urbanoconnect.api.domain.model;

/**
 * Relação do morador com a unidade.
 *
 * Não é burocracia: o proprietário tem interesse financeiro em nota alta,
 * porque ela valoriza o imóvel dele; o inquilino não tem. Sem registrar isso,
 * o viés fica invisível dentro da média. Com ele, o laudo mostra as duas
 * médias lado a lado e a divergência vira informação.
 */
public enum VinculoMorador {
    PROPRIETARIO,
    INQUILINO
}
