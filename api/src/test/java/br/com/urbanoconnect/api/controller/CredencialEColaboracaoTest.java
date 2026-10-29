package br.com.urbanoconnect.api.controller;

import br.com.urbanoconnect.api.config.security.TokenService;
import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * ══════════════════════════════════════════════════════════════
 *  CREDENCIAL E LAUDO COLABORATIVO — ponta a ponta
 * ══════════════════════════════════════════════════════════════
 *
 *  Sobe o contexto inteiro e passa pela cadeia de filtros real, com JWT real.
 *  Cobre as duas amarrações que sustentam o desenho:
 *
 *  1. Só assume parte do laudo quem tem credencial vigente daquela profissão.
 *     Sem isso, "engenheiro" seria um rótulo escolhido por quem distribui.
 *  2. O laudo só conclui com engenheiro e arquiteto assinados, e a escrita de
 *     cada um fica confinada às dimensões dele — no servidor, não na tela.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Transactional
@DisplayName("Credencial profissional e laudo colaborativo")
class CredencialEColaboracaoTest {

    @Autowired private MockMvc mvc;
    @Autowired private TokenService tokenService;
    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private CondominioRepository condominioRepo;
    @Autowired private CredencialProfissionalRepository credencialRepo;
    @Autowired private ParteAvaliacaoIqcRepository parteRepo;
    @Autowired private AvaliacaoIqcRepository avaliacaoRepo;
    /** Instanciado direto: so serve para montar e ler JSON, nao precisa do contexto. */
    private final ObjectMapper json = new ObjectMapper();

    private Usuario admin, engenheiro, arquiteto, semCredencial;
    private String tAdmin, tEngenheiro, tArquiteto, tSemCredencial;
    private Long condominioId;

    /** JPEG mínimo válido: o serviço decide o tipo pelos bytes, não pela extensão. */
    private MockMultipartFile carteira() {
        byte[] jpeg = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
                0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, 0x01};
        return new MockMultipartFile("documento", "carteira.jpg", "image/jpeg", jpeg);
    }

    private Usuario criar(TipoUsuario tipo) {
        Usuario u = new Usuario();
        u.setNome("Teste " + tipo + " " + UUID.randomUUID().toString().substring(0, 6));
        u.setEmail(tipo.name().toLowerCase() + "-" + UUID.randomUUID() + "@teste.local");
        u.setSenha("irrelevante");
        u.setTipo(tipo);
        u.setPlano(tipo == TipoUsuario.ADMIN ? "GRATUITO" : "PRO");
        return usuarioRepo.save(u);
    }

    private void credencialAprovada(Usuario u, EspecialidadeTecnica prof, String numero) {
        CredencialProfissional c = new CredencialProfissional();
        c.setUsuario(u);
        c.setProfissao(prof);
        c.setStatus(StatusCredencial.APROVADA);
        c.setNumeroRegistro(numero);
        c.setUfRegistro("MT");
        credencialRepo.save(c);
    }

    @BeforeEach
    void cenario() {
        admin         = criar(TipoUsuario.ADMIN);
        engenheiro    = criar(TipoUsuario.USUARIO);
        arquiteto     = criar(TipoUsuario.USUARIO);
        semCredencial = criar(TipoUsuario.USUARIO);

        tAdmin         = tokenService.gerarToken(admin);
        tEngenheiro    = tokenService.gerarToken(engenheiro);
        tArquiteto     = tokenService.gerarToken(arquiteto);
        tSemCredencial = tokenService.gerarToken(semCredencial);

        credencialAprovada(engenheiro, EspecialidadeTecnica.ENGENHEIRO, "12345");
        credencialAprovada(arquiteto, EspecialidadeTecnica.ARQUITETO, "67890");

        Condominio c = new Condominio();
        c.setNome("Condomínio Colaborativo");
        c.setCriadoPor(admin);
        condominioRepo.save(c);
        condominioId = c.getId();
    }

    private String bearer(String t) { return "Bearer " + t; }

    private Long criarAvaliacao() throws Exception {
        String corpo = mvc.perform(post("/iqc")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"condominioId\":" + condominioId + "}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(corpo).get("id").asLong();
    }

    private String chaveDe(DimensaoIqc d) {
        return br.com.urbanoconnect.api.domain.service.CatalogoIqc.VARIAVEIS.stream()
                .filter(v -> v.dimensao() == d).map(VariavelIqc::chave).findFirst().orElseThrow();
    }

    // ── Credencial ──────────────────────────────────────────

    @Test
    @DisplayName("profissional envia a carteira e a credencial nasce PENDENTE")
    void solicitarCredencialCriaPendente() throws Exception {
        mvc.perform(multipart("/credenciais").file(carteira())
                        .param("profissao", "ENGENHEIRO")
                        .param("numeroRegistro", "99999")
                        .param("ufRegistro", "MT")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tSemCredencial)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.vigente").value(false))
                .andExpect(jsonPath("$.conselho").value("CREA"));
    }

    /** Analista não tem conselho: não há registro a conferir, então não se autocadastra. */
    @Test
    @DisplayName("analista não se autocadastra — é designação interna")
    void analistaNaoSeAutocadastra() throws Exception {
        mvc.perform(multipart("/credenciais").file(carteira())
                        .param("profissao", "ANALISTA")
                        .param("numeroRegistro", "123")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tSemCredencial)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(org.hamcrest.Matchers.containsString("conselho")));
    }

    @Test
    @DisplayName("a fila de credenciais é só do ADMIN")
    void filaDeCredenciaisEhSoDoAdmin() throws Exception {
        mvc.perform(get("/admin/credenciais").header(HttpHeaders.AUTHORIZATION, bearer(tEngenheiro)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/admin/credenciais").header(HttpHeaders.AUTHORIZATION, bearer(tAdmin)))
                .andExpect(status().isOk());
    }

    /**
     * O documento existe para sustentar a decisão. Tomada a decisão, ele some —
     * e o download seguinte devolve 410, não o arquivo.
     */
    @Test
    @DisplayName("aprovar a credencial destrói o documento enviado")
    void aprovarDestroiODocumento() throws Exception {
        String corpo = mvc.perform(multipart("/credenciais").file(carteira())
                        .param("profissao", "ARQUITETO")
                        .param("numeroRegistro", "55555")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tSemCredencial)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(corpo).get("id").asLong();

        mvc.perform(get("/admin/credenciais/" + id + "/documento")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tAdmin)))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));

        mvc.perform(patch("/admin/credenciais/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"APROVADA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APROVADA"))
                .andExpect(jsonPath("$.vigente").value(true))
                .andExpect(jsonPath("$.documentoDisponivel").value(false))
                .andExpect(jsonPath("$.documentoRemovidoEm").exists());

        mvc.perform(get("/admin/credenciais/" + id + "/documento")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tAdmin)))
                .andExpect(status().isGone());
    }

    @Test
    @DisplayName("recusa sem motivo é rejeitada")
    void recusaExigeMotivo() throws Exception {
        String corpo = mvc.perform(multipart("/credenciais").file(carteira())
                        .param("profissao", "ENGENHEIRO").param("numeroRegistro", "111")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tSemCredencial)))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(corpo).get("id").asLong();

        mvc.perform(patch("/admin/credenciais/" + id)
                        .header(HttpHeaders.AUTHORIZATION, bearer(tAdmin))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"RECUSADA\"}"))
                .andExpect(status().isBadRequest());
    }

    /**
     * Credencial vencida continua APROVADA no histórico — o laudo antigo segue
     * coerente — mas deixa de habilitar.
     */
    @Test
    @DisplayName("credencial vencida não habilita, mas não vira recusada")
    void credencialVencidaNaoHabilita() throws Exception {
        CredencialProfissional c = credencialRepo
                .findByUsuarioIdAndProfissao(engenheiro.getId(), EspecialidadeTecnica.ENGENHEIRO)
                .orElseThrow();
        c.setValidoAte(LocalDate.now().minusDays(1));
        credencialRepo.save(c);

        assertFalse(c.isVigente());
        assertTrue(c.isVencida());
        assertEquals(StatusCredencial.APROVADA, c.getStatus());

        Long avaliacaoId = criarAvaliacao();
        mvc.perform(put("/iqc/" + avaliacaoId + "/partes/ENGENHEIRO/responsavel")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", engenheiro.getEmail()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(org.hamcrest.Matchers.containsString("vencida")));
    }

    // ── Colaboração ─────────────────────────────────────────

    @Test
    @DisplayName("a avaliação nasce com as três partes, sem responsável")
    void avaliacaoNasceComAsTresPartes() throws Exception {
        Long id = criarAvaliacao();

        mvc.perform(get("/iqc/" + id + "/partes").header(HttpHeaders.AUTHORIZATION, bearer(tAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.partes.length()").value(3))
                .andExpect(jsonPath("$.completudeGeral").value(0))
                .andExpect(jsonPath("$.pendentesParaConcluir.length()").value(2));

        assertEquals(3, parteRepo.listarDaAvaliacao(id).size());
    }

    @Test
    @DisplayName("sem credencial ninguém assume parte, e a recusa diz o porquê")
    void designarSemCredencialEhRecusado() throws Exception {
        Long id = criarAvaliacao();

        mvc.perform(put("/iqc/" + id + "/partes/ENGENHEIRO/responsavel")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", semCredencial.getEmail()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(
                        org.hamcrest.Matchers.containsString("não possui credencial")));
    }

    @Test
    @DisplayName("credencial de arquiteto não serve para a parte do engenheiro")
    void credencialDeOutraProfissaoNaoServe() throws Exception {
        Long id = criarAvaliacao();

        mvc.perform(put("/iqc/" + id + "/partes/ENGENHEIRO/responsavel")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", arquiteto.getEmail()))))
                .andExpect(status().isBadRequest());
    }

    /**
     * O caso que motivou toda a etapa: antes só o criador editava, e os outros
     * dois profissionais ficavam de fora do próprio laudo.
     */
    @Test
    @DisplayName("cada profissional grava só as dimensões dele, e um não apaga o outro")
    void escritaEhFiltradaEMesclada() throws Exception {
        Long id = criarAvaliacao();
        designar(id, "ENGENHEIRO", engenheiro);
        designar(id, "ARQUITETO", arquiteto);

        String doEngenheiro = chaveDe(DimensaoIqc.PRODUTO);
        String doArquiteto  = chaveDe(DimensaoIqc.AMENIDADES);

        // O engenheiro tenta gravar uma chave do arquiteto junto: deve ser recusada.
        mvc.perform(put("/iqc/" + id + "/respostas")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tEngenheiro))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("respostas",
                                Map.of(doEngenheiro, true, doArquiteto, true)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aceitas").value(1))
                .andExpect(jsonPath("$.recusadas[0]").value(doArquiteto));

        // O arquiteto grava a dele; a do engenheiro tem de sobreviver.
        mvc.perform(put("/iqc/" + id + "/respostas")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tArquiteto))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("respostas", Map.of(doArquiteto, true)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aceitas").value(1));

        AvaliacaoIqc recarregada = avaliacaoRepo.findById(id).orElseThrow();
        assertTrue(recarregada.getRespostas().containsKey(doEngenheiro), "o arquiteto apagou o engenheiro");
        assertTrue(recarregada.getRespostas().containsKey(doArquiteto));
    }

    @Test
    @DisplayName("quem não tem parte na avaliação não grava nada nela")
    void semParteNaoGrava() throws Exception {
        Long id = criarAvaliacao();
        designar(id, "ENGENHEIRO", engenheiro);

        mvc.perform(put("/iqc/" + id + "/respostas")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tArquiteto))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("respostas",
                                Map.of(chaveDe(DimensaoIqc.AMENIDADES), true)))))
                .andExpect(status().isForbidden());
    }

    // ── Conclusão do laudo ──────────────────────────────────

    @Test
    @DisplayName("o laudo não conclui sem a assinatura de engenheiro e arquiteto")
    void calcularExigeAsDuasAssinaturas() throws Exception {
        Long id = criarAvaliacao();
        designar(id, "ENGENHEIRO", engenheiro);
        designar(id, "ARQUITETO", arquiteto);

        mvc.perform(post("/iqc/" + id + "/calcular").header(HttpHeaders.AUTHORIZATION, bearer(tAdmin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.pendentes.length()").value(2));

        assinar(id, "ENGENHEIRO", tEngenheiro);

        mvc.perform(post("/iqc/" + id + "/calcular").header(HttpHeaders.AUTHORIZATION, bearer(tAdmin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.pendentes.length()").value(1));

        assinar(id, "ARQUITETO", tArquiteto);

        // Analista não assinou e mesmo assim conclui — é a regra combinada.
        mvc.perform(post("/iqc/" + id + "/calcular").header(HttpHeaders.AUTHORIZATION, bearer(tAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONCLUIDA"));
    }

    /**
     * O laudo precisa dizer de onde o número veio, não só qual é.
     *
     * Se algum destes campos sumir da resposta, a tela de resultado passa a
     * exibir um score sem composição, sem completude e sem responsável técnico
     * — e ninguém percebe, porque a página continua carregando.
     */
    @Test
    @DisplayName("a avaliação concluída expõe tudo que o laudo precisa mostrar")
    void laudoExpoeComposicaoCompletudeEAssinaturas() throws Exception {
        Long id = criarAvaliacao();
        designar(id, "ENGENHEIRO", engenheiro);
        designar(id, "ARQUITETO", arquiteto);

        mvc.perform(put("/iqc/" + id + "/respostas")
                .header(HttpHeaders.AUTHORIZATION, bearer(tEngenheiro))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("respostas",
                        Map.of(chaveDe(DimensaoIqc.PRODUTO), true)))));

        assinar(id, "ENGENHEIRO", tEngenheiro);
        assinar(id, "ARQUITETO", tArquiteto);

        mvc.perform(post("/iqc/" + id + "/calcular").header(HttpHeaders.AUTHORIZATION, bearer(tAdmin)))
                .andExpect(status().isOk())
                // De onde veio o número: técnico separado do final, para auditar depois.
                .andExpect(jsonPath("$.scoreTecnico").exists())
                .andExpect(jsonPath("$.scoreFinal").exists())
                // Sem moradores suficientes o bloco não entra, e o laudo diz isso.
                .andExpect(jsonPath("$.moradoresAplicado").value(false))
                .andExpect(jsonPath("$.opinioesConsideradas").exists());

        // Completude e assinaturas vêm do painel de partes, que a tela carrega junto.
        mvc.perform(get("/iqc/" + id + "/partes").header(HttpHeaders.AUTHORIZATION, bearer(tAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completudeGeral").exists())
                .andExpect(jsonPath("$.completudePorDimensao.PRODUTO").exists())
                .andExpect(jsonPath("$.partes[?(@.especialidade=='ENGENHEIRO')].registroProfissional")
                        .value(org.hamcrest.Matchers.hasItem("CREA-MT 12345")))
                .andExpect(jsonPath("$.partes[?(@.especialidade=='ARQUITETO')].registroProfissional")
                        .value(org.hamcrest.Matchers.hasItem("CAU-MT 67890")));
    }

    /**
     * O registro sai da credencial de quem assina, nunca do corpo. Aceitar o
     * número pelo cliente deixaria qualquer um estampar um CREA inventado.
     */
    @Test
    @DisplayName("a assinatura carrega o registro da credencial, e o corpo não o falsifica")
    void assinaturaUsaORegistroDaCredencial() throws Exception {
        Long id = criarAvaliacao();
        designar(id, "ENGENHEIRO", engenheiro);

        mvc.perform(post("/iqc/" + id + "/partes/ENGENHEIRO/finalizar")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tEngenheiro))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"registroProfissional\":\"CREA-XX 000000\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.parte.registroProfissional").value("CREA-MT 12345"));
    }

    @Test
    @DisplayName("parte assinada trava a edição até ser reaberta")
    void parteAssinadaTravaAEdicao() throws Exception {
        Long id = criarAvaliacao();
        designar(id, "ENGENHEIRO", engenheiro);
        assinar(id, "ENGENHEIRO", tEngenheiro);

        mvc.perform(put("/iqc/" + id + "/respostas")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tEngenheiro))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("respostas",
                                Map.of(chaveDe(DimensaoIqc.PRODUTO), true)))))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/iqc/" + id + "/partes/ENGENHEIRO/reabrir")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EM_ANDAMENTO"))
                .andExpect(jsonPath("$.registroProfissional").doesNotExist());

        mvc.perform(put("/iqc/" + id + "/respostas")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tEngenheiro))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("respostas",
                                Map.of(chaveDe(DimensaoIqc.PRODUTO), true)))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("o profissional designado enxerga a avaliação, que antes era só do criador")
    void designadoEnxergaAAvaliacao() throws Exception {
        Long id = criarAvaliacao();

        mvc.perform(get("/iqc/" + id).header(HttpHeaders.AUTHORIZATION, bearer(tEngenheiro)))
                .andExpect(status().isForbidden());

        designar(id, "ENGENHEIRO", engenheiro);

        mvc.perform(get("/iqc/" + id).header(HttpHeaders.AUTHORIZATION, bearer(tEngenheiro)))
                .andExpect(status().isOk());
        mvc.perform(get("/iqc/minhas-partes").header(HttpHeaders.AUTHORIZATION, bearer(tEngenheiro)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    // ── Helpers ─────────────────────────────────────────────

    private void designar(Long avaliacaoId, String especialidade, Usuario alvo) throws Exception {
        mvc.perform(put("/iqc/" + avaliacaoId + "/partes/" + especialidade + "/responsavel")
                        .header(HttpHeaders.AUTHORIZATION, bearer(tAdmin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", alvo.getEmail()))))
                .andExpect(status().isOk());
    }

    private void assinar(Long avaliacaoId, String especialidade, String token) throws Exception {
        mvc.perform(post("/iqc/" + avaliacaoId + "/partes/" + especialidade + "/finalizar")
                        .header(HttpHeaders.AUTHORIZATION, bearer(token))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("as três especialidades cobrem as 8 dimensões")
    void sanidadeDaDivisao() {
        List<DimensaoIqc> todas = List.of(DimensaoIqc.values());
        long cobertas = todas.stream().filter(d -> d.getResponsavel() != null).count();
        assertEquals(todas.size(), cobertas);
    }
}
