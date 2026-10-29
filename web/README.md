# 🎨 Urbano Connect Web

Interface de usuário (SPA) para a plataforma Urbano Connect, desenhada para conectar investidores e compradores aos mercados imobiliários Urbano e Rural de Mato Grosso.

## 🎯 O Propósito do Projeto
A interface não é apenas um catálogo de casas. O sistema foi desenhado para contextualizar o comprador sobre a economia local antes da conversão. 

O foco da aplicação é resolver três problemas do mercado regional:
1. **Vitrine Híbrida:** Apresentar propriedades urbanas e de agronegócio na mesma plataforma, com filtros rápidos e claros.
2. **Notícias e Valorização:** Uma seção dedicada a "Inteligência de Mercado", exibindo notícias de Mato Grosso (ex: novos financiamentos, valorização do m² em polos do agro) para ajudar investidores na tomada de decisão.
3. **Painel do Corretor:** Uma área restrita e segura onde o profissional pode gerenciar seus dados, atualizar credenciais e, futuramente, administrar os leads captados nas propriedades.

## 🛠️ Stack Tecnológica
* **Framework:** Next.js (App Router)
* **Biblioteca UI:** React 18
* **Estilização:** Tailwind CSS
* **Animações:** Framer Motion
* **Ícones:** Lucide React
* **Comunicação de Rede:** Fetch API nativa com injeção de tokens JWT.

## ⚙️ Arquitetura e Decisões de UI/UX
* **Gestão de Estado e Autenticação:** Uso nativo de `localStorage` para retenção de tokens JWT, protegendo as rotas de configurações do corretor.
* **Prevenção de Dados Obsoletos:** Implementação de chamadas assíncronas no `useEffect` para buscar os dados mais recentes da API (`GET /usuarios/me`) após atualizações de perfil, ignorando caches antigos do navegador.
* **Design Imersivo (Layered UI):** Substituição do tradicional fundo branco estático por uma composição fixada (`fixed inset-0`) contendo Noise Textures e Mesh Gradients (gradientes borrados). Isso mantém a profundidade visual constante durante o scroll em listas longas de imóveis.
* **Componentização:** Isolamento de componentes lógicos (ex: formulários de alteração de senha vs. alteração de perfil) com validação de força de senha no client-side antes do envio para a API.

## 🚀 Como Executar Localmente
1. Clone este repositório.
2. Certifique-se de que a API (back-end) esteja rodando na porta 8080.
3. Instale as dependências: `npm install`
4. Inicie o servidor: `npm run dev`
5. Acesse `http://localhost:3000`.
