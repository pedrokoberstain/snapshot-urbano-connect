package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.ConfiguracaoPlano;
import br.com.urbanoconnect.api.domain.repository.ConfiguracaoPlanoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ConfiguracaoPlanoSeeder implements ApplicationRunner {

    @Autowired
    private ConfiguracaoPlanoRepository repository;

    @Override
    public void run(ApplicationArguments args) {
        if (repository.findByTipo("MENSAL").isEmpty()) {
            var mensal = new ConfiguracaoPlano();
            mensal.setTipo("MENSAL");
            mensal.setValor(new BigDecimal("29.90"));
            mensal.setDescricao("Plano PRO Mensal");
            repository.save(mensal);
        }
        if (repository.findByTipo("ANUAL").isEmpty()) {
            var anual = new ConfiguracaoPlano();
            anual.setTipo("ANUAL");
            anual.setValor(new BigDecimal("299.00"));
            anual.setDescricao("Plano PRO Anual");
            repository.save(anual);
        }
    }
}
