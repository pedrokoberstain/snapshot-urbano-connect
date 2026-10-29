package br.com.urbanoconnect.api.dto.lead;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DadosCadastroLead(
        @NotBlank String nome,
        @NotBlank @Email String email,
        @NotBlank String telefone,
        @NotBlank String mensagem,
        @NotNull Long imovelId // Recebemos apenas o ID do imóvel
) {}