package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.dto.iqc.ComponenteMoradores;
import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.AcessoCondominioRepository;
import br.com.urbanoconnect.api.domain.repository.OpiniaoMoradorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * ══════════════════════════════════════════════════════════════
 *  BLOCO DE MORADORES — 10% do IQC
 * ══════════════════════════════════════════════════════════════
 *
 *  As perguntas do morador são agrupadas nas mesmas 8 dimensões e ponderadas
 *  pelos mesmos pesos do laudo técnico. Por isso "90% técnico + 10% morador" e
 *  "90/10 dentro de cada dimensão" produzem o mesmo número — só muda como se
 *  conta a história.
 *
 *  Três travas, e cada uma resolve um problema concreto:
 *
 *  1. Mínimo de {@value #MINIMO_DE_OPINIOES} opiniões. Abaixo disso o bloco não
 *     entra. Com uma ou duas respostas, um morador irritado derruba o laudo e
 *     um síndico entusiasmado o infla.
 *
 *  2. Dimensão sem nenhuma resposta herda a nota técnica, em vez de virar
 *     zero. Ninguém pode ser punido porque os moradores pularam um assunto.
 *
 *  3. Só pontua quem tem vínculo aprovado e ao menos
 *     {@link AcessoCondominio#MESES_MINIMOS_DE_MORADIA} meses de casa. Quem
 *     entrou mês passado não tem como dizer quantas vezes faltou água no ano.
 *
 *  A média é por pergunta e depois por dimensão — não por morador. Assim quem
 *  respondeu tudo não pesa mais do que quem respondeu só o que conhece.
 */
@Service
public class OpiniaoMoradorService {

    public static final int MINIMO_DE_OPINIOES = 3;

    /** Fatia do morador no score final. O resto é o laudo técnico. */
    public static final double PESO_MORADORES = 0.10;

    @Autowired
    private OpiniaoMoradorRepository opiniaoRepository;

    @Autowired
    private AcessoCondominioRepository acessoRepository;

    /**
     * Calcula o bloco de moradores de um condomínio.
     *
     * @param scoresTecnicos notas técnicas por dimensão, usadas para preencher
     *                       as dimensões que nenhum morador respondeu.
     */
    public ComponenteMoradores calcular(Long condominioId, Map<DimensaoIqc, Double> scoresTecnicos) {
        List<OpiniaoMorador> todas = opiniaoRepository.listarDoCondominio(condominioId);
        if (todas.isEmpty()) {
            return ComponenteMoradores.naoAplicado(scoresTecnicos, 0, 0);
        }

        // Quem pode pontuar: vínculo de morador aprovado e tempo de casa suficiente.
        Map<Long, AcessoCondominio> vinculos = new HashMap<>();
        for (AcessoCondominio a : acessoRepository.findByCondominioIdAndPapelAndStatus(
                condominioId, PapelAcessoCondominio.MORADOR, StatusAcessoCondominio.APROVADO)) {
            if (a.getUsuario() != null) vinculos.put(a.getUsuario().getId(), a);
        }

        List<OpiniaoMorador> computaveis = new ArrayList<>();
        for (OpiniaoMorador o : todas) {
            AcessoCondominio vinculo = vinculos.get(o.getUsuario().getId());
            if (vinculo != null && vinculo.isOpiniaoValidaParaCalculo()) {
                computaveis.add(o);
            }
        }

        if (computaveis.size() < MINIMO_DE_OPINIOES) {
            return ComponenteMoradores.naoAplicado(scoresTecnicos, todas.size(), computaveis.size());
        }

        // Média por pergunta, entre todos os moradores que responderam aquela pergunta.
        Map<String, Double> mediaPorPergunta = new LinkedHashMap<>();
        for (PerguntaMorador p : CatalogoOpiniaoMorador.PERGUNTAS) {
            List<Double> notas = new ArrayList<>();
            for (OpiniaoMorador o : computaveis) {
                Double nota = p.normalizar(valor(o, p.chave()));
                if (nota != null) notas.add(nota);
            }
            if (!notas.isEmpty()) {
                mediaPorPergunta.put(p.chave(), media(notas));
            }
        }

        // Média das perguntas dentro de cada dimensão; sem resposta, herda a técnica.
        Map<DimensaoIqc, Double> porDimensao = new EnumMap<>(DimensaoIqc.class);
        for (DimensaoIqc d : DimensaoIqc.values()) {
            List<Double> notas = CatalogoOpiniaoMorador.PERGUNTAS.stream()
                    .filter(p -> p.dimensao() == d)
                    .map(p -> mediaPorPergunta.get(p.chave()))
                    .filter(Objects::nonNull)
                    .toList();

            porDimensao.put(d, notas.isEmpty()
                    ? valorTecnico(scoresTecnicos, d)
                    : arredondar(media(notas)));
        }

        double scoreMoradores = 0.0;
        for (DimensaoIqc d : DimensaoIqc.values()) {
            scoreMoradores += porDimensao.get(d) * d.getPeso();
        }

        return new ComponenteMoradores(
                porDimensao,
                arredondar(scoreMoradores),
                computaveis.size(),
                todas.size(),
                true,
                mediaPorVinculo(computaveis, vinculos, VinculoMorador.PROPRIETARIO),
                mediaPorVinculo(computaveis, vinculos, VinculoMorador.INQUILINO));
    }

    /**
     * Mistura o técnico com o morador. Sem quórum devolve o técnico intacto —
     * e não 90% dele, que penalizaria condomínio sem moradores cadastrados.
     */
    public double combinar(double scoreTecnico, ComponenteMoradores moradores) {
        if (moradores == null || !moradores.aplicado() || moradores.scoreMoradores() == null) {
            return scoreTecnico;
        }
        return arredondar((1 - PESO_MORADORES) * scoreTecnico
                + PESO_MORADORES * moradores.scoreMoradores());
    }

    /**
     * Confere as respostas antes de gravar e devolve os problemas por chave,
     * ou um mapa vazio quando está tudo certo.
     *
     * Recusar chave desconhecida em vez de ignorá-la é deliberado: um erro de
     * digitação no front viraria resposta perdida em silêncio, e ninguém
     * descobriria — a nota simplesmente sairia diferente do esperado.
     */
    public Map<String, String> validar(Map<String, Object> respostas) {
        Map<String, String> erros = new LinkedHashMap<>();
        if (respostas == null) return erros;

        for (Map.Entry<String, Object> e : respostas.entrySet()) {
            PerguntaMorador p = CatalogoOpiniaoMorador.porChave(e.getKey());
            if (p == null) {
                erros.put(e.getKey(), "Pergunta desconhecida.");
                continue;
            }

            Object bruto = e.getValue();
            if (bruto == null) continue;

            String texto = String.valueOf(bruto).trim();
            if (texto.isEmpty() || texto.equalsIgnoreCase("NAO_SEI")) continue;

            if (texto.equalsIgnoreCase("NAO_SE_APLICA")) {
                if (!p.permiteNaoSeAplica()) {
                    erros.put(e.getKey(), "Esta pergunta não aceita \"não se aplica\".");
                }
                continue;
            }

            if (p.tipo() == TipoPerguntaMorador.FREQUENCIA) {
                if (!p.opcoes().contains(texto)) {
                    erros.put(e.getKey(), "Use uma destas opções: " + String.join(", ", p.opcoes()) + ".");
                }
            } else if (p.normalizar(texto) == null) {
                erros.put(e.getKey(), "Informe uma nota de 0 a 10, \"NAO_SEI\""
                        + (p.permiteNaoSeAplica() ? " ou \"NAO_SE_APLICA\"." : "."));
            }
        }
        return erros;
    }

    // ── Internos ────────────────────────────────────────────

    private Object valor(OpiniaoMorador o, String chave) {
        return o.getRespostas() == null ? null : o.getRespostas().get(chave);
    }

    /** Dimensão sem opinião nenhuma vale o que o técnico deu; sem técnico, 0. */
    private double valorTecnico(Map<DimensaoIqc, Double> tecnicos, DimensaoIqc d) {
        if (tecnicos == null) return 0.0;
        Double v = tecnicos.get(d);
        return v == null ? 0.0 : v;
    }

    /**
     * Score geral de um único morador, para comparar proprietário e inquilino.
     * Os pesos são renormalizados sobre as dimensões que ele respondeu — quem
     * só falou de segurança não deve ter a nota diluída pelo que não respondeu.
     */
    private Double scoreDeUmMorador(OpiniaoMorador o) {
        Map<DimensaoIqc, List<Double>> porDim = new EnumMap<>(DimensaoIqc.class);
        for (PerguntaMorador p : CatalogoOpiniaoMorador.PERGUNTAS) {
            Double nota = p.normalizar(valor(o, p.chave()));
            if (nota != null) {
                porDim.computeIfAbsent(p.dimensao(), k -> new ArrayList<>()).add(nota);
            }
        }
        if (porDim.isEmpty()) return null;

        double soma = 0.0, pesoTotal = 0.0;
        for (Map.Entry<DimensaoIqc, List<Double>> e : porDim.entrySet()) {
            double peso = e.getKey().getPeso();
            soma += media(e.getValue()) * peso;
            pesoTotal += peso;
        }
        return pesoTotal == 0 ? null : arredondar(soma / pesoTotal);
    }

    private Double mediaPorVinculo(List<OpiniaoMorador> opinioes,
                                   Map<Long, AcessoCondominio> vinculos,
                                   VinculoMorador alvo) {
        List<Double> notas = new ArrayList<>();
        for (OpiniaoMorador o : opinioes) {
            AcessoCondominio v = vinculos.get(o.getUsuario().getId());
            if (v == null || v.getVinculo() != alvo) continue;
            Double nota = scoreDeUmMorador(o);
            if (nota != null) notas.add(nota);
        }
        return notas.isEmpty() ? null : arredondar(media(notas));
    }

    private static double media(List<Double> valores) {
        return valores.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private static double arredondar(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
