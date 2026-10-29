"use client";

import { useEffect, useState } from "react";
import {
  User, Mail, Phone, ShieldCheck, Save, Loader2, Camera,
  CheckCircle2, XCircle, KeyRound, MapPin, BadgeCheck,
  Building2, Eye, EyeOff, Award, Home, Handshake, Users,
} from "lucide-react";

const UF_OPTS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function mascaraCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

interface Perfil {
  id?: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  creci: string;
  cidade: string;
  uf: string;
  plano: string;
  statusAssinatura: string;
  tipo: string;
}

type Aba = "perfil" | "seguranca";
type Toast = { texto: string; tipo: "sucesso" | "erro" } | null;

export default function ContaPage() {
  const [perfil, setPerfil] = useState<Perfil>({
    nome: "", email: "", telefone: "", cpf: "",
    creci: "", cidade: "", uf: "", plano: "",
    statusAssinatura: "", tipo: "",
  });
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [aba, setAba] = useState<Aba>("perfil");
  const [toast, setToast] = useState<Toast>(null);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhas, setMostrarSenhas] = useState(false);

  function showToast(texto: string, tipo: "sucesso" | "erro") {
    setToast({ texto, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    const base = process.env.NEXT_PUBLIC_API_URL;

    async function load() {
      try {
        const [resMe, resIm, resLe] = await Promise.all([
          fetch(`${base}/usuarios/me`, { headers: h }),
          fetch(`${base}/imoveis`, { headers: h }),
          fetch(`${base}/leads`, { headers: h }),
        ]);
        if (resMe.ok) {
          const data = await resMe.json();
          setPerfil({
            id: data.id,
            nome: data.nome || "",
            email: data.email || "",
            telefone: data.telefone || "",
            cpf: data.cpf || "",
            creci: data.creci || "",
            cidade: data.cidade || "",
            uf: data.uf || "",
            plano: data.plano || "",
            statusAssinatura: data.statusAssinatura || "",
            tipo: data.tipo || "",
          });
        }
        if (resIm.ok) setImoveis(await resIm.json());
        if (resLe.ok) setLeads(await resLe.json());
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: perfil.nome,
          telefone: perfil.telefone,
          creci: perfil.creci,
          cidade: perfil.cidade,
          uf: perfil.uf,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPerfil(prev => ({ ...prev, ...updated }));
        showToast("Perfil atualizado com sucesso!", "sucesso");
      } else {
        showToast("Erro ao salvar as informações.", "erro");
      }
    } catch {
      showToast("Falha na conexão com o servidor.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 6) {
      showToast("A nova senha deve ter ao menos 6 caracteres.", "erro");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      showToast("As senhas não coincidem.", "erro");
      return;
    }
    setSalvandoSenha(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me/senha`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      if (res.ok) {
        showToast("Senha atualizada com sucesso!", "sucesso");
        setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
      } else {
        showToast("Senha atual incorreta.", "erro");
      }
    } catch {
      showToast("Erro de conexão.", "erro");
    } finally {
      setSalvandoSenha(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-green-500 font-bold tracking-widest uppercase text-xs">Carregando perfil...</span>
        </div>
      </div>
    );
  }

  const ativos = imoveis.filter(im => !im.vendido).length;
  const vendidos = imoveis.filter(im => im.vendido).length;
  const totalFaturado = imoveis
    .filter(im => im.vendido)
    .reduce((s, im) => s + (im.valorFechamento || im.preco || 0), 0);

  const inicial = perfil.nome?.charAt(0).toUpperCase() || "?";
  const planoBadge =
    perfil.plano === "PRO_MENSAL" || perfil.plano === "PRO_ANUAL"
      ? { label: "PRO", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" }
      : { label: "GRATUITO", color: "bg-gray-800 text-gray-400 border-gray-700" };

  const inputCls =
    "w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-white font-medium text-sm placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors";
  const labelCls = "block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5";

  return (
    <div className="font-sans pb-20">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-white">Minha Conta</h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">Gerencie seu perfil profissional e credenciais de acesso</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Sidebar esquerda ── */}
        <aside className="lg:col-span-4 space-y-4">

          {/* Card de identidade */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl overflow-hidden">
            {/* Cover gradient */}
            <div className="h-20 bg-gradient-to-br from-green-600/30 via-emerald-900/20 to-transparent relative">
              <div className="absolute inset-0 bg-[#12121e]/40" />
            </div>

            {/* Avatar */}
            <div className="px-6 pb-6 -mt-10 relative">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center text-[#09090f] text-3xl font-black border-4 border-[#12121e] shadow-xl">
                  {inicial}
                </div>
                <button className="absolute -bottom-1 -right-1 p-1.5 bg-[#1e1e2e] rounded-lg border border-white/10 hover:border-green-500/40 transition-colors">
                  <Camera className="w-3 h-3 text-gray-400" />
                </button>
              </div>

              <h2 className="text-lg font-black text-white leading-tight">{perfil.nome || "—"}</h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{perfil.email}</p>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${planoBadge.color}`}>
                  <Award className="w-3 h-3" /> {planoBadge.label}
                </span>
                {perfil.tipo && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <BadgeCheck className="w-3 h-3" /> {perfil.tipo}
                  </span>
                )}
              </div>

              {perfil.creci && (
                <p className="mt-3 text-xs font-bold text-gray-500">
                  CRECI: <span className="text-gray-300">{perfil.creci}</span>
                </p>
              )}
              {perfil.cidade && (
                <p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {perfil.cidade}{perfil.uf ? `, ${perfil.uf}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-5">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Performance</p>
            <div className="space-y-3">
              {[
                { icon: Home, label: "Anúncios Ativos", value: ativos, color: "text-green-400" },
                { icon: Handshake, label: "Vendas Realizadas", value: vendidos, color: "text-amber-400" },
                { icon: Users, label: "Leads Recebidos", value: leads.length, color: "text-yellow-400" },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-xs font-medium text-gray-400">{stat.label}</span>
                    </div>
                    <span className={`text-sm font-black ${stat.color}`}>{stat.value}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-medium text-gray-500">Total Faturado</span>
                <span className="text-sm font-black text-white">
                  R$ {totalFaturado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Dados somente leitura */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Dados da Conta</p>
            {[
              { label: "E-mail", value: perfil.email, icon: Mail },
              { label: "CPF", value: perfil.cpf ? mascaraCPF(perfil.cpf) : "—", icon: User },
            ].map(row => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <Icon className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{row.label}</p>
                    <p className="text-xs font-medium text-gray-300 truncate">{row.value || "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </aside>

        {/* ── Conteúdo principal ── */}
        <section className="lg:col-span-8">

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#12121e] border border-white/10 rounded-xl p-1 mb-5 w-fit">
            {([
              { key: "perfil", label: "Perfil Profissional", icon: User },
              { key: "seguranca", label: "Segurança", icon: ShieldCheck },
            ] as { key: Aba; label: string; icon: any }[]).map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setAba(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                    aba === tab.key
                      ? "bg-green-500/15 text-green-400 border border-green-500/25"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Toast */}
          {toast && (
            <div className={`flex items-center gap-3 p-4 rounded-xl mb-5 border animate-in slide-in-from-top-2 duration-300 ${
              toast.tipo === "sucesso"
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {toast.tipo === "sucesso"
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <XCircle className="w-4 h-4 shrink-0" />}
              <span className="text-sm font-bold">{toast.texto}</span>
            </div>
          )}

          {/* ─ ABA PERFIL ─ */}
          {aba === "perfil" && (
            <form onSubmit={handleSalvar} className="bg-[#12121e] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 animate-in fade-in duration-300">

              <div>
                <h3 className="text-sm font-black text-white mb-1">Informações Profissionais</h3>
                <p className="text-xs text-gray-500 font-medium">Esses dados aparecem nos seus anúncios e são visíveis para compradores.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Nome */}
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nome Completo *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={perfil.nome}
                      onChange={e => setPerfil(p => ({ ...p, nome: e.target.value }))}
                      className={`${inputCls} pl-10`}
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label className={labelCls}>WhatsApp / Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      value={perfil.telefone}
                      onChange={e => setPerfil(p => ({ ...p, telefone: mascaraTelefone(e.target.value) }))}
                      className={`${inputCls} pl-10`}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                {/* CRECI */}
                <div>
                  <label className={labelCls}>CRECI</label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      value={perfil.creci}
                      onChange={e => setPerfil(p => ({ ...p, creci: e.target.value }))}
                      className={`${inputCls} pl-10`}
                      placeholder="Ex: SP-123456"
                    />
                  </div>
                </div>

                {/* Cidade */}
                <div>
                  <label className={labelCls}>Cidade de Atuação</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      value={perfil.cidade}
                      onChange={e => setPerfil(p => ({ ...p, cidade: e.target.value }))}
                      className={`${inputCls} pl-10`}
                      placeholder="Sua cidade principal"
                    />
                  </div>
                </div>

                {/* UF */}
                <div>
                  <label className={labelCls}>Estado (UF)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <select
                      value={perfil.uf}
                      onChange={e => setPerfil(p => ({ ...p, uf: e.target.value }))}
                      className={`${inputCls} pl-10 appearance-none cursor-pointer`}
                    >
                      <option value="">Selecione o estado</option>
                      {UF_OPTS.map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* E-mail (somente leitura) */}
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Somente Leitura</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                      <input
                        type="email"
                        value={perfil.email}
                        readOnly
                        className={`${inputCls} pl-10 opacity-40 cursor-not-allowed`}
                      />
                    </div>
                  </div>
                  {perfil.cpf && (
                    <div>
                      <label className={labelCls}>CPF</label>
                      <input
                        type="text"
                        value={mascaraCPF(perfil.cpf)}
                        readOnly
                        className={`${inputCls} opacity-40 cursor-not-allowed`}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black text-sm px-7 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-green-900/20"
                >
                  {salvando
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}

          {/* ─ ABA SEGURANÇA ─ */}
          {aba === "seguranca" && (
            <form onSubmit={handleSalvarSenha} className="bg-[#12121e] border border-white/10 rounded-2xl p-6 md:p-8 space-y-5 animate-in fade-in duration-300">

              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <KeyRound className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Alterar Senha</h3>
                  <p className="text-xs text-gray-500 font-medium">Recomendamos trocar sua senha a cada 90 dias.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Senha Atual</label>
                  <div className="relative">
                    <input
                      type={mostrarSenhas ? "text" : "password"}
                      value={senhaAtual}
                      onChange={e => setSenhaAtual(e.target.value)}
                      className={`${inputCls} pr-10`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenhas(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {mostrarSenhas ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nova Senha</label>
                    <input
                      type={mostrarSenhas ? "text" : "password"}
                      value={novaSenha}
                      onChange={e => setNovaSenha(e.target.value)}
                      className={inputCls}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Confirmar Senha</label>
                    <input
                      type={mostrarSenhas ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={e => setConfirmarSenha(e.target.value)}
                      className={`${inputCls} ${novaSenha && confirmarSenha && novaSenha !== confirmarSenha ? "border-red-500/50" : ""}`}
                      placeholder="Repita a senha"
                      required
                    />
                  </div>
                </div>

                {/* Indicador de força */}
                {novaSenha.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(n => {
                        const force = Math.min(
                          Math.floor(novaSenha.length / 3) +
                          (novaSenha.length >= 8 ? 1 : 0) +
                          (/[A-Z]/.test(novaSenha) ? 1 : 0) +
                          (/[0-9]/.test(novaSenha) ? 1 : 0) +
                          (/[^A-Za-z0-9]/.test(novaSenha) ? 1 : 0),
                          4
                        );
                        return (
                          <div
                            key={n}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              n <= force
                                ? force <= 1 ? "bg-red-500" : force <= 2 ? "bg-yellow-500" : force <= 3 ? "bg-blue-500" : "bg-green-500"
                                : "bg-white/10"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {(() => {
                        const f = Math.min(
                          Math.floor(novaSenha.length / 3) +
                          (novaSenha.length >= 8 ? 1 : 0) +
                          (/[A-Z]/.test(novaSenha) ? 1 : 0) +
                          (/[0-9]/.test(novaSenha) ? 1 : 0) +
                          (/[^A-Za-z0-9]/.test(novaSenha) ? 1 : 0),
                          4
                        );
                        return f <= 1 ? "Senha fraca" : f <= 2 ? "Senha regular" : f <= 3 ? "Senha boa" : "Senha forte";
                      })()}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-4">
                <p className="text-xs text-gray-600 font-medium">
                  Use letras, números e símbolos para uma senha mais segura.
                </p>
                <button
                  type="submit"
                  disabled={salvandoSenha}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black text-sm px-7 py-3 rounded-xl transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-green-900/20"
                >
                  {salvandoSenha
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ShieldCheck className="w-4 h-4" />}
                  Atualizar Senha
                </button>
              </div>
            </form>
          )}

        </section>
      </div>
    </div>
  );
}
