package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.model.TipoUsuario;
import br.com.urbanoconnect.api.domain.repository.ImovelRepository;
import br.com.urbanoconnect.api.domain.repository.UsuarioRepository;
import br.com.urbanoconnect.api.domain.service.EstatisticaService;
import br.com.urbanoconnect.api.domain.dto.estatistica.DadosEstatisticasMercado;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/estatisticas")
public class EstatisticaController {

    @Autowired
    private EstatisticaService service;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ImovelRepository imovelRepository;

    @GetMapping
    public ResponseEntity<DadosEstatisticasMercado> obterEstatisticas(@RequestParam String cidade) {
        return ResponseEntity.ok(service.obterEstatisticasPorCidade(cidade));
    }

    @GetMapping("/admin")
    public ResponseEntity<Map<String, Long>> obterEstatisticasAdmin() {
        return ResponseEntity.ok(Map.of(
                "totalUsuarios",   usuarioRepository.countByTipo(TipoUsuario.USUARIO),
                "totalCorretores", usuarioRepository.countByTipo(TipoUsuario.CORRETOR),
                "totalCadastros",  usuarioRepository.count(),
                "imoveisAtivos",   imovelRepository.countByAtivoTrue(),
                "imoveisVendidos", imovelRepository.countByVendidoTrue()
        ));
    }
}