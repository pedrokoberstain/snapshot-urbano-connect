package br.com.urbanoconnect.api.domain.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * ══════════════════════════════════════════════════════════════
 *  PARTE DA AVALIAÇÃO — a fatia de um profissional no laudo
 * ══════════════════════════════════════════════════════════════
 *
 *  A avaliação tinha um dono só, e quem não a criou não conseguia editá-la.
 *  Isso impedia o fluxo real: engenheiro, arquiteto e analista trabalhando no
 *  mesmo condomínio, cada um na sua parte.
 *
 *  Agora a avaliação é dividida em partes por especialidade. As respostas
 *  continuam num único jsonb — o motor de cálculo não muda —, mas quem pode
 *  gravar cada chave passa a depender da dimensão a que ela pertence.
 *
 *  {@code registroProfissional} é uma cópia tirada no momento da assinatura,
 *  não uma referência viva. Um laudo tem de continuar dizendo qual era o CREA
 *  de quem assinou naquela data, mesmo que a pessoa mude de registro depois.
 */
@Data
@Entity
@Table(
        name = "partes_avaliacao_iqc",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_parte_avaliacao_especialidade",
                columnNames = {"avaliacao_id", "especialidade"})
)
public class ParteAvaliacaoIqc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "avaliacao_id", nullable = false)
    @JsonIgnore
    private AvaliacaoIqc avaliacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EspecialidadeTecnica especialidade;

    /** Quem responde por esta parte. Nulo enquanto ninguém foi designado. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsavel_id")
    @JsonIgnore
    private Usuario responsavel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusParteIqc status = StatusParteIqc.AGUARDANDO;

    // ── Assinatura ──────────────────────────────────────────
    /** Nome de quem assinou, congelado na finalização. */
    @Column(name = "assinado_por_nome")
    private String assinadoPorNome;

    /** Ex.: "CREA-MT 12345". Congelado junto com o nome. */
    @Column(name = "registro_profissional")
    private String registroProfissional;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_finalizacao")
    private LocalDateTime dataFinalizacao;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_atribuicao")
    private LocalDateTime dataAtribuicao;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    @Transient
    @JsonIgnore
    public boolean isFinalizada() {
        return status == StatusParteIqc.FINALIZADA;
    }

    /** Nome do responsável para exibição, sem expor o objeto Usuario. */
    @Transient
    public String getResponsavelNome() {
        return responsavel != null ? responsavel.getNome() : null;
    }

    @PrePersist
    protected void prePersist() {
        if (dataAtribuicao == null) dataAtribuicao = LocalDateTime.now();
        dataAtualizacao = dataAtribuicao;
    }

    @PreUpdate
    protected void preUpdate() {
        dataAtualizacao = LocalDateTime.now();
    }
}
