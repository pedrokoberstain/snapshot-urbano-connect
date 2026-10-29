package br.com.urbanoconnect.api.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class MercadoPagoConfig {
    // Token inicializado pelo PagamentoService via @PostConstruct com @Value("${mercado.pago.token}")
}