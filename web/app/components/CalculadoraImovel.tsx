"use client";

import { useState, useEffect, useRef } from "react";
import {
  Home, Tractor, Calculator, RefreshCw, ChevronRight, ChevronLeft,
  Info, TrendingUp, Zap, MapPin, Loader2, Search, Navigation,
  BedDouble, Star, Ruler, TreePine, Wheat, Droplets,
  Truck, FileCheck, ArrowRight, Sparkles, CheckCircle2,
} from "lucide-react";

// ─────────────────────────────────────────────
// TABELAS
// ─────────────────────────────────────────────

const PRECO_M2_CIDADE: Record<string, number> = {
  "Cuiabá": 5500, "Várzea Grande": 3500, "Rondonópolis": 4000,
  "Sinop": 4500, "Sorriso": 4200, "Lucas do Rio Verde": 4000,
  "Nova Mutum": 3800, "Primavera do Leste": 3500, "Tangará da Serra": 3200,
  "Campo Novo do Parecis": 2800, "Cáceres": 2600, "Barra do Garças": 3000,
  "Alta Floresta": 2500, "Guarantã do Norte": 2200, "Colíder": 2200,
  "Juara": 2000, "Juína": 2100, "Outra cidade": 3000,
};
const CIDADES = Object.keys(PRECO_M2_CIDADE);

const CENTROS_CIDADES: Record<string, { lat: number; lng: number }> = {
  "Cuiabá": { lat: -15.6014, lng: -56.0979 }, "Várzea Grande": { lat: -15.6472, lng: -56.1325 },
  "Rondonópolis": { lat: -16.4702, lng: -54.6361 }, "Sinop": { lat: -11.8622, lng: -55.5047 },
  "Sorriso": { lat: -12.5474, lng: -55.7169 }, "Lucas do Rio Verde": { lat: -13.0593, lng: -55.9177 },
  "Nova Mutum": { lat: -13.8312, lng: -56.0833 }, "Primavera do Leste": { lat: -15.5565, lng: -54.2983 },
  "Tangará da Serra": { lat: -14.6226, lng: -57.4913 }, "Campo Novo do Parecis": { lat: -13.6731, lng: -57.8891 },
  "Cáceres": { lat: -16.0768, lng: -57.6791 }, "Barra do Garças": { lat: -15.8898, lng: -52.2563 },
  "Alta Floresta": { lat: -9.8754, lng: -56.0861 }, "Guarantã do Norte": { lat: -9.7943, lng: -54.9049 },
  "Colíder": { lat: -10.8115, lng: -55.4516 }, "Juara": { lat: -11.2589, lng: -57.5241 },
  "Juína": { lat: -11.3749, lng: -58.7406 },
};

// ─────────────────────────────────────────────
// GEO
// ─────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371, dLat = (lat2 - lat1) * (Math.PI / 180), dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function matchCidade(loc: string): string {
  const n = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const l = n(loc);
  return CIDADES.find(c => n(c) === l) ?? CIDADES.find(c => l.includes(n(c)) || n(c).includes(l)) ?? "Outra cidade";
}
function inferirPadraoRegiao(bairro: string): number {
  const b = bairro.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/\b(prime|premium|alphaville|jardins|golf|lake|gardens|alto da|villa\b)/.test(b)) return 3;
  if (/\b(jardim|parque|residencial|portal|nobre|boa vista|bosque|verde|golden|royal)/.test(b)) return 2;
  if (/\b(centro\b|central|comercial)/.test(b)) return 2;
  if (/\b(vila\b|conjunto|cpa|cj\b|popular|periferia)/.test(b)) return 0;
  return 1;
}

// ─────────────────────────────────────────────
// LABELS
// ─────────────────────────────────────────────

const REGIAO_MULT  = [0.70, 1.00, 1.40, 1.80];
const REGIAO_LABEL = ["Popular", "Médio", "Nobre", "Prime"];
const REGIAO_DESC  = [
  "Ruas sem asfalto ou com buracos · iluminação precária · sem comércio próximo",
  "Ruas asfaltadas · iluminação boa · mercado ou farmácia a menos de 2 km",
  "Infraestrutura completa · comércio sofisticado · segurança · bairro valorizado",
  "Condomínio fechado · portaria 24h · área verde · clube ou lazer exclusivo",
];
// ── Checklists de acabamento ──
// Cada item representa um UPGRADE em relação ao básico (baseline implícito não pontua).
// Score = (marcados / 6) × 3  →  0 = Básico, 2 = Médio, 4 = Alto, 6 = Luxo
//
// Calibração: 0 marcados = piso cerâmica simples / laje / ferro / box alumínio (Básico)
//              6 marcados = totalmente premium (Luxo)

const PISO_FEATURES = [
  "Cerâmica maior — 45×45 ou mais",
  "Porcelanato",
  "Porcelanato sem rejunte aparente (peças bem juntas, sem risquinho visível)",
  "Porcelanato grande — lajota de 80 cm ou mais",
  "Pedra natural no piso — granito ou ardósia",
  "Mármore ou madeira nobre no piso",
];
const FORRO_FEATURES = [
  "Forro de PVC",
  "Forro de gesso liso",
  "Moldura de gesso nas bordas do teto",
  "Spots ou lâmpadas embutidas no teto",
  "Fita de LED ou iluminação indireta",
  "Forro de madeira nobre",
  "Pé-direito alto (mais de 3 m) ou iluminação automatizada",
];
const ESQUADRIAS_FEATURES = [
  "Janelas de alumínio de qualidade melhor",
  "Portas internas de madeira maciça (não MDF simples)",
  "Vidro temperado nas janelas",
  "Janelas de PVC (bem vedadas, sem infiltração)",
  "Janelas sem trilho aparente ou portas com acabamento fino",
  "Portas pivotantes ou janelas especiais (panorâmica, vidro do chão ao teto)",
];
const BANHEIRO_FEATURES = [
  "Box de vidro temperado",
  "Louças de marca — vaso e pia (ex: Deca, Celite)",
  "Cuba de apoio ou embutida no banheiro",
  "Torneiras e registros de marca melhor",
  "Porcelanato nas paredes do banheiro",
  "Louças ou torneiras importadas (ex: Grohe, Duravit) ou banheira de imersão",
];

const CLOSET_OPTIONS = [
  { label: "Sem closet",      desc: "Guarda-roupa avulso" },
  { label: "Armário embutido",desc: "Embutido na parede, sem ambiente separado" },
  { label: "Closet no quarto",desc: "Espaço separado até 4 m² dentro do quarto" },
  { label: "Walk-in / Suíte", desc: "Closet independente 4m²+, iluminação dedicada" },
];

// Expansão urbana — labels por sub-item
const RODOVIA_LABELS    = ["Distante", "Acesso moderado", "Próximo", "Eixo logístico"];
const RODOVIA_DESCS     = ["Sem rodovia próxima, acesso difícil", "Rodovia a 10–20 km", "Rodovia a menos de 10 km", "BR ou MT-seca na porta, terminal de grãos"];
const CRESCIMENTO_LABELS = ["Estagnado", "Crescimento lento", "Crescimento ativo", "Expansão acelerada"];
const CRESCIMENTO_DESCS  = ["Bairro maduro, sem novidades", "Obras pontuais, lento crescimento", "Novos comércios e construções", "Bairro em plena expansão, muita obra"];
const LOTEAMENTOS_LABELS = ["Nenhum", "Poucos", "Vários", "Muitos / Frente ativa"];
const LOTEAMENTOS_DESCS  = ["Sem loteamentos novos na região", "1–2 loteamentos próximos", "Vários loteamentos em andamento", "Frente de expansão ativa, muitos terrenos"];

const PADRÃO_NOME = (avg: number) =>
  avg < 0.5 ? "Básico" : avg < 1.5 ? "Médio" : avg < 2.5 ? "Alto" : "Luxo";
const SOLO_LABEL   = ["Sofrível", "Regular", "Boa", "Excelente"];
const AGUA_LABEL   = ["Escassa", "Regular", "Boa", "Abundante"];
const LOG_LABEL    = ["Precária", "Regular", "Boa", "Excelente"];
const DOC_LABEL    = ["Irregular", "Parcial", "Regular", "Completa"];

// ─────────────────────────────────────────────
// TIPOS & INTERFACES
// ─────────────────────────────────────────────

type TipoImovel = "URBANO" | "RURAL";

// bitmask helpers
const countBits = (n: number) => { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; };
const maskScore = (mask: number, total: number) => (countBits(mask) / total) * 3;

// maskScore com pesos por feature (quando itens têm valores distintos)
const maskWeightedScore = (mask: number, weights: number[]) => {
  const totalPesos = weights.reduce((a, b) => a + b, 0);
  const pontos = weights.reduce((sum, w, i) => sum + (mask & (1 << i) ? w : 0), 0);
  return (pontos / totalPesos) * 3;
};

// Pesos do forro: PVC vale 0.5 (inferior ao gesso), demais valem 1.0
const FORRO_WEIGHTS = [0.5, 1, 1, 1, 1, 1, 1];

interface UrbanoForm {
  area: number; quartos: number; banheiros: number; vagas: number; closet: number;
  // Acabamento — bitmask de 5 bits por sub-item (bit i = feature i marcada)
  pisoMask: number; forroMask: number; esquadriasMask: number; banheiroMask: number;
  // Localização
  cidade: string; padraoRegiao: number; distancia: number;
  // Expansão urbana — 0-3 por sub-item
  rodovia: number; crescimento: number; loteamentos: number;
}
interface RuralForm { areaHa: number; solo: number; agua: number; produtividade: number; logistica: number; documentacao: number; distanciaTerminal: number; }
interface DadosCep { bairro: string; cidade: string; distanciaKm: number | null; padraoRegiao: number; }

// URBANO default: Médio — porcelanato + gesso + box vidro + louças Deca
// Cada sub-item com 2 marcados = 2/6×3 = 1.0 (Médio) ✓
const URBANO_DEFAULT: UrbanoForm = {
  area: 120, quartos: 3, banheiros: 2, vagas: 1, closet: 0,
  pisoMask:       0b000011, // cerâmica qualidade + porcelanato
  forroMask:      0b000001, // gesso liso
  esquadriasMask: 0b000000, // alumínio simples (baseline, sem upgrade)
  banheiroMask:   0b000011, // box vidro + Deca
  cidade: "", padraoRegiao: 1, distancia: 5,
  rodovia: 1, crescimento: 1, loteamentos: 1,
};
const RURAL_DEFAULT: RuralForm = { areaHa: 500, solo: 2, agua: 2, produtividade: 45, logistica: 2, documentacao: 2, distanciaTerminal: 50 };

// ─────────────────────────────────────────────
// MODELOS
// ─────────────────────────────────────────────

const resolverPrecoM2 = (cidade: string, padraoRegiao: number) =>
  Math.round((PRECO_M2_CIDADE[cidade] ?? 3000) * REGIAO_MULT[padraoRegiao]);

const mediaAcabamento = (f: UrbanoForm) => (
  maskScore(f.pisoMask,       PISO_FEATURES.length) +
  maskWeightedScore(f.forroMask, FORRO_WEIGHTS) +   // PVC vale 0.5, gesso vale 1.0
  maskScore(f.esquadriasMask, ESQUADRIAS_FEATURES.length) +
  maskScore(f.banheiroMask,   BANHEIRO_FEATURES.length)
) / 4;
const mediaSprawl     = (f: UrbanoForm) => (f.rodovia + f.crescimento + f.loteamentos) / 3;

const calcularUrbano = (f: UrbanoForm) => {
  const p = resolverPrecoM2(f.cidade || "Outra cidade", f.padraoRegiao);
  const padrao = mediaAcabamento(f);
  const sprawl = mediaSprawl(f);
  return Math.exp(7.65 + 0.55*Math.log(f.area) + 0.08*f.quartos + 0.12*f.banheiros + 0.04*f.vagas + 0.05*f.closet + 0.15*padrao + 0.10*Math.log(150_000) - 0.08*f.distancia + 0.12*sprawl + 0.45*(p/1000));
};
const calcularRural = (f: RuralForm) =>
  f.areaHa * Math.exp(9.30 + 0.15*f.solo + 0.15*f.agua + 0.20*(f.produtividade/60) + 0.12*f.logistica + 0.10*f.documentacao - 0.005*f.distanciaTerminal);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtNum = (v: number) => v.toLocaleString("pt-BR");

function buildResumo(tipo: TipoImovel, extra: any) {
  if (tipo !== "RURAL") {
    const f = extra as UrbanoForm;
    const avgAcab = mediaAcabamento(f);
    const avgSprawl = mediaSprawl(f);
    return [
      { icon: MapPin,     label: "Localização",  value: f.cidade ? `${f.cidade} · ${REGIAO_LABEL[f.padraoRegiao]}` : "—" },
      { icon: Ruler,      label: "Área",         value: `${fmtNum(f.area)} m²` },
      { icon: BedDouble,  label: "Composição",   value: `${f.quartos}q · ${f.banheiros}bh · ${f.vagas}vg` },
      { icon: Star,       label: "Acabamento",   value: `${PADRÃO_NOME(avgAcab)} — score ${avgAcab.toFixed(2)}` },
      { icon: Home,       label: "Closet",       value: CLOSET_OPTIONS[f.closet]?.label ?? "—" },
      { icon: MapPin,     label: "Dist. centro", value: `${f.distancia} km` },
      { icon: TrendingUp, label: "Entorno",      value: `${PADRÃO_NOME(avgSprawl)} (${avgSprawl.toFixed(1)})` },
    ];
  }
  const f = extra as RuralForm;
  return [
    { icon: Ruler,     label: "Área",          value: `${fmtNum(f.areaHa)} ha` },
    { icon: Wheat,     label: "Produtividade", value: `${f.produtividade} sc/ha` },
    { icon: TreePine,  label: "Solo",          value: SOLO_LABEL[f.solo] },
    { icon: Droplets,  label: "Água",          value: AGUA_LABEL[f.agua] },
    { icon: Truck,     label: "Logística",     value: LOG_LABEL[f.logistica] },
    { icon: FileCheck, label: "Documentação",  value: DOC_LABEL[f.documentacao] },
    { icon: MapPin,    label: "Dist. terminal",value: `${f.distanciaTerminal} km` },
  ];
}

// ─────────────────────────────────────────────
// SUB-COMPONENTES
// ─────────────────────────────────────────────

function NumInput({ label, value, onChange, min, max, step = 1, suffix = "" }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
      <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-green-500/40 transition-colors">
        <input type="number" min={min} max={max} step={step} value={value}
          onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v))); }}
          className="flex-1 bg-transparent text-white font-black text-lg px-4 py-3.5 outline-none min-w-0" />
        {suffix && <span className="px-4 text-gray-500 font-bold shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

function CounterInput({ label, value, onChange, min, max, icon: Icon, unit }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; icon: any; unit: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 hover:border-white/20 transition-colors">
        <button onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 text-white font-black flex items-center justify-center transition-all active:scale-90 outline-none text-lg leading-none">−</button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-black text-white tabular-nums">{value}</span>
          <span className="text-xs text-gray-500 ml-1.5">{unit}</span>
        </div>
        <button onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 text-white font-black flex items-center justify-center transition-all active:scale-90 outline-none text-lg leading-none">+</button>
      </div>
    </div>
  );
}

function ChipGroup({ label, value, onChange, options, descs }: { label: string; value: number; onChange: (v: number) => void; options: string[]; descs?: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => (
          <button key={i} onClick={() => onChange(i)}
            className={`p-3 rounded-xl text-left border transition-all outline-none ${value === i ? "bg-green-600/20 border-green-500/50 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}>
            <p className="text-xs font-black">{opt}</p>
            {descs?.[i] && <p className="text-[10px] text-gray-600 mt-0.5 leading-snug">{descs[i]}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CEP LOOKUP
// ─────────────────────────────────────────────

function CepInput({ onAutoFill }: { onAutoFill: (d: DadosCep) => void }) {
  const [cep, setCep] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [dados, setDados] = useState<DadosCep | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fmt = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };

  const buscar = async (limpo: string) => {
    setStatus("loading"); setDados(null);
    try {
      const via = await fetch(`https://viacep.com.br/ws/${limpo}/json/`).then(r => r.json());
      if (via.erro) { setStatus("error"); return; }
      const cidade = matchCidade(via.localidade);
      const padraoRegiao = inferirPadraoRegiao(via.bairro ?? "");
      const query = [via.logradouro, via.bairro, via.localidade, "Mato Grosso", "Brasil"].filter(Boolean).join(", ");
      const geo = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, { headers: { "User-Agent": "UrbanoConnect/1.0" } }).then(r => r.json());
      let distanciaKm: number | null = null;
      const centro = CENTROS_CIDADES[cidade];
      if (geo[0] && centro) distanciaKm = Math.round(haversineKm(+geo[0].lat, +geo[0].lon, centro.lat, centro.lng) * 10) / 10;
      const resultado: DadosCep = { bairro: via.bairro ?? "", cidade, distanciaKm, padraoRegiao };
      setDados(resultado); setStatus("ok"); onAutoFill(resultado);
    } catch { setStatus("error"); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = fmt(e.target.value); setCep(v);
    const d = v.replace(/\D/g, "");
    if (d.length === 8) { if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => buscar(d), 400); }
    else { setStatus("idle"); setDados(null); }
  };

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 border rounded-2xl px-5 py-4 transition-all ${status === "ok" ? "border-green-500/50 bg-green-500/5" : status === "error" ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/5 focus-within:border-green-500/30"}`}>
        {status === "loading" ? <Loader2 className="w-5 h-5 text-green-400 animate-spin shrink-0" /> : <Search className="w-5 h-5 text-gray-500 shrink-0" />}
        <input type="text" inputMode="numeric" placeholder="00000-000" value={cep} onChange={handleChange} maxLength={9}
          className="bg-transparent text-white font-black text-xl outline-none w-full placeholder-gray-700 tracking-widest" />
        {status === "ok" && <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />}
      </div>
      {status === "ok" && dados && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 animate-fadeIn">
          <MapPin className="w-4 h-4 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-black text-white">{dados.cidade}{dados.bairro ? ` — ${dados.bairro}` : ""}</p>
            {dados.distanciaKm && <p className="text-xs text-green-400/70 font-medium">{dados.distanciaKm} km do centro · detectado via OpenStreetMap</p>}
          </div>
        </div>
      )}
      {status === "error" && <p className="text-xs text-red-400 font-bold px-1">CEP não encontrado. Verifique e tente novamente.</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// SELETORES GRANULARES
// ─────────────────────────────────────────────

function FeatureChecklist({ label, mask, features, onChange, weights }: {
  label: string; mask: number; features: string[]; onChange: (mask: number) => void; weights?: number[];
}) {
  const count = countBits(mask);
  const score = weights ? maskWeightedScore(mask, weights) : maskScore(mask, features.length);
  const nome = PADRÃO_NOME(score);
  const pct = (score / 3) * 100;

  const toggle = (i: number) => onChange(mask ^ (1 << i));
  const checked = (i: number) => !!(mask & (1 << i));

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-black text-gray-300 uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">{count}/{features.length} itens</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            score < 0.5 ? "bg-gray-500/10 text-gray-400" :
            score < 1.5 ? "bg-blue-500/10 text-blue-400" :
            score < 2.5 ? "bg-purple-500/10 text-purple-400" :
            "bg-yellow-500/10 text-yellow-400"
          }`}>{nome}</span>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        {features.map((feat, i) => (
          <button key={i} onClick={() => toggle(i)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all outline-none ${
              checked(i)
                ? "bg-green-500/10 border-green-500/30 text-white"
                : "bg-white/3 border-white/8 text-gray-500 hover:border-white/15 hover:text-gray-300"
            }`}>
            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              checked(i) ? "bg-green-500 border-green-500" : "border-white/20"
            }`}>
              {checked(i) && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-xs leading-snug">{feat}</span>
          </button>
        ))}
      </div>

      {/* Mini barra do sub-item */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-green-700 to-green-400 rounded-full transition-all duration-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PadraoGranular({ f, onChange }: { f: UrbanoForm; onChange: (k: keyof UrbanoForm, v: number) => void }) {
  const avg = mediaAcabamento(f);
  const avgPct = (avg / 3) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Padrão de acabamento</label>
        <span className="text-[10px] text-gray-500">Marque tudo que o imóvel possui</span>
      </div>

      <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-5">
        <FeatureChecklist label="Piso"             mask={f.pisoMask}       features={PISO_FEATURES}        onChange={v => onChange("pisoMask", v)} />
        <div className="border-t border-white/5" />
        <FeatureChecklist label="Forro / Teto"     mask={f.forroMask}      features={FORRO_FEATURES}       onChange={v => onChange("forroMask", v)} weights={FORRO_WEIGHTS} />
        <div className="border-t border-white/5" />
        <FeatureChecklist label="Janelas / Portas" mask={f.esquadriasMask} features={ESQUADRIAS_FEATURES}  onChange={v => onChange("esquadriasMask", v)} />
        <div className="border-t border-white/5" />
        <FeatureChecklist label="Banheiro / Coz."  mask={f.banheiroMask}   features={BANHEIRO_FEATURES}    onChange={v => onChange("banheiroMask", v)} />
      </div>

      {/* Score médio geral */}
      <div className="flex items-center gap-3 bg-green-500/8 border border-green-500/15 rounded-xl px-4 py-3">
        <div className="flex-1">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-700 to-green-400 rounded-full transition-all duration-500" style={{ width: `${avgPct}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-600">Básico</span>
            <span className="text-[9px] text-gray-600">Médio</span>
            <span className="text-[9px] text-gray-600">Alto</span>
            <span className="text-[9px] text-gray-600">Luxo</span>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className="text-xs font-black text-green-400">{PADRÃO_NOME(avg)}</p>
          <p className="text-[10px] text-gray-600">score {avg.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function SprawlRow({ label, value, onChange, labels, descs }: {
  label: string; value: number; onChange: (v: number) => void;
  labels: string[]; descs: string[];
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-black text-gray-300 uppercase tracking-widest">{label}</span>
      <div className="grid grid-cols-4 gap-1.5">
        {labels.map((lbl, i) => (
          <button key={i} onClick={() => onChange(i)}
            className={`py-2 px-1 rounded-xl text-[11px] font-black border transition-all outline-none text-center leading-tight ${
              value === i
                ? "bg-blue-600/25 border-blue-500/60 text-white"
                : "bg-white/5 border-white/8 text-gray-500 hover:border-white/20 hover:text-gray-300"
            }`}>{lbl}</button>
        ))}
      </div>
      <p className="text-[10px] text-gray-600 leading-snug">{descs[value]}</p>
    </div>
  );
}

function SprawlGranular({ f, onChange }: { f: UrbanoForm; onChange: (k: keyof UrbanoForm, v: number) => void }) {
  const avg = mediaSprawl(f);
  const nome = ["Consolidado", "Em transição", "Em expansão", "Frente ativa"][Math.round(avg)] ?? "Em transição";
  const pct = (avg / 3) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Entorno e expansão urbana</label>
        <span className="text-[10px] text-gray-500">Avalie o entorno do imóvel</span>
      </div>

      <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-5">
        <SprawlRow label="Rodovia / BR"  value={f.rodovia}    onChange={v => onChange("rodovia", v)}    labels={RODOVIA_LABELS}     descs={RODOVIA_DESCS} />
        <div className="border-t border-white/5" />
        <SprawlRow label="Crescimento"   value={f.crescimento} onChange={v => onChange("crescimento", v)} labels={CRESCIMENTO_LABELS} descs={CRESCIMENTO_DESCS} />
        <div className="border-t border-white/5" />
        <SprawlRow label="Loteamentos"   value={f.loteamentos} onChange={v => onChange("loteamentos", v)} labels={LOTEAMENTOS_LABELS} descs={LOTEAMENTOS_DESCS} />
      </div>

      <div className="flex items-center gap-3 bg-blue-500/8 border border-blue-500/15 rounded-xl px-4 py-2.5">
        <div className="flex-1">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-black text-blue-400">{nome}</span>
          <span className="text-[10px] text-gray-600 ml-1.5">({avg.toFixed(2)})</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// RESULTADO (full-width)
// ─────────────────────────────────────────────

function Resultado({ valor, tipo, extra, onReset }: { valor: number; tipo: TipoImovel; extra: any; onReset: () => void }) {
  const [displayed, setDisplayed] = useState(0);
  const faixa = { min: valor * 0.92, max: valor * 1.08 };
  const precoHa = tipo === "RURAL" ? valor / (extra as RuralForm).areaHa : null;
  const resumo = buildResumo(tipo, extra);

  useEffect(() => {
    let v = 0; const step = valor / 70;
    const t = setInterval(() => { v += step; if (v >= valor) { setDisplayed(valor); clearInterval(t); } else setDisplayed(v); }, 14);
    return () => clearInterval(t);
  }, [valor]);

  const insight = (() => {
    if (tipo !== "RURAL") {
      const f = extra as UrbanoForm;
      if (mediaSprawl(f) >= 2) return "Área em expansão — potencial de valorização acima da média local.";
      if (f.distancia <= 3) return "Localização central — alta liquidez e demanda constante.";
      return "Imóvel dentro da faixa típica do mercado para sua cidade.";
    }
    const f = extra as RuralForm;
    if (f.solo >= 3 && f.produtividade >= 55) return "Solo e produtividade excelentes — ativo mais valorizado do MT.";
    if (f.documentacao < 2) return "Regularizar a documentação pode valorizar em até 15%.";
    return "Fazenda dentro do patamar de mercado do Mato Grosso.";
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Painel esquerdo — valor */}
      <div className="animate-result flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2518] via-[#0d1f15] to-[#091420] border border-green-500/30 p-8 flex-1">
          <div className="absolute -top-12 -right-12 w-56 h-56 bg-green-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-black text-green-400/80 uppercase tracking-[0.2em]">Avaliação concluída</span>
          </div>
          <p className="text-xs font-bold text-green-400/50 uppercase tracking-widest mb-3">Valor estimado de mercado</p>
          <p className="text-5xl lg:text-6xl xl:text-7xl font-black text-white tabular-nums leading-none">{fmtBRL(displayed)}</p>
          {precoHa && <p className="text-base text-green-400/80 font-bold mt-3">≈ {fmtBRL(Math.round(precoHa))}/ha</p>}
          <div className="mt-8">
            <div className="relative h-2.5 bg-white/8 rounded-full">
              <div className="absolute inset-y-0 left-[18%] right-[18%] bg-gradient-to-r from-green-700/60 via-green-400 to-green-700/60 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-green-400 rounded-full border-2 border-[#0d1f15] shadow-xl shadow-green-500/50 z-10" />
            </div>
            <div className="flex justify-between mt-2.5">
              <div><p className="text-[10px] text-gray-600">Mínimo</p><p className="text-xs text-gray-400 font-black">{fmtBRL(faixa.min)}</p></div>
              <div className="text-center"><p className="text-[10px] text-green-500/60 font-black">±8%</p></div>
              <div className="text-right"><p className="text-[10px] text-gray-600">Máximo</p><p className="text-xs text-gray-400 font-black">{fmtBRL(faixa.max)}</p></div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 items-start bg-white/4 border border-white/8 rounded-xl px-5 py-4">
          <TrendingUp className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-200 font-medium leading-relaxed">{insight}</p>
        </div>
        <div className="flex gap-2 items-start px-1">
          <Info className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-600 leading-relaxed">Modelo hedônico (Rosen, 1974) calibrado para o MT · OpenStreetMap · Haversine · ±8% · Não substitui laudo técnico.</p>
        </div>
      </div>
      {/* Painel direito — resumo */}
      <div className="animate-result-delay flex flex-col gap-4">
        <div className="bg-[#0f1623] border border-white/8 rounded-2xl p-5 flex-1">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Calculator className="w-3 h-3" /> Resumo do imóvel avaliado
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resumo.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-3 bg-white/4 rounded-xl px-3 py-3">
                  <div className="p-1.5 bg-green-500/10 rounded-lg shrink-0"><Icon className="w-3.5 h-3.5 text-green-400" /></div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{item.label}</p>
                    <p className="text-xs font-bold text-gray-100 mt-0.5 leading-snug">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <a href="/" className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white font-black uppercase tracking-widest text-sm px-6 py-4 rounded-xl transition-all outline-none shadow-lg shadow-green-900/40">
            <Zap className="w-4 h-4" /> Ver imóveis na faixa <ArrowRight className="w-4 h-4 ml-auto" />
          </a>
          <button onClick={onReset} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold px-6 py-3 rounded-xl transition-all text-sm outline-none">
            <RefreshCw className="w-4 h-4" /> Fazer nova avaliação
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAINEL LATERAL (progresso + o que aparecerá no resultado)
// ─────────────────────────────────────────────

function StepSidebar({ steps, current }: { steps: string[]; current: number }) {
  const pct = Math.round((current / (steps.length - 1)) * 100);
  const isLast = current === steps.length - 1;

  return (
    <div className="bg-[#0a0f1a] border border-white/8 rounded-2xl p-6 flex flex-col gap-6 sticky top-4">

      {/* Progresso */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Progresso</p>
          <span className="text-[10px] font-black text-gray-400">{pct}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-700 to-green-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Etapas */}
      <div className="space-y-2.5">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} className={`flex items-center gap-3 transition-all ${active ? "opacity-100" : done ? "opacity-60" : "opacity-25"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${done ? "bg-green-600 border-green-600" : active ? "border-green-500 bg-green-500/10" : "border-white/15 bg-white/3"}`}>
                {done
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  : <span className={`text-[10px] font-black ${active ? "text-green-400" : "text-gray-600"}`}>{i + 1}</span>}
              </div>
              <span className={`text-xs font-bold ${active ? "text-white" : done ? "text-gray-500" : "text-gray-700"}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* O que aparecerá no resultado */}
      <div className={`border-t border-white/5 pt-5 space-y-3 transition-all duration-300 ${isLast ? "opacity-100" : "opacity-40"}`}>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">O resultado mostrará</p>
        {[
          { icon: "💰", text: "Valor estimado de mercado" },
          { icon: "📊", text: "Faixa de confiança ±8%" },
          { icon: "📋", text: "Resumo completo do imóvel" },
          { icon: "💡", text: "Insight sobre o mercado local" },
        ].map(item => (
          <div key={item.text} className="flex items-center gap-2.5">
            <span className="text-sm">{item.icon}</span>
            <p className="text-xs text-gray-500">{item.text}</p>
          </div>
        ))}
        {isLast && (
          <p className="text-[10px] text-green-400/70 font-bold mt-2">
            ✓ Tudo preenchido — clique em "Ver resultado"
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// INDICADOR DE STEPS
// ─────────────────────────────────────────────

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${done ? "bg-green-600 border-green-600" : active ? "bg-green-600/20 border-green-500" : "bg-white/5 border-white/15"}`}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-white" />
                  : <span className={`text-xs font-black tabular-nums ${active ? "text-green-400" : "text-gray-600"}`}>{i + 1}</span>}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider hidden sm:block ${active ? "text-green-400" : done ? "text-gray-500" : "text-gray-700"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 rounded-full transition-all duration-500 ${i < current ? "bg-green-600" : "bg-white/8"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────

const TIPO_CARDS = [
  { id: "URBANO" as TipoImovel,    icon: Home,     label: "Casa",          sub: "Residencial",  desc: "Casa, sobrado, chácara ou terreno urbano",      grad: "from-blue-600/20 to-blue-900/5",   border: "border-blue-500/30 hover:border-blue-400",    active: "border-blue-400 from-blue-600/30 to-blue-900/10", iconBg: "bg-blue-500/20 text-blue-400" },
  { id: "RURAL" as TipoImovel,      icon: Tractor,  label: "Fazenda",       sub: "Propriedade rural",desc: "Fazenda, sítio, chácara rural ou gleba",      grad: "from-green-600/20 to-green-900/5",  border: "border-green-500/30 hover:border-green-400",  active: "border-green-400 from-green-600/30 to-green-900/10",  iconBg: "bg-green-500/20 text-green-400" },
];

export default function CalculadoraImovel() {
  const [tipo, setTipo] = useState<TipoImovel | null>(null);
  const [step, setStep] = useState(0);
  const [stepDir, setStepDir] = useState<1 | -1>(1);
  const [stepKey, setStepKey] = useState(0);
  const [urbano, setUrbano] = useState<UrbanoForm>(URBANO_DEFAULT);
  const [rural, setRural]   = useState<RuralForm>(RURAL_DEFAULT);
  const [distAutoFill, setDistAutoFill] = useState(false);
  const [resultado, setResultado] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef   = useRef<HTMLDivElement>(null);

  const steps = tipo === "RURAL"
    ? ["Tipo", "Área e produção", "Qualidade da terra"]
    : tipo
    ? ["Tipo", "Localização", "Características", "Acabamento"]
    : ["Tipo"];

  const isLastStep = step === steps.length - 1;

  useEffect(() => {
    if (resultado && resultRef.current) setTimeout(() => resultRef.current!.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [resultado]);

  const navigate = (dir: 1 | -1) => {
    const next = step + dir;
    if (next < 0) return;
    setStepDir(dir);
    setStepKey(k => k + 1);
    setStep(next);
    setErro("");
    if (formRef.current) setTimeout(() => formRef.current!.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  };

  const selecionarTipo = (t: TipoImovel) => {
    setTipo(t); setStep(1); setStepDir(1); setStepKey(k => k + 1);
    setResultado(null); setErro("");
  };

  const calcular = () => {
    if (!tipo) return;
    if (tipo !== "RURAL") {
      if (!urbano.cidade) { setErro("Selecione a cidade na etapa de localização."); return; }
    }
    setErro("");
    const valor = tipo === "URBANO" ? calcularUrbano(urbano) : calcularRural(rural);
    setResultado(valor);
  };

  const resetar = () => {
    setTipo(null); setStep(0); setResultado(null);
    setUrbano(URBANO_DEFAULT); setRural(RURAL_DEFAULT);
    setDistAutoFill(false); setErro("");
  };

  const handleCepFill = (d: DadosCep) => {
    const hasKm = d.distanciaKm !== null;
    setDistAutoFill(hasKm);
    if (tipo === "URBANO") setUrbano(u => ({ ...u, cidade: d.cidade, padraoRegiao: d.padraoRegiao, distancia: d.distanciaKm ?? u.distancia }));
  };

  const form = tipo === "URBANO" ? urbano : rural;

  // ── Conteúdo de cada step ──
  const renderStep = () => {
    // Step 0 — tipo
    if (step === 0) return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TIPO_CARDS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => selecionarTipo(t.id)}
              className={`group relative overflow-hidden flex flex-col items-start gap-5 p-6 rounded-2xl border bg-gradient-to-br transition-all duration-300 outline-none text-left hover:-translate-y-1 hover:shadow-2xl ${t.border} ${t.grad}`}>
              <div className={`p-4 rounded-2xl ${t.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xl font-black text-white">{t.label}</p>
                <p className="text-sm text-gray-400 font-bold">{t.sub}</p>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{t.desc}</p>
              </div>
              <ChevronRight className="absolute top-5 right-5 w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" />
            </button>
          );
        })}
      </div>
    );

    // Step 1 — URBANO: Localização
    if (tipo === "URBANO" && step === 1) {
      const f = urbano;
      const set = (k: string) => (v: any) => setUrbano((prev: any) => ({ ...prev, [k]: v }));
      return (
        <div className="space-y-6">
          <div>
            <p className="text-lg font-black text-white mb-1">Onde fica o imóvel?</p>
            <p className="text-sm text-gray-500">Digite o CEP para preencher automaticamente, ou selecione a cidade manualmente.</p>
          </div>
          <CepInput onAutoFill={handleCepFill} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cidade */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Cidade</label>
              <select value={f.cidade} onChange={e => set("cidade")(e.target.value)}
                className="bg-[#1a2535] border border-white/10 rounded-2xl text-sm font-bold text-white px-4 py-3.5 outline-none cursor-pointer focus:border-green-500/40 transition-colors">
                <option value="" disabled className="bg-[#1a2535]">Selecione...</option>
                {CIDADES.map(c => <option key={c} value={c} className="bg-[#1a2535]">{c}</option>)}
              </select>
            </div>
            {/* Distância */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Distância do centro</label>
              {distAutoFill ? (
                <div className="flex items-center gap-2 bg-green-500/8 border border-green-500/25 rounded-2xl px-4 py-3.5">
                  <Navigation className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-white font-bold flex-1">{f.distancia} km</span>
                  <span className="text-[10px] font-black text-green-400/70 uppercase tracking-wider">via CEP</span>
                </div>
              ) : (
                <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-green-500/40 transition-colors">
                  <input type="number" min={0.5} max={60} step={0.5} value={f.distancia}
                    onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) set("distancia")(Math.min(60, Math.max(0.5, v))); }}
                    className="flex-1 bg-transparent text-white font-black text-lg px-4 py-3.5 outline-none min-w-0" />
                  <span className="px-4 text-gray-500 font-bold shrink-0">km</span>
                </div>
              )}
              {!distAutoFill && <p className="text-[10px] text-gray-600">Preenchido automaticamente ao buscar o CEP</p>}
            </div>
          </div>
          {/* Padrão da região */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Padrão da região</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REGIAO_LABEL.map((lbl, i) => (
                <button key={i} onClick={() => set("padraoRegiao")(i)}
                  className={`p-3 rounded-xl border transition-all outline-none text-center ${f.padraoRegiao === i ? "bg-green-600/20 border-green-500/50 text-white" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}>
                  <p className="text-xs font-black">{lbl}</p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed mt-1">{REGIAO_DESC[f.padraoRegiao]}</p>
            {f.cidade && <p className="text-[10px] text-gray-600">Ref.: {fmtBRL(resolverPrecoM2(f.cidade, f.padraoRegiao))}/m²</p>}
          </div>
        </div>
      );
    }

    // Step 2 — URBANO: Características
    if (tipo === "URBANO" && step === 2) {
      const f = urbano;
      const set = (k: string) => (v: any) => setUrbano((prev: any) => ({ ...prev, [k]: v }));
      return (
        <div className="space-y-6">
          <div>
            <p className="text-lg font-black text-white mb-1">Como é o imóvel?</p>
            <p className="text-sm text-gray-500">Informe área, cômodos e diferenciais do seu imóvel.</p>
          </div>
          <NumInput label="Área total (m²)" value={f.area} onChange={set("area")} min={20} max={5000} suffix="m²" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CounterInput label="Quartos" value={f.quartos} onChange={set("quartos")} min={1} max={5} icon={BedDouble} unit="q" />
            <CounterInput label="Banheiros" value={f.banheiros} onChange={set("banheiros")} min={1} max={4} icon={BedDouble} unit="bh" />
            <CounterInput label="Vagas" value={f.vagas} onChange={set("vagas")} min={0} max={3} icon={BedDouble} unit="vg" />
          </div>
          <ChipGroup label="Closet / Armário embutido" value={f.closet} onChange={set("closet")}
            options={CLOSET_OPTIONS.map(c => c.label)} descs={CLOSET_OPTIONS.map(c => c.desc)} />
        </div>
      );
    }

    // Step 3 — URBANO: Acabamento + Entorno
    if (tipo === "URBANO" && step === 3) {
      const f = urbano;
      const setF = (k: keyof UrbanoForm, v: number) => setUrbano(prev => ({ ...prev, [k]: v }));
      return (
        <div className="space-y-7">
          <div>
            <p className="text-lg font-black text-white mb-1">Acabamento e entorno</p>
            <p className="text-sm text-gray-500">Avalie cada item separadamente — o sistema calcula a média.</p>
          </div>
          <PadraoGranular f={f} onChange={setF} />
          <SprawlGranular f={f} onChange={setF} />
        </div>
      );
    }

    // Step 1 — RURAL: Área e produção
    if (tipo === "RURAL" && step === 1) return (
      <div className="space-y-6">
        <div>
          <p className="text-lg font-black text-white mb-1">Área e produção</p>
          <p className="text-sm text-gray-500">Dados principais da propriedade rural.</p>
        </div>
        <NumInput label="Área total (hectares)" value={rural.areaHa} onChange={v => setRural(r => ({ ...r, areaHa: v }))} min={1} max={100000} suffix="ha" />
        <NumInput label="Produtividade estimada" value={rural.produtividade} onChange={v => setRural(r => ({ ...r, produtividade: v }))} min={0} max={80} step={1} suffix="sc/ha" />
        <NumInput label="Distância da BR ou terminal de grãos" value={rural.distanciaTerminal} onChange={v => setRural(r => ({ ...r, distanciaTerminal: v }))} min={5} max={500} step={5} suffix="km" />
      </div>
    );

    // Step 2 — RURAL: Qualidade da terra
    if (tipo === "RURAL" && step === 2) return (
      <div className="space-y-6">
        <div>
          <p className="text-lg font-black text-white mb-1">Qualidade da terra</p>
          <p className="text-sm text-gray-500">Solo, água, logística e regularização documental.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ChipGroup label="Qualidade do solo"        value={rural.solo}         onChange={v => setRural(r => ({ ...r, solo: v }))}         options={SOLO_LABEL} />
          <ChipGroup label="Disponibilidade de água"  value={rural.agua}         onChange={v => setRural(r => ({ ...r, agua: v }))}         options={AGUA_LABEL} />
          <ChipGroup label="Infraestrutura logística" value={rural.logistica}    onChange={v => setRural(r => ({ ...r, logistica: v }))}    options={LOG_LABEL} />
          <ChipGroup label="Regularização documental" value={rural.documentacao} onChange={v => setRural(r => ({ ...r, documentacao: v }))} options={DOC_LABEL} />
        </div>
      </div>
    );

    return null;
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[11px] font-black text-green-400 uppercase tracking-widest">100% Gratuito · Sem cadastro</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-3">
            Quanto vale o seu imóvel?
          </h2>
          <p className="text-white/50 text-base leading-relaxed">
            Avalie o preço justo de <span className="text-white/80 font-semibold">casas e fazendas</span> no Mato Grosso de acordo com o mercado atual. Nossa calculadora usa dados reais e inteligência artificial — resultado preciso em segundos, sem precisar cadastrar.
          </p>
        </div>
        <div className="hidden md:flex flex-col gap-2.5 shrink-0">
          {[{ v: "2", l: "modelos", d: "Casa · Fazenda" }, { v: "17+", l: "cidades", d: "Todo o Mato Grosso" }, { v: "±8%", l: "precisão", d: "Intervalo de confiança" }].map(s => (
            <div key={s.l} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-2.5">
              <p className="text-lg font-black text-white w-10 shrink-0">{s.v}</p>
              <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.l}</p><p className="text-[10px] text-gray-600">{s.d}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RESULTADO ── */}
      {resultado && tipo && (
        <div ref={resultRef}>
          <Resultado valor={resultado} tipo={tipo} extra={form} onReset={resetar} />
        </div>
      )}

      {/* ── WIZARD ── */}
      {!resultado && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" ref={formRef}>

          {/* Coluna principal (2/3) */}
          <div className="lg:col-span-2">

            {/* Step indicator */}
            {tipo && <StepIndicator steps={steps} current={step} />}

            {/* Step content */}
            <div className="bg-[#0a0f1a] border border-white/8 rounded-2xl p-6 md:p-8 min-h-[320px]">
              <div key={stepKey} className={stepDir > 0 ? "step-forward" : "step-back"}>
                {renderStep()}
              </div>

              {/* Erro */}
              {erro && <p className="mt-4 text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{erro}</p>}

              {/* Navegação */}
              <div className={`flex gap-3 mt-8 ${step === 0 ? "justify-end" : "justify-between"}`}>
                {step > 0 && (
                  <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold px-5 py-3 rounded-xl transition-all text-sm outline-none">
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                )}
                {step > 0 && (
                  isLastStep ? (
                    <button onClick={calcular}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white font-black uppercase tracking-widest text-sm px-8 py-3 rounded-xl transition-all outline-none shadow-lg shadow-green-900/30">
                      <Zap className="w-4 h-4" /> Ver resultado
                    </button>
                  ) : (
                    <button onClick={() => navigate(1)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white font-bold px-6 py-3 rounded-xl transition-all text-sm outline-none">
                      Próximo <ChevronRight className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Coluna lateral (1/3) */}
          <div>
            {tipo && step > 0 ? (
              <StepSidebar steps={steps} current={step} />
            ) : (
              <div className="bg-[#0a0f1a] border border-white/5 rounded-2xl p-6 flex flex-col gap-5">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Como funciona</p>
                {[
                  { n: "01", t: "Escolha o tipo", d: "Casa ou fazenda." },
                  { n: "02", t: "Preencha as etapas", d: "Localização, características e acabamento." },
                  { n: "03", t: "Clique em Ver resultado", d: "O cálculo é feito com todos os dados." },
                  { n: "04", t: "Resultado completo", d: "Valor, faixa de confiança e resumo." },
                ].map(s => (
                  <div key={s.n} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-gray-600">{s.n}</span>
                    </div>
                    <div><p className="text-sm font-black text-white">{s.t}</p><p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{s.d}</p></div>
                  </div>
                ))}
                <div className="mt-2 bg-gradient-to-br from-green-500/8 to-transparent border border-green-500/15 rounded-xl p-4">
                  <p className="text-[10px] font-black text-green-400/80 uppercase tracking-widest mb-1.5">Metodologia</p>
                  <p className="text-xs text-gray-600 leading-relaxed">Modelo hedônico (Rosen 1974) + Urban Sprawl (Brueckner 2000) · OpenStreetMap · Haversine</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
