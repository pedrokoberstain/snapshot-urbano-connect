package br.com.urbanoconnect.api.domain.dto.iqc;

import br.com.urbanoconnect.api.domain.model.DimensaoIqc;
import br.com.urbanoconnect.api.domain.model.EspecialidadeTecnica;
import br.com.urbanoconnect.api.domain.model.ParteAvaliacaoIqc;
import br.com.urbanoconnect.api.domain.model.StatusParteIqc;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Uma parte do laudo como a tela precisa ver: quem responde, o que já foi
 * assinado, e quais dimensões pertencem àquela especialidade.
 *
 * As dimensões vão junto para o front não precisar redescobrir a divisão — ela
 * é regra de negócio, e duplicá-la no cliente garantiria que um dia as duas
 * versões divergiriam.
 */
public record ParteAvaliacaoIqcDTO(
        Long id,
        Long avaliacaoId,
        EspecialidadeTecnica especialidade,
        String especialidadeRotulo,
        String conselho,
        boolean obrigatoriaParaConcluir,
        List<String> dimensoes,
        int pesoPercentual,
        StatusParteIqc status,
        Long responsavelId,
        String responsavelNome,
        String assinadoPorNome,
        String registroProfissional,
        LocalDateTime dataFinalizacao,
        LocalDateTime dataAtualizacao
) {
    public ParteAvaliacaoIqcDTO(ParteAvaliacaoIqc p) {
        this(
                p.getId(),
                p.getAvaliacao() != null ? p.getAvaliacao().getId() : null,
                p.getEspecialidade(),
                p.getEspecialidade().getRotulo(),
                p.getEspecialidade().getConselho(),
                p.getEspecialidade().isObrigatoriaParaConcluir(),
                p.getEspecialidade().dimensoes().stream().map(DimensaoIqc::name).toList(),
                (int) Math.round(p.getEspecialidade().pesoTotal() * 100),
                p.getStatus(),
                p.getResponsavel() != null ? p.getResponsavel().getId() : null,
                p.getResponsavelNome(),
                p.getAssinadoPorNome(),
                p.getRegistroProfissional(),
                p.getDataFinalizacao(),
                p.getDataAtualizacao()
        );
    }
}
