package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.dto.iptu.ResultadoImportacao;
import br.com.urbanoconnect.api.domain.model.CadastroIptu;
import br.com.urbanoconnect.api.domain.repository.CadastroIptuRepository;
import org.apache.poi.ss.usermodel.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lê uma planilha (.xls/.xlsx/.csv) e atualiza, em massa, os valores de venal/IPTU
 * do cadastro de Tangará da Serra, casando pela inscrição imobiliária.
 * Inscrição existente → atualiza; inscrição nova → cria.
 */
@Service
public class ImportadorPlanilhaIptu {

    private static final Logger log = LoggerFactory.getLogger(ImportadorPlanilhaIptu.class);
    private static final String CIDADE = "Tangará da Serra";
    /** Captura o grupo de 10+ dígitos no fim da inscrição (lida com "73902 - 0108..." do BCI). */
    private static final Pattern INSCRICAO_FIM = Pattern.compile("(\\d{10,})$");

    private final CadastroIptuRepository repository;

    public ImportadorPlanilhaIptu(CadastroIptuRepository repository) {
        this.repository = repository;
    }

    private record Linha(String inscricao, BigDecimal valorVenal, BigDecimal imposto, Integer exercicio) {}

    @Transactional
    public ResultadoImportacao importar(MultipartFile arquivo) {
        List<Linha> linhas;
        try {
            String nome = arquivo.getOriginalFilename() == null ? "" : arquivo.getOriginalFilename().toLowerCase();
            linhas = nome.endsWith(".csv") ? lerCsv(arquivo) : lerExcel(arquivo);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Falha ao ler planilha IPTU", e);
            throw new IllegalArgumentException("Não foi possível ler o arquivo: " + e.getMessage());
        }

        Map<String, CadastroIptu> existentes = new HashMap<>();
        for (CadastroIptu c : repository.findByCidade(CIDADE)) existentes.put(c.getInscricao(), c);

        List<CadastroIptu> paraSalvar = new ArrayList<>();
        LocalDateTime agora = LocalDateTime.now();
        int atualizados = 0, criados = 0, ignorados = 0;

        for (Linha l : linhas) {
            if (l.inscricao() == null || l.inscricao().isBlank()) { ignorados++; continue; }
            if (l.valorVenal() == null && l.imposto() == null) { ignorados++; continue; }

            CadastroIptu c = existentes.get(l.inscricao());
            boolean novo = (c == null);
            if (novo) {
                c = new CadastroIptu();
                c.setCidade(CIDADE);
                c.setInscricao(l.inscricao());
                existentes.put(l.inscricao(), c);
            }
            if (l.valorVenal() != null) c.setValorVenal(l.valorVenal());
            if (l.imposto() != null)    c.setImposto(l.imposto());
            if (l.exercicio() != null)  c.setExercicio(l.exercicio());
            c.setFonte("PLANILHA");
            c.setDataAtualizacao(agora);

            paraSalvar.add(c);
            if (novo) criados++; else atualizados++;
        }

        repository.saveAll(paraSalvar);
        log.info("Reimportação IPTU: {} lidos, {} atualizados, {} criados, {} ignorados.",
                linhas.size(), atualizados, criados, ignorados);

        return new ResultadoImportacao(linhas.size(), atualizados, criados, ignorados,
                String.format("%d atualizados e %d criados de %d linhas lidas.",
                        atualizados, criados, linhas.size()));
    }

    // ── Leitura Excel (.xls / .xlsx) ───────────────────────────────────

    private List<Linha> lerExcel(MultipartFile arquivo) throws Exception {
        File tmp = File.createTempFile("iptu-import", ".tmp");
        try {
            arquivo.transferTo(tmp);
            try (Workbook wb = WorkbookFactory.create(tmp)) {
                Sheet sheet = wb.getSheetAt(0);
                Row header = sheet.getRow(sheet.getFirstRowNum());
                if (header == null) throw new IllegalArgumentException("Planilha sem cabeçalho.");

                int[] cols = mapearColunas(idx -> norm(getString(header.getCell(idx))), header.getLastCellNum());

                List<Linha> linhas = new ArrayList<>();
                int ini = sheet.getFirstRowNum() + 1, fim = sheet.getLastRowNum();
                for (int i = ini; i <= fim; i++) {
                    Row row = sheet.getRow(i);
                    if (row == null) continue;
                    String insc = extrairInscricao(getString(row.getCell(cols[0])));
                    BigDecimal venal = cols[1] >= 0 ? getNumero(row.getCell(cols[1])) : null;
                    BigDecimal imp   = cols[2] >= 0 ? getNumero(row.getCell(cols[2])) : null;
                    Integer ex       = cols[3] >= 0 ? getInteiro(row.getCell(cols[3])) : null;
                    linhas.add(new Linha(insc, venal, imp, ex));
                }
                return linhas;
            }
        } finally {
            tmp.delete();
        }
    }

    // ── Leitura CSV ────────────────────────────────────────────────────

    private List<Linha> lerCsv(MultipartFile arquivo) throws Exception {
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(arquivo.getInputStream(), StandardCharsets.UTF_8))) {
            String cabecalho = br.readLine();
            if (cabecalho == null) throw new IllegalArgumentException("CSV vazio.");
            char delim = cabecalho.chars().filter(c -> c == ';').count()
                    >= cabecalho.chars().filter(c -> c == ',').count() ? ';' : ',';

            List<String> heads = parseCsv(cabecalho, delim);
            int[] cols = mapearColunas(idx -> norm(idx < heads.size() ? heads.get(idx) : ""), (short) heads.size());

            List<Linha> linhas = new ArrayList<>();
            String linha;
            while ((linha = br.readLine()) != null) {
                if (linha.isBlank()) continue;
                List<String> c = parseCsv(linha, delim);
                String insc = extrairInscricao(em(c, cols[0]));
                BigDecimal venal = parseBr(em(c, cols[1]));
                BigDecimal imp   = parseBr(em(c, cols[2]));
                Integer ex       = cols[3] >= 0 && em(c, cols[3]) != null ? parseInt(em(c, cols[3])) : null;
                linhas.add(new Linha(insc, venal, imp, ex));
            }
            return linhas;
        }
    }

    // ── Mapeamento de colunas por nome de cabeçalho ────────────────────

    private interface Cabecalho { String at(int idx); }

    /** Retorna [colInscricao, colVenal, colImposto, colExercicio]. -1 = ausente. */
    private int[] mapearColunas(Cabecalho head, short qtdColunas) {
        int insc = -1, venal = -1, imp = -1, ex = -1;
        for (int i = 0; i < qtdColunas; i++) {
            String h = head.at(i);
            if (insc == -1 && h.contains("INSCRICAO")) insc = i;
            else if (venal == -1 && h.equals("VALORVENAL")) venal = i;
            else if (imp == -1 && (h.equals("IMPOSTO") || h.equals("IPTU") || h.equals("VALORIPTU"))) imp = i;
            else if (ex == -1 && h.contains("EXERCICIO")) ex = i;
        }
        if (insc == -1) {
            throw new IllegalArgumentException("Coluna de inscrição não encontrada (esperado IMO_INSCRICAO ou INSCRICAO).");
        }
        if (venal == -1 && imp == -1) {
            throw new IllegalArgumentException("Nenhuma coluna VALOR_VENAL ou IMPOSTO encontrada.");
        }
        return new int[]{insc, venal, imp, ex};
    }

    private static String extrairInscricao(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.isEmpty()) return null;
        Matcher m = INSCRICAO_FIM.matcher(s);
        return m.find() ? m.group(1) : s;
    }

    // ── Helpers de célula POI ──────────────────────────────────────────

    private static String getString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double d = cell.getNumericCellValue();
                yield (d == Math.floor(d) && !Double.isInfinite(d)) ? String.valueOf((long) d) : String.valueOf(d);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield cell.getStringCellValue(); }
                catch (Exception e) { yield String.valueOf(cell.getNumericCellValue()); }
            }
            default -> "";
        };
    }

    private static BigDecimal getNumero(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue());
            case STRING -> parseBr(cell.getStringCellValue());
            case FORMULA -> {
                try { yield BigDecimal.valueOf(cell.getNumericCellValue()); }
                catch (Exception e) { yield null; }
            }
            default -> null;
        };
    }

    private static Integer getInteiro(Cell cell) {
        BigDecimal v = getNumero(cell);
        return v == null ? null : v.intValue();
    }

    // ── Parsing numérico/texto ─────────────────────────────────────────

    /** Aceita "13.969,98" (BR), "13,969.98" (US) e "13969.98". */
    private static BigDecimal parseBr(String s) {
        if (s == null) return null;
        String v = s.trim().replaceAll("[^0-9.,-]", "");
        if (v.isEmpty()) return null;
        if (v.contains(",") && v.contains(".")) {
            v = v.lastIndexOf(',') > v.lastIndexOf('.')
                    ? v.replace(".", "").replace(",", ".")   // BR: ponto milhar, vírgula decimal
                    : v.replace(",", "");                    // US: vírgula milhar, ponto decimal
        } else if (v.contains(",")) {
            v = v.replace(",", ".");
        }
        try { return new BigDecimal(v); } catch (NumberFormatException e) { return null; }
    }

    private static Integer parseInt(String s) {
        BigDecimal v = parseBr(s);
        return v == null ? null : v.intValue();
    }

    private static String norm(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return n.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    private static String em(List<String> c, int idx) {
        if (idx < 0 || idx >= c.size()) return null;
        String v = c.get(idx).trim();
        return v.isEmpty() ? null : v;
    }

    private static List<String> parseCsv(String line, char delim) {
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
                else if (ch == delim) { out.add(sb.toString()); sb.setLength(0); }
                else sb.append(ch);
            }
        }
        out.add(sb.toString());
        return out;
    }
}
