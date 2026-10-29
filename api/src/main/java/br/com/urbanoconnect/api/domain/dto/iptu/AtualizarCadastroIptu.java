package br.com.urbanoconnect.api.domain.dto.iptu;

import java.math.BigDecimal;

/** Atualização manual dos valores de venal e/ou IPTU de um registro do cadastro. */
public record AtualizarCadastroIptu(
        BigDecimal valorVenal,
        BigDecimal imposto
) {}
