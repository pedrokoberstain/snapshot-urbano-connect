"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import HeaderPublico from "../../components/HeaderPublico";
import { ArrowLeft, Layers, Loader2, ArrowRight, Calendar } from "lucide-react";

const LABELS: Record<string, string> = {
  AGRONEGOCIO: "Agronegócio",
  AVIACAO:     "Aviação",
  ECONOMIA:    "Economia",
  CIDADES:     "Cidades",
  FAZENDAS:    "Fazendas",
  INDUSTRIA:   "Indústria",
};

const CORES: Record<string, string> = {
  AGRONEGOCIO: "bg-green-600",
  AVIACAO:     "bg-cyan-700",
  ECONOMIA:    "bg-cyan-800",
  CIDADES:     "bg-slate-600",
  FAZENDAS:    "bg-green-700",
  INDUSTRIA:   "bg-slate-700",
};

export default function SeriePage() {
  const { slug }  = useParams();
  const router    = useRouter();
  const [partes, setPartes]         = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias/serie/${slug}`)
      .then(r => r.json())
      .then(d => setPartes(Array.isArray(d) ? d : []))
      .catch(() => setPartes([]))
      .finally(() => setCarregando(false));
  }, [slug]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </main>
    );
  }

  if (partes.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 font-sans">
        <HeaderPublico />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-gray-500 font-medium text-lg">Série não encontrada.</p>
          <button onClick={() => router.push("/noticias")} className="text-green-600 font-bold hover:text-green-700">
            ← Voltar para notícias
          </button>
        </div>
      </main>
    );
  }

  const nomeSerie = partes[0]?.serie ?? "Série";

  return (
    <main className="min-h-screen bg-[#f4f6f8] font-sans">
      <HeaderPublico />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="max-w-[1100px] mx-auto px-4 md:px-6 flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-green-600 transition-colors font-medium">Home</Link>
          <span className="text-gray-300">›</span>
          <Link href="/noticias" className="hover:text-green-600 transition-colors font-medium">Notícias</Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-700 font-semibold line-clamp-1">{nomeSerie}</span>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-10">

        {/* Cabeçalho da série */}
        <div className="bg-gradient-to-br from-[#0d1b2e] to-[#0a0f1c] rounded-2xl p-8 md:p-12 mb-8 relative overflow-hidden">
          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/[0.04] hidden md:block">
            <Layers className="w-40 h-40" />
          </span>
          <span className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <Layers className="w-3.5 h-3.5" /> Dossiê · {partes.length} partes
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight max-w-3xl">
            {nomeSerie}
          </h1>
          <p className="text-white/50 mt-4 max-w-2xl leading-relaxed">
            Uma série especial em {partes.length} {partes.length === 1 ? "parte" : "partes"}. Acompanhe na ordem ou escolha por onde começar.
          </p>
        </div>

        {/* Lista de partes */}
        <ol className="flex flex-col gap-4">
          {partes.map((p, i) => (
            <li key={p.id}>
              <Link
                href={`/noticia/${p.id}`}
                className="group flex flex-col sm:flex-row gap-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-green-200 hover:shadow-md transition-all"
              >
                {p.imagemCapa ? (
                  <img src={p.imagemCapa} alt={p.titulo} className="w-full sm:w-56 h-40 object-cover shrink-0" />
                ) : (
                  <div className="w-full sm:w-56 h-40 bg-gray-100 flex items-center justify-center shrink-0">
                    <Layers className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0 p-5 sm:py-5 sm:pr-6 sm:pl-0 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 shrink-0 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-black">
                      {p.parteNumero ?? i + 1}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded text-white ${CORES[p.categoria] ?? "bg-gray-500"}`}>
                      {LABELS[p.categoria] ?? p.categoria}
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-gray-900 leading-snug group-hover:text-green-700 transition-colors line-clamp-2">
                    {p.titulo}
                  </h2>
                  {p.resumo && (
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2" dangerouslySetInnerHTML={{ __html: p.resumo }} />
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-gray-400 font-semibold mt-auto pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-green-500" />
                      {new Date(p.dataPublicacao).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1 text-green-600 group-hover:gap-2 transition-all ml-auto">
                      Ler parte {p.parteNumero ?? i + 1} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>

        {/* Voltar */}
        <div className="mt-10">
          <button
            onClick={() => router.push("/noticias")}
            className="flex items-center gap-2 text-gray-400 text-sm font-bold hover:text-green-600 transition-colors outline-none"
          >
            <ArrowLeft className="w-4 h-4" /> Todas as notícias
          </button>
        </div>
      </div>
    </main>
  );
}
