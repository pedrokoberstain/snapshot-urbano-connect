package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.EnderecoConhecido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EnderecoConhecidoRepository extends JpaRepository<EnderecoConhecido, Long> {

    /** Lookup pelo endereço normalizado. */
    Optional<EnderecoConhecido> findByCidadeAndLogradouroNormAndNumeroNorm(
            String cidade, String logradouroNorm, String numeroNorm);
}
