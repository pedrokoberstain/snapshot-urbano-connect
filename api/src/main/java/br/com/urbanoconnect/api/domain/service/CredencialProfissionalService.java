package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.CredencialProfissional;
import br.com.urbanoconnect.api.domain.model.EspecialidadeTecnica;
import br.com.urbanoconnect.api.domain.repository.CredencialProfissionalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Consulta da habilitação profissional.
 *
 * Fica separado do controller porque quem pergunta "esta pessoa pode assumir a
 * parte do engenheiro?" é a distribuição de partes do laudo, não a tela de
 * credenciais.
 */
@Service
public class CredencialProfissionalService {

    @Autowired
    private CredencialProfissionalRepository repository;

    /** A credencial que habilita hoje — aprovada e dentro da validade. */
    public Optional<CredencialProfissional> vigente(Long usuarioId, EspecialidadeTecnica profissao) {
        return repository.findByUsuarioIdAndProfissao(usuarioId, profissao)
                .filter(CredencialProfissional::isVigente);
    }

    public boolean habilitado(Long usuarioId, EspecialidadeTecnica profissao) {
        return vigente(usuarioId, profissao).isPresent();
    }

    /**
     * Registro para estampar na assinatura do laudo, quando houver conselho.
     * Analista devolve vazio — não tem número a exibir, e inventar um seria
     * pior do que não mostrar nada.
     */
    public String registroParaAssinatura(Long usuarioId, EspecialidadeTecnica profissao) {
        return vigente(usuarioId, profissao)
                .map(CredencialProfissional::getRegistroFormatado)
                .orElse(null);
    }

    /**
     * Explica a recusa em vez de só negar. A pessoa precisa saber se falta
     * enviar, se está em análise, se foi recusada ou se apenas venceu — são
     * quatro situações com quatro saídas diferentes.
     */
    public String motivoDeNaoHabilitar(Long usuarioId, EspecialidadeTecnica profissao) {
        Optional<CredencialProfissional> opt = repository.findByUsuarioIdAndProfissao(usuarioId, profissao);
        if (opt.isEmpty()) {
            return "não possui credencial de " + profissao.getRotulo() + " cadastrada";
        }
        CredencialProfissional c = opt.get();
        if (c.isVencida()) {
            return "está com a credencial de " + profissao.getRotulo()
                    + " vencida em " + c.getValidoAte();
        }
        return switch (c.getStatus()) {
            case PENDENTE -> "tem a credencial de " + profissao.getRotulo() + " em análise";
            case RECUSADA -> "teve a credencial de " + profissao.getRotulo() + " recusada";
            case REVOGADA -> "teve a credencial de " + profissao.getRotulo() + " revogada";
            case APROVADA -> "não está habilitado"; // inalcançável na prática
        };
    }
}
