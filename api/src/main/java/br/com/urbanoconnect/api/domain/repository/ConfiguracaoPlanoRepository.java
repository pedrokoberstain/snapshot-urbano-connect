package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.ConfiguracaoPlano;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ConfiguracaoPlanoRepository extends JpaRepository<ConfiguracaoPlano, Long> {
    Optional<ConfiguracaoPlano> findByTipo(String tipo);
}
