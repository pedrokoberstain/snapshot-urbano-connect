package br.com.urbanoconnect.api.domain.dto.usuario;

import br.com.urbanoconnect.api.domain.model.TipoUsuario;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DadosCadastroUsuario(
        @NotBlank @Pattern(regexp = "^[a-zA-ZÀ-ÿ\\s]+$", message = "O nome deve conter apenas letras e espaços.")
        String nome,
        @NotBlank @Email
        String email,
        @NotBlank
        @Size(min = 8, max = 72, message = "A senha deve ter no mínimo 8 caracteres.")
        @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).*$", message = "A senha deve conter pelo menos uma letra e um número.")
        String senha,
        @NotBlank
        String cpf,
        String dataNascimento,
        String telefone,
        @NotNull TipoUsuario tipo,

        String cep,
        String rua,
        String bairro,
        String cidade,
        String uf,
        String numero,
        String complemento,
        String creci,

        // ── LGPD: aceite obrigatório dos Termos de Uso e Política de Privacidade ──
        @AssertTrue(message = "É necessário aceitar os Termos de Uso e a Política de Privacidade.")
        Boolean aceitouTermos
) {}
