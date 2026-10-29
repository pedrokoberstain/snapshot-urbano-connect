package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.AssinanteNewsletter;
import br.com.urbanoconnect.api.domain.model.StatusAssinante;
import br.com.urbanoconnect.api.domain.repository.AssinanteNewsletterRepository;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class NewsletterService {

    @Autowired
    private AssinanteNewsletterRepository repository;

    @Autowired
    private EmailService emailService;

    @Value("${FRONTEND_URL:http://localhost:3000}")
    private String frontendUrl;

    @Transactional
    public String inscrever(String email, String nome) {
        var existente = repository.findByEmail(email);

        if (existente.isPresent()) {
            var assinante = existente.get();
            if (assinante.getStatus() == StatusAssinante.ATIVO) {
                return "JA_INSCRITO";
            }
            // Reativa quem havia cancelado
            assinante.setStatus(StatusAssinante.ATIVO);
            if (nome != null && !nome.isBlank()) assinante.setNome(nome);
            repository.save(assinante);
            return "REATIVADO";
        }

        AssinanteNewsletter novo = new AssinanteNewsletter();
        novo.setEmail(email);
        novo.setNome(nome);
        repository.save(novo);
        return "INSCRITO";
    }

    @Transactional
    public boolean cancelar(String token) {
        return repository.findByTokenCancelamento(token).map(a -> {
            a.setStatus(StatusAssinante.CANCELADO);
            repository.save(a);
            return true;
        }).orElse(false);
    }

    public List<AssinanteNewsletter> listarAtivos() {
        return repository.findByStatusOrderByDataCadastroDesc(StatusAssinante.ATIVO);
    }

    public long contarAtivos() {
        return repository.countByStatus(StatusAssinante.ATIVO);
    }

    public long contarTotal() {
        return repository.count();
    }

    @Async
    public void enviarParaTodos(String assunto, String conteudoHtml, String urlBotao, String textoBotao) {
        List<AssinanteNewsletter> ativos = repository.findByStatusOrderByDataCadastroDesc(StatusAssinante.ATIVO);

        for (AssinanteNewsletter assinante : ativos) {
            try {
                String linkCancelamento = frontendUrl + "/newsletter/cancelar?token=" + assinante.getTokenCancelamento();
                String html = EmailService.montarTemplateNewsletter(assunto, conteudoHtml, urlBotao, textoBotao, linkCancelamento);
                emailService.enviarEmailHtml(assinante.getEmail(), assunto, html);
            } catch (MessagingException | java.io.UnsupportedEncodingException e) {
                // Falha em um endereço não deve interromper os demais
            }
        }
    }
}
