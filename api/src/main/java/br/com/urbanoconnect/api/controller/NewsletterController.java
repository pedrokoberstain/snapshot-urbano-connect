package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.model.AssinanteNewsletter;
import br.com.urbanoconnect.api.domain.model.TemplateNewsletter;
import br.com.urbanoconnect.api.domain.repository.TemplateNewsletterRepository;
import br.com.urbanoconnect.api.domain.service.NewsletterService;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/newsletter")
public class NewsletterController {

    @Autowired
    private NewsletterService service;

    @Autowired
    private TemplateNewsletterRepository templateRepository;

    @Autowired
    private br.com.urbanoconnect.api.domain.service.EmailService emailService;

    // ── PÚBLICO ──────────────────────────────────────────────

    @PostMapping("/inscrever")
    public ResponseEntity<Map<String, String>> inscrever(@RequestBody @Valid DadosInscricao dados) {
        String resultado = service.inscrever(dados.email(), dados.nome());
        String mensagem = switch (resultado) {
            case "JA_INSCRITO" -> "Este e-mail já está inscrito na nossa newsletter.";
            case "REATIVADO"   -> "Bem-vindo de volta! Sua inscrição foi reativada.";
            default            -> "Inscrição realizada com sucesso!";
        };
        int status = resultado.equals("JA_INSCRITO") ? 409 : 200;
        return ResponseEntity.status(status).body(Map.of("mensagem", mensagem, "resultado", resultado));
    }

    @GetMapping("/cancelar")
    public ResponseEntity<Map<String, String>> cancelar(@RequestParam String token) {
        boolean ok = service.cancelar(token);
        if (!ok) return ResponseEntity.badRequest().body(Map.of("mensagem", "Token inválido ou já cancelado."));
        return ResponseEntity.ok(Map.of("mensagem", "Inscrição cancelada com sucesso."));
    }

    // ── ADMIN ─────────────────────────────────────────────────

    @GetMapping("/assinantes")
    public List<AssinanteNewsletter> listarAssinantes() {
        return service.listarAtivos();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(Map.of(
                "ativos", service.contarAtivos(),
                "total",  service.contarTotal()
        ));
    }

    @PostMapping("/testar")
    public ResponseEntity<Map<String, String>> testar(@RequestBody @Valid DadosTeste dados) {
        try {
            String html = br.com.urbanoconnect.api.domain.service.EmailService
                    .montarTemplateNewsletter(dados.assunto(), dados.conteudo(), dados.urlBotao(), dados.textoBotao(), "#");
            emailService.enviarEmailHtml(dados.emailTeste(), "[TESTE] " + dados.assunto(), html);
            return ResponseEntity.ok(Map.of("mensagem", "E-mail de teste enviado para " + dados.emailTeste()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("mensagem", "Falha ao enviar: " + e.getMessage()));
        }
    }

    @PostMapping("/enviar")
    public ResponseEntity<Map<String, String>> enviar(@RequestBody @Valid DadosEnvio dados) {
        long total = service.contarAtivos();
        if (total == 0) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", "Nenhum assinante ativo para enviar."));
        }
        service.enviarParaTodos(dados.assunto(), dados.conteudo(), dados.urlBotao(), dados.textoBotao());
        return ResponseEntity.ok(Map.of(
                "mensagem", "Envio iniciado para " + total + " assinante(s).",
                "total", String.valueOf(total)
        ));
    }

    // ── TEMPLATES ────────────────────────────────────────────

    @GetMapping("/templates")
    public List<TemplateNewsletter> listarTemplates() {
        return templateRepository.findAllByOrderByPadraoDescDataCriacaoAsc();
    }

    @PostMapping("/templates")
    @Transactional
    public ResponseEntity<TemplateNewsletter> criarTemplate(@RequestBody @Valid DadosTemplate dados) {
        TemplateNewsletter t = new TemplateNewsletter();
        t.setNome(dados.nome());
        t.setAssunto(dados.assunto());
        t.setConteudo(dados.conteudo());
        t.setPadrao(false);
        return ResponseEntity.ok(templateRepository.save(t));
    }

    @PutMapping("/templates/{id}")
    @Transactional
    public ResponseEntity<TemplateNewsletter> atualizarTemplate(
            @PathVariable Long id,
            @RequestBody @Valid DadosTemplate dados) {
        return templateRepository.findById(id).map(t -> {
            t.setNome(dados.nome());
            t.setAssunto(dados.assunto());
            t.setConteudo(dados.conteudo());
            return ResponseEntity.ok(templateRepository.save(t));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/templates/{id}")
    @Transactional
    public ResponseEntity<Void> excluirTemplate(@PathVariable Long id) {
        var opt = templateRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        var t = opt.get();
        if (t.isPadrao()) return ResponseEntity.<Void>badRequest().build();
        templateRepository.delete(t);
        return ResponseEntity.<Void>noContent().build();
    }

    // ── DTOs ─────────────────────────────────────────────────

    public record DadosInscricao(
            @NotBlank @Email String email,
            String nome
    ) {}

    public record DadosEnvio(
            @NotBlank @Size(max = 150) String assunto,
            @NotBlank String conteudo,
            String urlBotao,
            String textoBotao
    ) {}

    public record DadosTeste(
            @NotBlank @Email String emailTeste,
            @NotBlank @Size(max = 150) String assunto,
            @NotBlank String conteudo,
            String urlBotao,
            String textoBotao
    ) {}

    public record DadosTemplate(
            @NotBlank @Size(max = 100) String nome,
            @NotBlank @Size(max = 150) String assunto,
            @NotBlank String conteudo
    ) {}
}
