package br.com.urbanoconnect.api.domain.dto.noticia;

import br.com.urbanoconnect.api.domain.model.CategoriaNoticia;
import br.com.urbanoconnect.api.domain.model.Noticia;
import br.com.urbanoconnect.api.domain.model.TipoConteudo;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Notícia sem o corpo do texto, para listagens.
 *
 * O `conteudo` responde por 93% do payload de uma listagem e nenhuma vitrine
 * usa: /artigos baixava 1 MB para desenhar 97 cartões que só precisam de
 * título, resumo e capa. Aqui são 68 KB.
 */
public record DadosListaNoticia(
        Long id,
        String titulo,
        String resumo,
        String imagemCapa,
        CategoriaNoticia categoria,
        Set<CategoriaNoticia> categorias,
        String cidade,
        Set<String> cidades,
        String autor,
        String serie,
        String serieSlug,
        Integer parteNumero,
        String bloco,
        Integer blocoNumero,
        TipoConteudo tipo,
        boolean publicado,
        boolean destaque,
        LocalDateTime dataPublicacao,
        int acessos
) {
    public static DadosListaNoticia de(Noticia n) {
        return new DadosListaNoticia(
                n.getId(), n.getTitulo(), n.getResumo(), n.getImagemCapa(),
                n.getCategoria(), n.getCategorias(),
                n.getCidade(), n.getCidades(),
                n.getAutor(),
                n.getSerie(), n.getSerieSlug(), n.getParteNumero(),
                n.getBloco(), n.getBlocoNumero(),
                n.getTipo(), n.isPublicado(), n.isDestaque(),
                n.getDataPublicacao(), n.getAcessos());
    }

    public static List<DadosListaNoticia> de(List<Noticia> noticias) {
        return noticias.stream().map(DadosListaNoticia::de).toList();
    }
}
