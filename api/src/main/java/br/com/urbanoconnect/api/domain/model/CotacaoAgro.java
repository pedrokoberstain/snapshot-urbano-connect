package br.com.urbanoconnect.api.domain.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cotacoes_agro")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CotacaoAgro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String produto; // Ex: "Soja", "Boi Gordo"
    private String valor;   // Ex: "R$ 122,58"
    private String variacao;// Ex: "1,5%"

    private LocalDateTime dataAtualizacao;
}