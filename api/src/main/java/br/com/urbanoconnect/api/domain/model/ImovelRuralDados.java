package br.com.urbanoconnect.api.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "imoveis_rural_dados")
public class ImovelRuralDados {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imovel_id", nullable = false, unique = true)
    @JsonIgnoreProperties("dadosRurais")  // <- adiciona isso
    private Imovel imovel;

    // ── SOLO ─────────────────────────────────────────────
    private String tipoSolo;
    private BigDecimal percentualArgila;
    private BigDecimal fertilidadeSolo;
    private BigDecimal nivelNutrientes;
    private BigDecimal necessidadeCorrecaoSolo;

    // ── USO DA TERRA ─────────────────────────────────────
    private BigDecimal areaUtil;
    private BigDecimal areaReservaLegal;
    private BigDecimal areaApp;
    private BigDecimal areaDegradada;
    private String usoAtual;
    private String usoPotencial;
    private String coberturaVegetal;

    @Column(name = "estado_conservacao")
    private Integer estadoConservacao; // escala 1 a 5

    // ── PRODUTIVIDADE ─────────────────────────────────────
    private BigDecimal produtividadeSoja;    // sacas/ha
    private BigDecimal produtividadeMilho;   // sacas/ha
    private BigDecimal produtividadePastagem; // UA/ha

    @Column(name = "aptidao_agricola")
    private Integer aptidaoAgricola; // escala 1 a 5

    @Column(name = "aptidao_pecuaria")
    private Integer aptidaoPecuaria; // escala 1 a 5

    // ── ÁGUA ─────────────────────────────────────────────
    private Boolean disponibilidadeAgua;
    private String tipoffonteAgua;
    private BigDecimal volumeAgua;
    private Boolean perenidadeAgua;
    private Boolean irrigacao;

    // ── LOGÍSTICA ─────────────────────────────────────────
    private BigDecimal distanciaRodovia;   // km
    private BigDecimal distanciaPorto;     // km
    private BigDecimal distanciaCentroConsumidor; // km

    @Column(name = "qualidade_acesso")
    private Integer qualidadeAcesso; // escala 1 a 5

    // ── INFRAESTRUTURA ────────────────────────────────────
    private Boolean sede;
    private Boolean energiaEletrica;
    private Boolean mecanizacaoViavel;
    private Boolean casaFuncionarios;
    private Boolean curral;
    private Boolean galpao;

    // ── DOCUMENTAÇÃO ──────────────────────────────────────
    private Boolean matriculaRegular;
    private Boolean georreferenciamento;
    private Boolean car;   // Cadastro Ambiental Rural
    private Boolean ccir;  // Certificado de Cadastro de Imóvel Rural
    private Boolean itrRegular;
    private Boolean existenciaOnus;
}