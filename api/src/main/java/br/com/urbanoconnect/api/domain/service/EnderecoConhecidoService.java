package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.EnderecoConhecido;
import br.com.urbanoconnect.api.domain.model.Imovel;
import br.com.urbanoconnect.api.domain.repository.EnderecoConhecidoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Alimenta e consulta a base de correspondência endereço → inscrição imobiliária.
 * Toda vez que um corretor cadastra ou edita um imóvel completo (cidade +
 * logradouro + número + inscrição), gravamos a correspondência para acelerar
 * o cadastro de futuros imóveis no mesmo endereço.
 */
@Service
public class EnderecoConhecidoService {

    private static final Logger log = LoggerFactory.getLogger(EnderecoConhecidoService.class);

    private final EnderecoConhecidoRepository repository;

    public EnderecoConhecidoService(EnderecoConhecidoRepository repository) {
        this.repository = repository;
    }

    /**
     * Registra a correspondência endereço → inscrição para este imóvel, se ele
     * tem todos os campos necessários preenchidos. Idempotente: se já existe
     * correspondência para o mesmo endereço normalizado, atualiza a inscrição
     * (o último cadastro vence — assume que a informação mais recente é a mais
     * confiável). Sem contrapartida: se faltar qualquer campo, não faz nada e
     * não estoura — cadastro do imóvel segue normal.
     */
    @Transactional
    public void registrar(Imovel imovel) {
        if (imovel == null) return;
        String cidade = trimOrNull(imovel.getCidade());
        String logradouro = trimOrNull(imovel.getLogradouro());
        String numero = trimOrNull(imovel.getNumero());
        String inscricao = trimOrNull(imovel.getInscricao());
        if (cidade == null || logradouro == null || numero == null || inscricao == null) return;

        String logNorm = normalizar(logradouro);
        String numNorm = normalizarNumero(numero);
        if (logNorm.isEmpty() || numNorm.isEmpty()) return;

        LocalDateTime agora = LocalDateTime.now();
        Optional<EnderecoConhecido> existente = repository
                .findByCidadeAndLogradouroNormAndNumeroNorm(cidade, logNorm, numNorm);

        EnderecoConhecido ec;
        if (existente.isPresent()) {
            ec = existente.get();
            if (inscricao.equals(ec.getInscricao())
                    && numero.equals(ec.getNumero())
                    && logradouro.equals(ec.getLogradouro())) {
                // Nada mudou — evita write desnecessário.
                return;
            }
        } else {
            ec = new EnderecoConhecido();
            ec.setCidade(cidade);
            ec.setLogradouroNorm(logNorm);
            ec.setNumeroNorm(numNorm);
            ec.setDataCriacao(agora);
        }
        ec.setCep(trimOrNull(imovel.getCep()));
        ec.setLogradouro(logradouro);
        ec.setNumero(numero);
        ec.setInscricao(inscricao);
        ec.setImovelId(imovel.getId());
        ec.setDataAtualizacao(agora);

        try {
            repository.save(ec);
        } catch (Exception e) {
            // Race entre dois cadastros simultâneos com o mesmo endereço pode dar unique
            // violation. Não é grave — o outro já gravou. Loga e segue.
            log.warn("Falha ao registrar endereço conhecido ({} / {} / {}): {}",
                    cidade, logradouro, numero, e.getMessage());
        }
    }

    /** Busca a correspondência pelo endereço normalizado. */
    public Optional<EnderecoConhecido> buscar(String cidade, String logradouro, String numero) {
        String c = trimOrNull(cidade);
        String l = trimOrNull(logradouro);
        String n = trimOrNull(numero);
        if (c == null || l == null || n == null) return Optional.empty();
        String logNorm = normalizar(l);
        String numNorm = normalizarNumero(n);
        if (logNorm.isEmpty() || numNorm.isEmpty()) return Optional.empty();
        return repository.findByCidadeAndLogradouroNormAndNumeroNorm(c, logNorm, numNorm);
    }

    private static String trimOrNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** Normalização de logradouro: uppercase, sem acento, sem pontuação, espaços colapsados. */
    private static String normalizar(String s) {
        String n = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return n.toUpperCase()
                .replaceAll("[^A-Z0-9 ]", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    /** Normalização de número: só alfanumérico, upper (713-S → 713S ≡ 713 S). */
    private static String normalizarNumero(String s) {
        return s.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }
}
