package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.dto.iqc.ComponenteMoradores;
import br.com.urbanoconnect.api.domain.model.DimensaoIqc;
import br.com.urbanoconnect.api.domain.model.FaixaMoradia;
import br.com.urbanoconnect.api.domain.model.PerguntaMorador;
import br.com.urbanoconnect.api.domain.model.TipoPerguntaMorador;
import org.junit.jupiter.api.Test;

import java.util.EnumMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Testa a parte pura do bloco de moradores: normalização das respostas,
 * integridade do questionário e a mistura 90/10. Nada aqui toca o banco.
 */
class OpiniaoMoradorServiceTest {

    private final OpiniaoMoradorService service = new OpiniaoMoradorService();

    // ── Integridade do questionário ─────────────────────────

    @Test
    void questionarioTemAsDezesseisPerguntasComChavesUnicas() {
        assertEquals(16, CatalogoOpiniaoMorador.PERGUNTAS.size());

        Set<String> chaves = new HashSet<>();
        CatalogoOpiniaoMorador.PERGUNTAS.forEach(p ->
                assertTrue(chaves.add(p.chave()), "chave repetida: " + p.chave()));
    }

    /**
     * Se uma dimensão ficasse sem pergunta, ela cairia sempre na regra de
     * herança e o morador nunca teria voz naquele tema — uma falha silenciosa,
     * porque o número final continuaria parecendo completo.
     */
    @Test
    void todasAsOitoDimensoesTemAoMenosUmaPergunta() {
        for (DimensaoIqc d : DimensaoIqc.values()) {
            assertTrue(
                    CatalogoOpiniaoMorador.PERGUNTAS.stream().anyMatch(p -> p.dimensao() == d),
                    "dimensão sem pergunta do morador: " + d);
        }
    }

    @Test
    void todaPerguntaDeFrequenciaTemOpcoesEDeEscalaTemAncoras() {
        for (PerguntaMorador p : CatalogoOpiniaoMorador.PERGUNTAS) {
            if (p.tipo() == TipoPerguntaMorador.FREQUENCIA) {
                assertTrue(p.opcoes().size() >= 2, "frequência sem opções: " + p.chave());
            } else {
                assertNotNull(p.ancoraZero(), "escala sem âncora em 0: " + p.chave());
                assertNotNull(p.ancoraDez(), "escala sem âncora em 10: " + p.chave());
            }
        }
    }

    // ── Normalização ────────────────────────────────────────

    @Test
    void escalaVaiDeZeroACemEIgnoraForaDoIntervalo() {
        PerguntaMorador p = CatalogoOpiniaoMorador.porChave("garagem");

        assertEquals(0.0,   p.normalizar(0),   0.001);
        assertEquals(80.0,  p.normalizar(8),   0.001);
        assertEquals(100.0, p.normalizar(10),  0.001);
        assertEquals(75.0,  p.normalizar("7,5"), 0.001); // vírgula decimal do pt-BR

        assertNull(p.normalizar(15));
        assertNull(p.normalizar(-1));
        assertNull(p.normalizar("oito"));
    }

    @Test
    void frequenciaPontuaDaMelhorParaAPiorOpcao() {
        PerguntaMorador p = CatalogoOpiniaoMorador.porChave("ocorrencias_seguranca");

        assertEquals(100.0, p.normalizar("NUNCA"), 0.001);
        assertEquals(0.0,   p.normalizar("MAIS_DE_TRES"), 0.001);
        assertTrue(p.normalizar("UMA_VEZ") > p.normalizar("DUAS_A_TRES"));
        assertNull(p.normalizar("TALVEZ"));
    }

    /**
     * Ausência nunca vira zero, ao contrário do motor técnico. Lá a falta de
     * uma amenidade é informação ("não tem piscina"); aqui o morador que pulou
     * a pergunta não disse nada sobre o condomínio, e zerar puniria o prédio
     * pelo silêncio de quem mora nele.
     */
    @Test
    void naoSeiENaoSeAplicaNaoPontuam() {
        PerguntaMorador elevador = CatalogoOpiniaoMorador.porChave("elevador");

        assertNull(elevador.normalizar(null));
        assertNull(elevador.normalizar(""));
        assertNull(elevador.normalizar("NAO_SEI"));
        assertNull(elevador.normalizar("NAO_SE_APLICA"));
    }

    // ── Mistura 90/10 ───────────────────────────────────────

    @Test
    void combinarAplicaDezPorCentoAoMorador() {
        ComponenteMoradores m = new ComponenteMoradores(
                Map.of(), 82.7, 3, 4, true, 85.0, 78.0);

        // 0,9 × 60 + 0,1 × 82,7 = 54 + 8,27 = 62,27 → 62,3
        assertEquals(62.3, service.combinar(60.0, m), 0.001);
    }

    /**
     * Sem quórum o técnico passa intacto — e não 90% dele. Descontar os 10%
     * penalizaria justamente o condomínio que ainda não tem morador
     * cadastrado, que é a situação de todo condomínio recém-avaliado.
     */
    @Test
    void semQuorumOTecnicoPassaIntacto() {
        Map<DimensaoIqc, Double> tecnicos = new EnumMap<>(DimensaoIqc.class);
        ComponenteMoradores naoAplicado = ComponenteMoradores.naoAplicado(tecnicos, 2, 2);

        assertFalse(naoAplicado.aplicado());
        assertEquals(72.4, service.combinar(72.4, naoAplicado), 0.001);
        assertEquals(72.4, service.combinar(72.4, null), 0.001);
    }

    @Test
    void oMinimoDeOpinioesEDeTres() {
        assertEquals(3, OpiniaoMoradorService.MINIMO_DE_OPINIOES);
        assertEquals(0.10, OpiniaoMoradorService.PESO_MORADORES, 0.0001);
    }

    // ── Faixa de moradia (anonimato das opiniões não assinadas) ──

    /**
     * As bordas importam: o corte de 6 meses é o mesmo que decide se a opinião
     * pontua, então errar aqui faria o laudo mostrar "menos de 6 meses" para
     * alguém cuja nota está sendo contada.
     */
    @Test
    void faixaDeMoradiaRespeitaAsBordas() {
        assertEquals(FaixaMoradia.MENOS_DE_6_MESES,   FaixaMoradia.de(0L));
        assertEquals(FaixaMoradia.MENOS_DE_6_MESES,   FaixaMoradia.de(5L));
        assertEquals(FaixaMoradia.DE_6_MESES_A_1_ANO, FaixaMoradia.de(6L));
        assertEquals(FaixaMoradia.DE_6_MESES_A_1_ANO, FaixaMoradia.de(11L));
        assertEquals(FaixaMoradia.DE_1_A_3_ANOS,      FaixaMoradia.de(12L));
        assertEquals(FaixaMoradia.DE_1_A_3_ANOS,      FaixaMoradia.de(35L));
        assertEquals(FaixaMoradia.DE_3_A_5_ANOS,      FaixaMoradia.de(36L));
        assertEquals(FaixaMoradia.DE_3_A_5_ANOS,      FaixaMoradia.de(59L));
        assertEquals(FaixaMoradia.MAIS_DE_5_ANOS,     FaixaMoradia.de(60L));
        assertEquals(FaixaMoradia.MAIS_DE_5_ANOS,     FaixaMoradia.de(300L));
        assertNull(FaixaMoradia.de(null));
    }

    // ── Validação das respostas ─────────────────────────────

    @Test
    void validarRecusaChaveDesconhecidaEValorForaDoDominio() {
        Map<String, String> erros = service.validar(Map.of(
                "piscina_bonita", 8,
                "garagem", 15,
                "rateios_extras", "TALVEZ",
                "entorno", "NAO_SE_APLICA"));

        assertEquals(4, erros.size());
        assertTrue(erros.get("piscina_bonita").contains("desconhecida"));
        assertTrue(erros.containsKey("garagem"));
        assertTrue(erros.get("rateios_extras").contains("NENHUM"));
        // "entorno" não é pergunta de item que possa inexistir, então recusa o N/A
        assertTrue(erros.get("entorno").contains("não se aplica"));
    }

    @Test
    void validarAceitaRespostasLegitimas() {
        Map<String, String> erros = service.validar(Map.of(
                "garagem", 8,
                "elevador", "NAO_SE_APLICA",
                "internet_e_sinal", "NAO_SEI",
                "ocorrencias_seguranca", "NUNCA"));

        assertTrue(erros.isEmpty(), () -> "erros inesperados: " + erros);
    }
}
