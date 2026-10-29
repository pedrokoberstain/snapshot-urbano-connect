package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.EspecialidadeTecnica;
import br.com.urbanoconnect.api.domain.model.ParteAvaliacaoIqc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ParteAvaliacaoIqcRepository extends JpaRepository<ParteAvaliacaoIqc, Long> {

    /** As três partes de uma avaliação, com o responsável carregado para exibição. */
    @Query("""
            SELECT p FROM ParteAvaliacaoIqc p
             LEFT JOIN FETCH p.responsavel
             WHERE p.avaliacao.id = :avaliacaoId
             ORDER BY p.especialidade
            """)
    List<ParteAvaliacaoIqc> listarDaAvaliacao(@Param("avaliacaoId") Long avaliacaoId);

    Optional<ParteAvaliacaoIqc> findByAvaliacaoIdAndEspecialidade(
            Long avaliacaoId, EspecialidadeTecnica especialidade);

    /** A parte que este usuário responde nesta avaliação, se houver. */
    Optional<ParteAvaliacaoIqc> findByAvaliacaoIdAndResponsavelId(Long avaliacaoId, Long responsavelId);

    /** Avaliações em que o usuário tem parte atribuída — a fila de trabalho dele. */
    @Query("""
            SELECT p FROM ParteAvaliacaoIqc p
             JOIN FETCH p.avaliacao a
             LEFT JOIN FETCH a.condominio
             WHERE p.responsavel.id = :usuarioId
             ORDER BY p.dataAtualizacao DESC
            """)
    List<ParteAvaliacaoIqc> listarDoResponsavel(@Param("usuarioId") Long usuarioId);

    boolean existsByAvaliacaoIdAndResponsavelId(Long avaliacaoId, Long responsavelId);

    /** Responde por alguma parte em qualquer laudo — libera a entrada na área do IQC. */
    boolean existsByResponsavelId(Long responsavelId);
}
