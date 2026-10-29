package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.ImovelRuralDados;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ImovelRuralDadosRepository extends JpaRepository<ImovelRuralDados, Long> {
    Optional<ImovelRuralDados> findByImovelId(Long imovelId);
}