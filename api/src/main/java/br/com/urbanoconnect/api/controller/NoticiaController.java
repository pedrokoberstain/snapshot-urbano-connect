package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.dto.noticia.DadosCadastroNoticia;
import br.com.urbanoconnect.api.domain.dto.noticia.DadosListaNoticia;
import br.com.urbanoconnect.api.domain.model.CategoriaNoticia;
import br.com.urbanoconnect.api.domain.model.Noticia;
import br.com.urbanoconnect.api.domain.model.TipoConteudo;
import br.com.urbanoconnect.api.domain.repository.NoticiaRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@RestController
@RequestMapping("/noticias")
public class NoticiaController {

    @Autowired
    private NoticiaRepository noticiaRepository;

    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam(required = false) CategoriaNoticia categoria,
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) TipoConteudo tipo,
            // Sem o corpo do texto: 93% do payload de uma listagem é conteúdo
            // que nenhuma vitrine desenha. Opt-in para não quebrar o painel,
            // que reenvia o registro inteiro no PUT.
            @RequestParam(required = false, defaultValue = "false") boolean resumido) {
        // A página da cidade quer tudo o que fala dela — notícia e artigo —,
        // por isso o filtro por cidade continua sem recorte de tipo.
        List<Noticia> achadas;
        if (cidade != null) {
            achadas = noticiaRepository.buscarPublicadasPorCidade(cidade);
        } else {
            TipoConteudo alvo = tipo != null ? tipo : TipoConteudo.NOTICIA;
            achadas = categoria != null
                    ? noticiaRepository.buscarPublicadasPorCategoriaETipo(categoria, alvo)
                    : noticiaRepository.findByPublicadoTrueAndTipoOrderByDataPublicacaoDesc(alvo);
        }
        return ResponseEntity.ok(resumido ? DadosListaNoticia.de(achadas) : achadas);
    }

    @GetMapping("/destaque")
    public List<Noticia> listarDestaque() {
        return noticiaRepository.findByPublicadoTrueAndDestaqueTrue();
    }

    @GetMapping("/populares")
    public List<Noticia> listarPopulares() {
        return noticiaRepository.findTop5ByPublicadoTrueOrderByAcessosDescDataPublicacaoDesc();
    }

    /** Lista todas as séries/dossiês que possuem ao menos uma notícia publicada. */
    @GetMapping("/series")
    public List<NoticiaRepository.SerieResumo> listarSeries(
            @RequestParam(required = false) TipoConteudo tipo) {
        return noticiaRepository.listarSeries(tipo != null ? tipo : TipoConteudo.NOTICIA);
    }

    /** Todas as partes publicadas de uma série, em ordem (parte 1, 2, 3...). */
    @GetMapping("/serie/{slug}")
    public List<Noticia> listarPartesDaSerie(@PathVariable String slug) {
        return noticiaRepository.buscarPartesDaSerie(slug);
    }

    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<Noticia> buscarPorId(@PathVariable Long id) {
        return noticiaRepository.findById(id)
                .map(noticia -> {
                    noticia.setAcessos(noticia.getAcessos() + 1);
                    return ResponseEntity.ok(noticiaRepository.save(noticia));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/admin/todas")
    public List<Noticia> listarTodas() {
        return noticiaRepository.findAll();
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Noticia> criar(@RequestBody @Valid DadosCadastroNoticia dados) {
        Noticia noticia = new Noticia();
        noticia.setTitulo(dados.titulo());
        noticia.setResumo(dados.resumo());
        noticia.setConteudo(dados.conteudo());
        noticia.setImagemCapa(dados.imagemCapa());
        noticia.setPublicado(dados.publicado());
        noticia.setDestaque(dados.destaque());
        noticia.setAutor(dados.autor());
        aplicarCategorias(noticia, dados);
        aplicarCidades(noticia, dados);
        aplicarSerie(noticia, dados);
        aplicarTipoEBloco(noticia, dados);
        noticia.setDataPublicacao(LocalDateTime.now());

        return ResponseEntity.ok(noticiaRepository.save(noticia));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Noticia> atualizar(@PathVariable Long id, @RequestBody @Valid DadosCadastroNoticia dados) {
        return noticiaRepository.findById(id)
                .map(noticia -> {
                    noticia.setTitulo(dados.titulo());
                    noticia.setResumo(dados.resumo());
                    noticia.setConteudo(dados.conteudo());
                    noticia.setImagemCapa(dados.imagemCapa());
                    noticia.setPublicado(dados.publicado());
                    noticia.setDestaque(dados.destaque());
                    noticia.setAutor(dados.autor());
                    aplicarCategorias(noticia, dados);
                    aplicarCidades(noticia, dados);
                    aplicarSerie(noticia, dados);
                    aplicarTipoEBloco(noticia, dados);
                    return ResponseEntity.ok(noticiaRepository.save(noticia));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Resolve as categorias da notícia: usa a lista {@code categorias} quando informada,
     * senão cai para o campo único {@code categoria}. A primeira vira a categoria principal.
     */
    private void aplicarCategorias(Noticia noticia, DadosCadastroNoticia dados) {
        var categorias = new LinkedHashSet<>(
                dados.categorias() != null && !dados.categorias().isEmpty()
                        ? dados.categorias()
                        : dados.categoria() != null ? List.of(dados.categoria()) : List.of());
        if (categorias.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione ao menos uma categoria.");
        }
        noticia.setCategorias(categorias);
        noticia.setCategoria(categorias.iterator().next());
    }

    /**
     * Resolve as cidades da notícia: usa a lista {@code cidades} quando informada,
     * senão cai para o campo único {@code cidade}. A primeira vira a cidade principal.
     * Lista vazia = notícia geral (sem cidade).
     */
    private void aplicarCidades(Noticia noticia, DadosCadastroNoticia dados) {
        var brutas = new ArrayList<String>();
        if (dados.cidades() != null && !dados.cidades().isEmpty()) {
            brutas.addAll(dados.cidades());
        } else if (dados.cidade() != null) {
            brutas.add(dados.cidade());
        }
        var cidades = new LinkedHashSet<String>();
        for (String c : brutas) {
            if (c != null && !c.isBlank()) cidades.add(c.trim());
        }
        noticia.setCidades(cidades);
        // Cidade principal (exibição): a primeira cidade real, ignorando o marcador estadual "TODAS".
        String principal = cidades.stream()
                .filter(c -> !c.equalsIgnoreCase("TODAS"))
                .findFirst()
                .orElse(null);
        noticia.setCidade(principal);
    }

    /** Aplica os campos de série e deriva o slug a partir do nome informado. */
    private void aplicarSerie(Noticia noticia, DadosCadastroNoticia dados) {
        String serie = dados.serie() != null && !dados.serie().isBlank() ? dados.serie().trim() : null;
        noticia.setSerie(serie);
        noticia.setSerieSlug(slugify(serie));
        noticia.setParteNumero(serie != null ? dados.parteNumero() : null);
    }

    /**
     * Tipo e bloco. Tipo ausente vale NOTICIA — assim o formulário antigo e
     * qualquer integração continuam funcionando sem enviar o campo. O bloco só
     * existe dentro de uma série: sem série, é descartado.
     */
    private void aplicarTipoEBloco(Noticia noticia, DadosCadastroNoticia dados) {
        noticia.setTipo(dados.tipo() != null ? dados.tipo() : TipoConteudo.NOTICIA);
        boolean temSerie = noticia.getSerie() != null;
        String bloco = dados.bloco() != null && !dados.bloco().isBlank() ? dados.bloco().trim() : null;
        noticia.setBloco(temSerie ? bloco : null);
        noticia.setBlocoNumero(temSerie && bloco != null ? dados.blocoNumero() : null);
    }

    /** Normaliza um texto em slug: minúsculas, sem acentos, hífens no lugar de símbolos. */
    private static String slugify(String input) {
        if (input == null || input.isBlank()) return null;
        String semAcento = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String slug = semAcento.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return slug.isBlank() ? null : slug;
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        if (!noticiaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        noticiaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
