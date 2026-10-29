package br.com.urbanoconnect.api.domain.dto.noticia;

import br.com.urbanoconnect.api.domain.model.CategoriaNoticia;
import br.com.urbanoconnect.api.domain.model.TipoConteudo;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record DadosCadastroNoticia(
        @NotBlank String titulo,
        @NotBlank String resumo,
        @NotBlank String conteudo,
        String imagemCapa,
        // Categoria: aceita o campo único legado e/ou a lista de categorias (nova).
        CategoriaNoticia categoria,
        List<CategoriaNoticia> categorias,
        boolean publicado,
        boolean destaque,
        String autor,
        // Cidade: aceita o campo único legado e/ou a lista de cidades (nova).
        String cidade,
        List<String> cidades,
        String serie,
        Integer parteNumero,
        // Notícia (padrão) ou artigo. Ausente = NOTICIA, para não quebrar
        // integrações e o formulário antigo.
        TipoConteudo tipo,
        String bloco,
        Integer blocoNumero
) {}
