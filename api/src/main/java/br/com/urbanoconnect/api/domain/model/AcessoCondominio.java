package br.com.urbanoconnect.api.domain.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * ══════════════════════════════════════════════════════════════
 *  ACESSO AO CONDOMÍNIO — quem pode o quê, em qual empreendimento
 * ══════════════════════════════════════════════════════════════
 *
 *  Uma tabela só para solicitação e concessão. O avaliador entra já APROVADO
 *  pela mão do admin; o morador entra PENDENTE com o comprovante anexado.
 *  Separar em duas tabelas duplicaria condomínio, usuário, papel e status sem
 *  ganhar expressividade.
 *
 *  O comprovante de residência é dado pessoal (nome, endereço, muitas vezes o
 *  CPF do titular). Aqui só fica o nome do arquivo no volume; o conteúdo nunca
 *  passa pelo CDN público e é apagado assim que a análise termina —
 *  {@code comprovanteRemovidoEm} guarda a prova de que foi apagado.
 */
@Data
@Entity
@Table(
        name = "acessos_condominio",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_acesso_condominio_usuario",
                columnNames = {"condominio_id", "usuario_id"})
)
public class AcessoCondominio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "condominio_id", nullable = false)
    @JsonIgnore
    private Condominio condominio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    @JsonIgnore
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PapelAcessoCondominio papel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusAcessoCondominio status = StatusAcessoCondominio.PENDENTE;

    // ── Só para MORADOR ─────────────────────────────────────
    /** Apartamento/bloco/lote, como aparece no comprovante. */
    private String unidade;

    @Enumerated(EnumType.STRING)
    private VinculoMorador vinculo;

    /**
     * Desde quando mora. Quem entrou mês passado não tem como responder
     * "quantas vezes faltou água nos últimos 12 meses" — a opinião é
     * registrada, mas só entra no cálculo a partir de 6 meses de moradia.
     */
    @Column(name = "morador_desde")
    private LocalDate moradorDesde;

    // ── Comprovante de residência ───────────────────────────
    /** Nome gerado no volume — nunca o nome enviado pelo usuário. */
    @Column(name = "comprovante_arquivo")
    @JsonIgnore
    private String comprovanteArquivo;

    @Column(name = "comprovante_nome_original")
    private String comprovanteNomeOriginal;

    @Column(name = "comprovante_tipo")
    private String comprovanteTipo;

    @Column(name = "comprovante_tamanho")
    private Long comprovanteTamanho;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "comprovante_removido_em")
    private LocalDateTime comprovanteRemovidoEm;

    // ── Análise ─────────────────────────────────────────────
    @Column(name = "motivo_recusa", columnDefinition = "TEXT")
    private String motivoRecusa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analisado_por_id")
    @JsonIgnore
    private Usuario analisadoPor;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_solicitacao", updatable = false)
    private LocalDateTime dataSolicitacao;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_analise")
    private LocalDateTime dataAnalise;

    @PrePersist
    protected void prePersist() {
        if (dataSolicitacao == null) dataSolicitacao = LocalDateTime.now();
    }

    // ── Consultas de conveniência ───────────────────────────

    @Transient
    @JsonIgnore
    public boolean isAprovado() {
        return status == StatusAcessoCondominio.APROVADO;
    }

    /** Meses completos de moradia, ou null quando a data não foi informada. */
    @Transient
    public Long getMesesDeMoradia() {
        if (moradorDesde == null) return null;
        return ChronoUnit.MONTHS.between(moradorDesde, LocalDate.now());
    }

    /**
     * Morador aprovado e com tempo de casa suficiente para que a opinião dele
     * entre no cálculo. Abaixo disso a resposta ainda é guardada e exibida no
     * laudo — só não pontua.
     */
    @Transient
    @JsonIgnore
    public boolean isOpiniaoValidaParaCalculo() {
        if (!isAprovado() || papel != PapelAcessoCondominio.MORADOR) return false;
        Long meses = getMesesDeMoradia();
        return meses != null && meses >= MESES_MINIMOS_DE_MORADIA;
    }

    public static final int MESES_MINIMOS_DE_MORADIA = 6;
}
