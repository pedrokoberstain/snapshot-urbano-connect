"use client";

/**
 * Biblioteca de artigos.
 *
 * Diferente do portal de notícias, que é um feed cronológico: aqui o leitor
 * chega por assunto. Por isso a página agrupa por série e, dentro dela, pelos
 * blocos temáticos — e os artigos avulsos ficam numa seção própria no fim.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import HeaderPublico from "../components/HeaderPublico";
import { ArrowRight, Library, Layers, Loader2, Search, X } from "lucide-react";

const CORES: Record<string, string> = {
  AGRONEGOCIO: "bg-green-100 text-green-700",
  AVIACAO:     "bg-blue-100 text-blue-700",
  ECONOMIA:    "bg-purple-100 text-purple-700",
  CIDADES:     "bg-cyan-100 text-cyan-700",
  FAZENDAS:    "bg-orange-100 text-orange-700",
  INDUSTRIA:   "bg-yellow-100 text-yellow-800",
};

const normalizar = (s: string) =>
  (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

type Artigo = {
  id: number; titulo: string; resumo: string; categoria: string;
  serie: string | null; serieSlug: string | null; parteNumero: number | null;
  bloco: string | null; blocoNumero: number | null;
  imagemCapa: string | null; autor: string | null;
};

export default function Artigos() {
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    // resumido: sem o corpo dos textos, a listagem cai de 1 MB para 68 KB.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias?tipo=ARTIGO&resumido=true`)
      .then((r) => r.json())
      .then((d) => setArtigos(Array.isArray(d) ? d : []))
      .catch(() => setArtigos([]))
      .finally(() => setCarregando(false));
  }, []);

  const alvo = normalizar(busca);
  const filtrados = !alvo ? artigos : artigos.filter((a) =>
    normalizar(a.titulo).includes(alvo) || normalizar(a.resumo).includes(alvo) ||
    normalizar(a.serie ?? "").includes(alvo) || normalizar(a.bloco ?? "").includes(alvo));

  // Séries primeiro, avulsos por último.
  const series = new Map<string, Artigo[]>();
  const avulsos: Artigo[] = [];
  for (const a of filtrados) {
    if (a.serieSlug && a.serie) {
      if (!series.has(a.serieSlug)) series.set(a.serieSlug, []);
      series.get(a.serieSlug)!.push(a);
    } else avulsos.push(a);
  }

  /** Agrupa em blocos temáticos; sem bloco, devolve um grupo único sem cabeçalho. */
  const blocosDe = (lista: Artigo[]) => {
    const ordenada = [...lista].sort((x, y) =>
      (x.blocoNumero ?? 99) - (y.blocoNumero ?? 99) || (x.parteNumero ?? 99) - (y.parteNumero ?? 99));
    const grupos: { nome: string | null; numero: number | null; itens: Artigo[] }[] = [];
    for (const a of ordenada) {
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.nome === (a.bloco ?? null)) ultimo.itens.push(a);
      else grupos.push({ nome: a.bloco ?? null, numero: a.blocoNumero ?? null, itens: [a] });
    }
    return grupos;
  };

  const Card = ({ a }: { a: Artigo }) => (
    <Link href={`/noticia/${a.id}`}
      className="group bg-white rounded-2xl border border-gray-200 hover:border-green-400 hover:shadow-lg transition-all p-5 flex flex-col outline-none">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {a.parteNumero != null && (
          <span className="text-[10px] font-black tracking-widest text-green-600 uppercase">
            Artigo {String(a.parteNumero).padStart(2, "0")}
          </span>
        )}
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${CORES[a.categoria] ?? "bg-gray-100 text-gray-600"}`}>
          {a.categoria}
        </span>
      </div>
      <h3 className="font-black text-gray-900 leading-snug mb-2 group-hover:text-green-700 transition-colors line-clamp-2">
        {a.titulo}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">{a.resumo}</p>
      <span className="mt-3 text-xs font-bold text-green-600 flex items-center gap-1">
        Ler <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <HeaderPublico />

      <header className="bg-[#0f1117] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-green-500 uppercase mb-3">
            <Library className="w-4 h-4" /> Urbano Connect · Mato Grosso
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">Artigos e Séries</h1>
          <p className="text-gray-400 max-w-2xl leading-relaxed">
            Análises de fôlego, séries temáticas e perfis de território. Conteúdo de
            referência — feito para consulta, não para o feed do dia.
          </p>

          <div className="relative mt-7 max-w-md">
            <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título, série ou tema…"
              className="w-full bg-white/5 border border-white/10 focus:border-green-500/60 rounded-xl pl-11 pr-10 py-3 text-sm text-gray-100 placeholder:text-gray-600 outline-none transition-colors"
            />
            {busca && (
              <button onClick={() => setBusca("")} title="Limpar busca"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 outline-none">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-12">
        {carregando ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-green-600 animate-spin" /></div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 font-medium">
              {busca ? `Nenhum artigo encontrado para “${busca}”.` : "Nenhum artigo publicado ainda."}
            </p>
          </div>
        ) : (
          <>
            {[...series.entries()].map(([slug, itens]) => {
              const nome = itens[0].serie!;
              const grupos = blocosDe(itens);
              return (
                <section key={slug} className="mb-16">
                  <div className="flex items-end justify-between gap-4 mb-6 pb-3 border-b-2 border-gray-900">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{nome}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {itens.length} {itens.length === 1 ? "artigo" : "artigos"}
                        {grupos.length > 1 && ` · ${grupos.length} blocos temáticos`}
                      </p>
                    </div>
                    <Link href={`/serie/${slug}`}
                      className="text-sm font-bold text-green-600 hover:text-green-700 whitespace-nowrap outline-none">
                      Ver série →
                    </Link>
                  </div>

                  {grupos.map((g, i) => (
                    <div key={i} className="mb-8">
                      {g.nome && (
                        <div className="flex items-center gap-2 mb-4 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl px-5 py-3">
                          <Layers className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="font-black text-sm tracking-wide">
                            {g.numero != null && `Bloco ${g.numero} — `}{g.nome}
                          </span>
                          <span className="ml-auto text-xs text-gray-400">{g.itens.length}</span>
                        </div>
                      )}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {g.itens.map((a) => <Card key={a.id} a={a} />)}
                      </div>
                    </div>
                  ))}
                </section>
              );
            })}

            {avulsos.length > 0 && (
              <section>
                <div className="mb-6 pb-3 border-b-2 border-gray-900">
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900">Análises avulsas</h2>
                  <p className="text-sm text-gray-500 mt-1">{avulsos.length} artigos fora de série</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {avulsos.map((a) => <Card key={a.id} a={a} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
