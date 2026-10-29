# ⚙️ Urbano Connect API

API RESTful que sustenta a plataforma Urbano Connect, um sistema imobiliário focado na dinâmica econômica do estado de Mato Grosso.

## 🎯 O Propósito do Projeto
O mercado imobiliário de Mato Grosso tem uma particularidade forte: a interdependência entre o agronegócio (rural) e o crescimento das cidades (urbano). O Urbano Connect foi criado para centralizar essas duas frentes. 

Mais do que um simples CRUD de imóveis, a regra de negócio do sistema é estruturada para:
1. **Atender dois nichos simultâneos:** Classificação rigorosa entre imóveis `RURAIS` (fazendas, áreas de plantio) e `URBANOS` (loteamentos, condomínios).
2. **Inteligência de Mercado Integrada:** Fornecer suporte de dados e notícias locais que impactam a compra e venda (ex: como uma safra recorde afeta o m² em cidades específicas).
3. **Gestão de Leads para Corretores:** Recepcionar intenções de compra geradas na vitrine e entregá-las a corretores autenticados em um painel seguro.

## 🛠️ Stack Tecnológica
* **Linguagem:** Java 17
* **Framework:** Spring Boot 3.x
* **Autenticação:** Spring Security + JWT (Stateless)
* **ORM e Persistência:** Hibernate / Spring Data JPA
* **Banco de Dados:** MySQL / PostgreSQL
* **Validação:** Jakarta Bean Validation (DTOs)
* **Criptografia:** BCrypt para senhas

## ⚙️ Arquitetura e Decisões Técnicas
* **Design Pattern:** Uso estrito de DTOs (Data Transfer Objects) com `Records` do Java para tráfego de dados entre as camadas, evitando exposição das entidades do banco.
* **Segurança de Atualizações:** Implementação do método `getReferenceById` no JPA para atualizações de perfil (`PUT /usuarios/me`), garantindo que apenas registros existentes sejam persistidos com os dados novos.
* **Proof-of-Possession:** Endpoints sensíveis (como alteração de senha) exigem verificação criptográfica (`PasswordEncoder.matches`) da senha atual do usuário autenticado no contexto do Spring Security.
* **CORS Management:** Configuração explícita de `CorsConfigurationSource` para permitir métodos restritos (PUT, DELETE) originados do front-end SPA.

## 🚀 Como Executar Localmente

Só é preciso **PostgreSQL local**. Docker existe apenas para o deploy na VPS — não entra no fluxo de desenvolvimento.

```bash
# 1. Crie o banco e ajuste as credenciais em application-dev.properties
createdb -h localhost -U postgres urbano_connect_db

# 2. Suba a API — o Flyway monta o schema inteiro e o seeder popula o cenário
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

A API sobe em `http://localhost:8080` e a documentação em `http://localhost:8080/swagger-ui.html` (só em dev; produção mantém o Swagger desligado).

O front fica no repositório `urbano-connect-web`: `npm run dev`, já apontando para a API pelo `.env.local`.

### Cenário de teste

No perfil `dev`, o `CenarioDesenvolvimentoSeeder` cria no boot — e só se ainda não existirem — um admin, um corretor PRO, engenheiro e arquiteto já credenciados, um analista designado, um condomínio e quatro moradores aprovados. Três com opinião que pontua e um com 2 meses de moradia, que é onde a trava dos 6 meses aparece.

Todos usam a senha `Teste1234` e e-mail `@teste.local`. É idempotente: reiniciar não duplica nada, e apagar o banco e subir de novo devolve tudo em menos de um minuto.

### Duas armadilhas conhecidas

> **Migração nova exige rebuild.** O DevTools só reinicia quando `target/classes` muda, e um arquivo em `src/main/resources/db/migration` só chega lá com um build. Depois de criar uma migração, rode `./mvnw compile` — reiniciar a aplicação sozinho não adianta. O sintoma é a migração simplesmente não aparecer no `flyway_schema_history`, sem erro nenhum.

> **No Windows, `pkill` não mata a JVM.** Se a porta 8080 ficar presa, use `Get-Process java | Stop-Process -Force` no PowerShell. Um processo órfão segurando a porta faz a próxima subida falhar em silêncio: o app novo não sobe e o antigo continua respondendo com o código antigo.
