package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.dto.iqc.CatalogoOpiniaoResposta;
import br.com.urbanoconnect.api.domain.dto.iqc.DadosOpiniaoMorador;
import br.com.urbanoconnect.api.domain.dto.iqc.OpiniaoMoradorDTO;
import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.AcessoCondominioRepository;
import br.com.urbanoconnect.api.domain.repository.CondominioRepository;
import br.com.urbanoconnect.api.domain.repository.OpiniaoMoradorRepository;
import br.com.urbanoconnect.api.domain.service.AcessoIqcService;
import br.com.urbanoconnect.api.domain.service.CatalogoOpiniaoMorador;
import br.com.urbanoconnect.api.domain.service.OpiniaoMoradorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * ══════════════════════════════════════════════════════════════
 *  OPINIÃO DO MORADOR — coleta e leitura
 * ══════════════════════════════════════════════════════════════
 *
 *  Duas audiências, duas visões dos mesmos dados:
 *
 *  Morador (/moradores/opiniao/**) — responde e edita a própria opinião. Exige
 *  vínculo de MORADOR aprovado, ou seja, comprovante já analisado. É ele quem
 *  decide assinar com o próprio nome ou responder anonimamente, e pode trocar
 *  essa escolha depois.
 *
 *  Quem avalia (/condominios/{id}/opinioes) — lê as opiniões para montar o
 *  laudo, respeitando a escolha de cada morador. Nas anônimas recebe apenas o
 *  vínculo e a faixa de tempo de moradia.
 */
@Tag(name = "Moradores — opinião (10% do IQC)",
     description = "O laudo técnico mede o que existe; o morador mede se funciona. 16 perguntas "
                 + "em 5 telas, ponderadas pelos mesmos pesos das 8 dimensões técnicas. Só "
                 + "pontua quem tem vínculo aprovado e 6+ meses de moradia, e o bloco só entra "
                 + "com no mínimo 3 opiniões.")
@RestController
public class OpiniaoMoradorController {

    @Autowired private OpiniaoMoradorRepository opiniaoRepository;
    @Autowired private AcessoCondominioRepository acessoRepository;
    @Autowired private CondominioRepository condominioRepository;
    @Autowired private OpiniaoMoradorService opiniaoService;
    @Autowired private AcessoIqcService acessoIqcService;

    // ── Lado do morador ─────────────────────────────────────

    /** Estrutura do questionário. Aberto a qualquer autenticado: são só as perguntas. */
    @GetMapping("/moradores/opiniao/catalogo")
    public ResponseEntity<?> catalogo() {
        List<CatalogoOpiniaoResposta.Tela> telas = new ArrayList<>();

        for (String titulo : CatalogoOpiniaoMorador.TELAS) {
            List<CatalogoOpiniaoResposta.Pergunta> perguntas = CatalogoOpiniaoMorador.PERGUNTAS.stream()
                    .filter(p -> p.tela().equals(titulo))
                    .map(p -> new CatalogoOpiniaoResposta.Pergunta(
                            p.chave(), p.enunciado(), p.tipo().name(),
                            p.ancoraZero(), p.ancoraDez(),
                            p.opcoes().isEmpty() ? null : p.opcoes(),
                            p.permiteNaoSeAplica(), p.dimensao().name()))
                    .toList();
            telas.add(new CatalogoOpiniaoResposta.Tela(titulo, perguntas));
        }

        return ResponseEntity.ok(new CatalogoOpiniaoResposta(
                telas,
                OpiniaoMoradorService.MINIMO_DE_OPINIOES,
                AcessoCondominio.MESES_MINIMOS_DE_MORADIA,
                (int) Math.round(OpiniaoMoradorService.PESO_MORADORES * 100)));
    }

    @GetMapping("/moradores/opiniao/{condominioId}")
    public ResponseEntity<?> minhaOpiniao(@PathVariable Long condominioId,
                                          @AuthenticationPrincipal Usuario logado) {
        AcessoCondominio vinculo = vinculoDeMoradorAprovado(condominioId, logado);
        if (vinculo == null) return semVinculo();

        return opiniaoRepository.findByCondominioIdAndUsuarioId(condominioId, logado.getId())
                .<ResponseEntity<?>>map(o -> ResponseEntity.ok(OpiniaoMoradorDTO.doAutor(
                        o, vinculo.getVinculo(), vinculo.getMesesDeMoradia(),
                        vinculo.isOpiniaoValidaParaCalculo())))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Cria ou atualiza a opinião. Um PUT porque é sempre uma só por morador
     * por condomínio — reenviar substitui, e é assim que o morador corrige o
     * que mudou no prédio.
     */
    @Operation(summary = "Registra ou atualiza a própria opinião",
               description = "PUT porque é uma só por morador por condomínio: reenviar "
                           + "substitui, e é assim que ele corrige o que mudou no prédio. "
                           + "Cada resposta aceita nota 0–10, `NAO_SEI`, ou `NAO_SE_APLICA` "
                           + "onde a pergunta permitir. Chave desconhecida é recusada, não "
                           + "ignorada. `identificarAutor` decide entre assinar e ficar "
                           + "anônimo — ausente significa anônimo.")
    @PutMapping("/moradores/opiniao/{condominioId}")
    @Transactional
    public ResponseEntity<?> registrar(@PathVariable Long condominioId,
                                       @RequestBody @Valid DadosOpiniaoMorador dados,
                                       @AuthenticationPrincipal Usuario logado) {
        AcessoCondominio vinculo = vinculoDeMoradorAprovado(condominioId, logado);
        if (vinculo == null) return semVinculo();

        Map<String, String> erros = opiniaoService.validar(dados.respostas());
        if (!erros.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Algumas respostas precisam de correção.",
                    "campos", erros));
        }

        OpiniaoMorador o = opiniaoRepository
                .findByCondominioIdAndUsuarioId(condominioId, logado.getId())
                .orElseGet(OpiniaoMorador::new);

        o.setCondominio(vinculo.getCondominio());
        o.setUsuario(logado);
        o.setRespostas(dados.respostas() != null ? dados.respostas() : new HashMap<>());
        o.setComentarioParaInteressado(vazioViraNulo(dados.comentarioParaInteressado()));
        o.setComentarioOQueMudaria(vazioViraNulo(dados.comentarioOQueMudaria()));
        // Campo ausente cai no anônimo, nunca no identificado.
        o.setIdentificarAutor(Boolean.TRUE.equals(dados.identificarAutor()));
        opiniaoRepository.save(o);

        return ResponseEntity.ok(OpiniaoMoradorDTO.doAutor(
                o, vinculo.getVinculo(), vinculo.getMesesDeMoradia(),
                vinculo.isOpiniaoValidaParaCalculo()));
    }

    @DeleteMapping("/moradores/opiniao/{condominioId}")
    @Transactional
    public ResponseEntity<?> remover(@PathVariable Long condominioId,
                                     @AuthenticationPrincipal Usuario logado) {
        Optional<OpiniaoMorador> opt =
                opiniaoRepository.findByCondominioIdAndUsuarioId(condominioId, logado.getId());
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        opiniaoRepository.delete(opt.get());
        return ResponseEntity.noContent().build();
    }

    // ── Lado de quem avalia ─────────────────────────────────

    /** Opiniões do condomínio para montar o laudo, respeitando quem assinou e quem não. */
    @Operation(summary = "Opiniões do condomínio para o laudo",
               description = "Respeita a escolha de cada morador. Nas anônimas o autor vem nulo "
                           + "e o tempo de moradia vira faixa — o número exato de meses, junto "
                           + "com proprietário ou inquilino, identificaria a pessoa num "
                           + "condomínio pequeno.")
    @GetMapping("/condominios/{condominioId}/opinioes")
    public ResponseEntity<?> listarParaLaudo(@PathVariable Long condominioId,
                                             @AuthenticationPrincipal Usuario logado) {
        Optional<Condominio> cond = condominioRepository.buscarPorId(condominioId);
        if (cond.isEmpty() || !acessoIqcService.podeAvaliarCondominio(logado, cond.get())) {
            return ResponseEntity.status(404).body(Map.of(
                    "erro", "Condomínio não encontrado: " + condominioId));
        }

        Map<Long, AcessoCondominio> vinculos = vinculosAprovados(condominioId);

        List<OpiniaoMoradorDTO> lista = opiniaoRepository.listarDoCondominio(condominioId).stream()
                .map(o -> {
                    AcessoCondominio v = vinculos.get(o.getUsuario().getId());
                    return OpiniaoMoradorDTO.paraLaudo(o,
                            v != null ? v.getVinculo() : null,
                            v != null ? v.getMesesDeMoradia() : null,
                            v != null && v.isOpiniaoValidaParaCalculo());
                })
                .toList();

        return ResponseEntity.ok(lista);
    }

    /**
     * Oculta ou reexibe os comentários de uma opinião. Só quem administra o
     * condomínio — e é moderação, não censura: o texto continua gravado, e o
     * autor segue enxergando o próprio.
     */
    @PatchMapping("/condominios/{condominioId}/opinioes/{opiniaoId}/comentarios")
    @Transactional
    public ResponseEntity<?> moderarComentarios(@PathVariable Long condominioId,
                                                @PathVariable Long opiniaoId,
                                                @RequestBody Map<String, Boolean> body,
                                                @AuthenticationPrincipal Usuario logado) {
        Optional<Condominio> cond = condominioRepository.buscarPorId(condominioId);
        if (cond.isEmpty() || !acessoIqcService.podeGerenciarCondominio(logado, cond.get())) {
            return ResponseEntity.status(404).body(Map.of(
                    "erro", "Condomínio não encontrado: " + condominioId));
        }

        Optional<OpiniaoMorador> opt = opiniaoRepository.findById(opiniaoId);
        if (opt.isEmpty() || !opt.get().getCondominio().getId().equals(condominioId)) {
            return ResponseEntity.notFound().build();
        }

        Boolean ocultar = body.get("ocultos");
        if (ocultar == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Informe \"ocultos\": true ou false."));
        }

        OpiniaoMorador o = opt.get();
        o.setComentariosOcultos(ocultar);
        opiniaoRepository.save(o);

        Map<Long, AcessoCondominio> vinculos = vinculosAprovados(condominioId);
        AcessoCondominio v = vinculos.get(o.getUsuario().getId());
        return ResponseEntity.ok(OpiniaoMoradorDTO.paraLaudo(o,
                v != null ? v.getVinculo() : null,
                v != null ? v.getMesesDeMoradia() : null,
                v != null && v.isOpiniaoValidaParaCalculo()));
    }

    // ── Helpers ─────────────────────────────────────────────

    private AcessoCondominio vinculoDeMoradorAprovado(Long condominioId, Usuario logado) {
        return acessoRepository.findByCondominioIdAndUsuarioId(condominioId, logado.getId())
                .filter(a -> a.getPapel() == PapelAcessoCondominio.MORADOR && a.isAprovado())
                .orElse(null);
    }

    private Map<Long, AcessoCondominio> vinculosAprovados(Long condominioId) {
        Map<Long, AcessoCondominio> mapa = new HashMap<>();
        for (AcessoCondominio a : acessoRepository.findByCondominioIdAndPapelAndStatus(
                condominioId, PapelAcessoCondominio.MORADOR, StatusAcessoCondominio.APROVADO)) {
            if (a.getUsuario() != null) mapa.put(a.getUsuario().getId(), a);
        }
        return mapa;
    }

    private static String vazioViraNulo(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }

    private ResponseEntity<?> semVinculo() {
        return ResponseEntity.status(403).body(Map.of(
                "erro", "Só moradores com vínculo aprovado podem opinar. "
                        + "Envie o comprovante de residência e aguarde a análise."));
    }
}
