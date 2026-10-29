package br.com.urbanoconnect.api.domain.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ══════════════════════════════════════════════════════════════
 *  CREDENCIAL PROFISSIONAL — quem é engenheiro, arquiteto, analista
 * ══════════════════════════════════════════════════════════════
 *
 *  Todo mundo entra na plataforma como cliente. Ser engenheiro é uma
 *  credencial verificada por cima disso, não um tipo de conta separado.
 *
 *  Poderia ser um valor a mais no TipoUsuario. Não é, por três razões:
 *
 *  1. Registro profissional VENCE e pode ser suspenso. Um valor de enum não
 *     sabe dizer "válida até 03/2027" nem "revogada por inadimplência", e é
 *     preciso poder tirar de alguém a capacidade de assinar laudo sem apagar
 *     a conta dela.
 *  2. Uma pessoa acumula papéis. O engenheiro mora num condomínio. Com enum
 *     único ele escolheria entre ser engenheiro e ser morador do próprio
 *     prédio.
 *  3. TipoUsuario vira role do Spring Security. Três valores novos
 *     multiplicariam a matriz de permissão de todas as rotas do sistema.
 *
 *  ENGENHEIRO e ARQUITETO têm conselho com consulta pública — o número
 *  informado é conferível na fonte, o que vale muito mais do que olhar um PDF
 *  que qualquer um forja. ANALISTA não tem conselho: é designação interna, e
 *  por isso nasce aprovada pela mão do ADMIN, sem documento.
 */
@Data
@Entity
@Table(
        name = "credenciais_profissionais",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_credencial_usuario_profissao",
                columnNames = {"usuario_id", "profissao"})
)
public class CredencialProfissional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    @JsonIgnore
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EspecialidadeTecnica profissao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusCredencial status = StatusCredencial.PENDENTE;

    // ── Registro no conselho ────────────────────────────────
    @Column(name = "numero_registro")
    private String numeroRegistro;

    @Column(name = "uf_registro", length = 2)
    private String ufRegistro;

    /**
     * Até quando a anuidade cobre. Nulo significa que não foi informada — a
     * credencial vale, mas ninguém sabe até quando, e a tela mostra isso.
     */
    @Column(name = "valido_ate")
    private LocalDate validoAte;

    // ── Documento de prova ──────────────────────────────────
    @Column(name = "documento_arquivo")
    @JsonIgnore
    private String documentoArquivo;

    @Column(name = "documento_nome_original")
    private String documentoNomeOriginal;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "documento_removido_em")
    private LocalDateTime documentoRemovidoEm;

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

    // ── Consultas ───────────────────────────────────────────

    /**
     * Vale hoje? Aprovada e dentro da validade.
     *
     * Vencimento não é revogação: a credencial continua APROVADA no histórico,
     * mas deixa de habilitar. Assim o laudo assinado ano passado continua
     * coerente, e a pessoa só precisa atualizar a anuidade para voltar.
     */
    @Transient
    @JsonIgnore
    public boolean isVigente() {
        if (status != StatusCredencial.APROVADA) return false;
        return validoAte == null || !validoAte.isBefore(LocalDate.now());
    }

    @Transient
    @JsonIgnore
    public boolean isVencida() {
        return status == StatusCredencial.APROVADA
                && validoAte != null && validoAte.isBefore(LocalDate.now());
    }

    /** "CREA-MT 12345", como aparece assinado no laudo. */
    @Transient
    public String getRegistroFormatado() {
        if (profissao == null || !profissao.temConselho() || numeroRegistro == null) return null;
        String uf = ufRegistro != null && !ufRegistro.isBlank() ? "-" + ufRegistro.toUpperCase() : "";
        return profissao.getConselho() + uf + " " + numeroRegistro;
    }
}
