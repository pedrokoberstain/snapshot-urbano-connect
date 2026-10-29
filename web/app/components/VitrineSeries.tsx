"use client";

/**
 * Vitrine de séries para a home.
 *
 * Uma requisição só: a listagem resumida de artigos (68 KB, sem o corpo dos
 * textos) e o agrupamento é feito aqui. Buscar série por série custaria sete
 * idas à API para desenhar a mesma coisa.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import CarrosselSerie, { ItemSerie } from "./CarrosselSerie";
import { Library } from "lucide-react";

type Artigo = ItemSerie & { serie: string | null; serieSlug: string | null };

/** Prefixo curto do selo de cada série. Sem entrada aqui, cai no nº da parte. */
const ROTULOS: Record<string, string> = {
  "br-163-a-rodovia-que-criou-cidades": "BR-163",
  "serie-das-aguas-de-mt": "ÁGUAS",
  "25-cidades-de-mato-grosso": "CIDADE",
  "castanha-do-brasil-a-floresta-que-alimenta-o-vizinho": "CASTANHA",
};

export default function VitrineSeries({ limite = 4 }: { limite?: number }) {
  const [series, setSeries] = useState<{ nome: string; slug: string; itens: Artigo[] }[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias?tipo=ARTIGO&resumido=true`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Artigo[]) => {
        if (!Array.isArray(d)) return;
        const mapa = new Map<string, { nome: string; slug: string; itens: Artigo[] }>();
        for (const a of d) {
          if (!a.serieSlug || !a.serie) continue;
          if (!mapa.has(a.serieSlug)) mapa.set(a.serieSlug, { nome: a.serie, slug: a.serieSlug, itens: [] });
          mapa.get(a.serieSlug)!.itens.push(a);
        }
        for (const s of mapa.values()) {
          s.itens.sort((x, y) =>
            (x.blocoNumero ?? 99) - (y.blocoNumero ?? 99) ||
            (x.parteNumero ?? 99) - (y.parteNumero ?? 99));
        }
        setSeries([...mapa.values()].sort((a, b) => b.itens.length - a.itens.length).slice(0, limite));
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [limite]);

  if (carregando || !series.length) return null;

  return (
    <section className="bg-[#0a1628] py-16 border-b border-white/5">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <span className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-green-500 uppercase mb-2">
              <Library className="w-4 h-4" /> Séries Editoriais
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
              Dossiês de território
            </h2>
            <p className="text-gray-400 mt-2 max-w-xl text-sm leading-relaxed">
              Investigações em capítulos sobre água, rodovias, cadeias produtivas e as
              cidades que sustentam Mato Grosso.
            </p>
          </div>
          <Link href="/artigos"
            className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-green-400 hover:text-green-300 whitespace-nowrap outline-none">
            Ver todos os artigos →
          </Link>
        </div>

        {series.map((s) => (
          <CarrosselSerie key={s.slug} nome={s.nome} slug={s.slug} itens={s.itens} rotulo={ROTULOS[s.slug]} />
        ))}

        <Link href="/artigos"
          className="md:hidden block text-center text-sm font-bold text-green-400 mt-2 outline-none">
          Ver todos os artigos →
        </Link>
      </div>
    </section>
  );
}
