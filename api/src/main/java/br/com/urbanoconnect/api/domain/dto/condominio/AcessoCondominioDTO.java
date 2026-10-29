package br.com.urbanoconnect.api.domain.dto.condominio;

import br.com.urbanoconnect.api.domain.model.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Saída de um vínculo usuário ↔ condomínio.
 *
 * Expõe nome e e-mail do solicitante porque quem analisa precisa conferir com
 * o comprovante. Não expõe CPF nem telefone: a análise não precisa deles.
 * O comprovante em si nunca vai no JSON — só o indicativo de que existe, e o
 * download fica num endpoint separado, autenticado e auditável.
 */
public record AcessoCondominioDTO(
        Long id,
        Long condominioId,
        String condominioNome,
        Long usuarioId,
        String usuarioNome,
        String usuarioEmail,
        PapelAcessoCondominio papel,
        StatusAcessoCondominio status,
        String unidade,
        VinculoMorador vinculo,
        LocalDate moradorDesde,
        Long mesesDeMoradia,
        boolean opiniaoContaNoCalculo,
        boolean comprovanteDisponivel,
        String comprovanteNomeOriginal,
        LocalDateTime comprovanteRemovidoEm,
        String motivoRecusa,
        String analisadoPorNome,
        LocalDateTime dataSolicitacao,
        LocalDateTime dataAnalise
) {
    public AcessoCondominioDTO(AcessoCondominio a) {
        this(
                a.getId(),
                a.getCondominio() != null ? a.getCondominio().getId() : null,
                a.getCondominio() != null ? a.getCondominio().getNome() : null,
                a.getUsuario() != null ? a.getUsuario().getId() : null,
                a.getUsuario() != null ? a.getUsuario().getNome() : null,
                a.getUsuario() != null ? a.getUsuario().getEmail() : null,
                a.getPapel(),
                a.getStatus(),
                a.getUnidade(),
                a.getVinculo(),
                a.getMoradorDesde(),
                a.getMesesDeMoradia(),
                a.isOpiniaoValidaParaCalculo(),
                a.getComprovanteArquivo() != null,
                a.getComprovanteNomeOriginal(),
                a.getComprovanteRemovidoEm(),
                a.getMotivoRecusa(),
                a.getAnalisadoPor() != null ? a.getAnalisadoPor().getNome() : null,
                a.getDataSolicitacao(),
                a.getDataAnalise()
        );
    }
}
