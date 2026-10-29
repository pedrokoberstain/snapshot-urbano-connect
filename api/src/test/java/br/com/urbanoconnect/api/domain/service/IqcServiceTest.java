package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.dto.iqc.ResultadoCalculoIqc;
import br.com.urbanoconnect.api.domain.model.DimensaoIqc;
import br.com.urbanoconnect.api.domain.model.TierIqc;
import br.com.urbanoconnect.api.domain.model.TipoVariavelIqc;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Testa o motor de cálculo do IQC de forma pura (sem Spring/DB).
 * {@code computar} não usa o repositório, então basta instanciar o service.
 */
class IqcServiceTest {

    private final IqcService service = new IqcService();

    @Test
    void condominioVazioDaScoreZeroETierBasico() {
        ResultadoCalculoIqc r = service.computar(Map.of());

        assertEquals(0.0, r.scoreFinal(), 0.001);
        assertEquals(TierIqc.BASICO, r.tier());
        assertEquals(0.0, r.scoresPorDimensao().get(DimensaoIqc.AMENIDADES), 0.001);
    }

    @Test
    void todasAsBinariasDeUmaDimensaoLigadasDao100() {
        // Amenidades é majoritariamente binária: ligar todas as binárias → 100
        // (contínuas/ordinais não respondidas são ignoradas na agregação).
        Map<String, Object> respostas = new HashMap<>();
        CatalogoIqc.VARIAVEIS.stream()
                .filter(v -> v.dimensao() == DimensaoIqc.AMENIDADES && v.tipo() == TipoVariavelIqc.BINARIA)
                .forEach(v -> respostas.put(v.chave(), true));

        ResultadoCalculoIqc r = service.computar(respostas);

        assertEquals(100.0, r.scoresPorDimensao().get(DimensaoIqc.AMENIDADES), 0.001);
    }

    @Test
    void categoricaPontuaPelaPosicaoNaLista() {
        // piso: [Cerâmica, Porcelanato, Mármore, Marble importado]
        var piso = CatalogoIqc.VARIAVEIS.stream()
                .filter(v -> v.chave().equals("piso")).findFirst().orElseThrow();

        assertEquals(0.0, piso.normalizar("Cerâmica"), 0.001);
        assertEquals(100.0, piso.normalizar("Marble importado"), 0.001);
        assertNull(piso.normalizar("categoria inexistente"));
    }

    @Test
    void continuaInvertidaPontuaMaximoNoMenorValor() {
        // distância 0 km, invertida → 100 na variável; demais contínuas/ordinais ignoradas
        Map<String, Object> respostas = new HashMap<>();
        respostas.put("distancia_centro", 0);

        ResultadoCalculoIqc r = service.computar(respostas);

        assertEquals(100.0, r.scoresPorDimensao().get(DimensaoIqc.LOCALIZACAO), 0.001);
    }

    @Test
    void condominioTopDeLinhaAtingeUltraLuxo() {
        Map<String, Object> r = new HashMap<>();
        for (var v : CatalogoIqc.VARIAVEIS) {
            switch (v.tipo()) {
                case BINARIA -> r.put(v.chave(), true);
                case ORDINAL -> r.put(v.chave(), v.niveis());
                case CONTINUA -> r.put(v.chave(), v.invertida() ? v.min() : v.max());
                case CATEGORICA -> r.put(v.chave(), v.categorias().get(v.categorias().size() - 1));
            }
        }

        ResultadoCalculoIqc res = service.computar(r);

        assertTrue(res.scoreFinal() >= 99.5, "esperado score ~100, veio " + res.scoreFinal());
        assertEquals(TierIqc.ULTRA_LUXO, res.tier());
    }
}
