package br.com.urbanoconnect.api.domain.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Entity
@Table(name = "imoveis")
public class Imovel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false)
    private String cidade;

    private String bairro;

    /**
     * Endereço. Vinha só com cidade e bairro, o que impedia localizar o imóvel
     * na rua — e é o que permite, adiante, casar o lote com o seu registro no
     * cadastro do IPTU em vez de usar a média do bairro.
     *
     * Todos nulos: os imóveis já cadastrados continuam válidos.
     */
    @Column(length = 9)
    private String cep;

    private String logradouro;

    @Column(length = 20)
    private String numero;

    private String complemento;

    @OneToOne(mappedBy = "imovel", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("imovel")
    private ImovelRuralDados dadosRurais;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoImovel tipo;

    @Column(nullable = false)
    private BigDecimal preco;

    @Column(name = "area_total", nullable = false)
    private Double areaTotal;

    /** Área construída/edificada (m²). Usada na estimativa de valor venal (PGV). Opcional. */
    @Column(name = "area_construida")
    private Double areaConstruida;

    // ── Campos urbanos básicos ──────────────────────────────
    private Integer quartos;
    private Integer banheiros;
    private Integer vagasGaragem;

    // ── Motor de Precificação Hedônica ──────────────────────
    /** Inscrição imobiliária (cadastro municipal). Opcional — usada para puxar o valor venal da base IPTU. */
    private String inscricao;

    /** Valor venal (base IPTU). Proxy de valor oficial. */
    @Column(name = "valor_venal")
    private BigDecimal valorVenal;

    /** Distância ao centro econômico da cidade (km). */
    @Column(name = "distancia_centro")
    private Double distanciaCentro;

    /** Preço médio do m² no bairro (R$/m²). */
    @Column(name = "preco_m2_bairro")
    private Double precoM2Bairro;

    /** Índice de padrão de acabamento (0=Baixo, 1=Médio, 2=Alto, 3=Luxo). Derivado das perguntas qualitativas. */
    @Column(name = "padrao_acabamento")
    private Integer padraoAcabamento;

    /** Índice de espraiamento urbano (0.0 a 3.0). Derivado das perguntas qualitativas. */
    @Column(name = "sprawl")
    private Double sprawl;

    /** Preço estimado pelo modelo hedônico (R$). Calculado automaticamente. */
    @Column(name = "preco_estimado")
    private BigDecimal precoEstimado;

    /** Score de oportunidade: preco_real / preco_estimado. < 1.0 = oportunidade. */
    @Column(name = "score_oportunidade")
    private Double scoreOportunidade;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> detalhes;

    private String imagemPrincipal;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> galeria = new java.util.ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean ativo = true;

    // ── Datas de ciclo de vida ──────────────────────────────
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_cadastro", updatable = false)
    private LocalDateTime dataCadastro;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_venda")
    private LocalDateTime dataVenda;

    @PrePersist
    protected void prePersist() {
        if (dataCadastro == null) dataCadastro = LocalDateTime.now();
    }

    // ── Controle de Vendas ──────────────────────────────────
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean vendido = false;

    @Column(name = "valor_fechamento")
    private BigDecimal valorFechamento;

    @Column(name = "desconto_percentual")
    private Double descontoPercentual;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "corretor_id", nullable = false)
    @JsonIgnore
    private Usuario corretor;
}