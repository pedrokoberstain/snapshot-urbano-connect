"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Pencil, Check, X, ChevronLeft, ChevronRight, Landmark, Upload } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;
const TAMANHO = 20;

const moeda = (v: any) =>
  v == null || v === ""
    ? "—"
    : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const numero = (v: any) =>
  v == null || v === "" ? "—" : Number(v).toLocaleString("pt-BR");

export default function CadastroIptuAdmin() {
  const router = useRouter();
  const token = () => localStorage.getItem("token") ?? "";

  const [registros, setRegistros]   = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPaginas, setTotalPag] = useState(0);
  const [pagina, setPagina]         = useState(0);
  const [carregando, setCarregando] = useState(true);

  const [q, setQ]               = useState("");
  const [qDebounced, setQDeb]   = useState("");
  const [bairro, setBairro]     = useState("");
  const [bairros, setBairros]   = useState<string[]>([]);

  // edição inline
  const [editId, setEditId]         = useState<number | null>(null);
  const [editVenal, setEditVenal]   = useState("");
  const [editImposto, setEditImp]   = useState("");
  const [salvando, setSalvando]     = useState(false);

  // importação de planilha
  const inputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado]   = useState<{ ok: boolean; msg: string } | null>(null);
  const [refresh, setRefresh]       = useState(0);

  // debounce da busca textual
  useEffect(() => {
    const t = setTimeout(() => { setQDeb(q); setPagina(0); }, 400);
    return () => clearTimeout(t);
  }, [q]);

  // carrega lista de bairros uma vez
  useEffect(() => {
    if (!token()) { router.push("/login"); return; }
    fetch(`${API}/cadastro-iptu/bairros`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBairros(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // carrega a página
  useEffect(() => {
    if (!token()) { router.push("/login"); return; }
    setCarregando(true);
    const params = new URLSearchParams({
      q: qDebounced, bairro, pagina: String(pagina), tamanho: String(TAMANHO),
    });
    fetch(`${API}/cadastro-iptu?${params}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => {
        if (r.status === 401 || r.status === 403) { localStorage.removeItem("token"); router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setRegistros(d.conteudo ?? []);
        setTotal(d.total ?? 0);
        setTotalPag(d.totalPaginas ?? 0);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [qDebounced, bairro, pagina, refresh]);

  const recarregarBairros = () => {
    fetch(`${API}/cadastro-iptu/bairros`, { headers: { Authorization: `Bearer ${token()}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBairros(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  const importarPlanilha = async (file: File) => {
    setImportando(true);
    setResultado(null);
    const fd = new FormData();
    fd.append("arquivo", file);
    try {
      const res = await fetch(`${API}/cadastro-iptu/importar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setResultado({ ok: true, msg: d.mensagem ?? "Importação concluída." });
        setRefresh((n) => n + 1);
        recarregarBairros();
      } else {
        setResultado({ ok: false, msg: d.mensagem ?? "Falha na importação." });
      }
    } catch {
      setResultado({ ok: false, msg: "Erro ao enviar o arquivo." });
    } finally {
      setImportando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const abrirEdicao = (r: any) => {
    setEditId(r.id);
    setEditVenal(r.valorVenal != null ? String(r.valorVenal) : "");
    setEditImp(r.imposto != null ? String(r.imposto) : "");
  };

  const cancelarEdicao = () => { setEditId(null); setEditVenal(""); setEditImp(""); };

  const salvar = async (id: number) => {
    setSalvando(true);
    const body: any = {};
    if (editVenal.trim() !== "")  body.valorVenal = Number(editVenal.replace(",", "."));
    if (editImposto.trim() !== "") body.imposto   = Number(editImposto.replace(",", "."));
    const res = await fetch(`${API}/cadastro-iptu/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const salvo = await res.json();
      setRegistros((prev) => prev.map((r) => (r.id === salvo.id ? salvo : r)));
      cancelarEdicao();
    }
    setSalvando(false);
  };

  return (
    <div className="font-sans">
      <header className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Base IPTU — Tangará da Serra</h1>
            <p className="text-gray-400 mt-0.5 text-sm">
              {total.toLocaleString("pt-BR")} imóveis cadastrados · valores de 2014, editáveis
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xls,.xlsx,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importarPlanilha(f); }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={importando}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm outline-none"
        >
          {importando ? <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</> : <><Upload className="w-4 h-4" /> Importar planilha</>}
        </button>
      </header>

      {resultado && (
        <div className={`mb-5 flex items-start justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          resultado.ok
            ? "bg-green-500/10 border-green-500/20 text-green-300"
            : "bg-red-500/10 border-red-500/20 text-red-300"
        }`}>
          <span>{resultado.msg}</span>
          <button onClick={() => setResultado(null)} className="opacity-70 hover:opacity-100 transition-opacity outline-none shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por inscrição ou bairro..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#12121e] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all text-sm"
          />
        </div>
        <select
          value={bairro}
          onChange={(e) => { setBairro(e.target.value); setPagina(0); }}
          className="px-4 py-3 rounded-xl bg-[#12121e] border border-white/10 text-white focus:border-green-500 outline-none transition-all text-sm cursor-pointer sm:w-64"
        >
          <option value="">Todos os bairros</option>
          {bairros.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-[#12121e] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-white/5">
                <th className="px-4 py-3 font-bold">Inscrição</th>
                <th className="px-4 py-3 font-bold">Bairro</th>
                <th className="px-4 py-3 font-bold text-right">Área (m²)</th>
                <th className="px-4 py-3 font-bold text-right">Valor Venal</th>
                <th className="px-4 py-3 font-bold text-right">IPTU</th>
                <th className="px-4 py-3 font-bold">Fonte</th>
                <th className="px-4 py-3 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="w-7 h-7 text-green-500 animate-spin inline" /></td></tr>
              ) : registros.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-gray-500 font-medium">Nenhum imóvel encontrado.</td></tr>
              ) : (
                registros.map((r) => {
                  const editando = editId === r.id;
                  return (
                    <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-300 text-xs">{r.inscricao}</td>
                      <td className="px-4 py-3 text-gray-300">{r.bairro ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{numero(r.areaTerreno)}</td>
                      <td className="px-4 py-3 text-right">
                        {editando ? (
                          <input
                            value={editVenal}
                            onChange={(e) => setEditVenal(e.target.value)}
                            className="w-28 px-2 py-1 rounded-lg bg-[#09090f] border border-green-500/40 text-white text-right outline-none text-xs"
                            inputMode="decimal"
                          />
                        ) : (
                          <span className="text-white font-bold">{moeda(r.valorVenal)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editando ? (
                          <input
                            value={editImposto}
                            onChange={(e) => setEditImp(e.target.value)}
                            className="w-24 px-2 py-1 rounded-lg bg-[#09090f] border border-green-500/40 text-white text-right outline-none text-xs"
                            inputMode="decimal"
                          />
                        ) : (
                          <span className="text-gray-300">{moeda(r.imposto)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          r.fonte === "MANUAL"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}>
                          {r.fonte === "MANUAL" ? "Editado" : "Planilha"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {editando ? (
                            <>
                              <button onClick={() => salvar(r.id)} disabled={salvando}
                                className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors outline-none disabled:opacity-50">
                                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button onClick={cancelarEdicao} disabled={salvando}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-white/5 transition-colors outline-none">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => abrirEdicao(r)} title="Editar venal/IPTU"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors outline-none">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-gray-500">Página {pagina + 1} de {totalPaginas}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={pagina === 0}
              className="p-2 rounded-lg bg-[#12121e] border border-white/10 text-gray-300 hover:border-white/20 disabled:opacity-40 transition-colors outline-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
              disabled={pagina >= totalPaginas - 1}
              className="p-2 rounded-lg bg-[#12121e] border border-white/10 text-gray-300 hover:border-white/20 disabled:opacity-40 transition-colors outline-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
