package br.com.urbanoconnect.api.domain.dto.condominio;

import br.com.urbanoconnect.api.domain.model.Condominio;
import br.com.urbanoconnect.api.domain.model.TipoCondominio;

import java.time.LocalDateTime;

/**
 * Saída do condomínio para o front. Não expõe {@code criadoPor} como objeto —
 * só o nome de quem cadastrou, para não vazar e-mail/CPF do corretor.
 */
public record CondominioDTO(
        Long id,
        String nome,
        String razaoSocial,
        String cnpj,
        TipoCondominio tipoCondominio,
        String cep,
        String rua,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String uf,
        Double latitude,
        Double longitude,
        Integer qtdUnidades,
        Integer qtdTorres,
        Integer anoEntrega,
        String construtora,
        String administradora,
        String telefoneContato,
        String emailContato,
        String observacoes,
        Boolean ativo,
        String criadoPorNome,
        LocalDateTime dataCriacao,
        LocalDateTime dataAtualizacao
) {
    public CondominioDTO(Condominio c) {
        this(
                c.getId(),
                c.getNome(),
                c.getRazaoSocial(),
                c.getCnpj(),
                c.getTipoCondominio(),
                c.getCep(),
                c.getRua(),
                c.getNumero(),
                c.getComplemento(),
                c.getBairro(),
                c.getCidade(),
                c.getUf(),
                c.getLatitude(),
                c.getLongitude(),
                c.getQtdUnidades(),
                c.getQtdTorres(),
                c.getAnoEntrega(),
                c.getConstrutora(),
                c.getAdministradora(),
                c.getTelefoneContato(),
                c.getEmailContato(),
                c.getObservacoes(),
                c.getAtivo(),
                c.getCriadoPor() != null ? c.getCriadoPor().getNome() : null,
                c.getDataCriacao(),
                c.getDataAtualizacao()
        );
    }
}
