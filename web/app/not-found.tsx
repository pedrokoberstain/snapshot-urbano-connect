import Link from "next/link";
import Image from "next/image";
import { CIDADES_MT } from "./data/cidades";
import { MapPin, Newspaper, Building2, ChevronRight } from "lucide-react";

export default function NotFound() {
  const destaque = CIDADES_MT.filter(c => c.destaque).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header mínimo */}
      <header className="px-6 py-5 flex items-center justify-between max-w-[1400px] mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-icon.png" alt="Urbano Connect" width={38} height={38} unoptimized />
          <span className="text-xl font-black tracking-tighter text-white">
            urbano<span className="text-green-500">connect</span>
          </span>
        </Link>
        <Link href="/" className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
          ← Início
        </Link>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.25em] mb-4">Erro 404</p>
        <h1 className="text-7xl md:text-9xl font-black text-white/10 leading-none mb-2 select-none">404</h1>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
          Página não encontrada
        </h2>
        <p className="text-white/40 text-base max-w-md leading-relaxed mb-10">
          O endereço que você acessou não existe ou foi movido. Mas Mato Grosso tem muito mais para explorar.
        </p>

        {/* Ações */}
        <div className="flex flex-wrap gap-3 justify-center mb-16">
          <Link href="/" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-black text-sm px-6 py-3 rounded-full transition-all">
            <Building2 className="w-4 h-4" /> Ver imóveis
          </Link>
          <Link href="/cidades" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm px-6 py-3 rounded-full transition-all">
            <MapPin className="w-4 h-4" /> Explorar cidades
          </Link>
          <Link href="/noticias" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm px-6 py-3 rounded-full transition-all">
            <Newspaper className="w-4 h-4" /> Ler notícias
          </Link>
        </div>

        {/* Cidades em destaque */}
        <div className="w-full max-w-2xl">
          <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-4">Destinos populares</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {destaque.map(c => (
              <Link
                key={c.slug}
                href={`/cidade/${c.slug}`}
                className="group relative rounded-xl overflow-hidden h-24"
              >
                <img src={c.imagem} alt={c.nome} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 p-2.5 flex items-end justify-between w-full">
                  <p className="text-white font-black text-xs leading-tight">{c.nome}</p>
                  <ChevronRight className="w-3 h-3 text-white/50 group-hover:text-white transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-white/15 text-xs">
        © {new Date().getFullYear()} Urbano Connect · MT
      </footer>
    </div>
  );
}
