package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.model.Imovel;
import br.com.urbanoconnect.api.domain.model.ImovelRuralDados;
import br.com.urbanoconnect.api.domain.model.TipoImovel;
import br.com.urbanoconnect.api.domain.model.TipoUsuario;
import br.com.urbanoconnect.api.domain.model.Usuario;
import br.com.urbanoconnect.api.domain.repository.ImovelRepository;
import br.com.urbanoconnect.api.domain.repository.ImovelRuralDadosRepository;
import br.com.urbanoconnect.api.domain.service.EnderecoConhecidoService;
import br.com.urbanoconnect.api.domain.service.PrecificacaoService;
import br.com.urbanoconnect.api.domain.dto.imovel.*;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/imoveis")
public class ImovelController {

    @Autowired
    private ImovelRepository imovelRepository;

    @Autowired
    private ImovelRuralDadosRepository ruralRepository;

    @Autowired
    private PrecificacaoService precificacaoService;

    @Autowired
    private EnderecoConhecidoService enderecoConhecidoService;

    // ── SEGURANÇA: garante que apenas o corretor dono do imóvel (ou um ADMIN) pode modificá-lo ──
    private boolean podeModificar(Imovel imovel, Usuario usuario) {
        if (usuario == null) return false;
        if (usuario.getTipo() == TipoUsuario.ADMIN) return true;
        return imovel.getCorretor() != null && imovel.getCorretor().getId().equals(usuario.getId());
    }

    // LISTAR todos os imóveis
    @GetMapping
    public List<Imovel> listar(
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) TipoImovel tipo) {

        if (cidade != null) {
            return imovelRepository.findByCidadeContainingIgnoreCase(cidade);
        }
        if (tipo != null) {
            return imovelRepository.findByTipo(tipo);
        }

        return imovelRepository.findAll();
    }

    // Rota para BUSCAR apenas UM imóvel pelo ID (GET)
    @GetMapping("/{id}")
    public Imovel buscarPorId(@PathVariable Long id) {
        return imovelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Imóvel não encontrado com o ID: " + id));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> cadastrar(
            @RequestBody @Valid DadosCadastroImovel dados,
            @AuthenticationPrincipal Usuario corretorLogado) {

        Imovel imovel = new Imovel();

        imovel.setTitulo(dados.titulo());
        imovel.setCidade(dados.cidade());
        imovel.setBairro(dados.bairro());
        imovel.setCep(dados.cep());
        imovel.setLogradouro(dados.logradouro());
        imovel.setNumero(dados.numero());
        imovel.setComplemento(dados.complemento());
        imovel.setTipo(dados.tipo());
        imovel.setPreco(dados.preco());
        imovel.setAreaTotal(dados.areaTotal());
        imovel.setAreaConstruida(dados.areaConstruida());
        imovel.setDetalhes(dados.detalhes());

        // ── Fotos: galeria + capa ──────────────────────────────
        List<String> galeria = dados.galeria() != null ? dados.galeria() : new java.util.ArrayList<>();
        imovel.setGaleria(galeria);
        // Se o corretor não escolheu uma capa, assume a 1ª foto da galeria.
        String capa = dados.imagemPrincipal();
        if ((capa == null || capa.isBlank()) && !galeria.isEmpty()) {
            capa = galeria.get(0);
        }
        imovel.setImagemPrincipal(capa);

        imovel.setDescricao(dados.descricao());

        // ── Novos campos do Motor Hedônico e Estruturais ──
        imovel.setQuartos(dados.quartos());
        imovel.setBanheiros(dados.banheiros());
        imovel.setVagasGaragem(dados.vagasGaragem());
        imovel.setInscricao(dados.inscricao());
        imovel.setValorVenal(dados.valorVenal());
        imovel.setDistanciaCentro(dados.distanciaCentro());
        imovel.setPrecoM2Bairro(dados.precoM2Bairro());

        imovel.setCorretor(corretorLogado);

        imovelRepository.save(imovel);
        enderecoConhecidoService.registrar(imovel);

        return ResponseEntity.ok(Map.of("id", imovel.getId()));
    }

    // ATUALIZAR IMÓVEL
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Imovel> atualizar(
            @PathVariable Long id,
            @RequestBody Imovel imovelAtualizado,
            @AuthenticationPrincipal Usuario logado) {
        return imovelRepository.findById(id)
                .map(imovel -> {
                    if (!podeModificar(imovel, logado)) {
                        return ResponseEntity.status(403).<Imovel>build();
                    }
                    imovel.setTitulo(imovelAtualizado.getTitulo());
                    imovel.setCidade(imovelAtualizado.getCidade());
                    imovel.setBairro(imovelAtualizado.getBairro());
                    imovel.setCep(imovelAtualizado.getCep());
                    imovel.setLogradouro(imovelAtualizado.getLogradouro());
                    imovel.setNumero(imovelAtualizado.getNumero());
                    imovel.setComplemento(imovelAtualizado.getComplemento());
                    imovel.setPreco(imovelAtualizado.getPreco());
                    imovel.setAreaTotal(imovelAtualizado.getAreaTotal());
                    imovel.setAreaConstruida(imovelAtualizado.getAreaConstruida());
                    imovel.setTipo(imovelAtualizado.getTipo());
                    imovel.setDetalhes(imovelAtualizado.getDetalhes());
                    imovel.setDescricao(imovelAtualizado.getDescricao());

                    // ── Fotos: galeria + capa ──────────────────
                    List<String> galeria = imovelAtualizado.getGaleria() != null
                            ? imovelAtualizado.getGaleria() : new java.util.ArrayList<>();
                    imovel.setGaleria(galeria);
                    String capa = imovelAtualizado.getImagemPrincipal();
                    if ((capa == null || capa.isBlank()) && !galeria.isEmpty()) {
                        capa = galeria.get(0);
                    }
                    imovel.setImagemPrincipal(capa);

                    imovel.setAtivo(imovelAtualizado.isAtivo());

                    // ── Novos campos do Motor Hedônico e Estruturais ──
                    imovel.setQuartos(imovelAtualizado.getQuartos());
                    imovel.setBanheiros(imovelAtualizado.getBanheiros());
                    imovel.setVagasGaragem(imovelAtualizado.getVagasGaragem());
                    imovel.setInscricao(imovelAtualizado.getInscricao());
                    imovel.setValorVenal(imovelAtualizado.getValorVenal());
                    imovel.setDistanciaCentro(imovelAtualizado.getDistanciaCentro());
                    imovel.setPrecoM2Bairro(imovelAtualizado.getPrecoM2Bairro());

                    Imovel salvo = imovelRepository.save(imovel);
                    enderecoConhecidoService.registrar(salvo);
                    return ResponseEntity.ok(salvo);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── DEFINIR FOTO PRINCIPAL (CAPA) DO ANÚNCIO ─────────────
    @PatchMapping("/{id}/imagem-principal")
    @Transactional
    public ResponseEntity<Imovel> definirImagemPrincipal(
            @PathVariable Long id,
            @RequestBody @Valid DadosImagemPrincipal dados,
            @AuthenticationPrincipal Usuario logado) {
        return imovelRepository.findById(id)
                .map(imovel -> {
                    if (!podeModificar(imovel, logado)) {
                        return ResponseEntity.status(403).<Imovel>build();
                    }
                    // A capa precisa ser uma das fotos já presentes na galeria.
                    List<String> galeria = imovel.getGaleria() != null ? imovel.getGaleria() : List.of();
                    if (!galeria.contains(dados.imagemPrincipal())) {
                        return ResponseEntity.badRequest().<Imovel>build();
                    }
                    imovel.setImagemPrincipal(dados.imagemPrincipal());
                    imovelRepository.save(imovel);
                    return ResponseEntity.ok(imovel);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── ROTA NOVA: MARCAR IMÓVEL COMO VENDIDO ───────────────
    @PatchMapping("/{id}/vender")
    @Transactional
    public ResponseEntity<Imovel> marcarComoVendido(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal Usuario logado) {
        return imovelRepository.findById(id)
                .map(imovel -> {
                    if (!podeModificar(imovel, logado)) {
                        return ResponseEntity.status(403).<Imovel>build();
                    }
                    imovel.setVendido(true);
                    imovel.setAtivo(false);
                    imovel.setDataVenda(java.time.LocalDateTime.now());
                    if (body != null && body.get("valorFechamento") != null) {
                        java.math.BigDecimal fechamento = new java.math.BigDecimal(body.get("valorFechamento").toString());
                        imovel.setValorFechamento(fechamento);
                        if (imovel.getPreco() != null && imovel.getPreco().compareTo(java.math.BigDecimal.ZERO) > 0) {
                            double desconto = imovel.getPreco().subtract(fechamento)
                                    .divide(imovel.getPreco(), 4, java.math.RoundingMode.HALF_UP)
                                    .multiply(java.math.BigDecimal.valueOf(100))
                                    .doubleValue();
                            imovel.setDescontoPercentual(Math.round(desconto * 100.0) / 100.0);
                        }
                    }
                    imovelRepository.save(imovel);
                    return ResponseEntity.ok(imovel);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── ADMIN: LISTAR IMÓVEIS VENDIDOS ───────────────────────
    @GetMapping("/admin/vendidos")
    public List<Imovel> listarVendidos() {
        return imovelRepository.findByVendidoTrueOrderByDataVendaDesc();
    }

    // ── ROTA NOVA: REATIVAR IMÓVEL VENDIDO ───────────────
    @PatchMapping("/{id}/reativar")
    @Transactional
    public ResponseEntity<Imovel> reativarImovel(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario logado) {
        return imovelRepository.findById(id)
                .map(imovel -> {
                    if (!podeModificar(imovel, logado)) {
                        return ResponseEntity.status(403).<Imovel>build();
                    }
                    imovel.setVendido(false);
                    imovel.setAtivo(true);
                    imovel.setDataVenda(null);

                    imovelRepository.save(imovel);
                    return ResponseEntity.ok(imovel);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETAR IMÓVEL
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> excluir(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario logado) {
        var imovelOptional = imovelRepository.findById(id);
        if (imovelOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!podeModificar(imovelOptional.get(), logado)) {
            return ResponseEntity.status(403).build();
        }
        imovelRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── ROTA DO MOTOR DE PRECIFICAÇÃO HEDÔNICA ───────────────
    @PostMapping("/{id}/precificar")
    public ResponseEntity<ResultadoPrecificacao> precificar(
            @PathVariable Long id,
            @RequestBody DadosPrecificacao dados,
            @AuthenticationPrincipal Usuario logado) {

        Imovel imovel = imovelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Imóvel não encontrado com o ID: " + id));
        if (!podeModificar(imovel, logado)) {
            return ResponseEntity.status(403).build();
        }

        ResultadoPrecificacao resultado = precificacaoService.calcular(id, dados);
        return ResponseEntity.ok(resultado);
    }

    // ========================================================================
    // ── ROTAS RURAIS ────────────────────────────────────────────────────────
    // ========================================================================

    @GetMapping("/{id}/rural")
    public ResponseEntity<DadosRuralDetalhe> buscarDadosRurais(@PathVariable Long id) {
        return ruralRepository.findByImovelId(id)
                .map(rural -> ResponseEntity.ok(DadosRuralDetalhe.from(rural)))
                .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping("/{id}/rural")
    @Transactional
    public ResponseEntity<DadosRuralDetalhe> salvarDadosRurais(
            @PathVariable Long id,
            @RequestBody DadosRuralCadastro dados,
            @AuthenticationPrincipal Usuario corretorLogado) {

        Imovel imovel = imovelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Imóvel não encontrado"));

        if (!podeModificar(imovel, corretorLogado)) {
            return ResponseEntity.status(403).build();
        }

        ImovelRuralDados rural = ruralRepository.findByImovelId(id)
                .orElse(new ImovelRuralDados());

        rural.setImovel(imovel);

        // Solo
        rural.setTipoSolo(dados.tipoSolo());
        rural.setPercentualArgila(dados.percentualArgila());
        rural.setFertilidadeSolo(dados.fertilidadeSolo());
        rural.setNivelNutrientes(dados.nivelNutrientes());
        rural.setNecessidadeCorrecaoSolo(dados.necessidadeCorrecaoSolo());

        // Uso da terra
        rural.setAreaUtil(dados.areaUtil());
        rural.setAreaReservaLegal(dados.areaReservaLegal());
        rural.setAreaApp(dados.areaApp());
        rural.setAreaDegradada(dados.areaDegradada());
        rural.setUsoAtual(dados.usoAtual());
        rural.setUsoPotencial(dados.usoPotencial());
        rural.setCoberturaVegetal(dados.coberturaVegetal());
        rural.setEstadoConservacao(dados.estadoConservacao());

        // Produtividade
        rural.setProdutividadeSoja(dados.produtividadeSoja());
        rural.setProdutividadeMilho(dados.produtividadeMilho());
        rural.setProdutividadePastagem(dados.produtividadePastagem());
        rural.setAptidaoAgricola(dados.aptidaoAgricola());
        rural.setAptidaoPecuaria(dados.aptidaoPecuaria());

        // Água
        rural.setDisponibilidadeAgua(dados.disponibilidadeAgua());
        rural.setTipoffonteAgua(dados.tipoFonteAgua());
        rural.setVolumeAgua(dados.volumeAgua());
        rural.setPerenidadeAgua(dados.perenidadeAgua());
        rural.setIrrigacao(dados.irrigacao());

        // Logística
        rural.setDistanciaRodovia(dados.distanciaRodovia());
        rural.setDistanciaPorto(dados.distanciaPorto());
        rural.setDistanciaCentroConsumidor(dados.distanciaCentroConsumidor());
        rural.setQualidadeAcesso(dados.qualidadeAcesso());

        // Infraestrutura
        rural.setSede(dados.sede());
        rural.setEnergiaEletrica(dados.energiaEletrica());
        rural.setMecanizacaoViavel(dados.mecanizacaoViavel());
        rural.setCasaFuncionarios(dados.casaFuncionarios());
        rural.setCurral(dados.curral());
        rural.setGalpao(dados.galpao());

        // Documentação
        rural.setMatriculaRegular(dados.matriculaRegular());
        rural.setGeorreferenciamento(dados.georreferenciamento());
        rural.setCar(dados.car());
        rural.setCcir(dados.ccir());
        rural.setItrRegular(dados.itrRegular());
        rural.setExistenciaOnus(dados.existenciaOnus());

        ruralRepository.save(rural);

        return ResponseEntity.ok(DadosRuralDetalhe.from(rural));
    }
}