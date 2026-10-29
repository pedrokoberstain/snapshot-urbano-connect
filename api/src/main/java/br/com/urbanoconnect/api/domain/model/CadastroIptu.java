package br.com.urbanoconnect.api.domain.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Registro do cadastro imobiliário municipal (base IPTU), uma linha por inscrição.
 * Fonte inicial: planilha da Prefeitura de Tangará da Serra (exercício 2014).
 * Os valores de venal/IPTU podem ser atualizados manualmente ou por reimportação.
 */
@Data
@Entity
@Table(
        name = "cadastro_iptu",
        uniqueConstraints = @UniqueConstraint(name = "uk_cadastro_iptu_cidade_inscricao",
                columnNames = {"cidade", "inscricao"}),
        indexes = {
                @Index(name = "idx_cadastro_iptu_bairro", columnList = "cidade,bairro")
        }
)
public class CadastroIptu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String cidade;

    /** Inscrição imobiliária — chave de cruzamento com o anúncio. */
    @Column(nullable = false)
    private String inscricao;

    private String bairro;

    private String endereco;

    /** Valor venal do imóvel (base IPTU). Atualizável. */
    @Column(name = "valor_venal")
    private BigDecimal valorVenal;

    /** Valor do IPTU lançado (imposto). Atualizável. */
    @Column(name = "imposto")
    private BigDecimal imposto;

    @Column(name = "area_terreno")
    private Double areaTerreno;

    @Column(name = "valor_m2_terreno")
    private Double valorM2Terreno;

    @Column(name = "valor_terreno")
    private Double valorTerreno;

    @Column(name = "valor_edificacao")
    private Double valorEdificacao;

    private Double aliquota;

    /** Exercício (ano) a que os valores se referem. */
    private Integer exercicio;

    /** Origem do dado atual: PLANILHA (importado) ou MANUAL (editado no admin). */
    @Column(nullable = false)
    private String fonte = "PLANILHA";

    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    // ── BCI: ficha construtiva (descricoes limpas, ex: "ALVENARIA", "TELHA") ──
    private String caracterizacao;
    @Column(name = "tipo_construcao")    private String tipoConstrucao;
    @Column(name = "estado_conservacao") private String estadoConservacao;
    private String cobertura;
    private String revestimento;
    private String piso;
    private String forro;
    private String posicao;
    @Column(name = "instalacao_sanitaria") private String instalacaoSanitaria;
    @Column(name = "instalacao_eletrica")  private String instalacaoEletrica;
    @Column(name = "situacao_terreno")     private String situacaoTerreno;
    private String topografia;
    private String pedologia;

    // ── BCI: medidas oficiais da prefeitura ──
    @Column(name = "area_construida")   private Double areaConstruida;
    private Double testada;
    @Column(name = "numero_pavimentos") private Integer numeroPavimentos;

    // ── BCI: infraestrutura disponivel na rua ──
    @Column(name = "tem_esgoto")             private Boolean temEsgoto;
    @Column(name = "tem_agua")               private Boolean temAgua;
    @Column(name = "tem_iluminacao_publica") private Boolean temIluminacaoPublica;
    @Column(name = "tem_calcamento")         private Boolean temCalcamento;
    @Column(name = "tem_galeria_pluvial")    private Boolean temGaleriaPluvial;
    @Column(name = "tem_coleta_lixo")        private Boolean temColetaLixo;
    @Column(name = "tem_limpeza_urbana")     private Boolean temLimpezaUrbana;
    @Column(name = "tem_rede_telefonica")    private Boolean temRedeTelefonica;
    @Column(name = "tem_guias_sarjetas")     private Boolean temGuiasSarjetas;

    // ── BCI: servicos e amenidades na propria unidade ──
    @Column(name = "esgoto_na_unidade") private Boolean esgotoNaUnidade;
    @Column(name = "agua_na_unidade")   private Boolean aguaNaUnidade;
    @Column(name = "poco_na_unidade")   private Boolean pocoNaUnidade;
    @Column(name = "fossa_na_unidade")  private Boolean fossaNaUnidade;
    @Column(name = "tem_piscina")       private Boolean temPiscina;
    @Column(name = "tem_sauna")         private Boolean temSauna;
}
