"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HeaderPublico from "./components/HeaderPublico";
import VitrineSeries from "./components/VitrineSeries";
import WidgetMercado from "./components/WidgetMercado";
import HeroSlider from "./components/HeroSlider";
import { CIDADES_MT } from "./data/cidades";
import {
  MapPin, ArrowRight, Building2, Tractor, ChevronRight,
  Flame, Crown, Home as HomeIcon,
  Users, BarChart2, Zap,
} from "lucide-react";
import NewsletterBanner from "./components/NewsletterBanner";
import CalculadoraImovel from "./components/CalculadoraImovel";

// ── FALLBACK ESTÁTICO DO SLIDER (usado enquanto API carrega) ───────
const SLIDES_FALLBACK = [
  {
    id: 1, tag: "Agronegócio",
    titulo: "Hectare no eixo da BR-163 atinge novo recorde com fechamento da safra 25/26",
    resumo: "Com a consolidação da colheita em maio, investidores e fundos injetam capital pesado no norte do Mato Grosso, reduzindo a oferta de fazendas de dupla aptidão em Sorriso e Sinop.",
    imagem: "https://showsafra.com.br/wp-content/uploads/2024/09/96.webp",
  },
  {
    id: 2, tag: "Mercado Urbano",
    titulo: "Rondonópolis e Primavera do Leste lideram boom de condomínios de luxo",
    resumo: "Novos lançamentos horizontais de alto padrão registram 85% de vendas ainda na planta. Construtoras já antecipam projetos do segundo semestre.",
    imagem: "https://www.revistanoticiamt.com.br/upload/2/796/6387a4919bc8e4ab8c.jpg",
  },
  {
    id: 3, tag: "Infraestrutura",
    titulo: "Avanço de terminais ferroviários acelera expansão urbana em Lucas do Rio Verde",
    resumo: "Lucas do Rio Verde receberá a primeira ferrovia estadual do Brasil, acelerando a urbanização e valorização imobiliária da região.",
    imagem: "https://www.lucasdorioverde.mt.gov.br/arquivos/noticias/11712/g/pref_lrv.jpeg",
  },
];

const CATEGORIA_LABEL: Record<string, string> = {
  AGRONEGOCIO: "Agronegócio", AVIACAO: "Aviação", ECONOMIA: "Economia",
  CIDADES: "Cidades", FAZENDAS: "Fazendas", INDUSTRIA: "Indústria",
};

type Cotacao    = { id?: number; produto: string; valor: string; variacao: string; dataAtualizacao: string };
type Indicador  = { id?: number; simbolo: string; nome: string; valor: number; variacao: number; unidade: string; fonte: string };

// ─────────────────────────────────────────────────────────────────────
function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [imoveis, setImoveis]             = useState<any[]>([]);
  const [slides, setSlides]               = useState<any[] | null>(null);
  const [cidadeBusca, setCidadeBusca]     = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("");
  const [carregando, setCarregando]       = useState(true);
  const [cotacoes, setCotacoes]           = useState<Cotacao[]>([]);
  const [indicadores, setIndicadores]     = useState<Indicador[]>([]);

  // lê ?categoria= vindo do header
  useEffect(() => {
    const cat = searchParams.get("categoria");
    if (cat !== null) setCategoriaAtiva(cat);
  }, [searchParams]);

  // fetch inicial
  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL;

    fetch(`${api}/imoveis`)
      .then(r => r.json()).then(d => setImoveis(Array.isArray(d) ? d : []))
      .catch(() => setImoveis([])).finally(() => setCarregando(false));

    fetch(`${api}/cotacoes`)
      .then(r => r.ok ? r.json() : []).then(d => setCotacoes(d)).catch(() => {});

    fetch(`${api}/indicadores`)
      .then(r => r.ok ? r.json() : []).then(d => setIndicadores(d)).catch(() => {});

    fetch(`${api}/noticias/destaque`)
      .then(r => r.json())
      .then(d => setSlides(Array.isArray(d) && d.length > 0 ? d : SLIDES_FALLBACK))
      .catch(() => setSlides(SLIDES_FALLBACK));
  }, []);

  const buscarImoveis = useCallback((cidade?: string) => {
    setCarregando(true);
    const url = cidade
      ? `${process.env.NEXT_PUBLIC_API_URL}/imoveis?cidade=${encodeURIComponent(cidade)}`
      : `${process.env.NEXT_PUBLIC_API_URL}/imoveis`;
    fetch(url).then(r => r.json()).then(d => setImoveis(Array.isArray(d) ? d : []))
      .catch(() => setImoveis([])).finally(() => setCarregando(false));
  }, []);

  const handleBuscar = useCallback(() => {
    buscarImoveis(cidadeBusca);
    document.getElementById("vitrine")?.scrollIntoView({ behavior: "smooth" });
  }, [buscarImoveis, cidadeBusca]);

  const handleTagRapida = useCallback((tag: string) => {
    setCidadeBusca(tag);
    buscarImoveis(tag);
    document.getElementById("vitrine")?.scrollIntoView({ behavior: "smooth" });
  }, [buscarImoveis]);

  // Filtros memoizados: antes rodavam a cada re-render (incluindo cada tick do
  // slider de 7s), reprocessando dezenas de imoveis a toa.
  const imoveisAtivos = useMemo(
    () => imoveis.filter(im => im.ativo !== false && !im.vendido),
    [imoveis]
  );

  const imoveisFiltrados = useMemo(() => imoveisAtivos.filter(im => {
    if (cidadeBusca) {
      const t = cidadeBusca.toLowerCase();
      if (!(im.titulo?.toLowerCase().includes(t) || im.cidade?.toLowerCase().includes(t) || im.bairro?.toLowerCase().includes(t))) return false;
    }
    if (categoriaAtiva === "RURAL" && im.tipo !== "RURAL") return false;
    if (categoriaAtiva === "CASA" && !["CASA", "CHACARA"].includes(im.tipo)) return false;
    if (categoriaAtiva === "APARTAMENTO" && im.tipo !== "APARTAMENTO") return false;
    return true;
  }), [imoveisAtivos, cidadeBusca, categoriaAtiva]);

  const imoveisPorCidade = (nome: string) =>
    imoveisAtivos.filter(im => im.cidade?.toLowerCase().includes(nome.toLowerCase())).length;

  const cidadesDestaque = useMemo(() => CIDADES_MT.filter(c => c.destaque), []);

  return (
    <main className="min-h-screen bg-[#09090f] font-sans selection:bg-green-600 selection:text-white">
      <HeaderPublico />

      <HeroSlider
        slides={slides}
        cotacoes={cotacoes}
        indicadores={indicadores}
        cidadeBusca={cidadeBusca}
        setCidadeBusca={setCidadeBusca}
        categoriaAtiva={categoriaAtiva}
        setCategoriaAtiva={setCategoriaAtiva}
        onBuscar={handleBuscar}
        onTagRapida={handleTagRapida}
      />

      {/* ══════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════ */}
      <section className="bg-[#0a1628]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-5 flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap gap-8">
            {[
              { val: String(imoveisAtivos.length || "—"), lbl: "Imóveis ativos", icon: <Building2 className="w-4 h-4" /> },
              { val: "25",          lbl: "Cidades cobertas",     icon: <MapPin className="w-4 h-4" /> },
              { val: "Tempo real",  lbl: "Dados CEPEA/B3",       icon: <BarChart2 className="w-4 h-4" /> },
              { val: "IA",          lbl: "Motor de precificação", icon: <Zap className="w-4 h-4" /> },
            ].map(s => (
              <div key={s.lbl} className="flex items-center gap-3">
                <span className="text-green-500/60">{s.icon}</span>
                <div>
                  <p className="text-white font-black text-base leading-none">{s.val}</p>
                  <p className="text-white/30 text-[11px] uppercase tracking-wide mt-0.5">{s.lbl}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/planos" className="hidden md:flex items-center gap-2 bg-green-600/10 border border-green-500/20 text-green-400 text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-full hover:bg-green-600/20 transition-all outline-none">
            <Crown className="w-3.5 h-3.5" /> Plano PRO
          </Link>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          VITRINE DE IMÓVEIS
      ══════════════════════════════════════════ */}
      <section id="vitrine" className="bg-[#cdddf0] py-16 relative">
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#0d1523]/20 to-transparent pointer-events-none z-10 h-16" />
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">

          {/* Cabeçalho + Filtros */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8 pb-6 border-b border-gray-200">
            <div>
              <p className="text-green-600 text-[11px] font-black uppercase tracking-widest mb-2">Disponíveis agora</p>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-6 bg-green-500 rounded" />
                <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                  {cidadeBusca ? `Resultados em "${cidadeBusca}"` : "Imóveis em Destaque"}
                </h2>
              </div>
              <p className="text-gray-500 text-sm pl-4">
                {imoveisFiltrados.length} propriedade{imoveisFiltrados.length !== 1 ? "s" : ""} disponíve{imoveisFiltrados.length !== 1 ? "is" : "l"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "Todos", value: "", icon: MapPin },
                { label: "Fazendas", value: "RURAL", icon: Tractor },
                { label: "Casas", value: "CASA", icon: HomeIcon },
                { label: "Apartamentos", value: "APARTAMENTO", icon: Building2 },
              ].map(btn => {
                const Icon = btn.icon;
                const ativo = categoriaAtiva === btn.value;
                return (
                  <button key={btn.label} onClick={() => setCategoriaAtiva(btn.value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all outline-none border ${ativo ? "bg-green-600 border-green-600 text-white" : "bg-gray-100 border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"}`}
                  >
                    <Icon className="w-4 h-4" /> {btn.label}
                  </button>
                );
              })}
              {cidadeBusca && (
                <button onClick={() => { setCidadeBusca(""); buscarImoveis(); }} className="px-4 py-2.5 rounded-full font-bold text-sm bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 outline-none transition-all">
                  ✕ Limpar
                </button>
              )}
            </div>
          </div>

          {/* Skeleton */}
          {carregando && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1,2,3,4].map(n => <div key={n} className="h-80 rounded-2xl bg-gray-100 animate-pulse" />)}
            </div>
          )}

          {!carregando && imoveisFiltrados.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-16 text-center">
              <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-gray-900 mb-2">Nenhuma propriedade encontrada</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Tente ajustar os filtros ou pesquisar por outra localidade.</p>
              <button onClick={() => { setCidadeBusca(""); setCategoriaAtiva(""); buscarImoveis(); }} className="mt-6 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-bold outline-none transition-colors border border-gray-200">
                Limpar Filtros
              </button>
            </div>
          )}

          {!carregando && imoveisFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {imoveisFiltrados.map(im => {
                const score = im.scoreOportunidade ?? im.score_oportunidade;
                const isOp  = score != null && score <= 0.9;
                return (
                  <div
                    key={im.id}
                    onClick={() => router.push(`/imovel/${im.id}`)}
                    className="bg-white border border-gray-200/80 shadow-sm rounded-2xl overflow-hidden cursor-pointer group hover:border-green-500/50 hover:shadow-md transition-all duration-300 flex flex-col"
                  >
                    {/* Imagem */}
                    <div className="relative h-52 overflow-hidden bg-gray-100">
                      <img
                        src={im.imagemPrincipal || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&w=800&q=80"}
                        alt={im.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <span className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-widest ${im.tipo === "RURAL" ? "bg-green-600" : "bg-blue-600"} text-white`}>
                        {im.tipo}
                      </span>
                      {isOp && (
                        <span className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase bg-orange-500 text-white flex items-center gap-1">
                          <Flame className="w-3 h-3" /> Oportunidade
                        </span>
                      )}
                      <div className="absolute bottom-3 left-3">
                        <p className="text-white font-black text-xl drop-shadow-lg">
                          R$ {im.preco?.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-800 text-sm leading-snug mb-2 flex-1 line-clamp-2">
                        {im.titulo}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {im.bairro ? `${im.bairro}, ` : ""}{im.cidade}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                        <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          {im.areaTotal?.toLocaleString("pt-BR")} {im.tipo === "RURAL" ? "ha" : "m²"}
                        </span>
                        <span className="text-xs font-black text-green-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                          Ver <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0a1628]/25 to-transparent pointer-events-none z-10" />
      </section>


      {/* ══════════════════════════════════════════
          CIDADES EM DESTAQUE
      ══════════════════════════════════════════ */}
      <section className="bg-[#0a1628] py-16 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-green-400 text-[11px] font-black uppercase tracking-widest mb-2">Inteligência por território</p>
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 bg-green-500 rounded" />
                <h2 className="text-2xl md:text-3xl font-black text-white">Principais Cidades de MT</h2>
              </div>
              <p className="text-white/30 text-sm mt-2 pl-4">Clique em uma cidade para ver imóveis e notícias do mercado local.</p>
            </div>
            <Link href="/cidades" className="shrink-0 text-white/40 hover:text-green-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-colors outline-none border border-white/10 hover:border-green-500/30 px-4 py-2 rounded-full">
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {cidadesDestaque.map((cidade, idx) => {
              const count = imoveisPorCidade(cidade.nome);
              const isBig = idx === 0;
              return (
                <Link key={cidade.slug} href={`/cidade/${cidade.slug}`}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 ${isBig ? "sm:col-span-2 sm:row-span-2" : ""}`}
                  style={{ aspectRatio: isBig ? "unset" : "4/3", minHeight: isBig ? "360px" : undefined }}
                >
                  <img src={cidade.imagem} alt={cidade.nome} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <span className={`text-[9px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded w-fit mb-2 ${cidade.badgeColor}`}>{cidade.badge}</span>
                    <h3 className={`text-white font-black leading-tight ${isBig ? "text-2xl md:text-3xl" : "text-base"}`}>{cidade.nome}</h3>
                    <p className="text-white/40 text-xs mt-1 flex items-center gap-1"><Users className="w-3 h-3" /> {cidade.populacao}</p>
                    {count > 0 && <p className="text-green-400 text-xs font-bold mt-1 flex items-center gap-1"><Building2 className="w-3 h-3" />{count} imóve{count === 1 ? "l" : "is"} ativo{count === 1 ? "" : "s"}</p>}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/10 backdrop-blur border border-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all">Explorar →</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          RANKING TOP 5 CIDADES
      ══════════════════════════════════════════ */}
      <section className="bg-[#0a1628] py-14 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex items-end justify-between mb-7 gap-4">
            <div>
              <p className="text-yellow-400 text-[11px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5" /> Score UrbanoConnect · 31 critérios
              </p>
              <h2 className="text-xl md:text-2xl font-black text-white">Top 5 Cidades de Mato Grosso</h2>
            </div>
            <Link href="/cidades#ranking" className="shrink-0 text-white/35 hover:text-yellow-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-colors outline-none border border-white/10 hover:border-yellow-500/30 px-4 py-2 rounded-full">
              Ranking completo <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {CIDADES_MT
              .filter(c => c.score !== undefined)
              .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
              .slice(0, 5)
              .map((cidade, i) => (
                <Link
                  key={cidade.slug}
                  href={`/cidade/${cidade.slug}`}
                  className="group flex items-center gap-4 bg-[#d0e0f0] hover:bg-[#c4d8ec] border border-white/20 hover:border-yellow-400/50 rounded-2xl px-5 py-4 transition-all"
                >
                  <span className="font-black text-lg w-8 shrink-0 text-center tabular-nums">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-gray-400">{i + 1}º</span>}
                  </span>
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <img src={cidade.imagem} alt={cidade.nome} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-black text-sm group-hover:text-yellow-600 transition-colors">{cidade.nome}</p>
                    <p className="text-gray-500 text-[11px]">{cidade.regiao} · {cidade.badge}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:block w-28">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cidade.score! >= 8 ? "bg-yellow-400" : cidade.score! >= 7.5 ? "bg-green-500" : "bg-emerald-400"}`}
                          style={{ width: `${((cidade.score ?? 0) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className={`font-black text-xl tabular-nums ${cidade.score! >= 8 ? "text-yellow-500" : cidade.score! >= 7.5 ? "text-green-600" : "text-emerald-500"}`}>
                      {cidade.score?.toFixed(1)}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
          <div className="mt-5 flex gap-3 flex-wrap">
            <Link href="/comparar" className="inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white bg-white/10 border border-white/20 hover:border-white/40 px-4 py-2 rounded-full transition-all">
              Comparar cidades
            </Link>
            <Link href="/calculadora-tir" className="inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white bg-white/10 border border-white/20 hover:border-white/40 px-4 py-2 rounded-full transition-all">
              Calculadora TIR fazendas
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CALCULADORA — DESTAQUE
      ══════════════════════════════════════════ */}
      <section className="bg-[#0a1628] py-16 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-green-500/5 blur-[160px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">

          <CalculadoraImovel />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SÉRIES EDITORIAIS — carrosséis por dossiê
      ══════════════════════════════════════════ */}
      <VitrineSeries />

      {/* ══════════════════════════════════════════
          INTELIGÊNCIA DE MERCADO
      ══════════════════════════════════════════ */}
      <section className="bg-[#0a1628] py-16 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <p className="text-green-400 text-[11px] font-black uppercase tracking-widest mb-2">Dados ao vivo</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Inteligência de Mercado</h2>
            <p className="text-white/40 mt-3 text-base leading-relaxed">
              Acompanhe preços médios por tipo, oferta e demanda em tempo real no Mato Grosso.
            </p>
          </div>
          <WidgetMercado />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA PLANO PRO
      ══════════════════════════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
        <div className="bg-[#0d1523] rounded-3xl p-8 md:p-14 flex flex-col md:flex-row items-center justify-between border border-green-500/20 shadow-[0_0_80px_rgba(34,197,94,0.07)] relative overflow-hidden gap-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="z-10 max-w-xl text-center md:text-left">
            <span className="bg-green-500/10 text-green-400 font-black text-xs uppercase tracking-widest px-3 py-1.5 rounded-md mb-4 inline-flex items-center gap-2 border border-green-500/20">
              <Crown className="w-4 h-4" /> Para Corretores e Investidores
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-4 mb-4 leading-tight">
              Venda mais rápido com o{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">Plano PRO</span>
            </h2>
            <p className="text-white/40 text-base leading-relaxed">
              Anúncios ilimitados, contatos direto no WhatsApp e IA exclusiva de análise de preços para decisões mais precisas.
            </p>
          </div>
          <div className="z-10 shrink-0 flex flex-col items-center gap-4">
            <button onClick={() => router.push("/planos")}
              className="bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest px-10 py-5 rounded-xl transition-all shadow-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-95 flex items-center gap-3 outline-none">
              Conhecer os Planos <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-white/20 text-xs">Cancele quando quiser · Sem fidelidade</p>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-12">
        <NewsletterBanner />
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#07080f] border-t border-white/5 mt-4">

        {/* Grade principal */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Coluna 1 — Marca */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-icon.png"
                alt="Urbano Connect"
                width={46}
                height={46}
                unoptimized
                className="drop-shadow-[0_0_8px_rgba(234,88,12,0.35)]"
              />
              <span className="text-2xl font-black tracking-tighter text-white">
                urbano<span className="text-green-500">connect</span>
              </span>
            </div>
            <p className="text-white/35 text-sm leading-relaxed">
              A plataforma imobiliária do Mato Grosso. Imóveis urbanos, fazendas e inteligência de mercado em um só lugar.
            </p>
            {/* Selos */}
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-green-400 border border-green-500/20 bg-green-500/5 px-3 py-1.5 rounded-full">Mato Grosso</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 rounded-full">Desde 2025</span>
            </div>
          </div>

          {/* Coluna 2 — Links */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-5">Navegação</p>
            <ul className="flex flex-col gap-3">
              {[
                ["Imóveis", "/"],
                ["Cidades", "/cidades"],
                ["Notícias", "/noticias"],
                ["Planos", "/planos"],
                ["Sobre nós", "/sobre"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-white/45 hover:text-green-400 text-sm font-bold transition-colors flex items-center gap-2 group">
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-green-400" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3 — Contato */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-5">Contato</p>
            <ul className="flex flex-col gap-4">
              <li>
                <a
                  href="https://wa.me/5511975337073"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-green-600/10 border border-green-500/20 hover:bg-green-600/20 text-green-400 font-bold text-sm px-4 py-3 rounded-xl transition-all group"
                >
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Falar pelo WhatsApp
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/35 text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                suporte@urbanoconnect.com.br
              </li>
              <li className="flex items-start gap-3 text-white/35 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-white/20" />
                Mato Grosso, Brasil
              </li>
              <li className="flex items-start gap-3 text-white/35 text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Seg–Sex, 8h às 18h
              </li>
            </ul>
          </div>

          {/* Coluna 4 — Redes sociais */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-5">Redes Sociais</p>
            <div className="flex flex-col gap-3">
              {[
                { label: "Instagram", href: "https://instagram.com/urbanoconnect", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
                { label: "Facebook", href: "https://facebook.com/urbanoconnect", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                { label: "LinkedIn", href: "https://linkedin.com/company/urbanoconnect", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                { label: "YouTube", href: "https://youtube.com/@urbanoconnect", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg> },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/35 hover:text-white text-sm font-bold transition-colors group">
                  <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 group-hover:border-green-500/30 group-hover:bg-green-500/10 group-hover:text-green-400 flex items-center justify-center transition-all">
                    {s.icon}
                  </span>
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="border-t border-white/5">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-xs">© {new Date().getFullYear()} Urbano Connect · Todos os direitos reservados</p>
            <div className="flex items-center gap-5">
              <Link href="/politica-de-privacidade" className="text-white/20 hover:text-white/50 text-xs font-bold transition-colors">Política de Privacidade</Link>
              <Link href="/termos-de-uso" className="text-white/20 hover:text-white/50 text-xs font-bold transition-colors">Termos de Uso</Link>
            </div>
          </div>
        </div>

      </footer>
    </main>
  );
}

// ── EXPORT COM SUSPENSE ──────────────────────────────────────────────
export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-green-500 font-bold tracking-widest uppercase text-sm">Carregando...</span>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
