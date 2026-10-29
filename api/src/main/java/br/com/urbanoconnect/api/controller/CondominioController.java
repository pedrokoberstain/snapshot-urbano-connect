package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.dto.condominio.CondominioDTO;
import br.com.urbanoconnect.api.domain.dto.condominio.DadosCadastroCondominio;
import br.com.urbanoconnect.api.domain.model.Condominio;
import br.com.urbanoconnect.api.domain.model.TipoUsuario;
import br.com.urbanoconnect.api.domain.model.Usuario;
import br.com.urbanoconnect.api.domain.repository.CondominioRepository;
import br.com.urbanoconnect.api.domain.service.AcessoIqcService;
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
 * Cadastro de condomínios avaliados pelo IQC.
 *
 * Duas permissões diferentes convivem aqui, e a diferença é proposital:
 * criar e editar o cadastro exige ADMIN ou CORRETOR PRO; ler exige apenas
 * alcançar aquele condomínio — o que inclui o avaliador convidado.
 */
@Tag(name = "Condomínios",
     description = "Cadastro dos empreendimentos avaliados pelo IQC. Criar e editar exige "
                 + "ADMIN ou CORRETOR PRO; ler exige alcançar aquele condomínio, o que inclui "
                 + "o avaliador convidado.")
@RestController
@RequestMapping("/condominios")
public class CondominioController {

    @Autowired
    private CondominioRepository condominioRepository;

    @Autowired
    private AcessoIqcService acessoIqcService;

    @Operation(summary = "Cadastra um condomínio",
               description = "Só o nome é obrigatório — o cadastro costuma começar incompleto "
                           + "em visita de campo. O CNPJ é opcional, mas quando informado é "
                           + "validado e precisa ser único; ele é gravado só com dígitos, então "
                           + "\"45.997.418/0001-53\" e \"45997418000153\" são o mesmo cadastro.")
    @PostMapping
    @Transactional
    public ResponseEntity<?> criar(@RequestBody @Valid DadosCadastroCondominio dados,
                                   @AuthenticationPrincipal Usuario logado) {
        if (!acessoIqcService.podeUsarIqc(logado)) return proibido();

        String cnpj = Condominio.normalizarCnpj(dados.cnpj());
        var conflito = cnpjJaCadastrado(cnpj, null);
        if (conflito != null) return conflito;

        Condominio c = new Condominio();
        aplicarDados(c, dados, cnpj);
        c.setCriadoPor(logado);
        condominioRepository.save(c);

        return ResponseEntity.ok(new CondominioDTO(c));
    }

    @Operation(summary = "Lista os condomínios que você alcança",
               description = "ADMIN vê todos. Os demais veem o que cadastraram mais aqueles em "
                           + "que receberam acesso de avaliador. O parâmetro `busca` filtra por "
                           + "nome, bairro ou cidade.")
    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(required = false) String busca,
                                    @AuthenticationPrincipal Usuario logado) {
        if (!acessoIqcService.podeEntrarNoIqc(logado)) return proibido();

        List<Condominio> lista = logado.getTipo() == TipoUsuario.ADMIN
                ? condominioRepository.buscarTodos(busca)
                : condominioRepository.buscarAcessiveis(logado.getId(), busca);

        return ResponseEntity.ok(lista.stream().map(CondominioDTO::new).toList());
    }

    @Operation(summary = "Detalha um condomínio",
               description = "Condomínio inexistente e condomínio fora do seu alcance devolvem "
                           + "a mesma resposta 404 — distinguir os dois revelaria quais ids "
                           + "existem, e com isso quantos condomínios o concorrente cadastrou.")
    @GetMapping("/{id}")
    public ResponseEntity<?> detalhar(@PathVariable Long id,
                                      @AuthenticationPrincipal Usuario logado) {
        Optional<Condominio> opt = condominioRepository.buscarPorId(id);
        if (opt.isEmpty() || !acessoIqcService.podeAvaliarCondominio(logado, opt.get())) {
            return naoEncontrado(id);
        }
        return ResponseEntity.ok(new CondominioDTO(opt.get()));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> atualizar(@PathVariable Long id,
                                       @RequestBody @Valid DadosCadastroCondominio dados,
                                       @AuthenticationPrincipal Usuario logado) {
        Optional<Condominio> opt = condominioRepository.buscarPorId(id);
        if (opt.isEmpty() || !acessoIqcService.podeGerenciarCondominio(logado, opt.get())) {
            return naoEncontrado(id);
        }
        Condominio c = opt.get();

        String cnpj = Condominio.normalizarCnpj(dados.cnpj());
        var conflito = cnpjJaCadastrado(cnpj, id);
        if (conflito != null) return conflito;

        aplicarDados(c, dados, cnpj);
        return ResponseEntity.ok(new CondominioDTO(condominioRepository.save(c)));
    }

    /**
     * Desativa em vez de apagar: avaliações IQC já emitidas apontam para o
     * condomínio, e um laudo não pode ficar sem o empreendimento que avaliou.
     */
    @Operation(summary = "Desativa o condomínio (não apaga)",
               description = "A exclusão é lógica: avaliações já emitidas apontam para o "
                           + "condomínio, e um laudo não pode ficar sem o empreendimento que "
                           + "avaliou. Ele some das listagens e das buscas, e os laudos seguem "
                           + "íntegros.")
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> desativar(@PathVariable Long id,
                                       @AuthenticationPrincipal Usuario logado) {
        Optional<Condominio> opt = condominioRepository.buscarPorId(id);
        if (opt.isEmpty() || !acessoIqcService.podeGerenciarCondominio(logado, opt.get())) {
            return naoEncontrado(id);
        }
        Condominio c = opt.get();
        c.setAtivo(false);
        condominioRepository.save(c);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ─────────────────────────────────────────────

    private void aplicarDados(Condominio c, DadosCadastroCondominio d, String cnpjNormalizado) {
        c.setNome(d.nome());
        c.setRazaoSocial(d.razaoSocial());
        c.setCnpj(cnpjNormalizado);
        c.setTipoCondominio(d.tipoCondominio());
        c.setCep(d.cep() != null ? d.cep().replaceAll("\\D", "") : null);
        c.setRua(d.rua());
        c.setNumero(d.numero());
        c.setComplemento(d.complemento());
        c.setBairro(d.bairro());
        c.setCidade(d.cidade());
        c.setUf(d.uf() != null && !d.uf().isBlank() ? d.uf().toUpperCase() : null);
        c.setLatitude(d.latitude());
        c.setLongitude(d.longitude());
        c.setQtdUnidades(d.qtdUnidades());
        c.setQtdTorres(d.qtdTorres());
        c.setAnoEntrega(d.anoEntrega());
        c.setConstrutora(d.construtora());
        c.setAdministradora(d.administradora());
        c.setTelefoneContato(d.telefoneContato());
        c.setEmailContato(d.emailContato());
        c.setObservacoes(d.observacoes());
    }

    /**
     * Devolve a resposta de erro quando o CNPJ já pertence a outro condomínio,
     * ou null quando está livre. {@code idAtual} isenta o próprio registro na
     * edição. Sem isto o choque só apareceria como violação de constraint do
     * banco, que chega ao usuário como erro genérico.
     */
    private ResponseEntity<?> cnpjJaCadastrado(String cnpj, Long idAtual) {
        if (cnpj == null) return null;

        Optional<Condominio> existente = condominioRepository.findByCnpj(cnpj)
                .filter(outro -> !outro.getId().equals(idAtual));
        if (existente.isEmpty()) return null;

        return ResponseEntity.badRequest().body(Map.of(
                "erro", "Este CNPJ já está cadastrado para o condomínio \""
                        + existente.get().getNome() + "\".",
                "condominioId", existente.get().getId()));
    }

    /**
     * Mesma resposta para condomínio inexistente e para condomínio fora do
     * alcance do usuário: distinguir 403 de 404 revelaria quais ids existem, e
     * com isso quantos condomínios o concorrente cadastrou.
     */
    private ResponseEntity<?> naoEncontrado(Long id) {
        return ResponseEntity.status(404).body(Map.of("erro", "Condomínio não encontrado: " + id));
    }

    private ResponseEntity<?> proibido() {
        return ResponseEntity.status(403)
                .body(Map.of("erro", "Acesso restrito: exige ADMIN, CORRETOR com plano PRO, "
                        + "ou acesso de avaliador concedido em algum condomínio."));
    }
}
