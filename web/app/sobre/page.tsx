"use client";

import Link from "next/link";
import HeaderPublico from "../components/HeaderPublico";
import {
  Magnet, Brain, Cog, Zap,
  X, Check,
  Globe, Users, BarChart2, FileText,
  Mail, ShieldCheck, Handshake, MapPin,
  FlaskConical, Building2, LineChart, DollarSign, Search, TrendingUp,
} from "lucide-react";

const PILARES = [
  {
    icon: Magnet,
    titulo: "Atração",
    descricao: "Conteúdo informacional, análises de mercado e produção de autoridade que geram demanda orgânica e qualificada.",
    cor: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    iconCor: "text-blue-400",
    acento: "bg-blue-500",
  },
  {
    icon: Brain,
    titulo: "Inteligência",
    descricao: "Econometria, comportamento do usuário e dados públicos transformados em índices proprietários de mercado.",
    cor: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
    iconCor: "text-violet-400",
    acento: "bg-violet-500",
  },
  {
    icon: Cog,
    titulo: "Operação",
    descricao: "CRM orientado a conversão, gestão de imóveis, contratos automatizados e administração de locação integrada.",
    cor: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    iconCor: "text-emerald-400",
    acento: "bg-emerald-500",
  },
  {
    icon: Zap,
    titulo: "Conversão",
    descricao: "Geração e entrega de leads qualificados, conexão com corretores e fechamento de negócios com menos cliques.",
    cor: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    iconCor: "text-amber-400",
    acento: "bg-amber-500",
  },
];

const CAMADAS = [
  {
    num: "01",
    titulo: "Aquisição",
    itens: ["Conteúdo", "SEO", "Notícias"],
    grad: "from-blue-600 to-blue-900",
  },
  {
    num: "02",
    titulo: "Inteligência",
    itens: ["Análise de dados", "Comportamento", "Econometria"],
    grad: "from-violet-600 to-violet-900",
  },
  {
    num: "03",
    titulo: "Operação",
    itens: ["CRM", "Leads", "Contratos"],
    grad: "from-emerald-600 to-emerald-900",
  },
  {
    num: "04",
    titulo: "Conversão",
    itens: ["Geração de leads", "Corretores", "Fechamento"],
    grad: "from-amber-500 to-orange-700",
  },
];

const CANAIS = [
  { icon: Mail,        label: "E-mail geral",        value: "contato@urbanoconnect.com.br",     href: "mailto:contato@urbanoconnect.com.br" },
  { icon: Handshake,   label: "Parcerias",           value: "parcerias@urbanoconnect.com.br",   href: "mailto:parcerias@urbanoconnect.com.br" },
  { icon: ShieldCheck, label: "Privacidade / DPO",   value: "privacidade@urbanoconnect.com.br", href: "mailto:privacidade@urbanoconnect.com.br" },
  { icon: MapPin,      label: "Localização",         value: "Tangará da Serra · MT · Brasil",   href: null },
];

const VARIAVEIS = [
  {
    icon: Building2,
    titulo: "Estruturais",
    borda: "border-green-500/40",
    iconCor: "text-green-400",
    itens: ["Área (m²)", "Tipo de imóvel", "Padrão de acabamento", "Nº de quartos e banheiros", "Varandas e salas"],
  },
  {
    icon: MapPin,
    titulo: "Locacionais",
    borda: "border-blue-500/40",
    iconCor: "text-blue-400",
    itens: ["Endereço e bairro", "Cidade e microrregião", "Qualidade da rua", "Geolocalização (lat/lng)", "Infraestrutura do entorno"],
  },
  {
    icon: LineChart,
    titulo: "Econômicas",
    borda: "border-emerald-500/40",
    iconCor: "text-emerald-400",
    itens: ["Preço de venda", "Valor de aluguel", "Preço por m²", "Valor venal (IPTU)", "Histórico de transações"],
  },
  {
    icon: FileText,
    titulo: "Dados IPTU",
    borda: "border-amber-500/40",
    iconCor: "text-amber-400",
    itens: ["Valor venal oficial", "Área construída", "Área do terreno", "Uso do imóvel", "Padrão fiscal"],
  },
];

const INDICES = [
  { icon: DollarSign, titulo: "Preço por m²", desc: "Índice de valor médio por metro quadrado por bairro e cidade", grad: "from-violet-600 to-violet-900" },
  { icon: Zap, titulo: "Liquidez", desc: "Velocidade de absorção do estoque disponível no mercado", grad: "from-blue-600 to-blue-900" },
  { icon: Search, titulo: "Escassez", desc: "Relação entre demanda ativa e oferta disponível no período", grad: "from-orange-600 to-red-900" },
  { icon: TrendingUp, titulo: "Valorização", desc: "Variação do preço médio por m² em série histórica", grad: "from-emerald-600 to-emerald-900" },
];

const SCORE_STEPS = [
  { num: "1", titulo: "Coleta", desc: "Dados públicos, anúncios e IPTU consolidados por cidade", cor: "bg-violet-500" },
  { num: "2", titulo: "Normalização", desc: "Variáveis padronizadas em escala 0–10 por critério", cor: "bg-blue-500" },
  { num: "3", titulo: "Ponderação", desc: "31 critérios com pesos diferenciados por dimensão", cor: "bg-emerald-500" },
  { num: "4", titulo: "Cruzamento", desc: "Preço de mercado × valor venal para detectar oportunidades", cor: "bg-amber-500" },
  { num: "5", titulo: "Score Final", desc: "Nota consolidada publicada na plataforma por município", cor: "bg-orange-500" },
];

const DIFERENCIAIS = [
  {
    positivo: false,
    titulo: "Portais não geram inteligência",
    descricao: "Listam imóveis, mas não interpretam o mercado, não constroem autoridade e não geram demanda estruturada.",
  },
  {
    positivo: false,
    titulo: "CRMs não geram demanda",
    descricao: "Organizam processos e automatizam tarefas, mas não atraem clientes nem criam ecossistema de dados.",
  },
  {
    positivo: true,
    titulo: "UrbanoConnect faz os dois",
    descricao: "Monetiza atenção, informação e transação simultaneamente. Quem controla dados e leads, controla o mercado.",
  },
];

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-[#09090f] font-sans">
      <HeaderPublico />

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-24 px-6 md:px-12 overflow-hidden bg-[#09090f]">
        {/* Glow de fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Marca d'água */}
        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[220px] font-black text-white/[0.02] select-none pointer-events-none leading-none hidden lg:block">
          UC
        </span>

        <div className="max-w-[1400px] mx-auto relative z-10">
          <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            Nossa Alma
          </span>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.02] tracking-tight mb-6">
            Sobre o{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
              Projeto
            </span>
          </h1>

          <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full mb-8" />

          <p className="text-white/50 text-xl max-w-2xl leading-relaxed">
            Uma infraestrutura inteligente de geração, análise e conversão do mercado imobiliário urbano.
            Não somos um portal. Não somos um CRM.{" "}
            <span className="text-white/80 font-semibold">Somos outra coisa.</span>
          </p>
        </div>
      </section>

      {/* ── MANIFESTO ── */}
      <section className="relative bg-gradient-to-br from-[#0d1b2e] to-[#0a0f1c] py-20 px-6 md:px-12 overflow-hidden border-y border-white/5">
        <span className="absolute right-6 top-0 text-[280px] font-black text-white/[0.025] select-none pointer-events-none leading-none font-serif hidden lg:block">
          "
        </span>
        <div className="max-w-[1400px] mx-auto relative z-10">
          <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light italic text-blue-100/80 leading-relaxed max-w-4xl">
            "O UrbanoConnect foi concebido como uma{" "}
            <strong className="font-black not-italic text-white">
              plataforma de inteligência e orquestração do mercado imobiliário urbano
            </strong>{" "}
            — capaz de antecipar, interpretar e converter a demanda imobiliária antes que ela se manifeste.
            Não competimos por volume.{" "}
            <strong className="font-black not-italic text-green-400">Competimos por inteligência.</strong>"
          </blockquote>
          <cite className="block mt-8 text-xs font-black uppercase tracking-[0.2em] text-white/25 not-italic">
            — Princípio Fundador · UrbanoConnect 2025
          </cite>
        </div>
      </section>

      {/* ── PILARES ── */}
      <section className="py-24 px-6 md:px-12 bg-[#09090f]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3">O que somos</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-16">
            Quatro Pilares que nos Definem
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILARES.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.titulo}
                  className={`relative rounded-2xl border bg-gradient-to-br ${p.cor} p-8 flex flex-col gap-5 overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}
                >
                  <div className={`absolute top-0 left-0 w-full h-0.5 ${p.acento}`} />
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Icon className={`w-7 h-7 ${p.iconCor}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-xl mb-2">{p.titulo}</h3>
                    <p className="text-white/45 text-sm leading-relaxed">{p.descricao}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CAMADAS ── */}
      <section className="py-24 px-6 md:px-12 bg-[#050709]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3">Arquitetura em camadas</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-16">
            Como o Sistema Opera
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
            {CAMADAS.map((c) => (
              <div
                key={c.num}
                className={`bg-gradient-to-br ${c.grad} rounded-2xl p-8 flex flex-col gap-4`}
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Camada {c.num}
                </span>
                <h3 className="text-white font-black text-2xl">{c.titulo}</h3>
                <ul className="space-y-1.5 mt-1">
                  {c.itens.map((item) => (
                    <li key={item} className="text-white/70 text-sm font-medium flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-white/40 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAIS ── */}
      <section className="py-24 px-6 md:px-12 bg-[#09090f]">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3">Por que somos diferentes</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-16">
            O que o Mercado Não Entrega
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DIFERENCIAIS.map((d) => (
              <div
                key={d.titulo}
                className={`rounded-2xl border p-8 flex flex-col gap-5 ${
                  d.positivo
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-white/3 border-white/8"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    d.positivo
                      ? "bg-green-500/15 text-green-400"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  {d.positivo
                    ? <Check className="w-6 h-6" />
                    : <X className="w-6 h-6" />
                  }
                </div>
                <div>
                  <h3 className={`font-black text-lg mb-2 ${d.positivo ? "text-green-400" : "text-white/70"}`}>
                    {d.titulo}
                  </h3>
                  <p className="text-white/40 text-sm leading-relaxed">{d.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── METODOLOGIA ── */}
      <section id="metodologia" className="py-24 px-6 md:px-12 bg-[#050709] border-t border-white/5 scroll-mt-24">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
            <FlaskConical className="w-3.5 h-3.5" /> Ciência & Método
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Nossa Metodologia</h2>
          <p className="text-white/50 text-lg max-w-2xl leading-relaxed mb-12">
            Usamos o modelo hedônico de precificação combinado com análise comportamental e dados públicos
            para gerar inteligência imobiliária real — não apenas listar imóveis.
          </p>

          {/* Fórmula */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0d1b2e] to-[#0a0f1c] border border-white/10 px-6 md:px-10 py-8 text-center mb-14">
            <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.2em] mb-4">Modelo Hedônico de Precificação</p>
            <div className="inline-block rounded-xl bg-white/5 border border-white/10 px-5 md:px-8 py-5 font-mono text-sm md:text-xl font-bold text-white/90 leading-relaxed">
              Preço = ƒ( área · localização · tipo · padrão · estrutura · qualidade urbana )
            </div>
          </div>

          {/* Variáveis */}
          <h3 className="text-white font-black text-xl mb-6">O que entra no cálculo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {VARIAVEIS.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.titulo} className={`rounded-2xl border-t-4 ${v.borda} bg-white/3 border border-white/8 p-7`}>
                  <h4 className={`flex items-center gap-2.5 text-sm font-black uppercase tracking-wide mb-5 ${v.iconCor}`}>
                    <Icon className="w-5 h-5" /> {v.titulo}
                  </h4>
                  <ul className="space-y-2.5">
                    {v.itens.map((item) => (
                      <li key={item} className="text-white/55 text-sm flex items-center gap-2 border-b border-white/5 pb-2.5 last:border-0">
                        <span className="text-green-500 font-black">›</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Índices */}
          <h3 className="text-white font-black text-xl mb-6">O que geramos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {INDICES.map((i) => {
              const Icon = i.icon;
              return (
                <div key={i.titulo} className={`bg-gradient-to-br ${i.grad} rounded-2xl p-8 text-center flex flex-col items-center gap-3`}>
                  <Icon className="w-9 h-9 text-white" />
                  <h5 className="text-white font-black text-lg">{i.titulo}</h5>
                  <p className="text-white/75 text-sm leading-relaxed">{i.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Score */}
          <h3 className="text-white font-black text-xl mb-8">Como calculamos o Score UrbanoConnect</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {SCORE_STEPS.map((s) => (
              <div key={s.num} className="flex flex-col items-center text-center gap-3">
                <div className={`w-14 h-14 rounded-full ${s.cor} flex items-center justify-center text-xl font-black text-white`}>
                  {s.num}
                </div>
                <h6 className="text-white font-black text-sm">{s.titulo}</h6>
                <p className="text-white/45 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FALE CONOSCO ── */}
      <section id="contato" className="py-24 px-6 md:px-12 bg-[#09090f] border-t border-white/5 scroll-mt-24">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3">Fale conosco</p>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-16">
            Canais de Contato
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {CANAIS.map((c) => {
              const Icon = c.icon;
              const inner = (
                <>
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{c.label}</div>
                    <div className="text-sm font-semibold text-white break-words">{c.value}</div>
                  </div>
                </>
              );
              return c.href ? (
                <a key={c.label} href={c.href} className="flex items-center gap-4 rounded-2xl bg-white/3 border border-white/8 p-5 hover:border-green-500/30 hover:bg-white/5 transition-all">
                  {inner}
                </a>
              ) : (
                <div key={c.label} className="flex items-center gap-4 rounded-2xl bg-white/3 border border-white/8 p-5">
                  {inner}
                </div>
              );
            })}
          </div>

          {/* DPO / LGPD */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0d1b2e] to-[#0a0f1c] border border-white/8 p-10 md:p-12 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <ShieldCheck className="w-14 h-14 text-green-400 shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-black text-white mb-2">Encarregado de Proteção de Dados (DPO)</h3>
              <p className="text-white/50 leading-relaxed max-w-2xl">
                Para exercer seus direitos previstos na LGPD (Lei 13.709/2018) ou tirar dúvidas sobre o tratamento
                dos seus dados, fale com nosso DPO ou consulte a Política de Privacidade.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a href="mailto:privacidade@urbanoconnect.com.br" className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                <Mail className="w-4 h-4" /> Falar com o DPO
              </a>
              <Link href="/privacidade" className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold px-6 py-3 rounded-xl border border-white/10 transition-all">
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 md:px-12 bg-[#050709] border-t border-white/5">
        <div className="max-w-[1400px] mx-auto text-center flex flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
            Faça parte
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white max-w-2xl leading-tight">
            Inteligência imobiliária ao alcance do corretor moderno
          </h2>
          <p className="text-white/40 max-w-lg leading-relaxed">
            Acesse análises de mercado exclusivas, gerencie seus imóveis e conecte-se com compradores qualificados em Mato Grosso.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            <Link
              href="/planos"
              className="bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest px-10 py-4 rounded-xl transition-all shadow-lg hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] active:scale-95"
            >
              Ver Planos PRO
            </Link>
            <Link
              href="/"
              className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold px-10 py-4 rounded-xl border border-white/10 transition-all"
            >
              Explorar Imóveis
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
            {[["Cidades", "/cidades"], ["Regiões", "/regioes"], ["Metodologia", "#metodologia"], ["Notícias", "/noticias"], ["Planos", "/planos"], ["Contato", "#contato"]].map(([label, href]) => (
              <Link key={href} href={href} className="text-white/30 hover:text-white text-xs font-bold uppercase tracking-wide transition-colors">{label}</Link>
            ))}
          </nav>
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} Urbano Connect · MT</p>
        </div>
      </footer>
    </main>
  );
}
