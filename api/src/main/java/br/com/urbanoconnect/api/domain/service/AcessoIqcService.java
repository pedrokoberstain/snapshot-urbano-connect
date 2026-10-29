package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.*;
import br.com.urbanoconnect.api.domain.repository.AcessoCondominioRepository;
import br.com.urbanoconnect.api.domain.repository.CredencialProfissionalRepository;
import br.com.urbanoconnect.api.domain.repository.ParteAvaliacaoIqcRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * ══════════════════════════════════════════════════════════════
 *  REGRAS DE ACESSO DO IQC
 * ══════════════════════════════════════════════════════════════
 *
 *  Duas camadas, e a distinção importa:
 *
 *  1. Quem pode abrir a calculadora — ADMIN ou CORRETOR com plano PRO.
 *  2. Em qual condomínio — quem cadastrou, ou quem recebeu acesso de
 *     AVALIADOR naquele condomínio específico.
 *
 *  Antes existia só a camada 1, e um corretor PRO alcançava qualquer
 *  condomínio. A camada 2 é a liberação por usuário e por empreendimento.
 */
@Service
public class AcessoIqcService {

    @Autowired
    private AcessoCondominioRepository acessoRepository;

    @Autowired
    private ParteAvaliacaoIqcRepository parteRepository;

    @Autowired
    private CredencialProfissionalRepository credencialRepository;

    /** Camada 1: ADMIN sempre; CORRETOR apenas com plano PRO. */
    public boolean podeUsarIqc(Usuario u) {
        if (u == null) return false;
        if (u.getTipo() == TipoUsuario.ADMIN) return true;
        if (u.getTipo() == TipoUsuario.CORRETOR) {
            String plano = u.getPlano();
            return plano != null && plano.trim().toUpperCase().startsWith("PRO");
        }
        return false;
    }

    /**
     * Porta de entrada da área do IQC, para as telas sem condomínio no contexto
     * (catálogo, lista). Quem foi convidado como avaliador em algum condomínio
     * entra, mesmo sem ser corretor PRO — é o que "liberar acesso por usuário"
     * significa. O recorte do que ele enxerga continua sendo por condomínio.
     */
    public boolean podeEntrarNoIqc(Usuario u) {
        if (podeUsarIqc(u)) return true;
        if (u == null) return false;
        if (acessoRepository.existsByUsuarioIdAndPapelAndStatus(
                u.getId(), PapelAcessoCondominio.AVALIADOR, StatusAcessoCondominio.APROVADO)) {
            return true;
        }
        // Quem responde por uma parte de algum laudo obviamente pode entrar na
        // área. Sem isto o profissional designado ficava trancado do lado de
        // fora do próprio trabalho, porque o portão só conhecia o acesso por
        // condomínio e não sabia nada sobre as partes.
        if (parteRepository.existsByResponsavelId(u.getId())) return true;

        // E quem tem credencial vigente pertence à área mesmo antes da primeira
        // designação: ele precisa conseguir abrir a tela para ver que ainda não
        // foi designado. Barrar aqui daria a impressão de que a credencial
        // aprovada não valeu de nada.
        return credencialRepository.existsByUsuarioIdAndStatus(
                u.getId(), StatusCredencial.APROVADA);
    }

    /**
     * Camada 2, leitura e avaliação: ADMIN, quem cadastrou, ou quem tem acesso
     * de AVALIADOR aprovado naquele condomínio.
     */
    public boolean podeAvaliarCondominio(Usuario u, Condominio c) {
        if (u == null || c == null) return false;
        if (u.getTipo() == TipoUsuario.ADMIN) return true;
        if (ehDono(u, c)) return true;

        return acessoRepository.existsByCondominioIdAndUsuarioIdAndPapelAndStatus(
                c.getId(), u.getId(),
                PapelAcessoCondominio.AVALIADOR, StatusAcessoCondominio.APROVADO);
    }

    /**
     * Camada 2, administração: editar o cadastro, conceder acesso a outros e
     * analisar comprovante. Deliberadamente mais estreito que
     * {@link #podeAvaliarCondominio} — um avaliador convidado usa a
     * calculadora, mas não distribui acesso nem lê documento de morador.
     */
    public boolean podeGerenciarCondominio(Usuario u, Condominio c) {
        if (u == null || c == null) return false;
        return u.getTipo() == TipoUsuario.ADMIN || ehDono(u, c);
    }

    /** Morador com vínculo aprovado — habilita registrar opinião. */
    public boolean ehMoradorAprovado(Usuario u, Long condominioId) {
        if (u == null || condominioId == null) return false;
        return acessoRepository.existsByCondominioIdAndUsuarioIdAndPapelAndStatus(
                condominioId, u.getId(),
                PapelAcessoCondominio.MORADOR, StatusAcessoCondominio.APROVADO);
    }

    private boolean ehDono(Usuario u, Condominio c) {
        return c.getCriadoPor() != null && c.getCriadoPor().getId().equals(u.getId());
    }
}
