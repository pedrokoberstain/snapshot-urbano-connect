package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.Imovel;
import br.com.urbanoconnect.api.domain.repository.ImovelRepository;
import br.com.urbanoconnect.api.domain.dto.imovel.DadosPrecificacao;
import br.com.urbanoconnect.api.domain.dto.imovel.ResultadoPrecificacao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * ══════════════════════════════════════════════════════════════
 *  MOTOR DE PRECIFICAÇÃO HEDÔNICA — URBANO CONNECT
 * ══════════════════════════════════════════════════════════════
 *
 *  Modelo calibrado para a realidade imobiliária do Mato Grosso.
 *  Pesos ajustados para evitar distorções de preenchimento (ex: IPTU).
 */
@Service
public class PrecificacaoService {

    // ── Coeficientes do modelo calibrado (Mato Grosso) ──────────────
    private static final double B0  =  7.65;   // intercepto (base ajustada)
    private static final double B1  =  0.55;   // ln(area) - elasticidade realista
    private static final double B2  =  0.08;   // quartos
    private static final double B3  =  0.12;   // banheiros
    private static final double B4  =  0.15;   // padrao de acabamento
    private static final double B5  =  0.10;   // ln(valorVenal) - peso reduzido por segurança
    private static final double B6  = -0.08;   // distanciaCentro - penalidade por distância
    private static final double B7  =  0.12;   // sprawl - bônus por expansão
    private static final double B8  =  0.45;   // precoM2Bairro - âncora principal de mercado

    // ── Valores padrão quando campo não preenchido ────────────
    private static final double VALOR_VENAL_PADRAO     = 150_000.0;
    private static final double DISTANCIA_CENTRO_PADRAO = 5.0;
    private static final double PRECO_M2_PADRAO         = 3_200.0;
    private static final int    QUARTOS_PADRAO          = 2;
    private static final int    BANHEIROS_PADRAO        = 1;

    @Autowired
    private ImovelRepository imovelRepository;

    @Transactional
    public ResultadoPrecificacao calcular(Long imovelId, DadosPrecificacao dados) {

        Imovel imovel = imovelRepository.findById(imovelId)
                .orElseThrow(() -> new RuntimeException("Imóvel não encontrado: " + imovelId));

        // ── 1. Padrão de Acabamento (0 a 3, inteiro) ──────────
        int padrao = calcularPadrao(dados);

        // ── 2. Índice de Sprawl (0.0 a 3.0, decimal) ─────────
        double sprawl = calcularSprawl(dados);

        // ── 3. Coleta variáveis do imóvel ─────────────────────
        double area           = imovel.getAreaTotal() != null ? imovel.getAreaTotal() : 100.0;
        int    quartos        = imovel.getQuartos()   != null ? imovel.getQuartos()   : QUARTOS_PADRAO;
        int    banheiros      = imovel.getBanheiros() != null ? imovel.getBanheiros() : BANHEIROS_PADRAO;
        double valorVenal     = imovel.getValorVenal() != null && imovel.getValorVenal().doubleValue() > 0
                ? imovel.getValorVenal().doubleValue()
                : VALOR_VENAL_PADRAO;
        double distancia      = imovel.getDistanciaCentro() != null
                ? imovel.getDistanciaCentro()
                : DISTANCIA_CENTRO_PADRAO;
        double precoM2Bairro  = imovel.getPrecoM2Bairro() != null && imovel.getPrecoM2Bairro() > 0
                ? imovel.getPrecoM2Bairro()
                : PRECO_M2_PADRAO;

        // ── 4. Aplica o modelo hedônico ───────────────────────
        double lnP = B0
                + B1 * Math.log(area)
                + B2 * quartos
                + B3 * banheiros
                + B4 * padrao
                + B5 * Math.log(valorVenal)
                + B6 * distancia
                + B7 * sprawl
                + B8 * (precoM2Bairro / 1000.0);

        // P = e^ln(P)
        double precoEstimadoDouble = Math.exp(lnP);
        BigDecimal precoEstimado = BigDecimal.valueOf(precoEstimadoDouble)
                .setScale(2, RoundingMode.HALF_UP);

        // ── 5. Score de oportunidade ──────────────────────────
        double precoCadastradoDouble = imovel.getPreco().doubleValue();
        double score = precoCadastradoDouble / precoEstimadoDouble;
        double scoreArredondado = Math.round(score * 100.0) / 100.0;

        // ── 6. Faixas de confiança (±8%) ─────────────────────
        BigDecimal faixaMin = BigDecimal.valueOf(precoEstimadoDouble * 0.92)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal faixaMax = BigDecimal.valueOf(precoEstimadoDouble * 1.08)
                .setScale(2, RoundingMode.HALF_UP);

        // ── 7. Salva no banco ─────────────────────────────────
        imovel.setPadraoAcabamento(padrao);
        imovel.setSprawl(sprawl);
        imovel.setPrecoEstimado(precoEstimado);
        imovel.setScoreOportunidade(scoreArredondado);
        imovelRepository.save(imovel);

        // ── 8. Monta retorno ──────────────────────────────────
        return new ResultadoPrecificacao(
                precoEstimado,
                imovel.getPreco(),
                scoreArredondado,
                classificar(scoreArredondado),
                padrao,
                sprawl,
                faixaMin,
                faixaMax,
                descricaoPadrao(padrao),
                descricaoSprawl(sprawl)
        );
    }

    // ── Helpers privados ──────────────────────────────────────

    private int calcularPadrao(DadosPrecificacao d) {
        int piso       = coalesce(d.piso(),       1);
        int teto       = coalesce(d.teto(),       1);
        int esquadrias = coalesce(d.esquadrias(), 1);
        int bancadas   = coalesce(d.bancadas(),   1);
        double media = (piso + teto + esquadrias + bancadas) / 4.0;
        return (int) Math.round(media);
    }

    private double calcularSprawl(DadosPrecificacao d) {
        int rodovia      = coalesce(d.proximidadeRodovia(),  1);
        int crescimento  = coalesce(d.crescimentoBairro(),   1);
        int loteamentos  = coalesce(d.novosLoteamentos(),    1);
        double media = (rodovia + crescimento + loteamentos) / 3.0;
        return Math.round(media * 10.0) / 10.0;
    }

    private int coalesce(Integer val, int fallback) {
        return val != null ? Math.max(0, Math.min(3, val)) : fallback;
    }

    private String classificar(double score) {
        if (score < 0.90) return "OPORTUNIDADE";
        if (score <= 1.10) return "MERCADO";
        return "ACIMA_MERCADO";
    }

    private String descricaoPadrao(int padrao) {
        return switch (padrao) {
            case 0 -> "Padrão Baixo — acabamentos básicos (cerâmica, laje, esquadrias de ferro)";
            case 1 -> "Padrão Médio — porcelanato, gesso, esquadrias de alumínio";
            case 2 -> "Padrão Alto — mármore, luminotécnica, esquadrias Suprema/PVC";
            case 3 -> "Padrão Luxo — marble importado, automação, esquadrias minimalistas";
            default -> "Padrão não definido";
        };
    }

    private String descricaoSprawl(double sprawl) {
        if (sprawl < 1.0) return "Área consolidada — baixa expansão urbana no entorno";
        if (sprawl < 2.0) return "Área em transição — crescimento moderado";
        if (sprawl < 2.7) return "Área em expansão — novos loteamentos e valorização esperada";
        return "Frente de expansão ativa — alto potencial de valorização";
    }
}