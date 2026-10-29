package br.com.urbanoconnect.api.domain.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "noticias")
public class Noticia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String resumo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    private String imagemCapa;

    /** Categoria principal (= primeira selecionada). Mantida para exibição e compatibilidade. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaNoticia categoria;

    /** Todas as categorias da notícia. Fonte de verdade para filtragem por editoria. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "noticia_categorias", joinColumns = @JoinColumn(name = "noticia_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "categoria")
    private Set<CategoriaNoticia> categorias = new LinkedHashSet<>();

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean publicado = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean destaque = false;

    private String autor;

    /** Cidade principal (= primeira selecionada). Mantida para exibição e compatibilidade. */
    private String cidade;

    /** Todas as cidades vinculadas à notícia. Fonte de verdade para filtragem por cidade. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "noticia_cidades", joinColumns = @JoinColumn(name = "noticia_id"))
    @Column(name = "cidade")
    private Set<String> cidades = new LinkedHashSet<>();

    /** Nome da série/dossiê a que esta notícia pertence (ex.: "BR-163: A Rodovia que Criou Cidades"). Opcional. */
    private String serie;

    /** Slug derivado de {@link #serie}, usado para agrupar e montar a URL /serie/{slug}. */
    private String serieSlug;

    /** Ordem desta notícia dentro da série (1, 2, 3...). Opcional. */
    private Integer parteNumero;

    /**
     * Notícia (feed, ordenado por data) ou artigo (biblioteca, buscado por
     * assunto). O DEFAULT no banco é obrigatório: sem ele o ddl-auto=update
     * não consegue criar a coluna NOT NULL numa tabela já populada.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20,
            columnDefinition = "varchar(20) not null default 'NOTICIA'")
    private TipoConteudo tipo = TipoConteudo.NOTICIA;

    /** Bloco temático dentro da série (ex.: "Diagnóstico e Contaminação"). Opcional. */
    private String bloco;

    /** Ordem do bloco dentro da série (1, 2, 3...). Opcional. */
    private Integer blocoNumero;

    @Column(nullable = false)
    private LocalDateTime dataPublicacao = LocalDateTime.now();

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int acessos = 0;
}
