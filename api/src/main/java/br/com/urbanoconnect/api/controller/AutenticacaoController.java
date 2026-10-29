package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.config.security.TokenService;
import br.com.urbanoconnect.api.domain.model.Usuario;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/login")
public class AutenticacaoController {

    @Autowired
    private AuthenticationManager manager;

    @Autowired
    private TokenService tokenService;

    @PostMapping
    public ResponseEntity efetuarLogin(@RequestBody @Valid DadosAutenticacao dados) {
        var authenticationToken = new UsernamePasswordAuthenticationToken(dados.email(), dados.senha());
        var authentication = manager.authenticate(authenticationToken);

        var usuarioLogado = (Usuario) authentication.getPrincipal();
        var tokenJWT = tokenService.gerarToken(usuarioLogado);

        // Devolve na resposta o Token, o Tipo e a Cidade (se tiver)
        return ResponseEntity.ok(new DadosTokenJWT(
                tokenJWT,
                usuarioLogado.getTipo().name(),
                usuarioLogado.getCidade() // <-- Adicionado aqui!
        ));
    }

    // DTOs auxiliares
    public record DadosAutenticacao(String email, String senha) {}

    // DTO de resposta atualizado com a cidade
    public record DadosTokenJWT(String token, String tipo, String cidade) {}
}