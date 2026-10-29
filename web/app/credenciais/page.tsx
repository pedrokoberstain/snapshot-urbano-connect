"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Upload, ShieldCheck, CheckCircle2, Clock, XCircle,
  HardHat, Ruler, Plus, ExternalLink,
} from "lucide-react";
import { api, ErroApi } from "@/lib/api";

/**
 * Credencial profissional — lado de quem se habilita.
 *
 * Fora de /admin de propósito: o engenheiro chega à plataforma como cliente,
 * igual a todo mundo, e só depois de verificado passa a poder assumir partes
 * de laudo. Trancar esta tela atrás do painel exigiria já ser o que ele está
 * pedindo para ser.
 */

type Credencial = {
  id: number;
  profissao: "ENGENHEIRO" | "ARQUITETO" | "ANALISTA";
  profissaoRotulo: string;
  conselho?: string | null;
  status: "PENDENTE" | "APROVADA" | "RECUSADA" | "REVOGADA";
  vigente: boolean;
  vencida: boolean;
  registroFormatado?: string | null;
  validoAte?: string | null;
  motivoRecusa?: string | null;
  documentoRemovidoEm?: string | null;
};

const ICONE = { ENGENHEIRO: HardHat, ARQUITETO: Ruler, ANALISTA: ShieldCheck } as const;

export default function MinhasCredenciais() {
  const router = useRouter();
  const [credenciais, setCredenciais] = useState<Credencial[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const buscar = useCallback(async () => {
    return ((await api.get("/credenciais/minhas")) ?? []) as Credencial[];
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    let vivo = true;
    buscar()
      .then((c) => { if (vivo) setCredenciais(c); })
      .catch((e) => {
        if (vivo) setErro(e instanceof ErroApi ? e.message : "Não foi possível carregar suas credenciais.");
      })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [buscar, router]);

  const recarregar = () => buscar().then(setCredenciais).catch(() => setErro("Não foi possível atualizar."));

  return (
    <div className="min-h-screen bg-[#09090f] font-sans pb-20 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-green-600 rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none" />

      <main className="max-w-3xl mx-auto pt-10 px-4 relative z-10">
        <Link href="/" className="group inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors mb-6">
          <div className="p-2 rounded-full bg-white/5 border border-white/5 group-hover:bg-green-500/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold">Voltar</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Minha credencial</h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            Engenheiro e arquiteto assinam as dimensões técnicas do IQC. Para isso o registro no
            conselho precisa ser conferido uma vez — depois disso você passa a poder ser designado
            para os laudos.
          </p>
        </div>

        {erro && (
          <p className="mb-6 text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {erro}
          </p>
        )}

        {carregando ? (
          <div className="flex items-center gap-2 text-gray-500 py-16 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Carregando…
          </div>
        ) : (
          <div className="space-y-6">
            {credenciais.map((c) => <Cartao key={c.id} credencial={c} />)}

            {enviando ? (
              <Formulario onCancelar={() => setEnviando(false)}
                          onEnviada={() => { setEnviando(false); recarregar(); }} />
            ) : (
              <button onClick={() => setEnviando(true)}
                      className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-dashed border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:border-white/20 transition-colors">
                <Plus className="w-4 h-4" />
                {credenciais.length === 0 ? "Cadastrar minha credencial" : "Cadastrar outra credencial"}
              </button>
            )}

            {credenciais.some((c) => c.profissao === "ANALISTA") ? null : (
              <p className="text-xs text-gray-600 leading-relaxed text-center">
                Analista não tem conselho de classe, então não há registro a conferir — essa
                habilitação é concedida internamente pela equipe.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Cartao({ credencial: c }: { credencial: Credencial }) {
  const Icone = ICONE[c.profissao];
  const estilo = c.vigente
    ? { cor: "text-green-400", fundo: "bg-green-500/5 border-green-500/20", icone: CheckCircle2, rotulo: "Ativa" }
    : c.status === "PENDENTE"
    ? { cor: "text-amber-400", fundo: "bg-amber-500/5 border-amber-500/20", icone: Clock, rotulo: "Em análise" }
    : c.vencida
    ? { cor: "text-amber-400", fundo: "bg-amber-500/5 border-amber-500/20", icone: Clock, rotulo: "Vencida" }
    : { cor: "text-red-400", fundo: "bg-red-500/5 border-red-500/20", icone: XCircle,
        rotulo: c.status === "REVOGADA" ? "Revogada" : "Recusada" };
  const Status = estilo.icone;

  return (
    <div className={`rounded-2xl border p-5 space-y-3 ${estilo.fundo}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Icone className="w-5 h-5 text-gray-500 shrink-0" />
          <div className="min-w-0">
            <h2 className="font-black text-white">{c.profissaoRotulo}</h2>
            {c.registroFormatado && (
              <p className="text-xs text-gray-500 font-mono">{c.registroFormatado}</p>
            )}
          </div>
        </div>
        <span className={`shrink-0 flex items-center gap-1.5 text-xs font-black ${estilo.cor}`}>
          <Status className="w-4 h-4" /> {estilo.rotulo}
        </span>
      </div>

      {c.status === "PENDENTE" && (
        <p className="text-sm text-gray-400 leading-relaxed">
          Seu registro está sendo conferido no {c.conselho}. Assim que a análise terminar, o
          documento que você enviou é apagado — ele existe só para sustentar essa conferência.
        </p>
      )}

      {c.vencida && (
        <p className="text-sm text-gray-400 leading-relaxed">
          A validade informada ({c.validoAte}) já passou, então a credencial deixou de habilitar.
          Ela continua no seu histórico: basta reenviar com a anuidade em dia para reativar.
        </p>
      )}

      {c.motivoRecusa && (
        <p className="text-sm text-gray-300 bg-[#09090f] border border-white/5 rounded-xl px-4 py-3">
          {c.motivoRecusa}
        </p>
      )}

      {c.vigente && c.validoAte && (
        <p className="text-xs text-gray-600">Válida até {c.validoAte}.</p>
      )}
    </div>
  );
}

function Formulario({ onCancelar, onEnviada }: { onCancelar: () => void; onEnviada: () => void }) {
  const [profissao, setProfissao] = useState<"ENGENHEIRO" | "ARQUITETO">("ENGENHEIRO");
  const [numeroRegistro, setNumeroRegistro] = useState("");
  const [uf, setUf] = useState("MT");
  const [validoAte, setValidoAte] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  const conselho = profissao === "ENGENHEIRO" ? "CREA" : "CAU";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivo) return;
    setEnviando(true);
    setErro("");

    const dados = new FormData();
    dados.append("profissao", profissao);
    dados.append("numeroRegistro", numeroRegistro.trim());
    dados.append("ufRegistro", uf);
    if (validoAte) dados.append("validoAte", validoAte);
    dados.append("documento", arquivo);

    try {
      await api.post("/credenciais", dados);
      onEnviada();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="bg-[#12121e] border border-white/5 rounded-2xl p-5 space-y-5">
      <h2 className="font-black text-white">Cadastrar credencial</h2>

      <div>
        <label className="block text-xs font-bold text-gray-400 mb-2">Sou</label>
        <div className="flex gap-2">
          {(["ENGENHEIRO", "ARQUITETO"] as const).map((p) => (
            <button key={p} type="button" onClick={() => setProfissao(p)}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                      profissao === p ? "bg-green-500 text-black" : "bg-[#09090f] border border-white/10 text-gray-400 hover:text-white"
                    }`}>
              {p === "ENGENHEIRO" ? "Engenheiro" : "Arquiteto"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-400 mb-2">Número no {conselho}</label>
          <input required value={numeroRegistro} onChange={(e) => setNumeroRegistro(e.target.value)}
                 placeholder="Somente o número"
                 className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2">UF</label>
          <input required maxLength={2} value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())}
                 className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500/50 transition-colors" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 mb-2">Anuidade válida até (opcional)</label>
        <input type="date" value={validoAte} onChange={(e) => setValidoAte(e.target.value)}
               className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500/50 transition-colors" />
        <p className="text-xs text-gray-600 mt-2">
          Informando a validade, o sistema avisa você antes de a credencial parar de habilitar.
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 mb-2">Carteira do {conselho}</label>
        <label className="flex items-center gap-3 px-4 py-4 rounded-xl border border-dashed border-white/15 cursor-pointer hover:border-green-500/40 transition-colors">
          <Upload className="w-5 h-5 text-gray-500 shrink-0" />
          <span className="text-sm text-gray-400 truncate">
            {arquivo ? arquivo.name : "Foto ou PDF, até 10 MB"}
          </span>
          <input type="file" required accept="image/jpeg,image/png,application/pdf" className="hidden"
                 onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        </label>
        <p className="text-xs text-gray-600 mt-2 flex gap-2 leading-relaxed">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-px text-green-600" />
          O documento é apagado assim que a conferência termina. O que fica registrado é o número
          do seu registro, que é público — conferimos ele direto no {conselho}.
        </p>
      </div>

      {erro && <p className="text-sm font-bold text-red-400">{erro}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancelar}
                className="px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={!arquivo || !numeroRegistro.trim() || enviando}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          Enviar para conferência
        </button>
      </div>
    </form>
  );
}
