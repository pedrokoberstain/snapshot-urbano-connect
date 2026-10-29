package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Testa a parte pura da colaboração: a divisão das dimensões entre as
 * especialidades, o filtro de escrita e o índice de completude.
 *
 * {@code mesclarRespostas} e {@code completude*} não tocam o repositório,
 * então basta instanciar o service.
 */
@DisplayName("Colaboração no laudo IQC")
class ColaboracaoIqcServiceTest {

    private final ColaboracaoIqcService service = new ColaboracaoIqcService();

    private String chaveDe(DimensaoIqc dimensao) {
        return CatalogoIqc.VARIAVEIS.stream()
                .filter(v -> v.dimensao() == dimensao)
                .map(VariavelIqc::chave)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("sem variável em " + dimensao));
    }

    private AvaliacaoIqc avaliacaoCom(Map<String, Object> respostas) {
        AvaliacaoIqc a = new AvaliacaoIqc();
        a.setRespostas(new HashMap<>(respostas));
        return a;
    }

    // ── Divisão das dimensões ───────────────────────────────

    @Test
    @DisplayName("as 8 dimensões estão divididas entre as 3 especialidades, sem sobra nem repetição")
    void divisaoCobreTodasAsDimensoes() {
        List<DimensaoIqc> cobertas = List.of(EspecialidadeTecnica.values()).stream()
                .flatMap(e -> e.dimensoes().stream())
                .toList();

        assertEquals(DimensaoIqc.values().length, cobertas.size(), "dimensão sem dono ou com dois donos");
        assertEquals(DimensaoIqc.values().length, cobertas.stream().distinct().count());
    }

    /**
     * A soma tem de fechar em 100%. Se não fechar, o laudo estaria sendo
     * calculado sobre um todo que não é o todo.
     */
    @Test
    @DisplayName("os pesos das três especialidades somam 100%")
    void pesosSomamCem() {
        double total = List.of(EspecialidadeTecnica.values()).stream()
                .mapToDouble(EspecialidadeTecnica::pesoTotal)
                .sum();
        assertEquals(1.0, total, 0.0001);
    }

    /**
     * O analista responde por 38% do peso e não trava a conclusão. Isso é
     * decisão de produto, mas precisa estar visível num teste: se um dia
     * alguém achar que o buraco é pequeno, o número aqui desmente.
     */
    @Test
    @DisplayName("analista não trava a conclusão, mas carrega 38% do peso")
    void analistaNaoTravaMasPesaMuito() {
        assertFalse(EspecialidadeTecnica.ANALISTA.isObrigatoriaParaConcluir());
        assertEquals(0.38, EspecialidadeTecnica.ANALISTA.pesoTotal(), 0.0001);

        assertTrue(EspecialidadeTecnica.ENGENHEIRO.isObrigatoriaParaConcluir());
        assertTrue(EspecialidadeTecnica.ARQUITETO.isObrigatoriaParaConcluir());
        assertEquals(2, EspecialidadeTecnica.obrigatorias().size());
    }

    // ── Filtro de escrita ───────────────────────────────────

    @Test
    @DisplayName("cada especialidade só grava as chaves das dimensões dela")
    void escritaForaDaEspecialidadeEhRecusada() {
        String chaveEngenheiro = chaveDe(DimensaoIqc.PRODUTO);      // engenheiro
        String chaveArquiteto  = chaveDe(DimensaoIqc.AMENIDADES);   // arquiteto

        AvaliacaoIqc a = avaliacaoCom(Map.of());
        var r = service.mesclarRespostas(a, EspecialidadeTecnica.ENGENHEIRO,
                Map.of(chaveEngenheiro, true, chaveArquiteto, true));

        assertEquals(1, r.aceitas());
        assertEquals(List.of(chaveArquiteto), r.recusadas());
        assertTrue(a.getRespostas().containsKey(chaveEngenheiro));
        assertFalse(a.getRespostas().containsKey(chaveArquiteto), "gravou fora da especialidade");
    }

    @Test
    @DisplayName("chave inexistente no catálogo é recusada, não gravada")
    void chaveDesconhecidaEhRecusada() {
        AvaliacaoIqc a = avaliacaoCom(Map.of());
        var r = service.mesclarRespostas(a, EspecialidadeTecnica.ENGENHEIRO,
                Map.of("piscina_aquecida_de_ouro", true));

        assertEquals(0, r.aceitas());
        assertEquals(List.of("piscina_aquecida_de_ouro"), r.recusadas());
        assertTrue(a.getRespostas().isEmpty());
    }

    /**
     * O caso que motivou tudo isto. Antes a gravação trocava o mapa inteiro:
     * o último dos três a salvar apagaria o trabalho dos outros dois, sem erro
     * nenhum, e ninguém descobriria até o laudo sair errado.
     */
    @Test
    @DisplayName("gravar uma parte não apaga o trabalho das outras")
    void mesclagemPreservaOTrabalhoAlheio() {
        String doArquiteto = chaveDe(DimensaoIqc.AMENIDADES);
        String doAnalista  = chaveDe(DimensaoIqc.ECONOMICA);
        String doEngenheiro = chaveDe(DimensaoIqc.SEGURANCA);

        AvaliacaoIqc a = avaliacaoCom(Map.of(doArquiteto, true, doAnalista, true));

        service.mesclarRespostas(a, EspecialidadeTecnica.ENGENHEIRO, Map.of(doEngenheiro, true));

        assertEquals(3, a.getRespostas().size());
        assertTrue(a.getRespostas().containsKey(doArquiteto), "apagou a resposta do arquiteto");
        assertTrue(a.getRespostas().containsKey(doAnalista), "apagou a resposta do analista");
        assertTrue(a.getRespostas().containsKey(doEngenheiro));
    }

    @Test
    @DisplayName("valor nulo apaga a própria resposta, e só a própria")
    void valorNuloApagaApenasAPropria() {
        String doEngenheiro = chaveDe(DimensaoIqc.PRODUTO);
        String doArquiteto  = chaveDe(DimensaoIqc.MOBILIDADE);

        AvaliacaoIqc a = avaliacaoCom(Map.of(doEngenheiro, true, doArquiteto, true));

        Map<String, Object> apagar = new HashMap<>();
        apagar.put(doEngenheiro, null);
        apagar.put(doArquiteto, null); // fora da especialidade: deve ser recusado
        service.mesclarRespostas(a, EspecialidadeTecnica.ENGENHEIRO, apagar);

        assertFalse(a.getRespostas().containsKey(doEngenheiro));
        assertTrue(a.getRespostas().containsKey(doArquiteto), "apagou resposta de outra especialidade");
    }

    // ── Completude ──────────────────────────────────────────

    /**
     * Sem completude, uma avaliação com 5 respostas de 154 produz um número que
     * parece tão sólido quanto uma completa.
     */
    @Test
    @DisplayName("completude sai de 0 quando nada foi respondido")
    void completudeComecaEmZero() {
        assertEquals(0, service.completudeGeral(Map.of()));
        assertEquals(0, service.completudeGeral(null));
        service.completudePorDimensao(Map.of()).values().forEach(p -> assertEquals(0, p));
    }

    @Test
    @DisplayName("completude chega a 100 com o catálogo inteiro respondido")
    void completudeChegaACem() {
        Map<String, Object> tudo = new HashMap<>();
        CatalogoIqc.VARIAVEIS.forEach(v -> tudo.put(v.chave(), "1"));

        assertEquals(100, service.completudeGeral(tudo));
        service.completudePorDimensao(tudo).values().forEach(p -> assertEquals(100, p));
    }

    @Test
    @DisplayName("responder só uma dimensão não infla a completude geral")
    void completudeDeUmaDimensaoNaoInflaOGeral() {
        Map<String, Object> so = new HashMap<>();
        CatalogoIqc.VARIAVEIS.stream()
                .filter(v -> v.dimensao() == DimensaoIqc.AMENIDADES)
                .forEach(v -> so.put(v.chave(), "1"));

        var porDim = service.completudePorDimensao(so);
        assertEquals(100, porDim.get(DimensaoIqc.AMENIDADES.name()));
        assertEquals(0, porDim.get(DimensaoIqc.PRODUTO.name()));

        // Amenidades pesa 18%, então o geral tem de ficar perto disso — nunca 100.
        int geral = service.completudeGeral(so);
        assertTrue(geral > 10 && geral < 25, "completude geral fora do esperado: " + geral);
    }
}
