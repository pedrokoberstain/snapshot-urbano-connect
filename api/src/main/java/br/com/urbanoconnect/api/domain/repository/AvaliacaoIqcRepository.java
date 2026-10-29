package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.AvaliacaoIqc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AvaliacaoIqcRepository extends JpaRepository<AvaliacaoIqc, Long> {

    /** Avaliações criadas por um avaliador específico (mais recentes primeiro). */
    List<AvaliacaoIqc> findByAvaliadorIdOrderByDataCriacaoDesc(Long avaliadorId);

    /** Ranking geral por score final (concluídas primeiro, maior score no topo). */
    List<AvaliacaoIqc> findByStatusOrderByScoreFinalDesc(br.com.urbanoconnect.api.domain.model.StatusAvaliacaoIqc status);
}
