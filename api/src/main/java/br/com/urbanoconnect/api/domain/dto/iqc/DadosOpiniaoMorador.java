package br.com.urbanoconnect.api.domain.dto.iqc;

import jakarta.validation.constraints.Size;

import java.util.Map;

/**
 * Respostas do morador, chaveadas pela chave da pergunta
 * (ver CatalogoOpiniaoMorador). Aceita "NAO_SEI" e "NAO_SE_APLICA" como
 * valores; ambos são registrados e nenhum dos dois pontua.
 *
 * Os comentários são opcionais e não entram no cálculo. O limite de 1000
 * caracteres é generoso para desabafo e curto o bastante para não virar
 * depósito de texto.
 */
public record DadosOpiniaoMorador(

        Map<String, Object> respostas,

        /**
         * Assinar a opinião com o próprio nome. Ausente ou nulo significa
         * anônimo: o padrão protege quem não decidiu, e identificar-se deve
         * ser escolha explícita, nunca consequência de um campo esquecido.
         */
        Boolean identificarAutor,

        @Size(max = 1000, message = "O comentário deve ter no máximo 1000 caracteres.")
        String comentarioParaInteressado,

        @Size(max = 1000, message = "O comentário deve ter no máximo 1000 caracteres.")
        String comentarioOQueMudaria
) {}
