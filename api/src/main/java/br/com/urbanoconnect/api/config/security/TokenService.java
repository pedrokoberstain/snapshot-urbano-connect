package br.com.urbanoconnect.api.config.security;

import br.com.urbanoconnect.api.domain.model.Usuario;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class TokenService {

    // Puxa a senha
    @Value("${api.security.token.secret}")
    private String secret;

    // CRIAR o Token
    public String gerarToken(Usuario usuario) {
        try {
            var algoritmo = Algorithm.HMAC256(secret);
            return JWT.create()
                    .withIssuer("API UrbanoConnect") // Quem emitiu
                    .withSubject(usuario.getEmail()) // O dono do crachá
                    .withClaim("tipo", usuario.getTipo().name())
                    .withExpiresAt(dataExpiracao()) // Quando vence
                    .sign(algoritmo); // Assinatura oficial
        } catch (JWTCreationException exception) {
            throw new RuntimeException("Erro ao gerar token jwt", exception);
        }
    }

    // LER o Token
    public String getSubject(String tokenJWT) {
        try {
            var algoritmo = Algorithm.HMAC256(secret);
            return JWT.require(algoritmo)
                    .withIssuer("API UrbanoConnect")
                    .build()
                    .verify(tokenJWT)
                    .getSubject(); // Devolve o e-mail do usuário se o token for válido
        } catch (JWTVerificationException exception) {
            throw new RuntimeException("Token JWT inválido ou expirado!");
        }
    }

    // Validade do token: 1 hora.
    // Instant.now() já é um ponto absoluto no tempo (UTC), então não há fuso envolvido.
    // A versão anterior usava LocalDateTime.now().toInstant(ZoneOffset.of("-04:00")),
    // que pegava a hora local do servidor (UTC no container) e a reinterpretava como
    // se fosse Mato Grosso — somando 4 horas silenciosamente e resultando em 5h de
    // validade real em produção.
    private Instant dataExpiracao() {
        return Instant.now().plus(1, ChronoUnit.HOURS);
    }
}