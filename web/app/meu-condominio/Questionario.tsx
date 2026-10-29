"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2, ArrowLeft, ArrowRight, Check, EyeOff, User, Info, Send,
} from "lucide-react";
import { api, ErroApi } from "@/lib/api";
import { ROTULO_FREQUENCIA, type CatalogoOpiniao, type OpiniaoMorador, type PerguntaMorador } from "@/lib/tipos";

/**
 * Questionário do morador — os 10% do IQC.
 *
 * Assistente de 5 telas em vez de uma página com 16 perguntas: quem já teve o
 * trabalho de enviar a conta de luz não pode desistir na rolagem.
 *
 * Toda pergunta pode ser pulada. "Não sei avaliar" é resposta legítima e não
 * penaliza o condomínio — ninguém deve chutar sobre o que não conhece só para
 * a barra de progresso fechar.
 */

const NAO_SEI = "NAO_SEI";
const NAO_SE_APLICA = "NAO_SE_APLICA";

type Props = {
  condominioId: number;
  condominioNome: string;
  onVoltar: () => void;
};

export default function Questionario({ condominioId, condominioNome, onVoltar }: Props) {
  const [catalogo, setCatalogo] = useState<CatalogoOpiniao | null>(null);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [paraInteressado, setParaInteressado] = useState("");
  const [oQueMudaria, setOQueMudaria] = useState("");
  const [identificar, setIdentificar] = useState(false);

  const [passo, setPasso] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);

  const buscarDados = useCallback(async () => {
    const cat = (await api.get("/moradores/opiniao/catalogo")) as CatalogoOpiniao;
    let existente: OpiniaoMorador | null = null;
    try {
      existente = (await api.get(`/moradores/opiniao/${condominioId}`)) as OpiniaoMorador;
    } catch {
      // 404 é o caso normal de quem ainda não respondeu.
    }
    return { cat, existente };
  }, [condominioId]);

  useEffect(() => {
    let vivo = true;
    buscarDados()
      .then(({ cat, existente }) => {
        if (!vivo) return;
        setCatalogo(cat);
        if (existente) {
          const anteriores: Record<string, string> = {};
          for (const [k, v] of Object.entries(existente.respostas ?? {})) {
            if (v !== null && v !== undefined) anteriores[k] = String(v);
          }
          setRespostas(anteriores);
          setParaInteressado(existente.comentarioParaInteressado ?? "");
          setOQueMudaria(existente.comentarioOQueMudaria ?? "");
          setIdentificar(existente.identificada);
        }
      })
      .catch((e) => {
        if (vivo) setErro(e instanceof ErroApi ? e.message : "Não foi possível carregar o questionário.");
      })
      .finally(() => { if (vivo) setCarregando(false); });
    return () => { vivo = false; };
  }, [buscarDados]);

  async function enviar() {
    setEnviando(true);
    setErro("");
    try {
      await api.put(`/moradores/opiniao/${condominioId}`, {
        respostas,
        identificarAutor: identificar,
        comentarioParaInteressado: paraInteressado.trim() || null,
        comentarioOQueMudaria: oQueMudaria.trim() || null,
      });
      setSalvo(true);
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não foi possível enviar suas respostas.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-20 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /> Carregando…
      </div>
    );
  }

  if (!catalogo) {
    return <Aviso texto={erro || "Questionário indisponível no momento."} onVoltar={onVoltar} />;
  }

  if (salvo) {
    return <Concluido condominioNome={condominioNome} onVoltar={onVoltar} />;
  }

  const totalPassos = catalogo.telas.length + 1; // +1 para a tela de comentários
  const naTelaFinal = passo === catalogo.telas.length;
  const tela = catalogo.telas[passo];
  const respondidas = Object.keys(respostas).length;

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onVoltar}
                className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Meus condomínios
        </button>
        <h2 className="text-2xl font-black text-white mt-2">{condominioNome}</h2>
        <p className="text-sm text-gray-500">
          Sua opinião vale {catalogo.pesoPercentual}% da nota final do condomínio.
        </p>
      </div>

      <Progresso passo={passo} total={totalPassos} respondidas={respondidas} />

      <div className="bg-[#12121e] border border-white/5 rounded-2xl p-5 sm:p-6 space-y-6">
        {naTelaFinal ? (
          <TelaFinal
            paraInteressado={paraInteressado} setParaInteressado={setParaInteressado}
            oQueMudaria={oQueMudaria} setOQueMudaria={setOQueMudaria}
            identificar={identificar} setIdentificar={setIdentificar}
          />
        ) : (
          <>
            <h3 className="text-lg font-black text-white">{tela.titulo}</h3>
            <div className="space-y-6">
              {tela.perguntas.map((p) => (
                <Pergunta key={p.chave} pergunta={p} valor={respostas[p.chave]}
                          onResponder={(v) => setRespostas((r) => ({ ...r, [p.chave]: v }))} />
              ))}
            </div>
          </>
        )}
      </div>

      {erro && (
        <p className="text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {erro}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setPasso((p) => Math.max(0, p - 1))} disabled={passo === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {naTelaFinal ? (
          <button onClick={enviar} disabled={enviando}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-50">
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar minha opinião
          </button>
        ) : (
          <button onClick={() => setPasso((p) => p + 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-white/5 text-white hover:bg-white/10 transition-colors">
            Continuar <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Peças ──────────────────────────────────────────────────

function Progresso({ passo, total, respondidas }: { passo: number; total: number; respondidas: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span className="font-bold">Etapa {passo + 1} de {total}</span>
        <span>{respondidas} de 16 respondidas</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all duration-300"
             style={{ width: `${((passo + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}

function Pergunta({ pergunta, valor, onResponder }: {
  pergunta: PerguntaMorador; valor?: string; onResponder: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-gray-200 leading-relaxed">{pergunta.enunciado}</p>

      {pergunta.tipo === "FREQUENCIA" ? (
        <div className="flex flex-wrap gap-2">
          {(pergunta.opcoes ?? []).map((op) => (
            <Opcao key={op} ativa={valor === op} onClick={() => onResponder(op)}
                   rotulo={ROTULO_FREQUENCIA[op] ?? op} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-11 gap-1">
            {Array.from({ length: 11 }, (_, n) => (
              <button key={n} onClick={() => onResponder(String(n))}
                      className={`aspect-square rounded-lg text-xs font-black transition-colors ${
                        valor === String(n)
                          ? "bg-green-500 text-black"
                          : "bg-[#09090f] text-gray-500 hover:bg-white/5 hover:text-gray-300"
                      }`}>
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 leading-tight gap-4">
            <span className="max-w-[45%]">{pergunta.ancoraZero}</span>
            <span className="max-w-[45%] text-right">{pergunta.ancoraDez}</span>
          </div>
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <Opcao ativa={valor === NAO_SEI} onClick={() => onResponder(NAO_SEI)} rotulo="Não sei avaliar" discreta />
        {pergunta.permiteNaoSeAplica && (
          <Opcao ativa={valor === NAO_SE_APLICA} onClick={() => onResponder(NAO_SE_APLICA)}
                 rotulo="Não se aplica aqui" discreta />
        )}
      </div>
    </div>
  );
}

function Opcao({ ativa, onClick, rotulo, discreta }: {
  ativa: boolean; onClick: () => void; rotulo: string; discreta?: boolean;
}) {
  return (
    <button onClick={onClick}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
              ativa
                ? "bg-green-500 text-black"
                : discreta
                ? "bg-transparent border border-white/10 text-gray-600 hover:text-gray-400 hover:border-white/20"
                : "bg-[#09090f] text-gray-400 hover:bg-white/5 hover:text-gray-200"
            }`}>
      {rotulo}
    </button>
  );
}

function TelaFinal({
  paraInteressado, setParaInteressado, oQueMudaria, setOQueMudaria, identificar, setIdentificar,
}: {
  paraInteressado: string; setParaInteressado: (v: string) => void;
  oQueMudaria: string; setOQueMudaria: (v: string) => void;
  identificar: boolean; setIdentificar: (v: boolean) => void;
}) {
  return (
    <>
      <h3 className="text-lg font-black text-white">Para terminar</h3>
      <p className="text-sm text-gray-500 -mt-4">
        Os dois campos abaixo são opcionais e não entram na nota. Eles aparecem no laudo do
        condomínio.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2">
            O que você diria para alguém pensando em morar aqui?
          </label>
          <textarea rows={3} maxLength={1000} value={paraInteressado}
                    onChange={(e) => setParaInteressado(e.target.value)}
                    className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition-colors"
                    placeholder="O que você gostaria de ter sabido antes de se mudar." />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2">
            Se pudesse mudar uma coisa no condomínio, qual seria?
          </label>
          <textarea rows={3} maxLength={1000} value={oQueMudaria}
                    onChange={(e) => setOQueMudaria(e.target.value)}
                    className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition-colors"
                    placeholder="Uma coisa só, a que mais faria diferença." />
        </div>
      </div>

      <div className="border-t border-white/5 pt-5 space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-green-500">Como você quer aparecer</p>

        <button onClick={() => setIdentificar(false)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                  !identificar ? "bg-green-500/5 border-green-500/30" : "bg-[#09090f] border-white/10 hover:border-white/20"
                }`}>
          <EyeOff className={`w-5 h-5 shrink-0 mt-0.5 ${!identificar ? "text-green-500" : "text-gray-600"}`} />
          <span>
            <span className="block text-sm font-bold text-white">Anônimo</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              Quem lê o laudo vê seu vínculo e uma faixa de tempo de moradia, nunca seu nome.
            </span>
          </span>
        </button>

        <button onClick={() => setIdentificar(true)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                  identificar ? "bg-green-500/5 border-green-500/30" : "bg-[#09090f] border-white/10 hover:border-white/20"
                }`}>
          <User className={`w-5 h-5 shrink-0 mt-0.5 ${identificar ? "text-green-500" : "text-gray-600"}`} />
          <span>
            <span className="block text-sm font-bold text-white">Assinar com meu nome</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              Seu nome e seu tempo de moradia aparecem junto das respostas.
            </span>
          </span>
        </button>

        <p className="text-xs text-gray-600 flex gap-2 leading-relaxed">
          <Info className="w-4 h-4 shrink-0 mt-px" />
          Você pode mudar isso depois, reenviando o questionário — inclusive voltar ao anonimato.
        </p>
      </div>
    </>
  );
}

function Concluido({ condominioNome, onVoltar }: { condominioNome: string; onVoltar: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-5">
        <Check className="w-7 h-7 text-green-500" />
      </div>
      <h2 className="text-2xl font-black text-white">Opinião registrada</h2>
      <p className="text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
        Obrigado. Sua avaliação do {condominioNome} entra no laudo junto com a dos outros
        moradores. Você pode revisar ou alterar suas respostas quando quiser.
      </p>
      <button onClick={onVoltar}
              className="mt-6 px-6 py-3 rounded-xl text-sm font-bold bg-white/5 text-white hover:bg-white/10 transition-colors">
        Voltar
      </button>
    </div>
  );
}

function Aviso({ texto, onVoltar }: { texto: string; onVoltar: () => void }) {
  return (
    <div className="text-center py-16">
      <p className="text-gray-400 font-bold">{texto}</p>
      <button onClick={onVoltar} className="mt-4 text-sm font-bold text-green-400 hover:text-green-300">
        ← Voltar
      </button>
    </div>
  );
}
