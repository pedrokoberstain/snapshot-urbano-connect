"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, Plus, Loader2, Lock, ClipboardList, HardHat, Ruler, TrendingUp,
  CheckCircle2, Clock, X,
} from "lucide-react";
import { api, ErroApi } from "@/lib/api";
import type { Condominio } from "@/lib/tipos";

/**
 * Avaliações IQC.
 *
 * Antes esta tela era uma calculadora de uma vez só: preenchia tudo, calculava,
 * mostrava. Com o laudo colaborativo a avaliação passou a ser um artefato de
 * vida longa — três profissionais trabalham nela ao longo de dias —, então
 * aqui vira lista e o trabalho acontece na tela de cada avaliação.
 */

type Avaliacao = {
  id: number;
  nomeCondominio: string;
  cidade?: string | null;
  bairro?: string | null;
  status: "RASCUNHO" | "CONCLUIDA";
  scoreFinal?: number | null;
  scoreTecnico?: number | null;
  tier?: string | null;
  dataCriacao?: string;
};

type Parte = {
  id: number;
  avaliacaoId: number;
  especialidade: "ENGENHEIRO" | "ARQUITETO" | "ANALISTA";
  especialidadeRotulo: string;
  status: "AGUARDANDO" | "EM_ANDAMENTO" | "FINALIZADA";
  pesoPercentual: number;
};

const ICONE_ESP = { ENGENHEIRO: HardHat, ARQUITETO: Ruler, ANALISTA: TrendingUp } as const;

export default function AvaliacoesIqc() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [minhasPartes, setMinhasPartes] = useState<Parte[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [semAcesso, setSemAcesso] = useState(false);
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);

  const buscar = useCallback(async () => {
    const [lista, partes] = await Promise.all([
      api.get("/iqc"),
      api.get("/iqc/minhas-partes"),
    ]);
    return { lista: (lista ?? []) as Avaliacao[], partes: (partes ?? []) as Parte[] };
  }, []);

  useEffect(() => {
    let vivo = true;
    buscar()
      .then(({ lista, partes }) => {
        if (!vivo) return;
        setAvaliacoes(lista);
        setMinhasPartes(partes);
      })
      .catch((e) => {
        if (!vivo) return;
        if (e instanceof ErroApi && e.semPermissao) setSemAcesso(true);
        else setErro(e instanceof ErroApi ? e.message : "Não foi possível carregar as avaliações.");
      })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [buscar]);

  const recarregar = () =>
    buscar()
      .then(({ lista, partes }) => { setAvaliacoes(lista); setMinhasPartes(partes); })
      .catch(() => setErro("Não foi possível atualizar a lista."));

  if (semAcesso) return <SemAcesso />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-green-500" /> Avaliações IQC
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cada laudo é preenchido por engenheiro, arquiteto e analista, cada um nas dimensões dele.
          </p>
        </div>
        <button onClick={() => setCriando(true)}
                className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors">
          <Plus className="w-4 h-4" /> Nova avaliação
        </button>
      </div>

      {erro && (
        <p className="text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {erro}
        </p>
      )}

      {minhasPartes.length > 0 && (
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-green-500 mb-3">
            Aguardando você
          </h2>
          <div className="space-y-2">
            {minhasPartes.map((p) => {
              const av = avaliacoes.find((a) => a.id === p.avaliacaoId);
              const Icone = ICONE_ESP[p.especialidade];
              return (
                <Link key={p.id} href={`/admin/iqc/${p.avaliacaoId}`}
                      className="flex items-center gap-3 bg-[#12121e] border border-white/5 rounded-xl px-4 py-3 hover:border-green-500/30 transition-colors">
                  <Icone className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {av?.nomeCondominio ?? `Avaliação #${p.avaliacaoId}`}
                    </p>
                    <p className="text-xs text-gray-600">
                      Sua parte: {p.especialidadeRotulo} · {p.pesoPercentual}% do laudo
                    </p>
                  </div>
                  <StatusParte status={p.status} />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 py-16 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Carregando…
        </div>
      ) : avaliacoes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-bold">Nenhuma avaliação ainda</p>
          <p className="text-sm text-gray-600 mt-1 max-w-sm mx-auto">
            Cadastre o condomínio primeiro e depois abra a avaliação dele.
          </p>
        </div>
      ) : (
        <section className="space-y-2">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-600 mb-3">
            Todas as avaliações
          </h2>
          {avaliacoes.map((a) => (
            <Link key={a.id} href={`/admin/iqc/${a.id}`}
                  className="flex items-center gap-4 bg-[#12121e] border border-white/5 rounded-xl px-4 py-3 hover:border-white/15 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{a.nomeCondominio}</p>
                <p className="text-xs text-gray-600 truncate">
                  {[a.bairro, a.cidade].filter(Boolean).join(", ") || "sem localização informada"}
                </p>
              </div>
              {a.status === "CONCLUIDA" && a.scoreFinal != null ? (
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-white leading-none">{a.scoreFinal.toFixed(1)}</p>
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider">{a.tier}</p>
                </div>
              ) : (
                <span className="shrink-0 text-[10px] font-black uppercase px-2 py-1 rounded-md bg-white/5 text-gray-500">
                  em preenchimento
                </span>
              )}
            </Link>
          ))}
        </section>
      )}

      {criando && (
        <NovaAvaliacao onFechar={() => setCriando(false)} onCriada={() => { setCriando(false); recarregar(); }} />
      )}
    </div>
  );
}

function StatusParte({ status }: { status: Parte["status"] }) {
  if (status === "FINALIZADA") {
    return <span className="shrink-0 flex items-center gap-1 text-[10px] font-black uppercase text-green-400">
      <CheckCircle2 className="w-3.5 h-3.5" /> assinada
    </span>;
  }
  return <span className="shrink-0 flex items-center gap-1 text-[10px] font-black uppercase text-amber-400">
    <Clock className="w-3.5 h-3.5" /> {status === "AGUARDANDO" ? "a iniciar" : "em andamento"}
  </span>;
}

/**
 * A avaliação nasce só com o condomínio. As respostas vêm depois, de cada
 * profissional na parte dele — não faz mais sentido pedir tudo aqui.
 */
function NovaAvaliacao({ onFechar, onCriada }: { onFechar: () => void; onCriada: () => void }) {
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [escolhido, setEscolhido] = useState<number | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    api.get("/condominios")
      .then((r) => { if (vivo) setCondominios((r ?? []) as Condominio[]); })
      .catch(() => { if (vivo) setErro("Não foi possível carregar os condomínios."); })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!escolhido) return;
    setSalvando(true);
    setErro("");
    try {
      await api.post("/iqc", { condominioId: escolhido, observacoes: observacoes.trim() || null });
      onCriada();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível abrir a avaliação.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <form onSubmit={criar} className="w-full max-w-lg bg-[#12121e] border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-black text-white">Nova avaliação</h2>
          <button type="button" onClick={onFechar} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {carregando ? (
            <div className="flex items-center gap-2 text-gray-500 py-6 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Carregando condomínios…
            </div>
          ) : condominios.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400 font-bold">Nenhum condomínio cadastrado</p>
              <p className="text-xs text-gray-600 mt-1">
                A avaliação é sempre de um condomínio cadastrado. Cadastre um primeiro.
              </p>
              <Link href="/admin/condominios"
                    className="mt-4 inline-block text-sm font-bold text-green-400 hover:text-green-300">
                Ir para condomínios →
              </Link>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Condomínio</label>
                <select value={escolhido ?? ""} onChange={(e) => setEscolhido(Number(e.target.value) || null)}
                        className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500/50 transition-colors">
                  <option value="">Selecione</option>
                  {condominios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}{c.cidade ? ` — ${c.cidade}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Observações (opcional)</label>
                <textarea rows={3} value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Contexto da vistoria, data prevista, quem acompanha…"
                          className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition-colors" />
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                A avaliação abre com as três partes vazias. Depois você designa quem responde por
                cada especialidade, e cada profissional preenche só as dimensões dele.
              </p>
            </>
          )}

          {erro && <p className="text-sm font-bold text-red-400">{erro}</p>}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/5">
          <button type="button" onClick={onFechar}
                  className="px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={!escolhido || salvando}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
            Abrir avaliação
          </button>
        </div>
      </form>
    </div>
  );
}

function SemAcesso() {
  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-5">
        <Lock className="w-7 h-7 text-green-500" />
      </div>
      <h1 className="text-2xl font-black text-white">Área restrita</h1>
      <p className="text-gray-500 mt-3 leading-relaxed">
        A auditoria IQC é preenchida por profissionais credenciados — engenheiro, arquiteto e
        analista. Se você é um deles, cadastre sua credencial e aguarde a verificação do registro.
      </p>
      <Link href="/credenciais"
            className="mt-6 inline-block px-6 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors">
        Cadastrar minha credencial
      </Link>
    </div>
  );
}
