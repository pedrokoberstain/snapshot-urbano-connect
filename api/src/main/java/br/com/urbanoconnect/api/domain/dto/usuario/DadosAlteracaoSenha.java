package br.com.urbanoconnect.api.domain.dto.usuario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DadosAlteracaoSenha(
        @NotBlank
        String senhaAtual,
        @NotBlank
        @Size(min = 8, max = 72, message = "A senha deve ter no mínimo 8 caracteres.")
        @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).*$", message = "A senha deve conter pelo menos uma letra e um número.")
        String novaSenha
) {}
