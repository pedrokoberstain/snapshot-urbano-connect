package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.IndicadorEconomico;
import br.com.urbanoconnect.api.domain.repository.IndicadorEconomicoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class IndicadorEconomicoService {

    private static final String BCB_BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.%d/dados/ultimos/2?formato=json";

    // Códigos BCB
    private static final int SERIE_SELIC  = 432;
    private static final int SERIE_IPCA   = 433;
    private static final int SERIE_USD    = 1;

    @Autowired
    private IndicadorEconomicoRepository repository;

    @Autowired
    private RestTemplate restTemplate;

    private final ObjectMapper mapper = new ObjectMapper();

    public List<IndicadorEconomico> listar() {
        return repository.findAll();
    }

    @PostConstruct
    @Scheduled(cron = "0 30 8,12,18 * * MON-FRI", zone = "America/Sao_Paulo")
    public void atualizar() {
        System.out.println("[IndicadorEconomicoService] Iniciando atualização de indicadores BCB...");
        atualizarBcb(SERIE_SELIC, "SELIC",   "Taxa Selic",  "% a.a.");
        atualizarBcb(SERIE_IPCA,  "IPCA",    "IPCA",        "% mensal");
        atualizarBcb(SERIE_USD,   "USD_BRL", "Dolar (R$)",  "R$");
        System.out.println("[IndicadorEconomicoService] Indicadores atualizados.");
    }

    private void atualizarBcb(int serie, String simbolo, String nome, String unidade) {
        try {
            String url      = String.format(BCB_BASE, serie);
            String response = restTemplate.getForObject(url, String.class);

            JsonNode array = mapper.readTree(response);
            if (array == null || !array.isArray() || array.size() == 0) {
                System.err.println("[IndicadorEconomicoService] Resposta vazia para " + simbolo);
                return;
            }

            double valorAtual    = array.get(array.size() - 1).get("valor").asDouble();
            double valorAnterior = array.size() > 1 ? array.get(array.size() - 2).get("valor").asDouble() : valorAtual;
            double variacao      = valorAnterior != 0 ? ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100 : 0;

            salvar(simbolo, nome, valorAtual, variacao, unidade, "BCB");
            System.out.println("[IndicadorEconomicoService] " + simbolo + " → " + valorAtual + " " + unidade);

        } catch (Exception e) {
            System.err.println("[IndicadorEconomicoService] Erro ao buscar " + simbolo + ": " + e.getClass().getSimpleName() + " - " + e.getMessage());
        }
    }

    private void salvar(String simbolo, String nome, double valor, double variacao, String unidade, String fonte) {
        IndicadorEconomico ind = repository.findBySimbolo(simbolo).orElse(new IndicadorEconomico());
        ind.setSimbolo(simbolo);
        ind.setNome(nome);
        ind.setValor(valor);
        ind.setVariacao(Math.round(variacao * 100.0) / 100.0);
        ind.setUnidade(unidade);
        ind.setFonte(fonte);
        ind.setDataAtualizacao(LocalDateTime.now());
        repository.save(ind);
    }
}
