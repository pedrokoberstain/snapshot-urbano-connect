package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.TipoUsuario;
import br.com.urbanoconnect.api.domain.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    UserDetails findByEmail(String email);

    long countByTipo(TipoUsuario tipo);

}