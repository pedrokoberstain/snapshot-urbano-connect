package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.ParteAvaliacaoIqcRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

/**
 * ══════════════════════════════════════════════════════════════
 *  COLABORAÇÃO NO LAUDO — três profissionais, uma avaliação
 * ══════════════════════════════════════════════════════════════
 *
 *  Engenheiro, arquiteto e analista trabalham na mesma avaliação, cada um nas
 *  dimensões da sua especialidade. As respostas continuam num único jsonb, e o
 *  motor de cálculo não muda — o que muda é quem pode gravar cada chave.
 *
 *  Duas regras que precisam valer no servidor, não só na tela:
 *
 *  1. Escrita é filtrada por especialidade. Esconder abas no front não impede
 *     ninguém de mandar o JSON inteiro na mão.
 *  2. Escrita é MESCLADA, nunca substituída. O comportamento anterior trocava
 *     o mapa inteiro; com três pessoas trabalhando, o último a salvar apagaria
 *     o trabalho dos outros dois sem aviso nenhum.
 */
@Service
public class ColaboracaoIqcService {

    @Autowired
    private ParteAvaliacaoIqcRepository parteRepository;

    /** chave da variável → dimensão a que ela pertence. */
    private static final Map<String, DimensaoIqc> DIMENSAO_DA_CHAVE = new HashMap<>();
    static {
        for (VariavelIqc v : CatalogoIqc.VARIAVEIS) DIMENSAO_DA_CHAVE.put(v.chave(), v.dimensao());
    }

    // ── Criação das partes ──────────────────────────────────

    /**
     * Toda avaliação nasce com as três partes, ainda sem responsável. Criá-las
     * na hora, em vez de sob demanda, faz a tela de acompanhamento mostrar
     * desde o início o que falta — inclusive o que ninguém assumiu.
     */
    public List<ParteAvaliacaoIqc> criarPartes(AvaliacaoIqc avaliacao) {
        List<ParteAvaliacaoIqc> partes = new ArrayList<>();
        for (EspecialidadeTecnica esp : EspecialidadeTecnica.values()) {
            ParteAvaliacaoIqc p = new ParteAvaliacaoIqc();
            p.setAvaliacao(avaliacao);
            p.setEspecialidade(esp);
            p.setStatus(StatusParteIqc.AGUARDANDO);
            partes.add(parteRepository.save(p));
        }
        return partes;
    }

    // ── Escrita filtrada ────────────────────────────────────

    /**
     * Mescla no mapa da avaliação apenas as chaves que pertencem à
     * especialidade informada, e devolve as que foram recusadas.
     *
     * Devolver as recusadas em vez de descartá-las em silêncio é deliberado: se
     * o front mandar chave de outra especialidade por engano, alguém precisa
     * ficar sabendo — dado sumindo sem erro é o pior tipo de bug.
     */
    public ResultadoMesclagem mesclarRespostas(AvaliacaoIqc avaliacao,
                                               EspecialidadeTecnica especialidade,
                                               Map<String, Object> novas) {
        Map<String, Object> atuais = avaliacao.getRespostas() != null
                ? new HashMap<>(avaliacao.getRespostas())
                : new HashMap<>();

        List<String> recusadas = new ArrayList<>();
        int aceitas = 0;

        if (novas != null) {
            for (Map.Entry<String, Object> e : novas.entrySet()) {
                DimensaoIqc dim = DIMENSAO_DA_CHAVE.get(e.getKey());
                if (dim == null || dim.getResponsavel() != especialidade) {
                    recusadas.add(e.getKey());
                    continue;
                }
                if (e.getValue() == null) atuais.remove(e.getKey());
                else atuais.put(e.getKey(), e.getValue());
                aceitas++;
            }
        }

        avaliacao.setRespostas(atuais);
        return new ResultadoMesclagem(aceitas, recusadas);
    }

    public record ResultadoMesclagem(int aceitas, List<String> recusadas) {}

    // ── Conclusão ───────────────────────────────────────────

    /**
     * O laudo só conclui com engenheiro e arquiteto finalizados. Analista não
     * trava — não tem conselho de classe e a coleta dele vem em boa parte de
     * fonte pública.
     *
     * Isso tem uma consequência que o resultado precisa expor: as dimensões do
     * analista somam {@code 38%} do peso. Concluir sem elas não é neutro — as
     * variáveis binárias não respondidas contam como ausência, e o score sai
     * rebaixado. Daí o índice de completude viajar junto do número.
     */
    public List<EspecialidadeTecnica> pendenciasParaConcluir(Long avaliacaoId) {
        Map<EspecialidadeTecnica, ParteAvaliacaoIqc> porEspecialidade = new EnumMap<>(EspecialidadeTecnica.class);
        for (ParteAvaliacaoIqc p : parteRepository.listarDaAvaliacao(avaliacaoId)) {
            porEspecialidade.put(p.getEspecialidade(), p);
        }

        List<EspecialidadeTecnica> faltando = new ArrayList<>();
        for (EspecialidadeTecnica esp : EspecialidadeTecnica.obrigatorias()) {
            ParteAvaliacaoIqc p = porEspecialidade.get(esp);
            if (p == null || !p.isFinalizada()) faltando.add(esp);
        }
        return faltando;
    }

    // ── Completude ──────────────────────────────────────────

    /**
     * Quanto de cada dimensão foi de fato respondido.
     *
     * Sem isso, uma avaliação com 5 respostas de 154 produz um número que
     * parece tão sólido quanto uma completa. Um laudo que diz "82, com 40%
     * preenchido" é honesto; um que diz só "82" mente por omissão.
     */
    public Map<String, Integer> completudePorDimensao(Map<String, Object> respostas) {
        Map<DimensaoIqc, int[]> contagem = new EnumMap<>(DimensaoIqc.class);
        for (DimensaoIqc d : DimensaoIqc.values()) contagem.put(d, new int[2]); // [respondidas, total]

        for (VariavelIqc v : CatalogoIqc.VARIAVEIS) {
            int[] c = contagem.get(v.dimensao());
            c[1]++;
            Object valor = respostas != null ? respostas.get(v.chave()) : null;
            if (valor != null && !String.valueOf(valor).isBlank()) c[0]++;
        }

        Map<String, Integer> percentuais = new LinkedHashMap<>();
        for (DimensaoIqc d : DimensaoIqc.values()) {
            int[] c = contagem.get(d);
            percentuais.put(d.name(), c[1] == 0 ? 0 : (int) Math.round(100.0 * c[0] / c[1]));
        }
        return percentuais;
    }

    /** Completude geral, ponderada pelos mesmos pesos das dimensões. */
    public int completudeGeral(Map<String, Object> respostas) {
        Map<String, Integer> porDim = completudePorDimensao(respostas);
        double soma = 0;
        for (DimensaoIqc d : DimensaoIqc.values()) soma += porDim.get(d.name()) * d.getPeso();
        return (int) Math.round(soma);
    }

    // ── Assinatura ──────────────────────────────────────────

    /**
     * Congela nome e registro de quem assinou. Cópia, não referência: o laudo
     * tem de continuar dizendo qual era o CREA na data da assinatura, mesmo
     * que a pessoa mude de registro ou saia da plataforma depois.
     */
    public void assinar(ParteAvaliacaoIqc parte, Usuario quem, String registroProfissional) {
        parte.setStatus(StatusParteIqc.FINALIZADA);
        parte.setAssinadoPorNome(quem.getNome());
        parte.setRegistroProfissional(registroProfissional);
        parte.setDataFinalizacao(LocalDateTime.now());
        parteRepository.save(parte);
    }
}
