"use client";

import { useEffect, useState } from "react";
import { DollarSign, Save, Loader2, CheckCircle2, XCircle } from "lucide-react";

type Plano = {
  id: number;
  tipo: string;
  valor: number;
  descricao: string;
};

export default function AdminPlanos() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: string; ok: boolean } | null>(null);
  const [editando, setEditando] = useState<Record<string, { valor: string; descricao: string }>>({});

  const base = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    };
    fetch(`${base}/admin/planos`, { headers })
      .then(r => r.json())
      .then((d: Plano[]) => {
        setPlanos(d);
        const inicial: Record<string, { valor: string; descricao: string }> = {};
        d.forEach(p => {
          inicial[p.tipo] = { valor: p.valor.toString().replace(".", ","), descricao: p.descricao || "" };
        });
        setEditando(inicial);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const salvar = async (tipo: string) => {
    setSalvando(tipo);
    const dados = editando[tipo];
    const valorNum = parseFloat(dados.valor.replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) {
      setFeedback({ tipo, ok: false });
      setSalvando(null);
      setTimeout(() => setFeedback(null), 2500);
      return;
    }
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    };
    try {
      const res = await fetch(`${base}/admin/planos/${tipo}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ valor: valorNum, descricao: dados.descricao }),
      });
      setFeedback({ tipo, ok: res.ok });
      if (res.ok) {
        setPlanos(prev => prev.map(p => p.tipo === tipo ? { ...p, valor: valorNum, descricao: dados.descricao } : p));
      }
    } catch {
      setFeedback({ tipo, ok: false });
    } finally {
      setSalvando(null);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const tipoLabel = (tipo: string) => tipo === "MENSAL" ? "Plano Mensal" : "Plano Anual";
  const tipoDesc  = (tipo: string) => tipo === "MENSAL" ? "Cobrado mensalmente no cartão ou PIX" : "Cobrado anualmente — melhor custo-benefício";

  return (
    <div className="font-sans space-y-6">

      {/* Header */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Configurações</p>
        <h1 className="text-2xl md:text-3xl font-black text-white">Preços dos Planos</h1>
        <p className="text-sm text-gray-400 mt-1">Altere os valores dos planos PRO. As mudanças valem para novos pagamentos.</p>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {planos.map(plano => (
            <div key={plano.tipo} className="bg-[#12121e] border border-white/5 rounded-2xl p-6 space-y-5">

              {/* Topo do card */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                    </div>
                    <h2 className="text-base font-black text-white">{tipoLabel(plano.tipo)}</h2>
                  </div>
                  <p className="text-xs text-gray-500 ml-10">{tipoDesc(plano.tipo)}</p>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest bg-white/5 text-gray-400 border border-white/10">
                  {plano.tipo}
                </span>
              </div>

              {/* Valor atual */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Valor atual</span>
                <span className="text-xl font-black text-white">
                  R$ {plano.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  <span className="text-xs text-gray-500 font-medium ml-1">/{plano.tipo === "MENSAL" ? "mês" : "ano"}</span>
                </span>
              </div>

              {/* Campos de edição */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Novo Valor (R$)</label>
                  <input
                    type="text"
                    value={editando[plano.tipo]?.valor || ""}
                    onChange={e => setEditando(prev => ({ ...prev, [plano.tipo]: { ...prev[plano.tipo], valor: e.target.value } }))}
                    className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                    placeholder="Ex: 99,00"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Descrição</label>
                  <input
                    type="text"
                    value={editando[plano.tipo]?.descricao || ""}
                    onChange={e => setEditando(prev => ({ ...prev, [plano.tipo]: { ...prev[plano.tipo], descricao: e.target.value } }))}
                    className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                    placeholder="Ex: Plano PRO Mensal"
                  />
                </div>
              </div>

              {/* Botão salvar */}
              <button
                onClick={() => salvar(plano.tipo)}
                disabled={salvando === plano.tipo}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all active:scale-95"
              >
                {salvando === plano.tipo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : feedback?.tipo === plano.tipo ? (
                  feedback.ok
                    ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</>
                    : <><XCircle className="w-4 h-4" /> Erro ao salvar</>
                ) : (
                  <><Save className="w-4 h-4" /> Salvar alterações</>
                )}
              </button>

            </div>
          ))}
        </div>
      )}

      <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-4 text-sm text-yellow-400/80">
        ⚠️ As alterações de preço valem apenas para <strong>novos pagamentos</strong>. Assinaturas já ativas no Mercado Pago não são afetadas.
      </div>

    </div>
  );
}
