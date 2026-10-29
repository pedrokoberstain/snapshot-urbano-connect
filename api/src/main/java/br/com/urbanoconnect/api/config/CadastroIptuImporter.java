package br.com.urbanoconnect.api.config;

import br.com.urbanoconnect.api.domain.repository.CadastroIptuRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Carrega a base IPTU de Tangara da Serra para {@code cadastro_iptu} no boot,
 * em duas etapas idempotentes:
 * <ol>
 *   <li><b>IPTU 2014</b> — CSV com inscricao, bairro, endereco, valor venal,
 *       imposto, aliquota, areas e valores por m2. So roda se a tabela estiver
 *       vazia para a cidade.</li>
 *   <li><b>BCI (Boletim de Cadastro Imobiliario)</b> — CSV com a ficha
 *       construtiva e infraestrutura de cada imovel. UPSERT por inscricao:
 *       atualiza os campos BCI se a linha existe (veio do IPTU 2014), cria
 *       linha nova se aparecer inscricao so no BCI. So roda se ainda nao
 *       ha nenhum registro com area_construida preenchida.</li>
 * </ol>
 */
@Component
public class CadastroIptuImporter implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CadastroIptuImporter.class);

    private static final String CIDADE = "Tangará da Serra";
    private static final String CSV_IPTU = "data/cadastro_iptu_tangara.csv";
    private static final String CSV_BCI  = "data/cadastro_iptu_bci_tangara.csv";
    private static final int LOTE = 1000;

    private static final String INSERT_IPTU = """
            INSERT INTO cadastro_iptu
                (cidade, inscricao, bairro, endereco, valor_venal, imposto, area_terreno,
                 valor_m2_terreno, valor_terreno, valor_edificacao, aliquota, exercicio, fonte, data_atualizacao)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """;

    // UPSERT do BCI: se a inscricao ja existe (veio do IPTU_2014), so atualiza os campos BCI.
    // Se aparecer inscricao nova, cria linha com fonte=PLANILHA_BCI e sem valor_venal.
    private static final String UPSERT_BCI = """
            INSERT INTO cadastro_iptu
                (cidade, inscricao, fonte, data_atualizacao,
                 caracterizacao, tipo_construcao, estado_conservacao, cobertura, revestimento,
                 piso, forro, posicao, instalacao_sanitaria, instalacao_eletrica,
                 situacao_terreno, topografia, pedologia,
                 area_construida, testada, numero_pavimentos,
                 tem_esgoto, tem_agua, tem_iluminacao_publica, tem_calcamento, tem_galeria_pluvial,
                 tem_coleta_lixo, tem_limpeza_urbana, tem_rede_telefonica, tem_guias_sarjetas,
                 esgoto_na_unidade, agua_na_unidade, poco_na_unidade, fossa_na_unidade,
                 tem_piscina, tem_sauna)
            VALUES (?,?,'PLANILHA_BCI',?,
                    ?,?,?,?,?,
                    ?,?,?,?,?,
                    ?,?,?,
                    ?,?,?,
                    ?,?,?,?,?,
                    ?,?,?,?,
                    ?,?,?,?,
                    ?,?)
            ON CONFLICT ON CONSTRAINT uk_cadastro_iptu_cidade_inscricao DO UPDATE SET
                caracterizacao         = EXCLUDED.caracterizacao,
                tipo_construcao        = EXCLUDED.tipo_construcao,
                estado_conservacao     = EXCLUDED.estado_conservacao,
                cobertura              = EXCLUDED.cobertura,
                revestimento           = EXCLUDED.revestimento,
                piso                   = EXCLUDED.piso,
                forro                  = EXCLUDED.forro,
                posicao                = EXCLUDED.posicao,
                instalacao_sanitaria   = EXCLUDED.instalacao_sanitaria,
                instalacao_eletrica    = EXCLUDED.instalacao_eletrica,
                situacao_terreno       = EXCLUDED.situacao_terreno,
                topografia             = EXCLUDED.topografia,
                pedologia              = EXCLUDED.pedologia,
                area_construida        = EXCLUDED.area_construida,
                testada                = EXCLUDED.testada,
                numero_pavimentos      = EXCLUDED.numero_pavimentos,
                tem_esgoto             = EXCLUDED.tem_esgoto,
                tem_agua               = EXCLUDED.tem_agua,
                tem_iluminacao_publica = EXCLUDED.tem_iluminacao_publica,
                tem_calcamento         = EXCLUDED.tem_calcamento,
                tem_galeria_pluvial    = EXCLUDED.tem_galeria_pluvial,
                tem_coleta_lixo        = EXCLUDED.tem_coleta_lixo,
                tem_limpeza_urbana     = EXCLUDED.tem_limpeza_urbana,
                tem_rede_telefonica    = EXCLUDED.tem_rede_telefonica,
                tem_guias_sarjetas     = EXCLUDED.tem_guias_sarjetas,
                esgoto_na_unidade      = EXCLUDED.esgoto_na_unidade,
                agua_na_unidade        = EXCLUDED.agua_na_unidade,
                poco_na_unidade        = EXCLUDED.poco_na_unidade,
                fossa_na_unidade       = EXCLUDED.fossa_na_unidade,
                tem_piscina            = EXCLUDED.tem_piscina,
                tem_sauna              = EXCLUDED.tem_sauna,
                data_atualizacao       = EXCLUDED.data_atualizacao
            """;

    private final CadastroIptuRepository repository;
    private final JdbcTemplate jdbc;

    public CadastroIptuImporter(CadastroIptuRepository repository, JdbcTemplate jdbc) {
        this.repository = repository;
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) throws Exception {
        importarIptu();
        enriquecerComBci();
    }

    // ── Etapa 1: cadastro IPTU 2014 (base valor venal/aliquota/areas) ────────

    private void importarIptu() throws Exception {
        if (repository.countByCidade(CIDADE) > 0) {
            log.info("Cadastro IPTU de {} já carregado — importação ignorada.", CIDADE);
            return;
        }
        ClassPathResource recurso = new ClassPathResource(CSV_IPTU);
        if (!recurso.exists()) {
            log.warn("CSV {} não encontrado — importação do IPTU ignorada.", CSV_IPTU);
            return;
        }

        Timestamp agora = Timestamp.valueOf(LocalDateTime.now());
        List<Object[]> lote = new ArrayList<>(LOTE);
        int total = 0;

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(recurso.getInputStream(), StandardCharsets.UTF_8))) {
            br.readLine(); // cabeçalho
            String linha;
            while ((linha = br.readLine()) != null) {
                if (linha.isBlank()) continue;
                List<String> c = parseLine(linha);

                Object[] params = {
                        CIDADE,
                        str(c, 0),          // inscricao
                        str(c, 1),          // bairro
                        str(c, 2),          // endereco
                        bd(c, 3),           // valor_venal
                        bd(c, 4),           // imposto
                        dbl(c, 5),          // area_terreno
                        dbl(c, 6),          // valor_m2_terreno
                        dbl(c, 7),          // valor_terreno
                        dbl(c, 8),          // valor_edificacao
                        dbl(c, 9),          // aliquota
                        intg(c, 10),        // exercicio
                        "PLANILHA",
                        agora
                };
                lote.add(params);

                if (lote.size() >= LOTE) {
                    total += inserirIptu(lote);
                    lote.clear();
                }
            }
            if (!lote.isEmpty()) total += inserirIptu(lote);
        }

        log.info("Cadastro IPTU de {} importado: {} registros.", CIDADE, total);
    }

    private int inserirIptu(List<Object[]> lote) {
        jdbc.batchUpdate(INSERT_IPTU, lote, lote.size(), (ps, p) -> {
            for (int i = 0; i < p.length; i++) {
                if (p[i] == null) {
                    ps.setNull(i + 1, Types.NULL);
                } else if (p[i] instanceof BigDecimal bd) {
                    ps.setBigDecimal(i + 1, bd);
                } else if (p[i] instanceof Double d) {
                    ps.setDouble(i + 1, d);
                } else if (p[i] instanceof Integer n) {
                    ps.setInt(i + 1, n);
                } else if (p[i] instanceof Timestamp t) {
                    ps.setTimestamp(i + 1, t);
                } else {
                    ps.setString(i + 1, p[i].toString());
                }
            }
        });
        return lote.size();
    }

    // ── Etapa 2: BCI (ficha construtiva + infraestrutura da prefeitura) ─────

    private void enriquecerComBci() throws Exception {
        if (repository.countByCidadeAndAreaConstruidaIsNotNull(CIDADE) > 0) {
            log.info("Enriquecimento BCI de {} já feito — etapa ignorada.", CIDADE);
            return;
        }
        ClassPathResource recurso = new ClassPathResource(CSV_BCI);
        if (!recurso.exists()) {
            log.warn("CSV {} não encontrado — enriquecimento BCI ignorado.", CSV_BCI);
            return;
        }

        Timestamp agora = Timestamp.valueOf(LocalDateTime.now());
        List<Object[]> lote = new ArrayList<>(LOTE);
        int total = 0;

        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(recurso.getInputStream(), StandardCharsets.UTF_8))) {
            br.readLine(); // cabeçalho
            String linha;
            while ((linha = br.readLine()) != null) {
                if (linha.isBlank()) continue;
                List<String> c = parseLine(linha);
                if (c.isEmpty() || c.get(0).isBlank()) continue;

                // Ordem exatamente a mesma do CSV gerado:
                // 0 inscricao | 1..13 enums | 14 area_construida | 15 testada | 16 num_pavimentos
                // 17..25 servicos rua (9 bool) | 26..29 servicos unidade (4 bool)
                // 30 tem_piscina | 31 tem_sauna
                Object[] params = {
                        CIDADE,
                        str(c, 0),         // inscricao
                        agora,             // data_atualizacao
                        str(c, 1),         // caracterizacao
                        str(c, 2),         // tipo_construcao
                        str(c, 3),         // estado_conservacao
                        str(c, 4),         // cobertura
                        str(c, 5),         // revestimento
                        str(c, 6),         // piso
                        str(c, 7),         // forro
                        str(c, 8),         // posicao
                        str(c, 9),         // instalacao_sanitaria
                        str(c, 10),        // instalacao_eletrica
                        str(c, 11),        // situacao_terreno
                        str(c, 12),        // topografia
                        str(c, 13),        // pedologia
                        dbl(c, 14),        // area_construida
                        dbl(c, 15),        // testada
                        intg(c, 16),       // numero_pavimentos
                        bool(c, 17),       // tem_esgoto
                        bool(c, 18),       // tem_agua
                        bool(c, 19),       // tem_iluminacao_publica
                        bool(c, 20),       // tem_calcamento
                        bool(c, 21),       // tem_galeria_pluvial
                        bool(c, 22),       // tem_coleta_lixo
                        bool(c, 23),       // tem_limpeza_urbana
                        bool(c, 24),       // tem_rede_telefonica
                        bool(c, 25),       // tem_guias_sarjetas
                        bool(c, 26),       // esgoto_na_unidade
                        bool(c, 27),       // agua_na_unidade
                        bool(c, 28),       // poco_na_unidade
                        bool(c, 29),       // fossa_na_unidade
                        bool(c, 30),       // tem_piscina
                        bool(c, 31)        // tem_sauna
                };
                lote.add(params);

                if (lote.size() >= LOTE) {
                    total += aplicarBci(lote);
                    lote.clear();
                }
            }
            if (!lote.isEmpty()) total += aplicarBci(lote);
        }

        log.info("Enriquecimento BCI de {}: {} linhas aplicadas (upsert por inscrição).", CIDADE, total);
    }

    private int aplicarBci(List<Object[]> lote) {
        jdbc.batchUpdate(UPSERT_BCI, lote, lote.size(), (ps, p) -> {
            for (int i = 0; i < p.length; i++) {
                if (p[i] == null) {
                    ps.setNull(i + 1, Types.NULL);
                } else if (p[i] instanceof Boolean b) {
                    ps.setBoolean(i + 1, b);
                } else if (p[i] instanceof Double d) {
                    ps.setDouble(i + 1, d);
                } else if (p[i] instanceof Integer n) {
                    ps.setInt(i + 1, n);
                } else if (p[i] instanceof Timestamp t) {
                    ps.setTimestamp(i + 1, t);
                } else {
                    ps.setString(i + 1, p[i].toString());
                }
            }
        });
        return lote.size();
    }

    // ── Parsing CSV (delimitador ';', com aspas opcionais) ──────────────

    private static List<String> parseLine(String line) {
        List<String> out = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (inQuotes) {
                if (ch == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') { sb.append('"'); i++; }
                    else inQuotes = false;
                } else sb.append(ch);
            } else {
                if (ch == '"') inQuotes = true;
                else if (ch == ';') { out.add(sb.toString()); sb.setLength(0); }
                else sb.append(ch);
            }
        }
        out.add(sb.toString());
        return out;
    }

    private static String str(List<String> c, int i) {
        if (i >= c.size()) return null;
        String v = c.get(i).trim();
        return v.isEmpty() ? null : v;
    }

    private static BigDecimal bd(List<String> c, int i) {
        String v = str(c, i);
        return v == null ? null : new BigDecimal(v);
    }

    private static Double dbl(List<String> c, int i) {
        String v = str(c, i);
        return v == null ? null : Double.valueOf(v);
    }

    private static Integer intg(List<String> c, int i) {
        String v = str(c, i);
        return v == null ? null : Integer.valueOf(v);
    }

    /** true / false (case-insensitive). Vazio ou desconhecido vira null. */
    private static Boolean bool(List<String> c, int i) {
        String v = str(c, i);
        if (v == null) return null;
        String u = v.toLowerCase();
        if (u.equals("true"))  return Boolean.TRUE;
        if (u.equals("false")) return Boolean.FALSE;
        return null;
    }
}
