package br.com.urbanoconnect.api.domain.dto.iptu;

/** Resumo de uma reimportação de planilha do cadastro IPTU. */
public record ResultadoImportacao(
        int lidos,
        int atualizados,
        int criados,
        int ignorados,
        String mensagem
) {}
