package br.com.urbanoconnect.api.domain.model;

import java.util.Arrays;
import java.util.List;

/**
 * ══════════════════════════════════════════════════════════════
 *  ESPECIALIDADE TÉCNICA — quem responde por qual parte do laudo
 * ══════════════════════════════════════════════════════════════
 *
 *  A metodologia sempre dividiu as 8 dimensões entre três profissionais; o que
 *  faltava era o sistema levar isso a sério. Antes, qualquer avaliador
 *  preenchia tudo — e um arquiteto chutando especificação estrutural é
 *  exatamente como um checklist se enche de ruído sem ninguém perceber.
 *
 *  Agora cada especialidade só enxerga e só grava as dimensões dela.
 *
 *  ENGENHEIRO e ARQUITETO têm conselho (CREA e CAU) com consulta pública, e
 *  são obrigatórios para concluir o laudo. ANALISTA não tem conselho — é
 *  designação interna — e por isso não trava a conclusão.
 */
public enum EspecialidadeTecnica {

    ENGENHEIRO("Engenheiro", "CREA", true),
    ARQUITETO ("Arquiteto",  "CAU",  true),
    ANALISTA  ("Analista",   null,   false);

    private final String rotulo;
    /** Conselho de classe, ou null quando a profissão não tem um. */
    private final String conselho;
    /** Se a parte precisa estar finalizada para o laudo poder concluir. */
    private final boolean obrigatoriaParaConcluir;

    EspecialidadeTecnica(String rotulo, String conselho, boolean obrigatoriaParaConcluir) {
        this.rotulo = rotulo;
        this.conselho = conselho;
        this.obrigatoriaParaConcluir = obrigatoriaParaConcluir;
    }

    public String getRotulo()      { return rotulo; }
    public String getConselho()    { return conselho; }
    public boolean isObrigatoriaParaConcluir() { return obrigatoriaParaConcluir; }
    public boolean temConselho()   { return conselho != null; }

    /**
     * Dimensões sob responsabilidade desta especialidade.
     *
     * Calculado a partir de {@link DimensaoIqc} em vez de duplicado aqui: as
     * duas listas divergiriam na primeira vez que alguém mudasse só uma.
     */
    public List<DimensaoIqc> dimensoes() {
        return Arrays.stream(DimensaoIqc.values())
                .filter(d -> d.getResponsavel() == this)
                .toList();
    }

    /** Peso somado das dimensões desta especialidade (0 a 1). */
    public double pesoTotal() {
        return dimensoes().stream().mapToDouble(DimensaoIqc::getPeso).sum();
    }

    /** As que travam a conclusão do laudo. */
    public static List<EspecialidadeTecnica> obrigatorias() {
        return Arrays.stream(values()).filter(EspecialidadeTecnica::isObrigatoriaParaConcluir).toList();
    }
}
