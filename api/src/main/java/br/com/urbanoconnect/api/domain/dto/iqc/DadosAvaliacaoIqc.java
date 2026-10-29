package br.com.urbanoconnect.api.domain.dto.iqc;

import br.com.urbanoconnect.api.domain.model.TipoCondominio;
import jakarta.validation.constraints.AssertTrue;

import java.util.Map;

/**
 * Dados de entrada para criar/atualizar uma avaliação IQC.
 * {@code respostas} são as respostas brutas do checklist, chaveadas pelo nome
 * da variável (ver CatalogoIqc). {@code imovelId} é opcional.
 *
 * A identificação do empreendimento aceita dois caminhos: {@code condominioId}
 * apontando para o cadastro (preferido — nome, cidade, bairro e tipologia vêm
 * de lá) ou os campos avulsos, que seguem valendo para as avaliações feitas
 * antes de o cadastro existir.
 */
public record DadosAvaliacaoIqc(

        Long condominioId,

        String nomeCondominio,

        String cidade,
        String bairro,
        TipoCondominio tipoCondominio,
        Long imovelId,
        Map<String, Object> respostas,
        String observacoes
) {

    @AssertTrue(message = "Informe o condomínio cadastrado (condominioId) ou o nome do condomínio.")
    public boolean isIdentificacaoInformada() {
        return condominioId != null || (nomeCondominio != null && !nomeCondominio.isBlank());
    }
}
