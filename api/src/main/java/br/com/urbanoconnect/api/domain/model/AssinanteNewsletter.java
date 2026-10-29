package br.com.urbanoconnect.api.domain.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "assinantes_newsletter")
public class AssinanteNewsletter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusAssinante status = StatusAssinante.ATIVO;

    @Column(name = "data_cadastro", nullable = false, updatable = false)
    private LocalDateTime dataCadastro;

    @Column(name = "token_cancelamento", unique = true)
    private String tokenCancelamento;

    @PrePersist
    protected void prePersist() {
        if (dataCadastro == null) dataCadastro = LocalDateTime.now();
        if (tokenCancelamento == null) tokenCancelamento = UUID.randomUUID().toString();
    }
}
