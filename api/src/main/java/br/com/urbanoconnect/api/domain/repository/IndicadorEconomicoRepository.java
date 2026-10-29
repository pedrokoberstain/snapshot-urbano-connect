package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.IndicadorEconomico;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface IndicadorEconomicoRepository extends JpaRepository<IndicadorEconomico, Long> {
    Optional<IndicadorEconomico> findBySimbolo(String simbolo);
}
