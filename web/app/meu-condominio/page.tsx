"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Search, Upload, Clock, CheckCircle2,
  XCircle, ShieldCheck, FileText, MessageSquareQuote, Plus,
} from "lucide-react";
import { api, ErroApi } from "@/lib/api";
import {
  ROTULO_STATUS, type AcessoCondominio, type CondominioResumo,
} from "@/lib/tipos";
import Questionario from "./Questionario";

/**
 * Área do morador.
 *
 * Fora de /admin de propósito: aquele layout redireciona USUARIO para a home,
 * e morador é justamente um usuário comum. Aqui ele encontra o próprio prédio,
 * comprova que mora lá e responde o questionário que vale 10% do IQC.
 */
export default function MeuCondominio() {
  const router = useRouter();

  const [vinculos, setVinculos] = useState<AcessoCondominio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [vinculando, setVinculando] = useState(false);
  const [respondendo, setRespondendo] = useState<AcessoCondominio | null>(null);

  const buscarVinculos = useCallback(async () => {
    return ((await api.get("/moradores/solicitacoes")) ?? []) as AcessoCondominio[];
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    let vivo = true;
    buscarVinculos()
      .then((lista) => { if (vivo) setVinculos(lista); })
      .catch((e) => {
        if (vivo) setErro(e instanceof ErroApi ? e.message : "Não foi possível carregar seus vínculos.");
      })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [buscarVinculos, router]);

  const recarregar = () =>
    buscarVinculos()
      .then(setVinculos)
      .catch(() => setErro("Não foi possível atualizar a lista."));

  return (
    <div className="min-h-screen bg-[#09090f] font-sans pb-20 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-green-600 rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none" />

      <main className="max-w-3xl mx-auto pt-10 px-4 relative z-10">
        <Link href="/" className="group inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors mb-6 outline-none">
          <div className="p-2 rounded-full bg-white/5 border border-white/5 group-hover:bg-green-500/10 group-hover:border-green-500/20 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold">Voltar</span>
        </Link>

        {respondendo ? (
          <Questionario
            condominioId={respondendo.condominioId}
            condominioNome={respondendo.condominioNome}
            onVoltar={() => { setRespondendo(null); recarregar(); }}
          />
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Meu condomínio</h1>
              <p className="text-gray-500 mt-2 leading-relaxed">
                Quem mora sabe o que uma vistoria de um dia não mostra. Sua avaliação vale 10% da
                nota do condomínio — e só quem comprova residência pode dá-la.
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
                {vinculos.map((v) => (
                  <CartaoVinculo key={v.id} vinculo={v} onResponder={() => setRespondendo(v)} />
                ))}

                {vinculando ? (
                  <FormularioVinculo
                    onCancelar={() => setVinculando(false)}
                    onEnviado={() => { setVinculando(false); recarregar(); }}
                  />
                ) : (
                  <button onClick={() => setVinculando(true)}
                          className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-dashed border-white/10 text-sm font-bold text-gray-400 hover:text-white hover:border-white/20 transition-colors">
                    <Plus className="w-4 h-4" />
                    {vinculos.length === 0 ? "Vincular ao meu condomínio" : "Vincular a outro condomínio"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── Vínculo existente ──────────────────────────────────────

function CartaoVinculo({ vinculo, onResponder }: {
  vinculo: AcessoCondominio; onResponder: () => void;
}) {
  const estilos = {
    APROVADO: { icone: CheckCircle2, cor: "text-green-400", fundo: "bg-green-500/5 border-green-500/20" },
    PENDENTE: { icone: Clock, cor: "text-amber-400", fundo: "bg-amber-500/5 border-amber-500/20" },
    RECUSADO: { icone: XCircle, cor: "text-red-400", fundo: "bg-red-500/5 border-red-500/20" },
    REVOGADO: { icone: XCircle, cor: "text-gray-500", fundo: "bg-white/5 border-white/10" },
  }[vinculo.status];
  const Icone = estilos.icone;

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${estilos.fundo}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-black text-white truncate">{vinculo.condominioNome}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {vinculo.unidade ? `Unidade ${vinculo.unidade}` : "Unidade não informada"}
            {vinculo.vinculo ? ` · ${vinculo.vinculo.charAt(0)}${vinculo.vinculo.slice(1).toLowerCase()}` : ""}
          </p>
        </div>
        <span className={`shrink-0 flex items-center gap-1.5 text-xs font-black ${estilos.cor}`}>
          <Icone className="w-4 h-4" /> {ROTULO_STATUS[vinculo.status]}
        </span>
      </div>

      {vinculo.status === "PENDENTE" && (
        <p className="text-sm text-gray-400 leading-relaxed">
          Seu comprovante está em análise. Assim que for conferido, ele é apagado — o documento
          não fica guardado depois que cumpre a finalidade.
        </p>
      )}

      {vinculo.status === "RECUSADO" && (
        <div className="text-sm text-gray-400 leading-relaxed">
          <p>Seu vínculo não foi aprovado.</p>
          {vinculo.motivoRecusa && (
            <p className="mt-2 bg-[#09090f] border border-white/5 rounded-xl px-4 py-3 text-gray-300">
              {vinculo.motivoRecusa}
            </p>
          )}
          <p className="mt-2 text-gray-600">Você pode enviar um novo comprovante abaixo.</p>
        </div>
      )}

      {vinculo.status === "APROVADO" && (
        <>
          {!vinculo.opiniaoContaNoCalculo && (
            <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 leading-relaxed">
              Você mora aqui há menos de 6 meses. Sua opinião fica registrada e aparece no laudo,
              mas ainda não entra na nota — várias perguntas são sobre os últimos 12 meses.
            </p>
          )}
          <button onClick={onResponder}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors">
            <MessageSquareQuote className="w-4 h-4" /> Avaliar meu condomínio
          </button>
        </>
      )}
    </div>
  );
}

// ── Nova solicitação ───────────────────────────────────────

function FormularioVinculo({ onCancelar, onEnviado }: {
  onCancelar: () => void; onEnviado: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<CondominioResumo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [escolhido, setEscolhido] = useState<CondominioResumo | null>(null);

  const [unidade, setUnidade] = useState("");
  const [vinculo, setVinculo] = useState<"PROPRIETARIO" | "INQUILINO">("PROPRIETARIO");
  const [desde, setDesde] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  // Condição derivada em vez de limpar estado dentro do efeito: se o termo
  // encolhe abaixo de 3 letras, os resultados antigos simplesmente deixam de
  // ser exibidos — não há por que gastar um render para zerá-los.
  const termo = busca.trim();
  const podeBuscar = !escolhido && termo.length >= 3;

  useEffect(() => {
    if (!podeBuscar) return;
    const t = setTimeout(() => {
      setBuscando(true);
      api.get(`/moradores/condominios?busca=${encodeURIComponent(termo)}`)
        .then((r) => setResultados((r ?? []) as CondominioResumo[]))
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false));
    }, 400);
    return () => clearTimeout(t);
  }, [termo, podeBuscar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!escolhido || !arquivo || !desde) return;

    setEnviando(true);
    setErro("");
    const dados = new FormData();
    dados.append("condominioId", String(escolhido.id));
    dados.append("unidade", unidade);
    dados.append("vinculo", vinculo);
    // O campo é mês/ano; a API espera data completa.
    dados.append("moradorDesde", `${desde}-01`);
    dados.append("comprovante", arquivo);

    try {
      await api.post("/moradores/solicitacoes", dados);
      onEnviado();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível enviar sua solicitação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="bg-[#12121e] border border-white/5 rounded-2xl p-5 space-y-5">
      <h2 className="font-black text-white">Comprovar que moro aqui</h2>

      {escolhido ? (
        <div className="flex items-center justify-between gap-3 bg-[#09090f] border border-green-500/20 rounded-xl px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{escolhido.nome}</p>
            <p className="text-xs text-gray-500 truncate">
              {[escolhido.bairro, escolhido.cidade, escolhido.uf].filter(Boolean).join(", ")}
            </p>
          </div>
          <button type="button" onClick={() => { setEscolhido(null); setBusca(""); }}
                  className="shrink-0 text-xs font-bold text-gray-500 hover:text-white transition-colors">
            trocar
          </button>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2">Qual é o seu condomínio?</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)}
                   placeholder="Nome, bairro ou cidade"
                   className="w-full bg-[#09090f] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition-colors" />
            {buscando && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 animate-spin" />}
          </div>

          {podeBuscar && !buscando && resultados.length === 0 && (
            <p className="text-xs text-gray-600 mt-2">
              Nenhum condomínio encontrado. Ele só aparece aqui depois de cadastrado na plataforma.
            </p>
          )}

          {podeBuscar && resultados.length > 0 && (
            <div className="mt-2 space-y-1 max-h-56 overflow-y-auto">
              {resultados.map((c) => (
                <button key={c.id} type="button" onClick={() => setEscolhido(c)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-[#09090f] border border-white/5 hover:border-green-500/30 transition-colors">
                  <p className="text-sm font-bold text-white">{c.nome}</p>
                  <p className="text-xs text-gray-500">
                    {[c.bairro, c.cidade, c.uf].filter(Boolean).join(", ")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {escolhido && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">Unidade</label>
              <input value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="302, bloco B, lote 14…"
                     className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">Moro aqui desde</label>
              <input type="month" required value={desde} max={new Date().toISOString().slice(0, 7)}
                     onChange={(e) => setDesde(e.target.value)}
                     className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500/50 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Sou</label>
            <div className="flex gap-2">
              {(["PROPRIETARIO", "INQUILINO"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setVinculo(v)}
                        className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                          vinculo === v ? "bg-green-500 text-black" : "bg-[#09090f] border border-white/10 text-gray-400 hover:text-white"
                        }`}>
                  {v === "PROPRIETARIO" ? "Proprietário" : "Inquilino"}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Proprietário e inquilino costumam ver o condomínio de forma diferente, e o laudo
              mostra as duas médias separadas.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Comprovante de residência</label>
            <label className="flex items-center gap-3 px-4 py-4 rounded-xl border border-dashed border-white/15 cursor-pointer hover:border-green-500/40 transition-colors">
              <Upload className="w-5 h-5 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-400 truncate">
                {arquivo ? arquivo.name : "Conta de luz em JPG, PNG ou PDF (até 10 MB)"}
              </span>
              <input type="file" required accept="image/jpeg,image/png,application/pdf" className="hidden"
                     onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
            </label>
            <p className="text-xs text-gray-600 mt-2 flex gap-2 leading-relaxed">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-px text-green-600" />
              O documento fica guardado só até a análise e é apagado logo depois. Ele não vai para
              nenhum serviço externo e só é aberto por quem administra o condomínio na plataforma.
            </p>
          </div>

          {erro && <p className="text-sm font-bold text-red-400">{erro}</p>}
        </>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancelar}
                className="px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={!escolhido || !arquivo || !desde || enviando}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Enviar para análise
        </button>
      </div>
    </form>
  );
}
