"use client";

import Link from "next/link";
import HeaderPublico from "../components/HeaderPublico";
import { MapPinned, Layers, Users, ArrowRight } from "lucide-react";

const REGIOES = [
  {
    cod: "5101 · IBGE",
    nome: "Cuiabá",
    municipios: "30 municípios",
    imediatas: "3 Regiões Imediatas",
    desc: "A capital estadual organiza o centro-sul mato-grossense. Polo político, administrativo, financeiro e de ensino superior do estado. Cerrado e Pantanal se encontram aqui.",
    polos: ["Cuiabá", "Várzea Grande", "Tangará da Serra", "Diamantino"],
    cor: "bg-green-500",
  },
  {
    cod: "5102 · IBGE",
    nome: "Cáceres",
    municipios: "21 municípios",
    imediatas: "3 Regiões Imediatas",
    desc: "Porta de entrada do Pantanal e fronteira com a Bolívia. Turismo ecológico, pecuária extensiva e riqueza cultural centenária marcam o extremo oeste do estado.",
    polos: ["Cáceres", "Pontes e Lacerda", "Mirassol d'Oeste"],
    cor: "bg-blue-500",
  },
  {
    cod: "5103 · IBGE",
    nome: "Sinop",
    municipios: "43 municípios",
    imediatas: "6 Regiões Imediatas",
    desc: "A maior região do estado em número de municípios. Coração da Amazônia mato-grossense, agronegócio de ponta, madeira e biodiversidade inigualável.",
    polos: ["Sinop", "Sorriso", "Juína", "Alta Floresta", "Juara"],
    cor: "bg-violet-500",
  },
  {
    cod: "5104 · IBGE",
    nome: "Barra do Garças",
    municipios: "30 municípios",
    imediatas: "4 Regiões Imediatas",
    desc: "Capital do Araguaia. Praias fluviais paradisíacas, fronteira com Goiás e Mato Grosso do Sul, agronegócio do leste e turismo de pesca esportiva.",
    polos: ["Barra do Garças", "Confresa", "Água Boa", "Canarana"],
    cor: "bg-amber-500",
  },
  {
    cod: "5105 · IBGE",
    nome: "Rondonópolis",
    municipios: "18 municípios",
    imediatas: "2 Regiões Imediatas",
    desc: "Maior polo industrial do estado, hub logístico do sul de MT. Fertilizantes, grãos, indústria e conexão com os estados do sul e sudeste do Brasil.",
    polos: ["Rondonópolis", "Primavera do Leste"],
    cor: "bg-orange-500",
  },
];

const POLOS = [
  { rank: "1", nome: "Cuiabá", desc: "Capital do Estado · Centro-Sul · Maior polo de serviços", hab: "691.875 hab", mun: "~20 municípios", cor: "bg-blue-500" },
  { rank: "2", nome: "Rondonópolis", desc: "Polo industrial e agroindustrial do Sul", hab: "263.708 hab", mun: "~15 municípios", cor: "bg-orange-500" },
  { rank: "3", nome: "Sinop", desc: "Capital do Nortão · Agronegócio e madeira", hab: "~210.000 hab", mun: "~18 municípios", cor: "bg-violet-500" },
];

export default function RegioesPage() {
  return (
    <main className="min-h-screen bg-[#09090f] font-sans">
      <HeaderPublico />

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-24 px-6 md:px-12 overflow-hidden bg-[#09090f]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[220px] font-black text-white/[0.02] select-none pointer-events-none leading-none hidden lg:block">
          MT
        </span>

        <div className="max-w-[1400px] mx-auto relative z-10">
          <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <MapPinned className="w-3.5 h-3.5" /> Estrutura Territorial
          </span>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.02] tracking-tight mb-6">
            Regiões &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              Polos
            </span>
          </h1>

          <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full mb-8" />

          <p className="text-white/50 text-xl max-w-2xl leading-relaxed">
            Cada região intermediária organiza o território em torno de um{" "}
            <span className="text-white/80 font-semibold">polo urbano estruturante</span>, que oferece
            serviços de maior complexidade à sua área de influência.
          </p>
        </div>
      </section>

      {/* ── 5 GRANDES REGIÕES ── */}
      <section className="py-24 px-6 md:px-12 bg-[#050709]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3">Divisão regional do IBGE</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-16">As 5 grandes regiões de Mato Grosso</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REGIOES.map((r) => (
              <div key={r.nome} className="rounded-2xl bg-white/3 border border-white/8 p-7 flex flex-col gap-4 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{r.cod}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wide text-white px-3 py-1 rounded-full ${r.cor}`}>{r.municipios}</span>
                </div>
                <div className="flex items-center gap-2 text-white/40 text-xs font-bold">
                  <Layers className="w-4 h-4" /> {r.imediatas}
                </div>
                <h3 className="text-2xl font-black text-white">{r.nome}</h3>
                <p className="text-white/50 text-sm leading-relaxed flex-1">{r.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {r.polos.map((p) => (
                    <span key={p} className="text-[11px] font-bold text-white/70 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">{p}</span>
                  ))}
                </div>
                <Link href="/cidades" className="inline-flex items-center gap-1.5 text-green-400 hover:text-green-300 text-xs font-black uppercase tracking-widest mt-1 transition-colors">
                  Ver municípios <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POLOS REGIONAIS ── */}
      <section className="py-24 px-6 md:px-12 bg-[#09090f]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3">Centros de influência</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-16">Polos Regionais de Influência</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {POLOS.map((p) => (
              <div key={p.nome} className="relative rounded-2xl bg-gradient-to-br from-[#0d1b2e] to-[#0a0f1c] border border-white/8 p-8 flex flex-col gap-3 overflow-hidden">
                <div className={`absolute top-6 right-6 w-10 h-10 rounded-full ${p.cor} flex items-center justify-center text-white font-black`}>
                  {p.rank}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{p.mun}</span>
                <h3 className="text-2xl font-black text-white">{p.nome}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
                <div className="flex items-center gap-2 text-white/40 text-xs font-bold mt-1">
                  <Users className="w-4 h-4" /> {p.hab}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 md:px-12 bg-[#050709] border-t border-white/5">
        <div className="max-w-[1400px] mx-auto text-center flex flex-col items-center gap-6">
          <h2 className="text-4xl md:text-5xl font-black text-white max-w-2xl leading-tight">
            Explore os municípios de cada região
          </h2>
          <p className="text-white/40 max-w-lg leading-relaxed">
            Dados de mercado, indicadores e imóveis disponíveis em cada cidade de Mato Grosso.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            <Link href="/cidades" className="bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest px-10 py-4 rounded-xl transition-all shadow-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-95">
              Ver Cidades
            </Link>
            <Link href="/sobre#metodologia" className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold px-10 py-4 rounded-xl border border-white/10 transition-all">
              Nossa Metodologia
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0a1628] border-t border-white/5 py-10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-2xl font-black tracking-tighter text-white">
            urbano<span className="text-green-500">connect</span>
          </span>
          <nav className="flex flex-wrap items-center gap-5">
            {[["Cidades", "/cidades"], ["Regiões", "/regioes"], ["Metodologia", "/sobre#metodologia"], ["Notícias", "/noticias"], ["Planos", "/planos"], ["Contato", "/sobre#contato"]].map(([label, href]) => (
              <Link key={href} href={href} className="text-white/30 hover:text-white text-xs font-bold uppercase tracking-wide transition-colors">{label}</Link>
            ))}
          </nav>
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} Urbano Connect · MT</p>
        </div>
      </footer>
    </main>
  );
}
