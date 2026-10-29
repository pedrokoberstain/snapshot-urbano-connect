package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.Condominio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * As consultas de leitura trazem {@code criadoPor} por fetch join: o DTO expõe
 * o nome de quem cadastrou, e sem o join isso vira uma query por condomínio
 * (N+1) — ou uma LazyInitializationException se o open-in-view for desligado.
 */
public interface CondominioRepository extends JpaRepository<Condominio, Long> {

    Optional<Condominio> findByCnpj(String cnpj);

    @Query("SELECT c FROM Condominio c LEFT JOIN FETCH c.criadoPor WHERE c.id = :id")
    Optional<Condominio> buscarPorId(@Param("id") Long id);

    /** Todos os ativos, filtrados por nome/bairro/cidade quando {@code termo} vier preenchido. */
    @Query("""
            SELECT c FROM Condominio c
             LEFT JOIN FETCH c.criadoPor
             WHERE c.ativo = true
               AND (:termo IS NULL OR :termo = ''
                    OR LOWER(c.nome)   LIKE LOWER(CONCAT('%', :termo, '%'))
                    OR LOWER(c.bairro) LIKE LOWER(CONCAT('%', :termo, '%'))
                    OR LOWER(c.cidade) LIKE LOWER(CONCAT('%', :termo, '%')))
             ORDER BY c.nome ASC
            """)
    List<Condominio> buscarTodos(@Param("termo") String termo);

    /**
     * Mesma busca, restrita ao que o usuário alcança: o que ele cadastrou mais
     * aqueles em que recebeu acesso de AVALIADOR aprovado.
     */
    @Query("""
            SELECT DISTINCT c FROM Condominio c
             LEFT JOIN FETCH c.criadoPor
             WHERE c.ativo = true
               AND (c.criadoPor.id = :usuarioId
                    OR EXISTS (SELECT 1 FROM AcessoCondominio a
                                WHERE a.condominio = c
                                  AND a.usuario.id = :usuarioId
                                  AND a.papel  = br.com.urbanoconnect.api.domain.model.PapelAcessoCondominio.AVALIADOR
                                  AND a.status = br.com.urbanoconnect.api.domain.model.StatusAcessoCondominio.APROVADO))
               AND (:termo IS NULL OR :termo = ''
                    OR LOWER(c.nome)   LIKE LOWER(CONCAT('%', :termo, '%'))
                    OR LOWER(c.bairro) LIKE LOWER(CONCAT('%', :termo, '%'))
                    OR LOWER(c.cidade) LIKE LOWER(CONCAT('%', :termo, '%')))
             ORDER BY c.nome ASC
            """)
    List<Condominio> buscarAcessiveis(@Param("usuarioId") Long usuarioId, @Param("termo") String termo);
}
