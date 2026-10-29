"use client";

/**
 * Peças compartilhadas da avaliação IQC.
 *
 * Vieram da página antiga, que era uma calculadora de uma tela só: preenchia
 * tudo, calculava e mostrava o resultado. Agora a avaliação é um artefato
 * colaborativo e de vida longa, então a lista, a tela de trabalho e o laudo
 * são páginas distintas — mas os inputs das variáveis e o painel de resultado
 * continuam os mesmos e ficam aqui.
 */

import {
  CheckCircle2, HardHat, Ruler, TrendingUp, ArrowUp, ArrowDown, RefreshCw, Award,
  type LucideIcon,
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";

export type TipoVar = "BINARIA" | "ORDINAL" | "CONTINUA" | "CATEGORICA";
export type Valor = boolean | number | string | undefined;
export type Resultado = Record<string, unknown>;

export interface VariavelCat {
  chave: string;
  label: string;
  tipo: TipoVar;
  unidade?: string | null;
  niveis?: number | null;
  categorias?: string[] | null;
}
export interface DimensaoCat {
  id: string;
  nome: string;
  peso: number;
  responsavel: string;
  variaveis: VariavelCat[];
}

export const RESP_ORDEM = ["Engenheiro", "Arquiteto", "Analista"];
export const RESP: Record<string, { rotulo: string; icon: LucideIcon; cor: string; ativo: string }> = {
  Engenheiro: { rotulo: "Engenheiro", icon: HardHat, cor: "text-amber-400", ativo: "bg-amber-500/15 border-amber-500/40 text-amber-300" },
  Arquiteto:  { rotulo: "Arquiteto", icon: Ruler, cor: "text-purple-400", ativo: "bg-purple-500/15 border-purple-500/40 text-purple-300" },
  Analista:   { rotulo: "Analista", icon: TrendingUp, cor: "text-sky-400", ativo: "bg-sky-500/15 border-sky-500/40 text-sky-300" },
};

export const TIERS: Record<string, { rotulo: string; cls: string }> = {
  ULTRA_LUXO:  { rotulo: "Ultra Luxo",  cls: "text-yellow-300 bg-yellow-500/10 border-yellow-500/30" },
  LUXO:        { rotulo: "Luxo",        cls: "text-purple-300 bg-purple-500/10 border-purple-500/30" },
  ALTO_PADRAO: { rotulo: "Alto Padrão", cls: "text-sky-300 bg-sky-500/10 border-sky-500/30" },
  MEDIO_ALTO:  { rotulo: "Médio-Alto",  cls: "text-teal-300 bg-teal-500/10 border-teal-500/30" },
  MEDIO:       { rotulo: "Médio",       cls: "text-orange-300 bg-orange-500/10 border-orange-500/30" },
  BASICO:      { rotulo: "Básico",      cls: "text-gray-300 bg-white/5 border-white/15" },
};

export const SCORE_KEY: Record<string, string> = {
  LOCALIZACAO: "scoreLocalizacao", PRODUTO: "scoreProduto", AMENIDADES: "scoreAmenidades",
  SEGURANCA: "scoreSeguranca", SERVICOS: "scoreServicos", SUSTENTABILIDADE: "scoreSustentabilidade",
  ECONOMICA: "scoreEconomica", MOBILIDADE: "scoreMobilidade",
};
export const SHORT: Record<string, string> = {
  LOCALIZACAO: "Local.", PRODUTO: "Produto", AMENIDADES: "Amenid.", SEGURANCA: "Segur.",
  SERVICOS: "Serviços", SUSTENTABILIDADE: "Sustent.", ECONOMICA: "Econ.", MOBILIDADE: "Mobil.",
};


export const preenchida = (val: Valor) => val !== undefined && val !== "" && val !== false && val !== null;

export function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

export function DimensaoCard({ d, respostas, setVar }: {
  d: DimensaoCat; respostas: Record<string, Valor>; setVar: (c: string, v: Valor) => void;
}) {
  const binarias = d.variaveis.filter((v) => v.tipo === "BINARIA");
  const outras = d.variaveis.filter((v) => v.tipo !== "BINARIA");

  return (
    <div className="bg-[#12121e] border border-white/8 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-white">{d.nome}</h3>
        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Peso {d.peso}%</span>
      </div>

      {/* binárias como chips densos */}
      {binarias.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {binarias.map((v) => {
            const on = !!respostas[v.chave];
            return (
              <button key={v.chave} onClick={() => setVar(v.chave, !on)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${on ? "bg-green-500/20 border-green-500/50 text-green-200" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/25"}`}>
                {on && <CheckCircle2 className="w-3 h-3" />}
                {v.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ordinais / contínuas / categóricas */}
      {outras.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {outras.map((v) => (
            <VariavelInput key={v.chave} v={v} valor={respostas[v.chave]} onChange={(val) => setVar(v.chave, val)} />
          ))}
        </div>
      )}
    </div>
  );
}

export function VariavelInput({ v, valor, onChange }: { v: VariavelCat; valor: Valor; onChange: (val: Valor) => void }) {
  if (v.tipo === "ORDINAL") {
    const niveis = v.niveis ?? 4;
    return (
      <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-200">{v.label}</span>
          <span className="text-[10px] text-gray-600">0–{niveis}</span>
        </div>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${niveis + 1}, minmax(0, 1fr))` }}>
          {Array.from({ length: niveis + 1 }, (_, i) => (
            <button key={i} onClick={() => onChange(valor === i ? undefined : i)}
              className={`py-1.5 rounded-lg text-xs font-black border transition-all ${valor === i ? "bg-green-600/25 border-green-500/50 text-white" : "bg-white/5 border-white/8 text-gray-500 hover:border-white/20"}`}>
              {i}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (v.tipo === "CATEGORICA") {
    const cats = v.categorias ?? [];
    return (
      <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-2.5">
        <span className="text-xs font-bold text-gray-200 block mb-2">{v.label}</span>
        <div className="flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button key={c} onClick={() => onChange(valor === c ? undefined : c)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition-all ${valor === c ? "bg-green-600/25 border-green-500/50 text-white" : "bg-white/5 border-white/8 text-gray-500 hover:border-white/20"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // CONTINUA
  return (
    <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-gray-200">{v.label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <input type="number" value={valor === undefined || typeof valor === "boolean" ? "" : valor}
          onChange={(e) => onChange(e.target.value)} placeholder="—"
          className="w-20 bg-white/5 border border-white/10 rounded-lg text-white font-bold px-2 py-1.5 outline-none focus:border-green-500/40 text-right" />
        <span className="text-[10px] text-gray-600 w-10">{v.unidade}</span>
      </div>
    </div>
  );
}

export type AssinaturaLaudo = {
  especialidade: string;
  especialidadeRotulo: string;
  pesoPercentual: number;
  status: string;
  assinadoPorNome?: string | null;
  registroProfissional?: string | null;
  dataFinalizacao?: string | null;
};

export function ResultadoIqc({ resultado, catalogo, onReset, assinaturas, completudeGeral }: {
  resultado: Resultado;
  catalogo: DimensaoCat[];
  onReset: () => void;
  assinaturas?: AssinaturaLaudo[];
  completudeGeral?: number;
}) {
  const tier = TIERS[String(resultado.tier ?? "")] ?? TIERS.BASICO;
  const score = Number(resultado.scoreFinal ?? 0);

  const dados = catalogo.map((d) => ({ dim: SHORT[d.id] ?? d.nome, score: Number(resultado[SCORE_KEY[d.id]] ?? 0), nome: d.nome }));
  const ranked = [...dados].sort((a, b) => b.score - a.score);
  const fortes = ranked.slice(0, 3);
  const fracos = [...ranked].reverse().slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Score + tier */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2518] via-[#0d1f15] to-[#091420] border border-green-500/30 p-7">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-black text-green-400/80 uppercase tracking-[0.2em]">Avaliação concluída</span>
          </div>
          <p className="text-xs font-bold text-green-400/50 uppercase tracking-widest mb-1">Score IQC</p>
          <p className="text-6xl font-black text-white tabular-nums leading-none">{score.toFixed(1)}<span className="text-2xl text-gray-500"> / 100</span></p>
          <div className="mt-5">
            <span className={`inline-flex items-center gap-2 text-sm font-black px-4 py-2 rounded-full border ${tier.cls}`}>
              <Award className="w-4 h-4" /> Tier {tier.rotulo}
            </span>
          </div>
          {resultado.nomeCondominio ? (
            <p className="text-sm text-gray-400 mt-5">{String(resultado.nomeCondominio)}{resultado.cidade ? ` · ${String(resultado.cidade)}` : ""}</p>
          ) : null}
        </div>

        {/* Radar */}
        <div className="bg-[#12121e] border border-white/8 rounded-2xl p-4">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 pl-2 pt-1">Perfil por dimensão</p>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <RadarChart data={dados} outerRadius="72%">
                <PolarGrid stroke="#ffffff18" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: "#9ca3af", fontSize: 11, fontWeight: 700 }} />
                <Radar dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ComposicaoDoScore resultado={resultado} completudeGeral={completudeGeral} />

      <DivergenciaPorDimensao resultado={resultado} catalogo={catalogo} />

      {/* Pontos fortes / fracos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <ListaDestaques titulo="Pontos fortes" itens={fortes} icon={ArrowUp} cor="text-green-400" />
        <ListaDestaques titulo="Pontos a melhorar" itens={fracos} icon={ArrowDown} cor="text-orange-400" />
      </div>

      {assinaturas && assinaturas.length > 0 && <Assinaturas partes={assinaturas} />}

      <button onClick={onReset}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold px-6 py-3 rounded-xl transition-all text-sm">
        <RefreshCw className="w-4 h-4" /> Atualizar
      </button>
    </div>
  );
}

/**
 * De onde veio o número.
 *
 * Sem isto o leitor supõe que o score já contempla os moradores, e a
 * completude fica escondida — um laudo com 40% preenchido parece tão sólido
 * quanto um completo. Aqui as duas coisas viajam junto do resultado.
 */
function ComposicaoDoScore({ resultado, completudeGeral }: {
  resultado: Resultado; completudeGeral?: number;
}) {
  const tecnico = resultado.scoreTecnico != null ? Number(resultado.scoreTecnico) : null;
  const moradores = resultado.scoreMoradores != null ? Number(resultado.scoreMoradores) : null;
  const aplicado = resultado.moradoresAplicado === true;
  const consideradas = Number(resultado.opinioesConsideradas ?? 0);
  const registradas = Number(resultado.opinioesRegistradas ?? 0);

  return (
    <div className="bg-[#12121e] border border-white/8 rounded-2xl p-5 space-y-4">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
        Como este número foi formado
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        <Parcela rotulo="Laudo técnico" peso="90%" valor={tecnico} destaque />
        <Parcela rotulo="Moradores" peso="10%" valor={aplicado ? moradores : null}
                 nota={aplicado ? undefined : "sem quórum"} />
        <Parcela rotulo="Preenchimento" peso="do checklist"
                 valor={completudeGeral ?? null} sufixo="%" />
      </div>

      {!aplicado && (
        <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 leading-relaxed">
          O bloco dos moradores <strong>não entrou</strong>: {consideradas} de {registradas} opiniões
          pontuam, e o mínimo é 3. O score acima é 100% técnico — não é uma média com os moradores
          zerados, e sim o técnico intacto.
        </p>
      )}

      {completudeGeral != null && completudeGeral < 70 && (
        <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 leading-relaxed">
          O checklist está {completudeGeral}% preenchido. Variáveis binárias não respondidas contam
          como ausência, então o score tende a sair <strong>abaixo</strong> do real enquanto o
          preenchimento não avança.
        </p>
      )}
    </div>
  );
}

function Parcela({ rotulo, peso, valor, sufixo = "", nota, destaque }: {
  rotulo: string; peso: string; valor: number | null; sufixo?: string; nota?: string; destaque?: boolean;
}) {
  return (
    <div className={`rounded-xl px-4 py-3 border ${
      destaque ? "bg-green-500/5 border-green-500/20" : "bg-[#09090f] border-white/5"
    }`}>
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{rotulo}</p>
      <p className="text-2xl font-black text-white tabular-nums leading-tight mt-1">
        {valor != null ? valor.toFixed(sufixo ? 0 : 1) + sufixo : "—"}
      </p>
      <p className="text-[10px] text-gray-600">{nota ?? peso}</p>
    </div>
  );
}

/**
 * Onde a vistoria e quem mora discordam.
 *
 * Costuma ser o dado mais útil do laudo: técnico deu 91 em Amenidades e morador
 * deu 50 significa que a estrutura existe e não funciona — coisa que nenhuma
 * das duas notas isoladas diria.
 */
function DivergenciaPorDimensao({ resultado, catalogo }: {
  resultado: Resultado; catalogo: DimensaoCat[];
}) {
  const porMorador = (resultado.scoresMoradoresPorDimensao ?? null) as Record<string, number> | null;
  if (!porMorador || resultado.moradoresAplicado !== true) return null;

  const linhas = catalogo
    .map((d) => {
      const tec = Number(resultado[SCORE_KEY[d.id]] ?? 0);
      const mor = Number(porMorador[d.id] ?? 0);
      return { id: d.id, nome: d.nome, tec, mor, delta: Math.round((mor - tec) * 10) / 10 };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return (
    <div className="bg-[#12121e] border border-white/8 rounded-2xl p-5">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
        Vistoria × quem mora
      </p>
      <p className="text-xs text-gray-600 mb-4 leading-relaxed">
        Ordenado pela maior divergência. Diferença grande e negativa costuma significar que a
        estrutura existe mas não funciona no dia a dia.
      </p>

      <div className="space-y-2">
        {linhas.map((l) => (
          <div key={l.id} className="flex items-center gap-3 text-xs">
            <span className="flex-1 text-gray-300 font-bold truncate">{l.nome}</span>
            <span className="w-12 text-right tabular-nums text-gray-400">{l.tec.toFixed(0)}</span>
            <span className="w-12 text-right tabular-nums text-gray-400">{l.mor.toFixed(0)}</span>
            <span className={`w-16 text-right tabular-nums font-black ${
              l.delta <= -15 ? "text-red-400" : l.delta >= 15 ? "text-sky-400" : "text-gray-600"
            }`}>
              {l.delta > 0 ? "+" : ""}{l.delta.toFixed(0)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-gray-600 uppercase tracking-wider mt-3 pt-3 border-t border-white/5">
        <span className="flex-1">dimensão</span>
        <span className="w-12 text-right">técnico</span>
        <span className="w-12 text-right">morador</span>
        <span className="w-16 text-right">diferença</span>
      </div>
    </div>
  );
}

/**
 * Quem responde tecnicamente por cada parte do laudo.
 *
 * É o que separa um formulário preenchido de um documento técnico: o registro
 * profissional fica visível ao lado das dimensões que a pessoa assinou.
 */
function Assinaturas({ partes }: { partes: AssinaturaLaudo[] }) {
  return (
    <div className="bg-[#12121e] border border-white/8 rounded-2xl p-5">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
        Responsabilidade técnica
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {partes.map((p) => (
          <div key={p.especialidade} className="bg-[#09090f] border border-white/5 rounded-xl px-4 py-3">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
              {p.especialidadeRotulo} · {p.pesoPercentual}%
            </p>
            {p.status === "FINALIZADA" ? (
              <>
                <p className="text-sm font-bold text-white mt-1 truncate">{p.assinadoPorNome}</p>
                {p.registroProfissional
                  ? <p className="text-xs text-gray-500 font-mono">{p.registroProfissional}</p>
                  : <p className="text-xs text-gray-600">sem conselho de classe</p>}
                {p.dataFinalizacao && (
                  <p className="text-[10px] text-gray-700 mt-1">
                    assinado em {new Date(p.dataFinalizacao).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-600 mt-1">não assinada</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListaDestaques({ titulo, itens, icon: Icon, cor }: {
  titulo: string; itens: { nome: string; score: number }[]; icon: LucideIcon; cor: string;
}) {
  return (
    <div className="bg-[#12121e] border border-white/8 rounded-2xl p-5">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${cor}`} /> {titulo}
      </p>
      <div className="space-y-2">
        {itens.map((it) => (
          <div key={it.nome} className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">{it.nome}</span>
            <span className="text-xs font-black text-gray-400 tabular-nums">{it.score.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
