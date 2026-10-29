package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.CadastroIptu;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CadastroIptuRepository extends JpaRepository<CadastroIptu, Long> {

    long countByCidade(String cidade);

    /** Cobertura BCI: quantas inscricoes ja tem area construida vinda do Boletim (import BCI ok). */
    long countByCidadeAndAreaConstruidaIsNotNull(String cidade);

    List<CadastroIptu> findByCidade(String cidade);

    Optional<CadastroIptu> findByCidadeAndInscricao(String cidade, String inscricao);

    /** Busca paginada por cidade, com filtro de texto (inscrição/bairro) e bairro exato opcionais. */
    @Query("""
            SELECT c FROM CadastroIptu c
            WHERE c.cidade = :cidade
              AND (:q = '' OR LOWER(c.inscricao) LIKE LOWER(CONCAT('%', :q, '%'))
                          OR LOWER(c.bairro)    LIKE LOWER(CONCAT('%', :q, '%')))
              AND (:bairro = '' OR c.bairro = :bairro)
            ORDER BY c.inscricao
            """)
    Page<CadastroIptu> buscar(String cidade, String q, String bairro, Pageable pageable);

    /** Lista distinta de bairros da cidade, para o filtro do admin. */
    @Query("SELECT DISTINCT c.bairro FROM CadastroIptu c WHERE c.cidade = :cidade AND c.bairro IS NOT NULL ORDER BY c.bairro")
    List<String> bairros(String cidade);

    /** Média do valor venal e nº de amostras para um conjunto de bairros. Linha única [avg, count]. */
    @Query("""
            SELECT AVG(c.valorVenal), COUNT(c)
            FROM CadastroIptu c
            WHERE c.cidade = :cidade AND c.bairro IN :bairros AND c.valorVenal IS NOT NULL
            """)
    List<Object[]> mediaVenalPorBairros(String cidade, List<String> bairros);

    /** Média do R$/m² de terreno e nº de amostras para um conjunto de bairros. Linha única [avg, count]. */
    @Query("""
            SELECT AVG(c.valorM2Terreno), COUNT(c)
            FROM CadastroIptu c
            WHERE c.cidade = :cidade AND c.bairro IN :bairros
              AND c.valorM2Terreno IS NOT NULL AND c.valorM2Terreno > 0
            """)
    List<Object[]> mediaM2TerrenoPorBairros(String cidade, List<String> bairros);

    /**
     * Todos os imóveis dos bairros informados que têm número (coluna {@code endereco})
     * preenchido. Usado para o match "bairro + número" no cadastro do anúncio — o
     * filtro por número normalizado é feito em memória (bairro tem ~400 imóveis).
     */
    @Query("""
            SELECT c FROM CadastroIptu c
            WHERE c.cidade = :cidade AND c.bairro IN :bairros AND c.endereco IS NOT NULL
            """)
    List<CadastroIptu> imoveisComEndereco(String cidade, List<String> bairros);

    /**
     * Perfil agregado de um bairro para exibição no cadastro. A linha retornada tem,
     * nesta ordem: total geral, total com dado BCI (area_construida ≠ null), média do
     * venal, média da área do terreno, média da área construída e a contagem de imóveis
     * "SIM" para cada serviço BCI (7 colunas — o percentual é calculado no service).
     */
    @Query("""
            SELECT COUNT(c),
                   COUNT(c.areaConstruida),
                   AVG(c.valorVenal),
                   AVG(c.areaTerreno),
                   AVG(c.areaConstruida),
                   COUNT(CASE WHEN c.temAgua               = TRUE THEN 1 END),
                   COUNT(CASE WHEN c.temEsgoto             = TRUE THEN 1 END),
                   COUNT(CASE WHEN c.temCalcamento         = TRUE THEN 1 END),
                   COUNT(CASE WHEN c.temColetaLixo         = TRUE THEN 1 END),
                   COUNT(CASE WHEN c.temIluminacaoPublica  = TRUE THEN 1 END),
                   COUNT(CASE WHEN c.temGaleriaPluvial     = TRUE THEN 1 END),
                   COUNT(CASE WHEN c.temRedeTelefonica     = TRUE THEN 1 END),
                   COUNT(CASE WHEN c.temPiscina            = TRUE THEN 1 END)
            FROM CadastroIptu c
            WHERE c.cidade = :cidade AND c.bairro IN :bairros
            """)
    List<Object[]> agregadosBairro(String cidade, List<String> bairros);
}
