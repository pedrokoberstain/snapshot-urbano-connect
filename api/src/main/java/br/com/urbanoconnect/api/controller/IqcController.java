package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.dto.iqc.DadosAvaliacaoIqc;
import br.com.urbanoconnect.api.domain.dto.iqc.DadosRespostasIqc;
import br.com.urbanoconnect.api.domain.dto.iqc.ParteAvaliacaoIqcDTO;
import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.AvaliacaoIqcRepository;
import br.com.urbanoconnect.api.domain.repository.UsuarioRepository;
import br.com.urbanoconnect.api.domain.repository.CondominioRepository;
import br.com.urbanoconnect.api.domain.repository.ImovelRepository;
import br.com.urbanoconnect.api.domain.repository.ParteAvaliacaoIqcRepository;
import br.com.urbanoconnect.api.domain.service.AcessoIqcService;
import br.com.urbanoconnect.api.domain.service.ColaboracaoIqcService;
import br.com.urbanoconnect.api.domain.service.CredencialProfissionalService;
import br.com.urbanoconnect.api.domain.service.IqcService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Calculadora IQC profissional (condomínios). Rota privada — o
 * SecurityConfigurations restringe /iqc/** a CORRETOR ou ADMIN; aqui aplicamos
 * a regra adicional: CORRETOR precisa de plano PRO (ADMIN passa direto).
 */
@Tag(name = "IQC — avaliações",
     description = "Laudo técnico das 8 dimensões. A permissão é por condomínio: ADMIN, "
                 + "CORRETOR PRO, ou quem recebeu acesso de avaliador naquele empreendimento. "
                 + "O score final é 90% técnico + 10% moradores quando há ao menos 3 opiniões "
                 + "válidas; sem quórum, é 100% técnico.")
@RestController
@RequestMapping("/iqc")
public class IqcController {

    @Autowired
    private AvaliacaoIqcRepository avaliacaoIqcRepository;

    @Autowired
    private IqcService iqcService;

    @Autowired
    private ImovelRepository imovelRepository;

    @Autowired
    private CondominioRepository condominioRepository;

    @Autowired
    private AcessoIqcService acessoIqcService;

    @Autowired
    private ParteAvaliacaoIqcRepository parteRepository;

    @Autowired
    private ColaboracaoIqcService colaboracaoService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CredencialProfissionalService credencialService;

    // ── Regras de acesso ────────────────────────────────────
    /**
     * Porta de entrada: ADMIN, CORRETOR PRO, ou quem foi convidado como
     * avaliador em algum condomínio. O recorte fino — qual condomínio — fica em
     * {@link #resolverCondominio}.
     *
     * A partir daqui o filtro de segurança só exige autenticação nesta rota,
     * porque a permissão passou a depender do condomínio e não do papel. Este
     * método é o portão, e toda ação abaixo o atravessa.
     */
    private boolean podeUsar(Usuario u) {
        return acessoIqcService.podeEntrarNoIqc(u);
    }

    /**
     * Coordena a avaliação: cria, edita metadados, distribui as partes,
     * exclui e manda calcular. ADMIN ou quem abriu a avaliação.
     */
    private boolean podeCoordenar(AvaliacaoIqc a, Usuario u) {
        if (u == null) return false;
        if (u.getTipo() == TipoUsuario.ADMIN) return true;
        return a.getAvaliador() != null && a.getAvaliador().getId().equals(u.getId());
    }

    /**
     * Enxerga a avaliação: quem coordena, mais qualquer profissional com parte
     * atribuída nela. Antes só o criador via — e era isso que impedia
     * engenheiro, arquiteto e analista de trabalharem no mesmo laudo.
     */
    private boolean podeVer(AvaliacaoIqc a, Usuario u) {
        if (podeCoordenar(a, u)) return true;
        return parteRepository.existsByAvaliacaoIdAndResponsavelId(a.getId(), u.getId());
    }

    // ── Endpoints ───────────────────────────────────────────

    /** Estrutura do formulário (8 dimensões e variáveis) para o front. */
    @GetMapping("/catalogo")
    public ResponseEntity<?> catalogo(@AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();
        return ResponseEntity.ok(iqcService.catalogo());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> criar(@RequestBody @Valid DadosAvaliacaoIqc dados,
                                   @AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();

        Condominio cond;
        try {
            cond = resolverCondominio(dados.condominioId(), logado);
        } catch (CondominioInvalidoException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }

        AvaliacaoIqc a = new AvaliacaoIqc();
        aplicarDados(a, dados, cond);
        a.setAvaliador(logado);
        avaliacaoIqcRepository.save(a);

        // As três partes nascem junto, ainda sem responsável: assim a tela de
        // acompanhamento já mostra o que falta, inclusive o que ninguém assumiu.
        colaboracaoService.criarPartes(a);

        return ResponseEntity.ok(a);
    }

    @GetMapping
    public ResponseEntity<?> listar(@AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();

        List<AvaliacaoIqc> lista = logado.getTipo() == TipoUsuario.ADMIN
                ? avaliacaoIqcRepository.findAll()
                : avaliacaoIqcRepository.findByAvaliadorIdOrderByDataCriacaoDesc(logado.getId());
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detalhar(@PathVariable Long id,
                                      @AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();

        Optional<AvaliacaoIqc> opt = avaliacaoIqcRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        if (!podeVer(opt.get(), logado)) return proibido();
        return ResponseEntity.ok(opt.get());
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> atualizar(@PathVariable Long id,
                                       @RequestBody DadosAvaliacaoIqc dados,
                                       @AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();

        Optional<AvaliacaoIqc> opt = avaliacaoIqcRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        AvaliacaoIqc a = opt.get();
        if (!podeCoordenar(a, logado)) return proibido();

        Condominio cond;
        try {
            cond = resolverCondominio(dados.condominioId(), logado);
        } catch (CondominioInvalidoException e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }

        aplicarDados(a, dados, cond);
        return ResponseEntity.ok(avaliacaoIqcRepository.save(a));
    }

    /** Roda o motor de cálculo sobre as respostas já salvas. */
    @Operation(summary = "Roda o motor de cálculo sobre as respostas já salvas",
               description = "Grava `scoreTecnico` e `scoreFinal` separados, para que se possa "
                           + "auditar depois quanto da nota veio da vistoria e quanto veio dos "
                           + "moradores. `scoresMoradoresPorDimensao` permite comparar percepção "
                           + "e vistoria linha a linha. Quando `moradoresAplicado` for false, "
                           + "faltou quórum e o final é o técnico puro.")
    @PostMapping("/{id}/calcular")
    @Transactional
    public ResponseEntity<?> calcular(@PathVariable Long id,
                                      @AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();

        Optional<AvaliacaoIqc> opt = avaliacaoIqcRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        if (!podeCoordenar(opt.get(), logado)) return proibido();

        // Fechar o laudo exige a assinatura de engenheiro e arquiteto. Sem isso
        // o número sairia sem responsável técnico por trás — que é justamente o
        // que separa um laudo de um formulário preenchido.
        List<EspecialidadeTecnica> faltando = colaboracaoService.pendenciasParaConcluir(id);
        if (!faltando.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "O laudo só pode ser concluído depois que "
                            + faltando.stream().map(EspecialidadeTecnica::getRotulo)
                                      .collect(java.util.stream.Collectors.joining(" e "))
                            + " finalizarem suas partes.",
                    "pendentes", faltando));
        }

        return ResponseEntity.ok(iqcService.calcular(id));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> excluir(@PathVariable Long id,
                                     @AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();

        Optional<AvaliacaoIqc> opt = avaliacaoIqcRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        if (!podeCoordenar(opt.get(), logado)) return proibido();

        avaliacaoIqcRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Colaboração entre os três profissionais ─────────────

    @Operation(summary = "Situação das três partes do laudo",
               description = "Mostra quem responde por cada especialidade, o que já foi assinado "
                           + "e o quanto de cada dimensão está preenchido.")
    @GetMapping("/{id}/partes")
    public ResponseEntity<?> partes(@PathVariable Long id,
                                    @AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();
        Optional<AvaliacaoIqc> opt = avaliacaoIqcRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        if (!podeVer(opt.get(), logado)) return proibido();

        return ResponseEntity.ok(Map.of(
                "partes", parteRepository.listarDaAvaliacao(id).stream()
                        .map(ParteAvaliacaoIqcDTO::new).toList(),
                "completudePorDimensao", colaboracaoService.completudePorDimensao(opt.get().getRespostas()),
                "completudeGeral", colaboracaoService.completudeGeral(opt.get().getRespostas()),
                "pendentesParaConcluir", colaboracaoService.pendenciasParaConcluir(id)));
    }

    /** Fila de trabalho do profissional: as partes atribuídas a ele. */
    @Operation(summary = "Minhas partes atribuídas")
    @GetMapping("/minhas-partes")
    public ResponseEntity<?> minhasPartes(@AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();
        return ResponseEntity.ok(parteRepository.listarDoResponsavel(logado.getId())
                .stream().map(ParteAvaliacaoIqcDTO::new).toList());
    }

    @Operation(summary = "Designa quem responde por uma especialidade",
               description = "Corpo: `{\"email\": \"...\"}`. Envie e-mail nulo para desatribuir. "
                           + "Quem for designado passa a enxergar a avaliação e a gravar apenas "
                           + "as dimensões da especialidade dele.")
    @PutMapping("/{id}/partes/{especialidade}/responsavel")
    @Transactional
    public ResponseEntity<?> designar(@PathVariable Long id,
                                      @PathVariable EspecialidadeTecnica especialidade,
                                      @RequestBody Map<String, String> body,
                                      @AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();
        Optional<AvaliacaoIqc> opt = avaliacaoIqcRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        if (!podeCoordenar(opt.get(), logado)) return proibido();

        ParteAvaliacaoIqc parte = parteRepository
                .findByAvaliacaoIdAndEspecialidade(id, especialidade)
                .orElse(null);
        if (parte == null) return ResponseEntity.notFound().build();
        if (parte.isFinalizada()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Esta parte já foi assinada. Reabra antes de trocar o responsável."));
        }

        String email = body.getOrDefault("email", "");
        if (email == null || email.isBlank()) {
            parte.setResponsavel(null);
            parte.setStatus(StatusParteIqc.AGUARDANDO);
            return ResponseEntity.ok(new ParteAvaliacaoIqcDTO(parteRepository.save(parte)));
        }

        Object encontrado = usuarioRepository.findByEmail(email.trim().toLowerCase());
        if (!(encontrado instanceof Usuario alvo)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Nenhum usuário cadastrado com o e-mail " + email + "."));
        }

        // Só assume a parte quem tem a credencial daquela profissão vigente. É o
        // que liga as duas camadas: a habilitação diz quem a pessoa é, a
        // designação diz onde ela atua. Sem esta checagem, "engenheiro" seria
        // só um rótulo escolhido por quem distribui as partes.
        if (!credencialService.habilitado(alvo.getId(), especialidade)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", alvo.getNome() + " " + credencialService
                            .motivoDeNaoHabilitar(alvo.getId(), especialidade) + "."));
        }

        parte.setResponsavel(alvo);
        return ResponseEntity.ok(new ParteAvaliacaoIqcDTO(parteRepository.save(parte)));
    }

    @Operation(summary = "Grava as respostas da sua parte",
               description = "Só aceita chaves das dimensões da sua especialidade; as demais são "
                           + "recusadas e devolvidas em `recusadas`. As respostas são mescladas, "
                           + "não substituídas — o trabalho dos outros profissionais permanece.")
    @PutMapping("/{id}/respostas")
    @Transactional
    public ResponseEntity<?> gravarRespostas(@PathVariable Long id,
                                             @RequestBody DadosRespostasIqc dados,
                                             @AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();
        Optional<AvaliacaoIqc> opt = avaliacaoIqcRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        AvaliacaoIqc a = opt.get();
        if (!podeVer(a, logado)) return proibido();

        ParteAvaliacaoIqc parte = parteDoAutor(id, logado, dados.especialidade(), a);
        if (parte == null) {
            return ResponseEntity.status(403).body(Map.of(
                    "erro", "Você não responde por nenhuma parte desta avaliação."));
        }
        if (parte.isFinalizada()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "erro", "Sua parte já foi assinada. Reabra para poder editar."));
        }

        var resultado = colaboracaoService.mesclarRespostas(a, parte.getEspecialidade(), dados.respostas());
        avaliacaoIqcRepository.save(a);

        if (parte.getStatus() == StatusParteIqc.AGUARDANDO && resultado.aceitas() > 0) {
            parte.setStatus(StatusParteIqc.EM_ANDAMENTO);
        }
        parteRepository.save(parte);

        return ResponseEntity.ok(Map.of(
                "especialidade", parte.getEspecialidade(),
                "aceitas", resultado.aceitas(),
                "recusadas", resultado.recusadas(),
                "completudePorDimensao", colaboracaoService.completudePorDimensao(a.getRespostas())));
    }

    @Operation(summary = "Assina e finaliza a sua parte",
               description = "Corpo opcional: `{\"registroProfissional\": \"CREA-MT 12345\"}`. "
                           + "Nome e registro são congelados no laudo — um documento tem de "
                           + "continuar dizendo qual era o registro na data da assinatura.")
    @PostMapping("/{id}/partes/{especialidade}/finalizar")
    @Transactional
    public ResponseEntity<?> finalizarParte(@PathVariable Long id,
                                            @PathVariable EspecialidadeTecnica especialidade,
                                            @RequestBody(required = false) Map<String, String> body,
                                            @AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();
        Optional<AvaliacaoIqc> opt = avaliacaoIqcRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        AvaliacaoIqc a = opt.get();
        if (!podeVer(a, logado)) return proibido();

        ParteAvaliacaoIqc parte = parteRepository
                .findByAvaliacaoIdAndEspecialidade(id, especialidade).orElse(null);
        if (parte == null) return ResponseEntity.notFound().build();

        boolean ehResponsavel = parte.getResponsavel() != null
                && parte.getResponsavel().getId().equals(logado.getId());
        if (!ehResponsavel && !podeCoordenar(a, logado)) {
            return ResponseEntity.status(403).body(Map.of(
                    "erro", "Só quem responde por esta parte pode assiná-la."));
        }
        if (parte.isFinalizada()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Esta parte já foi assinada."));
        }

        // O registro sai da credencial vigente de quem assina, não do que o
        // cliente mandar. Aceitar o número pelo corpo deixaria qualquer um
        // estampar um CREA inventado no laudo; o campo só serve para o
        // coordenador assinar no lugar de alguém em caso excepcional.
        String registro = credencialService.registroParaAssinatura(logado.getId(), especialidade);
        if (registro == null && body != null && podeCoordenar(a, logado)) {
            registro = body.get("registroProfissional");
        }
        colaboracaoService.assinar(parte, logado, registro);

        return ResponseEntity.ok(Map.of(
                "parte", new ParteAvaliacaoIqcDTO(parte),
                "pendentesParaConcluir", colaboracaoService.pendenciasParaConcluir(id)));
    }

    @Operation(summary = "Reabre uma parte já assinada",
               description = "Ato explícito e registrado: a assinatura anterior é descartada, "
                           + "porque o laudo não pode carregar a assinatura de alguém sobre um "
                           + "conteúdo que mudou depois.")
    @PostMapping("/{id}/partes/{especialidade}/reabrir")
    @Transactional
    public ResponseEntity<?> reabrirParte(@PathVariable Long id,
                                          @PathVariable EspecialidadeTecnica especialidade,
                                          @AuthenticationPrincipal Usuario logado) {
        if (!podeUsar(logado)) return proibido();
        Optional<AvaliacaoIqc> opt = avaliacaoIqcRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        AvaliacaoIqc a = opt.get();
        if (!podeCoordenar(a, logado)) return proibido();

        ParteAvaliacaoIqc parte = parteRepository
                .findByAvaliacaoIdAndEspecialidade(id, especialidade).orElse(null);
        if (parte == null) return ResponseEntity.notFound().build();

        parte.setStatus(StatusParteIqc.EM_ANDAMENTO);
        parte.setAssinadoPorNome(null);
        parte.setRegistroProfissional(null);
        parte.setDataFinalizacao(null);

        // O laudo volta a rascunho: o número anterior foi calculado sobre um
        // conteúdo que está prestes a mudar.
        a.setStatus(StatusAvaliacaoIqc.RASCUNHO);
        avaliacaoIqcRepository.save(a);

        return ResponseEntity.ok(new ParteAvaliacaoIqcDTO(parteRepository.save(parte)));
    }

    /**
     * A parte pela qual o autor responde. Coordenador pode indicar a
     * especialidade explicitamente para gravar no lugar de alguém.
     */
    private ParteAvaliacaoIqc parteDoAutor(Long avaliacaoId, Usuario logado,
                                           EspecialidadeTecnica indicada, AvaliacaoIqc a) {
        if (indicada != null && podeCoordenar(a, logado)) {
            return parteRepository.findByAvaliacaoIdAndEspecialidade(avaliacaoId, indicada).orElse(null);
        }
        return parteRepository.findByAvaliacaoIdAndResponsavelId(avaliacaoId, logado.getId()).orElse(null);
    }

    // ── Helpers ─────────────────────────────────────────────

    /**
     * {@code cond} já vem resolvido e autorizado por {@link #resolverCondominio}.
     * Quando presente, o cadastro é a fonte da verdade da identidade e os campos
     * avulsos viram uma cópia dele — é essa cópia que o laudo preserva se o
     * cadastro mudar depois.
     */
    private void aplicarDados(AvaliacaoIqc a, DadosAvaliacaoIqc d, Condominio cond) {
        a.setCondominio(cond);

        if (cond != null) {
            a.setNomeCondominio(cond.getNome());
            a.setCidade(cond.getCidade());
            a.setBairro(cond.getBairro());
            a.setTipoCondominio(cond.getTipoCondominio());
        } else {
            // PUT não passa por @Valid, então o nome pode vir nulo: preserva o
            // que já está gravado em vez de violar o NOT NULL da coluna.
            if (d.nomeCondominio() != null && !d.nomeCondominio().isBlank()) {
                a.setNomeCondominio(d.nomeCondominio());
            }
            a.setCidade(d.cidade());
            a.setBairro(d.bairro());
            a.setTipoCondominio(d.tipoCondominio());
        }

        a.setObservacoes(d.observacoes());
        // As respostas NÃO passam mais por aqui. Com três profissionais no mesmo
        // laudo, gravar o mapa inteiro apagaria o trabalho dos outros dois — a
        // escrita ficou em PUT /iqc/{id}/respostas, filtrada por especialidade.
        if (d.imovelId() != null) {
            imovelRepository.findById(d.imovelId()).ifPresent(a::setImovel);
        } else {
            a.setImovel(null);
        }
    }

    /**
     * Devolve o condomínio do cadastro, ou null quando a avaliação não aponta
     * para nenhum. Recusa id inexistente e id de condomínio alheio — sem esta
     * checagem um corretor conseguiria descobrir nome e endereço dos
     * condomínios cadastrados por outro só referenciando ids em sequência.
     */
    private Condominio resolverCondominio(Long condominioId, Usuario logado) {
        if (condominioId == null) return null;

        Condominio c = condominioRepository.buscarPorId(condominioId)
                .orElseThrow(() -> new CondominioInvalidoException(
                        "Condomínio não encontrado: " + condominioId));

        if (!acessoIqcService.podeAvaliarCondominio(logado, c)) {
            throw new CondominioInvalidoException(
                    "Condomínio não encontrado: " + condominioId);
        }
        return c;
    }

    /** Sinaliza condomínio inexistente ou fora do alcance do usuário (vira 400). */
    private static class CondominioInvalidoException extends RuntimeException {
        CondominioInvalidoException(String msg) { super(msg); }
    }

    private ResponseEntity<?> proibido() {
        return ResponseEntity.status(403)
                .body(Map.of("erro", "Acesso restrito: exige ADMIN ou CORRETOR com plano PRO."));
    }
}
