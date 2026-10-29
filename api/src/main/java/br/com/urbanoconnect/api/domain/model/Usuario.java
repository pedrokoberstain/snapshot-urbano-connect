package br.com.urbanoconnect.api.domain.model;

import br.com.urbanoconnect.api.domain.dto.usuario.DadosAtualizacaoPerfil;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Table(name = "usuarios")
@Entity(name = "Usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String email;
    private String senha;
    private String cpf;
    private LocalDate dataNascimento;
    private String telefone;

    @Column(name = "cep", length = 8)
    private String cep;
    private String rua;
    private String numero;
    private String complemento;
    private String creci;
    private String bairro;
    private String cidade;
    @Column(length = 2)
    private String uf;

    // Define o plano atual. Padrão ao criar a conta será gratuito.
    private String plano = "GRATUITO"; // Valores futuros: PRO_MENSAL, PRO_ANUAL

    // Vai guardar o ID gerado pelo Mercado Pago quando o usuário assinar
    private String assinaturaMpId;

    // Vai guardar o status atual (ex: 'authorized', 'pending', 'cancelled')
    private String statusAssinatura;

    @Enumerated(EnumType.STRING)
    private TipoUsuario tipo = TipoUsuario.USUARIO;

    // ── LGPD: registro do consentimento aos Termos de Uso e Política de Privacidade ──
    private Boolean aceitouTermos;
    private java.time.LocalDateTime dataAceiteTermos;
    private String versaoTermos;

    // ── LGPD: marca contas anonimizadas (direito de exclusão, Art. 18 LGPD) ──
    private Boolean contaExcluida = false;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + this.tipo.name()));
    }

    public void atualizarInformacoes(DadosAtualizacaoPerfil dados) {
        if (dados.nome() != null && !dados.nome().isBlank()) {
            this.nome = dados.nome();
        }
        if (dados.telefone() != null && !dados.telefone().isBlank()) {
            this.telefone = dados.telefone();
        }
        if (dados.creci() != null && !dados.creci().isBlank()) {
            this.creci = dados.creci();
        }
        if (dados.cidade() != null && !dados.cidade().isBlank()) {
            this.cidade = dados.cidade();
        }
        if (dados.uf() != null && !dados.uf().isBlank()) {
            this.uf = dados.uf();
        }
    }

    @Override
    public String getPassword() {
        return senha;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return !Boolean.TRUE.equals(contaExcluida); }
}