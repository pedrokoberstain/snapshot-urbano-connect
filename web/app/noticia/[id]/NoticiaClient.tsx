"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import HeaderPublico from "../../components/HeaderPublico";
import {
  ArrowLeft,
  Calendar,
  User,
  Loader2,
  Clock,
  TrendingUp,
  BarChart2,
  BookOpen,
  Eye,
  Layers,
} from "lucide-react";

const CORES: Record<string, string> = {
  AGRONEGOCIO: "bg-green-600",
  AVIACAO:     "bg-cyan-700",
  ECONOMIA:    "bg-cyan-800",
  CIDADES:     "bg-slate-600",
  FAZENDAS:    "bg-green-700",
  INDUSTRIA:   "bg-slate-700",
};

const LABELS: Record<string, string> = {
  AGRONEGOCIO: "Agronegócio",
  AVIACAO:     "Aviação",
  ECONOMIA:    "Economia",
  CIDADES:     "Cidades",
  FAZENDAS:    "Fazendas",
  INDUSTRIA:   "Indústria",
};

const ICONES: Record<string, string> = {
  AGRONEGOCIO: "🌾",
  AVIACAO:     "✈️",
  ECONOMIA:    "📊",
  CIDADES:     "🏙️",
  FAZENDAS:    "🚜",
  INDUSTRIA:   "🏭",
};

const MERCADO_MT = [
  { lbl: "Sorriso / Lucas RV",  val: "R$ 48k/ha" },
  { lbl: "Primavera do Leste",  val: "R$ 44k/ha" },
  { lbl: "Sinop / N. Mutum",    val: "R$ 36k/ha" },
  { lbl: "Tangará da Serra",    val: "R$ 30k/ha" },
  { lbl: "Rondonópolis",        val: "R$ 34k/ha" },
  { lbl: "Alta Floresta",       val: "R$ 18k/ha" },
];

const DADOS_MERCADO = [
  { lbl: "Retorno real anual",  val: "+11,2%",    cor: "text-green-600" },
  { lbl: "Valoriz. 10 anos",    val: "+180%",     cor: "text-green-600" },
  { lbl: "Cap rate médio MT",   val: "3,5–6%/a.", cor: "text-orange-500" },
  { lbl: "Prazo médio venda",   val: "90–180d",   cor: "text-blue-600"  },
  { lbl: "vs Ibovespa",         val: "+7 p.p.",   cor: "text-green-600" },
];

function tempoLeitura(texto: string) {
  const limpo = (texto ?? "").replace(/<[^>]+>/g, " ");
  const palavras = limpo.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(palavras / 200))} min de leitura`;
}

// Renderiza o conteúdo da matéria (fragmento HTML limpo) com a tipografia do site.
function ArtigoConteudo({ html }: { html: string }) {
  return (
    <div
      className="artigo-publico text-gray-700 text-base"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function DetalheNoticia() {
  const { id }    = useParams();
  const router    = useRouter();

  const [noticia,    setNoticia]    = useState<any>(null);
  const [trending,   setTrending]   = useState<any[]>([]);
  const [todos,      setTodos]      = useState<any[]>([]);
  const [partesSerie, setPartesSerie] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState(false);
  const [pageUrl,    setPageUrl]    = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setPageUrl(window.location.href);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setNoticia(data))
      .catch(() => setErro(true))
      .finally(() => setCarregando(false));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias`)
      .then(r => r.json())
      .then(data => {
        const lista = Array.isArray(data) ? data : [];
        setTodos(lista);
        setTrending(lista.filter((n: any) => String(n.id) !== String(id)).slice(0, 6));
      })
      .catch(() => {});
  }, [id]);

  // Carrega as partes da série (se a notícia pertencer a uma)
  useEffect(() => {
    if (!noticia?.serieSlug) { setPartesSerie([]); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias/serie/${noticia.serieSlug}`)
      .then(r => r.json())
      .then(d => setPartesSerie(Array.isArray(d) ? d : []))
      .catch(() => setPartesSerie([]));
  }, [noticia?.serieSlug]);

  // Posição dentro da série + parte anterior/próxima
  const idxSerie     = partesSerie.findIndex(n => String(n.id) === String(id));
  const partePrev    = idxSerie > 0 ? partesSerie[idxSerie - 1] : null;
  const parteNext    = idxSerie !== -1 && idxSerie < partesSerie.length - 1 ? partesSerie[idxSerie + 1] : null;

  // prev / next derivados da lista completa (API retorna mais recentes primeiro)
  const idxAtual    = todos.findIndex(n => String(n.id) === String(id));
  const artMaisNovo = idxAtual > 0 ? todos[idxAtual - 1] : null;
  const artMaisAntigo = idxAtual !== -1 && idxAtual < todos.length - 1 ? todos[idxAtual + 1] : null;

  if (carregando) {
    return (
      <main className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </main>
    );
  }

  if (erro || !noticia) {
    return (
      <main className="min-h-screen bg-gray-50 font-sans">
        <HeaderPublico />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-gray-500 font-medium text-lg">Notícia não encontrada.</p>
          <button onClick={() => router.push("/noticias")} className="text-green-600 font-bold hover:text-green-700">
            ← Voltar para notícias
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8] font-sans">
      <HeaderPublico />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-green-600 transition-colors font-medium">Home</Link>
          <span className="text-gray-300">›</span>
          <Link href="/noticias" className="hover:text-green-600 transition-colors font-medium">Notícias</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 font-semibold line-clamp-1">{noticia.titulo}</span>
        </div>
      </div>

      {/* 3 colunas */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 flex gap-6 items-start">

        {/* ── SIDEBAR ESQUERDA ─────────────────────────────────────────────────── */}
        <aside className="hidden xl:flex flex-col gap-4 w-[220px] shrink-0">

          {/* Em Alta */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-green-600 px-4 py-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
              <h4 className="text-white text-[11px] font-black uppercase tracking-widest">Em Alta</h4>
            </div>
            <div className="p-3 flex flex-col">
              {trending.slice(0, 4).map((n, i) => (
                <Link
                  key={n.id}
                  href={`/noticia/${n.id}`}
                  className="flex gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0"
                >
                  <span className="text-2xl font-black text-gray-100 leading-none w-6 shrink-0 text-center tabular-nums">
                    {i + 1 < 10 ? `0${i + 1}` : i + 1}
                  </span>
                  <p className="text-[11px] font-bold text-gray-600 group-hover:text-green-600 transition-colors leading-snug line-clamp-3">
                    {n.titulo}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Categorias */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-t-4 border-orange-400 px-4 py-3 border-b border-gray-100">
              <h4 className="text-gray-700 text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-orange-400" /> Editorias
              </h4>
            </div>
            <div className="p-3 flex flex-col gap-0.5">
              {Object.entries(LABELS).map(([key, label]) => (
                <Link
                  key={key}
                  href={`/noticias?categoria=${key}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-600 text-[11px] font-bold hover:bg-green-50 hover:text-green-700 transition-colors"
                >
                  <span className="text-base">{ICONES[key]}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>

        </aside>

        {/* ── ARTIGO CENTRAL ───────────────────────────────────────────────────── */}
        <article className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Imagem de capa */}
            {noticia.imagemCapa && (
              <div className="relative w-full h-[360px] overflow-hidden bg-gray-900">
                <img
                  src={noticia.imagemCapa}
                  alt={noticia.titulo}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            )}

            <div className="p-6 md:p-10">

              {/* Selo de série */}
              {noticia.serie && (
                <Link
                  href={`/serie/${noticia.serieSlug}`}
                  className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest mb-3 mr-2 hover:bg-green-100 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Série · {noticia.serie}{noticia.parteNumero ? ` · Parte ${noticia.parteNumero}` : ""}
                </Link>
              )}

              {/* Tag da categoria */}
              <span className={`inline-block text-white text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest mb-5 ${CORES[noticia.categoria] ?? "bg-gray-600"}`}>
                {LABELS[noticia.categoria] ?? noticia.categoria}
              </span>

              {/* Título */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight mb-5">
                {noticia.titulo}
              </h1>

              {/* Resumo em destaque */}
              {noticia.resumo && (
                <p
                  className="text-base md:text-lg text-gray-600 font-medium leading-relaxed italic border-l-4 border-green-500 pl-5 mb-6"
                  dangerouslySetInnerHTML={{ __html: noticia.resumo }}
                />
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-5 text-xs text-gray-400 font-semibold pb-7 border-b border-gray-100 mb-8">
                {noticia.autor && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-green-500" />
                    {noticia.autor}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-green-500" />
                  {new Date(noticia.dataPublicacao).toLocaleDateString("pt-BR", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </span>
                {noticia.conteudo && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-green-500" />
                    {tempoLeitura(noticia.conteudo)}
                  </span>
                )}
                {noticia.acessos > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-green-500" />
                    {noticia.acessos.toLocaleString("pt-BR")} visualizaç{noticia.acessos === 1 ? "ão" : "ões"}
                  </span>
                )}
              </div>

              {/* Conteúdo do artigo */}
              <ArtigoConteudo html={noticia.conteudo ?? ""} />

              {/* Painel da série */}
              {noticia.serie && partesSerie.length > 1 && (
                <div className="mt-10 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-4 h-4 text-green-600" />
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Série · {noticia.serie}</h3>
                    <span className="text-xs text-gray-400 font-bold">{partesSerie.length} partes</span>
                  </div>
                  <ol className="flex flex-col gap-2">
                    {partesSerie.map((p, i) => {
                      const atual = String(p.id) === String(id);
                      return (
                        <li key={p.id}>
                          <Link
                            href={`/noticia/${p.id}`}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${atual ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-100 hover:bg-green-50 hover:border-green-200"}`}
                          >
                            <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black ${atual ? "bg-green-600 text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
                              {p.parteNumero ?? i + 1}
                            </span>
                            <p className={`text-sm font-bold line-clamp-1 ${atual ? "text-green-700" : "text-gray-700"}`}>{p.titulo}</p>
                            {atual && <span className="ml-auto text-[10px] font-black text-green-600 uppercase tracking-widest shrink-0">Você está aqui</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>

                  {(partePrev || parteNext) && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {partePrev ? (
                        <Link href={`/noticia/${partePrev.id}`} className="group flex flex-col gap-2 p-4 rounded-xl bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 transition-all">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <ArrowLeft className="w-3 h-3" /> Parte anterior
                          </span>
                          <p className="text-xs font-bold text-gray-700 group-hover:text-green-700 line-clamp-2 leading-snug transition-colors">{partePrev.titulo}</p>
                        </Link>
                      ) : <div />}
                      {parteNext ? (
                        <Link href={`/noticia/${parteNext.id}`} className="group flex flex-col gap-2 p-4 rounded-xl bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 transition-all text-right">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                            Próxima parte <ArrowLeft className="w-3 h-3 rotate-180" />
                          </span>
                          <p className="text-xs font-bold text-gray-700 group-hover:text-green-700 line-clamp-2 leading-snug transition-colors">{parteNext.titulo}</p>
                        </Link>
                      ) : <div />}
                    </div>
                  )}
                </div>
              )}

              {/* Navegação prev / next (oculta dentro de séries para evitar redundância) */}
              {!(noticia.serie && partesSerie.length > 1) && (artMaisNovo || artMaisAntigo) && (
                <div className="mt-10 pt-6 border-t border-gray-100 grid grid-cols-2 gap-3">
                  {artMaisNovo ? (
                    <Link
                      href={`/noticia/${artMaisNovo.id}`}
                      className="group flex flex-col gap-2 p-4 rounded-xl bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 transition-all"
                    >
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3" /> Mais recente
                      </span>
                      <p className="text-xs font-bold text-gray-700 group-hover:text-green-700 line-clamp-2 leading-snug transition-colors">
                        {artMaisNovo.titulo}
                      </p>
                    </Link>
                  ) : <div />}
                  {artMaisAntigo ? (
                    <Link
                      href={`/noticia/${artMaisAntigo.id}`}
                      className="group flex flex-col gap-2 p-4 rounded-xl bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 transition-all text-right"
                    >
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                        Anterior <ArrowLeft className="w-3 h-3 rotate-180" />
                      </span>
                      <p className="text-xs font-bold text-gray-700 group-hover:text-green-700 line-clamp-2 leading-snug transition-colors">
                        {artMaisAntigo.titulo}
                      </p>
                    </Link>
                  ) : <div />}
                </div>
              )}

              {/* Barra de compartilhamento */}
              <div className="mt-10 pt-6 border-t border-dashed border-gray-200 flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compartilhar:</span>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(noticia.titulo + " — " + pageUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-bold transition-colors"
                >
                  📱 WhatsApp
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-xs font-bold transition-colors"
                >
                  💼 LinkedIn
                </a>
              </div>

              {/* Voltar */}
              <div className="mt-8">
                <button
                  onClick={() => router.push("/noticias")}
                  className="flex items-center gap-2 text-gray-400 text-sm font-bold hover:text-green-600 transition-colors outline-none"
                >
                  <ArrowLeft className="w-4 h-4" /> Todas as notícias
                </button>
              </div>
            </div>
          </div>

          {/* Mais notícias — visível apenas em telas menores (sem sidebar) */}
          {trending.length > 0 && (
            <div className="xl:hidden mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-t-4 border-green-500 px-5 py-3 border-b border-gray-100">
                <h4 className="text-gray-700 text-xs font-black uppercase tracking-wider">Leia Também</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                {trending.slice(0, 4).map(n => (
                  <Link
                    key={n.id}
                    href={`/noticia/${n.id}`}
                    className="flex gap-3 p-4 hover:bg-gray-50 transition-colors group"
                  >
                    {n.imagemCapa && (
                      <img src={n.imagemCapa} alt={n.titulo} className="w-16 h-14 object-cover rounded-lg shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded text-white ${CORES[n.categoria] ?? "bg-gray-500"}`}>
                        {LABELS[n.categoria] ?? n.categoria}
                      </span>
                      <p className="text-xs font-bold text-gray-700 group-hover:text-green-600 mt-1 line-clamp-2 leading-snug">
                        {n.titulo}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* ── SIDEBAR DIREITA ───────────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col gap-4 w-[230px] shrink-0">

          {/* Preços de terra MT */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-t-4 border-orange-400 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-orange-400" />
              <h4 className="text-gray-700 text-[11px] font-black uppercase tracking-widest">Mercado MT — 2025</h4>
            </div>
            <div className="px-4 py-4">
              <div className="text-center py-3 mb-4 bg-orange-50 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Fazendas — Preço Médio</p>
                <p className="text-3xl font-black text-orange-500 my-1">
                  R$ 43k<span className="text-sm text-gray-400 font-normal">/ha</span>
                </p>
                <p className="text-[11px] text-green-600 font-bold">↑ +18% em 12 meses</p>
              </div>
              <ul className="flex flex-col divide-y divide-gray-50">
                {MERCADO_MT.map(item => (
                  <li key={item.lbl} className="flex justify-between items-center py-2 text-[11px]">
                    <span className="text-gray-500">{item.lbl}</span>
                    <span className="font-black text-gray-800">{item.val}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[9px] text-gray-400 mt-3 text-center">Fonte: IMEA · INCRA · 2025</p>
            </div>
          </div>

          {/* Leia também */}
          {trending.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-t-4 border-green-500 px-4 py-3 border-b border-gray-100">
                <h4 className="text-gray-700 text-[11px] font-black uppercase tracking-widest">Leia Também</h4>
              </div>
              <div className="p-3 flex flex-col gap-1">
                {trending.slice(0, 4).map(n => (
                  <Link
                    key={n.id}
                    href={`/noticia/${n.id}`}
                    className="flex gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    {n.imagemCapa ? (
                      <img src={n.imagemCapa} alt={n.titulo} className="w-14 h-12 object-cover rounded-lg shrink-0" />
                    ) : (
                      <div className={`w-14 h-12 rounded-lg shrink-0 flex items-center justify-center text-xl ${CORES[n.categoria] ?? "bg-gray-200"} opacity-80`}>
                        {ICONES[n.categoria] ?? "📰"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-white ${CORES[n.categoria] ?? "bg-gray-500"}`}>
                        {LABELS[n.categoria] ?? n.categoria}
                      </span>
                      <p className="text-[11px] font-bold text-gray-700 group-hover:text-green-600 mt-1 line-clamp-2 leading-snug transition-colors">
                        {n.titulo}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Dados de mercado */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-t-4 border-blue-500 px-4 py-3 border-b border-gray-100">
              <h4 className="text-gray-700 text-[11px] font-black uppercase tracking-widest">Indicadores Chave</h4>
            </div>
            <div className="px-4 py-3">
              <ul className="flex flex-col divide-y divide-gray-50">
                {DADOS_MERCADO.map(item => (
                  <li key={item.lbl} className="flex justify-between items-center py-2.5 text-[11px]">
                    <span className="text-gray-500">{item.lbl}</span>
                    <span className={`font-black ${item.cor}`}>{item.val}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[9px] text-gray-400 mt-3 text-center">Fonte: FGV · CEPEA/USP · 2025</p>
            </div>
          </div>

          {/* CTA — Ver imóveis */}
          <Link
            href="/"
            className="block bg-green-600 hover:bg-green-700 transition-colors rounded-2xl p-5 text-center group"
          >
            <p className="text-white text-xs font-black uppercase tracking-widest mb-1">Encontre seu imóvel</p>
            <p className="text-green-200 text-[11px] font-medium">Veja as melhores oportunidades em MT agora</p>
            <div className="mt-3 text-white font-black text-sm group-hover:translate-x-1 transition-transform inline-block">
              Ver imóveis →
            </div>
          </Link>

        </aside>
      </div>
    </main>
  );
}
