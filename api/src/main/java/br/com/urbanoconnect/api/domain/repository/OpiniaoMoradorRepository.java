package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.OpiniaoMorador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OpiniaoMoradorRepository extends JpaRepository<OpiniaoMorador, Long> {

    Optional<OpiniaoMorador> findByCondominioIdAndUsuarioId(Long condominioId, Long usuarioId);

    /**
     * Todas as opiniões de um condomínio, com o usuário carregado — o cálculo
     * precisa cruzar cada opinião com o vínculo (tempo de moradia e se é
     * proprietário ou inquilino) para decidir se ela pontua.
     */
    @Query("""
            SELECT o FROM OpiniaoMorador o
             JOIN FETCH o.usuario
             WHERE o.condominio.id = :condominioId
             ORDER BY o.dataAtualizacao DESC
            """)
    List<OpiniaoMorador> listarDoCondominio(@Param("condominioId") Long condominioId);

    long countByCondominioId(Long condominioId);
}
