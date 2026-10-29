"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Save, PenLine, Calculator, Unlock, UserPlus,
  CheckCircle2, Clock, AlertTriangle, Info, HardHat, Ruler, TrendingUp,
} from "lucide-react";
import { api, ErroApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  DimensaoCard, ResultadoIqc, type DimensaoCat, type Resultado, type Valor,
} from "../componentes";

/**
 * Tela de trabalho de uma avaliação IQC.
 *
 * Cada profissional vê e edita apenas as dimensões da especialidade dele. A
 * trava não é só visual: o servidor recusa chave de outra especialidade e
 * devolve quais foram recusadas. Esconder aba não impede ninguém de mandar o
 * JSON na mão — a tela existe para deixar o trabalho claro, não para proteger.
 */

type Especialidade = "ENGENHEIRO" | "ARQUITETO" | "ANALISTA";

type Parte = {
  id: number;
  especialidade: Especialidade;
  especialidadeRotulo: string;
  conselho?: string | null;
  obrigatoriaParaConcluir: boolean;
  dimensoes: string[];
  pesoPercentual: number;
  status: "AGUARDANDO" | "EM_ANDAMENTO" | "FINALIZADA";
  responsavelId?: number | null;
  responsavelNome?: string | null;
  assinadoPorNome?: string | null;
  registroProfissional?: string | null;
  dataFinalizacao?: string | null;
};

type PainelPartes = {
  partes: Parte[];
  completudePorDimensao: Record<string, number>;
  completudeGeral: number;
  pendentesParaConcluir: Especialidade[];
};

type Avaliacao = {
  id: number;
  nomeCondominio: string;
  cidade?: string | null;
  bairro?: string | null;
  status: "RASCUNHO" | "CONCLUIDA";
  respostas?: Record<string, Valor>;
  observacoes?: string | null;
} & Resultado;

const ICONE: Record<Especialidade, typeof HardHat> = {
  ENGENHEIRO: HardHat, ARQUITETO: Ruler, ANALISTA: TrendingUp,
};

export default function TrabalhoAvaliacaoIqc() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [painel, setPainel] = useState<PainelPartes | null>(null);
  const [catalogo, setCatalogo] = useState<DimensaoCat[]>([]);
  const [respostas, setRespostas] = useState<Record<string, Valor>>({});
  const [sujo, setSujo] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const buscar = useCallback(async () => {
    const [a, p, cat] = await Promise.all([
      api.get(`/iqc/${id}`),
      api.get(`/iqc/${id}/partes`),
      api.get("/iqc/catalogo"),
    ]);
    return {
      avaliacao: a as Avaliacao,
      painel: p as PainelPartes,
      catalogo: (cat?.dimensoes ?? []) as DimensaoCat[],
    };
  }, [id]);

  useEffect(() => {
    let vivo = true;
    buscar()
      .then(({ avaliacao, painel, catalogo }) => {
        if (!vivo) return;
        setAvaliacao(avaliacao);
        setPainel(painel);
        setCatalogo(catalogo);
        setRespostas((avaliacao.respostas ?? {}) as Record<string, Valor>);
      })
      .catch((e) => {
        if (vivo) setErro(e instanceof ErroApi ? e.message : "Não foi possível carregar a avaliação.");
      })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [buscar]);

  const recarregar = () =>
    buscar()
      .then(({ avaliacao, painel, catalogo }) => {
        setAvaliacao(avaliacao);
        setPainel(painel);
        setCatalogo(catalogo);
        setRespostas((avaliacao.respostas ?? {}) as Record<string, Valor>);
        setSujo(false);
      })
      .catch(() => setErro("Não foi possível atualizar a tela."));

  if (carregando) {
    return <div className="flex items-center gap-2 text-gray-500 py-20 justify-center">
      <Loader2 className="w-5 h-5 animate-spin" /> Carregando…
    </div>;
  }

  if (!avaliacao || !painel) {
    return <div className="max-w-md mx-auto text-center py-20">
      <AlertTriangle className="w-10 h-10 text-gray-700 mx-auto mb-4" />
      <p className="text-gray-400 font-bold">{erro || "Avaliação não encontrada."}</p>
      <Link href="/admin/iqc" className="mt-5 inline-block text-sm font-bold text-green-400">← Voltar</Link>
    </div>;
  }

  const minhaParte = painel.partes.find((p) => p.responsavelId && p.responsavelId === user?.id);
  const souCoordenador = user?.tipo === "ADMIN";
  const minhasDimensoes = minhaParte?.dimensoes ?? [];
  const podeEditar = Boolean(minhaParte) && minhaParte!.status !== "FINALIZADA";

  // Coordenador que não responde por nenhuma parte enxerga tudo, só que travado.
  const dimensoesVisiveis = minhaParte
    ? catalogo.filter((d) => minhasDimensoes.includes(d.id))
    : souCoordenador ? catalogo : [];

  async function salvar() {
    if (!minhaParte) return;
    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      // Manda só o que é da minha especialidade. O servidor filtra de novo —
      // isto aqui é para não gerar recusa à toa, não é a proteção.
      const meu: Record<string, Valor> = {};
      for (const d of catalogo) {
        if (!minhasDimensoes.includes(d.id)) continue;
        for (const v of d.variaveis) {
          const val = respostas[v.chave];
          if (v.tipo === "BINARIA") meu[v.chave] = !!val;
          else if (val !== undefined && val !== "") meu[v.chave] = v.tipo === "CONTINUA" || v.tipo === "ORDINAL" ? Number(val) : val;
        }
      }
      const r = await api.put(`/iqc/${id}/respostas`, { respostas: meu });
      if (r?.recusadas?.length) {
        setAviso(`O servidor recusou ${r.recusadas.length} resposta(s) fora da sua especialidade.`);
      }
      await recarregar();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function acao(caminho: string, corpo?: unknown, confirmacao?: string) {
    if (confirmacao && !confirm(confirmacao)) return;
    setErro("");
    try {
      await api.post(caminho, corpo ?? {});
      await recarregar();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível concluir a ação.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/iqc" className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Avaliações
        </Link>
        <h1 className="text-2xl font-black text-white mt-2">{avaliacao.nomeCondominio}</h1>
        <p className="text-sm text-gray-500">
          {[avaliacao.bairro, avaliacao.cidade].filter(Boolean).join(", ")}
        </p>
      </div>

      <Completude painel={painel} />

      <section className="grid gap-3 md:grid-cols-3">
        {painel.partes.map((p) => (
          <CartaoParte key={p.id} parte={p} avaliacaoId={id}
                       souCoordenador={souCoordenador} souEu={p.responsavelId === user?.id}
                       onMudou={recarregar}
                       onReabrir={() => acao(`/iqc/${id}/partes/${p.especialidade}/reabrir`, {},
                         "Reabrir descarta a assinatura desta parte e devolve o laudo para rascunho. Continuar?")}
                       onFinalizar={() => acao(`/iqc/${id}/partes/${p.especialidade}/finalizar`, {},
                         "Ao assinar, sua parte fica travada e seu nome e registro vão para o laudo. Continuar?")} />
        ))}
      </section>

      {erro && <p className="text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{erro}</p>}
      {aviso && <p className="text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">{aviso}</p>}

      {avaliacao.status === "CONCLUIDA" && avaliacao.scoreFinal != null && (
        <ResultadoIqc resultado={avaliacao} catalogo={catalogo} onReset={recarregar}
                      assinaturas={painel.partes} completudeGeral={painel.completudeGeral} />
      )}

      <ConcluirLaudo painel={painel} podeConcluir={souCoordenador}
                     onCalcular={() => acao(`/iqc/${id}/calcular`)} />

      {dimensoesVisiveis.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-green-500">
              {minhaParte
                ? `Sua parte — ${minhaParte.especialidadeRotulo}`
                : "Todas as dimensões (somente leitura)"}
            </h2>
            {podeEditar && (
              <button onClick={salvar} disabled={salvando || !sujo}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {sujo ? "Salvar" : "Salvo"}
              </button>
            )}
          </div>

          {!podeEditar && (
            <p className="text-xs text-gray-600 flex gap-2 leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-px" />
              {minhaParte
                ? "Sua parte está assinada e travada. Peça a reabertura ao coordenador para editar."
                : "Você não responde por nenhuma parte desta avaliação — está vendo o conteúdo em modo leitura."}
            </p>
          )}

          <div className={podeEditar ? "space-y-4" : "space-y-4 opacity-60 pointer-events-none"}>
            {dimensoesVisiveis.map((d) => (
              <DimensaoCard key={d.id} d={d} respostas={respostas}
                            setVar={(c, v) => { setRespostas((r) => ({ ...r, [c]: v })); setSujo(true); }} />
            ))}
          </div>
        </section>
      )}

      {!minhaParte && !souCoordenador && (
        <p className="text-sm text-gray-500 text-center py-10">
          Você ainda não foi designado para nenhuma parte desta avaliação.
        </p>
      )}
    </div>
  );
}

// ── Peças ──────────────────────────────────────────────────

/**
 * A completude viaja junto do score porque sem ela um laudo com 5 respostas de
 * 154 parece tão sólido quanto um completo.
 */
function Completude({ painel }: { painel: PainelPartes }) {
  const pct = painel.completudeGeral;
  const cor = pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="bg-[#12121e] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">
          Preenchimento do laudo
        </span>
        <span className="text-2xl font-black text-white">{pct}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${cor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 mt-4">
        {Object.entries(painel.completudePorDimensao).map(([dim, valor]) => (
          <div key={dim} className="flex items-center justify-between text-[11px]">
            <span className="text-gray-600 truncate">{dim.toLowerCase()}</span>
            <span className={`font-bold ${valor === 0 ? "text-gray-700" : "text-gray-300"}`}>{valor}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CartaoParte({ parte, avaliacaoId, souCoordenador, souEu, onMudou, onFinalizar, onReabrir }: {
  parte: Parte; avaliacaoId: string; souCoordenador: boolean; souEu: boolean;
  onMudou: () => void; onFinalizar: () => void; onReabrir: () => void;
}) {
  const Icone = ICONE[parte.especialidade];
  const assinada = parte.status === "FINALIZADA";

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${
      assinada ? "bg-green-500/5 border-green-500/20" : "bg-[#12121e] border-white/5"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icone className="w-4 h-4 text-gray-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate">{parte.especialidadeRotulo}</p>
            <p className="text-[10px] text-gray-600">
              {parte.pesoPercentual}% do laudo
              {parte.obrigatoriaParaConcluir ? " · assinatura obrigatória" : " · não trava a conclusão"}
            </p>
          </div>
        </div>
        {assinada
          ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          : <Clock className="w-4 h-4 text-gray-600 shrink-0" />}
      </div>

      {assinada ? (
        <div className="text-xs">
          <p className="text-gray-300 font-bold truncate">{parte.assinadoPorNome}</p>
          {parte.registroProfissional && (
            <p className="text-gray-500 font-mono">{parte.registroProfissional}</p>
          )}
        </div>
      ) : parte.responsavelNome ? (
        <p className="text-xs text-gray-400 truncate">{parte.responsavelNome}</p>
      ) : (
        <p className="text-xs text-gray-600">Sem responsável designado</p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {souEu && !assinada && (
          <button onClick={onFinalizar}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-green-500 text-black hover:bg-green-400 transition-colors">
            <PenLine className="w-3 h-3" /> Assinar
          </button>
        )}
        {souCoordenador && assinada && (
          <button onClick={onReabrir}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-gray-300 hover:bg-white/10 transition-colors">
            <Unlock className="w-3 h-3" /> Reabrir
          </button>
        )}
        {souCoordenador && !assinada && (
          <Designar avaliacaoId={avaliacaoId} especialidade={parte.especialidade} onMudou={onMudou} />
        )}
      </div>
    </div>
  );
}

function Designar({ avaliacaoId, especialidade, onMudou }: {
  avaliacaoId: string; especialidade: Especialidade; onMudou: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function designar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      await api.put(`/iqc/${avaliacaoId}/partes/${especialidade}/responsavel`, { email: email.trim() });
      setAberto(false);
      setEmail("");
      onMudou();
    } catch (e) {
      // A API explica qual das quatro situações é: sem credencial, em análise,
      // recusada ou vencida. Repassar a mensagem dela vale mais que um genérico.
      setErro(e instanceof ErroApi ? e.message : "Não foi possível designar.");
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 text-gray-300 hover:bg-white/10 transition-colors">
        <UserPlus className="w-3 h-3" /> Designar
      </button>
    );
  }

  return (
    <form onSubmit={designar} className="w-full space-y-2">
      <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
             placeholder="e-mail do profissional"
             className="w-full bg-[#09090f] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-green-500/50" />
      {erro && <p className="text-[11px] font-bold text-red-400 leading-snug">{erro}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={enviando}
                className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-green-500 text-black hover:bg-green-400 disabled:opacity-50">
          {enviando ? "…" : "Confirmar"}
        </button>
        <button type="button" onClick={() => { setAberto(false); setErro(""); }}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-500 hover:text-white">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ConcluirLaudo({ painel, podeConcluir, onCalcular }: {
  painel: PainelPartes; podeConcluir: boolean; onCalcular: () => void;
}) {
  const pendentes = painel.pendentesParaConcluir;
  const liberado = pendentes.length === 0;

  if (!podeConcluir) return null;

  return (
    <div className={`rounded-2xl border p-5 ${
      liberado ? "bg-green-500/5 border-green-500/20" : "bg-[#12121e] border-white/5"
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black text-white">Concluir o laudo</p>
          <p className="text-xs text-gray-500 mt-1 max-w-xl leading-relaxed">
            {liberado
              ? "Engenheiro e arquiteto assinaram. O cálculo mistura as 8 dimensões técnicas com os 10% dos moradores, quando houver quórum."
              : `Faltam as assinaturas de ${pendentes.join(" e ").toLowerCase()}. Sem elas o número sairia sem responsável técnico por trás.`}
          </p>
        </div>
        <button onClick={onCalcular} disabled={!liberado}
                className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <Calculator className="w-4 h-4" /> Calcular IQC
        </button>
      </div>
    </div>
  );
}
