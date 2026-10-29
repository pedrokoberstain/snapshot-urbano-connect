package br.com.urbanoconnect.api.domain.dto.usuario;

import jakarta.validation.constraints.NotBlank;

/**
 * LGPD: confirmação de senha exigida para a exclusão (anonimização) da conta.
 */
public record DadosExclusaoConta(
        @NotBlank(message = "Informe a senha para confirmar a exclusão da conta.")
        String senha
) {}
