package br.com.urbanoconnect.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "indicadores_economicos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IndicadorEconomico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String simbolo;   // SELIC, IPCA, USD_BRL, IBOVESPA

    private String nome;      // "Taxa Selic", "IPCA", "Dólar (R$)"
    private Double valor;
    private Double variacao;  // variação em relação à leitura anterior (%)
    private String unidade;   // "% a.a.", "% mensal", "R$", "pontos"
    private String fonte;     // "BCB", "B3", "BRAPI"

    private LocalDateTime dataAtualizacao;
}
