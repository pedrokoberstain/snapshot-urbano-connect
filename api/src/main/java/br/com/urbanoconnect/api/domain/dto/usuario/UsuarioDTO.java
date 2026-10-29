package br.com.urbanoconnect.api.domain.dto.usuario;

import br.com.urbanoconnect.api.domain.model.Usuario;

public record UsuarioDTO(
        Long id,
        String nome,
        String email,
        String telefone,
        String cpf,
        String creci,
        String cidade,
        String uf,
        String plano,
        String statusAssinatura,
        String tipo
) {
    public UsuarioDTO(Usuario usuario) {
        this(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getCpf(),
                usuario.getCreci(),
                usuario.getCidade(),
                usuario.getUf(),
                usuario.getPlano(),
                usuario.getStatusAssinatura(),
                usuario.getTipo() != null ? usuario.getTipo().name() : null
        );
    }
}
