package br.com.urbanoconnect.api.domain.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * ══════════════════════════════════════════════════════════════
 *  AVALIAÇÃO IQC — Índice de Qualidade de Condomínios
 * ══════════════════════════════════════════════════════════════
 *
 *  Laudo técnico profissional de um condomínio (empreendimento). Diferente
 *  da calculadora de mercado pública (casas/fazendas), esta avaliação é
 *  restrita ao painel (ADMIN e CORRETOR PRO) e segue a metodologia das
 *  8 dimensões / 169 variáveis.
 *
 *  As respostas brutas do checklist ficam em {@code respostas} (jsonb),
 *  chaveadas pelo nome da variável. O motor de cálculo (IqcService) gera o
 *  score por dimensão (0 a 100), o score final ponderado e o tier.
 */
@Data
@Entity
@Table(name = "avaliacoes_iqc")
public class AvaliacaoIqc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Identidade do empreendimento avaliado ───────────────
    /**
     * Condomínio cadastrado. Opcional para não invalidar as avaliações
     * anteriores ao cadastro, que só têm os campos avulsos abaixo.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "condominio_id")
    @JsonIgnoreProperties({"criadoPor"})
    private Condominio condominio;

    /**
     * Cópia do nome/cidade/bairro/tipologia no momento da avaliação. Não é
     * redundância: o laudo tem de registrar o que foi avaliado naquela data,
     * ainda que o cadastro do condomínio mude ou seja desativado depois.
     */
    @Column(nullable = false)
    private String nomeCondominio;

    private String cidade;
    private String bairro;

    @Enumerated(EnumType.STRING)
    private TipoCondominio tipoCondominio;

    /** Vínculo opcional com um anúncio existente (nem todo condomínio é um imóvel cadastrado). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imovel_id")
    @JsonIgnoreProperties({"dadosRurais", "corretor"})
    private Imovel imovel;

    /** Quem criou/executou a avaliação (perito responsável / corretor / admin). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avaliador_id", nullable = false)
    @JsonIgnore
    private Usuario avaliador;

    // ── Respostas brutas do checklist (169 variáveis) ───────
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> respostas = new java.util.HashMap<>();

    // ── Scores normalizados por dimensão (0 a 100) ──────────
    @Column(name = "score_localizacao")      private Double scoreLocalizacao;
    @Column(name = "score_produto")          private Double scoreProduto;
    @Column(name = "score_amenidades")       private Double scoreAmenidades;
    @Column(name = "score_seguranca")        private Double scoreSeguranca;
    @Column(name = "score_servicos")         private Double scoreServicos;
    @Column(name = "score_sustentabilidade") private Double scoreSustentabilidade;
    @Column(name = "score_economica")        private Double scoreEconomica;
    @Column(name = "score_mobilidade")       private Double scoreMobilidade;

    // ── Bloco dos moradores (10% do resultado) ──────────────
    /**
     * Notas dos moradores por dimensão, chaveadas pelo nome da dimensão.
     * É o que permite ao laudo mostrar a divergência linha a linha — técnico
     * deu 91 em Amenidades, morador deu 50 — que costuma ser a informação
     * mais valiosa do relatório.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "scores_moradores_dimensao", columnDefinition = "jsonb")
    private Map<String, Double> scoresMoradoresPorDimensao;

    @Column(name = "score_moradores")
    private Double scoreMoradores;

    /** Opiniões que pontuaram (vínculo aprovado e 6+ meses de moradia). */
    @Column(name = "opinioes_consideradas")
    private Integer opinioesConsideradas;

    /** Opiniões registradas no total, inclusive as que não pontuaram. */
    @Column(name = "opinioes_registradas")
    private Integer opinioesRegistradas;

    /**
     * Falso quando faltou quórum de moradores. Precisa aparecer no laudo: sem
     * isso o leitor supõe que o score final já contempla os moradores.
     */
    @Column(name = "moradores_aplicado")
    private Boolean moradoresAplicado;

    // ── Resultado consolidado ───────────────────────────────
    /** Score só do laudo técnico, antes da mistura com os moradores (0 a 100). */
    @Column(name = "score_tecnico")
    private Double scoreTecnico;

    /**
     * Score final (0 a 100): 90% técnico + 10% moradores quando há quórum,
     * ou o técnico puro quando não há.
     */
    @Column(name = "score_final")
    private Double scoreFinal;

    @Enumerated(EnumType.STRING)
    private TierIqc tier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusAvaliacaoIqc status = StatusAvaliacaoIqc.RASCUNHO;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // ── Datas de ciclo de vida ──────────────────────────────
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_calculo")
    private LocalDateTime dataCalculo;

    @PrePersist
    protected void prePersist() {
        if (dataCriacao == null) dataCriacao = LocalDateTime.now();
    }
}
