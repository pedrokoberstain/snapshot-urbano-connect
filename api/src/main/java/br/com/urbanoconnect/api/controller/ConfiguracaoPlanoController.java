package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.model.ConfiguracaoPlano;
import br.com.urbanoconnect.api.domain.repository.ConfiguracaoPlanoRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
public class ConfiguracaoPlanoController {

    @Autowired
    private ConfiguracaoPlanoRepository repository;

    // Público — usado pela página de planos
    @GetMapping("/precos-planos")
    public List<ConfiguracaoPlano> listarPublico() {
        return repository.findAll();
    }

    // Admin — gerenciamento
    @GetMapping("/admin/planos")
    public List<ConfiguracaoPlano> listar() {
        return repository.findAll();
    }

    @PutMapping("/admin/planos/{tipo}")
    @Transactional
    public ResponseEntity<ConfiguracaoPlano> atualizar(
            @PathVariable String tipo,
            @RequestBody Map<String, Object> body) {

        return repository.findByTipo(tipo.toUpperCase()).map(config -> {
            if (body.containsKey("valor")) {
                config.setValor(new BigDecimal(body.get("valor").toString()));
            }
            if (body.containsKey("descricao")) {
                config.setDescricao(body.get("descricao").toString());
            }
            return ResponseEntity.ok(repository.save(config));
        }).orElse(ResponseEntity.notFound().build());
    }
}
