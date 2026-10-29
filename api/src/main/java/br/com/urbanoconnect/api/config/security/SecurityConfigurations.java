package br.com.urbanoconnect.api.config.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfigurations {

    @Autowired
    private SecurityFilter securityFilter;

    @Autowired
    private RateLimitFilter rateLimitFilter;

    /**
     * Espelha a flag do springdoc. Em produção ela é false, então a rota do
     * Swagger nem chega a ser liberada — a documentação fica desligada por
     * duas barreiras independentes, e não por uma só.
     */
    @Value("${springdoc.swagger-ui.enabled:true}")
    private boolean documentacaoHabilitada;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable()) // Desabilitado para permitir POSTs externos como o do Mercado Pago
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // ── Security headers modernos (API JSON consumida pelo front na Vercel) ──
                .headers(headers -> headers
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000)) // 1 ano
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                        .referrerPolicy(rp -> rp
                                .policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .frameOptions(frame -> frame.deny()))
                .authorizeHttpRequests(req -> {
                    // 1. Preflight CORS
                    req.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();

                    // 1.1. Página de erro interna do Spring Boot.
                    // Erros de validação, 404 e exceções são despachados internamente para
                    // /error. Sem esta liberação eles caem no anyRequest().authenticated()
                    // e chegam ao cliente como 403, escondendo a causa real (um corpo
                    // inválido virava "acesso negado"). Não expõe nada: o corpo devolvido
                    // continua sendo o do erro original.
                    req.requestMatchers("/error").permitAll();

                    // 1.2. Swagger — só existe em dev (ver application-prod.properties).
                    if (documentacaoHabilitada) {
                        req.requestMatchers(
                                "/swagger-ui/**", "/swagger-ui.html",
                                "/v3/api-docs", "/v3/api-docs/**").permitAll();
                    }

                    // 2. Sempre públicas
                    req.requestMatchers(HttpMethod.POST, "/leads").permitAll();
                    req.requestMatchers(HttpMethod.POST, "/webhooks/mercadopago/**").permitAll();
                    req.requestMatchers(HttpMethod.POST, "/login").permitAll();
                    req.requestMatchers(HttpMethod.POST, "/usuarios/registrar").permitAll();
                    req.requestMatchers(HttpMethod.POST, "/usuarios/esqueci-senha").permitAll();
                    req.requestMatchers(HttpMethod.POST, "/usuarios/redefinir-senha").permitAll();

                    // 3. ADMIN apenas — vêm antes das regras public para tomar prioridade
                    req.requestMatchers(HttpMethod.GET,    "/noticias/admin/**").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.POST,   "/noticias").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.PUT,    "/noticias/**").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.DELETE, "/noticias/**").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/imoveis/admin/**").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/usuarios/admin/**").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.PATCH,  "/usuarios/admin/**").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/estatisticas/admin").hasRole("ADMIN");
                    // Consultas usadas no cadastro do anúncio (ficha, busca por bairro/numero,
                    // perfil agregado do bairro) — corretor e admin; precedem a regra ADMIN abaixo.
                    req.requestMatchers(HttpMethod.GET,    "/cadastro-iptu/venal").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/cadastro-iptu/ficha/**").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/cadastro-iptu/por-endereco").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/cadastro-iptu/buscar").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/cadastro-iptu/perfil-bairro").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/cadastro-iptu/**").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.PUT,    "/cadastro-iptu/**").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.POST,   "/cadastro-iptu/**").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/admin/planos").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.PUT,    "/admin/planos/**").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/newsletter/assinantes").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/newsletter/stats").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.POST,   "/newsletter/enviar").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.POST,   "/newsletter/testar").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.GET,    "/newsletter/templates").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.POST,   "/newsletter/templates").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.PUT,    "/newsletter/templates/**").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.DELETE, "/newsletter/templates/**").hasRole("ADMIN");

                    // 3.1. Credenciais profissionais. A análise é só do ADMIN; o
                    // profissional envia a dele por /credenciais.
                    req.requestMatchers("/admin/credenciais/**").hasRole("ADMIN");
                    req.requestMatchers("/credenciais/**").authenticated();

                    // 4. CORRETOR ou ADMIN — gestão de imóveis
                    // Calculadora IQC profissional (privada). CORRETOR precisa de plano PRO — checado no IqcController.
                    // Calculadora IQC e cadastro de condomínios.
                    //
                    // Aqui o papel sozinho deixou de bastar. A permissão virou por
                    // condomínio: além de ADMIN e CORRETOR PRO, quem recebeu acesso de
                    // AVALIADOR num condomínio pode avaliá-lo — e engenheiro ou arquiteto
                    // de campo não é corretor. Como isso depende do recurso, e não do
                    // papel, o filtro não consegue decidir: quem decide é
                    // AcessoIqcService, chamado no início de TODO endpoint de
                    // IqcController, CondominioController e AcessoCondominioController.
                    //
                    // O que continua sendo decidível por papel fica por papel: criar,
                    // editar e desativar condomínio segue exigindo CORRETOR ou ADMIN.
                    req.requestMatchers(HttpMethod.POST,   "/condominios").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers(HttpMethod.PUT,    "/condominios/*").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers(HttpMethod.DELETE, "/condominios/*").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers("/condominios/**").authenticated();
                    req.requestMatchers("/iqc/**").authenticated();

                    // Lado do morador: qualquer usuário autenticado busca o próprio
                    // condomínio e envia o comprovante. O acesso só passa a valer
                    // depois da análise.
                    req.requestMatchers("/moradores/**").authenticated();
                    req.requestMatchers(HttpMethod.POST,   "/imoveis").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers(HttpMethod.PUT,    "/imoveis/**").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers(HttpMethod.DELETE, "/imoveis/**").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers(HttpMethod.PATCH,  "/imoveis/**").hasAnyRole("CORRETOR", "ADMIN");
                    req.requestMatchers(HttpMethod.POST,   "/imoveis/**").hasAnyRole("CORRETOR", "ADMIN");

                    // 5. Rotas públicas de leitura + newsletter pública
                    req.requestMatchers(HttpMethod.GET, "/precos-planos").permitAll();
                    req.requestMatchers(HttpMethod.POST, "/newsletter/inscrever").permitAll();
                    req.requestMatchers(HttpMethod.GET,  "/newsletter/cancelar").permitAll();
                    req.requestMatchers(HttpMethod.GET, "/imoveis/**").permitAll();
                    req.requestMatchers(HttpMethod.GET, "/cotacoes").permitAll();
                    req.requestMatchers(HttpMethod.GET, "/indicadores").permitAll();
                    req.requestMatchers(HttpMethod.GET, "/noticias").permitAll();
                    req.requestMatchers(HttpMethod.GET, "/noticias/destaque").permitAll();
                    req.requestMatchers(HttpMethod.GET, "/noticias/populares").permitAll();
                    req.requestMatchers(HttpMethod.GET, "/noticias/**").permitAll();
                    req.requestMatchers(HttpMethod.GET, "/estatisticas").permitAll();

                    // 6. Rotas autenticadas gerais
                    req.requestMatchers(HttpMethod.POST, "/pagamentos/**").authenticated();
                    req.requestMatchers(HttpMethod.GET,  "/usuarios/me").authenticated();
                    req.requestMatchers(HttpMethod.PUT,  "/usuarios/me").authenticated();
                    req.requestMatchers(HttpMethod.PUT,  "/usuarios/me/**").authenticated();

                    // 7. Qualquer outra rota exige autenticação
                    req.anyRequest().authenticated();
                })
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}