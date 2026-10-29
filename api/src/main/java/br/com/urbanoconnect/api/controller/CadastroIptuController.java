package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.dto.iptu.AtualizarCadastroIptu;
import br.com.urbanoconnect.api.domain.dto.iptu.ConsultaVenal;
import br.com.urbanoconnect.api.domain.dto.iptu.FichaImovel;
import br.com.urbanoconnect.api.domain.dto.iptu.PerfilBairro;
import br.com.urbanoconnect.api.domain.dto.iptu.RespostaPagina;
import br.com.urbanoconnect.api.domain.dto.iptu.ResultadoImportacao;
import br.com.urbanoconnect.api.domain.model.CadastroIptu;
import br.com.urbanoconnect.api.domain.model.EnderecoConhecido;
import br.com.urbanoconnect.api.domain.repository.CadastroIptuRepository;
import br.com.urbanoconnect.api.domain.service.ConsultaVenalService;
import br.com.urbanoconnect.api.domain.service.EnderecoConhecidoService;
import br.com.urbanoconnect.api.domain.service.ImportadorPlanilhaIptu;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/** Consulta e atualização do cadastro imobiliário (base IPTU). Acesso restrito a ADMIN. */
@RestController
@RequestMapping("/cadastro-iptu")
public class CadastroIptuController {

    private static final String CIDADE_PADRAO = "Tangará da Serra";

    private final CadastroIptuRepository repository;
    private final ImportadorPlanilhaIptu importador;
    private final ConsultaVenalService consultaVenal;
    private final EnderecoConhecidoService enderecoConhecido;

    public CadastroIptuController(CadastroIptuRepository repository, ImportadorPlanilhaIptu importador,
                                  ConsultaVenalService consultaVenal,
                                  EnderecoConhecidoService enderecoConhecido) {
        this.repository = repository;
        this.importador = importador;
        this.consultaVenal = consultaVenal;
        this.enderecoConhecido = enderecoConhecido;
    }

    /**
     * Estimativa de valor venal para o cadastro de imóveis.
     * Sem áreas: valor exato por inscrição ou média do bairro.
     * Com {@code areaTerreno}/{@code areaConstruida}: estimativa por PGV (terreno + construção).
     */
    @GetMapping("/venal")
    public ConsultaVenal consultarVenal(
            @RequestParam(defaultValue = "") String inscricao,
            @RequestParam(defaultValue = "") String bairro,
            @RequestParam(defaultValue = CIDADE_PADRAO) String cidade,
            @RequestParam(required = false) Double areaTerreno,
            @RequestParam(required = false) Double areaConstruida,
            @RequestParam(required = false) Integer padrao) {
        return consultaVenal.consultar(inscricao, bairro, cidade, areaTerreno, areaConstruida, padrao);
    }

    /**
     * Ficha consolidada do imovel (IPTU 2014 + BCI) por inscricao imobiliaria.
     * Usado no cadastro do anuncio para auto-preencher os campos tecnicos.
     */
    @GetMapping("/ficha/{inscricao}")
    public ResponseEntity<FichaImovel> ficha(
            @PathVariable String inscricao,
            @RequestParam(defaultValue = CIDADE_PADRAO) String cidade) {
        return repository.findByCidadeAndInscricao(cidade, inscricao)
                .map(c -> ResponseEntity.ok(FichaImovel.de(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Consulta a base de correspondencias organicas (endereco → inscricao)
     * alimentada por outros corretores. Se algum imovel ja foi cadastrado neste
     * endereco com inscricao, retorna a ficha exata. E o passo 1.5 da cascata:
     * mais preciso que /buscar (que erra por endereco fiscal) e nao exige a
     * inscricao em maos.
     */
    @GetMapping("/por-endereco")
    public ResponseEntity<FichaImovel> porEndereco(
            @RequestParam(defaultValue = CIDADE_PADRAO) String cidade,
            @RequestParam String logradouro,
            @RequestParam String numero) {
        return enderecoConhecido.buscar(cidade, logradouro, numero)
                .flatMap(ec -> repository.findByCidadeAndInscricao(cidade, ec.getInscricao()))
                .map(c -> ResponseEntity.ok(FichaImovel.de(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Match tentativo por bairro + numero — retorna todos os candidatos que casam
     * (0..N). Ambiguidade e esperada: em cidades pequenas o mesmo numero aparece
     * em varias ruas do bairro. O corretor escolhe qual e o certo.
     */
    @GetMapping("/buscar")
    public List<FichaImovel> buscar(
            @RequestParam(defaultValue = CIDADE_PADRAO) String cidade,
            @RequestParam String bairro,
            @RequestParam String numero) {
        return consultaVenal.buscarPorBairroNumero(cidade, bairro, numero);
    }

    /**
     * Perfil agregado do bairro (medias e percentuais de infraestrutura).
     * Devolve 404 quando o bairro nao existe no cadastro.
     */
    @GetMapping("/perfil-bairro")
    public ResponseEntity<PerfilBairro> perfilBairro(
            @RequestParam(defaultValue = CIDADE_PADRAO) String cidade,
            @RequestParam String bairro) {
        PerfilBairro perfil = consultaVenal.perfilBairro(cidade, bairro);
        return perfil == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(perfil);
    }

    @GetMapping
    public RespostaPagina<CadastroIptu> listar(
            @RequestParam(defaultValue = CIDADE_PADRAO) String cidade,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String bairro,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {

        int size = Math.min(Math.max(tamanho, 1), 100);
        Page<CadastroIptu> pg = repository.buscar(
                cidade, q.trim(), bairro.trim(), PageRequest.of(Math.max(pagina, 0), size));

        return new RespostaPagina<>(
                pg.getContent(), pg.getTotalElements(), pg.getNumber(), pg.getSize(), pg.getTotalPages());
    }

    @GetMapping("/bairros")
    public List<String> bairros(@RequestParam(defaultValue = CIDADE_PADRAO) String cidade) {
        return repository.bairros(cidade);
    }

    @PostMapping("/importar")
    public ResponseEntity<ResultadoImportacao> importar(@RequestParam("arquivo") MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ResultadoImportacao(0, 0, 0, 0, "Nenhum arquivo enviado."));
        }
        try {
            return ResponseEntity.ok(importador.importar(arquivo));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ResultadoImportacao(0, 0, 0, 0, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<CadastroIptu> atualizar(
            @PathVariable Long id, @RequestBody AtualizarCadastroIptu dados) {

        return repository.findById(id)
                .map(c -> {
                    boolean alterado = false;
                    if (dados.valorVenal() != null) { c.setValorVenal(dados.valorVenal()); alterado = true; }
                    if (dados.imposto() != null)    { c.setImposto(dados.imposto());       alterado = true; }
                    if (alterado) {
                        c.setFonte("MANUAL");
                        c.setDataAtualizacao(LocalDateTime.now());
                    }
                    return ResponseEntity.ok(repository.save(c));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
