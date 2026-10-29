# Urbano Connect — Documentação Completa

**Plataforma de Inteligência Imobiliária · Mato Grosso**  
Versão: 1.0 · Gerado em: Maio 2026

---

## Sumário

1. [Visão do Produto](#1-visão-do-produto)
2. [Perfis de Usuário](#2-perfis-de-usuário)
3. [Catálogo de Funcionalidades](#3-catálogo-de-funcionalidades)
4. [Modelo de Monetização](#4-modelo-de-monetização)
5. [Arquitetura Geral](#5-arquitetura-geral)
6. [Frontend — Next.js](#6-frontend--nextjs)
7. [Backend — Spring Boot](#7-backend--spring-boot)
8. [Banco de Dados](#8-banco-de-dados)
9. [Referência de API](#9-referência-de-api)
10. [Autenticação e Autorização](#10-autenticação-e-autorização)
11. [Motor de Precificação com IA](#11-motor-de-precificação-com-ia)
12. [Integrações Externas](#12-integrações-externas)
13. [Implantação (Deploy)](#13-implantação-deploy)
14. [Configuração do Ambiente de Desenvolvimento](#14-configuração-do-ambiente-de-desenvolvimento)
15. [Roadmap e Melhorias Futuras](#15-roadmap-e-melhorias-futuras)

---

## 1. Visão do Produto

### O que é o Urbano Connect

O **Urbano Connect** é uma plataforma SaaS de inteligência imobiliária focada no mercado de Mato Grosso. Diferentemente de portais de anúncios genéricos, a plataforma combina um marketplace de imóveis com um motor de análise proprietário baseado em regressão hedônica — entregando ao corretor não apenas visibilidade, mas inteligência de mercado aplicada ao precço e à oportunidade de cada imóvel.

### Proposta de Valor

| Para quem | Problema resolvido | Como o Urbano Connect resolve |
|---|---|---|
| **Corretor (PRO)** | Dificuldade em precificar imóveis rurais e urbanos com critérios técnicos | Motor de IA com coeficientes calibrados para MT calcula o preço justo e o score de oportunidade |
| **Corretor (PRO)** | Gestão manual de leads e acompanhamento de visitas | Painel centralizado com todos os contatos recebidos por imóvel |
| **Comprador / Proprietário** | Falta de transparência sobre o preço real de mercado | Badge "Oportunidade" e score visível nos cards de imóveis |
| **Corretor (PRO)** | Sem acesso rápido a cotações de commodities (soja, boi, milho) | Widget de cotações CEPEA/B3 atualizado três vezes ao dia útil |

### Diferenciais Competitivos

- **Raio-X IA por imóvel** — análise individual com faixa de negociação segura, score de oportunidade e diagnóstico rural ou urbano, disponível com um clique
- **Dados técnicos rurais** — cadastro aprofundado de solo, água, logística, documentação legal e produtividade para fazendas/chácaras; informação que marketplaces nacionais não capturam
- **Foco regional** — coeficientes do modelo econométrico calibrados para o mercado matogrossense (BR-163, MT-130, silos, expansão de Sinop/Lucas do Rio Verde/Rondonópolis)
- **Monetização integrada** — PIX instantâneo e cartão recorrente (Mercado Pago) dentro da própria plataforma, sem redirecionamento permanente

---

## 2. Perfis de Usuário

### USUARIO — Comprador / Proprietário

- Acessa a vitrine pública de imóveis
- Filtra por categoria e texto
- Visualiza detalhes do imóvel
- Envia contato (lead) diretamente ao corretor
- Pode criar conta para salvar preferências
- Plano padrão: **GRATUITO**

### CORRETOR — Agente Imobiliário

- Cadastra e gerencia imóveis (CRUD completo)
- Visualiza e gerencia leads recebidos
- Acessa o **Raio-X IA** por imóvel
- Marca imóveis como vendidos e os reativa quando necessário
- Cria e gerencia notícias/conteúdo editorial
- Acessa cotações CEPEA/B3 em tempo real
- Necessita de **CRECI** para cadastro
- Acessa todas as ferramentas somente com plano **PRO**

### ADMIN — Administrador da Plataforma

- Acesso irrestrito a todas as funcionalidades PRO
- Gerencia conteúdo editorial (notícias, destaques)
- Sem restrição de plano — bypass automático do BlurLock

---

## 3. Catálogo de Funcionalidades

### 3.1 Vitrine Pública (Home)

- Hero com slider automático das últimas notícias (intervalo: 7 s, Swiper.js)
- Ticker de cotações CEPEA/B3 animado na base da tela
- Barra de busca unificada: texto livre + filtro por categoria
- Filtros rápidos de categoria: TODOS · RURAIS · CASAS · APARTAMENTOS
- Grid de imóveis responsivo (4 colunas desktop → 1 coluna mobile)
- Card de imóvel com:
  - Imagem principal (Cloudinary CDN)
  - Badge "Oportunidade" quando `scoreOportunidade ≤ 0.9`
  - Tipo do imóvel com ícone colorido (verde = rural, azul = urbano)
  - Preço formatado em BRL
  - Link direto para a página de detalhe
- Widget de Mercado: preço médio por tipo de imóvel e total de ativos na plataforma

### 3.2 Detalhe do Imóvel

- Carrossel de imagens (galeria completa)
- Dados estruturais: quartos, banheiros, vagas, área (m²)
- Para rurais: renderização dinâmica de todos os dados técnicos (solo, água, logística, documentação)
- Informações de inteligência: preço estimado pelo algoritmo, score de oportunidade, faixa de confiança ±8%
- Formulário de contato integrado (POST `/leads`) — sem necessidade de cadastro para o comprador

### 3.3 Painel do Corretor (Admin)

#### Dashboard
- Cards de métricas: imóveis ativos, leads recebidos, visualizações estimadas
- Acesso rápido para criar novo imóvel

#### Gerenciar Imóveis
- Tabela com abas: **Anúncios Ativos** e **Histórico de Vendas**
- Por imóvel: visualizar no site, editar, excluir, marcar como vendido, reativar
- Animação de comemoração (gamificação) ao marcar a venda — "Negócio Fechado!"
- **Raio-X IA** — abre modal de análise completa com um clique no ícone ✦

#### Raio-X IA (Modal)
- Preço solicitado vs. Avaliação do Algoritmo
- Faixa de negociação segura (margem ±8% sobre avaliação)
- Score de Oportunidade: classificado como "Excelente Compra", "Boa Oportunidade" ou "Preço de Mercado"
- Diagnóstico diferenciado:
  - **Urbano**: Índice de Sprawl + Padrão de Acabamento
  - **Rural**: Índice Logístico (distância de rodovias) + Vocação Produtiva
- Acordeão explicativo com a fórmula matemática da regressão hedônica

#### Formulário de Imóvel
- Informações básicas: título, cidade, bairro, tipo, preço, descrição rich-text (TipTap)
- Upload de imagem principal e galeria via Cloudinary
- Dados estruturais urbanos: quartos, banheiros, vagas, área
- Inputs de calibração do modelo hedônico: valor venal, distância ao centro, preço/m² do bairro
- **Bloco Rural** (exibido quando tipo = RURAL):
  - Solo: tipo, % argila, fertilidade, nutrientes, necessidade de correção
  - Uso da Terra: área útil, reserva legal, APP, degradada, uso atual/potencial, cobertura vegetal
  - Produtividade: soja (sc/ha), milho (sc/ha), pastagem (UA/ha)
  - Aptidão: agrícola e pecuária (escala 1–5)
  - Água: disponibilidade, tipo de fonte, volume, perenidade, irrigação
  - Logística: distância de rodovia, porto, centro consumidor, qualidade de acesso (1–5)
  - Infraestrutura: sede, energia, mecanização, casa de funcionários, curral, galpão
  - Documentação: matrícula regular, georreferenciamento, CAR, CCIR, ITR, ônus

#### Leads
- Tabela de contatos recebidos por imóvel
- Dados: nome, e-mail, telefone, mensagem, data
- Exclusão individual

#### Notícias (Editorial)
- Lista de artigos com status publicado/rascunho
- Editor rich-text com upload de imagens no corpo (TipTap + Cloudinary)
- Campos: título, resumo, imagem de capa, categoria, destaque
- Categorias: AGRONEGÓCIO · MERCADO URBANO · INFRAESTRUTURA · AVIAÇÃO · ECONOMIA

### 3.4 Portal de Notícias (Público)

- Hero com foto de campo e overlay escuro semi-transparente
- Linha decorativa gradiente verde→cyan
- Filtros por categoria com backdrop-blur integrado ao hero
- Grid de cards com data como pílula minimalista
- Página de detalhe com conteúdo HTML do TipTap renderizado

### 3.5 Planos e Assinatura

- Página de planos com comparativo FREE vs PRO
- **Plano MENSAL**: R$ 29,90/mês
- **Plano ANUAL**: R$ 299,00/ano (15% de desconto, destaque visual)
- Pagamento via **PIX**: modal com QR code + código copia-e-cola, polling automático a cada 4 s para detectar confirmação
- Pagamento via **Cartão**: redirect para checkout hospedado do Mercado Pago, retorno a `/pagamentos/sucesso`
- Garantia de 7 dias exibida na página

### 3.6 Autenticação

- Login unificado (email/senha) na página `/login`
- Cadastro com validação de e-mail único, CRECI obrigatório para corretores
- Preenchimento automático de endereço via CEP → ViaCEP
- Seleção de estado/cidade integrada à API do IBGE
- Recuperação de senha via e-mail com token temporário
- Token JWT armazenado no `localStorage`, expiração de 1 hora

---

## 4. Modelo de Monetização

### Planos

| Recurso | GRATUITO | PRO |
|---|:---:|:---:|
| Vitrine pública | ✓ | ✓ |
| Contato com proprietário | ✓ | ✓ |
| Cadastrar imóveis | — | ✓ |
| Gerenciar leads | — | ✓ |
| Raio-X IA | — | ✓ |
| Dados técnicos rurais avançados | — | ✓ |
| Cotações CEPEA/B3 | — | ✓ |
| Portal de notícias (leitura) | ✓ | ✓ |
| Gestão de notícias (ADMIN) | — | ADMIN |

### Fluxo de Pagamento PIX

```
1. Usuário clica em "Assinar PRO"
2. Frontend abre modal CheckoutPix
3. POST /pagamentos/pix { plano: "MENSAL" }
4. Backend gera payment via Mercado Pago PaymentClient
5. Response: { qr_code_base64, qr_code_copia_e_cola }
6. Frontend exibe QR code + botão copiar
7. Polling GET /usuarios/me a cada 4 s
8. Webhook MP → backend atualiza usuario.plano = 'PRO'
9. Polling detecta plano === 'PRO' → tela de sucesso
10. Funcionalidades PRO desbloqueadas imediatamente
```

### Fluxo de Pagamento Cartão (Recorrente)

```
1. POST /pagamentos/assinar { plano: "MENSAL"|"ANUAL" }
2. Backend cria PreapprovalClient (assinatura recorrente MP)
3. Response: { url } — link do checkout hospedado do MP
4. Frontend redireciona para url
5. Usuário autoriza no ambiente do Mercado Pago
6. MP envia webhook → backend atualiza plano
7. MP redireciona para /pagamentos/sucesso
```

### Gate de Acesso PRO (BlurLock)

O componente `BlurLock` sobrepõe qualquer página com glassmorphism quando `isPro === false`, exibindo um CTA para `/planos`. A página por trás fica renderizada com `blur-md` e `pointer-events-none`, garantindo que o conteúdo não seja acessível.

```
useAuth() → isPro = (plano === 'PRO') || (tipo === 'ADMIN')
```

---

## 5. Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Cliente)                        │
│   Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend CDN)                       │
│   SSG + Serverless Functions · ENV vars injetadas no build      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (REST/JSON)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              AZURE VM — IP 20.63.16.210:8080                    │
│   Spring Boot 4 · Spring Security (JWT) · Spring Data JPA      │
│   Embedded Tomcat · Swagger UI em /swagger-ui.html             │
└──────────────────────┬──────────────────────┬───────────────────┘
                       │ JDBC                  │ HTTPS (SDK/HTTP)
                       ▼                       ▼
             ┌─────────────────┐    ┌──────────────────────────┐
             │   PostgreSQL    │    │  APIs Externas           │
             │   (Banco RDS    │    │  ├─ Mercado Pago SDK     │
             │    ou VM local) │    │  ├─ Cloudinary API       │
             └─────────────────┘    │  ├─ IBGE REST API        │
                                    │  ├─ ViaCEP API           │
                                    │  └─ JSoup (scraping)     │
                                    └──────────────────────────┘
```

### Princípios Arquiteturais

- **Stateless Backend** — JWT no header, sem sessão server-side
- **Public vs Protected** — endpoints públicos claramente separados no SecurityConfig
- **PRO Gate no Frontend** — BlurLock + `useAuth` impedem acesso visual; backend valida token em cada chamada protegida
- **Dual-write de imagens** — Cloudinary armazena as imagens; banco armazena apenas URLs
- **Soft delete de vendas** — `vendido=true, ativo=false` preserva histórico sem apagar dados

---

## 6. Frontend — Next.js

### Stack Técnica

| Tecnologia | Versão | Papel |
|---|---|---|
| Next.js | 16.2.4 | Framework React com App Router |
| React | 19.2.4 | UI declarativa |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 4.x (PostCSS) | Estilização utilitária |
| Lucide React | — | Ícones |
| TipTap | 3.23.4 | Editor rich-text (notícias + descrição) |
| Next Cloudinary | 6.17.5 | Upload de imagens (CldUploadWidget) |
| Swiper | 12.1.4 | Slider de hero/notícias |
| Framer Motion | 12.38.0 | Animações de UI |
| Headless UI | — | Popover, Menu, Transition |

### Variáveis de Ambiente

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://20.63.16.210:8080     # Backend Spring Boot
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dgfqng2nl      # Cloud Cloudinary
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxxx     # Chave pública MP (sandbox)
```

> Todas as variáveis são prefixadas com `NEXT_PUBLIC_`, expostas ao browser. Nunca colocar segredos nelas.

### Estrutura de Rotas

```
app/
├── page.tsx                    → / (Home pública)
├── login/page.tsx              → /login
├── planos/page.tsx             → /planos
├── conta/page.tsx              → /conta (perfil do usuário logado)
├── pagamentos/sucesso/page.tsx → /pagamentos/sucesso
├── imovel/[id]/page.tsx        → /imovel/:id (detalhe público)
├── noticias/page.tsx           → /noticias (portal público)
├── noticia/[id]/page.tsx       → /noticia/:id (artigo individual)
└── admin/
    ├── layout.tsx              → Guard de autenticação + sidebar
    ├── page.tsx                → /admin (dashboard)
    ├── imoveis/
    │   ├── page.tsx            → /admin/imoveis (lista)
    │   ├── novo/page.tsx       → /admin/imoveis/novo
    │   └── editar/[id]/page.tsx→ /admin/imoveis/editar/:id
    ├── leads/page.tsx          → /admin/leads
    ├── noticias/
    │   ├── page.tsx            → /admin/noticias (lista)
    │   ├── nova/page.tsx       → /admin/noticias/nova
    │   └── editar/[id]/page.tsx→ /admin/noticias/editar/:id
    └── conta/page.tsx          → /admin/conta
```

> **Nota:** Todas as páginas usam `"use client"` — não há Server Components com fetching no servidor atualmente.

### Componentes Compartilhados

| Componente | Localização | Descrição |
|---|---|---|
| `HeaderPublico` | `app/components/` | Navbar pública com autenticação e filtros de categoria |
| `BlurLock` | `app/components/` | Gate visual de acesso PRO com overlay glassmorphism |
| `FormularioImovel` | `app/components/` | Formulário unificado de criação/edição de imóveis |
| `CheckoutPix` | `app/components/` | Modal de pagamento PIX com polling de confirmação |
| `WidgetMercado` | `app/components/` | Widget de estatísticas de mercado calculadas no cliente |
| `BannerStatusPagamento` | `app/components/` | Banner de status de pagamento |
| `EditorNoticias` | `app/components/` | Wrapper do TipTap com toolbar e upload de imagens |

### Hook de Autenticação

**`lib/hooks/useAuth.ts`**

```typescript
// Retorna:
{
  user: UsuarioDTO | null,
  loading: boolean,
  isPro: boolean  // plano === 'PRO' || tipo === 'ADMIN'
}

// Fluxo:
// 1. Lê token do localStorage
// 2. GET /usuarios/me com Bearer token
// 3. 200 → seta user, atualiza cache localStorage
// 4. 401/403 → limpa token, user = null
// 5. Erro de rede → usa cache localStorage (offline resilience)
```

### Design System

**Paleta de Cores**

| Token | Hex | Uso |
|---|---|---|
| Background primário | `#09090f` | Fundo geral das páginas |
| Background secundário | `#12121e` | Cards, tabelas, painéis |
| Verde primário | `#22c55e` (green-500) | CTAs, badges ativos, destaques |
| Verde escuro | `#15803d` (green-700) | Hover states |
| Cyan | `#0e7490` (cyan-700) | Categoria Aviação, Economia |
| Roxo | `#a855f7` (purple-400) | Raio-X IA, elementos AI |
| Âmbar | `#f59e0b` (amber-500) | Histórico de vendas, gamificação |
| Texto primário | `#ffffff` | Títulos, valores |
| Texto secundário | `#9ca3af` (gray-400) | Labels, metadados |
| Borda | `rgba(255,255,255,0.1)` | Separadores e contornos de card |

**Tipografia:** Geist Sans (corpo) + Geist Mono (código/fórmulas)

**Padrões de UI**
- Bordas arredondadas: `rounded-xl` (12px) e `rounded-2xl` (16px) para cards
- Glassmorphism: `backdrop-blur-md` + `bg-white/5` nos overlays
- Animações de entrada: `animate-in zoom-in-95 duration-300`
- Glow effects: `shadow-[0_0_80px_rgba(168,85,247,0.15)]` nos modais

---

## 7. Backend — Spring Boot

### Stack Técnica

| Tecnologia | Versão | Papel |
|---|---|---|
| Java | 17 | Linguagem principal |
| Spring Boot | 4.0.5 | Framework principal |
| Spring Security | — | Autenticação e autorização |
| Spring Data JPA | — | ORM e repositórios |
| Hibernate | — | Implementação JPA |
| PostgreSQL Driver | — | Conexão ao banco |
| Lombok | — | Redução de boilerplate |
| Auth0 Java JWT | 4.4.0 | Geração e validação de tokens |
| Mercado Pago SDK | 2.1.23 | Pagamentos PIX e assinatura |
| JSoup | 1.17.2 | Scraping/parsing HTML |
| Spring Boot Mail | — | Envio de e-mails |
| SpringDoc OpenAPI | 2.5.0 | Swagger UI automático |

### Estrutura de Pacotes

```
com.urbanoconnect.api/
├── controller/          → REST Controllers (endpoints)
├── domain/
│   ├── entity/          → Entidades JPA (@Entity)
│   ├── dto/             → Data Transfer Objects (Records)
│   └── enums/           → TipoUsuario, TipoImovel, CategoriaNoticia
├── repository/          → Interfaces Spring Data JPA
├── service/             → Lógica de negócio
│   ├── TokenService     → Geração/validação JWT
│   ├── PagamentoService → Integração Mercado Pago
│   ├── EmailService     → Envio de e-mails SMTP
│   └── CotacaoAgroService → Atualização de cotações
├── infra/
│   ├── security/        → SecurityConfigurations, SecurityFilter
│   └── exception/       → Handlers de erro global
└── UrbanoConnectApplication.java
```

### Configuração de Segurança

```
CORS: Habilitado (origens do frontend)
CSRF: Desabilitado (API stateless + webhooks externos)
Sessão: STATELESS

Regras de autorização (por prioridade):
OPTIONS /*                         → PERMIT_ALL (preflight CORS)
POST   /leads                      → PERMIT_ALL (formulário público)
POST   /webhooks/mercadopago/**    → PERMIT_ALL (callback servidor→servidor)
POST   /login                      → PERMIT_ALL
POST   /usuarios/registrar         → PERMIT_ALL
GET    /imoveis/**                  → PERMIT_ALL (vitrine pública)
GET    /cotacoes                   → PERMIT_ALL
GET    /noticias/**                 → PERMIT_ALL
POST   /pagamentos/**              → AUTHENTICATED
GET    /usuarios/me                → AUTHENTICATED
*                                  → AUTHENTICATED
```

### Agendamento (Scheduler)

| Job | Cron | Fuso | Descrição |
|---|---|---|---|
| Atualização de cotações | `0 0 8,12,18 * * MON-FRI` | America/Sao_Paulo | Regrava cotações CEPEA/B3 3×/dia útil |

---

## 8. Banco de Dados

### Diagrama de Entidades (ERD simplificado)

```
┌──────────────┐       ┌──────────────────┐       ┌────────────────────┐
│   usuarios   │       │     imoveis      │       │ imoveis_rural_dados│
├──────────────┤       ├──────────────────┤       ├────────────────────┤
│ id (PK)      │──┐    │ id (PK)          │──┐    │ id (PK)            │
│ nome         │  │    │ titulo           │  └──→ │ imovel_id (FK, UQ) │
│ email        │  │    │ cidade           │       │ tipo_solo          │
│ senha        │  └──→ │ corretor_id (FK) │       │ area_util          │
│ cpf          │       │ tipo             │       │ produtividade_soja  │
│ telefone     │       │ preco            │       │ distancia_rodovia   │
│ plano        │       │ area_total       │       │ car, ccir, itr     │
│ tipo         │       │ score_oportunid. │       │ ... (30+ campos)   │
│ creci        │       │ preco_estimado   │       └────────────────────┘
│ assinatura.. │       │ vendido          │
└──────────────┘       │ ativo            │       ┌──────────────┐
                       └──────────────────┘       │    leads     │
                              │                   ├──────────────┤
                              └─────────────────→ │ id (PK)      │
                                                  │ nome         │
┌──────────────────────┐                          │ email        │
│   cotacoes_agro      │                          │ telefone     │
├──────────────────────┤                          │ mensagem     │
│ id (PK)              │                          │ imovel_id(FK)│
│ produto              │                          │ data_criacao │
│ valor                │                          └──────────────┘
│ variacao             │
│ data_atualizacao     │      ┌────────────────────────────┐
└──────────────────────┘      │  tokens_recuperacao_senha  │
                              ├────────────────────────────┤
┌──────────────┐              │ id (PK)                    │
│   noticias   │              │ token (unique)             │
├──────────────┤              │ usuario_id (FK)            │
│ id (PK)      │              │ data_expiracao             │
│ titulo       │              │ usado (Boolean)            │
│ resumo       │              └────────────────────────────┘
│ conteudo     │
│ imagem_capa  │
│ categoria    │
│ publicado    │
│ destaque     │
│ autor        │
│ data_pub.    │
└──────────────┘
```

### Tabela: `usuarios`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | BIGINT PK | Auto-incremento |
| `nome` | VARCHAR | Nome completo |
| `email` | VARCHAR UNIQUE | Login e identificação |
| `senha` | VARCHAR | BCrypt hash |
| `cpf` | VARCHAR | Formatado: `###.###.###-##` |
| `data_nascimento` | DATE | |
| `telefone` | VARCHAR | Formatado: `(##) #####-####` |
| `cep` | VARCHAR(8) | Sem traço |
| `rua`, `numero`, `complemento` | VARCHAR | Endereço completo |
| `bairro`, `cidade`, `uf` | VARCHAR | Localização |
| `creci` | VARCHAR NULLABLE | Obrigatório para CORRETOR |
| `plano` | VARCHAR | `GRATUITO`, `PRO` |
| `assinatura_mp_id` | VARCHAR NULLABLE | ID da assinatura no MP |
| `status_assinatura` | VARCHAR | `authorized`, `pending`, `cancelled` |
| `tipo` | ENUM | `USUARIO`, `CORRETOR`, `ADMIN` |

### Tabela: `imoveis`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | BIGINT PK | |
| `titulo` | VARCHAR | |
| `cidade`, `bairro` | VARCHAR | |
| `tipo` | ENUM | `CASA`, `APARTAMENTO`, `TERRENO`, `COMERCIAL`, `RURAL`, `URBANO` |
| `preco` | DECIMAL | |
| `area_total` | DOUBLE | m² ou ha |
| `quartos`, `banheiros`, `vagas_garagem` | INTEGER | |
| `descricao` | TEXT | HTML do TipTap |
| `imagem_principal` | VARCHAR | URL Cloudinary |
| `galeria` | JSON ARRAY | Lista de URLs |
| `detalhes` | JSONB | Mapa chave-valor extra |
| `ativo` | BOOLEAN | Default `true` |
| `vendido` | BOOLEAN | Default `false` |
| `valor_venal` | DECIMAL | Base IPTU (input hedônico) |
| `distancia_centro` | DOUBLE | km |
| `preco_m2_bairro` | DOUBLE | R$/m² de referência |
| `padrao_acabamento` | INTEGER | 0–3 |
| `sprawl` | DOUBLE | 0.0–3.0 |
| `preco_estimado` | DECIMAL | Output do modelo |
| `score_oportunidade` | DOUBLE | `preco / preco_estimado` |
| `corretor_id` | BIGINT FK | Referência ao corretor |

### Tabela: `imoveis_rural_dados`

Campos agrupados por categoria:

| Grupo | Campos |
|---|---|
| Solo | `tipo_solo`, `percentual_argila`, `fertilidade_solo`, `nivel_nutrientes`, `necessidade_correcao_solo` |
| Uso da Terra | `area_util`, `area_reserva_legal`, `area_app`, `area_degradada`, `uso_atual`, `uso_potencial`, `cobertura_vegetal`, `estado_conservacao` |
| Produtividade | `produtividade_soja`, `produtividade_milho`, `produtividade_pastagem`, `aptidao_agricola`, `aptidao_pecuaria` |
| Água | `disponibilidade_agua`, `tipo_fonte_agua`, `volume_agua`, `perenidade_agua`, `irrigacao` |
| Logística | `distancia_rodovia`, `distancia_porto`, `distancia_centro_consumidor`, `qualidade_acesso` |
| Infraestrutura | `sede`, `energia_eletrica`, `mecanizacao_viavel`, `casa_funcionarios`, `curral`, `galpao` |
| Documentação | `matricula_regular`, `georreferenciamento`, `car`, `ccir`, `itr_regular`, `existencia_onus` |

---

## 9. Referência de API

Base URL: `http://20.63.16.210:8080`  
Swagger UI: `http://20.63.16.210:8080/swagger-ui.html`

### Autenticação

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `POST` | `/login` | — | Login com email/senha → `{ token, tipo, cidade }` |
| `POST` | `/usuarios/registrar` | — | Cadastro de novo usuário |

### Usuários

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `GET` | `/usuarios/me` | Bearer | Perfil do usuário logado |
| `PUT` | `/usuarios/me` | Bearer | Atualizar nome, telefone |
| `PUT` | `/usuarios/me/senha` | Bearer | Alterar senha |

### Imóveis

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `GET` | `/imoveis` | — | Lista pública; aceita `?cidade=` e `?tipo=` |
| `GET` | `/imoveis/{id}` | — | Detalhe de um imóvel |
| `POST` | `/imoveis` | Bearer | Cria imóvel (auto-atribui ao corretor logado) |
| `PUT` | `/imoveis/{id}` | Bearer | Atualiza imóvel |
| `DELETE` | `/imoveis/{id}` | Bearer | Exclui imóvel permanentemente |
| `PATCH` | `/imoveis/{id}/vender` | Bearer | Soft-delete: marca como vendido |
| `PATCH` | `/imoveis/{id}/reativar` | Bearer | Reverte venda, reativa imóvel |

### Leads

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `POST` | `/leads` | — | Criar lead (formulário público de contato) |
| `GET` | `/leads` | Bearer | Leads do corretor logado |
| `DELETE` | `/leads/{id}` | Bearer | Excluir lead |

### Pagamentos

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `POST` | `/pagamentos/assinar` | Bearer | Assinatura recorrente → `{ url }` |
| `POST` | `/pagamentos/pix` | Bearer | PIX avulso → `{ qr_code_base64, qr_code_copia_e_cola }` |
| `POST` | `/webhooks/mercadopago/**` | — | Callback do Mercado Pago (server-to-server) |

### Cotações

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `GET` | `/cotacoes` | — | Lista de commodities com valor e variação |

### Notícias

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `GET` | `/noticias` | — | Lista publicadas; aceita `?categoria=` |
| `GET` | `/noticias/destaque` | — | Notícias marcadas como destaque |
| `GET` | `/noticias/{id}` | — | Artigo individual |
| `POST` | `/noticias` | Bearer (ADMIN) | Criar artigo |
| `PUT` | `/noticias/{id}` | Bearer (ADMIN) | Editar artigo |
| `DELETE` | `/noticias/{id}` | Bearer (ADMIN) | Excluir artigo |

### Precificação IA

| Método | Rota | Auth | Descrição |
|---|---|:---:|---|
| `POST` | `/precificacao/calcular` | Bearer | Calcula preço estimado e score de oportunidade |

### Exemplos de Request/Response

**Login**
```http
POST /login
Content-Type: application/json

{
  "email": "corretor@example.com",
  "senha": "senha123"
}

→ 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tipo": "CORRETOR",
  "cidade": "Sinop"
}
```

**Criar Imóvel**
```http
POST /imoveis
Authorization: Bearer {token}
Content-Type: application/json

{
  "titulo": "Fazenda Alto Araguaia – 500 ha",
  "cidade": "Lucas do Rio Verde",
  "bairro": "Zona Rural",
  "tipo": "RURAL",
  "preco": 4500000.00,
  "areaTotal": 500.0,
  "descricao": "<p>Fazenda com certificação ambiental...</p>",
  "imagemPrincipal": "https://res.cloudinary.com/dgfqng2nl/image/upload/v1/...",
  "galeria": ["https://...", "https://..."],
  "valorVenal": 3800000.00,
  "distanciaCentro": 25.0,
  "precoM2Bairro": 9000.0
}

→ 200 OK
{ "id": 42 }
```

**Gerar PIX**
```http
POST /pagamentos/pix
Authorization: Bearer {token}
Content-Type: application/json

{ "plano": "ANUAL" }

→ 200 OK
{
  "qr_code_base64": "data:image/png;base64,iVBOR...",
  "qr_code_copia_e_cola": "00020126580014br.gov.bcb.pix...",
  "payment_id": 89123456789
}
```

---

## 10. Autenticação e Autorização

### JWT — Estrutura do Token

```json
{
  "iss": "API UrbanoConnect",
  "sub": "corretor@example.com",
  "tipo": "CORRETOR",
  "exp": 1716843600
}
```

- **Algoritmo**: HMAC256
- **Chave**: variável de ambiente `api.security.token.secret`
- **Expiração**: 1 hora a partir da emissão (fuso: `America/Sao_Paulo`)
- **Storage**: `localStorage` no browser com chave `"token"`

### Fluxo de Autenticação

```
1. POST /login → recebe { token, tipo, cidade }
2. localStorage.setItem("token", token)
3. localStorage.setItem("tipoUsuario", tipo)
4. localStorage.setItem("cidadeUsuario", cidade)
5. Redirect: USUARIO → /  |  CORRETOR/ADMIN → /admin
---
Todas as chamadas protegidas:
6. headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
---
Ao expirar/invalidar:
7. Backend retorna 401
8. Frontend limpa localStorage e redireciona para /login
```

### Guard de Rota Admin

`app/admin/layout.tsx` verifica `localStorage.getItem("token")` no mount. Se ausente, redireciona imediatamente para `/login`. Essa verificação acontece no cliente (`"use client"`)  — não há proteção server-side via middleware de rotas no momento.

### Decode do Token no Frontend

```typescript
const payload = JSON.parse(atob(token.split('.')[1]));
// payload.tipo: "USUARIO" | "CORRETOR" | "ADMIN"
const isCorretor = payload.tipo.includes('ADMIN') || payload.tipo.includes('CORRETOR');
```

---

## 11. Motor de Precificação com IA

### Modelo Econométrico

O Urbano Connect utiliza **regressão hedônica logarítmica** — metodologia acadêmica aplicada a avaliação imobiliária — calibrada com coeficientes ajustados para o mercado de Mato Grosso.

**Fórmula:**

```
ln(P) = β₀
      + β₁ · ln(area)
      + β₂ · quartos
      + β₃ · banheiros
      + β₄ · padraoAcabamento
      + β₅ · ln(valorVenal)
      + β₆ · distanciaCentro
      + β₇ · sprawl
      + β₈ · (precoM2Bairro / 1000)

P = e^ln(P)   →   Preço Estimado em R$
```

**Coeficientes (calibrados para MT):**

| Parâmetro | Coeficiente | Interpretação |
|---|---|---|
| β₀ (intercepto) | 7.65 | Ajuste base regional |
| β₁ ln(área) | 0.55 | Elasticidade área–preço |
| β₂ quartos | 0.08 | Impacto moderado de dormitórios |
| β₃ banheiros | 0.12 | Maior impacto que quartos |
| β₄ padrão acabamento | 0.15 | Qualidade percebida (0–3) |
| β₅ ln(valor venal) | 0.10 | Âncora fiscal (peso reduzido) |
| β₆ distância ao centro | -0.08 | Penalidade por km do CBD |
| β₇ sprawl | 0.12 | Bônus de expansão urbana |
| β₈ preço/m² bairro | 0.45 | **Sinal de mercado primário** |

### Inputs do Formulário

**Padrão de Acabamento (0–3):**
- `0` — Básico/Rústico
- `1` — Normal/Médio  
- `2` — Bem acabado
- `3` — Luxuoso/Alto padrão

**Sprawl Urbano (0.0–3.0):**
- `0.0` — Centro histórico, zona consolidada
- `1.5` — Intermediário, em expansão moderada
- `3.0` — Periférico, recém-ocupado, alta valorização esperada

**Valores Padrão (quando não informados):**

| Campo | Default |
|---|---|
| Valor venal | R$ 150.000 |
| Distância ao centro | 5 km |
| Preço/m² do bairro | R$ 3.200 |
| Quartos | 2 |
| Banheiros | 1 |

### Outputs e Interpretação

| Output | Fórmula | Descrição |
|---|---|---|
| `precoEstimado` | Modelo | Valor justo calculado |
| `scoreOportunidade` | `precoReal / precoEstimado` | Índice de barganha |
| `faixaMin` | `precoEstimado × 0.92` | Limite inferior de negociação |
| `faixaMax` | `precoEstimado × 1.08` | Limite superior de negociação |

**Classificação do Score:**

| Score | Classificação | Badge |
|---|---|---|
| ≤ 0.80 | Excelente Compra | "Oportunidade" (verde) |
| 0.81–0.95 | Boa Oportunidade | (azul) |
| 0.96–1.10 | Preço de Mercado | (laranja) |
| > 1.10 | Acima do Mercado | (vermelho) |

### Diagnóstico Rural vs. Urbano

**Imóveis Rurais (`tipo === 'RURAL'`):**
- **Índice Logístico**: distância de rodovias pavimentadas (BR-163/MT-130) e silos — indicador de custo de escoamento da produção
- **Vocação Produtiva**: classificação baseada em topografia, % argila e histórico de safra (aptidão agrícola/pecuária 1–5)

**Imóveis Urbanos:**
- **Índice de Sprawl**: mede expansão imobiliária no entorno — zonas com sprawl alto têm maior expectativa de valorização futura
- **Padrão de Acabamento**: classificação por materiais, projeto arquitetônico e infraestrutura disponível

---

## 12. Integrações Externas

### Cloudinary — Gestão de Imagens

- **Cloud name**: `dgfqng2nl`
- **Componente**: `CldUploadWidget` do pacote `next-cloudinary`
- **Upload preset**: `imoveis_preset` (unsigned, configurado na dashboard Cloudinary)
- **Retorno**: URL pública CDN da imagem processada
- **Uso**: imagem principal e galeria de imóveis; imagem de capa e inline de notícias

```tsx
<CldUploadWidget
  uploadPreset="imoveis_preset"
  onSuccess={(result) => setImagemPrincipal(result.info.secure_url)}
>
```

### Mercado Pago — Pagamentos

- **SDK**: `com.mercadopago:sdk-java:2.1.23`
- **Ambiente**: Sandbox (TEST) no desenvolvimento, produção para deploy
- **Flows implementados**:
  - `PreapprovalClient` — assinatura recorrente (cartão)
  - `PaymentClient` — pagamento avulso PIX
- **Webhook**: `POST /webhooks/mercadopago/**` — atualiza `usuario.plano` no banco ao confirmar pagamento
- **Redirect pós-pagamento**: `/pagamentos/sucesso`

### IBGE — Geolocalização Administrativa

- **Base URL**: `https://servicodados.ibge.gov.br/api/v1/localidades`
- **Endpoints usados**:
  - `GET /estados?orderBy=nome` — lista todos os estados do Brasil
  - `GET /estados/{UF}/municipios?orderBy=nome` — municípios de um estado
- **Uso**: Seletor de estado/cidade no formulário de cadastro

### ViaCEP — Autopreenchimento de Endereço

- **Base URL**: `https://viacep.com.br/ws`
- **Endpoint**: `GET /{cep}/json/`
- **Trigger**: quando o campo CEP atinge 8 dígitos
- **Preenchimento automático**: rua (logradouro), bairro, cidade (localidade), UF
- **Pós-lookup**: foco automático no campo "Número"

### CEPEA/B3 — Cotações de Commodities

- **Método**: scraping via JSoup (HTML parsing)
- **Produtos monitorados**: Soja (saca 60kg), Boi Gordo (@), Milho (saca 60kg), Algodão (lp)
- **Frequência**: 3× por dia útil (8h, 12h, 18h — horário de Brasília)
- **Armazenamento**: tabela `cotacoes_agro` no PostgreSQL
- **Exposição**: `GET /cotacoes` (público)

### Spring Mail — E-mail Transacional

- **Protocolo**: SMTP com STARTTLS
- **Usos**:
  - Recuperação de senha (token temporário)
  - Confirmação de conta
  - Recibos de pagamento PRO
- **Configuração**: `spring.mail.*` em `application.properties`

---

## 13. Implantação (Deploy)

### Frontend — Vercel

```bash
# Build
npm run build

# Variáveis de ambiente no painel Vercel:
NEXT_PUBLIC_API_URL=https://api.urbanoconnect.com  # (ou IP do backend)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dgfqng2nl
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxx    # chave pública de produção
```

- Deploys automáticos no push para `main`
- Preview deployments para branches de feature
- CDN edge global com cache de assets estáticos

### Backend — Azure VM

```bash
# Gerar JAR
./mvnw clean package -DskipTests

# Executar
java -jar target/urbano-connect-api-*.jar \
  --spring.profiles.active=prod

# Verificar
curl http://20.63.16.210:8080/cotacoes
```

**Variáveis de ambiente do servidor:**

```properties
# application-prod.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/urbanoconnect
spring.datasource.username=postgres
spring.datasource.password=SUA_SENHA_SEGURA
spring.jpa.hibernate.ddl-auto=update

api.security.token.secret=JWT_SECRET_LONGO_E_ALEATÓRIO
mercado.pago.token=APP_USR-xxxx-xxxx  # token de produção MP

spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=noreply@urbanoconnect.com
spring.mail.password=SENHA_APP_GMAIL

api.frontend.url=https://www.urbanoconnect.com
```

### Fluxo de Deploy Recomendado

```
1. Develop em branch feature/xxx
2. PR para main → revisão
3. Merge → Vercel deploya frontend automaticamente
4. SSH na VM Azure → git pull + mvnw clean package
5. Restart do processo Java (systemd ou pm2)
6. Verificar /swagger-ui.html e /cotacoes
```

---

## 14. Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js 20+
- Java 17+
- Maven 3.8+
- PostgreSQL 15+
- Git

### Frontend

```bash
# 1. Clonar
git clone https://github.com/seu-usuario/urbano-connect-web
cd urbano-connect-web

# 2. Instalar dependências
npm install

# 3. Configurar variáveis
cp .env.example .env.local
# Editar .env.local com seus valores

# 4. Rodar em desenvolvimento
npm run dev
# → http://localhost:3000

# Outros comandos
npm run build    # build de produção
npm run lint     # ESLint
```

### Backend

```bash
# 1. Clonar
git clone https://github.com/seu-usuario/urbano-connect-api
cd urbano-connect-api

# 2. Criar banco
psql -U postgres -c "CREATE DATABASE urbanoconnect;"

# 3. Configurar properties
# Criar: src/main/resources/application-dev.properties
# com datasource, JWT secret, MP token e mail config

# 4. Rodar com DevTools (hot reload)
./mvnw spring-boot:run

# → http://localhost:8080
# → Swagger: http://localhost:8080/swagger-ui.html

# Outros comandos
./mvnw test                              # todos os testes
./mvnw -Dtest=NomeDaClasse test          # teste específico
./mvnw clean package                     # gerar JAR
```

### Configuração do .env.local (Frontend Dev)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dgfqng2nl
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-sua-chave-publica
```

### Configuração do application-dev.properties (Backend Dev)

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/urbanoconnect
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

api.security.token.secret=desenvolvimento-secret-string-qualquer-32chars
mercado.pago.token=TEST-seu-token-sandbox

spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=seu@gmail.com
spring.mail.password=app-password-gmail

api.frontend.url=http://localhost:3000
```

---

## 15. Roadmap e Melhorias Futuras

### Prioridade Alta (próximas sprints)

| Item | Impacto | Esforço |
|---|---|---|
| Middleware de rota Next.js (auth server-side) | Segurança | Médio |
| Notificação por e-mail ao corretor em novo lead | Conversão | Baixo |
| SEO: migrar listagem pública para Server Components | Aquisição | Alto |
| Testes automatizados (Jest + Playwright) | Qualidade | Alto |
| Monitoramento de erros (Sentry) | Operação | Baixo |

### Prioridade Média

| Item | Descrição |
|---|---|
| Mapa de imóveis | Integração Mapbox ou Google Maps com pins dos imóveis |
| Dashboard analítico | Gráfico de leads ao longo do tempo, taxa de conversão por imóvel |
| Auto-cancelamento de assinatura | Self-service no painel do corretor |
| Histórico de faturamento | Lista de pagamentos e notas fiscais |
| Modo escuro / claro | Toggle (hoje sempre escuro) |
| Comparador de imóveis | Selecionar 2–3 imóveis e comparar atributos lado a lado |

### Prioridade Baixa / Visão de Longo Prazo

| Item | Descrição |
|---|---|
| App mobile (React Native) | Push notifications de novos leads |
| Chat integrado | Comunicação corretor↔comprador dentro da plataforma |
| API pública | Parceiros e integrações com outros sistemas imobiliários |
| Índice de valorização regional | Gráficos históricos de preço/m² por cidade/bairro |
| Moderação de conteúdo | Aprovação admin antes de publicar imóveis |
| Múltiplos corretores por empresa | Suporte a imobiliárias com equipe |

---

## Suporte e Contatos

| Responsabilidade | Contato |
|---|---|
| Desenvolvimento | pedrokoberstain2@gmail.com |
| Pagamentos (Mercado Pago) | dashboard.mercadopago.com.br |
| Imagens (Cloudinary) | cloudinary.com/console |
| Infraestrutura (Azure VM) | portal.azure.com |
| DNS / Domínio | Provedor de domínio configurado |

---

*Urbano Connect · Inteligência Imobiliária para o Mato Grosso*  
*Documentação gerada em Maio 2026 · Stack: Next.js 16 + Spring Boot 4*
