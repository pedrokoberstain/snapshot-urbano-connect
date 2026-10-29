package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.dto.usuario.*;
import br.com.urbanoconnect.api.domain.model.TipoUsuario;
import br.com.urbanoconnect.api.domain.model.TokenRecuperacaoSenha;
import br.com.urbanoconnect.api.domain.model.Usuario;
import br.com.urbanoconnect.api.domain.repository.TokenRecuperacaoSenhaRepository;
import br.com.urbanoconnect.api.domain.repository.UsuarioRepository;
import br.com.urbanoconnect.api.domain.service.EmailService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private static final Logger log = LoggerFactory.getLogger(UsuarioController.class);

    // Versão vigente dos Termos de Uso / Política de Privacidade (atualizar quando os textos mudarem)
    public static final String VERSAO_TERMOS_ATUAL = "1.0";

    @Value("${FRONTEND_URL:http://localhost:3000}")
    private String frontendUrl;

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private TokenRecuperacaoSenhaRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/registrar")
    public ResponseEntity<?> registrar(@RequestBody @Valid DadosCadastroUsuario dados) {

        if (repository.findByEmail(dados.email()) != null) {
            return ResponseEntity.badRequest().body("E-mail já cadastrado na plataforma.");
        }

        Usuario novoUsuario = new Usuario();
        novoUsuario.setNome(dados.nome());
        novoUsuario.setEmail(dados.email());
        novoUsuario.setCpf(dados.cpf());

        if (dados.dataNascimento() != null && !dados.dataNascimento().isBlank()) {
            novoUsuario.setDataNascimento(java.time.LocalDate.parse(dados.dataNascimento()));
        }

        novoUsuario.setTelefone(dados.telefone());
        novoUsuario.setCep(dados.cep());
        novoUsuario.setRua(dados.rua());
        novoUsuario.setNumero(dados.numero());
        novoUsuario.setComplemento(dados.complemento());
        novoUsuario.setBairro(dados.bairro());
        novoUsuario.setCidade(dados.cidade());
        novoUsuario.setUf(dados.uf());
        novoUsuario.setCreci(dados.creci());

        if (dados.tipo() == null || dados.tipo() == TipoUsuario.ADMIN) {
            novoUsuario.setTipo(TipoUsuario.USUARIO);
        } else {
            novoUsuario.setTipo(dados.tipo());
        }

        String senhaCriptografada = passwordEncoder.encode(dados.senha());
        novoUsuario.setSenha(senhaCriptografada);

        // ── LGPD: registra o consentimento aos termos no momento do cadastro ──
        novoUsuario.setAceitouTermos(true);
        novoUsuario.setDataAceiteTermos(java.time.LocalDateTime.now());
        novoUsuario.setVersaoTermos(VERSAO_TERMOS_ATUAL);

        repository.save(novoUsuario);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioDTO> obterDadosUsuarioLogado(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(new UsuarioDTO(usuario));
    }

    @PutMapping("/me")
    @Transactional
    public ResponseEntity<UsuarioDTO> atualizarPerfil(
            @RequestBody @Valid DadosAtualizacaoPerfil dados,
            @AuthenticationPrincipal Usuario usuarioLogado) {

        var usuarioNoBanco = repository.getReferenceById(usuarioLogado.getId());
        usuarioNoBanco.atualizarInformacoes(dados);
        repository.save(usuarioNoBanco);

        return ResponseEntity.ok(new UsuarioDTO(usuarioNoBanco));
    }

    @PutMapping("/me/senha")
    @Transactional
    public ResponseEntity<?> alterarSenha(
            @RequestBody @Valid DadosAlteracaoSenha dados,
            @AuthenticationPrincipal Usuario usuarioLogado) {

        var usuario = repository.getReferenceById(usuarioLogado.getId());

        if (!passwordEncoder.matches(dados.senhaAtual(), usuario.getSenha())) {
            return ResponseEntity.badRequest().body("A senha atual informada está incorreta.");
        }

        String novaSenhaCriptografada = passwordEncoder.encode(dados.novaSenha());
        usuario.setSenha(novaSenhaCriptografada);
        repository.save(usuario);

        return ResponseEntity.ok().body("Senha atualizada com sucesso!");
    }

    // ── LGPD: portabilidade dos dados (Art. 18, V — exportação em formato legível) ──
    @GetMapping("/me/dados")
    public ResponseEntity<Map<String, Object>> exportarMeusDados(@AuthenticationPrincipal Usuario usuarioLogado) {
        var usuario = repository.getReferenceById(usuarioLogado.getId());

        var dados = new java.util.LinkedHashMap<String, Object>();
        dados.put("nome", usuario.getNome());
        dados.put("email", usuario.getEmail());
        dados.put("cpf", usuario.getCpf());
        dados.put("dataNascimento", usuario.getDataNascimento());
        dados.put("telefone", usuario.getTelefone());
        dados.put("cep", usuario.getCep());
        dados.put("rua", usuario.getRua());
        dados.put("numero", usuario.getNumero());
        dados.put("complemento", usuario.getComplemento());
        dados.put("bairro", usuario.getBairro());
        dados.put("cidade", usuario.getCidade());
        dados.put("uf", usuario.getUf());
        dados.put("creci", usuario.getCreci());
        dados.put("tipo", usuario.getTipo());
        dados.put("plano", usuario.getPlano());
        dados.put("statusAssinatura", usuario.getStatusAssinatura());
        dados.put("aceitouTermos", usuario.getAceitouTermos());
        dados.put("dataAceiteTermos", usuario.getDataAceiteTermos());
        dados.put("versaoTermos", usuario.getVersaoTermos());

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"meus-dados-urbanoconnect.json\"")
                .body(dados);
    }

    // ── LGPD: direito de exclusão (Art. 18, VI — anonimização da conta) ──
    @DeleteMapping("/me")
    @Transactional
    public ResponseEntity<?> excluirMinhaConta(
            @RequestBody @Valid DadosExclusaoConta dados,
            @AuthenticationPrincipal Usuario usuarioLogado) {

        var usuario = repository.getReferenceById(usuarioLogado.getId());

        // Confirma a identidade antes de uma ação irreversível
        if (!passwordEncoder.matches(dados.senha(), usuario.getSenha())) {
            return ResponseEntity.badRequest().body("Senha incorreta. A exclusão não foi realizada.");
        }

        // Anonimização: remove os dados pessoais mantendo a integridade referencial
        // (imóveis/leads vinculados não quebram). O e-mail recebe um valor inutilizável.
        usuario.setNome("Usuário removido");
        usuario.setEmail("excluido-" + usuario.getId() + "@anonimizado.urbanoconnect");
        usuario.setSenha(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
        usuario.setCpf(null);
        usuario.setDataNascimento(null);
        usuario.setTelefone(null);
        usuario.setCep(null);
        usuario.setRua(null);
        usuario.setNumero(null);
        usuario.setComplemento(null);
        usuario.setBairro(null);
        usuario.setCidade(null);
        usuario.setUf(null);
        usuario.setCreci(null);
        usuario.setAssinaturaMpId(null);
        usuario.setStatusAssinatura(null);
        usuario.setPlano("GRATUITO");
        usuario.setContaExcluida(true);

        repository.save(usuario);

        return ResponseEntity.ok("Conta excluída e dados pessoais anonimizados com sucesso.");
    }

    // ── ADMIN ────────────────────────────────────────────────

    @GetMapping("/admin/todos")
    public List<UsuarioDTO> listarTodos() {
        return repository.findAll().stream().map(UsuarioDTO::new).toList();
    }

    @PatchMapping("/admin/{id}/plano")
    @Transactional
    public ResponseEntity<?> alterarPlano(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return repository.findById(id).map(usuario -> {
            String plano = body.getOrDefault("plano", "GRATUITO").toUpperCase();
            if (!List.of("GRATUITO", "PRO").contains(plano)) {
                return ResponseEntity.badRequest().body("Plano inválido. Use GRATUITO ou PRO.");
            }
            usuario.setPlano(plano);
            if (plano.equals("PRO")) {
                usuario.setStatusAssinatura("authorized");
            } else {
                usuario.setStatusAssinatura(null);
                usuario.setAssinaturaMpId(null);
            }
            repository.save(usuario);
            return ResponseEntity.ok(Map.of("mensagem", "Plano atualizado para " + plano, "usuario", usuario.getEmail()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/esqueci-senha")
    @Transactional
    public ResponseEntity<?> esqueciSenha(@RequestBody @Valid DadosEsqueciSenha dados) {
        Usuario usuario = (Usuario) repository.findByEmail(dados.email());

        // SEGURANÇA: resposta idêntica existindo ou não o e-mail, para impedir
        // enumeração de usuários cadastrados na plataforma. Falha no envio do
        // e-mail também é engolida aqui — vazar 500 revelaria que o e-mail existe.
        if (usuario != null) {
            String token = java.util.UUID.randomUUID().toString();
            var tokenEntity = new TokenRecuperacaoSenha(token, usuario, java.time.LocalDateTime.now().plusHours(1));
            tokenRepository.save(tokenEntity);

            String link = frontendUrl + "/redefinir-senha?token=" + token;
            try {
                emailService.enviarEmailRecuperacao(usuario.getNome(), usuario.getEmail(), link);
            } catch (Exception e) {
                log.error("Falha ao enviar e-mail de recuperação para {}", usuario.getEmail(), e);
            }
        }

        return ResponseEntity.ok("Se o e-mail estiver cadastrado, um link de recuperação será enviado.");
    }

    @PostMapping("/redefinir-senha")
    @Transactional
    public ResponseEntity<?> redefinirSenha(@RequestBody @Valid DadosRedefinirSenha dados) {
        var tokenEntityOptional = tokenRepository.findByToken(dados.token());

        if (tokenEntityOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("Token inválido ou não encontrado.");
        }

        var tokenEntity = tokenEntityOptional.get();

        if (tokenEntity.isExpirado()) {
            tokenRepository.delete(tokenEntity);
            return ResponseEntity.badRequest().body("Este link de recuperação expirou.");
        }

        Usuario usuario = tokenEntity.getUsuario();

        if (passwordEncoder.matches(dados.novaSenha(), usuario.getSenha())) {
            return ResponseEntity.badRequest().body("A nova senha não pode ser igual à senha atual.");
        }

        usuario.setSenha(passwordEncoder.encode(dados.novaSenha()));
        repository.save(usuario);
        tokenRepository.delete(tokenEntity);

        return ResponseEntity.ok("Senha redefinida com sucesso!");
    }
}