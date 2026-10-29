package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.dto.condominio.AcessoCondominioDTO;
import br.com.urbanoconnect.api.domain.dto.condominio.DadosAnaliseAcesso;
import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.AcessoCondominioRepository;
import br.com.urbanoconnect.api.domain.repository.CondominioRepository;
import br.com.urbanoconnect.api.domain.repository.UsuarioRepository;
import br.com.urbanoconnect.api.domain.service.AcessoIqcService;
import br.com.urbanoconnect.api.domain.service.DocumentoPrivadoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Administração dos vínculos de um condomínio: conceder acesso de avaliador,
 * analisar as solicitações de morador e ler o comprovante de residência.
 *
 * Exige {@code podeGerenciarCondominio} — ADMIN ou quem cadastrou. Um avaliador
 * convidado usa a calculadora, mas não distribui acesso a terceiros nem abre
 * documento pessoal de morador.
 */
@Tag(name = "Condomínios — acessos",
     description = "Concessão de acesso de avaliador e análise das solicitações de morador. "
                 + "Exige ADMIN ou quem cadastrou o condomínio: o avaliador convidado usa a "
                 + "calculadora, mas não distribui acesso nem abre documento de morador.")
@RestController
@RequestMapping("/condominios/{condominioId}/acessos")
public class AcessoCondominioController {

    private static final Logger log = LoggerFactory.getLogger(AcessoCondominioController.class);

    @Autowired private CondominioRepository condominioRepository;
    @Autowired private AcessoCondominioRepository acessoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private AcessoIqcService acessoIqcService;
    @Autowired private DocumentoPrivadoService comprovanteService;

    @GetMapping
    public ResponseEntity<?> listar(@PathVariable Long condominioId,
                                    @RequestParam(required = false) PapelAcessoCondominio papel,
                                    @AuthenticationPrincipal Usuario logado) {
        Condominio c = condominioGerenciavel(condominioId, logado);
        if (c == null) return naoEncontrado(condominioId);

        return ResponseEntity.ok(acessoRepository.listarDoCondominio(condominioId, papel)
                .stream().map(AcessoCondominioDTO::new).toList());
    }

    /**
     * Concede acesso de avaliador a um usuário pelo e-mail. Já nasce APROVADO:
     * é uma concessão deliberada de quem administra, não um pedido.
     */
    @Operation(summary = "Concede acesso de avaliador a um usuário",
               description = "Corpo: `{\"email\": \"...\"}`. Já nasce APROVADO — é concessão "
                           + "deliberada de quem administra, não um pedido. O usuário não "
                           + "precisa ser corretor: engenheiro e arquiteto de campo entram por "
                           + "aqui. Recusa quem já é MORADOR do condomínio, para não apagar "
                           + "unidade e tempo de moradia em silêncio.")
    @PostMapping("/avaliadores")
    @Transactional
    public ResponseEntity<?> concederAvaliador(@PathVariable Long condominioId,
                                               @RequestBody Map<String, String> body,
                                               @AuthenticationPrincipal Usuario logado) {
        Condominio c = condominioGerenciavel(condominioId, logado);
        if (c == null) return naoEncontrado(condominioId);

        String email = body.getOrDefault("email", "").trim().toLowerCase();
        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Informe o e-mail do avaliador."));
        }

        Object encontrado = usuarioRepository.findByEmail(email);
        if (!(encontrado instanceof Usuario alvo)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Nenhum usuário cadastrado com o e-mail " + email + "."));
        }

        Optional<AcessoCondominio> jaExiste =
                acessoRepository.findByCondominioIdAndUsuarioId(condominioId, alvo.getId());

        if (jaExiste.isPresent()) {
            AcessoCondominio a = jaExiste.get();
            // Um vínculo por pessoa por condomínio. Converter morador em
            // avaliador jogaria fora unidade, vínculo e tempo de moradia —
            // e a opinião dele perderia a base. Melhor recusar e deixar
            // explícito do que apagar dado em silêncio.
            if (a.getPapel() == PapelAcessoCondominio.MORADOR) {
                return ResponseEntity.badRequest().body(Map.of(
                        "erro", "Este usuário já está vinculado como MORADOR deste condomínio. "
                                + "Revogue o vínculo de morador antes de torná-lo avaliador."));
            }
            a.setStatus(StatusAcessoCondominio.APROVADO);
            a.setMotivoRecusa(null);
            a.setAnalisadoPor(logado);
            a.setDataAnalise(LocalDateTime.now());
            return ResponseEntity.ok(new AcessoCondominioDTO(acessoRepository.save(a)));
        }

        AcessoCondominio a = new AcessoCondominio();
        a.setCondominio(c);
        a.setUsuario(alvo);
        a.setPapel(PapelAcessoCondominio.AVALIADOR);
        a.setStatus(StatusAcessoCondominio.APROVADO);
        a.setAnalisadoPor(logado);
        a.setDataAnalise(LocalDateTime.now());
        acessoRepository.save(a);

        return ResponseEntity.ok(new AcessoCondominioDTO(a));
    }

    /**
     * Aprova, recusa ou revoga um vínculo. Em qualquer desfecho o comprovante
     * é destruído: ele existia para sustentar essa decisão e a decisão foi
     * tomada. O que fica é o registro de que houve documento e de quando ele
     * foi apagado.
     */
    @Operation(summary = "Aprova, recusa ou revoga um vínculo",
               description = "Em qualquer desfecho o comprovante de residência é destruído: ele "
                           + "existia para sustentar essa decisão e a decisão foi tomada. Fica "
                           + "só o registro de que houve documento e de quando foi apagado. "
                           + "A recusa exige motivo — sem ele o solicitante reenvia o mesmo "
                           + "comprovante.")
    @PatchMapping("/{acessoId}")
    @Transactional
    public ResponseEntity<?> analisar(@PathVariable Long condominioId,
                                      @PathVariable Long acessoId,
                                      @RequestBody @Valid DadosAnaliseAcesso dados,
                                      @AuthenticationPrincipal Usuario logado) {
        Condominio c = condominioGerenciavel(condominioId, logado);
        if (c == null) return naoEncontrado(condominioId);

        Optional<AcessoCondominio> opt = acessoRepository.findById(acessoId);
        if (opt.isEmpty() || !opt.get().getCondominio().getId().equals(condominioId)) {
            return ResponseEntity.notFound().build();
        }
        AcessoCondominio a = opt.get();

        if (dados.status() == StatusAcessoCondominio.PENDENTE) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Use APROVADO, RECUSADO ou REVOGADO."));
        }
        if (dados.status() == StatusAcessoCondominio.RECUSADO
                && (dados.motivo() == null || dados.motivo().isBlank())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Explique o motivo da recusa — sem isso o solicitante "
                            + "reenvia o mesmo comprovante."));
        }

        a.setStatus(dados.status());
        a.setMotivoRecusa(dados.motivo());
        a.setAnalisadoPor(logado);
        a.setDataAnalise(LocalDateTime.now());
        descartarComprovante(a);

        log.info("Acesso {} do condomínio {} definido como {} por usuário {}",
                acessoId, condominioId, dados.status(), logado.getId());

        return ResponseEntity.ok(new AcessoCondominioDTO(acessoRepository.save(a)));
    }

    /**
     * Entrega o comprovante para análise. Sempre como anexo e com nosniff: um
     * PDF servido inline executa JavaScript em alguns leitores, e este arquivo
     * veio de fora.
     */
    @Operation(summary = "Baixa o comprovante de residência para análise",
               description = "Devolve 410 depois da análise, porque o arquivo é apagado nela. "
                           + "Sempre entregue como anexo e com nosniff, e cada acesso fica "
                           + "registrado no log — é documento pessoal de terceiro.")
    @GetMapping("/{acessoId}/comprovante")
    public ResponseEntity<?> baixarComprovante(@PathVariable Long condominioId,
                                               @PathVariable Long acessoId,
                                               @AuthenticationPrincipal Usuario logado) {
        Condominio c = condominioGerenciavel(condominioId, logado);
        if (c == null) return naoEncontrado(condominioId);

        Optional<AcessoCondominio> opt = acessoRepository.findById(acessoId);
        if (opt.isEmpty() || !opt.get().getCondominio().getId().equals(condominioId)) {
            return ResponseEntity.notFound().build();
        }
        AcessoCondominio a = opt.get();

        if (a.getComprovanteArquivo() == null) {
            return ResponseEntity.status(410).body(Map.of(
                    "erro", a.getComprovanteRemovidoEm() != null
                            ? "O comprovante foi apagado após a análise."
                            : "Não há comprovante anexado a este vínculo."));
        }

        byte[] conteudo;
        try {
            conteudo = comprovanteService.ler(a.getComprovanteArquivo());
        } catch (Exception e) {
            log.warn("Comprovante do acesso {} indisponível: {}", acessoId, e.getMessage());
            return ResponseEntity.status(410).body(Map.of(
                    "erro", "O arquivo do comprovante não está mais disponível."));
        }

        // Quem abriu documento pessoal de quem, e quando.
        log.info("Comprovante do acesso {} (condomínio {}) aberto pelo usuário {}",
                acessoId, condominioId, logado.getId());

        String nome = DocumentoPrivadoService.nomeParaExibicao(a.getComprovanteNomeOriginal());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        comprovanteService.contentType(a.getComprovanteArquivo())))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nome + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .body(conteudo);
    }

    // ── Helpers ─────────────────────────────────────────────

    /** Condomínio que o usuário administra, ou null. */
    private Condominio condominioGerenciavel(Long condominioId, Usuario logado) {
        return condominioRepository.buscarPorId(condominioId)
                .filter(c -> acessoIqcService.podeGerenciarCondominio(logado, c))
                .orElse(null);
    }

    private void descartarComprovante(AcessoCondominio a) {
        if (a.getComprovanteArquivo() == null) return;
        comprovanteService.apagar(a.getComprovanteArquivo());
        a.setComprovanteArquivo(null);
        a.setComprovanteRemovidoEm(LocalDateTime.now());
    }

    /**
     * Mesma resposta para condomínio inexistente e para condomínio de outro —
     * do contrário a diferença entre 403 e 404 revelaria quais ids existem.
     */
    private ResponseEntity<?> naoEncontrado(Long condominioId) {
        return ResponseEntity.status(404).body(Map.of(
                "erro", "Condomínio não encontrado: " + condominioId));
    }
}
