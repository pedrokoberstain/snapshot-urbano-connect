"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Eye, EyeOff, MessageSquareQuote, Users2, Info } from "lucide-react";
import { api, ErroApi } from "@/lib/api";
import {
  ROTULO_FAIXA, ROTULO_FREQUENCIA,
  type CatalogoOpiniao, type OpiniaoMorador, type PerguntaMorador,
} from "@/lib/tipos";

/**
 * As opiniões dos moradores como elas entram no laudo.
 *
 * A tela respeita a escolha de cada um: quem assinou aparece com nome, quem
 * não assinou aparece só com o vínculo e a faixa de tempo de moradia. Não há
 * como o avaliador descobrir quem respondeu o quê — e isso é deliberado: se
 * desse para descobrir, ninguém responderia com sinceridade.
 */
export default function Opinioes({ condominioId }: { condominioId: string }) {
  const [opinioes, setOpinioes] = useState<OpiniaoMorador[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogoOpiniao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // A busca só devolve dados; quem grava no estado é o callback. Além de
  // satisfazer a regra do React 19 contra setState síncrono dentro de efeito,
  // separa I/O de estado — a função fica testável sem montar o componente.
  const buscarDados = useCallback(async () => {
    const [lista, cat] = await Promise.all([
      api.get(`/condominios/${condominioId}/opinioes`),
      api.get("/moradores/opiniao/catalogo"),
    ]);
    return { lista: (lista ?? []) as OpiniaoMorador[], catalogo: cat as CatalogoOpiniao };
  }, [condominioId]);

  useEffect(() => {
    let vivo = true;
    buscarDados()
      .then(({ lista, catalogo }) => {
        if (!vivo) return;
        setOpinioes(lista);
        setCatalogo(catalogo);
      })
      .catch((e) => {
        if (vivo) setErro(e instanceof ErroApi ? e.message : "Não foi possível carregar as opiniões.");
      })
      .finally(() => { if (vivo) setCarregando(false); });
    // Sem isto, trocar de aba antes da resposta chegar dispara setState em
    // componente já desmontado.
    return () => { vivo = false; };
  }, [buscarDados]);

  const recarregar = () =>
    buscarDados()
      .then(({ lista, catalogo }) => {
        setOpinioes(lista);
        setCatalogo(catalogo);
      })
      .catch(() => setErro("Não foi possível atualizar a lista."));

  async function moderar(o: OpiniaoMorador) {
    try {
      await api.patch(`/condominios/${condominioId}/opinioes/${o.id}/comentarios`, {
        ocultos: !o.comentariosOcultos,
      });
      recarregar();
    } catch (e) {
      alert(e instanceof ErroApi ? e.message : "Não foi possível alterar a visibilidade.");
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-16 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /> Carregando…
      </div>
    );
  }

  if (erro) {
    return <p className="text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{erro}</p>;
  }

  const contam = opinioes.filter((o) => o.contaNoCalculo).length;
  const minimo = catalogo?.minimoDeOpinioes ?? 3;
  const peso = catalogo?.pesoPercentual ?? 10;
  const perguntas = catalogo?.telas.flatMap((t) => t.perguntas) ?? [];

  return (
    <div className="space-y-5">
      <Resumo total={opinioes.length} contam={contam} minimo={minimo} peso={peso} />

      {opinioes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
          <MessageSquareQuote className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-bold">Nenhuma opinião registrada</p>
          <p className="text-sm text-gray-600 mt-1 max-w-sm mx-auto">
            Moradores com vínculo aprovado respondem pela área deles. Aprove os comprovantes
            pendentes na aba de acessos para liberar o questionário.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {opinioes.map((o) => (
            <Cartao key={o.id} opiniao={o} perguntas={perguntas} onModerar={() => moderar(o)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Resumo({ total, contam, minimo, peso }: {
  total: number; contam: number; minimo: number; peso: number;
}) {
  const atingido = contam >= minimo;

  return (
    <div className={`rounded-2xl border p-5 ${
      atingido ? "bg-green-500/5 border-green-500/20" : "bg-[#12121e] border-white/5"
    }`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <Users2 className={`w-5 h-5 ${atingido ? "text-green-500" : "text-gray-600"}`} />
          <span className="text-2xl font-black text-white">{contam}</span>
          <span className="text-sm text-gray-500">de {total} opiniões pontuam</span>
        </div>
        <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg ${
          atingido ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
        }`}>
          {atingido ? `entram com ${peso}% no score` : `faltam ${minimo - contam} para valer`}
        </span>
      </div>
      <p className="text-xs text-gray-600 mt-3 leading-relaxed flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-px" />
        <span>
          Só pontua quem tem vínculo aprovado e ao menos 6 meses de moradia. Abaixo de {minimo} opiniões
          o bloco não entra e o score volta a ser 100% técnico — com uma ou duas respostas, um morador
          irritado derrubaria o laudo e um síndico entusiasmado o inflaria.
        </span>
      </p>
    </div>
  );
}

function Cartao({ opiniao, perguntas, onModerar }: {
  opiniao: OpiniaoMorador; perguntas: PerguntaMorador[]; onModerar: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const temComentario = Boolean(opiniao.comentarioParaInteressado || opiniao.comentarioOQueMudaria);
  const respondidas = perguntas.filter((p) => opiniao.respostas?.[p.chave] != null);

  return (
    <div className="bg-[#12121e] border border-white/5 rounded-2xl p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-white">
            {opiniao.identificada && opiniao.autorNome ? opiniao.autorNome : "Morador anônimo"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {opiniao.vinculo ? opiniao.vinculo.charAt(0) + opiniao.vinculo.slice(1).toLowerCase() : "vínculo não informado"}
            {opiniao.identificada && opiniao.mesesDeMoradia != null
              ? ` · ${opiniao.mesesDeMoradia} meses de moradia`
              : opiniao.faixaDeMoradia
              ? ` · ${ROTULO_FAIXA[opiniao.faixaDeMoradia]}`
              : ""}
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-black uppercase px-2 py-1 rounded-md ${
          opiniao.contaNoCalculo ? "bg-green-500/10 text-green-400" : "bg-white/5 text-gray-500"
        }`}>
          {opiniao.contaNoCalculo ? "pontua" : "não pontua"}
        </span>
      </div>

      {temComentario && (
        <div className="space-y-2">
          {opiniao.comentarioParaInteressado && (
            <Comentario titulo="Para quem pensa em morar aqui" texto={opiniao.comentarioParaInteressado} />
          )}
          {opiniao.comentarioOQueMudaria && (
            <Comentario titulo="O que mudaria" texto={opiniao.comentarioOQueMudaria} />
          )}
        </div>
      )}

      {opiniao.comentariosOcultos && (
        <p className="text-xs text-gray-600 italic">
          Comentários ocultados do laudo. O texto continua gravado e o autor segue vendo o dele.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/5">
        <button onClick={() => setAberto(!aberto)}
                className="text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors">
          {aberto ? "Ocultar" : "Ver"} as {respondidas.length} respostas
        </button>
        <button onClick={onModerar}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors">
          {opiniao.comentariosOcultos ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {opiniao.comentariosOcultos ? "Reexibir comentários" : "Ocultar comentários"}
        </button>
      </div>

      {aberto && (
        <div className="space-y-2 pt-2">
          {respondidas.map((p) => (
            <div key={p.chave} className="flex items-start justify-between gap-4 text-xs">
              <span className="text-gray-500 flex-1">{p.enunciado}</span>
              <span className="font-bold text-gray-200 shrink-0">
                {formatarResposta(p, opiniao.respostas[p.chave])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Comentario({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="bg-[#09090f] border border-white/5 rounded-xl px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-gray-600 mb-1">{titulo}</p>
      {/* Texto puro, nunca HTML: veio de campo livre de morador. */}
      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{texto}</p>
    </div>
  );
}

function formatarResposta(pergunta: PerguntaMorador, valor: unknown) {
  const texto = String(valor);
  if (texto === "NAO_SEI") return "não sei avaliar";
  if (texto === "NAO_SE_APLICA") return "não se aplica";
  if (pergunta.tipo === "FREQUENCIA") return ROTULO_FREQUENCIA[texto] ?? texto;
  return `${texto}/10`;
}
