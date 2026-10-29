package br.com.urbanoconnect.api.domain.dto.condominio;

import br.com.urbanoconnect.api.domain.model.StatusAcessoCondominio;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Decisão sobre um vínculo: aprovar, recusar ou revogar. O motivo é para o
 * solicitante entender o que houve — obrigatório na recusa, onde a ausência de
 * explicação só gera reenvio do mesmo comprovante.
 */
public record DadosAnaliseAcesso(

        @NotNull(message = "Informe a decisão: APROVADO, RECUSADO ou REVOGADO.")
        StatusAcessoCondominio status,

        @Size(max = 500, message = "O motivo deve ter no máximo 500 caracteres.")
        String motivo
) {}
