package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.AvaliacaoIqcRepository;
import br.com.urbanoconnect.api.domain.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Fecha o happy-path do IQC contra o Postgres real (perfil dev): grava uma
 * avaliação com respostas em jsonb, roda o motor e confere que scores, tier e
 * status persistem e que o jsonb faz round-trip. Roda em transação com rollback,
 * então não deixa dados no banco.
 */
@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class IqcIntegracaoTest {

    @Autowired private IqcService iqcService;
    @Autowired private AvaliacaoIqcRepository avaliacaoRepo;
    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private EntityManager em;

    @Test
    void calcularPersisteScoresTierERoundTripDoJsonb() {
        Usuario avaliador = new Usuario();
        avaliador.setNome("Perito Integração");
        avaliador.setEmail("perito-" + UUID.randomUUID() + "@teste.local");
        avaliador.setSenha("irrelevante");
        avaliador.setTipo(TipoUsuario.ADMIN);
        avaliador.setPlano("PRO");
        usuarioRepo.save(avaliador);

        Map<String, Object> respostas = new HashMap<>();
        respostas.put("piscina", true);
        respostas.put("academia", true);
        respostas.put("distancia_centro", 0);

        AvaliacaoIqc a = new AvaliacaoIqc();
        a.setNomeCondominio("Condomínio Integração");
        a.setAvaliador(avaliador);
        a.setRespostas(respostas);
        avaliacaoRepo.save(a);

        iqcService.calcular(a.getId());

        // força escrita + releitura do banco (round-trip do jsonb)
        em.flush();
        em.clear();

        AvaliacaoIqc recarregada = avaliacaoRepo.findById(a.getId()).orElseThrow();
        assertEquals(StatusAvaliacaoIqc.CONCLUIDA, recarregada.getStatus());
        assertNotNull(recarregada.getScoreFinal());
        assertTrue(recarregada.getScoreFinal() > 0, "score final deveria ser > 0");
        assertNotNull(recarregada.getTier());
        assertNotNull(recarregada.getScoreAmenidades());
        assertEquals(Boolean.TRUE, recarregada.getRespostas().get("piscina"));
    }
}
