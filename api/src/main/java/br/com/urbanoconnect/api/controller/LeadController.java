package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.domain.model.Lead;
import br.com.urbanoconnect.api.domain.model.Usuario;
import br.com.urbanoconnect.api.domain.repository.ImovelRepository;
import br.com.urbanoconnect.api.domain.repository.LeadRepository;
import br.com.urbanoconnect.api.dto.lead.DadosCadastroLead;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/leads")
public class LeadController {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private ImovelRepository imovelRepository;

    // ── ROTA PÚBLICA: Cadastrar um novo interesse (Qualquer pessoa acessa) ──
    @PostMapping
    @Transactional
    public ResponseEntity<Lead> cadastrar(@Valid @RequestBody DadosCadastroLead dados) {

        // 1. Busca o imóvel no banco para garantir que ele existe
        var imovel = imovelRepository.findById(dados.imovelId())
                .orElseThrow(() -> new RuntimeException("Imóvel não encontrado com o ID: " + dados.imovelId()));

        // 2. Preenche a entidade Lead com os dados vindos do Front-end
        var lead = new Lead();
        lead.setNome(dados.nome());
        lead.setEmail(dados.email());
        lead.setTelefone(dados.telefone());
        lead.setMensagem(dados.mensagem());

        // 3. Faz o vínculo oficial com o imóvel
        lead.setImovelInteresse(imovel);

        // 4. Salva no banco de dados
        leadRepository.save(lead);

        return ResponseEntity.status(HttpStatus.CREATED).body(lead);
    }

    // ── ROTA PRIVADA: Listar leads (Apenas o corretor dono do imóvel acessa) ──
    @GetMapping
    public ResponseEntity<List<Lead>> listar(@AuthenticationPrincipal Usuario logado) {

        // Retorna apenas os leads dos imóveis que pertencem ao corretor logado
        List<Lead> meusLeads = leadRepository.findByImovelInteresseCorretorId(logado.getId());

        // Se a lista estiver vazia, retorna HTTP 204 (No Content) para o Front-end saber que não há leads
        if (meusLeads.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(meusLeads);
    }

    // ── ROTA PRIVADA: Deletar um lead (apenas o corretor dono do imóvel ou ADMIN) ──
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deletarLead(@PathVariable Long id, @AuthenticationPrincipal Usuario logado) {
        var leadOptional = leadRepository.findById(id);
        if (leadOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var lead = leadOptional.get();
        boolean isAdmin = logado.getTipo() == br.com.urbanoconnect.api.domain.model.TipoUsuario.ADMIN;
        boolean isDono = lead.getImovelInteresse() != null
                && lead.getImovelInteresse().getCorretor() != null
                && lead.getImovelInteresse().getCorretor().getId().equals(logado.getId());

        if (!isAdmin && !isDono) {
            return ResponseEntity.status(403).build();
        }

        leadRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}