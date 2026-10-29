package br.com.urbanoconnect.api.domain.dto.iptu;

import java.util.List;

/** Envelope simples de paginação para respostas de listagem. */
public record RespostaPagina<T>(
        List<T> conteudo,
        long total,
        int pagina,
        int tamanho,
        int totalPaginas
) {}
