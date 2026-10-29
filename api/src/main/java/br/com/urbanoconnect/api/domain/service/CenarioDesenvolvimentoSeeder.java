package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ══════════════════════════════════════════════════════════════
 *  CENÁRIO DE DESENVOLVIMENTO — sobe pronto para clicar
 * ══════════════════════════════════════════════════════════════
 *
 *  O IQC deixou de ser uma calculadora de uma tela e virou um fluxo com
 *  pré-requisitos: condomínio cadastrado, profissional credenciado, parte
 *  designada, comprovante de morador analisado. Testar à mão exigia montar
 *  tudo isso antes de conseguir clicar em qualquer coisa.
 *
 *  Este seeder monta o cenário inteiro no boot. É idempotente: se os usuários
 *  já existem, não faz nada — dá para reiniciar à vontade.
 *
 *  {@code @Profile("dev")} garante que ele não existe em produção, que roda com
 *  o perfil prod. Ainda assim, todo e-mail termina em @teste.local, para que
 *  um registro que escape seja reconhecível de imediato.
 */
@Component
@Profile("dev")
public class CenarioDesenvolvimentoSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CenarioDesenvolvimentoSeeder.class);
    private static final String SENHA = "Teste1234";

    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private CondominioRepository condominioRepo;
    @Autowired private CredencialProfissionalRepository credencialRepo;
    @Autowired private AcessoCondominioRepository acessoRepo;
    @Autowired private PasswordEncoder encoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepo.findByEmail("admin@teste.local") != null) {
            log.info("Cenário de desenvolvimento já existe — nada a fazer.");
            return;
        }

        log.info("Montando o cenário de desenvolvimento (perfil dev)…");

        Usuario admin      = usuario("Admin Teste",      "admin@teste.local",      TipoUsuario.ADMIN,    "GRATUITO");
        Usuario corretor   = usuario("Corretor PRO",     "corretor@teste.local",   TipoUsuario.CORRETOR, "PRO");
        Usuario engenheiro = usuario("João Engenheiro",  "engenheiro@teste.local", TipoUsuario.USUARIO,  "GRATUITO");
        Usuario arquiteto  = usuario("Carla Arquiteta",  "arquiteto@teste.local",  TipoUsuario.USUARIO,  "GRATUITO");
        Usuario analista   = usuario("Rui Analista",     "analista@teste.local",   TipoUsuario.USUARIO,  "GRATUITO");

        credencial(engenheiro, EspecialidadeTecnica.ENGENHEIRO, "12345", admin);
        credencial(arquiteto,  EspecialidadeTecnica.ARQUITETO,  "67890", admin);
        credencial(analista,   EspecialidadeTecnica.ANALISTA,   null,    admin);

        Condominio cond = new Condominio();
        cond.setNome("Edifício Solar do Pantanal");
        cond.setTipoCondominio(TipoCondominio.VERTICAL);
        cond.setBairro("Goiabeiras");
        cond.setCidade("Cuiabá");
        cond.setUf("MT");
        cond.setQtdUnidades(120);
        cond.setAnoEntrega(2019);
        cond.setCriadoPor(admin);
        condominioRepo.save(cond);

        // Três moradores antigos (a opinião pontua) e um recém-chegado (não
        // pontua) — é o caso que mostra a trava dos 6 meses funcionando.
        morador(cond, usuario("Maria Moradora", "maria@teste.local", TipoUsuario.USUARIO, "GRATUITO"),
                "302", VinculoMorador.PROPRIETARIO, LocalDate.now().minusYears(5), admin);
        morador(cond, usuario("João Silva", "joao@teste.local", TipoUsuario.USUARIO, "GRATUITO"),
                "101", VinculoMorador.PROPRIETARIO, LocalDate.now().minusYears(7), admin);
        morador(cond, usuario("Ana Souza", "ana@teste.local", TipoUsuario.USUARIO, "GRATUITO"),
                "204", VinculoMorador.INQUILINO, LocalDate.now().minusYears(4), admin);
        morador(cond, usuario("Pedro Novo", "pedro@teste.local", TipoUsuario.USUARIO, "GRATUITO"),
                "508", VinculoMorador.PROPRIETARIO, LocalDate.now().minusMonths(2), admin);

        log.info("""

                ╭───────────────────────────────────────────────────────────────╮
                │  CENÁRIO DE DESENVOLVIMENTO PRONTO — senha: {}        │
                ├───────────────────────────────────────────────────────────────┤
                │  admin@teste.local        ADMIN                                │
                │  corretor@teste.local     CORRETOR PRO                         │
                │  engenheiro@teste.local   credencial CREA-MT 12345             │
                │  arquiteto@teste.local    credencial CAU-MT 67890              │
                │  analista@teste.local     designado internamente               │
                │  maria / joao / ana       moradores (opinião pontua)           │
                │  pedro@teste.local        morador há 2 meses (não pontua)      │
                ├───────────────────────────────────────────────────────────────┤
                │  Condomínio "Edifício Solar do Pantanal" cadastrado.           │
                │  Abra /admin/iqc como admin e crie a avaliação dele.           │
                ╰───────────────────────────────────────────────────────────────╯
                """, SENHA);
    }

    private Usuario usuario(String nome, String email, TipoUsuario tipo, String plano) {
        Object existente = usuarioRepo.findByEmail(email);
        if (existente instanceof Usuario u) return u;

        Usuario u = new Usuario();
        u.setNome(nome);
        u.setEmail(email);
        u.setSenha(encoder.encode(SENHA));
        u.setTipo(tipo);
        u.setPlano(plano);
        u.setAceitouTermos(true);
        u.setDataAceiteTermos(LocalDateTime.now());
        u.setVersaoTermos("1.0");
        return usuarioRepo.save(u);
    }

    private void credencial(Usuario dono, EspecialidadeTecnica profissao, String numero, Usuario analisadoPor) {
        if (credencialRepo.findByUsuarioIdAndProfissao(dono.getId(), profissao).isPresent()) return;

        CredencialProfissional c = new CredencialProfissional();
        c.setUsuario(dono);
        c.setProfissao(profissao);
        c.setStatus(StatusCredencial.APROVADA);
        c.setNumeroRegistro(numero);
        c.setUfRegistro(numero != null ? "MT" : null);
        c.setAnalisadoPor(analisadoPor);
        c.setDataAnalise(LocalDateTime.now());
        credencialRepo.save(c);
    }

    private void morador(Condominio cond, Usuario quem, String unidade,
                         VinculoMorador vinculo, LocalDate desde, Usuario analisadoPor) {
        if (acessoRepo.findByCondominioIdAndUsuarioId(cond.getId(), quem.getId()).isPresent()) return;

        AcessoCondominio a = new AcessoCondominio();
        a.setCondominio(cond);
        a.setUsuario(quem);
        a.setPapel(PapelAcessoCondominio.MORADOR);
        a.setStatus(StatusAcessoCondominio.APROVADO);
        a.setUnidade(unidade);
        a.setVinculo(vinculo);
        a.setMoradorDesde(desde);
        a.setAnalisadoPor(analisadoPor);
        a.setDataAnalise(LocalDateTime.now());
        // Sem documento: o comprovante já teria sido destruído na análise.
        a.setComprovanteRemovidoEm(LocalDateTime.now());
        acessoRepo.save(a);
    }
}
