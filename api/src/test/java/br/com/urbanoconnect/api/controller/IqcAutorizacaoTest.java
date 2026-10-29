package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.config.security.TokenService;
import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.AcessoCondominioRepository;
import br.com.urbanoconnect.api.domain.repository.CondominioRepository;
import br.com.urbanoconnect.api.domain.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
// Spring Boot 4 moveu esta anotação de boot.test.autoconfigure.web.servlet
// para boot.webmvc.test.autoconfigure, junto com a quebra dos starters por módulo.
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ══════════════════════════════════════════════════════════════
 *  AUTORIZAÇÃO DO IQC — a fronteira de segurança
 * ══════════════════════════════════════════════════════════════
 *
 *  Este teste existe por uma dívida deliberada. A permissão do IQC deixou de
 *  ser expressável no filtro do Spring Security, porque passou a depender do
 *  recurso — de QUAL condomínio — e não do papel. As rotas foram de
 *  {@code hasAnyRole("CORRETOR","ADMIN")} para {@code authenticated()}, e quem
 *  decide virou o AcessoIqcService, chamado no início de cada endpoint.
 *
 *  Isso trocou uma camada de defesa por uma capacidade — convidar engenheiro e
 *  arquiteto de campo, que não são corretores. O preço é que um endpoint novo
 *  nesses controllers nasce aberto a qualquer usuário logado se alguém
 *  esquecer a checagem. Antes o filtro perdoava o esquecimento.
 *
 *  Por isso aqui não se testa o service isolado: sobe o contexto inteiro e
 *  passa pela cadeia de filtros real, com JWT real. É o que um refactor
 *  descuidado tem de fazer falhar.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
@DisplayName("Autorização do IQC, condomínios e vínculos")
class IqcAutorizacaoTest {

    @Autowired private MockMvc mvc;
    @Autowired private TokenService tokenService;
    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private CondominioRepository condominioRepo;
    @Autowired private AcessoCondominioRepository acessoRepo;

    private String tokenAdmin;
    private String tokenDono;        // CORRETOR PRO que cadastrou o condomínio
    private String tokenOutroPro;    // CORRETOR PRO sem relação com o condomínio
    private String tokenSemPlano;    // CORRETOR sem plano PRO
    private String tokenComum;       // USUARIO comum, sem nenhum vínculo
    private String tokenConvidado;   // USUARIO comum COM acesso de AVALIADOR
    private String tokenMorador;     // MORADOR aprovado

    private Long condominioId;
    private Long acessoMoradorId;

    @BeforeEach
    void cenario() {
        Usuario admin     = criarUsuario(TipoUsuario.ADMIN,    "GRATUITO");
        Usuario dono      = criarUsuario(TipoUsuario.CORRETOR, "PRO");
        Usuario outroPro  = criarUsuario(TipoUsuario.CORRETOR, "PRO");
        Usuario semPlano  = criarUsuario(TipoUsuario.CORRETOR, "GRATUITO");
        Usuario comum     = criarUsuario(TipoUsuario.USUARIO,  "GRATUITO");
        Usuario convidado = criarUsuario(TipoUsuario.USUARIO,  "GRATUITO");
        Usuario morador   = criarUsuario(TipoUsuario.USUARIO,  "GRATUITO");

        tokenAdmin     = tokenService.gerarToken(admin);
        tokenDono      = tokenService.gerarToken(dono);
        tokenOutroPro  = tokenService.gerarToken(outroPro);
        tokenSemPlano  = tokenService.gerarToken(semPlano);
        tokenComum     = tokenService.gerarToken(comum);
        tokenConvidado = tokenService.gerarToken(convidado);
        tokenMorador   = tokenService.gerarToken(morador);

        Condominio c = new Condominio();
        c.setNome("Condomínio de Autorização");
        c.setCidade("Cuiabá");
        c.setCriadoPor(dono);
        condominioRepo.save(c);
        condominioId = c.getId();

        acessoRepo.save(acesso(c, convidado, PapelAcessoCondominio.AVALIADOR,
                StatusAcessoCondominio.APROVADO, null));
        // 2 anos: bem dentro da faixa "1 a 3 anos" e acima do mínimo de 6 meses.
        // As bordas exatas das faixas ficam no OpiniaoMoradorServiceTest.
        acessoMoradorId = acessoRepo.save(acesso(c, morador, PapelAcessoCondominio.MORADOR,
                StatusAcessoCondominio.APROVADO, LocalDate.now().minusYears(2))).getId();
    }

    // ── A porta de entrada do IQC ───────────────────────────

    @Test
    @DisplayName("sem token nenhum, o IQC não responde")
    void semTokenNaoEntra() throws Exception {
        mvc.perform(get("/iqc/catalogo")).andExpect(status().isForbidden());
        mvc.perform(get("/condominios")).andExpect(status().isForbidden());
        mvc.perform(get("/moradores/solicitacoes")).andExpect(status().isForbidden());
    }

    /**
     * O caso que a mudança de postura tornou possível. Antes o filtro barrava
     * pelo papel; hoje só o controller barra, e é isto que precisa continuar
     * verdadeiro depois de qualquer refactor.
     */
    @Test
    @DisplayName("usuário comum autenticado, sem concessão, não alcança nada do IQC")
    void usuarioComumNaoAlcancaOIqc() throws Exception {
        mvc.perform(get("/iqc/catalogo").header(HttpHeaders.AUTHORIZATION, bearer(tokenComum)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/iqc").header(HttpHeaders.AUTHORIZATION, bearer(tokenComum)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/condominios").header(HttpHeaders.AUTHORIZATION, bearer(tokenComum)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/condominios/" + condominioId).header(HttpHeaders.AUTHORIZATION, bearer(tokenComum)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("corretor sem plano PRO não entra no IQC")
    void corretorSemPlanoNaoEntra() throws Exception {
        mvc.perform(get("/iqc/catalogo").header(HttpHeaders.AUTHORIZATION, bearer(tokenSemPlano)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/condominios").header(HttpHeaders.AUTHORIZATION, bearer(tokenSemPlano)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("morador aprovado não vira avaliador")
    void moradorNaoAcessaACalculadora() throws Exception {
        mvc.perform(get("/iqc/catalogo").header(HttpHeaders.AUTHORIZATION, bearer(tokenMorador)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/condominios/" + condominioId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenMorador)))
                .andExpect(status().isNotFound());
    }

    // ── Isolamento entre condomínios ────────────────────────

    /**
     * Inexistente e inacessível devolvem o MESMO 404. Se um virasse 403,
     * a diferença entre as respostas revelaria quais ids existem — e com isso
     * quantos condomínios o concorrente cadastrou.
     */
    @Test
    @DisplayName("corretor PRO alheio recebe 404, igual ao de condomínio inexistente")
    void corretorAlheioNaoDistingueInexistenteDeInacessivel() throws Exception {
        mvc.perform(get("/condominios/" + condominioId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenOutroPro)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/condominios/99999999")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenOutroPro)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("corretor PRO alheio não avalia o condomínio dos outros")
    void corretorAlheioNaoAvalia() throws Exception {
        mvc.perform(post("/iqc")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenOutroPro))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"condominioId\":" + condominioId + "}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("dono e ADMIN enxergam o condomínio")
    void donoEAdminEnxergam() throws Exception {
        mvc.perform(get("/condominios/" + condominioId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenDono)))
                .andExpect(status().isOk());
        mvc.perform(get("/condominios/" + condominioId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenAdmin)))
                .andExpect(status().isOk());
    }

    // ── O avaliador convidado ───────────────────────────────

    @Test
    @DisplayName("convidado entra no IQC e enxerga só o condomínio concedido")
    void convidadoEntraEVeApenasOConcedido() throws Exception {
        mvc.perform(get("/iqc/catalogo").header(HttpHeaders.AUTHORIZATION, bearer(tokenConvidado)))
                .andExpect(status().isOk());
        mvc.perform(get("/condominios/" + condominioId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenConvidado)))
                .andExpect(status().isOk());
        mvc.perform(get("/condominios/99999999")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenConvidado)))
                .andExpect(status().isNotFound());
    }

    /**
     * O convidado usa a calculadora, mas não administra: não distribui acesso a
     * terceiros, não abre documento pessoal de morador e não cadastra
     * condomínio. Se estes três deixarem de falhar, um convidado virou dono.
     */
    @Test
    @DisplayName("convidado não escala: nem concede acesso, nem lê comprovante, nem cadastra")
    void convidadoNaoEscala() throws Exception {
        mvc.perform(post("/condominios/" + condominioId + "/acessos/avaliadores")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenConvidado))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"alguem@teste.local\"}"))
                .andExpect(status().isNotFound());

        mvc.perform(get("/condominios/" + condominioId + "/acessos/" + acessoMoradorId + "/comprovante")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenConvidado)))
                .andExpect(status().isNotFound());

        mvc.perform(post("/condominios")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenConvidado))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Tentativa do convidado\"}"))
                .andExpect(status().isForbidden());
    }

    // ── A fila de análise e o documento do morador ──────────

    @Test
    @DisplayName("só quem administra o condomínio lê a fila de vínculos")
    void filaDeAnaliseEhRestritaAQuemAdministra() throws Exception {
        mvc.perform(get("/condominios/" + condominioId + "/acessos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenDono)))
                .andExpect(status().isOk());
        mvc.perform(get("/condominios/" + condominioId + "/acessos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenOutroPro)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/condominios/" + condominioId + "/acessos")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenComum)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("nem o próprio morador baixa o comprovante pela rota de análise")
    void moradorNaoBaixaOProprioComprovantePelaRotaDeAnalise() throws Exception {
        mvc.perform(get("/condominios/" + condominioId + "/acessos/" + acessoMoradorId + "/comprovante")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenMorador)))
                .andExpect(status().isNotFound());
    }

    // ── Opinião do morador ──────────────────────────────────

    @Test
    @DisplayName("sem vínculo de morador aprovado ninguém opina")
    void semVinculoNaoOpina() throws Exception {
        String corpo = "{\"respostas\":{\"garagem\":8}}";

        mvc.perform(put("/moradores/opiniao/" + condominioId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenComum))
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isForbidden());

        // Nem o avaliador convidado: ele avalia tecnicamente, não mora lá.
        mvc.perform(put("/moradores/opiniao/" + condominioId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenConvidado))
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("morador aprovado opina, e o laudo não expõe quem foi")
    void moradorOpinaEOLaudoPreservaOAnonimato() throws Exception {
        mvc.perform(put("/moradores/opiniao/" + condominioId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenMorador))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"respostas\":{\"garagem\":8}}"))
                .andExpect(status().isOk());

        mvc.perform(get("/condominios/" + condominioId + "/opinioes")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenDono)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].autorNome").doesNotExist())
                .andExpect(jsonPath("$[0].identificada").value(false))
                .andExpect(jsonPath("$[0].mesesDeMoradia").doesNotExist())
                .andExpect(jsonPath("$[0].faixaDeMoradia").value("DE_1_A_3_ANOS"));
    }

    @Test
    @DisplayName("morador que assina aparece com nome e tempo exato")
    void moradorQueAssinaApareceIdentificado() throws Exception {
        mvc.perform(put("/moradores/opiniao/" + condominioId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenMorador))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"respostas\":{\"garagem\":8},\"identificarAutor\":true}"))
                .andExpect(status().isOk());

        mvc.perform(get("/condominios/" + condominioId + "/opinioes")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenDono)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].identificada").value(true))
                .andExpect(jsonPath("$[0].autorNome").exists())
                .andExpect(jsonPath("$[0].mesesDeMoradia").exists());
    }

    @Test
    @DisplayName("as opiniões do condomínio não vazam para quem não o alcança")
    void opinioesNaoVazam() throws Exception {
        mvc.perform(get("/condominios/" + condominioId + "/opinioes")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenOutroPro)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/condominios/" + condominioId + "/opinioes")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tokenComum)))
                .andExpect(status().isNotFound());
    }

    // ── Helpers ─────────────────────────────────────────────

    private Usuario criarUsuario(TipoUsuario tipo, String plano) {
        Usuario u = new Usuario();
        u.setNome("Teste " + tipo);
        u.setEmail(tipo.name().toLowerCase() + "-" + UUID.randomUUID() + "@teste.local");
        u.setSenha("irrelevante-para-autorizacao");
        u.setTipo(tipo);
        u.setPlano(plano);
        return usuarioRepo.save(u);
    }

    private AcessoCondominio acesso(Condominio c, Usuario u, PapelAcessoCondominio papel,
                                    StatusAcessoCondominio status, LocalDate moradorDesde) {
        AcessoCondominio a = new AcessoCondominio();
        a.setCondominio(c);
        a.setUsuario(u);
        a.setPapel(papel);
        a.setStatus(status);
        a.setMoradorDesde(moradorDesde);
        return a;
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}
