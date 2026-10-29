package br.com.urbanoconnect.api.domain.dto.iqc;

import br.com.urbanoconnect.api.domain.model.FaixaMoradia;
import br.com.urbanoconnect.api.domain.model.OpiniaoMorador;
import br.com.urbanoconnect.api.domain.model.VinculoMorador;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Uma opinião como ela aparece para cada audiência.
 *
 * O morador decide se assina ou fica anônimo, e o padrão é anônimo. Quem
 * assina aparece com nome e tempo exato de moradia. Quem não assina aparece
 * só com o vínculo e a faixa de tempo — porque o número exato de meses, junto
 * com "proprietário" ou "inquilino", já identifica a pessoa num condomínio
 * pequeno, e um anonimato que não resiste a essa conta não é anonimato.
 */
public record OpiniaoMoradorDTO(
        Long id,
        Long condominioId,
        String condominioNome,

        /** Preenchido quando o morador assinou, ou quando é ele mesmo lendo. */
        String autorNome,
        boolean identificada,

        VinculoMorador vinculo,
        /** Só para opinião assinada — ou para o próprio autor. */
        Long mesesDeMoradia,
        FaixaMoradia faixaDeMoradia,

        boolean contaNoCalculo,
        Map<String, Object> respostas,
        String comentarioParaInteressado,
        String comentarioOQueMudaria,
        boolean comentariosOcultos,
        LocalDateTime dataCriacao,
        LocalDateTime dataAtualizacao
) {

    /** Visão do próprio morador: vê tudo que é dele, assinado ou não. */
    public static OpiniaoMoradorDTO doAutor(OpiniaoMorador o, VinculoMorador vinculo,
                                            Long meses, boolean contaNoCalculo) {
        return new OpiniaoMoradorDTO(
                o.getId(),
                o.getCondominio() != null ? o.getCondominio().getId() : null,
                o.getCondominio() != null ? o.getCondominio().getNome() : null,
                o.getUsuario() != null ? o.getUsuario().getNome() : null,
                Boolean.TRUE.equals(o.getIdentificarAutor()),
                vinculo,
                meses,
                FaixaMoradia.de(meses),
                contaNoCalculo,
                o.getRespostas(),
                o.getComentarioParaInteressado(),
                o.getComentarioOQueMudaria(),
                Boolean.TRUE.equals(o.getComentariosOcultos()),
                o.getDataCriacao(), o.getDataAtualizacao());
    }

    /**
     * Visão de quem monta o laudo. Respeita a escolha do morador e some com o
     * comentário quando ele foi moderado.
     */
    public static OpiniaoMoradorDTO paraLaudo(OpiniaoMorador o, VinculoMorador vinculo,
                                              Long meses, boolean contaNoCalculo) {
        boolean assinada = Boolean.TRUE.equals(o.getIdentificarAutor());
        boolean ocultos  = Boolean.TRUE.equals(o.getComentariosOcultos());

        return new OpiniaoMoradorDTO(
                o.getId(),
                o.getCondominio() != null ? o.getCondominio().getId() : null,
                o.getCondominio() != null ? o.getCondominio().getNome() : null,
                assinada && o.getUsuario() != null ? o.getUsuario().getNome() : null,
                assinada,
                vinculo,
                assinada ? meses : null,
                FaixaMoradia.de(meses),
                contaNoCalculo,
                o.getRespostas(),
                ocultos ? null : o.getComentarioParaInteressado(),
                ocultos ? null : o.getComentarioOQueMudaria(),
                ocultos,
                o.getDataCriacao(), o.getDataAtualizacao());
    }
}
