package br.com.urbanoconnect.api.domain.dto.condominio;

import br.com.urbanoconnect.api.domain.model.Condominio;
import br.com.urbanoconnect.api.domain.model.TipoCondominio;

/**
 * Versão enxuta para a busca do morador, que é aberta a qualquer usuário
 * autenticado. Só o suficiente para a pessoa reconhecer o próprio condomínio
 * numa lista — sem CNPJ, administradora, contato ou quem cadastrou, que
 * transformariam a busca num diretório de prospecção.
 */
public record CondominioResumoDTO(
        Long id,
        String nome,
        String bairro,
        String cidade,
        String uf,
        TipoCondominio tipoCondominio
) {
    public CondominioResumoDTO(Condominio c) {
        this(c.getId(), c.getNome(), c.getBairro(), c.getCidade(), c.getUf(), c.getTipoCondominio());
    }
}
