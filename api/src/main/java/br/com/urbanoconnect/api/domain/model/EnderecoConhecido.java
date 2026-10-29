package br.com.urbanoconnect.api.domain.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Correspondência endereço → inscrição imobiliária construída organicamente
 * a partir dos imóveis que corretores já cadastraram. Cada linha diz "no
 * endereço X (cidade + logradouro + número) o imóvel tem a inscrição Y no
 * cadastro municipal".
 *
 * <p>Usada como atalho no cadastro de novos anúncios: se o corretor informa
 * o endereço mas não tem a inscrição, o sistema consulta esta tabela antes
 * de tentar o match textual na base IPTU 2014, e entrega a ficha exata
 * quando outro corretor já cadastrou um imóvel no mesmo endereço.</p>
 */
@Data
@Entity
@Table(
        name = "endereco_conhecido",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_endereco_conhecido",
                columnNames = {"cidade", "logradouro_norm", "numero_norm"})
)
public class EnderecoConhecido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String cidade;

    /** Opcional — cidades pequenas às vezes têm CEP genérico. Só pra exibição. */
    @Column(length = 9)
    private String cep;

    /** Logradouro como o corretor digitou — pra exibir no preview. */
    @Column(nullable = false)
    private String logradouro;

    /** Logradouro normalizado (upper, sem acento, sem pontuação) — chave do lookup. */
    @Column(name = "logradouro_norm", nullable = false)
    private String logradouroNorm;

    @Column(nullable = false, length = 32)
    private String numero;

    /** Número normalizado (upper, só alfanumérico) — chave do lookup. */
    @Column(name = "numero_norm", nullable = false, length = 32)
    private String numeroNorm;

    /** Inscrição imobiliária do cadastro municipal. Chave para bater com cadastro_iptu. */
    @Column(nullable = false, length = 32)
    private String inscricao;

    /** Fonte da correspondência: o imóvel do sistema que a alimentou. */
    @Column(name = "imovel_id")
    private Long imovelId;

    @Column(name = "data_criacao", nullable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao", nullable = false)
    private LocalDateTime dataAtualizacao;
}
