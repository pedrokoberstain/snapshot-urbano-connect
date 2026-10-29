package br.com.urbanoconnect.api.domain.dto.iqc;

import br.com.urbanoconnect.api.domain.model.EspecialidadeTecnica;

import java.util.Map;

/**
 * Respostas enviadas por um profissional para a parte dele do laudo.
 *
 * {@code especialidade} normalmente é deduzida da parte atribuída a quem está
 * enviando, e só precisa vir preenchida quando um coordenador grava no lugar
 * de alguém — caso em que fica registrado que foi ele.
 *
 * Valor nulo numa chave apaga a resposta; chave ausente não é tocada. A
 * diferença importa: "não respondi ainda" e "respondi e quero desfazer" são
 * coisas distintas para o índice de completude.
 */
public record DadosRespostasIqc(
        Map<String, Object> respostas,
        EspecialidadeTecnica especialidade
) {}
