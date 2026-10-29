# Urbano Connect — Snapshot Técnico

**Autor:** Pedro Koberstain
**Período de desenvolvimento:** 2026
**Snapshot:** Outubro/2026

Este repositório é um **snapshot pessoal** do meu trabalho desenvolvendo a plataforma Urbano Connect — uma aplicação fullstack de inteligência imobiliária para o estado de Mato Grosso. O código aqui representa o estado da aplicação no momento desta captura e serve como demonstração técnica do que construí.

---

## Visão geral

Plataforma web completa com dois perfis de uso — compradores/proprietários e corretores — cobrindo cadastro de imóveis, listagem pública com filtros, área administrativa, assinaturas pagas (Mercado Pago), notícias do setor e integrações com fontes externas.

Dois projetos independentes:

- **`/api`** — Backend em Spring Boot 4 (Java 17) com PostgreSQL 16
- **`/web`** — Frontend em Next.js 16 (App Router) com Tailwind CSS v4

---

## Stack técnica

### Backend
- Spring Boot 4.0.5, Java 17, Maven
- Spring Security + JWT para autenticação stateless
- Spring Data JPA + Flyway para versionamento de schema
- PostgreSQL 16
- SpringDoc / OpenAPI (Swagger UI)
- SDK Mercado Pago para assinaturas e PIX
- JSoup para scraping de cotações agrícolas (CEPEA)
- Spring Mail (SMTP) para transacionais

### Frontend
- Next.js 16 com App Router (client-side components)
- React 19
- TypeScript estrito
- Tailwind CSS v4 (via PostCSS plugin)
- Cloudinary (upload de imagens via widget)

### Infraestrutura
- Docker Compose com 3 serviços (Postgres + App + Caddy)
- Caddy 2 como reverse proxy com HTTPS automático (Let's Encrypt)
- Deploy em VPS Linux via `git pull && docker compose up -d --build`

---

## Principais features entregues

- Autenticação JWT com dois perfis (USUARIO e CORRETOR) e fluxo de recuperação de senha
- Cadastro de imóveis com 7 tipos (RURAL, CASA, APARTAMENTO, TERRENO, CHACARA, LOTEAMENTO, COMERCIAL) e subtipo rural com ficha agronômica detalhada
- Vitrine pública com filtros por cidade, tipo, faixa de preço, área e score de oportunidade
- Páginas por cidade (slug + agregação de imóveis + notícias locais)
- Score automático de "oportunidade de investimento" calculado no backend
- Checkout de assinatura PRO via Mercado Pago (link + PIX com QR code e polling de confirmação)
- Painel administrativo completo para corretores (CRUD de imóveis, leads, notícias)
- Widget de mercado com estatísticas calculadas em tempo real
- Scraping diário de cotações CEPEA/B3 para informar decisão de investidor rural
- Importação de dados abertos municipais (base IPTU + Boletim de Cadastro Imobiliário) com normalização de formatos legados e cascata de 5 níveis para correspondência endereço↔inscrição
- Sistema de leads com rastreamento de origem

---

## Estrutura do repositório

```
/
├── api/                    Backend Spring Boot
│   ├── src/main/java/      Código Java
│   ├── src/main/resources/
│   │   ├── db/migration/   Migrations Flyway versionadas
│   │   └── data/           CSVs de dados abertos municipais
│   ├── Dockerfile          Imagem da aplicação
│   ├── docker-compose.yml  Stack completa (db + app + caddy)
│   ├── Caddyfile           Config do reverse proxy
│   └── deploy/             Documentação de deploy
│
└── web/                    Frontend Next.js
    ├── app/                App Router (rotas e componentes)
    │   ├── admin/          Área autenticada do corretor
    │   ├── imovel/[id]/    Detalhe público do imóvel
    │   ├── cidade/[slug]/  Página por cidade
    │   └── ...
    ├── public/             Assets estáticos
    └── docs/               Documentação técnica
```

---

## Observações sobre este snapshot

- Este é um **snapshot pontual** — a aplicação em produção continua evoluindo e pode diverger do que está aqui
- Credenciais, chaves e tokens foram removidos ou substituídos por placeholders (`${VAR}`)
- Para rodar localmente, consulte `/api/README.md` e `/web/README.md`
- Variáveis de ambiente de exemplo em `/api/.env.example`

---

## Contato

Pedro Koberstain
pedrokoberstain2@gmail.com

---

*Snapshot gerado em Outubro/2026. Projeto desenvolvido ao longo de 2026.*
