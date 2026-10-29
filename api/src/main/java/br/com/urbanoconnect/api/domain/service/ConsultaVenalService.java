package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.dto.iptu.ConsultaVenal;
import br.com.urbanoconnect.api.domain.dto.iptu.FichaImovel;
import br.com.urbanoconnect.api.domain.dto.iptu.PerfilBairro;
import br.com.urbanoconnect.api.domain.model.CadastroIptu;
import br.com.urbanoconnect.api.domain.repository.CadastroIptuRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Resolve uma estimativa de valor venal para auxiliar o cadastro de imóveis.
 *
 * <p>Dois modos:</p>
 * <ol>
 *   <li><b>Simples</b> (sem áreas informadas): valor exato pela inscrição ou, na falta,
 *       a média do venal do bairro — comportamento histórico.</li>
 *   <li><b>PGV</b> (com área do terreno e/ou construída): reproduz a Planta Genérica de
 *       Valores da prefeitura — {@code venal = R$/m² terreno × área do terreno
 *       + R$/m² construção (por padrão) × área construída}. O R$/m² de terreno vem da
 *       própria inscrição ou da média do bairro na base IPTU; o R$/m² de construção vem
 *       de uma tabela municipal por padrão (constante abaixo).</li>
 * </ol>
 */
@Service
public class ConsultaVenalService {

    private static final String CIDADE_PADRAO = "Tangará da Serra";
    private static final Pattern INSCRICAO_FIM = Pattern.compile("(\\d{10,})$");

    /**
     * Tabela de valores de construção (R$/m²) por padrão de acabamento — AJUSTÁVEL.
     * Calibrada à escala fiscal da base IPTU 2014 de Tangará (edificação média ~R$ 20 mil).
     * Índices: 0 = Baixo, 1 = Médio, 2 = Alto, 3 = Luxo.
     * Estes são valores fiscais (não de mercado/CUB); ajuste conforme a Tabela de Valores
     * de Construção do Código Tributário Municipal, se disponível.
     */
    private static final double[] CUSTO_M2_CONSTRUCAO = { 120.0, 180.0, 280.0, 420.0 };
    private static final int PADRAO_MEDIO = 1;

    /** Expansão de abreviações comuns nos bairros do cadastro municipal. */
    private static final Map<String, String> ABREV = new HashMap<>();
    static {
        ABREV.put("JD", "JARDIM");   ABREV.put("JRD", "JARDIM");
        ABREV.put("RES", "RESIDENCIAL");
        ABREV.put("VL", "VILA");
        ABREV.put("PQ", "PARQUE");   ABREV.put("PRQ", "PARQUE");
        ABREV.put("STA", "SANTA");   ABREV.put("STO", "SANTO");
        ABREV.put("CHAC", "CHACARA");
        ABREV.put("DISTR", "DISTRITO");
        ABREV.put("NUC", "NUCLEO");  ABREV.put("HABIT", "HABITACIONAL");
        ABREV.put("CONJ", "CONJUNTO");  ABREV.put("CJ", "CONJUNTO");
    }

    private final CadastroIptuRepository repository;

    public ConsultaVenalService(CadastroIptuRepository repository) {
        this.repository = repository;
    }

    /** Consulta simples (sem áreas) — mantém a assinatura histórica. */
    public ConsultaVenal consultar(String inscricaoRaw, String bairroRaw, String cidadeRaw) {
        return consultar(inscricaoRaw, bairroRaw, cidadeRaw, null, null, null);
    }

    /** Consulta com áreas → estimativa por PGV (terreno + construção). */
    public ConsultaVenal consultar(String inscricaoRaw, String bairroRaw, String cidadeRaw,
                                   Double areaTerreno, Double areaConstruida, Integer padrao) {

        String cidade = (cidadeRaw == null || cidadeRaw.isBlank()) ? CIDADE_PADRAO : cidadeRaw.trim();
        String inscricao = extrairInscricao(inscricaoRaw);
        Optional<CadastroIptu> reg = (inscricao != null)
                ? repository.findByCidadeAndInscricao(cidade, inscricao)
                : Optional.empty();

        boolean modoPgv = (areaTerreno != null && areaTerreno > 0)
                || (areaConstruida != null && areaConstruida > 0);

        if (!modoPgv) {
            return consultaSimples(cidade, inscricao, reg, bairroRaw);
        }

        // ── Modo PGV ─────────────────────────────────────────────────
        Double m2Terreno = null;
        String fonteBase = null;
        String bairroLabel = bairroRaw;
        int amostras = 0;

        if (reg.isPresent() && reg.get().getValorM2Terreno() != null && reg.get().getValorM2Terreno() > 0) {
            m2Terreno = reg.get().getValorM2Terreno();
            fonteBase = "PGV_INSCRICAO";
            bairroLabel = reg.get().getBairro() != null ? reg.get().getBairro() : bairroRaw;
            amostras = 1;
        } else if (bairroRaw != null && !bairroRaw.isBlank()) {
            List<String> usar = bairrosCompativeis(cidade, bairroRaw);
            if (!usar.isEmpty()) {
                List<Object[]> res = repository.mediaM2TerrenoPorBairros(cidade, usar);
                if (!res.isEmpty() && res.get(0)[0] != null) {
                    m2Terreno = ((Number) res.get(0)[0]).doubleValue();
                    amostras = ((Number) res.get(0)[1]).intValue();
                    fonteBase = "PGV_BAIRRO";
                    bairroLabel = String.join(" / ", usar);
                }
            }
        }

        double aTerreno = (areaTerreno != null && areaTerreno > 0) ? areaTerreno : 0;
        double aConstr = (areaConstruida != null && areaConstruida > 0) ? areaConstruida : 0;

        BigDecimal valorTerreno = (m2Terreno != null && aTerreno > 0)
                ? BigDecimal.valueOf(m2Terreno * aTerreno).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        double custoM2 = custoM2Construcao(padrao);
        BigDecimal valorConstrucao = (aConstr > 0)
                ? BigDecimal.valueOf(custoM2 * aConstr).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal venal = valorTerreno.add(valorConstrucao);

        if (venal.compareTo(BigDecimal.ZERO) <= 0) {
            return new ConsultaVenal(false, null, null, bairroRaw, 0,
                    "Sem R$/m² de terreno na base para este bairro e sem área construída informada.");
        }

        StringBuilder msg = new StringBuilder("Estimativa PGV: ");
        if (valorTerreno.signum() > 0) {
            msg.append("terreno ").append(fmt(aTerreno)).append(" m² × R$ ")
               .append(fmt(m2Terreno)).append("/m²");
        }
        if (valorConstrucao.signum() > 0) {
            if (valorTerreno.signum() > 0) msg.append(" + ");
            msg.append("construção ").append(fmt(aConstr)).append(" m² × R$ ")
               .append(fmt(custoM2)).append("/m²");
        }
        if ("PGV_BAIRRO".equals(fonteBase)) {
            msg.append(". R$/m² de terreno médio do bairro (").append(amostras).append(" imóveis).");
        } else if ("PGV_INSCRICAO".equals(fonteBase)) {
            msg.append(". R$/m² de terreno da própria inscrição.");
        } else {
            msg.append(" (sem base de terreno; apenas construção).");
        }

        String fonte = fonteBase != null ? fonteBase : "PGV_CONSTRUCAO";
        return new ConsultaVenal(true, venal, fonte, bairroLabel, amostras, msg.toString(),
                m2Terreno, valorTerreno, valorConstrucao);
    }

    /** Comportamento histórico: valor exato pela inscrição, ou média do venal do bairro. */
    private ConsultaVenal consultaSimples(String cidade, String inscricao,
                                          Optional<CadastroIptu> reg, String bairroRaw) {
        if (reg.isPresent() && reg.get().getValorVenal() != null) {
            CadastroIptu c = reg.get();
            return new ConsultaVenal(true, c.getValorVenal(), "INSCRICAO", c.getBairro(), 1,
                    "Valor venal exato da inscrição " + inscricao + ".");
        }

        if (bairroRaw != null && !bairroRaw.isBlank()) {
            List<String> usar = bairrosCompativeis(cidade, bairroRaw);
            if (!usar.isEmpty()) {
                List<Object[]> res = repository.mediaVenalPorBairros(cidade, usar);
                if (!res.isEmpty() && res.get(0)[0] != null) {
                    double avg = ((Number) res.get(0)[0]).doubleValue();
                    long qtd = ((Number) res.get(0)[1]).longValue();
                    BigDecimal venal = BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP);
                    return new ConsultaVenal(true, venal, "BAIRRO_MEDIA", String.join(" / ", usar), (int) qtd,
                            "Média do bairro (" + qtd + " imóveis no IPTU). Valor estimado.");
                }
            }
            return new ConsultaVenal(false, null, null, bairroRaw, 0,
                    "Sem dados de IPTU para esse bairro" + (inscricao != null ? " e inscrição não encontrada." : "."));
        }

        return new ConsultaVenal(false, null, null, null, 0,
                inscricao != null
                        ? "Inscrição não encontrada na base e nenhum bairro informado."
                        : "Informe a inscrição imobiliária ou o bairro.");
    }

    /**
     * Busca imóveis no cadastro por bairro + número. Retorna a lista de candidatos
     * (0..N) — a ambiguidade é esperada: em cidades pequenas o mesmo número (ex.
     * "713") aparece em várias ruas do mesmo bairro. Normaliza o número para
     * casar "713-S" com "713S" e "713 S". Quem escolhe o certo é o corretor.
     */
    public List<FichaImovel> buscarPorBairroNumero(String cidadeRaw, String bairroRaw, String numeroRaw) {
        String cidade = (cidadeRaw == null || cidadeRaw.isBlank()) ? CIDADE_PADRAO : cidadeRaw.trim();
        String numAlvo = normNumero(numeroRaw);
        if (bairroRaw == null || bairroRaw.isBlank() || numAlvo.isEmpty()) return Collections.emptyList();

        List<String> bairros = bairrosCompativeis(cidade, bairroRaw);
        if (bairros.isEmpty()) return Collections.emptyList();

        return repository.imoveisComEndereco(cidade, bairros).stream()
                .filter(c -> normNumero(c.getEndereco()).equals(numAlvo))
                .map(FichaImovel::de)
                .collect(Collectors.toList());
    }

    /**
     * Perfil médio do bairro para exibir no cadastro quando nenhum imóvel específico
     * casou (ou quando o corretor só quer entender a região). Retorna {@code null} se
     * o bairro não existe no cadastro.
     */
    public PerfilBairro perfilBairro(String cidadeRaw, String bairroRaw) {
        String cidade = (cidadeRaw == null || cidadeRaw.isBlank()) ? CIDADE_PADRAO : cidadeRaw.trim();
        if (bairroRaw == null || bairroRaw.isBlank()) return null;

        List<String> bairros = bairrosCompativeis(cidade, bairroRaw);
        if (bairros.isEmpty()) return null;

        List<Object[]> res = repository.agregadosBairro(cidade, bairros);
        if (res.isEmpty() || res.get(0)[0] == null) return null;

        Object[] r = res.get(0);
        long total    = ((Number) r[0]).longValue();
        long comBci   = ((Number) r[1]).longValue();
        if (total == 0) return null;

        Double avgVenal  = r[2] == null ? null : ((Number) r[2]).doubleValue();
        Double avgTerr   = r[3] == null ? null : ((Number) r[3]).doubleValue();
        Double avgConstr = r[4] == null ? null : ((Number) r[4]).doubleValue();

        return new PerfilBairro(
                cidade,
                String.join(" / ", bairros),
                (int) total,
                (int) comBci,
                arredonda(avgVenal),
                arredonda(avgTerr),
                arredonda(avgConstr),
                percent(r[5],  comBci),
                percent(r[6],  comBci),
                percent(r[7],  comBci),
                percent(r[8],  comBci),
                percent(r[9],  comBci),
                percent(r[10], comBci),
                percent(r[11], comBci),
                percent(r[12], comBci)
        );
    }

    private static Double arredonda(Double v) {
        if (v == null) return null;
        return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private static Integer percent(Object contagem, long universo) {
        if (universo == 0 || contagem == null) return null;
        return (int) Math.round(((Number) contagem).doubleValue() * 100.0 / universo);
    }

    /** Normalização para casar números com sufixo cardinal (713-S ↔ 713S ↔ 713 S). */
    private static String normNumero(String n) {
        if (n == null) return "";
        return n.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    /** Bairros do cadastro que casam com o bairro informado (exatos ou por conteúdo). */
    private List<String> bairrosCompativeis(String cidade, String bairroRaw) {
        String alvo = norm(bairroRaw);
        List<String> todos = repository.bairros(cidade);

        List<String> exatos = todos.stream()
                .filter(b -> norm(b).equals(alvo))
                .collect(Collectors.toList());
        if (!exatos.isEmpty()) return exatos;

        return todos.stream()
                .filter(b -> { String n = norm(b); return !alvo.isEmpty() && (n.contains(alvo) || alvo.contains(n)); })
                .collect(Collectors.toList());
    }

    private static double custoM2Construcao(Integer padrao) {
        int p = (padrao == null || padrao < 0 || padrao >= CUSTO_M2_CONSTRUCAO.length) ? PADRAO_MEDIO : padrao;
        return CUSTO_M2_CONSTRUCAO[p];
    }

    /** Formata número removendo o ".0" quando inteiro. */
    private static String fmt(double d) {
        if (d == Math.rint(d) && !Double.isInfinite(d)) return String.valueOf((long) d);
        return String.valueOf(Math.round(d * 100.0) / 100.0);
    }

    private static String extrairInscricao(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.isEmpty()) return null;
        Matcher m = INSCRICAO_FIM.matcher(s);
        return m.find() ? m.group(1) : s;
    }

    /** Normaliza bairro: maiúsculas, sem acento/pontuação, com abreviações expandidas. */
    private static String norm(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        n = n.toUpperCase().replace(".", " ").replaceAll("[^A-Z0-9 ]", " ");
        StringBuilder sb = new StringBuilder();
        for (String tok : n.trim().split("\\s+")) {
            if (tok.isEmpty()) continue;
            sb.append(ABREV.getOrDefault(tok, tok)).append(' ');
        }
        return sb.toString().trim().replaceAll("\\s+", " ");
    }
}
