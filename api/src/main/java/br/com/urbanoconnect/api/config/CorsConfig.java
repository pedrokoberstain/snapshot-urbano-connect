package br.com.urbanoconnect.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${ALLOWED_ORIGINS:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(o -> !o.isEmpty())
                .toList();

        // Guarda de segurança: "*" combinado com setAllowCredentials(true) liberaria
        // qualquer site do mundo a fazer requisições autenticadas contra a API. Com
        // setAllowedOrigins o próprio Spring recusaria essa combinação, mas
        // setAllowedOriginPatterns (necessário aqui por causa dos curingas de preview)
        // a aceita silenciosamente. Melhor a aplicação não subir do que subir aberta.
        if (origins.contains("*")) {
            throw new IllegalStateException(
                    "ALLOWED_ORIGINS não pode ser \"*\": a API envia credenciais e isso " +
                    "permitiria requisições autenticadas de qualquer origem. " +
                    "Liste os domínios explicitamente, separados por vírgula.");
        }
        if (origins.isEmpty()) {
            throw new IllegalStateException("ALLOWED_ORIGINS está vazio — nenhuma origem seria aceita.");
        }

        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList(
                "Authorization", "Content-Type", "Accept",
                "Origin", "X-Requested-With", "Cache-Control"
        ));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
