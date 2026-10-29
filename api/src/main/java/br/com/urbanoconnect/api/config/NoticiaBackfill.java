package br.com.urbanoconnect.api.config;

import br.com.urbanoconnect.api.domain.model.Noticia;
import br.com.urbanoconnect.api.domain.repository.NoticiaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Migração idempotente: copia os campos legados {@code categoria}/{@code cidade}
 * para as novas coleções {@code categorias}/{@code cidades} em notícias antigas
 * que ainda não as possuem. Roda a cada boot, mas só grava o que estiver vazio.
 */
@Component
public class NoticiaBackfill implements CommandLineRunner {

    private final NoticiaRepository repository;

    public NoticiaBackfill(NoticiaRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (Noticia n : repository.findAll()) {
            boolean alterado = false;

            if (n.getCategoria() != null && (n.getCategorias() == null || n.getCategorias().isEmpty())) {
                n.getCategorias().add(n.getCategoria());
                alterado = true;
            }
            if (n.getCidade() != null && !n.getCidade().isBlank()
                    && (n.getCidades() == null || n.getCidades().isEmpty())) {
                n.getCidades().add(n.getCidade());
                alterado = true;
            }
            if (alterado) repository.save(n);
        }
    }
}
