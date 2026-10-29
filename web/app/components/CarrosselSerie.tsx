"use client";

/**
 * Carrossel horizontal de uma série.
 *
 * A rolagem é nativa (scroll-snap + overflow-x), não uma engine de slider:
 * funciona com toque, trackpad, roda do mouse e teclado sem código nenhum, e
 * degrada bem se o JS falhar. As setas só empurram o scrollLeft.
 */

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

export type ItemSerie = {
  id: number;
  titulo: string;
  resumo?: string | null;
  imagemCapa?: string | null;
  parteNumero?: number | null;
  bloco?: string | null;
  blocoNumero?: number | null;
};

/** Paleta por posição, para o capítulo ter identidade como no material do André. */
const CORES = [
  "bg-amber-500", "bg-[#6b4423]", "bg-green-600",
  "bg-slate-800", "bg-blue-600", "bg-purple-600", "bg-rose-600",
];

export default function CarrosselSerie({
  nome, slug, itens, icone, rotulo,
}: {
  nome: string;
  slug: string;
  itens: ItemSerie[];
  icone?: React.ReactNode;
  /** Prefixo do selo de cada card: "BR-163", "ÁGUAS"… Sem isso usa o nº da parte. */
  rotulo?: string;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  const medir = () => {
    const el = trilho.current;
    if (!el) return;
    setPodeVoltar(el.scrollLeft > 8);
    setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    medir();
    const el = trilho.current;
    if (!el) return;
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      el.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [itens.length]);

  const empurrar = (dir: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;
    // Avança uma "página" visível, deixando um card de sobreposição como pista.
    el.scrollBy({ left: dir * (el.clientWidth - 90), behavior: "smooth" });
  };

  if (!itens.length) return null;

  const selo = (i: ItemSerie, idx: number) => {
    if (rotulo && i.parteNumero != null) return `${rotulo} · Cap. ${i.parteNumero}`;
    if (rotulo) return rotulo;
    if (i.parteNumero != null) return `Parte ${i.parteNumero}`;
    return `Artigo ${idx + 1}`;
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="flex items-center gap-2.5 text-sm md:text-base font-black tracking-wide uppercase text-white">
          <span className="w-1 h-6 bg-green-500 rounded-full flex-shrink-0" />
          {icone}
          <span className="line-clamp-1">{nome}</span>
          <span className="text-gray-500 font-bold normal-case text-xs flex-shrink-0">
            {itens.length} {itens.length === 1 ? "artigo" : "artigos"}
          </span>
        </h2>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/serie/${slug}`}
            className="hidden sm:inline text-xs font-bold text-green-400 hover:text-green-300 outline-none whitespace-nowrap">
            Ver série →
          </Link>
          <button onClick={() => empurrar(-1)} disabled={!podeVoltar} aria-label="Voltar"
            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:hover:bg-white/5 transition-all outline-none">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => empurrar(1)} disabled={!podeAvancar} aria-label="Avançar"
            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:hover:bg-white/5 transition-all outline-none">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={trilho}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 -mx-1 px-1
                   [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
        {itens.map((i, idx) => (
          <Link key={i.id} href={`/noticia/${i.id}`}
            className="group snap-start flex-shrink-0 w-[248px] sm:w-[272px] bg-[#12121e] border border-white/5
                       hover:border-green-500/40 rounded-2xl overflow-hidden flex flex-col transition-all outline-none">
            <div className="h-28 bg-gradient-to-br from-[#1a2b3c] to-[#0f172a] relative overflow-hidden">
              {i.imagemCapa && (
                <img src={i.imagemCapa} alt="" loading="lazy"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              )}
            </div>

            <div className="p-4 flex flex-col flex-1">
              <span className={`self-start text-[10px] font-black uppercase tracking-wider text-white px-2 py-1 rounded mb-2.5 ${CORES[idx % CORES.length]}`}>
                {selo(i, idx)}
              </span>
              <h3 className="text-sm font-bold text-gray-100 leading-snug line-clamp-3 group-hover:text-green-400 transition-colors">
                {i.titulo}
              </h3>
              {i.bloco && (
                <span className="mt-2 text-[10px] text-gray-600 font-bold uppercase tracking-wide line-clamp-1">
                  {i.bloco}
                </span>
              )}
              <span className="mt-auto pt-3 text-[11px] font-bold text-green-500 flex items-center gap-1">
                Ler capítulo <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {podeAvancar && (
        <p className="text-center text-[11px] text-gray-600 font-bold mt-1">
          ‹ Deslize para ver mais ›
        </p>
      )}
    </section>
  );
}
