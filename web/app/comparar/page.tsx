"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderPublico from "../components/HeaderPublico";
import { CIDADES_MT } from "../data/cidades";
import { Trophy, MapPin, Users, ChevronRight, Plus, X } from "lucide-react";

function scoreBar(score: number) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${score >= 8 ? "bg-yellow-400" : score >= 7.5 ? "bg-green-400" : score >= 7 ? "bg-emerald-400" : "bg-blue-400"}`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <span className={`text-xs font-black tabular-nums ${score >= 8 ? "text-yellow-400" : score >= 7.5 ? "text-green-400" : score >= 7 ? "text-emerald-400" : "text-blue-400"}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}

const CRITERIOS = [
  { key: "score",      label: "Score UrbanoConnect",  fmt: (c: any) => c.score ? `${c.score.toFixed(1)} / 10` : "—", destaque: true },
  { key: "populacao",  label: "População estimada",   fmt: (c: any) => c.populacao },
  { key: "regiao",     label: "Região",               fmt: (c: any) => c.regiao },
  { key: "badge",      label: "Vocação principal",    fmt: (c: any) => c.badge },
  { key: "score",      label: "Barra de score",       fmt: (c: any) => c.score ? "BAR" : "—", isBar: true },
];

const CRITERIOS_TEXTO = [
  { label: "Descrição", fmt: (c: any) => c.descricao },
  { label: "Destaque?", fmt: (c: any) => c.destaque ? "✅ Polo regional" : "Cidade média" },
];

export default function CompararPage() {
  const [selecionadas, setSelecionadas] = useState<string[]>(["cuiaba", "sinop"]);
  const [busca, setBusca] = useState("");

  const opcoes = CIDADES_MT.filter(c =>
    !selecionadas.includes(c.slug) &&
    (busca === "" || c.nome.toLowerCase().includes(busca.toLowerCase()))
  );

  const cidadesSelecionadas = selecionadas.map(s => CIDADES_MT.find(c => c.slug === s)!).filter(Boolean);

  const adicionar = (slug: string) => {
    if (selecionadas.length < 3) setSelecionadas(prev => [...prev, slug]);
    setBusca("");
  };

  const remover = (slug: string) => setSelecionadas(prev => prev.filter(s => s !== slug));

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <HeaderPublico />

      {/* Hero */}
      <section className="pt-28 pb-10 px-[5%] max-w-[1400px] mx-auto">
        <p className="text-blue-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3">Ferramenta de análise</p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
          Comparar <span className="text-blue-400">Cidades de MT</span>
        </h1>
        <p className="text-white/40 text-base max-w-lg leading-relaxed">
          Compare até 3 cidades lado a lado: scores, vocações e dados de mercado.
        </p>
      </section>

      <section className="pb-20 px-[5%] max-w-[1400px] mx-auto">

        {/* Seletor */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Cidades selecionadas */}
            {cidadesSelecionadas.map(c => (
              <div key={c.slug} className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-200 text-xs font-bold px-3 py-2 rounded-full">
                {c.nome}
                <button onClick={() => remover(c.slug)} className="hover:text-white transition-colors outline-none ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Adicionar */}
            {selecionadas.length < 3 && (
              <div className="relative">
                <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-2">
                  <Plus className="w-3.5 h-3.5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Adicionar cidade..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    className="bg-transparent outline-none text-white text-xs font-bold placeholder-white/25 w-36"
                  />
                </div>
                {busca.length > 0 && opcoes.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 bg-[#0d1523] border border-white/15 rounded-xl shadow-2xl z-50 w-56 overflow-hidden">
                    {opcoes.slice(0, 6).map(c => (
                      <button
                        key={c.slug}
                        onClick={() => adicionar(c.slug)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/10 transition-colors text-left"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.badgeColor}`} />
                        <span className="text-white text-xs font-bold">{c.nome}</span>
                        <span className="text-white/30 text-[10px] ml-auto">{c.regiao}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <span className="text-white/20 text-xs ml-auto">{selecionadas.length}/3 cidades</span>
          </div>
        </div>

        {/* Tabela comparativa */}
        {cidadesSelecionadas.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

            {/* Fotos e nomes */}
            <div className={`grid divide-x divide-white/10`} style={{ gridTemplateColumns: `180px repeat(${cidadesSelecionadas.length}, 1fr)` }}>
              <div className="p-4 flex items-end">
                <p className="text-white/25 text-[10px] font-black uppercase tracking-widest">Cidade</p>
              </div>
              {cidadesSelecionadas.map(c => (
                <div key={c.slug} className="relative overflow-hidden min-h-[160px] flex flex-col justify-end">
                  <img src={c.imagem} alt={c.nome} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  {c.score && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur px-2 py-1 rounded-full">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-300 text-xs font-black">{c.score.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="relative p-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded mb-1 inline-block ${c.badgeColor}`}>{c.badge}</span>
                    <h3 className="text-white font-black text-base">{c.nome}</h3>
                    <p className="text-white/40 text-xs">{c.regiao}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Linhas de dados */}
            {[
              { lbl: "Score UrbanoConnect", render: (c: any) => c.score ? (
                <div>
                  <p className="text-white font-black text-lg">{c.score.toFixed(1)} <span className="text-white/30 text-xs font-normal">/ 10</span></p>
                  {scoreBar(c.score)}
                </div>
              ) : <span className="text-white/30">—</span> },
              { lbl: "Vocação", render: (c: any) => <span className={`text-[10px] font-black uppercase px-2 py-1 rounded text-white ${c.badgeColor}`}>{c.badge}</span> },
              { lbl: "Região", render: (c: any) => <span className="text-white/70 text-sm font-bold">{c.regiao}</span> },
              { lbl: "População", render: (c: any) => (
                <span className="text-white/70 text-sm font-bold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-white/25" /> {c.populacao}
                </span>
              )},
              { lbl: "Polo regional?", render: (c: any) => <span className={`text-sm font-bold ${c.destaque ? "text-green-400" : "text-white/30"}`}>{c.destaque ? "✓ Sim" : "Não"}</span> },
              { lbl: "Descrição", render: (c: any) => <p className="text-white/45 text-xs leading-relaxed">{c.descricao}</p> },
            ].map((row, i) => (
              <div
                key={row.lbl}
                className={`grid divide-x divide-white/5 border-t border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                style={{ gridTemplateColumns: `180px repeat(${cidadesSelecionadas.length}, 1fr)` }}
              >
                <div className="p-4 flex items-start pt-5">
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-wide leading-tight">{row.lbl}</p>
                </div>
                {cidadesSelecionadas.map(c => (
                  <div key={c.slug} className="p-4 pt-5">
                    {row.render(c)}
                  </div>
                ))}
              </div>
            ))}

            {/* Rodapé com links */}
            <div className={`grid divide-x divide-white/5 border-t border-white/10 bg-white/5`}
              style={{ gridTemplateColumns: `180px repeat(${cidadesSelecionadas.length}, 1fr)` }}>
              <div className="p-4" />
              {cidadesSelecionadas.map(c => (
                <div key={c.slug} className="p-4">
                  <Link
                    href={`/cidade/${c.slug}`}
                    className="flex items-center gap-2 text-xs font-black text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Ver página completa <ChevronRight className="w-3 h-3 ml-auto" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick access — outras cidades */}
        <div className="mt-8">
          <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-4">Outras cidades para comparar</p>
          <div className="flex flex-wrap gap-2">
            {CIDADES_MT.filter(c => !selecionadas.includes(c.slug)).map(c => (
              <button
                key={c.slug}
                onClick={() => selecionadas.length < 3 ? adicionar(c.slug) : undefined}
                disabled={selecionadas.length >= 3}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all outline-none ${
                  selecionadas.length < 3
                    ? "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white"
                    : "opacity-30 cursor-not-allowed bg-white/5 border-white/5 text-white/30"
                }`}
              >
                <Plus className="w-3 h-3" /> {c.nome}
                {c.score && <span className="text-white/30 ml-1">{c.score.toFixed(1)}</span>}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
