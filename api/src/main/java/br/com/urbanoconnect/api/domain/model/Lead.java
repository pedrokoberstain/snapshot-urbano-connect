package br.com.urbanoconnect.api.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // <-- IMPORT NECESSÁRIO
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

@Entity
@Table(name = "leads")
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "Formato de e-mail inválido")
    private String email;

    @NotBlank(message = "O telefone é obrigatório")
    private String telefone;

    @Column(columnDefinition = "TEXT")
    private String mensagem;

    // Salva automaticamente o dia e a hora que o cliente mandou a mensagem
    private LocalDateTime dataCriacao = LocalDateTime.now();

    // ── A CORREÇÃO ESTÁ AQUI: Evita o loop infinito na hora de enviar pro Front-end ──
    @ManyToOne
    @JoinColumn(name = "imovel_id")
    @JsonIgnoreProperties({"corretor", "dadosRurais"})
    private Imovel imovelInteresse;

    // ── GETTERS E SETTERS ──
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getMensagem() {
        return mensagem;
    }

    public void setMensagem(String mensagem) {
        this.mensagem = mensagem;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    public Imovel getImovelInteresse() {
        return imovelInteresse;
    }

    public void setImovelInteresse(Imovel imovelInteresse) {
        this.imovelInteresse = imovelInteresse;
    }
}