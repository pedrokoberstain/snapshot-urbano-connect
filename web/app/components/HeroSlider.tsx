"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Slide = {
  id?: number | string;
  tag?: string;
  categoria?: string;
  titulo: string;
  resumo?: string;
  imagem?: string;
  imagemCapa?: string;
};

type Cotacao = { produto: string; valor: string; variacao: string };
type Indicador = { simbolo?: string; nome: string; valor: number; variacao: number; unidade: string };

const CATEGORIA_LABEL: Record<string, string> = {
  AGRONEGOCIO: "Agronegócio", AVIACAO: "Aviação", ECONOMIA: "Economia",
  CIDADES: "Cidades", FAZENDAS: "Fazendas", INDUSTRIA: "Indústria",
};

const TAGS_POPULARES = ["Cuiabá", "Sinop", "Sorriso", "Lucas do Rio Verde", "Rondonópolis"];

type Props = {
  slides: Slide[] | null;
  cotacoes: Cotacao[];
  indicadores: Indicador[];
  cidadeBusca: string;
  setCidadeBusca: (v: string) => void;
  categoriaAtiva: string;
  setCategoriaAtiva: (v: string) => void;
  onBuscar: () => void;
  onTagRapida: (tag: string) => void;
  intervaloMs?: number;
};

// Toda a hero (slider, busca, dots, ticker) fica aqui. Quando o slider troca a
// cada 7s, so este subtree re-renderiza — a home pai (com os imoveis) nao sofre.
export default function HeroSlider({
  slides, cotacoes, indicadores,
  cidadeBusca, setCidadeBusca, categoriaAtiva, setCategoriaAtiva,
  onBuscar, onTagRapida, intervaloMs = 7000,
}: Props) {
  const [slideAtual, setSlideAtual] = useState(0);
  const slidesAtivos = slides ?? [];
  const total = slidesAtivos.length;

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setSlideAtual(p => (p + 1) % total), intervaloMs);
    return () => clearInterval(t);
  }, [total, intervaloMs]);

  // So mantem 3 slides no DOM (anterior, atual, proximo). Antes: as 15+
  // ficavam todas la, todas rodando animacao de scale em paralelo.
  const visiveis = useMemo(() => {
    if (total === 0) return [];
    const prev = (slideAtual - 1 + total) % total;
    const next = (slideAtual + 1) % total;
    return Array.from(new Set([prev, slideAtual, next]));
  }, [slideAtual, total]);

  // Dots com janela deslizante: em vez de mostrar as 15+ bolinhas todas em fila,
  // uma faixa de ~180px exibe ~5 por vez e desliza para centralizar a ativa,
  // com fade nas bordas. Sem quebrar o hero em varias linhas quando ha muitos.
  const dotsOffset = useMemo(() => {
    const INACTIVE = 12, ACTIVE = 40, GAP = 8, WINDOW = 180;
    if (total <= 1) return 0;
    const stripWidth = (total - 1) * (INACTIVE + GAP) + ACTIVE;
    if (stripWidth <= WINDOW) return 0;
    const activeCenter = slideAtual * (INACTIVE + GAP) + ACTIVE / 2;
    const raw = -(activeCenter - WINDOW / 2);
    return Math.max(-(stripWidth - WINDOW), Math.min(0, raw));
  }, [slideAtual, total]);

  // Serializa cotacoes + indicadores em uma lista de itens do ticker, memoizada
  // para nao remontar a cada tick do slider.
  const tickerItens = useMemo(() => {
    const dosIndicadores = indicadores.map(ind => ({
      produto: ind.nome,
      valor: ind.unidade === "R$" ? `R$ ${ind.valor.toFixed(4)}` : `${ind.valor.toFixed(2)} ${ind.unidade}`,
      variacao: ind.variacao !== 0 ? `${ind.variacao > 0 ? "+" : ""}${ind.variacao.toFixed(2)}%` : "",
    }));
    return [...cotacoes, ...dosIndicadores];
  }, [cotacoes, indicadores]);

  const slide = slidesAtivos[slideAtual];
  const slideTag = slide ? (slide.tag ?? CATEGORIA_LABEL[slide.categoria ?? ""] ?? slide.categoria) : "";

  const renderVariacao = (v: string) => {
    if (!v) return null;
    const n = parseFloat(v.replace(",", "."));
    const cls = n > 0 ? "text-green-400 bg-green-500/10" : n < 0 ? "text-red-400 bg-red-500/10" : "text-gray-400 bg-gray-500/10";
    const Icon = n > 0 ? TrendingUp : n < 0 ? TrendingDown : Minus;
    return <span className={`flex items-center font-bold text-xs ml-2 px-1.5 py-0.5 rounded ${cls}`}><Icon className="w-3 h-3 mr-1" />{v}</span>;
  };

  return (
    <section className="relative w-full h-[92vh] min-h-[680px] flex flex-col overflow-hidden bg-[#0a1628]">

      {/* Backgrounds — apenas 3 no DOM */}
      {visiveis.map(i => {
        const s = slidesAtivos[i];
        const ativo = i === slideAtual;
        return (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${ativo ? "opacity-100" : "opacity-0"}`}
            style={{ willChange: ativo ? "opacity" : undefined }}
          >
            <img
              src={s.imagem ?? s.imagemCapa ?? ""}
              alt={s.titulo}
              className="w-full h-full object-cover"
              loading={ativo ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={ativo ? "high" : "low"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/65 to-[#0a1628]/25" />
          </div>
        );
      })}

      {/* Conteudo */}
      <div className="relative z-10 flex flex-col justify-center flex-1 max-w-[1400px] mx-auto w-full px-6 md:px-12 pt-20 pb-4">

        {slide ? (
          <>
            <span className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-300 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full w-fit mb-5">
              {slideTag}
            </span>
            <Link href={`/noticia/${slide.id}`} className="group outline-none w-fit">
              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-white leading-[1.05] tracking-tight max-w-3xl mb-4 group-hover:text-green-300 transition-colors duration-200">
                {slide.titulo}
              </h1>
            </Link>
            <p className="text-white/55 text-base md:text-lg max-w-2xl leading-relaxed mb-8 line-clamp-3">
              {slide.resumo}
            </p>
          </>
        ) : (
          <div className="mb-8">
            <div className="h-5 w-32 bg-white/10 rounded-full animate-pulse mb-5" />
            <div className="h-12 w-[600px] max-w-full bg-white/10 rounded-xl animate-pulse mb-3" />
            <div className="h-10 w-[480px] max-w-full bg-white/10 rounded-xl animate-pulse mb-3" />
            <div className="h-5 w-[400px] max-w-full bg-white/5 rounded-lg animate-pulse" />
          </div>
        )}

        {/* Barra de busca */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex flex-col md:flex-row gap-2 max-w-2xl shadow-2xl mb-5">
          <div className="flex items-center gap-3 flex-1 px-4 py-3">
            <Search className="w-5 h-5 text-white/40 shrink-0" />
            <input
              type="text"
              placeholder="Cidade, bairro ou tipo de imóvel..."
              value={cidadeBusca}
              onChange={e => setCidadeBusca(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onBuscar()}
              className="bg-transparent outline-none text-white placeholder-white/35 font-bold w-full text-sm"
            />
          </div>
          <select
            value={categoriaAtiva}
            onChange={e => setCategoriaAtiva(e.target.value)}
            className="bg-white/10 border border-white/10 text-white/80 font-bold text-sm px-4 py-3 rounded-xl outline-none cursor-pointer appearance-none md:w-44"
          >
            <option value="" className="bg-[#1a2b3c]">Todos os tipos</option>
            <option value="RURAL" className="bg-[#1a2b3c]">Rural / Fazenda</option>
            <option value="CASA" className="bg-[#1a2b3c]">Casa / Chácara</option>
            <option value="APARTAMENTO" className="bg-[#1a2b3c]">Apartamento</option>
          </select>
          <button
            onClick={onBuscar}
            className="bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-sm px-8 py-3 rounded-xl transition-all active:scale-95 shrink-0 outline-none"
          >
            Buscar
          </button>
        </div>

        {/* Buscas rapidas */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white/30 text-xs font-bold uppercase tracking-wide">Populares:</span>
          {TAGS_POPULARES.map(tag => (
            <button
              key={tag}
              onClick={() => onTagRapida(tag)}
              className="text-white/55 hover:text-green-300 text-xs font-bold bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full transition-all outline-none border border-white/10"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Dots com janela deslizante */}
      <div className="relative z-10 flex items-center gap-4 px-6 md:px-12 pb-14 max-w-[1400px] mx-auto w-full">
        <div
          className="relative overflow-hidden"
          style={{
            width: "180px",
            maskImage: "linear-gradient(90deg, transparent, black 15%, black 85%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, black 15%, black 85%, transparent)",
          }}
        >
          <div
            className="flex gap-2 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(${dotsOffset}px)` }}
          >
            {slidesAtivos.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideAtual(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className={`h-1.5 shrink-0 rounded-full transition-all duration-500 outline-none ${i === slideAtual ? "w-10 bg-green-400" : "w-3 bg-white/25 hover:bg-white/50"}`}
              />
            ))}
          </div>
        </div>
        {total > 6 && (
          <span className="text-white/50 text-[11px] font-bold tabular-nums tracking-wider shrink-0">
            {String(slideAtual + 1).padStart(2, "0")} <span className="text-white/25">/</span> {String(total).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Ticker CEPEA/B3 + BCB */}
      {tickerItens.length > 0 && (
        <div className="absolute bottom-0 left-0 w-full bg-[#09090f]/90 backdrop-blur-md border-t border-white/10 z-20 flex items-center overflow-hidden h-12">
          <div className="flex items-center h-full px-5 bg-green-600 z-10 shrink-0 relative">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">CEPEA/B3 · BCB</span>
            <div className="absolute right-[-12px] top-0 w-0 h-0 border-y-[24px] border-y-transparent border-l-[12px] border-l-green-600" />
          </div>
          <div className="flex flex-1 overflow-hidden ml-6">
            <div className="animate-marquee flex items-center gap-12 whitespace-nowrap">
              {[...tickerItens, ...tickerItens].map((c, i) => (
                <div key={`ticker-${i}`} className="flex items-center gap-2">
                  <span className="uppercase text-gray-400 font-bold text-xs tracking-wider">{c.produto}:</span>
                  <span className="text-white font-black text-sm">{c.valor}</span>
                  {renderVariacao(c.variacao)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      ` }} />
    </section>
  );
}
