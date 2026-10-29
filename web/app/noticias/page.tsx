"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import HeaderPublico from "../components/HeaderPublico";
import Link from "next/link";
import { MapPin, Calendar, User, ChevronRight } from "lucide-react";
import NewsletterBanner from "../components/NewsletterBanner";

// ── CONSTANTES ────────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { value: "",             label: "Todas"       },
  { value: "AGRONEGOCIO",  label: "Agronegócio" },
  { value: "AVIACAO",      label: "Aviação"     },
  { value: "ECONOMIA",     label: "Economia"    },
  { value: "CIDADES",      label: "Cidades"     },
  { value: "FAZENDAS",     label: "Fazendas"    },
  { value: "INDUSTRIA",    label: "Indústria"   },
];

const CORES: Record<string, string> = {
  AGRONEGOCIO: "bg-green-600",
  AVIACAO:     "bg-cyan-700",
  ECONOMIA:    "bg-cyan-800",
  CIDADES:     "bg-slate-600",
  FAZENDAS:    "bg-green-700",
  INDUSTRIA:   "bg-slate-700",
};

const BORDA: Record<string, string> = {
  AGRONEGOCIO: "border-green-500",
  AVIACAO:     "border-cyan-600",
  ECONOMIA:    "border-cyan-700",
  CIDADES:     "border-slate-500",
  FAZENDAS:    "border-green-600",
  INDUSTRIA:   "border-slate-600",
};

function getLabelCategoria(value: string) {
  return CATEGORIAS.find(c => c.value === value)?.label ?? value;
}

// ── SUB-COMPONENTES ───────────────────────────────────────────────────────────

function CardDestaque({ noticia }: { noticia: any }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/noticia/${noticia.id}`)}
      className="relative col-span-2 rounded-2xl overflow-hidden cursor-pointer group bg-gray-900 h-[440px] shadow-md hover:shadow-xl transition-shadow"
    >
      <img
        src={noticia.imagemCapa || "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&w=900&q=70"}
        alt={noticia.titulo}
        className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute top-4 left-4">
        <span className={`inline-block text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow ${CORES[noticia.categoria] ?? "bg-gray-600"}`}>
          {getLabelCategoria(noticia.categoria)}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-7">
        <p className="text-gray-300 text-[10px] font-bold uppercase tracking-widest mb-2">
          Destaque da Editoria
        </p>
        <h2 className="text-white text-2xl md:text-3xl font-black leading-tight tracking-tight mb-3 line-clamp-3">
          {noticia.titulo}
        </h2>
        {noticia.resumo && (
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-4">{noticia.resumo}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
          {noticia.autor && (
            <span className="flex items-center gap-1.5">
              <User className="w-3 h-3" /> {noticia.autor}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {new Date(noticia.dataPublicacao).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>
      <div className="absolute bottom-7 right-7 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm rounded-full p-2 group-hover:translate-x-1 duration-200">
        <ChevronRight className="w-4 h-4 text-white" />
      </div>
    </div>
  );
}

function CardSecundario({ noticia }: { noticia: any }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/noticia/${noticia.id}`)}
      className="relative rounded-2xl overflow-hidden cursor-pointer group bg-gray-900 h-[210px] shadow-sm hover:shadow-lg transition-shadow"
    >
      <img
        src={noticia.imagemCapa || "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&w=600&q=70"}
        alt={noticia.titulo}
        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute top-3 left-3">
        <span className={`inline-block text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${CORES[noticia.categoria] ?? "bg-gray-600"}`}>
          {getLabelCategoria(noticia.categoria)}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white text-sm font-black leading-snug line-clamp-2">{noticia.titulo}</h3>
        <p className="text-gray-400 text-[10px] font-medium mt-1.5">
          {new Date(noticia.dataPublicacao).toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>
  );
}

function CardLista({ noticia }: { noticia: any }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/noticia/${noticia.id}`)}
      className={`bg-white rounded-2xl overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 flex flex-col border border-gray-100 border-t-4 ${BORDA[noticia.categoria] ?? "border-t-gray-300"}`}
    >
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        <img
          src={noticia.imagemCapa || "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&w=600&q=70"}
          alt={noticia.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <span className={`absolute top-3 left-3 text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow ${CORES[noticia.categoria] ?? "bg-gray-600"}`}>
          {getLabelCategoria(noticia.categoria)}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h2 className="text-gray-900 font-black text-sm leading-snug line-clamp-2 flex-1 mb-2">
          {noticia.titulo}
        </h2>
        {noticia.resumo && (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">{noticia.resumo}</p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-semibold pt-3 border-t border-gray-100">
          {noticia.autor && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {noticia.autor}</span>}
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="w-3 h-3" />
            {new Date(noticia.dataPublicacao).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

function NoticiasContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [noticias,   setNoticias]   = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [categoria,  setCategoria]  = useState(searchParams.get("categoria") ?? "");
  const [serie,      setSerie]      = useState("");

  useEffect(() => {
    const param = searchParams.get("categoria");
    if (param !== null) setCategoria(param);
  }, [searchParams]);

  useEffect(() => {
    setCarregando(true);
    const url = categoria
      ? `${process.env.NEXT_PUBLIC_API_URL}/noticias?categoria=${categoria}`
      : `${process.env.NEXT_PUBLIC_API_URL}/noticias`;

    fetch(url)
      .then(r => r.json())
      .then(data => setNoticias(Array.isArray(data) ? data : []))
      .catch(() => setNoticias([]))
      .finally(() => setCarregando(false));
  }, [categoria]);

  const trocarCategoria = (val: string) => {
    setCategoria(val);
    router.replace(val ? `/noticias?categoria=${val}` : "/noticias", { scroll: false });
  };

  const noticiasFiltradas = serie
    ? noticias.filter(n => n.titulo?.toLowerCase().includes(serie.toLowerCase()) || n.resumo?.toLowerCase().includes(serie.toLowerCase()))
    : noticias;

  const destaque    = noticiasFiltradas[0] ?? null;
  const secundarias = noticiasFiltradas.slice(1, 3);
  const demais      = noticiasFiltradas.slice(3);

  return (
    <main className="min-h-screen bg-[#f4f6f8] font-sans">
      <HeaderPublico />

      {/* Hero do portal — foto com overlay */}
      <div className="pt-20 relative">
        {/* Imagem de fundo */}
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&w=1600&q=75"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Overlay escuro semi-transparente */}
        <div className="absolute inset-0 bg-[#09090f]/80" />
        {/* Linha de cor no topo */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-green-500 via-cyan-600 to-green-500" />

        {/* Conteúdo */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 pt-12 pb-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.25em] mb-3">
              Urbano Connect · Mato Grosso
            </p>
            <h1 className="text-3xl md:text-[2.75rem] font-black text-white tracking-tight leading-none">
              Portal de Notícias
            </h1>
            <p className="text-gray-300 mt-3 text-sm max-w-md leading-relaxed">
              Análises e inteligência de mercado — agronegócio, imobiliário e economia de MT.
            </p>
          </div>
          <p className="hidden md:block text-gray-300 text-[11px] font-medium tracking-wider shrink-0 border border-white/25 rounded-full px-4 py-1.5">
            {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }).replace(".", "")}
          </p>
        </div>

        {/* Barra de categorias */}
        <div className="relative z-10 border-t border-white/10 sticky top-20 bg-[#09090f]/90 backdrop-blur-md">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
              {CATEGORIAS.map(c => (
                <button
                  key={c.value}
                  onClick={() => trocarCategoria(c.value)}
                  className={`px-4 py-3.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-all outline-none shrink-0 tracking-widest ${
                    categoria === c.value
                      ? "border-green-500 text-green-400"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {c.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de série */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6 pb-2 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-1 shrink-0">Série:</span>
        {["BR-163", "IVAA", "Ferrovia", "Aviação", "Pantanal"].map(s => (
          <button
            key={s}
            onClick={() => setSerie(serie === s ? "" : s)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all outline-none border ${
              serie === s
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-green-400 hover:text-green-600"
            }`}
          >
            {s}
          </button>
        ))}
        {serie && (
          <button onClick={() => setSerie("")} className="text-[10px] text-gray-400 hover:text-red-500 font-bold ml-1 transition-colors outline-none">
            ✕ limpar
          </button>
        )}
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 mt-2">

        {carregando ? (
          // Skeleton
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 h-[440px] bg-gray-200 rounded-2xl animate-pulse" />
            <div className="flex flex-col gap-5">
              <div className="h-[210px] bg-gray-200 rounded-2xl animate-pulse" />
              <div className="h-[210px] bg-gray-200 rounded-2xl animate-pulse" />
            </div>
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : noticiasFiltradas.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-bold text-base">Nenhuma notícia encontrada{serie ? ` na série "${serie}"` : " nesta editoria"}.</p>
            <button
              onClick={() => { trocarCategoria(""); setSerie(""); }}
              className="mt-4 text-green-600 text-sm font-bold hover:text-green-700 transition-colors outline-none"
            >
              Ver todas as notícias
            </button>
          </div>
        ) : (
          <>
            {/* Bloco hero: destaque + 2 secundárias */}
            {destaque && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <CardDestaque noticia={destaque} />
                <div className="flex flex-col gap-5">
                  {secundarias.map(n => <CardSecundario key={n.id} noticia={n} />)}
                </div>
              </div>
            )}

            {/* Divisor com título da seção */}
            {demais.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {categoria ? `Mais em ${getLabelCategoria(categoria)}` : "Mais notícias"}
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Grid de cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {demais.map(n => <CardLista key={n.id} noticia={n} />)}
                </div>
              </>
            )}

            {/* Newsletter */}
            <div className="mt-12">
              <NewsletterBanner />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function Noticias() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <NoticiasContent />
    </Suspense>
  );
}
