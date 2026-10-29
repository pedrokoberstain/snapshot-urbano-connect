package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.CategoriaNoticia;
import br.com.urbanoconnect.api.domain.model.Noticia;
import br.com.urbanoconnect.api.domain.model.TipoConteudo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NoticiaRepository extends JpaRepository<Noticia, Long> {

    List<Noticia> findByPublicadoTrueOrderByDataPublicacaoDesc();

    /** Feed de um tipo só: o portal de notícias não mistura mais artigo no meio. */
    List<Noticia> findByPublicadoTrueAndTipoOrderByDataPublicacaoDesc(TipoConteudo tipo);

    /** Notícias publicadas que tenham a categoria informada entre suas categorias. */
    @Query("""
            SELECT DISTINCT n FROM Noticia n JOIN n.categorias cat
            WHERE n.publicado = true AND cat = :categoria
            ORDER BY n.dataPublicacao DESC
            """)
    List<Noticia> buscarPublicadasPorCategoria(CategoriaNoticia categoria);

    /** Igual à busca por categoria, restrita a notícia ou a artigo. */
    @Query("""
            SELECT DISTINCT n FROM Noticia n JOIN n.categorias cat
            WHERE n.publicado = true AND cat = :categoria AND n.tipo = :tipo
            ORDER BY n.dataPublicacao DESC
            """)
    List<Noticia> buscarPublicadasPorCategoriaETipo(CategoriaNoticia categoria, TipoConteudo tipo);

    List<Noticia> findByPublicadoTrueAndDestaqueTrue();

    /**
     * Notícias publicadas vinculadas a uma cidade (match parcial, ignorando caixa).
     * Inclui também as notícias estaduais (marcador "TODAS"), que aparecem em qualquer cidade.
     */
    @Query("""
            SELECT DISTINCT n FROM Noticia n JOIN n.cidades c
            WHERE n.publicado = true
              AND (c = 'TODAS' OR LOWER(c) LIKE LOWER(CONCAT('%', :cidade, '%')))
            ORDER BY n.dataPublicacao DESC
            """)
    List<Noticia> buscarPublicadasPorCidade(String cidade);

    List<Noticia> findTop5ByPublicadoTrueOrderByAcessosDescDataPublicacaoDesc();

    /** Todas as partes publicadas de uma série, na ordem da série (parte 1, 2, 3...). */
    List<Noticia> findByPublicadoTrueAndSerieSlugOrderByParteNumeroAscDataPublicacaoAsc(String serieSlug);

    /**
     * Partes da série na ordem de leitura: primeiro o bloco temático, depois a
     * parte dentro dele. Quem não tem bloco cai no fim (NULLS LAST), então uma
     * série sem blocos continua saindo na ordem de sempre.
     */
    @Query("""
            SELECT n FROM Noticia n
            WHERE n.publicado = true AND n.serieSlug = :slug
            ORDER BY n.blocoNumero ASC NULLS LAST, n.parteNumero ASC NULLS LAST, n.dataPublicacao ASC
            """)
    List<Noticia> buscarPartesDaSerie(String slug);

    /** Slug + nome + nº de partes de cada série que tem ao menos uma notícia publicada. */
    @Query("""
            SELECT n.serieSlug AS slug, MIN(n.serie) AS nome, COUNT(n) AS partes
            FROM Noticia n
            WHERE n.publicado = true AND n.serieSlug IS NOT NULL AND n.tipo = :tipo
            GROUP BY n.serieSlug
            ORDER BY MIN(n.serie) ASC
            """)
    List<SerieResumo> listarSeries(TipoConteudo tipo);

    /** Projeção para o resumo de séries. */
    interface SerieResumo {
        String getSlug();
        String getNome();
        long getPartes();
    }
}
