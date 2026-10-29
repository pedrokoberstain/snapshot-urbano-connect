package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.TokenRecuperacaoSenha;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TokenRecuperacaoSenhaRepository extends JpaRepository<TokenRecuperacaoSenha, Long> {
    Optional<TokenRecuperacaoSenha> findByToken(String token);
}