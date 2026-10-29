package br.com.urbanoconnect.api.domain.model;

/**
 * ESCALA     — nota de 0 a 10, sempre no mesmo sentido (0 péssimo, 10 ótimo).
 * FREQUENCIA — quantas vezes algo aconteceu, em faixas.
 *
 * A frequência existe porque fato resiste melhor à distorção do que impressão,
 * e aqui quem responde tem interesse no resultado: o proprietário ganha com
 * nota alta. "Houve furto no último ano?" é mais difícil de inflar do que
 * "avalie a segurança".
 */
public enum TipoPerguntaMorador {
    ESCALA,
    FREQUENCIA
}
