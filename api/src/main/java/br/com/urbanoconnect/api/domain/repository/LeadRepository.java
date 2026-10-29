package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    // Busca leads onde o corretor do imóvel de interesse é o ID X
    List<Lead> findByImovelInteresseCorretorId(Long corretorId);
}