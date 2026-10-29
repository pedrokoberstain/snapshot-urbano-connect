package br.com.urbanoconnect.api.domain.model;

import java.util.List;

/**
 * Entrada do catálogo de variáveis do IQC: liga uma chave de resposta a uma
 * dimensão e define como normalizá-la para 0..100, além dos metadados de
 * apresentação (label, unidade) usados pelo formulário do front.
 *
 *  - {@code min}/{@code max}/{@code invertida} — usados quando CONTINUA.
 *  - {@code niveis} — usado quando ORDINAL (escala 0..niveis).
 *  - {@code categorias} — usado quando CATEGORICA (ordenada pior → melhor).
 */
public record VariavelIqc(
        String chave,
        DimensaoIqc dimensao,
        TipoVariavelIqc tipo,
        String label,
        String unidade,
        double min,
        double max,
        boolean invertida,
        int niveis,
        List<String> categorias
) {

    public static VariavelIqc binaria(String chave, DimensaoIqc dim, String label) {
        return new VariavelIqc(chave, dim, TipoVariavelIqc.BINARIA, label, null, 0, 0, false, 0, List.of());
    }

    public static VariavelIqc ordinal(String chave, DimensaoIqc dim, String label, int niveis) {
        return new VariavelIqc(chave, dim, TipoVariavelIqc.ORDINAL, label, null, 0, 0, false, niveis, List.of());
    }

    public static VariavelIqc continua(String chave, DimensaoIqc dim, String label, String unidade,
                                       double min, double max, boolean invertida) {
        return new VariavelIqc(chave, dim, TipoVariavelIqc.CONTINUA, label, unidade, min, max, invertida, 0, List.of());
    }

    /** Índice já pré-calculado na escala 0..100 (contínua direta). */
    public static VariavelIqc indice(String chave, DimensaoIqc dim, String label) {
        return new VariavelIqc(chave, dim, TipoVariavelIqc.CONTINUA, label, "0–100", 0, 100, false, 0, List.of());
    }

    public static VariavelIqc categorica(String chave, DimensaoIqc dim, String label, List<String> categorias) {
        return new VariavelIqc(chave, dim, TipoVariavelIqc.CATEGORICA, label, null, 0, 0, false, 0, categorias);
    }

    /**
     * Normaliza um valor bruto para a escala 0..100.
     * Retorna {@code null} quando o valor é nulo ou não interpretável (não respondido).
     */
    public Double normalizar(Object bruto) {
        if (bruto == null) return null;
        return switch (tipo) {
            case BINARIA -> ehVerdadeiro(bruto) ? 100.0 : 0.0;
            case ORDINAL -> {
                Double n = numero(bruto);
                if (n == null || niveis <= 0) yield null;
                double c = Math.max(0, Math.min(niveis, n));
                yield (c / niveis) * 100.0;
            }
            case CONTINUA -> {
                Double v = numero(bruto);
                if (v == null || max == min) yield null;
                double c = Math.max(min, Math.min(max, v));
                double frac = (c - min) / (max - min);
                if (invertida) frac = 1 - frac;
                yield frac * 100.0;
            }
            case CATEGORICA -> {
                if (categorias == null || categorias.size() < 2) yield null;
                String alvo = bruto.toString().trim();
                int idx = -1;
                for (int i = 0; i < categorias.size(); i++) {
                    if (categorias.get(i).equalsIgnoreCase(alvo)) { idx = i; break; }
                }
                if (idx < 0) yield null;
                yield (idx / (double) (categorias.size() - 1)) * 100.0;
            }
        };
    }

    private static boolean ehVerdadeiro(Object o) {
        if (o instanceof Boolean b) return b;
        if (o instanceof Number n) return n.doubleValue() != 0;
        String s = o.toString().trim().toLowerCase();
        return s.equals("true") || s.equals("sim") || s.equals("s") || s.equals("1");
    }

    private static Double numero(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(o.toString().trim().replace(",", "."));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
