package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.model.CategoriaNoticia;
import br.com.urbanoconnect.api.domain.model.Noticia;
import br.com.urbanoconnect.api.domain.model.TipoConteudo;
import br.com.urbanoconnect.api.domain.repository.NoticiaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * O portal de notícias e a biblioteca de artigos são áreas distintas.
 * Estes testes travam a separação: se alguém remover o filtro por tipo, o feed
 * volta a misturar as duas coisas e um destes quebra.
 *
 * Não limpa a tabela e não conta registros: o banco de dev já vem populado pelo
 * seeder, então cada teste cria os seus com um marcador único e verifica
 * presença e ausência por id. @Transactional desfaz tudo no fim.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
@DisplayName("Separação entre notícia e artigo")
class SeparacaoNoticiaArtigoTest {

    @Autowired MockMvc mvc;
    @Autowired NoticiaRepository repository;

    private String marca;
    private Noticia noticia;
    private Noticia artigo;

    @BeforeEach
    void preparar() {
        marca = UUID.randomUUID().toString().substring(0, 8);
        noticia = salvar("Notícia " + marca, TipoConteudo.NOTICIA, null, null, null);
        artigo = salvar("Artigo " + marca, TipoConteudo.ARTIGO, "Série " + marca, "Diagnóstico", 1);
    }

    private Noticia salvar(String titulo, TipoConteudo tipo, String serie, String bloco, Integer blocoNumero) {
        Noticia n = new Noticia();
        n.setTitulo(titulo);
        n.setResumo("resumo de teste");
        n.setConteudo("<p>conteudo de teste</p>");
        n.setCategoria(CategoriaNoticia.AGRONEGOCIO);
        n.setCategorias(new LinkedHashSet<>(List.of(CategoriaNoticia.AGRONEGOCIO)));
        n.setPublicado(true);
        n.setTipo(tipo);
        n.setSerie(serie);
        n.setSerieSlug(serie == null ? null : "serie-" + marca);
        n.setParteNumero(serie == null ? null : 1);
        n.setBloco(bloco);
        n.setBlocoNumero(blocoNumero);
        return repository.save(n);
    }

    /** Ids devolvidos por uma chamada ao portal, como texto para busca simples. */
    private String corpoDe(String url, String... params) throws Exception {
        var req = get(url);
        for (int i = 0; i + 1 < params.length; i += 2) req = req.param(params[i], params[i + 1]);
        return mvc.perform(req).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    }

    @Test
    @DisplayName("sem parâmetro, /noticias traz a notícia e NÃO traz o artigo")
    void feedNaoMisturaArtigo() throws Exception {
        String corpo = corpoDe("/noticias");
        assertTrue(corpo.contains("Notícia " + marca), "a notícia deveria estar no feed");
        assertFalse(corpo.contains("Artigo " + marca), "o artigo vazou para o feed de notícias");
    }

    @Test
    @DisplayName("tipo=ARTIGO traz o artigo e NÃO traz a notícia")
    void bibliotecaSoTemArtigo() throws Exception {
        String corpo = corpoDe("/noticias", "tipo", "ARTIGO");
        assertTrue(corpo.contains("Artigo " + marca), "o artigo deveria estar na biblioteca");
        assertFalse(corpo.contains("Notícia " + marca), "a notícia vazou para a biblioteca");
    }

    @Test
    @DisplayName("o filtro por categoria também respeita o tipo")
    void categoriaRespeitaTipo() throws Exception {
        String corpo = corpoDe("/noticias", "categoria", "AGRONEGOCIO");
        assertTrue(corpo.contains("Notícia " + marca));
        assertFalse(corpo.contains("Artigo " + marca), "categoria não pode ignorar o tipo");
    }

    @Test
    @DisplayName("a página da cidade continua vendo os dois — lá o corte por tipo atrapalharia")
    void cidadeVeOsDois() throws Exception {
        for (Noticia n : List.of(noticia, artigo)) {
            n.setCidades(new LinkedHashSet<>(List.of("CidadeTeste" + marca)));
            repository.save(n);
        }
        String corpo = corpoDe("/noticias", "cidade", "CidadeTeste" + marca);
        assertTrue(corpo.contains("Notícia " + marca), "a cidade deveria mostrar a notícia");
        assertTrue(corpo.contains("Artigo " + marca), "a cidade deveria mostrar o artigo também");
    }

    @Test
    @DisplayName("resumido=true tira o corpo do texto, mas mantém o que a vitrine desenha")
    void listagemResumidaNaoTrazConteudo() throws Exception {
        String cheio = corpoDe("/noticias");
        assertTrue(cheio.contains("conteudo de teste"), "a listagem padrão continua trazendo o texto");

        String enxuto = corpoDe("/noticias", "resumido", "true");
        assertFalse(enxuto.contains("conteudo de teste"), "resumido não pode trazer o corpo");
        assertTrue(enxuto.contains("Notícia " + marca), "mas o título tem que vir");
        assertTrue(enxuto.contains("resumo de teste"), "e o resumo também");
    }

    @Test
    @DisplayName("resumido preserva série e bloco — é do que o carrossel precisa")
    void resumidoPreservaSerieEBloco() throws Exception {
        String enxuto = corpoDe("/noticias", "tipo", "ARTIGO", "resumido", "true");
        assertTrue(enxuto.contains("Diagnóstico"), "o bloco precisa sobreviver ao resumo");
        assertTrue(enxuto.contains("Série " + marca), "a série também");
        assertFalse(enxuto.contains("conteudo de teste"));
    }

    @Test
    @DisplayName("conteúdo sem tipo declarado nasce NOTICIA, para não quebrar o que já existe")
    void padraoEhNoticia() {
        assertEquals(TipoConteudo.NOTICIA, new Noticia().getTipo());
    }

    @Test
    @DisplayName("as partes da série saem ordenadas por bloco e depois por parte")
    void serieOrdenaPorBloco() {
        salvar("Parte do bloco 2 " + marca, TipoConteudo.ARTIGO, "Série " + marca, "Impacto", 2);

        List<Noticia> partes = repository.buscarPartesDaSerie("serie-" + marca);
        assertEquals(2, partes.size());
        assertEquals(1, partes.get(0).getBlocoNumero(), "o bloco 1 deveria vir primeiro");
        assertEquals(2, partes.get(1).getBlocoNumero());
    }

    @Test
    @DisplayName("série sem bloco continua saindo na ordem de sempre (NULLS LAST não some com ela)")
    void serieSemBlocoContinuaFuncionando() {
        String outra = "sem-bloco-" + marca;
        for (int parte = 2; parte >= 1; parte--) {
            Noticia n = new Noticia();
            n.setTitulo("Cap " + parte + " " + marca);
            n.setResumo("r");
            n.setConteudo("<p>c</p>");
            n.setCategoria(CategoriaNoticia.CIDADES);
            n.setCategorias(new LinkedHashSet<>(List.of(CategoriaNoticia.CIDADES)));
            n.setPublicado(true);
            n.setTipo(TipoConteudo.ARTIGO);
            n.setSerie("Sem bloco " + marca);
            n.setSerieSlug(outra);
            n.setParteNumero(parte);
            repository.save(n);
        }
        List<Noticia> partes = repository.buscarPartesDaSerie(outra);
        assertEquals(2, partes.size());
        assertEquals(1, partes.get(0).getParteNumero());
        assertEquals(2, partes.get(1).getParteNumero());
    }
}
