package br.com.urbanoconnect.api.domain.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tokens_recuperacao_senha")
public class TokenRecuperacaoSenha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String token;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    private LocalDateTime dataExpiracao;

    // Construtor padrão exigido pelo JPA
    public TokenRecuperacaoSenha() {}

    // Construtor prático
    public TokenRecuperacaoSenha(String token, Usuario usuario, LocalDateTime dataExpiracao) {
        this.token = token;
        this.usuario = usuario;
        this.dataExpiracao = dataExpiracao;
    }

    // Metodo auxiliar para verificar se expirou
    public boolean isExpirado() {
        return LocalDateTime.now().isAfter(this.dataExpiracao);
    }

    // Getters e Setters
    public Long getId() { return id; }
    public String getToken() { return token; }
    public Usuario getUsuario() { return usuario; }
    public LocalDateTime getDataExpiracao() { return dataExpiracao; }
}