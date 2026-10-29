/**
 * Importador de artigos HOME4 → Urbano Connect API
 * Execução: node importar-noticias.js
 *
 * Requer: API rodando + credenciais de admin abaixo
 */

const fs   = require('fs');
const path = require('path');
const cheerio = require('./node_modules/cheerio');

// ── CONFIG ──────────────────────────────────────────────────────────
const API_URL   = 'http://localhost:8080';
const EMAIL     = '';  // email do admin
const SENHA     = '';  // senha do admin
const HOME4_DIR = path.join(__dirname, 'modelos andre', 'HOME4');
// ────────────────────────────────────────────────────────────────────

// Mapeamento dos artigos com metadados já definidos
const ARTIGOS = [
  // ── SÉRIE BR-163 ───────────────────────────────────────────────
  {
    file: 'br163_000_preambulo.html',
    titulo: 'BR-163 — A Rodovia que Criou Cidades',
    categoria: 'CIDADES',
    autor: 'Urbano Connect',
    destaque: true,
    cidade: null,
  },
  {
    file: 'br163_001_tracado.html',
    titulo: 'De Cuiabá a Sinop: O Traçado do Poder — Série BR-163, Cap. 1',
    categoria: 'CIDADES',
    autor: 'Urbano Connect',
    destaque: false,
    cidade: null,
  },
  {
    file: 'br163_002_solo.html',
    titulo: 'O Solo Vale o Asfalto — Série BR-163, Cap. 2',
    categoria: 'CIDADES',
    autor: 'Urbano Connect',
    destaque: false,
    cidade: null,
  },
  {
    file: 'br163_003_logistica.html',
    titulo: 'Logística e Agro: A Veia do Cerrado — Série BR-163, Cap. 3',
    categoria: 'CIDADES',
    autor: 'Urbano Connect',
    destaque: false,
    cidade: null,
  },
  {
    file: 'br163_004_cidades.html',
    titulo: 'As Cidades que a Rodovia Pariu — Série BR-163, Cap. 4',
    categoria: 'CIDADES',
    autor: 'Urbano Connect',
    destaque: false,
    cidade: null,
  },
  {
    file: 'br163_005_futuro.html',
    titulo: 'O Futuro da BR-163 — Série BR-163, Cap. 5',
    categoria: 'CIDADES',
    autor: 'Urbano Connect',
    destaque: false,
    cidade: null,
  },

  // ── AGRONEGÓCIO ────────────────────────────────────────────────
  {
    file: 'agro001K.html',
    titulo: 'Os 5 Estágios do Município Agro: Como Prever a Próxima Fronteira de Valorização',
    categoria: 'AGRONEGOCIO',
    autor: 'Urbano Connect',
    destaque: true,
    cidade: null,
  },
  {
    file: 'agro001P.html',
    titulo: '31,6 Milhões de Cabeças: Mato Grosso Reafirma a Liderança Absoluta no Agro Global',
    categoria: 'AGRONEGOCIO',
    autor: 'Urbano Connect',
    destaque: true,
    cidade: null,
  },
  {
    file: 'agro-picanha-mt.html',
    titulo: 'A Picanha de Excelência — O Padrão Mato Grosso para o Mundo',
    categoria: 'AGRONEGOCIO',
    autor: 'Urbano Connect',
    destaque: false,
    cidade: 'Tangará da Serra',
  },

  // ── FAZENDAS ───────────────────────────────────────────────────
  {
    file: 'farm001F.html',
    titulo: 'Fazenda como Ativo Financeiro — Patrimônio, não só Produção',
    categoria: 'FAZENDAS',
    autor: 'Urbano Connect',
    destaque: true,
    cidade: null,
  },

  // ── AVIAÇÃO ────────────────────────────────────────────────────
  {
    file: 'aero001K.html',
    titulo: 'Bom Futuro: O Aeroporto Privado que Redefiniu o Agro de Mato Grosso',
    categoria: 'AVIACAO',
    autor: 'Urbano Connect',
    destaque: false,
    cidade: null,
  },

  // ── INDÚSTRIA ──────────────────────────────────────────────────
  {
    file: 'ind001A.html',
    titulo: 'Ferrovias & Território — O Corredor Logístico que Vai Redesenhar Mato Grosso',
    categoria: 'INDUSTRIA',
    autor: 'Urbano Connect',
    destaque: true,
    cidade: null,
  },

  // ── ECONOMIA ───────────────────────────────────────────────────
  {
    file: 'econ001D.html',
    titulo: 'Bem-vindo ao Pregão do Mato Grosso — Ativos Reais num Mundo de Papel',
    categoria: 'ECONOMIA',
    autor: 'Urbano Connect',
    destaque: false,
    cidade: null,
  },
];

// ── Extrai conteúdo limpo do HTML ─────────────────────────────────
function extrairConteudo(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);

  // Remove scripts, styles, nav, header, footer
  $('script, style, nav, header, footer, noscript, svg, iframe').remove();
  $('[class*="menu"], [class*="nav"], [class*="ticker"], [class*="sidebar"]').remove();

  // Tenta extrair o bloco principal de conteúdo
  const seletores = ['main', 'article', '.conteudo', '.content', '.artigo', '#content', '.post'];
  let conteudo = '';
  for (const sel of seletores) {
    const el = $(sel);
    if (el.length && el.text().trim().length > 200) {
      conteudo = el.html();
      break;
    }
  }

  // Fallback: pega o body todo
  if (!conteudo) conteudo = $('body').html();

  // Limpa atributos desnecessários mas mantém estrutura HTML para renderização
  const $c = cheerio.load(conteudo || '');
  $c('*').removeAttr('style').removeAttr('class').removeAttr('id').removeAttr('onclick');
  $c('script, style').remove();

  const textoLimpo = $c.html()
    .replace(/<[^>]*>/g, ' ')   // strip tags para texto puro
    .replace(/\s+/g, ' ')
    .trim();

  // Pega primeiro parágrafo com texto real como resumo
  const paragrafos = textoLimpo.split(/\n|\.(?=\s+[A-Z])/).filter(p => p.trim().length > 60);
  const resumo = paragrafos.slice(0, 2).join('. ').substring(0, 400).trim() + '.';

  return { conteudo: textoLimpo, resumo };
}

// ── Login e obtenção do JWT ────────────────────────────────────────
async function login() {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, senha: SENHA }),
  });
  if (!res.ok) throw new Error(`Login falhou: ${res.status}`);
  const data = await res.json();
  return data.token;
}

// ── Envia notícia para a API ───────────────────────────────────────
async function criarNoticia(token, payload) {
  const res = await fetch(`${API_URL}/noticias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro ao criar notícia: ${res.status} — ${err}`);
  }
  return res.json();
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  if (!SENHA) {
    console.error('❌ Preencha a variável SENHA no topo do script antes de rodar.');
    process.exit(1);
  }

  console.log('🔐 Fazendo login...');
  const token = await login();
  console.log('✓ Autenticado\n');

  let ok = 0, erro = 0;

  for (const artigo of ARTIGOS) {
    const filePath = path.join(HOME4_DIR, artigo.file);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠  Arquivo não encontrado: ${artigo.file}`);
      erro++;
      continue;
    }

    try {
      const { conteudo, resumo } = extrairConteudo(filePath);

      const payload = {
        titulo:     artigo.titulo,
        resumo:     resumo.substring(0, 400),
        conteudo,
        imagemCapa: null,
        categoria:  artigo.categoria,
        publicado:  true,
        destaque:   artigo.destaque,
        autor:      artigo.autor,
        cidade:     artigo.cidade,
      };

      const criado = await criarNoticia(token, payload);
      console.log(`✓ [${artigo.categoria}] ${artigo.titulo} → ID ${criado.id}`);
      ok++;
    } catch (e) {
      console.error(`✗ ${artigo.titulo}: ${e.message}`);
      erro++;
    }
  }

  console.log(`\n📊 Resultado: ${ok} importados, ${erro} erros`);
}

main().catch(console.error);
