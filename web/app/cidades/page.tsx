"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import HeaderPublico from "../components/HeaderPublico";
import { CIDADES_MT } from "../data/cidades";
import { Search, MapPin, Users, ChevronRight, Building2, ChevronDown, Trophy, TrendingUp } from "lucide-react";

type FilterTipo = "all" | "polo" | "agro" | "turism" | "hub";
type ViewMode = "grid" | "ranking";

const FILTROS: { key: FilterTipo; label: string }[] = [
  { key: "all",    label: "Todas"              },
  { key: "polo",   label: "Polos Regionais"    },
  { key: "agro",   label: "Agronegócio"        },
  { key: "turism", label: "Turismo & Natureza"  },
  { key: "hub",    label: "Hubs & Serviços"    },
];

const AGRO_BADGES   = ["Polo Agro","Agronegócio","Capital Agro","Sementes","Algodão","Cerrado","MATOPIBA","Fronteira"];
const TURISM_BADGES = ["Pantanal","Amazônia","Turismo","Pesca","Araguaia"];
const HUB_BADGES    = ["Capital","Metrópole","Polo Industrial","Polo Oeste","BR-163","Teles Pires","Noroeste","Centro MT"];

function matchesFiltro(badge: string, destaque: boolean, tipo: FilterTipo): boolean {
  if (tipo === "all")    return true;
  if (tipo === "polo")   return destaque;
  if (tipo === "agro")   return AGRO_BADGES.includes(badge);
  if (tipo === "turism") return TURISM_BADGES.includes(badge);
  if (tipo === "hub")    return HUB_BADGES.includes(badge);
  return true;
}

function scoreColor(score: number): string {
  if (score >= 8.0) return "text-yellow-400";
  if (score >= 7.5) return "text-green-400";
  if (score >= 7.0) return "text-emerald-400";
  if (score >= 6.5) return "text-blue-400";
  return "text-gray-400";
}

function scoreBgColor(score: number): string {
  if (score >= 8.0) return "bg-yellow-500/20 border-yellow-500/40 text-yellow-300";
  if (score >= 7.5) return "bg-green-500/20 border-green-500/40 text-green-300";
  if (score >= 7.0) return "bg-emerald-500/20 border-emerald-500/40 text-emerald-300";
  if (score >= 6.5) return "bg-blue-500/20 border-blue-500/40 text-blue-300";
  return "bg-gray-500/20 border-gray-500/40 text-gray-300";
}

function medalha(pos: number): string {
  if (pos === 1) return "🥇";
  if (pos === 2) return "🥈";
  if (pos === 3) return "🥉";
  return `${pos}º`;
}

const BIOMAS = [
  {
    title: "Cerrado & Agronegócio",
    sub: "O motor econômico do Brasil",
    desc: "Mato Grosso é o maior produtor de soja do mundo. O cerrado abriga fazendas que alimentam o planeta, com uma das maiores valorizações de terra do país.",
    badge: "🌾 Cerrado",
    badgeBg: "bg-green-700",
    img: "https://sustentabilidadebrasil.com/wp-content/uploads/2024/03/Cerrado-Senado-Federal.webp",
    big: true,
  },
  {
    title: "Pantanal",
    sub: "Maior área úmida do planeta",
    desc: "Cáceres é o portal. Onças, capivaras, tuiuiús e o Rio Paraguai em toda sua magnitude. Mercado de fazendas únicas.",
    badge: "🌿 Pantanal",
    badgeBg: "bg-teal-700",
    img: "https://magazine.zarpo.com.br/wp-content/uploads/2022/06/mag_artigo-zarpo_pantanal_05.png",
    big: false,
  },
  {
    title: "Amazônia Mato-Grossense",
    sub: "Fronteira da floresta",
    desc: "Alta Floresta, Colíder e Sinop são portas de entrada da Amazônia Legal, com mercado de terras em expansão acelerada.",
    badge: "🦜 Amazônia",
    badgeBg: "bg-green-900",
    img: "https://static.congressoemfoco.com.br/2025/01/floresta-amazonica-1-1.jpg",
    big: false,
  },
];

const ESTUDOS = [
  {
    href: "/noticias?categoria=ECONOMIA",
    gradient: "from-blue-900 to-blue-700",
    label: "Economia Imobiliária · Série Completa",
    titulo: "BR-163 e o Preço da Terra: como a rodovia cria ou destrói valor fundiário em MT",
    desc: "A duplicação da BR-163 reduzirá 27,8% o tempo de viagem — e multiplicará o preço da terra em 8 km de faixa.",
    badges: ["BR-163", "Terra", "Logística"],
  },
  {
    href: "/noticias?categoria=AGRONEGOCIO",
    gradient: "from-green-900 to-green-700",
    label: "Agroindústria · R$ 199bi VBP",
    titulo: "Cinturão de Ouro: os 25 municípios mapeados no IVAA — Índice de Vocação Agro-Alimentar",
    desc: "R$ 199 bilhões em VBP. MT lidera soja, milho, algodão e gado. Como cada cidade se posiciona no ranking agro.",
    badges: ["IVAA", "Agronegócio", "Bioeconomia"],
  },
  {
    href: "/noticias?categoria=FAZENDAS",
    gradient: "from-amber-900 to-amber-700",
    label: "Fazendas & Terra Rural",
    titulo: "R$ 65,6 mil/ha · TIR 14,2%: o preço da terra nas microrregiões das 25 cidades",
    desc: "Da terra pantaneira de Poconé ao cerrado de Querência. O mapa de valorização fundiária cruza cada cidade.",
    badges: ["Terra", "TIR", "FCO"],
  },
];

// Top 10 por score
const TOP10 = [...CIDADES_MT]
  .filter(c => c.score !== undefined)
  .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  .slice(0, 10);

// Ranking completo por score
const RANKING = [...CIDADES_MT]
  .filter(c => c.score !== undefined)
  .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

export default function CidadesPage() {
  const [busca, setBusca]             = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState<FilterTipo>("all");
  const [viewMode, setViewMode]       = useState<ViewMode>("grid");

  const cidadesFiltradas = useMemo(() =>
    CIDADES_MT.filter(c => {
      const matchBusca = busca === "" || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.regiao.toLowerCase().includes(busca.toLowerCase());
      return matchBusca && matchesFiltro(c.badge, c.destaque, filtroAtivo);
    }),
  [busca, filtroAtivo]);

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <HeaderPublico />

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden bg-[#0a1628]">
        <div
          className="hero-zoom-bg absolute inset-0"
          style={{
            backgroundImage: [
              "linear-gradient(180deg, rgba(10,22,40,0.25) 0%, rgba(10,22,40,0.70) 55%, rgba(10,22,40,1) 100%)",
              "url('/hero-cidades.png')",
            ].join(", "),
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 px-6 pt-28 pb-24 max-w-4xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/50 text-green-300 text-[11px] font-black uppercase tracking-[0.22em] px-5 py-2.5 rounded-full mb-9">
            <MapPin className="w-3 h-3" />
            Mato Grosso · {CIDADES_MT.length} Municípios Cobertos
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black text-white leading-[0.92] tracking-tight mb-6">
            25 Cidades.<br />
            <span className="text-green-400">70% de</span><br />
            <span className="text-yellow-400">Mato Grosso.</span>
          </h1>
          <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            A maior série de inteligência urbana já produzida sobre MT.
            Dados reais. Scorecards. Análises independentes.
          </p>
          <div className="flex items-center justify-center gap-0 flex-wrap mb-10">
            {[
              { val: String(CIDADES_MT.length), lbl: "Cidades cobertas" },
              { val: "70%",   lbl: "Pop. de MT"    },
              { val: "31",    lbl: "Critérios"     },
              { val: "R$5,7bi", lbl: "VGV 2020–25" },
            ].map((s, i) => (
              <div key={s.lbl} className="flex items-center">
                {i > 0 && <div className="hidden sm:block w-px h-12 bg-white/15 mx-8" />}
                <div className="text-center px-4 sm:px-0">
                  <p className="text-3xl md:text-4xl font-black text-green-400 leading-none">{s.val}</p>
                  <p className="text-white/30 text-[11px] uppercase tracking-[0.15em] mt-2">{s.lbl}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="#top10" className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm px-6 py-3 rounded-full transition-all">
              <Trophy className="w-4 h-4" /> Top 10 por Score
            </a>
            <a href="#ranking" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm px-6 py-3 rounded-full transition-all">
              <TrendingUp className="w-4 h-4" /> Ver Ranking
            </a>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/25 text-[10px] uppercase tracking-widest animate-bounce pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes zoomBg { from { transform: scale(1); } to { transform: scale(1.08); } }
        .hero-zoom-bg { animation: zoomBg 20s ease-in-out infinite alternate; }
      ` }} />

      {/* ══ TOP 10 ══ */}
      <section id="top10" className="bg-[#0d1523] py-20 px-[5%]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-yellow-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" /> Score UrbanoConnect · 31 critérios
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
            As <span className="text-yellow-400">10 melhores</span> cidades de MT
          </h2>
          <p className="text-white/35 text-sm mb-10 max-w-lg leading-relaxed">
            Ranking baseado em 31 critérios: infraestrutura, mercado imobiliário, qualidade urbana e economia.
          </p>

          {/* Card #1 destaque */}
          {TOP10[0] && (
            <Link
              href={`/cidade/${TOP10[0].slug}`}
              className="group flex flex-col md:flex-row items-stretch gap-0 rounded-2xl overflow-hidden mb-5 shadow-2xl hover:opacity-95 transition-opacity"
            >
              <div className="relative md:w-1/2 min-h-[220px] overflow-hidden">
                <img src={TOP10[0].imagem} alt={TOP10[0].nome} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-900/80 md:block hidden" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent md:hidden" />
              </div>
              <div className="md:w-1/2 bg-gradient-to-br from-blue-900 to-[#0a1628] p-8 flex flex-col justify-center">
                <span className="text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mb-3">🥇 #1 · Score máximo da série</span>
                <h3 className="text-3xl md:text-4xl font-black text-white mb-3">{TOP10[0].nome}</h3>
                <p className="text-white/55 text-sm leading-relaxed mb-5">{TOP10[0].descricao}</p>
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-6xl font-black text-yellow-400 leading-none">{TOP10[0].score?.toFixed(1)}</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Score UrbanoConnect</p>
                  </div>
                  <div className="flex flex-col gap-1 ml-4">
                    <span className="text-xs text-white/50 bg-white/10 px-3 py-1 rounded-full">{TOP10[0].regiao}</span>
                    <span className="text-xs text-white/50 bg-white/10 px-3 py-1 rounded-full">{TOP10[0].populacao}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Grid 2–10 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOP10.slice(1).map((cidade, i) => (
              <Link
                key={cidade.slug}
                href={`/cidade/${cidade.slug}`}
                className="group relative rounded-2xl overflow-hidden min-h-[220px] flex flex-col justify-end shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <img src={cidade.imagem} alt={cidade.nome} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                  {medalha(i + 2)}
                </div>
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur px-2.5 py-1 rounded-full">
                  <span className={`text-sm font-black ${scoreColor(cidade.score ?? 0)}`}>{cidade.score?.toFixed(1)}</span>
                </div>
                <div className="relative p-5">
                  <span className={`text-[9px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded mb-1.5 inline-block ${cidade.badgeColor}`}>
                    {cidade.badge}
                  </span>
                  <h3 className="text-white font-black text-lg leading-tight">{cidade.nome}</h3>
                  <p className="text-white/50 text-xs mt-1">{cidade.scoreDestaque}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BANNER BR-163 ══ */}
      <section className="bg-[#0a1628] px-[5%] py-6">
        <div className="max-w-[1400px] mx-auto">
          <Link
            href="/noticias?categoria=ECONOMIA"
            className="group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-blue-900 to-[#0d1523] border border-blue-500/20 rounded-2xl px-8 py-7 overflow-hidden hover:border-blue-400/40 transition-all"
          >
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[140px] font-black text-white/[0.04] leading-none select-none hidden md:block">163</div>
            <div className="relative z-10">
              <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.22em] mb-2">Série BR-163 · Economia Imobiliária</p>
              <h3 className="text-white font-black text-lg md:text-2xl max-w-2xl leading-tight mb-3">
                BR-163 Cuiabá–Santarém: o eixo que define o preço da terra e o futuro logístico de MT
              </h3>
              <div className="flex flex-wrap gap-6 text-sm">
                {[["3.467 km","Extensão total"],["18","Municípios MT"],["-27,8%","Redução tempo viagem"],["850 km","Itiquira → Sinop"]].map(([v,l]) => (
                  <div key={l}>
                    <p className="text-blue-300 font-black text-xl leading-none">{v}</p>
                    <p className="text-white/35 text-[10px] uppercase tracking-wide mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <span className="relative z-10 shrink-0 inline-flex items-center gap-2 bg-blue-600 group-hover:bg-blue-500 text-white font-black text-sm px-6 py-3 rounded-full transition-all whitespace-nowrap">
              Ler série completa <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </section>

      {/* ══ BIOMAS ══ */}
      <section className="bg-[#0d1523] py-20 px-[5%]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">🌿 Território &amp; Natureza</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2">Mato Grosso é <span className="text-green-400">extraordinário</span></h2>
          <p className="text-white/35 text-sm mb-10 max-w-lg leading-relaxed">Três biomas em um só estado: Cerrado, Pantanal e Amazônia. Cada um com um mercado imobiliário único.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:row-span-2 relative rounded-2xl overflow-hidden group cursor-pointer min-h-[300px] md:min-h-[500px]">
              <img src={BIOMAS[0].img} alt={BIOMAS[0].title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-7">
                <span className={`text-[10px] font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-md w-fit mb-3 ${BIOMAS[0].badgeBg}`}>{BIOMAS[0].badge}</span>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-2">{BIOMAS[0].title}</h3>
                <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-2">{BIOMAS[0].sub}</p>
                <p className="text-white/60 text-sm leading-relaxed">{BIOMAS[0].desc}</p>
              </div>
            </div>
            {BIOMAS.slice(1).map(b => (
              <div key={b.title} className="relative rounded-2xl overflow-hidden group cursor-pointer min-h-[230px]">
                <img src={b.img} alt={b.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <span className={`text-[10px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-md w-fit mb-2 ${b.badgeBg}`}>{b.badge}</span>
                  <h3 className="text-lg font-black text-white mb-1">{b.title}</h3>
                  <p className="text-white/55 text-xs leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ RANKING GERAL ══ */}
      <section id="ranking" className="bg-[#f0f2f5] py-16 px-[5%]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-green-600 text-[11px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Score UrbanoConnect
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-[#1a2b3c] mb-8">
            Ranking Geral — <span className="text-green-600">{RANKING.length} cidades avaliadas</span>
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a2b3c] text-white text-[11px] uppercase tracking-wide">
                  <th className="px-5 py-3 text-left w-12">Pos.</th>
                  <th className="px-5 py-3 text-left">Cidade</th>
                  <th className="px-5 py-3 text-left hidden md:table-cell">Pop. Est.</th>
                  <th className="px-5 py-3 text-left hidden lg:table-cell">Região</th>
                  <th className="px-5 py-3 text-center w-20">Score</th>
                  <th className="px-5 py-3 text-left hidden xl:table-cell w-40">Barra</th>
                  <th className="px-5 py-3 text-left hidden xl:table-cell">Destaque</th>
                </tr>
              </thead>
              <tbody>
                {RANKING.map((cidade, i) => (
                  <tr key={cidade.slug} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i < 3 ? "bg-yellow-50/50" : ""}`}>
                    <td className="px-5 py-3 font-black text-gray-500 text-base">
                      {i < 3 ? ["🥇","🥈","🥉"][i] : `${i+1}º`}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/cidade/${cidade.slug}`} className="font-bold text-green-700 hover:text-green-600 hover:underline">
                        {cidade.nome}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{cidade.populacao}</td>
                    <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">{cidade.regiao}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-black text-lg ${scoreColor(cidade.score ?? 0)}`}>{cidade.score?.toFixed(1)}</span>
                    </td>
                    <td className="px-5 py-3 hidden xl:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-gray-100 rounded-full w-24 overflow-hidden">
                          <div className="h-full bg-green-600 rounded-full" style={{ width: `${((cidade.score ?? 0) / 10) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs hidden xl:table-cell">{cidade.scoreDestaque}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══ FILTER BAR ══ */}
      <div className="sticky top-0 z-50 bg-[#1a2b3c] border-b border-white/5 shadow-2xl">
        <div className="max-w-[1400px] mx-auto px-[5%] py-4 flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white/10 border border-white/10 rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-white/35 shrink-0" />
            <input
              type="text"
              placeholder="Buscar cidade..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="bg-transparent outline-none text-white text-sm w-full placeholder-white/25 font-medium"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTROS.map(f => (
              <button
                key={f.key}
                onClick={() => setFiltroAtivo(f.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all outline-none ${
                  filtroAtivo === f.key
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-white/10 text-white/50 hover:bg-white/15 hover:text-white border border-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-white/30 text-xs whitespace-nowrap ml-auto">
            <span className="text-green-400 font-black">{cidadesFiltradas.length}</span> cidade{cidadesFiltradas.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ══ GRID COMPLETO ══ */}
      <section className="py-14 px-[5%] bg-[#f0f2f5]">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-8">
            <p className="text-blue-600 text-[11px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Índice Completo
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              <span className="text-blue-600">{cidadesFiltradas.length} cidade{cidadesFiltradas.length !== 1 ? "s" : ""}</span>
              {filtroAtivo !== "all" && " encontradas"}
            </h2>
          </div>

          {cidadesFiltradas.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-lg">Nenhuma cidade encontrada</p>
              <button onClick={() => { setBusca(""); setFiltroAtivo("all"); }} className="mt-4 text-sm text-blue-600 font-bold hover:underline outline-none">
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {cidadesFiltradas.map((cidade, idx) => (
                <Link
                  key={cidade.slug}
                  href={`/cidade/${cidade.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col border border-gray-100 hover:border-blue-100"
                >
                  <div className="relative h-44 overflow-hidden bg-gray-200">
                    <img src={cidade.imagem} alt={cidade.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <span className={`absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest text-white px-2.5 py-1 rounded-md ${cidade.badgeColor}`}>
                      {cidade.badge}
                    </span>
                    {cidade.score && (
                      <span className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full border ${scoreBgColor(cidade.score)}`}>
                        {cidade.score.toFixed(1)}
                      </span>
                    )}
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold text-white/40 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-black text-[#1a2b3c] text-[15px] mb-0.5 group-hover:text-blue-700 transition-colors leading-tight">{cidade.nome}</h3>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2.5">{cidade.regiao}</p>
                    <p className="text-xs text-gray-500 leading-relaxed flex-1 line-clamp-2 mb-3">{cidade.descricao}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {cidade.populacao}
                      </span>
                      <span className="text-xs font-black text-blue-600 flex items-center gap-0.5 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        Ver mercado <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ ESTUDOS RELACIONADOS ══ */}
      <section className="bg-[#0d1523] py-16 px-[5%]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-orange-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3">📚 Análises do UrbanoConnect</p>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-8">Estudos sobre as cidades de MT</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ESTUDOS.map(e => (
              <Link key={e.href} href={e.href} className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/25 hover:-translate-y-1 transition-all flex flex-col">
                <div className={`bg-gradient-to-br ${e.gradient} p-6`}>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-2">{e.label}</p>
                  <h3 className="text-white font-black text-sm leading-snug">{e.titulo}</h3>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex gap-2 flex-wrap mb-3">
                    {e.badges.map(b => (
                      <span key={b} className="text-[10px] font-bold text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">{b}</span>
                    ))}
                  </div>
                  <p className="text-white/45 text-xs leading-relaxed flex-1">{e.desc}</p>
                  <div className="text-green-400 text-xs font-bold flex items-center gap-1 mt-4 group-hover:gap-2 transition-all">
                    Ler análise <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-[#0a1628] border-t border-white/5 py-10 px-[5%]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo-icon.png" alt="Urbano Connect" width={42} height={42} unoptimized className="drop-shadow-[0_0_8px_rgba(234,88,12,0.35)]" />
            <span className="text-2xl font-black tracking-tighter text-white">urbano<span className="text-green-500">connect</span></span>
          </div>
          <nav className="flex items-center gap-5">
            {[["Home", "/"], ["Notícias", "/noticias"], ["Planos", "/planos"]].map(([l, h]) => (
              <Link key={h} href={h} className="text-white/30 hover:text-white text-xs font-bold uppercase tracking-wide transition-colors">{l}</Link>
            ))}
          </nav>
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} Urbano Connect · MT</p>
        </div>
      </footer>
    </div>
  );
}
