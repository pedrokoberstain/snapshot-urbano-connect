package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.dto.iqc.CatalogoIqcResposta;
import br.com.urbanoconnect.api.domain.dto.iqc.CatalogoIqcResposta.DimensaoCatalogo;
import br.com.urbanoconnect.api.domain.dto.iqc.CatalogoIqcResposta.VariavelCatalogo;
import br.com.urbanoconnect.api.domain.dto.iqc.ComponenteMoradores;
import br.com.urbanoconnect.api.domain.dto.iqc.ResultadoCalculoIqc;
import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.AvaliacaoIqcRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ══════════════════════════════════════════════════════════════
 *  MOTOR DE CÁLCULO DO IQC — Índice de Qualidade de Condomínios
 * ══════════════════════════════════════════════════════════════
 *
 *  Pipeline: respostas brutas → normalização (0..100) por variável →
 *  score por dimensão → soma ponderada pelos pesos regulamentares → tier.
 *
 *  Política de agregação (MVP): dentro de uma dimensão, a variável binária
 *  não respondida conta como ausência (0). Ordinal/contínua não respondida
 *  é ignorada. O score da dimensão é a média dos valores coletados.
 */
@Service
public class IqcService {

    @Autowired
    private AvaliacaoIqcRepository avaliacaoIqcRepository;

    @Autowired
    private OpiniaoMoradorService opiniaoMoradorService;

    // ── Catálogo estruturado para o formulário do front ─────────────
    public CatalogoIqcResposta catalogo() {
        List<DimensaoCatalogo> dimensoes = new ArrayList<>();
        for (DimensaoIqc d : DimensaoIqc.values()) {
            List<VariavelCatalogo> vars = CatalogoIqc.VARIAVEIS.stream()
                    .filter(v -> v.dimensao() == d)
                    .map(v -> new VariavelCatalogo(
                            v.chave(),
                            v.label(),
                            v.tipo().name(),
                            v.unidade(),
                            v.tipo() == TipoVariavelIqc.ORDINAL ? v.niveis() : null,
                            v.categorias().isEmpty() ? null : v.categorias()))
                    .toList();
            dimensoes.add(new DimensaoCatalogo(
                    d.name(), d.getRotulo(), (int) Math.round(d.getPeso() * 100),
                    d.getResponsavelRotulo(), vars));
        }
        return new CatalogoIqcResposta(dimensoes);
    }

    // ── Cálculo puro (sem banco) — fácil de testar ──────────────────
    public ResultadoCalculoIqc computar(Map<String, Object> respostas) {
        Map<String, Object> dados = respostas != null ? respostas : Map.of();

        // Acumula as sub-notas de cada dimensão
        Map<DimensaoIqc, List<Double>> porDimensao = new EnumMap<>(DimensaoIqc.class);
        for (DimensaoIqc d : DimensaoIqc.values()) porDimensao.put(d, new ArrayList<>());

        for (VariavelIqc v : CatalogoIqc.VARIAVEIS) {
            Double nota = v.normalizar(dados.get(v.chave()));
            if (nota != null) {
                porDimensao.get(v.dimensao()).add(nota);
            } else if (v.tipo() == TipoVariavelIqc.BINARIA) {
                porDimensao.get(v.dimensao()).add(0.0); // ausência = 0
            }
        }

        // Score por dimensão + soma ponderada
        Map<DimensaoIqc, Double> scores = new EnumMap<>(DimensaoIqc.class);
        double scoreFinal = 0.0;
        for (DimensaoIqc d : DimensaoIqc.values()) {
            List<Double> notas = porDimensao.get(d);
            double media = notas.isEmpty() ? 0.0
                    : notas.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double arredondado = arredondar(media);
            scores.put(d, arredondado);
            scoreFinal += arredondado * d.getPeso();
        }
        scoreFinal = arredondar(scoreFinal);

        return new ResultadoCalculoIqc(scores, scoreFinal, TierIqc.deScore(scoreFinal));
    }

    // ── Calcula e persiste sobre uma avaliação existente ────────────
    /**
     * Roda o motor técnico e, quando a avaliação aponta para um condomínio
     * cadastrado, mistura o bloco dos moradores: 90% técnico + 10% morador.
     *
     * Avaliação sem condomínio cadastrado (formato antigo) não tem a quem
     * perguntar, e fica 100% técnica — sem penalidade, porque o peso do
     * morador não é descontado, é simplesmente não aplicado.
     */
    @Transactional
    public AvaliacaoIqc calcular(Long avaliacaoId) {
        AvaliacaoIqc av = avaliacaoIqcRepository.findById(avaliacaoId)
                .orElseThrow(() -> new RuntimeException("Avaliação IQC não encontrada: " + avaliacaoId));

        ResultadoCalculoIqc r = computar(av.getRespostas());
        aplicar(av, r);

        ComponenteMoradores moradores = av.getCondominio() != null
                ? opiniaoMoradorService.calcular(av.getCondominio().getId(), r.scoresPorDimensao())
                : null;
        aplicarMoradores(av, r, moradores);

        av.setStatus(StatusAvaliacaoIqc.CONCLUIDA);
        av.setDataCalculo(LocalDateTime.now());
        return avaliacaoIqcRepository.save(av);
    }

    /**
     * Grava o bloco dos moradores e recalcula o final. O score técnico fica
     * preservado em campo próprio: sem ele, ninguém consegue auditar depois
     * quanto da nota veio da vistoria e quanto veio das opiniões.
     */
    private void aplicarMoradores(AvaliacaoIqc av, ResultadoCalculoIqc r, ComponenteMoradores m) {
        av.setScoreTecnico(r.scoreFinal());

        if (m == null) {
            av.setScoresMoradoresPorDimensao(null);
            av.setScoreMoradores(null);
            av.setOpinioesConsideradas(0);
            av.setOpinioesRegistradas(0);
            av.setMoradoresAplicado(false);
            return;
        }

        Map<String, Double> porNome = new LinkedHashMap<>();
        m.scoresPorDimensao().forEach((dim, nota) -> porNome.put(dim.name(), nota));

        av.setScoresMoradoresPorDimensao(porNome);
        av.setScoreMoradores(m.scoreMoradores());
        av.setOpinioesConsideradas(m.opinioesConsideradas());
        av.setOpinioesRegistradas(m.opinioesRegistradas());
        av.setMoradoresAplicado(m.aplicado());

        double finalCombinado = opiniaoMoradorService.combinar(r.scoreFinal(), m);
        av.setScoreFinal(finalCombinado);
        av.setTier(TierIqc.deScore(finalCombinado));
    }

    private void aplicar(AvaliacaoIqc av, ResultadoCalculoIqc r) {
        Map<DimensaoIqc, Double> m = r.scoresPorDimensao();
        av.setScoreLocalizacao(m.get(DimensaoIqc.LOCALIZACAO));
        av.setScoreProduto(m.get(DimensaoIqc.PRODUTO));
        av.setScoreAmenidades(m.get(DimensaoIqc.AMENIDADES));
        av.setScoreSeguranca(m.get(DimensaoIqc.SEGURANCA));
        av.setScoreServicos(m.get(DimensaoIqc.SERVICOS));
        av.setScoreSustentabilidade(m.get(DimensaoIqc.SUSTENTABILIDADE));
        av.setScoreEconomica(m.get(DimensaoIqc.ECONOMICA));
        av.setScoreMobilidade(m.get(DimensaoIqc.MOBILIDADE));
        av.setScoreFinal(r.scoreFinal());
        av.setTier(r.tier());
    }

    private static double arredondar(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
