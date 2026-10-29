package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.dto.condominio.AcessoCondominioDTO;
import br.com.urbanoconnect.api.domain.dto.condominio.CondominioResumoDTO;
import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.AcessoCondominioRepository;
import br.com.urbanoconnect.api.domain.repository.CondominioRepository;
import br.com.urbanoconnect.api.domain.service.DocumentoPrivadoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Optional;

/**
 * ══════════════════════════════════════════════════════════════
 *  LADO DO MORADOR
 * ══════════════════════════════════════════════════════════════
 *
 *  Aberto a qualquer usuário autenticado — morador não é corretor. Ele
 *  encontra o condomínio, envia a conta de luz e acompanha a análise.
 *  Enquanto o vínculo não for aprovado, não registra opinião nenhuma.
 */
@Tag(name = "Moradores — vínculo",
     description = "Aberto a qualquer usuário autenticado: morador não é corretor. Ele encontra "
                 + "o condomínio, envia a conta de luz e acompanha a análise. Enquanto o vínculo "
                 + "não for aprovado, não registra opinião nenhuma.")
@RestController
@RequestMapping("/moradores")
public class MoradorController {

    /** Busca curta demais devolveria a base inteira; exigimos 3 caracteres. */
    private static final int TAMANHO_MINIMO_BUSCA = 3;

    @Autowired private CondominioRepository condominioRepository;
    @Autowired private AcessoCondominioRepository acessoRepository;
    @Autowired private DocumentoPrivadoService comprovanteService;

    /**
     * Busca para o morador achar o próprio prédio. Devolve o resumo, não o
     * cadastro completo: esta rota é acessível a qualquer usuário logado e o
     * cadastro tem CNPJ, administradora e contato.
     */
    @Operation(summary = "Busca condomínios para o morador achar o próprio prédio",
               description = "Exige ao menos 3 letras. Devolve o resumo, não o cadastro: esta "
                           + "rota é acessível a qualquer usuário logado, e o cadastro completo "
                           + "traz CNPJ, administradora e contato — viraria diretório de "
                           + "prospecção.")
    @GetMapping("/condominios")
    public ResponseEntity<?> buscarCondominios(@RequestParam(required = false) String busca) {
        if (busca == null || busca.trim().length() < TAMANHO_MINIMO_BUSCA) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Digite ao menos " + TAMANHO_MINIMO_BUSCA
                            + " letras do nome, bairro ou cidade do condomínio."));
        }
        return ResponseEntity.ok(condominioRepository.buscarTodos(busca.trim())
                .stream().map(CondominioResumoDTO::new).toList());
    }

    /** Os vínculos do próprio usuário e em que pé estão. */
    @GetMapping("/solicitacoes")
    public ResponseEntity<?> minhasSolicitacoes(@AuthenticationPrincipal Usuario logado) {
        return ResponseEntity.ok(acessoRepository.listarDoUsuario(logado.getId())
                .stream().map(AcessoCondominioDTO::new).toList());
    }

    /**
     * Solicita vínculo de morador anexando o comprovante de residência.
     *
     * Multipart porque carrega arquivo. Quem já foi recusado ou revogado pode
     * reenviar — o vínculo volta para PENDENTE com o documento novo.
     */
    @Operation(summary = "Solicita vínculo de morador anexando o comprovante",
               description = "Multipart. `moradorDesde` no formato AAAA-MM-DD. O comprovante "
                           + "aceita JPG, PNG ou PDF — o tipo é decidido pelos bytes do arquivo, "
                           + "não pela extensão nem pelo Content-Type, e SVG é recusado por ser "
                           + "XML com script. Máximo 10 MB. Quem foi recusado ou revogado pode "
                           + "reenviar; quem está em análise ou já aprovado, não.")
    @PostMapping(path = "/solicitacoes", consumes = "multipart/form-data")
    @Transactional
    public ResponseEntity<?> solicitar(@RequestParam Long condominioId,
                                       @RequestParam(required = false) String unidade,
                                       @RequestParam VinculoMorador vinculo,
                                       @RequestParam String moradorDesde,
                                       @RequestParam("comprovante") MultipartFile comprovante,
                                       @AuthenticationPrincipal Usuario logado) {

        Optional<Condominio> optCond = condominioRepository.findById(condominioId);
        if (optCond.isEmpty() || !Boolean.TRUE.equals(optCond.get().getAtivo())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Condomínio não encontrado: " + condominioId));
        }

        LocalDate desde;
        try {
            desde = LocalDate.parse(moradorDesde);
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Informe desde quando você mora no formato AAAA-MM-DD."));
        }
        if (desde.isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "A data de início da moradia não pode estar no futuro."));
        }

        Optional<AcessoCondominio> existente =
                acessoRepository.findByCondominioIdAndUsuarioId(condominioId, logado.getId());

        if (existente.isPresent()) {
            AcessoCondominio a = existente.get();
            if (a.getPapel() == PapelAcessoCondominio.AVALIADOR) {
                return ResponseEntity.badRequest().body(Map.of(
                        "erro", "Você já está vinculado a este condomínio como avaliador."));
            }
            if (a.getStatus() == StatusAcessoCondominio.PENDENTE) {
                return ResponseEntity.badRequest().body(Map.of(
                        "erro", "Sua solicitação para este condomínio já está em análise."));
            }
            if (a.getStatus() == StatusAcessoCondominio.APROVADO) {
                return ResponseEntity.badRequest().body(Map.of(
                        "erro", "Você já tem acesso de morador neste condomínio."));
            }
        }

        String nomeInterno;
        try {
            nomeInterno = comprovanteService.guardar(comprovante);
        } catch (DocumentoPrivadoService.DocumentoInvalidoException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of(
                    "erro", "Não foi possível guardar o comprovante. Tente novamente."));
        }

        AcessoCondominio a = existente.orElseGet(AcessoCondominio::new);
        a.setCondominio(optCond.get());
        a.setUsuario(logado);
        a.setPapel(PapelAcessoCondominio.MORADOR);
        a.setStatus(StatusAcessoCondominio.PENDENTE);
        a.setUnidade(unidade);
        a.setVinculo(vinculo);
        a.setMoradorDesde(desde);
        a.setComprovanteArquivo(nomeInterno);
        a.setComprovanteNomeOriginal(
                DocumentoPrivadoService.nomeParaExibicao(comprovante.getOriginalFilename()));
        a.setComprovanteTipo(comprovanteService.contentType(nomeInterno));
        a.setComprovanteTamanho(comprovante.getSize());
        a.setComprovanteRemovidoEm(null);
        a.setMotivoRecusa(null);
        a.setAnalisadoPor(null);
        a.setDataAnalise(null);

        acessoRepository.save(a);
        return ResponseEntity.ok(new AcessoCondominioDTO(a));
    }

    /**
     * Desfaz o próprio vínculo — quem se mudou não deve seguir opinando.
     * Também é a via prática do direito de exclusão: apaga o comprovante que
     * ainda estiver em análise.
     */
    @DeleteMapping("/solicitacoes/{acessoId}")
    @Transactional
    public ResponseEntity<?> cancelar(@PathVariable Long acessoId,
                                      @AuthenticationPrincipal Usuario logado) {
        Optional<AcessoCondominio> opt = acessoRepository.findById(acessoId);
        if (opt.isEmpty() || !opt.get().getUsuario().getId().equals(logado.getId())) {
            return ResponseEntity.notFound().build();
        }
        AcessoCondominio a = opt.get();
        if (a.getComprovanteArquivo() != null) {
            comprovanteService.apagar(a.getComprovanteArquivo());
        }
        acessoRepository.delete(a);
        return ResponseEntity.noContent().build();
    }
}
