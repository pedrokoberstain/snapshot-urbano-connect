package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.AcessoCondominio;
import br.com.urbanoconnect.api.domain.model.PapelAcessoCondominio;
import br.com.urbanoconnect.api.domain.model.StatusAcessoCondominio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AcessoCondominioRepository extends JpaRepository<AcessoCondominio, Long> {

    /** O par (condomínio, usuário) é único — daí o Optional em vez de List. */
    Optional<AcessoCondominio> findByCondominioIdAndUsuarioId(Long condominioId, Long usuarioId);

    boolean existsByCondominioIdAndUsuarioIdAndPapelAndStatus(
            Long condominioId, Long usuarioId,
            PapelAcessoCondominio papel, StatusAcessoCondominio status);

    /** Tem acesso de avaliador em ao menos um condomínio — libera a entrada na área do IQC. */
    boolean existsByUsuarioIdAndPapelAndStatus(
            Long usuarioId, PapelAcessoCondominio papel, StatusAcessoCondominio status);

    /** Fila de análise e histórico de um condomínio. Pendentes primeiro. */
    @Query("""
            SELECT a FROM AcessoCondominio a
             JOIN FETCH a.usuario
             LEFT JOIN FETCH a.analisadoPor
             WHERE a.condominio.id = :condominioId
               AND (:papel IS NULL OR a.papel = :papel)
             ORDER BY CASE WHEN a.status = br.com.urbanoconnect.api.domain.model.StatusAcessoCondominio.PENDENTE
                           THEN 0 ELSE 1 END,
                      a.dataSolicitacao DESC
            """)
    List<AcessoCondominio> listarDoCondominio(@Param("condominioId") Long condominioId,
                                              @Param("papel") PapelAcessoCondominio papel);

    /** Os vínculos do próprio usuário, para ele acompanhar o que pediu. */
    @Query("""
            SELECT a FROM AcessoCondominio a
             JOIN FETCH a.condominio
             WHERE a.usuario.id = :usuarioId
             ORDER BY a.dataSolicitacao DESC
            """)
    List<AcessoCondominio> listarDoUsuario(@Param("usuarioId") Long usuarioId);

    /** Moradores aprovados — base do componente de opinião no score. */
    List<AcessoCondominio> findByCondominioIdAndPapelAndStatus(
            Long condominioId, PapelAcessoCondominio papel, StatusAcessoCondominio status);

    /**
     * Comprovantes que sobreviveram à análise. Alimenta a faxina periódica:
     * o arquivo deveria ser apagado na hora, e o que escapar (falha de disco,
     * queda no meio da transação) não pode ficar guardado indefinidamente.
     */
    @Query("""
            SELECT a FROM AcessoCondominio a
             WHERE a.comprovanteArquivo IS NOT NULL
               AND a.status <> br.com.urbanoconnect.api.domain.model.StatusAcessoCondominio.PENDENTE
            """)
    List<AcessoCondominio> comprovantesPendentesDeExclusao();
}
