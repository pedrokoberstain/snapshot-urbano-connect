package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.CotacaoAgro;
import br.com.urbanoconnect.api.domain.repository.CotacaoAgroRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Cotações agrícolas — fontes por produto:
 *  Soja      → Yahoo Finance ZS=F  (CBOT, USX/bushel → BRL/saca)
 *  Milho     → Alpha Vantage COMMODITY CORN   (cents/bushel → BRL/saca)
 *  Algodão   → Alpha Vantage COMMODITY COTTON (cents/lb    → BRL/@)
 *  Boi Gordo → Noticias Agrícolas (scraping CEPEA/Esalq, BRL/@)
 */
@Service
public class CotacaoAgroService {

    private static final String AV_COMMODITY = "https://www.alphavantage.co/query?function=%s&apikey=%s";
    private static final String BCB_USD      = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json";
    private static final String YF_CHART     = "https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=1d";
    private static final String NA_BOI_GORDO = "https://www.noticiasagricolas.com.br/cotacoes/boi-gordo";

    private static final double BUSHELS_POR_SACA_SOJA  = 2.2046;
    private static final double BUSHELS_POR_SACA_MILHO = 2.3622;
    private static final double LBS_POR_ARROBA_ALGODAO = 33.069;

    @Value("${alpha.vantage.key}")
    private String alphaKey;

    @Autowired private CotacaoAgroRepository repository;
    @Autowired private RestTemplate restTemplate;

    private final ObjectMapper mapper = new ObjectMapper();

    public List<CotacaoAgro> listarCotacoes() {
        return repository.findAll();
    }

    @PostConstruct
    @Scheduled(cron = "0 0 8,12,18 * * MON-FRI", zone = "America/Sao_Paulo")
    public void atualizarDadosMercado() {
        System.out.println("[CotacaoAgroService] Iniciando atualizacao...");

        double usdBrl = buscarUsdBrl();
        if (usdBrl <= 0) {
            System.err.println("[CotacaoAgroService] USD/BRL indisponivel. Abortando.");
            return;
        }

        atualizarSojaYahoo(usdBrl);
        aguardar(3000);
        atualizarCommodityAV("Milho (Saca 60kg)", "CORN",   usdBrl, BUSHELS_POR_SACA_MILHO);
        aguardar(12000);
        atualizarCommodityAV("Algodao (@)",        "COTTON", usdBrl, LBS_POR_ARROBA_ALGODAO);
        aguardar(3000);
        atualizarBoiGordoScraper();

        System.out.println("[CotacaoAgroService] Atualizacao concluida.");
    }

    // ── Soja via Yahoo Finance ZS=F ────────────────────────────────────
    private void atualizarSojaYahoo(double usdBrl) {
        try {
            String url = String.format(YF_CHART, "ZS=F");

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.set("Accept", "application/json");
            headers.set("Referer", "https://finance.yahoo.com/");

            String response = restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class).getBody();
            JsonNode root   = mapper.readTree(response);

            JsonNode result = root.path("chart").path("result");
            if (result.isMissingNode() || result.isNull() || result.isEmpty()) {
                System.err.println("[CotacaoAgroService] ZS=F: resposta vazia");
                return;
            }

            // Yahoo Finance retorna USX (cents por bushel) para ZS=F
            double precoUsx = result.get(0).path("meta").path("regularMarketPrice").asDouble();
            if (precoUsx <= 0) {
                System.err.println("[CotacaoAgroService] ZS=F: preco zerado");
                return;
            }

            // USX/bushel → USD/bushel (/100) → USD/saca (*2.2046) → BRL/saca (*usdBrl)
            double precoBrl = (precoUsx / 100.0) * BUSHELS_POR_SACA_SOJA * usdBrl;
            String valorFmt = String.format("R$ %.2f", precoBrl).replace(".", ",");

            salvar("Soja (Saca 60kg)", valorFmt, "n/d");
            System.out.println("[CotacaoAgroService] Soja -> " + valorFmt
                    + " (ZS=F " + precoUsx + " USX/bushel)");

        } catch (Exception e) {
            System.err.println("[CotacaoAgroService] Erro ZS=F: " + e.getMessage());
        }
    }

    // ── Boi Gordo via scraping Noticias Agricolas (CEPEA/Esalq) ───────
    private void atualizarBoiGordoScraper() {
        try {
            Document doc = Jsoup.connect(NA_BOI_GORDO)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .timeout(15000)
                    .get();

            // Primeira tabela da página = Boi Gordo CEPEA/Esalq
            Element tabela = doc.select("table.cot-fisicas").first();
            if (tabela == null) {
                System.err.println("[CotacaoAgroService] Boi Gordo: tabela nao encontrada");
                return;
            }

            Element linha = tabela.select("tbody tr").first();
            if (linha == null) {
                System.err.println("[CotacaoAgroService] Boi Gordo: linha nao encontrada");
                return;
            }

            Elements tds = linha.select("td");
            if (tds.size() < 2) {
                System.err.println("[CotacaoAgroService] Boi Gordo: colunas insuficientes");
                return;
            }

            String precoStr   = tds.get(1).text().trim(); // ex: "353,80"
            String variacaoStr = tds.size() > 2 ? tds.get(2).text().trim() : "n/d";

            double valor = Double.parseDouble(precoStr.replace(".", "").replace(",", "."));
            if (valor <= 0) {
                System.err.println("[CotacaoAgroService] Boi Gordo: valor zerado");
                return;
            }

            String valorFmt   = String.format("R$ %.2f", valor).replace(".", ",");
            String variacaoFmt = variacaoStr.isEmpty() ? "n/d" : variacaoStr.replace(",", ".");

            salvar("Boi Gordo (@)", valorFmt, variacaoFmt);
            System.out.println("[CotacaoAgroService] Boi Gordo -> " + valorFmt
                    + " var=" + variacaoFmt + " (CEPEA/Noticias Agricolas)");

        } catch (Exception e) {
            System.err.println("[CotacaoAgroService] Erro Boi Gordo scraper: " + e.getMessage());
        }
    }

    // ── Milho e Algodão via Alpha Vantage COMMODITY ────────────────────
    private void atualizarCommodityAV(String produto, String funcao, double usdBrl, double fatorConversao) {
        if (alphaKey == null || alphaKey.isBlank()) {
            System.out.println("[CotacaoAgroService] ALPHA_VANTAGE_KEY nao configurada, pulando " + produto);
            return;
        }
        try {
            String url      = String.format(AV_COMMODITY, funcao, alphaKey);
            String response = restTemplate.getForObject(url, String.class);
            JsonNode root   = mapper.readTree(response);

            JsonNode data = root.get("data");
            if (data == null || !data.isArray() || data.isEmpty()) {
                System.err.println("[CotacaoAgroService] " + funcao + ": sem dados");
                return;
            }

            // AV COMMODITY retorna em ordem ascendente — busca o ultimo valor valido (ignora ".")
            String valorStr = null;
            for (int i = data.size() - 1; i >= 0; i--) {
                String v = data.get(i).path("value").asText("");
                if (!v.isBlank() && !v.equals(".")) {
                    valorStr = v;
                    break;
                }
            }
            if (valorStr == null) {
                System.err.println("[CotacaoAgroService] " + funcao + ": valor indisponivel");
                return;
            }

            double precoBase = Double.parseDouble(valorStr);
            if (precoBase <= 0) {
                System.err.println("[CotacaoAgroService] " + funcao + ": valor zerado, ignorando");
                return;
            }

            double precoBrl = (precoBase / 100.0) * fatorConversao * usdBrl;
            String valorFmt = String.format("R$ %.2f", precoBrl).replace(".", ",");

            salvar(produto, valorFmt, "n/d");
            System.out.println("[CotacaoAgroService] " + produto + " -> " + valorFmt
                    + " (" + precoBase + " cents)");

        } catch (Exception e) {
            System.err.println("[CotacaoAgroService] Erro " + funcao + ": " + e.getMessage());
        }
    }

    // ── USD/BRL via BCB ────────────────────────────────────────────────
    private double buscarUsdBrl() {
        try {
            String response = restTemplate.getForObject(BCB_USD, String.class);
            JsonNode array  = mapper.readTree(response);
            if (array != null && array.isArray() && !array.isEmpty()) {
                double val = array.get(array.size() - 1).get("valor").asDouble();
                System.out.println("[CotacaoAgroService] USD/BRL = " + val);
                return val;
            }
        } catch (Exception e) {
            System.err.println("[CotacaoAgroService] Erro USD/BRL: " + e.getMessage());
        }
        return 0;
    }

    private void salvar(String produto, String valor, String variacao) {
        CotacaoAgro cotacao = repository.findByProduto(produto).orElse(new CotacaoAgro());
        cotacao.setProduto(produto);
        cotacao.setValor(valor);
        cotacao.setVariacao(variacao);
        cotacao.setDataAtualizacao(LocalDateTime.now());
        repository.save(cotacao);
    }

    private void aguardar(int ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) {}
    }
}
