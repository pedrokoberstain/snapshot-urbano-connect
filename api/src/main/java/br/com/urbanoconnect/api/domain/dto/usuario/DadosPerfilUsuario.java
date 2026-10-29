package br.com.urbanoconnect.api.domain.dto.usuario;

import br.com.urbanoconnect.api.domain.model.Usuario;

public record DadosPerfilUsuario(
        Long id,
        String nome,
        String email,
        String cpf,
        String telefone
) {
    // Construtor
    public DadosPerfilUsuario(Usuario usuario) {
        this(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getCpf(),
                usuario.getTelefone()
        );
    }
}