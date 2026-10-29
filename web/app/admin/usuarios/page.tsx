"use client";

import { useEffect, useState } from "react";
import { Users, Crown, UserX, Loader2, Search, CheckCircle2, XCircle } from "lucide-react";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  plano: string;
  statusAssinatura: string | null;
  cidade: string | null;
  uf: string | null;
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [atualizando, setAtualizando] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ id: number; tipo: "ok" | "erro" } | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    };
    fetch(`${base}/usuarios/admin/todos`, { headers })
      .then(r => r.json())
      .then(d => setUsuarios(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const alterarPlano = async (id: number, planoAtual: string) => {
    const novoPlano = planoAtual === "PRO" ? "GRATUITO" : "PRO";
    setAtualizando(id);
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    };
    try {
      const res = await fetch(`${base}/usuarios/admin/${id}/plano`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ plano: novoPlano }),
      });
      if (res.ok) {
        setUsuarios(prev => prev.map(u => u.id === id ? { ...u, plano: novoPlano } : u));
        setFeedback({ id, tipo: "ok" });
      } else {
        setFeedback({ id, tipo: "erro" });
      }
    } catch {
      setFeedback({ id, tipo: "erro" });
    } finally {
      setAtualizando(null);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  const filtrados = usuarios.filter(u =>
    u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    u.email?.toLowerCase().includes(busca.toLowerCase()) ||
    u.cidade?.toLowerCase().includes(busca.toLowerCase())
  );

  const totalPro = usuarios.filter(u => u.plano === "PRO").length;
  const totalCorretores = usuarios.filter(u => u.tipo === "CORRETOR").length;

  return (
    <div className="font-sans space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Gestão de usuários</p>
          <h1 className="text-2xl md:text-3xl font-black text-white">Usuários</h1>
          <p className="text-sm text-gray-400 mt-1">Gerencie planos e permissões dos usuários cadastrados</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", val: usuarios.length, color: "text-white", border: "border-white/10" },
          { label: "Corretores", val: totalCorretores, color: "text-blue-400", border: "border-blue-500/20" },
          { label: "Plano PRO", val: totalPro, color: "text-yellow-400", border: "border-yellow-500/20" },
          { label: "Gratuito", val: usuarios.length - totalPro, color: "text-gray-400", border: "border-white/5" },
        ].map(k => (
          <div key={k.label} className={`bg-[#12121e] border ${k.border} rounded-2xl p-4`}>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{carregando ? "—" : k.val}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou cidade..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full bg-[#12121e] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm font-medium placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
        />
      </div>

      {/* Tabela */}
      <div className="bg-[#12121e] border border-white/5 rounded-2xl overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 font-bold">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] font-black text-gray-500 uppercase tracking-widest px-5 py-3">Usuário</th>
                <th className="text-left text-[10px] font-black text-gray-500 uppercase tracking-widest px-5 py-3 hidden md:table-cell">Perfil</th>
                <th className="text-left text-[10px] font-black text-gray-500 uppercase tracking-widest px-5 py-3 hidden sm:table-cell">Localização</th>
                <th className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest px-5 py-3">Plano</th>
                <th className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest px-5 py-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => (
                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-black text-xs shrink-0">
                        {u.nome?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{u.nome || "—"}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                      u.tipo === "ADMIN" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                      u.tipo === "CORRETOR" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                      "bg-white/5 text-gray-400 border border-white/10"
                    }`}>
                      {u.tipo}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-xs text-gray-400">
                      {u.cidade && u.uf ? `${u.cidade}/${u.uf}` : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {feedback?.id === u.id ? (
                      feedback.tipo === "ok"
                        ? <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
                        : <XCircle className="w-5 h-5 text-red-400 mx-auto" />
                    ) : (
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                        u.plano === "PRO"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-white/5 text-gray-500 border border-white/10"
                      }`}>
                        {u.plano === "PRO" ? "PRO" : "Gratuito"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {u.tipo === "ADMIN" ? (
                      <span className="text-[10px] text-gray-600 font-bold">—</span>
                    ) : (
                      <button
                        onClick={() => alterarPlano(u.id, u.plano)}
                        disabled={atualizando === u.id}
                        className={`flex items-center gap-1.5 mx-auto text-[11px] font-black px-3 py-1.5 rounded-lg transition-all ${
                          u.plano === "PRO"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                            : "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                        }`}
                      >
                        {atualizando === u.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : u.plano === "PRO"
                            ? <><UserX className="w-3.5 h-3.5" /> Revogar</>
                            : <><Crown className="w-3.5 h-3.5" /> Dar PRO</>
                        }
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
