package br.com.urbanoconnect.api.domain.dto.usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record DadosEsqueciSenha(
        @NotBlank @Email String email
) {}