package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.model.CotacaoAgro;
import br.com.urbanoconnect.api.domain.service.CotacaoAgroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/cotacoes")
public class CotacaoAgroController {

    @Autowired
    private CotacaoAgroService service;

    @GetMapping
    public ResponseEntity<List<CotacaoAgro>> listar() {
        return ResponseEntity.ok(service.listarCotacoes());
    }
}