package br.com.urbanoconnect.api.domain.model;

/**
 * Em que condição o usuário está ligado ao condomínio.
 *
 * AVALIADOR — pode rodar a calculadora IQC naquele condomínio. Concedido por
 * ADMIN ou por quem cadastrou o condomínio, sem comprovante.
 *
 * MORADOR — pode registrar sua opinião (os 10% do score). Exige comprovante de
 * residência analisado, porque a opinião influencia o laudo.
 */
public enum PapelAcessoCondominio {
    AVALIADOR,
    MORADOR
}
