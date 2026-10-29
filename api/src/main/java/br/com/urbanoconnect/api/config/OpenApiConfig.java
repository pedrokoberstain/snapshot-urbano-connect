package br.com.urbanoconnect.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Documentação viva da API, disponível só em desenvolvimento
 * (http://localhost:8080/swagger-ui.html).
 *
 * O esquema de segurança declarado aqui é o que faz o botão "Authorize" do
 * Swagger funcionar: sem ele, todo endpoint autenticado responderia 403 na
 * tentativa de teste e a documentação viraria enfeite.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI urbanoConnectOpenAPI() {
        final String esquemaJwt = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Urbano Connect — API")
                        .version("1.0")
                        .description("""
                                API do Urbano Connect: anúncios, precificação hedônica, leads,
                                notícias, pagamentos e o IQC (Índice de Qualidade de Condomínios).

                                **Autenticação** — `POST /login` devolve um JWT válido por 1 hora.
                                Use o botão *Authorize* e cole apenas o token, sem o prefixo `Bearer`.

                                **IQC** — a permissão é por condomínio, não só por papel: além de
                                ADMIN e CORRETOR PRO, quem recebe acesso de AVALIADOR num
                                condomínio pode avaliá-lo. Morador é outro vínculo, exige
                                comprovante de residência analisado, e habilita apenas opinar.
                                """))
                .addSecurityItem(new SecurityRequirement().addList(esquemaJwt))
                .components(new Components().addSecuritySchemes(esquemaJwt,
                        new SecurityScheme()
                                .name(esquemaJwt)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
