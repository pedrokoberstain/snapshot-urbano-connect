package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.AssinanteNewsletter;
import br.com.urbanoconnect.api.domain.model.StatusAssinante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssinanteNewsletterRepository extends JpaRepository<AssinanteNewsletter, Long> {

    boolean existsByEmail(String email);

    Optional<AssinanteNewsletter> findByEmail(String email);

    Optional<AssinanteNewsletter> findByTokenCancelamento(String token);

    List<AssinanteNewsletter> findByStatusOrderByDataCadastroDesc(StatusAssinante status);

    long countByStatus(StatusAssinante status);
}
