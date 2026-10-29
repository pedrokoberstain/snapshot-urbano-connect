package br.com.urbanoconnect.api.domain.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "templates_newsletter")
public class TemplateNewsletter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String assunto;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    // Templates padrão não podem ser excluídos
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean padrao = false;

    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;

    @PrePersist
    protected void prePersist() {
        if (dataCriacao == null) dataCriacao = LocalDateTime.now();
    }
}
