package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.CredencialProfissionalRepository;
import br.com.urbanoconnect.api.domain.repository.UsuarioRepository;
import br.com.urbanoconnect.api.domain.service.DocumentoPrivadoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * ══════════════════════════════════════════════════════════════
 *  CREDENCIAL PROFISSIONAL
 * ══════════════════════════════════════════════════════════════
 *
 *  Todo mundo entra como cliente. Engenheiro e arquiteto pedem a credencial
 *  enviando o registro do conselho; um ADMIN confere e aprova. Analista não
 *  tem conselho — é designação interna e nasce aprovada.
 *
 *  A conferência não deve se resumir a olhar o PDF: CREA e CAU têm consulta
 *  pública, e o endpoint de análise devolve o link para o admin conferir na
 *  fonte. Um documento enviado é fácil de forjar; o registro no conselho, não.
 */
@Tag(name = "Credenciais profissionais",
     description = "Habilitação de engenheiro, arquiteto e analista. Cliente é a conta base; "
                 + "a credencial é verificada por cima dela e é o que libera assumir partes "
                 + "do laudo IQC.")
@RestController
public class CredencialProfissionalController {

    private static final Logger log = LoggerFactory.getLogger(CredencialProfissionalController.class);

    @Autowired private CredencialProfissionalRepository repository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private DocumentoPrivadoService documentoService;

    // ── Lado do profissional ────────────────────────────────

    @Operation(summary = "Minhas credenciais e o estado de cada uma")
    @GetMapping("/credenciais/minhas")
    public ResponseEntity<?> minhas(@AuthenticationPrincipal Usuario logado) {
        return ResponseEntity.ok(repository.listarDoUsuario(logado.getId())
                .stream().map(this::paraTela).toList());
    }

    @Operation(summary = "Solicita a credencial de engenheiro ou arquiteto",
               description = "Multipart. Envie o número do registro, a UF do conselho e a foto ou "
                           + "PDF da carteira. O documento é apagado assim que a análise termina. "
                           + "Analista não passa por aqui: é designação interna.")
    @PostMapping(path = "/credenciais", consumes = "multipart/form-data")
    @Transactional
    public ResponseEntity<?> solicitar(@RequestParam EspecialidadeTecnica profissao,
                                       @RequestParam String numeroRegistro,
                                       @RequestParam(required = false) String ufRegistro,
                                       @RequestParam(required = false) String validoAte,
                                       @RequestParam("documento") MultipartFile documento,
                                       @AuthenticationPrincipal Usuario logado) {

        if (!profissao.temConselho()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", profissao.getRotulo() + " não tem conselho de classe e não se "
                            + "autocadastra. Essa habilitação é concedida internamente."));
        }
        if (numeroRegistro == null || numeroRegistro.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Informe o número do registro no " + profissao.getConselho() + "."));
        }

        LocalDate validade = null;
        if (validoAte != null && !validoAte.isBlank()) {
            try {
                validade = LocalDate.parse(validoAte);
            } catch (DateTimeParseException e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "erro", "Informe a validade no formato AAAA-MM-DD."));
            }
            if (validade.isBefore(LocalDate.now())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "erro", "A validade informada já passou. Regularize a anuidade antes de enviar."));
            }
        }

        Optional<CredencialProfissional> existente =
                repository.findByUsuarioIdAndProfissao(logado.getId(), profissao);

        if (existente.isPresent()) {
            StatusCredencial st = existente.get().getStatus();
            if (st == StatusCredencial.PENDENTE) {
                return ResponseEntity.badRequest().body(Map.of(
                        "erro", "Sua credencial de " + profissao.getRotulo() + " já está em análise."));
            }
            if (st == StatusCredencial.APROVADA && existente.get().isVigente()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "erro", "Você já tem credencial de " + profissao.getRotulo() + " aprovada."));
            }
        }

        String nomeInterno;
        try {
            nomeInterno = documentoService.guardar(documento);
        } catch (DocumentoPrivadoService.DocumentoInvalidoException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of(
                    "erro", "Não foi possível guardar o documento. Tente novamente."));
        }

        CredencialProfissional c = existente.orElseGet(CredencialProfissional::new);
        c.setUsuario(logado);
        c.setProfissao(profissao);
        c.setStatus(StatusCredencial.PENDENTE);
        c.setNumeroRegistro(numeroRegistro.trim());
        c.setUfRegistro(ufRegistro != null && !ufRegistro.isBlank() ? ufRegistro.trim().toUpperCase() : null);
        c.setValidoAte(validade);
        c.setDocumentoArquivo(nomeInterno);
        c.setDocumentoNomeOriginal(DocumentoPrivadoService.nomeParaExibicao(documento.getOriginalFilename()));
        c.setDocumentoRemovidoEm(null);
        c.setMotivoRecusa(null);
        c.setAnalisadoPor(null);
        c.setDataAnalise(null);
        repository.save(c);

        return ResponseEntity.ok(paraTela(c));
    }

    // ── Lado do ADMIN ───────────────────────────────────────

    @Operation(summary = "Fila de credenciais para conferir",
               description = "Cada item traz o link da consulta pública do conselho. Conferir na "
                           + "fonte vale muito mais do que olhar o documento enviado.")
    @GetMapping("/admin/credenciais")
    public ResponseEntity<?> fila(@RequestParam(required = false) StatusCredencial status) {
        return ResponseEntity.ok(repository.listarParaAnalise(status)
                .stream().map(this::paraTelaAdmin).toList());
    }

    @Operation(summary = "Aprova, recusa ou revoga uma credencial",
               description = "Corpo: `{\"status\": \"APROVADA\", \"motivo\": \"...\"}`. "
                           + "Em qualquer desfecho o documento é destruído — ele existia para "
                           + "sustentar a decisão, e a decisão foi tomada. Recusa exige motivo.")
    @PatchMapping("/admin/credenciais/{id}")
    @Transactional
    public ResponseEntity<?> analisar(@PathVariable Long id,
                                      @RequestBody Map<String, String> body,
                                      @AuthenticationPrincipal Usuario logado) {
        Optional<CredencialProfissional> opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        CredencialProfissional c = opt.get();

        StatusCredencial novo;
        try {
            novo = StatusCredencial.valueOf(body.getOrDefault("status", ""));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Use APROVADA, RECUSADA ou REVOGADA."));
        }
        if (novo == StatusCredencial.PENDENTE) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Use APROVADA, RECUSADA ou REVOGADA."));
        }

        String motivo = body.get("motivo");
        if (novo != StatusCredencial.APROVADA && (motivo == null || motivo.isBlank())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Explique o motivo — a pessoa precisa saber o que corrigir."));
        }

        c.setStatus(novo);
        c.setMotivoRecusa(motivo);
        c.setAnalisadoPor(logado);
        c.setDataAnalise(LocalDateTime.now());
        descartarDocumento(c);

        log.info("Credencial {} ({} de usuário {}) definida como {} por {}",
                id, c.getProfissao(), c.getUsuario().getId(), novo, logado.getId());

        return ResponseEntity.ok(paraTelaAdmin(repository.save(c)));
    }

    @Operation(summary = "Designa um analista",
               description = "Corpo: `{\"email\": \"...\"}`. Analista não tem conselho, então não "
                           + "há registro a conferir: a habilitação nasce aprovada pela mão do "
                           + "ADMIN, sem documento e sem fila de análise.")
    @PostMapping("/admin/credenciais/analistas")
    @Transactional
    public ResponseEntity<?> designarAnalista(@RequestBody Map<String, String> body,
                                              @AuthenticationPrincipal Usuario logado) {
        String email = body.getOrDefault("email", "").trim().toLowerCase();
        if (email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Informe o e-mail do analista."));
        }

        Object encontrado = usuarioRepository.findByEmail(email);
        if (!(encontrado instanceof Usuario alvo)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Nenhum usuário cadastrado com o e-mail " + email + "."));
        }

        CredencialProfissional c = repository
                .findByUsuarioIdAndProfissao(alvo.getId(), EspecialidadeTecnica.ANALISTA)
                .orElseGet(CredencialProfissional::new);
        c.setUsuario(alvo);
        c.setProfissao(EspecialidadeTecnica.ANALISTA);
        c.setStatus(StatusCredencial.APROVADA);
        c.setMotivoRecusa(null);
        c.setAnalisadoPor(logado);
        c.setDataAnalise(LocalDateTime.now());
        repository.save(c);

        return ResponseEntity.ok(paraTelaAdmin(c));
    }

    @Operation(summary = "Baixa o documento da credencial",
               description = "Devolve 410 depois da análise: o arquivo é apagado nela. Sempre "
                           + "como anexo e com nosniff, e cada acesso fica registrado.")
    @GetMapping("/admin/credenciais/{id}/documento")
    public ResponseEntity<?> baixarDocumento(@PathVariable Long id,
                                             @AuthenticationPrincipal Usuario logado) {
        Optional<CredencialProfissional> opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        CredencialProfissional c = opt.get();

        if (c.getDocumentoArquivo() == null) {
            return ResponseEntity.status(410).body(Map.of(
                    "erro", c.getDocumentoRemovidoEm() != null
                            ? "O documento foi apagado após a análise."
                            : "Não há documento anexado a esta credencial."));
        }

        byte[] conteudo;
        try {
            conteudo = documentoService.ler(c.getDocumentoArquivo());
        } catch (Exception e) {
            log.warn("Documento da credencial {} indisponível: {}", id, e.getMessage());
            return ResponseEntity.status(410).body(Map.of(
                    "erro", "O arquivo não está mais disponível."));
        }

        log.info("Documento da credencial {} aberto pelo usuário {}", id, logado.getId());

        String nome = DocumentoPrivadoService.nomeParaExibicao(c.getDocumentoNomeOriginal());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(documentoService.contentType(c.getDocumentoArquivo())))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nome + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .body(conteudo);
    }

    // ── Helpers ─────────────────────────────────────────────

    private void descartarDocumento(CredencialProfissional c) {
        if (c.getDocumentoArquivo() == null) return;
        documentoService.apagar(c.getDocumentoArquivo());
        c.setDocumentoArquivo(null);
        c.setDocumentoRemovidoEm(LocalDateTime.now());
    }

    private Map<String, Object> paraTela(CredencialProfissional c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("profissao", c.getProfissao());
        m.put("profissaoRotulo", c.getProfissao().getRotulo());
        m.put("conselho", c.getProfissao().getConselho());
        m.put("status", c.getStatus());
        m.put("vigente", c.isVigente());
        m.put("vencida", c.isVencida());
        m.put("registroFormatado", c.getRegistroFormatado());
        m.put("validoAte", c.getValidoAte());
        m.put("motivoRecusa", c.getMotivoRecusa());
        m.put("dataSolicitacao", c.getDataSolicitacao());
        m.put("dataAnalise", c.getDataAnalise());
        m.put("documentoRemovidoEm", c.getDocumentoRemovidoEm());
        return m;
    }

    private Map<String, Object> paraTelaAdmin(CredencialProfissional c) {
        Map<String, Object> m = new LinkedHashMap<>(paraTela(c));
        m.put("usuarioId", c.getUsuario().getId());
        m.put("usuarioNome", c.getUsuario().getNome());
        m.put("usuarioEmail", c.getUsuario().getEmail());
        m.put("documentoDisponivel", c.getDocumentoArquivo() != null);
        m.put("analisadoPorNome", c.getAnalisadoPor() != null ? c.getAnalisadoPor().getNome() : null);
        m.put("consultaPublica", linkDeConsulta(c));
        return m;
    }

    /**
     * Onde conferir o registro na fonte. É o ponto forte da análise: um PDF
     * enviado qualquer um monta, o registro no conselho não.
     */
    private String linkDeConsulta(CredencialProfissional c) {
        if (c.getProfissao() == null || !c.getProfissao().temConselho()) return null;
        return switch (c.getProfissao()) {
            case ENGENHEIRO -> "https://www.confea.org.br/consulta-de-profissionais";
            case ARQUITETO  -> "https://servicos.caubr.gov.br/pesquisa-profissionais/";
            default -> null;
        };
    }
}
