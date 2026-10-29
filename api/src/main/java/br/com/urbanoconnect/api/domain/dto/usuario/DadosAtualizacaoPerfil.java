package br.com.urbanoconnect.api.domain.dto.usuario;

import jakarta.validation.constraints.NotBlank;

public record DadosAtualizacaoPerfil(
        @NotBlank(message = "O nome não pode ficar em branco.")
        String nome,

        String telefone,
        String creci,
        String cidade,
        String uf
) {
}
