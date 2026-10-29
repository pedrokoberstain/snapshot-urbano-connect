package br.com.urbanoconnect.api.domain.model;

/**
 * Separa o que é notícia do que é artigo.
 *
 * As duas coisas viviam misturadas no mesmo feed cronológico, e são naturezas
 * diferentes: a notícia é datada e perde valor ("Justiça cobra aeroporto de
 * Juína"); o artigo é de referência e não expira ("Preço da Terra em MT", os
 * perfis de cidade, as séries temáticas). Notícia se lê por data, artigo se
 * procura por assunto — por isso cada um tem a sua área no portal.
 */
public enum TipoConteudo {
    NOTICIA,
    ARTIGO
}
