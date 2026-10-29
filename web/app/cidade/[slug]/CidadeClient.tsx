"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import HeaderPublico from "../../components/HeaderPublico";
import { getCidadeBySlug, CIDADES_MT } from "../../data/cidades";
import { getCidadeDetalhe } from "../../data/cidades-detalhes";
import {
  MapPin, ArrowLeft, Building2, Newspaper, Home, ChevronRight,
  Calendar, Users, TrendingUp, ChevronLeft, Quote, Trophy,
} from "lucide-react";

const TIPO_LABELS: Record<string, string> = {
  RURAL: "Rural", CASA: "Casa", APARTAMENTO: "Apto",
  TERRENO: "Terreno", CHACARA: "Chácara",
  LOTEAMENTO: "Loteamento", COMERCIAL: "Comercial",
};

function formatPreco(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}
function formatData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CidadePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const cidade  = getCidadeBySlug(slug);
  const detalhe = getCidadeDetalhe(slug);

  const [imoveis,    setImoveis]    = useState<any[]>([]);
  const [noticias,   setNoticias]   = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // ── prev / next na lista de cidades ──
  const idx      = CIDADES_MT.findIndex(c => c.slug === slug);
  const prevCity = idx > 0 ? CIDADES_MT[idx - 1] : null;
  const nextCity = idx < CIDADES_MT.length - 1 ? CIDADES_MT[idx + 1] : null;

  // ── cidades próximas (mesma região, exceto a atual) ──
  const cidadesProximas = (() => {
    const mesmaRegiao = CIDADES_MT.filter(c => c.slug !== slug && c.regiao === cidade?.regiao);
    if (mesmaRegiao.length >= 2) return mesmaRegiao.slice(0, 3);
    return CIDADES_MT.filter(c => c.slug !== slug).slice(0, 3);
  })();

  useEffect(() => {
    if (!cidade) return;
    const api = process.env.NEXT_PUBLIC_API_URL;
    setCarregando(true);
    Promise.all([
      fetch(`${api}/imoveis?cidade=${encodeURIComponent(cidade.nomeBusca)}`).then(r => r.json()).catch(() => []),
      fetch(`${api}/noticias?cidade=${encodeURIComponent(cidade.nomeBusca)}`).then(r => r.json()).catch(() => []),
    ]).then(([imv, not]) => {
      setImoveis(Array.isArray(imv) ? imv : []);
      setNoticias(Array.isArray(not) ? not : []);
    }).finally(() => setCarregando(false));
  }, [cidade]);

  if (!cidade) {
    return (
      <div className="min-h-screen bg-[#f0f2f5]">
        <HeaderPublico />
        <div className="flex flex-col items-center justify-center py-32 text-gray-500">
          <MapPin className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-xl font-bold mb-2">Cidade não encontrada</p>
          <Link href="/cidades" className="text-blue-600 text-sm font-bold hover:underline">← Ver todas as cidades</Link>
        </div>
      </div>
    );
  }

  const imoveisAtivos = imoveis.filter(i => i.ativo && !i.vendido);

  const heroTitle = detalhe?.heroTitle ?? cidade.nome;
  const heroSub   = detalhe?.heroSub   ?? cidade.descricao;

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <HeaderPublico />

      {/* ══════════════════════════════════════════
          HERO — FULLSCREEN
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#0a1628]">
        {/* BG image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(180deg,rgba(10,22,40,0.3) 0%,rgba(10,22,40,0.6) 50%,rgba(10,22,40,1) 100%), url('${cidade.imagem}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Conteúdo hero */}
        <div className="relative z-10 flex flex-col flex-1 justify-end px-[5%] pb-0 pt-28 max-w-[1400px] mx-auto w-full">

          {/* Back + breadcrumb */}
          <button
            onClick={() => router.push("/cidades")}
            className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest mb-8 transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Todas as cidades
          </button>

          {/* Badge + score */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className={`text-[10px] font-black uppercase tracking-[0.18em] text-white px-3 py-1.5 rounded-md ${cidade.badgeColor}`}>
              {cidade.badge}
            </span>
            {cidade.score && (
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span className={`font-black text-base leading-none ${
                  cidade.score >= 8.0 ? "text-yellow-400" :
                  cidade.score >= 7.5 ? "text-green-400" :
                  cidade.score >= 7.0 ? "text-emerald-400" : "text-blue-400"
                }`}>{cidade.score.toFixed(1)}</span>
                <span className="text-white/40 text-[10px]">/ 10</span>
              </div>
            )}
          </div>

          {/* H1 editorial */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-black text-white leading-[1] tracking-tight mb-5 max-w-4xl">
            {heroTitle}
          </h1>

          <p className="text-white/55 text-base md:text-lg max-w-2xl leading-relaxed mb-12">
            {heroSub}
          </p>

          {/* Hero stats strip */}
          {detalhe?.heroStats && detalhe.heroStats.length > 0 ? (
            <div className="flex flex-wrap gap-px bg-white/10 rounded-2xl overflow-hidden mb-0 border border-white/10">
              {detalhe.heroStats.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col items-start px-6 py-5 bg-[#0a1628]/70 backdrop-blur flex-1 min-w-[130px]"
                >
                  <p className="text-2xl md:text-3xl font-black text-green-400 leading-none">{s.val}</p>
                  <p className="text-white/35 text-[10px] uppercase tracking-[0.14em] mt-2 leading-tight">{s.lbl}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-px bg-white/10 rounded-2xl overflow-hidden mb-0 border border-white/10">
              {[
                { val: carregando ? "—" : String(imoveisAtivos.length), lbl: "Imóveis ativos",      cor: "text-green-400" },
                { val: carregando ? "—" : String(noticias.length),      lbl: "Notícias",            cor: "text-green-400" },
                { val: cidade.populacao,                                  lbl: "População estimada",  cor: "text-green-400" },
                ...(cidade.score ? [{ val: cidade.score.toFixed(1), lbl: "Score UrbanoConnect",
                  cor: cidade.score >= 8.0 ? "text-yellow-400" : cidade.score >= 7.5 ? "text-green-400" : "text-emerald-400" }] : []),
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-start px-6 py-5 bg-[#0a1628]/70 backdrop-blur flex-1 min-w-[130px]">
                  <p className={`text-2xl font-black leading-none ${s.cor}`}>{s.val}</p>
                  <p className="text-white/35 text-[10px] uppercase tracking-[0.14em] mt-2">{s.lbl}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          IDENTIDADE — dark editorial (só se tem detalhe)
      ══════════════════════════════════════════ */}
      {detalhe && (
        <section className="bg-[#0d1523] py-20 px-[5%]">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Esquerda — pull quote + descrição */}
            <div>
              <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Identidade do município
              </p>

              <div className="border-l-4 border-green-500/60 pl-6 mb-8">
                <Quote className="w-5 h-5 text-green-500/40 mb-3" />
                <p className="text-white text-lg md:text-xl leading-relaxed italic font-medium">
                  {detalhe.pullQuote}
                </p>
              </div>

              <p className="text-white/60 text-sm md:text-base leading-relaxed">
                {detalhe.descricao}
              </p>
            </div>

            {/* Direita — tabela de dados */}
            <div>
              <p className="text-white/25 text-[11px] font-black uppercase tracking-[0.2em] mb-4">
                Ficha técnica
              </p>
              <div className="divide-y divide-white/[0.06]">
                {detalhe.tabelaIdentidade.map(row => (
                  <div key={row.label} className="flex items-start justify-between py-3 gap-4">
                    <span className="text-white/35 text-xs font-medium shrink-0 w-40">{row.label}</span>
                    <span className="text-white text-xs font-bold text-right">{row.valor}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          ANÁLISE ESTRUTURAL (só se tem analise)
      ══════════════════════════════════════════ */}
      {detalhe && detalhe.analise.length > 0 && (
        <section className="bg-[#f8f9fa] py-16 px-[5%]">
          <div className="max-w-[1400px] mx-auto">

            <div className="mb-10">
              <p className="text-blue-700 text-[11px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Análise Estrutural
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-[#1a2b3c]">
                O que os dados revelam sobre <span className="text-blue-600">{cidade.nome}</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {detalhe.analise.map(card => (
                <div
                  key={card.titulo}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className={`h-1.5 w-full ${card.acento}`} />
                  <div className="p-6">
                    <h3 className="font-black text-[#1a2b3c] text-sm mb-4 uppercase tracking-wide">
                      {card.titulo}
                    </h3>
                    <ul className="space-y-2.5">
                      {card.itens.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${card.acento}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          MERCADO IMOBILIÁRIO
      ══════════════════════════════════════════ */}
      <section className="bg-white py-16 px-[5%]">
        <div className="max-w-[1400px] mx-auto">

          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-blue-600 text-[11px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Mercado Imobiliário
              </p>
              <h2 className="text-2xl font-black text-[#1a2b3c]">
                Imóveis em {cidade.nome}
              </h2>
            </div>
            {imoveisAtivos.length > 0 && (
              <Link
                href={`/?cidade=${encodeURIComponent(cidade.nomeBusca)}`}
                className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline whitespace-nowrap"
              >
                Ver todos <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {carregando ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-bold">Carregando imóveis...</p>
            </div>
          ) : imoveisAtivos.length === 0 ? (
            <div className="bg-[#f8f9fa] rounded-2xl p-12 text-center">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-black text-gray-500">Nenhum imóvel cadastrado em {cidade.nome}</p>
              <p className="text-xs text-gray-400 mt-1">Seja o primeiro corretor a anunciar nesta cidade.</p>
              <Link href="/login" className="inline-block mt-4 text-xs font-bold text-blue-600 hover:underline">
                Cadastrar imóvel →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {imoveisAtivos.slice(0, 6).map((imovel: any) => (
                <Link
                  key={imovel.id}
                  href={`/imovel/${imovel.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {imovel.imagemPrincipal ? (
                      <img src={imovel.imagemPrincipal} alt={imovel.titulo}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home className="w-10 h-10 text-gray-300" /></div>
                    )}
                    <span className="absolute bottom-3 left-3 bg-blue-700 text-white text-[10px] font-black uppercase px-2 py-1 rounded">
                      {TIPO_LABELS[imovel.tipo] ?? imovel.tipo}
                    </span>
                    {imovel.scoreOportunidade != null && imovel.scoreOportunidade <= 0.9 && (
                      <span className="absolute bottom-3 right-3 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded">Oportunidade</span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="font-black text-[#1a2b3c] text-sm leading-tight mb-1 line-clamp-2">{imovel.titulo}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3" /> {imovel.bairro ? `${imovel.bairro}, ` : ""}{imovel.cidade}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-blue-700 font-black text-base">{formatPreco(imovel.preco)}</span>
                      <span className="text-xs text-gray-400">{imovel.areaTotal?.toLocaleString("pt-BR")} m²</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          NOTÍCIAS
      ══════════════════════════════════════════ */}
      <section className="bg-[#f8f9fa] py-16 px-[5%]">
        <div className="max-w-[1400px] mx-auto">

          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-green-600 text-[11px] font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" /> Notícias
              </p>
              <h2 className="text-2xl font-black text-[#1a2b3c]">
                Acontece em {cidade.nome}
              </h2>
            </div>
            {noticias.length > 0 && (
              <Link href="/noticias" className="text-xs font-bold text-green-600 flex items-center gap-1 hover:underline whitespace-nowrap">
                Todas as notícias <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {carregando ? (
            <div className="text-center py-8"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : noticias.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <Newspaper className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="font-black text-gray-500">Nenhuma notícia registrada para {cidade.nome}</p>
              <p className="text-xs text-gray-400 mt-1">As notícias vinculadas a esta cidade aparecem aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {noticias.slice(0, 6).map((n: any) => (
                <Link
                  key={n.id}
                  href={`/noticia/${n.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col"
                >
                  {n.imagemCapa && (
                    <div className="relative h-40 overflow-hidden">
                      <img src={n.imagemCapa} alt={n.titulo}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute top-2 left-2 bg-green-700 text-white text-[10px] font-black uppercase px-2 py-1 rounded">
                        {n.categoria?.replace("_", " ")}
                      </span>
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-black text-[#1a2b3c] text-sm leading-snug mb-2 line-clamp-3">{n.titulo}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed flex-1 line-clamp-2">{n.resumo}</p>
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatData(n.dataPublicacao)}
                      </span>
                      {n.autor && <span className="text-xs text-gray-400">{n.autor}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CIDADES PRÓXIMAS
      ══════════════════════════════════════════ */}
      {cidadesProximas.length > 0 && (
        <section className="bg-[#0d1523] py-14 px-[5%]">
          <div className="max-w-[1400px] mx-auto">
            <p className="text-white/30 text-[11px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> {cidade.regiao}
            </p>
            <h2 className="text-xl md:text-2xl font-black text-white mb-6">
              Cidades da mesma região
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {cidadesProximas.map(c => (
                <Link
                  key={c.slug}
                  href={`/cidade/${c.slug}`}
                  className="group relative rounded-2xl overflow-hidden min-h-[180px] flex flex-col justify-end hover:-translate-y-1 transition-all duration-300"
                >
                  <img src={c.imagem} alt={c.nome} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  {c.score && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur px-2 py-1 rounded-full">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span className="text-yellow-300 text-xs font-black">{c.score.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="relative p-4">
                    <span className={`text-[9px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded mb-1.5 inline-block ${c.badgeColor}`}>
                      {c.badge}
                    </span>
                    <h3 className="text-white font-black text-base leading-tight">{c.nome}</h3>
                    <p className="text-white/45 text-xs mt-0.5">{c.populacao}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          MANIFESTO CTA (só se tem detalhe)
      ══════════════════════════════════════════ */}
      {detalhe && (
        <section className="relative py-28 px-[5%] overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(135deg,rgba(10,22,40,0.96) 0%,rgba(0,29,61,0.92) 50%,rgba(0,53,102,0.88) 100%), url('${cidade.imagem}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.22em] mb-6">
              Urbano Connect · {cidade.nome} · MT
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-8">
              "{detalhe.manifestoQuote}"
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href={`/?cidade=${encodeURIComponent(cidade.nomeBusca)}`}
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-black text-sm px-8 py-4 rounded-full transition-all"
              >
                <Building2 className="w-4 h-4" /> Ver imóveis em {cidade.nome}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm px-8 py-4 rounded-full transition-all"
              >
                Anunciar nesta cidade
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          NAVEGAÇÃO ENTRE CIDADES
      ══════════════════════════════════════════ */}
      <nav className="bg-[#0a1628] border-t border-white/5 py-6 px-[5%]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">

          {prevCity ? (
            <Link
              href={`/cidade/${prevCity.slug}`}
              className="flex items-center gap-3 group text-white/50 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Anterior</p>
                <p className="text-sm font-black">{prevCity.nome}</p>
              </div>
            </Link>
          ) : <div />}

          <Link href="/cidades" className="text-white/30 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">
            Todas as cidades
          </Link>

          {nextCity ? (
            <Link
              href={`/cidade/${nextCity.slug}`}
              className="flex items-center gap-3 group text-white/50 hover:text-white transition-colors text-right"
            >
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5">Próxima</p>
                <p className="text-sm font-black">{nextCity.nome}</p>
              </div>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : <div />}

        </div>
      </nav>

      {/* ── FOOTER ── */}
      <footer className="bg-[#020d1a] text-white/20 text-xs text-center py-6">
        © {new Date().getFullYear()} Urbano Connect · Inteligência Imobiliária em Mato Grosso
      </footer>
    </div>
  );
}
