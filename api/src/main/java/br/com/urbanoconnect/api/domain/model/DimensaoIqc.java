package br.com.urbanoconnect.api.domain.model;

/**
 * As 8 dimensões temáticas do IQC (Índice de Qualidade de Condomínios), seus
 * pesos regulamentares e a especialidade responsável pela coleta. A soma dos
 * pesos é 1,00 (100%).
 *
 * Fórmula: IQC = Σ (peso_d × Score_d), com Score_d normalizado de 0 a 100.
 * Fonte: metodologia consolidada v1.0 (documento urbanoconnect_001).
 *
 * O responsável deixou de ser texto livre e passou a ser
 * {@link EspecialidadeTecnica}: é ele que define quais dimensões cada
 * profissional pode preencher, então precisava ser verificável pelo compilador
 * e não uma string que ninguém confere.
 */
public enum DimensaoIqc {

    LOCALIZACAO      (0.15, "Localização",                         EspecialidadeTecnica.ANALISTA),
    PRODUTO          (0.12, "Produto & Estrutura Física",          EspecialidadeTecnica.ENGENHEIRO),
    AMENIDADES       (0.18, "Amenidades & Lazer",                  EspecialidadeTecnica.ARQUITETO),
    SEGURANCA        (0.12, "Segurança",                           EspecialidadeTecnica.ENGENHEIRO),
    SERVICOS         (0.08, "Serviços & Hospitalidade",            EspecialidadeTecnica.ANALISTA),
    SUSTENTABILIDADE (0.05, "Sustentabilidade",                    EspecialidadeTecnica.ENGENHEIRO),
    ECONOMICA        (0.15, "Econômica & Liquidez",                EspecialidadeTecnica.ANALISTA),
    MOBILIDADE       (0.15, "Mobilidade & Conectividade de Elite", EspecialidadeTecnica.ARQUITETO);

    private final double peso;
    private final String rotulo;
    private final EspecialidadeTecnica responsavel;

    DimensaoIqc(double peso, String rotulo, EspecialidadeTecnica responsavel) {
        this.peso = peso;
        this.rotulo = rotulo;
        this.responsavel = responsavel;
    }

    public double getPeso()   { return peso; }
    public String getRotulo() { return rotulo; }

    public EspecialidadeTecnica getResponsavel() { return responsavel; }

    /** Rótulo do responsável, para o catálogo consumido pelo front. */
    public String getResponsavelRotulo() { return responsavel.getRotulo(); }
}
