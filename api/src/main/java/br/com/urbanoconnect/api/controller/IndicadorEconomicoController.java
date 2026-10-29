package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.model.IndicadorEconomico;
import br.com.urbanoconnect.api.domain.service.IndicadorEconomicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/indicadores")
public class IndicadorEconomicoController {

    @Autowired
    private IndicadorEconomicoService service;

    @GetMapping
    public ResponseEntity<List<IndicadorEconomico>> listar() {
        return ResponseEntity.ok(service.listar());
    }
}
