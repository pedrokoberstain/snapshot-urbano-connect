"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, UserPlus, Download, Check, X, ShieldCheck,
  Home, Clock, FileText, Trash2, AlertTriangle,
} from "lucide-react";
import { api, ErroApi } from "@/lib/api";
import { ROTULO_STATUS, type AcessoCondominio, type Condominio, type StatusAcesso } from "@/lib/tipos";
import Opinioes from "./Opinioes";

/**
 * Acessos e opiniões de um condomínio.
 *
 * Esta tela é onde alguém abre o comprovante de residência de outra pessoa —
 * documento com nome, endereço e às vezes CPF. Por isso ela deixa explícito o
 * ciclo de vida do arquivo: quando existe, quando foi aberto, e o registro de
 * que foi destruído na análise.
 */
export default function DetalheCondominio() {
  const { id } = useParams<{ id: string }>();

  const [condominio, setCondominio] = useState<Condominio | null>(null);
  const [acessos, setAcessos] = useState<AcessoCondominio[]>([]);
  const [aba, setAba] = useState<"acessos" | "opinioes">("acessos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [recusando, setRecusando] = useState<AcessoCondominio | null>(null);

  // A busca só devolve dados; quem grava no estado é o callback. Além de
  // satisfazer a regra do React 19 contra setState síncrono dentro de efeito,
  // permite recarregar depois de uma decisão sem piscar a tela inteira.
  const buscarDados = useCallback(async () => {
    const [c, a] = await Promise.all([
      api.get(`/condominios/${id}`),
      api.get(`/condominios/${id}/acessos`),
    ]);
    return { condominio: c as Condominio, acessos: (a ?? []) as AcessoCondominio[] };
  }, [id]);

  useEffect(() => {
    let vivo = true;
    buscarDados()
      .then(({ condominio, acessos }) => {
        if (!vivo) return;
        setCondominio(condominio);
        setAcessos(acessos);
      })
      .catch((e) => {
        if (vivo) setErro(e instanceof ErroApi ? e.message : "Não foi possível carregar o condomínio.");
      })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [buscarDados]);

  const recarregar = () =>
    buscarDados()
      .then(({ condominio, acessos }) => {
        setCondominio(condominio);
        setAcessos(acessos);
      })
      .catch(() => setErro("Não foi possível atualizar os dados."));

  async function decidir(acesso: AcessoCondominio, status: StatusAcesso, motivo?: string) {
    try {
      await api.patch(`/condominios/${id}/acessos/${acesso.id}`, { status, motivo });
      setRecusando(null);
      recarregar();
    } catch (e) {
      alert(e instanceof ErroApi ? e.message : "Não foi possível registrar a decisão.");
    }
  }

  async function baixarComprovante(acesso: AcessoCondominio) {
    try {
      const { blob, nome } = await api.baixar(`/condominios/${id}/acessos/${acesso.id}/comprovante`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nome;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof ErroApi ? e.message : "Não foi possível baixar o comprovante.");
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-20 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /> Carregando…
      </div>
    );
  }

  if (erro || !condominio) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <AlertTriangle className="w-10 h-10 text-gray-700 mx-auto mb-4" />
        <p className="text-gray-400 font-bold">{erro || "Condomínio não encontrado."}</p>
        <Link href="/admin/condominios" className="mt-5 inline-block text-sm font-bold text-green-400 hover:text-green-300">
          ← Voltar para condomínios
        </Link>
      </div>
    );
  }

  const pendentes = acessos.filter((a) => a.status === "PENDENTE");
  const avaliadores = acessos.filter((a) => a.papel === "AVALIADOR");
  const moradores = acessos.filter((a) => a.papel === "MORADOR" && a.status !== "PENDENTE");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/condominios"
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Condomínios
        </Link>
        <h1 className="text-2xl font-black text-white mt-2">{condominio.nome}</h1>
        <p className="text-sm text-gray-500">
          {[condominio.bairro, condominio.cidade, condominio.uf].filter(Boolean).join(", ")}
        </p>
      </div>

      <div className="flex gap-2 border-b border-white/5">
        <Aba ativa={aba === "acessos"} onClick={() => setAba("acessos")}
             rotulo="Acessos" contador={pendentes.length} />
        <Aba ativa={aba === "opinioes"} onClick={() => setAba("opinioes")} rotulo="Opiniões dos moradores" />
      </div>

      {aba === "opinioes" ? (
        <Opinioes condominioId={id} />
      ) : (
        <div className="space-y-8">
          {pendentes.length > 0 && (
            <Bloco titulo="Aguardando análise" icone={Clock} destaque>
              <div className="space-y-3">
                {pendentes.map((a) => (
                  <CartaoPendente key={a.id} acesso={a}
                                  onBaixar={() => baixarComprovante(a)}
                                  onAprovar={() => decidir(a, "APROVADO")}
                                  onRecusar={() => setRecusando(a)} />
                ))}
              </div>
            </Bloco>
          )}

          <Bloco titulo="Avaliadores" icone={ShieldCheck}>
            <ConcederAvaliador condominioId={id} onConcedido={recarregar} />
            <p className="text-xs text-gray-600 mt-3 leading-relaxed">
              Isto libera a pessoa a <strong>enxergar este condomínio</strong>. Quem preenche cada
              parte do laudo é definido dentro de cada avaliação, em{" "}
              <Link href="/admin/iqc" className="text-green-400 hover:text-green-300">Auditoria IQC</Link>{" "}
              → abrir a avaliação → <em>Designar</em> na especialidade. São duas coisas: uma dá
              acesso ao empreendimento, a outra diz quem responde por qual dimensão.
            </p>

            {avaliadores.length === 0 ? (
              <p className="text-sm text-gray-600 mt-4">
                Nenhum avaliador convidado ainda.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {avaliadores.map((a) => (
                  <Linha key={a.id} acesso={a} onRevogar={() => decidir(a, "REVOGADO")} />
                ))}
              </div>
            )}
          </Bloco>

          <Bloco titulo="Moradores" icone={Home}>
            {moradores.length === 0 ? (
              <p className="text-sm text-gray-600">
                Nenhum vínculo de morador analisado ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {moradores.map((a) => (
                  <Linha key={a.id} acesso={a}
                         onRevogar={a.status === "APROVADO" ? () => decidir(a, "REVOGADO") : undefined} />
                ))}
              </div>
            )}
          </Bloco>
        </div>
      )}

      {recusando && (
        <ModalRecusa
          acesso={recusando}
          onCancelar={() => setRecusando(null)}
          onConfirmar={(motivo) => decidir(recusando, "RECUSADO", motivo)}
        />
      )}
    </div>
  );
}

// ── Peças ──────────────────────────────────────────────────

function Aba({ ativa, onClick, rotulo, contador }: {
  ativa: boolean; onClick: () => void; rotulo: string; contador?: number;
}) {
  return (
    <button onClick={onClick}
            className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              ativa ? "text-green-400 border-green-500" : "text-gray-500 border-transparent hover:text-gray-300"
            }`}>
      {rotulo}
      {contador ? (
        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-400">
          {contador}
        </span>
      ) : null}
    </button>
  );
}

function Bloco({ titulo, icone: Icone, destaque, children }: {
  titulo: string; icone: React.ElementType; destaque?: boolean; children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl p-5 border ${
      destaque ? "bg-amber-500/5 border-amber-500/20" : "bg-[#12121e] border-white/5"
    }`}>
      <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest mb-4"
          style={{ color: destaque ? "#fbbf24" : "#22c55e" }}>
        <Icone className="w-4 h-4" /> {titulo}
      </h2>
      {children}
    </section>
  );
}

function CartaoPendente({ acesso, onBaixar, onAprovar, onRecusar }: {
  acesso: AcessoCondominio; onBaixar: () => void; onAprovar: () => void; onRecusar: () => void;
}) {
  return (
    <div className="bg-[#12121e] border border-white/10 rounded-xl p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-white truncate">{acesso.usuarioNome}</p>
          <p className="text-xs text-gray-500 truncate">{acesso.usuarioEmail}</p>
        </div>
        <div className="text-right text-xs text-gray-500 shrink-0">
          {acesso.unidade && <p>Unidade <span className="text-gray-300 font-bold">{acesso.unidade}</span></p>}
          {acesso.vinculo && <p className="capitalize">{acesso.vinculo.toLowerCase()}</p>}
          {acesso.mesesDeMoradia != null && <p>{acesso.mesesDeMoradia} meses de moradia</p>}
        </div>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed">
        Confira se o nome e o endereço do comprovante batem com o cadastro e com este condomínio.
        O arquivo é apagado assim que você decidir, seja qual for a decisão.
      </p>

      <div className="flex flex-wrap gap-2">
        {acesso.comprovanteDisponivel && (
          <button onClick={onBaixar}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white/5 text-gray-200 hover:bg-white/10 transition-colors">
            <Download className="w-3.5 h-3.5" /> Baixar comprovante
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

function Linha({ acesso, onRevogar }: { acesso: AcessoCondominio; onRevogar?: () => void }) {
  const cor: Record<StatusAcesso, string> = {
    APROVADO: "bg-green-500/10 text-green-400",
    PENDENTE: "bg-amber-500/10 text-amber-400",
    RECUSADO: "bg-red-500/10 text-red-400",
    REVOGADO: "bg-white/5 text-gray-500",
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-[#09090f] border border-white/5 rounded-xl px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{acesso.usuarioNome}</p>
        <p className="text-xs text-gray-600 truncate">{acesso.usuarioEmail}</p>
        {acesso.motivoRecusa && (
          <p className="text-xs text-red-400/80 mt-1">Motivo: {acesso.motivoRecusa}</p>
        )}
      </div>

      {acesso.papel === "MORADOR" && acesso.status === "APROVADO" && (
        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
          acesso.opiniaoContaNoCalculo ? "bg-green-500/10 text-green-400" : "bg-white/5 text-gray-500"
        }`}>
          {acesso.opiniaoContaNoCalculo ? "opinião pontua" : "menos de 6 meses"}
        </span>
      )}

      {acesso.comprovanteRemovidoEm && (
        <span title={`Comprovante apagado em ${formatarData(acesso.comprovanteRemovidoEm)}`}
              className="flex items-center gap-1 text-[10px] font-bold text-gray-600">
          <Trash2 className="w-3 h-3" /> documento apagado
        </span>
      )}

      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${cor[acesso.status]}`}>
        {ROTULO_STATUS[acesso.status]}
      </span>

      {onRevogar && (
        <button onClick={onRevogar}
                className="text-xs font-bold text-gray-600 hover:text-red-400 transition-colors">
          Revogar
        </button>
      )}
    </div>
  );
}

function ConcederAvaliador({ condominioId, onConcedido }: {
  condominioId: string; onConcedido: () => void;
}) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function conceder(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      await api.post(`/condominios/${condominioId}/acessos/avaliadores`, { email: email.trim() });
      setEmail("");
      onConcedido();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível conceder o acesso.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={conceder} className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="e-mail de quem vai avaliar"
          className="flex-1 bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition-colors"
        />
        <button type="submit" disabled={enviando}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-50">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Conceder acesso
        </button>
      </div>
      {erro && <p className="text-xs font-bold text-red-400">{erro}</p>}
    </form>
  );
}

function ModalRecusa({ acesso, onCancelar, onConfirmar }: {
  acesso: AcessoCondominio; onCancelar: () => void; onConfirmar: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#12121e] border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-400" /> Recusar vínculo
        </h3>
        <p className="text-sm text-gray-500">
          Explique o que houve com o comprovante de <span className="text-gray-300 font-bold">{acesso.usuarioNome}</span>.
          Sem motivo, a pessoa reenvia exatamente o mesmo arquivo.
        </p>
        <textarea
          rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus
          placeholder="Ex.: o endereço do comprovante não corresponde a este condomínio."
          className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500/50 transition-colors"
        />
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

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
