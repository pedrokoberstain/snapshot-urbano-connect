"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck, Loader2, Download, Check, X, ExternalLink, Clock,
  HardHat, Ruler, ShieldCheck, UserPlus, Trash2,
} from "lucide-react";
import { api, ErroApi } from "@/lib/api";

/**
 * Fila de conferência das credenciais profissionais.
 *
 * O ponto forte desta tela não é o documento anexado — é o link da consulta
 * pública do conselho. Uma carteira em PDF qualquer um monta; o registro no
 * CREA ou no CAU, não. O documento serve para casar o nome com a pessoa; a
 * validade do registro se confere na fonte.
 */

type Credencial = {
  id: number;
  usuarioId: number;
  usuarioNome: string;
  usuarioEmail: string;
  profissao: "ENGENHEIRO" | "ARQUITETO" | "ANALISTA";
  profissaoRotulo: string;
  conselho?: string | null;
  status: "PENDENTE" | "APROVADA" | "RECUSADA" | "REVOGADA";
  vigente: boolean;
  vencida: boolean;
  registroFormatado?: string | null;
  validoAte?: string | null;
  motivoRecusa?: string | null;
  documentoDisponivel: boolean;
  documentoRemovidoEm?: string | null;
  analisadoPorNome?: string | null;
  consultaPublica?: string | null;
};

const ICONE = { ENGENHEIRO: HardHat, ARQUITETO: Ruler, ANALISTA: ShieldCheck } as const;

export default function FilaDeCredenciais() {
  const [credenciais, setCredenciais] = useState<Credencial[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [recusando, setRecusando] = useState<Credencial | null>(null);

  const buscar = useCallback(async () => {
    return ((await api.get("/admin/credenciais")) ?? []) as Credencial[];
  }, []);

  useEffect(() => {
    let vivo = true;
    buscar()
      .then((c) => { if (vivo) setCredenciais(c); })
      .catch((e) => {
        if (vivo) setErro(e instanceof ErroApi ? e.message : "Não foi possível carregar a fila.");
      })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [buscar]);

  const recarregar = () => buscar().then(setCredenciais).catch(() => setErro("Não foi possível atualizar."));

  async function decidir(c: Credencial, status: string, motivo?: string) {
    try {
      await api.patch(`/admin/credenciais/${c.id}`, { status, motivo });
      setRecusando(null);
      recarregar();
    } catch (e) {
      alert(e instanceof ErroApi ? e.message : "Não foi possível registrar a decisão.");
    }
  }

  async function baixar(c: Credencial) {
    try {
      const { blob, nome } = await api.baixar(`/admin/credenciais/${c.id}/documento`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = nome; link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof ErroApi ? e.message : "Não foi possível baixar o documento.");
    }
  }

  const pendentes = credenciais.filter((c) => c.status === "PENDENTE");
  const resto = credenciais.filter((c) => c.status !== "PENDENTE");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <BadgeCheck className="w-6 h-6 text-green-500" /> Credenciais profissionais
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Quem está habilitado a assinar as dimensões técnicas do IQC.
        </p>
      </div>

      <DesignarAnalista onDesignado={recarregar} />

      {erro && (
        <p className="text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 py-16 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Carregando…
        </div>
      ) : (
        <>
          {pendentes.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-400 mb-3">
                <Clock className="w-4 h-4" /> Aguardando conferência
              </h2>
              <div className="space-y-3">
                {pendentes.map((c) => (
                  <CartaoPendente key={c.id} c={c} onBaixar={() => baixar(c)}
                                  onAprovar={() => decidir(c, "APROVADA")}
                                  onRecusar={() => setRecusando(c)} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-600 mb-3">
              Credenciais registradas
            </h2>
            {resto.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhuma credencial analisada ainda.</p>
            ) : (
              <div className="space-y-2">
                {resto.map((c) => (
                  <Linha key={c.id} c={c}
                         onRevogar={c.status === "APROVADA" ? () => decidir(c, "REVOGADA",
                           "Revogada pela administração.") : undefined} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {recusando && (
        <ModalRecusa credencial={recusando} onCancelar={() => setRecusando(null)}
                     onConfirmar={(motivo) => decidir(recusando, "RECUSADA", motivo)} />
      )}
    </div>
  );
}

function CartaoPendente({ c, onBaixar, onAprovar, onRecusar }: {
  c: Credencial; onBaixar: () => void; onAprovar: () => void; onRecusar: () => void;
}) {
  const Icone = ICONE[c.profissao];
  return (
    <div className="bg-[#12121e] border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Icone className="w-5 h-5 text-gray-500 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{c.usuarioNome}</p>
            <p className="text-xs text-gray-500 truncate">{c.usuarioEmail}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-white">{c.profissaoRotulo}</p>
          <p className="text-xs text-gray-400 font-mono">{c.registroFormatado}</p>
          {c.validoAte && <p className="text-[11px] text-gray-600">válida até {c.validoAte}</p>}
        </div>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed">
        Confira o número no site do conselho e veja se o nome bate com o da conta. O documento
        anexado ajuda a casar nome e pessoa, mas quem atesta o registro é o {c.conselho}.
      </p>

      <div className="flex flex-wrap gap-2">
        {c.consultaPublica && (
          <a href={c.consultaPublica} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Consultar no {c.conselho}
          </a>
        )}
        {c.documentoDisponivel && (
          <button onClick={onBaixar}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white/5 text-gray-200 hover:bg-white/10 transition-colors">
            <Download className="w-3.5 h-3.5" /> Baixar carteira
          </button>
        )}
        <button onClick={onAprovar}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-green-500 text-black hover:bg-green-400 transition-colors">
          <Check className="w-3.5 h-3.5" /> Aprovar
        </button>
        <button onClick={onRecusar}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
          <X className="w-3.5 h-3.5" /> Recusar
        </button>
      </div>
    </div>
  );
}

function Linha({ c, onRevogar }: { c: Credencial; onRevogar?: () => void }) {
  const cor = c.vigente ? "bg-green-500/10 text-green-400"
    : c.vencida ? "bg-amber-500/10 text-amber-400"
    : "bg-white/5 text-gray-500";
  const rotulo = c.vigente ? "ativa" : c.vencida ? "vencida" : c.status.toLowerCase();

  return (
    <div className="flex flex-wrap items-center gap-3 bg-[#09090f] border border-white/5 rounded-xl px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{c.usuarioNome}</p>
        <p className="text-xs text-gray-600 truncate">
          {c.profissaoRotulo}{c.registroFormatado ? ` · ${c.registroFormatado}` : ""}
        </p>
        {c.motivoRecusa && <p className="text-xs text-red-400/80 mt-1">{c.motivoRecusa}</p>}
      </div>
      {c.documentoRemovidoEm && (
        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
          <Trash2 className="w-3 h-3" /> documento apagado
        </span>
      )}
      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${cor}`}>{rotulo}</span>
      {onRevogar && (
        <button onClick={onRevogar} className="text-xs font-bold text-gray-600 hover:text-red-400 transition-colors">
          Revogar
        </button>
      )}
    </div>
  );
}

/** Analista não tem conselho: não há registro a conferir, então é designação direta. */
function DesignarAnalista({ onDesignado }: { onDesignado: () => void }) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function designar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      await api.post("/admin/credenciais/analistas", { email: email.trim() });
      setEmail("");
      onDesignado();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível designar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="bg-[#12121e] border border-white/5 rounded-2xl p-5">
      <h2 className="text-[11px] font-black uppercase tracking-widest text-green-500 mb-1">
        Designar analista
      </h2>
      <p className="text-xs text-gray-600 mb-4 leading-relaxed">
        Analista não tem conselho de classe, então não há registro a conferir nem fila de análise —
        a habilitação é interna e vale a partir do momento em que você concede.
      </p>
      <form onSubmit={designar} className="flex flex-col sm:flex-row gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
               placeholder="e-mail de quem será analista"
               className="flex-1 bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition-colors" />
        <button type="submit" disabled={enviando}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-white/5 text-white hover:bg-white/10 transition-colors disabled:opacity-50">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Designar
        </button>
      </form>
      {erro && <p className="text-xs font-bold text-red-400 mt-2">{erro}</p>}
    </section>
  );
}

function ModalRecusa({ credencial, onCancelar, onConfirmar }: {
  credencial: Credencial; onCancelar: () => void; onConfirmar: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#12121e] border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-black text-white">Recusar credencial</h3>
        <p className="text-sm text-gray-500">
          Diga o que não confere no registro de{" "}
          <span className="text-gray-300 font-bold">{credencial.usuarioNome}</span>. Sem isso a
          pessoa reenvia exatamente os mesmos dados.
        </p>
        <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus
                  placeholder="Ex.: o número não consta na consulta do CREA-MT."
                  className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500/50 transition-colors" />
        <div className="flex justify-end gap-2">
          <button onClick={onCancelar}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onConfirmar(motivo)} disabled={!motivo.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Recusar
          </button>
        </div>
      </div>
    </div>
  );
}
