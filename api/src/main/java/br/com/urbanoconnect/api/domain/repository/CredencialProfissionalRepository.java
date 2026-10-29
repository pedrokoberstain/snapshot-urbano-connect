package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.CredencialProfissional;
import br.com.urbanoconnect.api.domain.model.EspecialidadeTecnica;
import br.com.urbanoconnect.api.domain.model.StatusCredencial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CredencialProfissionalRepository extends JpaRepository<CredencialProfissional, Long> {

    Optional<CredencialProfissional> findByUsuarioIdAndProfissao(
            Long usuarioId, EspecialidadeTecnica profissao);

    /** Tem alguma credencial aprovada — pertence à área do IQC mesmo sem designação ainda. */
    boolean existsByUsuarioIdAndStatus(Long usuarioId, StatusCredencial status);

    @Query("""
            SELECT c FROM CredencialProfissional c
             JOIN FETCH c.usuario
             WHERE c.usuario.id = :usuarioId
             ORDER BY c.profissao
            """)
    List<CredencialProfissional> listarDoUsuario(@Param("usuarioId") Long usuarioId);

    /** Fila de análise: pendentes primeiro, depois o histórico. */
    @Query("""
            SELECT c FROM CredencialProfissional c
             JOIN FETCH c.usuario
             LEFT JOIN FETCH c.analisadoPor
             WHERE (:status IS NULL OR c.status = :status)
             ORDER BY CASE WHEN c.status = br.com.urbanoconnect.api.domain.model.StatusCredencial.PENDENTE
                           THEN 0 ELSE 1 END,
                      c.dataSolicitacao DESC
            """)
    List<CredencialProfissional> listarParaAnalise(@Param("status") StatusCredencial status);

    /**
     * Documentos que sobreviveram à análise. Mesma rede de segurança do
     * comprovante de residência: o arquivo deveria sumir na hora, e o que
     * escapar não pode ficar guardado indefinidamente.
     */
    @Query("""
            SELECT c FROM CredencialProfissional c
             WHERE c.documentoArquivo IS NOT NULL
               AND c.status <> br.com.urbanoconnect.api.domain.model.StatusCredencial.PENDENTE
            """)
    List<CredencialProfissional> documentosPendentesDeExclusao();
}
