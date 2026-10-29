package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.TemplateNewsletter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateNewsletterRepository extends JpaRepository<TemplateNewsletter, Long> {

    List<TemplateNewsletter> findAllByOrderByPadraoDescDataCriacaoAsc();

    void deleteAllByPadraoTrue();
}
