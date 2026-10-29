"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import HeaderPublico from "../components/HeaderPublico";
import { Calculator, TrendingUp, DollarSign, Clock, BarChart2, ChevronRight, Info } from "lucide-react";

const CULTURAS = [
  { value: "SOJA",     label: "Soja",         unidade: "sc/ha",  precoRef: 128,  custoRef: 3200 },
  { value: "MILHO",    label: "Milho",        unidade: "sc/ha",  precoRef: 55,   custoRef: 2200 },
  { value: "ALGODAO",  label: "Algodão",      unidade: "sc/ha",  precoRef: 940,  custoRef: 4800 },
  { value: "PECUARIA", label: "Pecuária",     unidade: "@/ha",   precoRef: 310,  custoRef: 800  },
];

function calcularTIR(investimento: number, fluxoAnual: number, anos: number): number {
  // Busca binária para encontrar TIR onde NPV = 0
  let lo = -0.99, hi = 10.0;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    let npv = -investimento;
    for (let t = 1; t <= anos; t++) {
      npv += fluxoAnual / Math.pow(1 + mid, t);
    }
    if (npv > 0) lo = mid; else hi = mid;
    if (Math.abs(hi - lo) < 0.0001) break;
  }
  return (lo + hi) / 2 * 100;
}

function calcularNPV(investimento: number, fluxoAnual: number, taxa: number, anos: number): number {
  let npv = -investimento;
  for (let t = 1; t <= anos; t++) {
    npv += fluxoAnual / Math.pow(1 + taxa / 100, t);
  }
  return npv;
}

function fmt(v: number, decimais = 0): string {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimais, maximumFractionDigits: decimais }).format(v);
}

function fmtR(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

export default function CalculadoraTIR() {
  const [area,         setArea]         = useState(500);
  const [precoHa,      setPrecoHa]      = useState(42000);
  const [cultura,      setCultura]      = useState("SOJA");
  const [produtividade,setProdutividade] = useState(62);
  const [precoCultura, setPrecoCultura] = useState(128);
  const [custoHa,      setCustoHa]      = useState(3200);
  const [horizonte,    setHorizonte]    = useState(10);
  const [taxaDesc,     setTaxaDesc]     = useState(6);

  const culturaAtual = CULTURAS.find(c => c.value === cultura)!;

  const resultado = useMemo(() => {
    const investimento   = area * precoHa;
    const receitaAnual   = produtividade * precoCultura * area;
    const custosAnuais   = custoHa * area;
    const lucroAnual     = receitaAnual - custosAnuais;
    const tirSimples     = lucroAnual > 0 ? (lucroAnual / investimento) * 100 : 0;
    const payback        = lucroAnual > 0 ? investimento / lucroAnual : Infinity;
    const tirReal        = lucroAnual > 0 ? calcularTIR(investimento, lucroAnual, horizonte) : 0;
    const npv            = calcularNPV(investimento, lucroAnual, taxaDesc, horizonte);
    const valorFinalHa   = precoHa * Math.pow(1.08, horizonte); // valorização média 8%/ano
    const ganhoCapital   = (valorFinalHa - precoHa) * area;
    const retornoTotal   = npv + ganhoCapital;

    return { investimento, receitaAnual, custosAnuais, lucroAnual, tirSimples, payback, tirReal, npv, ganhoCapital, retornoTotal, valorFinalHa };
  }, [area, precoHa, produtividade, precoCultura, custoHa, horizonte, taxaDesc]);

  const trocarCultura = (val: string) => {
    setCultura(val);
    const c = CULTURAS.find(x => x.value === val)!;
    setPrecoCultura(c.precoRef);
    setCustoHa(c.custoRef);
    setProdutividade(val === "SOJA" ? 62 : val === "MILHO" ? 110 : val === "ALGODAO" ? 8 : 3);
  };

  const tirClass = resultado.tirReal >= 12 ? "text-green-400" : resultado.tirReal >= 8 ? "text-yellow-400" : "text-red-400";
  const npvClass = resultado.npv >= 0 ? "text-green-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <HeaderPublico />

      {/* Hero */}
      <section className="pt-28 pb-12 px-[5%] max-w-[1400px] mx-auto">
        <p className="text-green-400 text-[11px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
          <Calculator className="w-3.5 h-3.5" /> Ferramenta exclusiva
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
          Calculadora de <span className="text-green-400">TIR para Fazendas</span>
        </h1>
        <p className="text-white/45 text-base max-w-xl leading-relaxed">
          Calcule a Taxa Interna de Retorno, VPL e payback de uma fazenda em MT com base em produção, custos e valorização de terra.
        </p>
      </section>

      {/* Layout principal */}
      <section className="pb-20 px-[5%] max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── FORMULÁRIO ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Propriedade */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">1. Propriedade</p>
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-white/60 text-xs font-bold">Área total (ha)</span>
                  <input type="number" min={1} value={area} onChange={e => setArea(Number(e.target.value))}
                    className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-green-500/50 transition-colors" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-white/60 text-xs font-bold">Preço por hectare (R$/ha)</span>
                  <input type="number" min={1000} step={1000} value={precoHa} onChange={e => setPrecoHa(Number(e.target.value))}
                    className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-green-500/50 transition-colors" />
                </label>
              </div>
            </div>

            {/* Cultura */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">2. Produção</p>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  {CULTURAS.map(c => (
                    <button key={c.value} onClick={() => trocarCultura(c.value)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all outline-none border ${
                        cultura === c.value
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white/5 text-white/50 border-white/10 hover:border-white/25 hover:text-white"
                      }`}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-white/60 text-xs font-bold">Produtividade ({culturaAtual.unidade})</span>
                  <input type="number" min={1} value={produtividade} onChange={e => setProdutividade(Number(e.target.value))}
                    className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-green-500/50 transition-colors" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-white/60 text-xs font-bold">Preço de venda (R$/{culturaAtual.unidade.split("/")[0]})</span>
                  <input type="number" min={1} value={precoCultura} onChange={e => setPrecoCultura(Number(e.target.value))}
                    className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-green-500/50 transition-colors" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-white/60 text-xs font-bold">Custo operacional (R$/ha/ano)</span>
                  <input type="number" min={0} step={100} value={custoHa} onChange={e => setCustoHa(Number(e.target.value))}
                    className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-green-500/50 transition-colors" />
                </label>
              </div>
            </div>

            {/* Parâmetros */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">3. Parâmetros</p>
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-white/60 text-xs font-bold">Horizonte de análise (anos)</span>
                  <input type="range" min={5} max={30} step={1} value={horizonte} onChange={e => setHorizonte(Number(e.target.value))}
                    className="accent-green-500" />
                  <span className="text-green-400 text-xs font-black text-right">{horizonte} anos</span>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-white/60 text-xs font-bold">Taxa de desconto — custo de oportunidade (%)</span>
                  <input type="range" min={3} max={15} step={0.5} value={taxaDesc} onChange={e => setTaxaDesc(Number(e.target.value))}
                    className="accent-green-500" />
                  <span className="text-green-400 text-xs font-black text-right">{taxaDesc.toFixed(1)}%/ano</span>
                </label>
              </div>
            </div>
          </div>

          {/* ── RESULTADOS ── */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Cards principais */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <DollarSign className="w-5 h-5" />, lbl: "Investimento total", val: fmtR(resultado.investimento), sub: `${fmtR(precoHa)}/ha`, cor: "border-blue-500/30 bg-blue-500/5" },
                { icon: <TrendingUp className="w-5 h-5" />, lbl: "Lucro operacional/ano", val: fmtR(resultado.lucroAnual), sub: `${fmtR(resultado.lucroAnual / area)}/ha`, cor: resultado.lucroAnual >= 0 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5" },
                { icon: <BarChart2 className="w-5 h-5" />, lbl: "TIR operacional", val: `${fmt(resultado.tirReal, 1)}%/ano`, sub: resultado.tirReal >= 12 ? "Excelente" : resultado.tirReal >= 8 ? "Bom" : "Baixo", cor: `${resultado.tirReal >= 12 ? "border-green-500/30 bg-green-500/5" : resultado.tirReal >= 8 ? "border-yellow-500/30 bg-yellow-500/5" : "border-red-500/30 bg-red-500/5"}` },
                { icon: <Clock className="w-5 h-5" />, lbl: "Payback operacional", val: isFinite(resultado.payback) ? `${fmt(resultado.payback, 1)} anos` : "∞", sub: isFinite(resultado.payback) && resultado.payback <= horizonte ? "Dentro do horizonte" : "Fora do horizonte", cor: isFinite(resultado.payback) && resultado.payback <= horizonte ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5" },
              ].map(c => (
                <div key={c.lbl} className={`rounded-2xl border p-5 ${c.cor}`}>
                  <div className="text-white/40 mb-3">{c.icon}</div>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">{c.lbl}</p>
                  <p className="text-white font-black text-2xl leading-none">{c.val}</p>
                  <p className="text-white/35 text-[11px] mt-1">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Análise VPL */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5" /> Análise de Valor Presente — {horizonte} anos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-white/35 text-[10px] uppercase tracking-wide mb-1">VPL Operacional</p>
                  <p className={`font-black text-xl ${npvClass}`}>{fmtR(resultado.npv)}</p>
                  <p className="text-white/25 text-[10px] mt-1">taxa {taxaDesc}%/ano</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-white/35 text-[10px] uppercase tracking-wide mb-1">Ganho de Capital</p>
                  <p className="font-black text-xl text-blue-400">{fmtR(resultado.ganhoCapital)}</p>
                  <p className="text-white/25 text-[10px] mt-1">+8%/ano na terra</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-white/35 text-[10px] uppercase tracking-wide mb-1">Retorno Total</p>
                  <p className={`font-black text-xl ${resultado.retornoTotal >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtR(resultado.retornoTotal)}</p>
                  <p className="text-white/25 text-[10px] mt-1">operação + terra</p>
                </div>
              </div>

              {/* Barra comparativa TIR vs SELIC */}
              <div className="space-y-3">
                {[
                  { lbl: `TIR desta fazenda`, val: resultado.tirReal, max: 20, cor: "bg-green-500" },
                  { lbl: "SELIC (referência)",  val: 10.5,            max: 20, cor: "bg-blue-500"  },
                  { lbl: "FII médio BR",        val: 8.5,             max: 20, cor: "bg-purple-500"},
                ].map(b => (
                  <div key={b.lbl} className="flex items-center gap-3 text-xs">
                    <span className="text-white/40 w-40 shrink-0">{b.lbl}</span>
                    <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                      <div className={`h-full ${b.cor} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, (b.val / b.max) * 100)}%` }} />
                    </div>
                    <span className="text-white font-black w-14 text-right">{fmt(b.val, 1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fluxo anual simplificado */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Composição do fluxo anual</p>
              <div className="space-y-2.5">
                {[
                  { lbl: "Receita bruta", val: resultado.receitaAnual, pos: true },
                  { lbl: "Custos operacionais", val: -resultado.custosAnuais, pos: false },
                  { lbl: "Lucro operacional líquido", val: resultado.lucroAnual, pos: resultado.lucroAnual >= 0, bold: true },
                ].map(r => (
                  <div key={r.lbl} className={`flex justify-between items-center py-2.5 text-sm ${r.bold ? "border-t border-white/10 pt-3 mt-1" : ""}`}>
                    <span className={r.bold ? "font-black text-white" : "text-white/50 font-medium"}>{r.lbl}</span>
                    <span className={`font-black ${r.bold ? (r.pos ? "text-green-400" : "text-red-400") : (r.pos ? "text-white/70" : "text-red-400/70")}`}>
                      {r.val >= 0 ? "+" : ""}{fmtR(r.val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
              <Info className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
              <p className="text-white/30 text-[11px] leading-relaxed">
                Estimativa baseada em parâmetros informados. Não considera Imposto de Renda, depreciação, financiamentos ou variações de preço de commodity.
                Valorização da terra estimada em +8%/a. (média histórica MT). Consulte um assessor antes de investir.
              </p>
            </div>

            {/* CTA */}
            <div className="flex gap-3 flex-wrap">
              <Link href="/cidades" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-black text-sm px-6 py-3 rounded-full transition-all">
                Ver cidades em MT <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/comparar" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm px-6 py-3 rounded-full transition-all">
                Comparar cidades
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
