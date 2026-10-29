package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.CotacaoAgro;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CotacaoAgroRepository extends JpaRepository<CotacaoAgro, Long> {
    Optional<CotacaoAgro> findByProduto(String produto);
}