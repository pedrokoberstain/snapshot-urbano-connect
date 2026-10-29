package br.com.urbanoconnect.api.domain.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * ══════════════════════════════════════════════════════════════
 *  CONDOMÍNIO — cadastro do empreendimento avaliado pelo IQC
 * ══════════════════════════════════════════════════════════════
 *
 *  Até então a avaliação IQC guardava a identidade do condomínio em campos
 *  soltos (nomeCondominio/cidade/bairro), o que impedia duas coisas: avaliar
 *  o mesmo empreendimento mais de uma vez sem redigitar tudo, e liberar
 *  acesso à calculadora por condomínio.
 *
 *  Esta entidade centraliza o cadastro. A avaliação passa a apontar para cá,
 *  mas mantém sua própria cópia do nome/cidade/bairro — um laudo precisa
 *  registrar o que foi avaliado na data, mesmo que o cadastro mude depois.
 */
@Data
@Entity
@Table(
        name = "condominios",
        uniqueConstraints = @UniqueConstraint(name = "uk_condominio_cnpj", columnNames = "cnpj")
)
public class Condominio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Identificação ───────────────────────────────────────
    @Column(nullable = false)
    private String nome;

    private String razaoSocial;

    /**
     * Somente dígitos (ver {@link #normalizarCnpj}). Opcional: condomínio
     * pequeno nem sempre tem CNPJ ativo. Quando presente, é único.
     */
    @Column(length = 14)
    private String cnpj;

    @Enumerated(EnumType.STRING)
    private TipoCondominio tipoCondominio;

    // ── Endereço ────────────────────────────────────────────
    @Column(length = 8)
    private String cep;

    private String rua;
    private String numero;
    private String complemento;
    private String bairro;
    private String cidade;

    @Column(length = 2)
    private String uf;

    // ── Georreferência (usada na comparação por raio/mapa) ──
    private Double latitude;
    private Double longitude;

    // ── Caracterização do empreendimento ────────────────────
    private Integer qtdUnidades;
    private Integer qtdTorres;
    private Integer anoEntrega;
    private String construtora;
    private String administradora;

    // ── Contato ─────────────────────────────────────────────
    private String telefoneContato;
    private String emailContato;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // ── Ciclo de vida ───────────────────────────────────────
    /**
     * Desativação é lógica, nunca física: avaliações IQC já emitidas apontam
     * para o condomínio e um laudo não pode perder seu objeto.
     */
    @Column(nullable = false)
    private Boolean ativo = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por_id")
    @JsonIgnore
    private Usuario criadoPor;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    @PrePersist
    protected void prePersist() {
        if (dataCriacao == null) dataCriacao = LocalDateTime.now();
        dataAtualizacao = dataCriacao;
        if (ativo == null) ativo = true;
    }

    @PreUpdate
    protected void preUpdate() {
        dataAtualizacao = LocalDateTime.now();
    }

    /**
     * Reduz o CNPJ a dígitos para que "12.345.678/0001-90" e "12345678000190"
     * não criem dois cadastros do mesmo condomínio. Devolve null para entrada
     * vazia, mantendo o campo fora da restrição de unicidade.
     */
    public static String normalizarCnpj(String bruto) {
        if (bruto == null) return null;
        String digitos = bruto.replaceAll("\\D", "");
        return digitos.isEmpty() ? null : digitos;
    }
}
