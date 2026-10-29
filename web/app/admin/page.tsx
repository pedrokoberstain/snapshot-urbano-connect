"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Home, DollarSign, Plus, Loader2,
  ArrowRight, Building, Tractor, MessageSquare,
  BarChart3, TrendingUp, Handshake, Users,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtShort = (v: number) => {
  if (v >= 1_000_000)
    return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  if (v >= 1_000)
    return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k`;
  return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
};

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 shadow-xl text-left">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-green-400">
        {payload[0].value} venda{payload[0].value !== 1 ? "s" : ""}
      </p>
      {payload[0].payload.valor > 0 && (
        <p className="text-xs text-gray-500 mt-0.5">{fmtShort(payload[0].payload.valor)}</p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [tipoUsuario, setTipoUsuario] = useState("");
  const [estatAdmin, setEstatAdmin] = useState<any>(null);

  useEffect(() => {
    const tipo = localStorage.getItem("tipoUsuario") || "";
    setTipoUsuario(tipo);

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const base = process.env.NEXT_PUBLIC_API_URL;

    async function load() {
      try {
        const fetches: Promise<Response>[] = [
          fetch(`${base}/imoveis`, { headers }),
          fetch(`${base}/leads`, { headers }),
        ];
        if (tipo === "ADMIN") fetches.push(fetch(`${base}/estatisticas/admin`, { headers }));

        const [resIm, resLe, resAdm] = await Promise.all(fetches);

        // Sessão expirada/sem permissão: manda relogar em vez de exibir tudo zerado
        if (resLe.status === 401 || resLe.status === 403) {
          localStorage.removeItem("token");
          window.location.href = "/login?expirado=1";
          return;
        }

        const imData = resIm.ok ? await resIm.json() : [];
        const leData = resLe.ok ? await resLe.json() : [];
        setImoveis(Array.isArray(imData) ? imData : []);
        setLeads(Array.isArray(leData) ? leData : []);
        if (resAdm?.ok) {
          setEstatAdmin(await resAdm.json());
        } else if (tipo === "ADMIN") {
          setEstatAdmin({}); // endpoint falhou mas para o spinner
        }
      } catch {
        if (tipo === "ADMIN") setEstatAdmin({}); // erro de rede — para o spinner
      } finally {
        setCarregando(false);
      }
    }
    load();
  }, []);

  const m = useMemo(() => {
    const ativos = imoveis.filter((im) => !im.vendido);
    const vendidos = imoveis.filter((im) => im.vendido);
    const totalCarteira = ativos.reduce((s, im) => s + (im.preco || 0), 0);
    const totalFaturado = vendidos.reduce(
      (s, im) => s + (im.valorFechamento || im.preco || 0),
      0
    );

    const rural = imoveis.filter(
      (im) => im.tipo === "RURAL" || im.tipo === "FAZENDA"
    ).length;
    const urbano = imoveis.length - rural;

    const vendasMes = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      return {
        mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        vendas: 0,
        valor: 0,
      };
    });

    vendidos
      .filter((im) => im.dataVenda)
      .forEach((im) => {
        const d = new Date(im.dataVenda);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const slot = vendasMes.find((x) => x.key === key);
        if (slot) {
          slot.vendas += 1;
          slot.valor += im.valorFechamento || im.preco || 0;
        }
      });

    const taxaFechamento =
      imoveis.length > 0
        ? Math.round((vendidos.length / imoveis.length) * 100)
        : 0;

    return {
      ativos,
      vendidos,
      totalCarteira,
      totalFaturado,
      rural,
      urbano,
      vendasMes,
      taxaFechamento,
    };
  }, [imoveis]);

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const total = imoveis.length;
  const pctRural = total > 0 ? (m.rural / total) * 100 : 0;

  return (
    <div className="font-sans space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 capitalize">
            {hoje}
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            {saudacao()} 👋
          </h1>
          {tipoUsuario && (
            <p className="text-sm text-gray-400 mt-1">
              Painel{" "}
              <span className="text-green-400 font-bold">{tipoUsuario}</span>
              {" "}— visão geral do seu portfólio
            </p>
          )}
        </div>
        <Link
          href="/admin/imoveis/novo"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm active:scale-95 shrink-0 shadow-lg shadow-green-900/30"
        >
          <Plus className="w-4 h-4" /> Novo Imóvel
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Anúncios Ativos",
            display: String(m.ativos.length),
            icon: Home,
            accent: {
              ring: "border-green-500/20",
              glow: "hover:border-green-500/40",
              bg: "bg-green-500/10",
              text: "text-green-400",
            },
            sub: "imóveis na vitrine",
            large: true,
          },
          {
            label: "Leads Recebidos",
            display: String(leads.length),
            icon: MessageSquare,
            accent: {
              ring: "border-yellow-500/20",
              glow: "hover:border-yellow-500/40",
              bg: "bg-yellow-500/10",
              text: "text-yellow-400",
            },
            sub: "contatos de clientes",
            large: true,
          },
          {
            label: "Em Carteira",
            display: `R$ ${fmtBRL(m.totalCarteira)}`,
            icon: BarChart3,
            accent: {
              ring: "border-blue-500/20",
              glow: "hover:border-blue-500/40",
              bg: "bg-blue-500/10",
              text: "text-blue-400",
            },
            sub: "valor dos imóveis ativos",
            large: false,
          },
          {
            label: "Total Faturado",
            display: `R$ ${fmtBRL(m.totalFaturado)}`,
            icon: DollarSign,
            accent: {
              ring: "border-emerald-500/20",
              glow: "hover:border-emerald-500/40",
              bg: "bg-emerald-500/10",
              text: "text-emerald-400",
            },
            sub: `${m.vendidos.length} venda${m.vendidos.length !== 1 ? "s" : ""} concluída${m.vendidos.length !== 1 ? "s" : ""}`,
            large: false,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-[#12121e] border ${card.accent.ring} ${card.accent.glow} rounded-2xl p-5 transition-colors`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight">
                  {card.label}
                </p>
                <div
                  className={`${card.accent.bg} p-2 rounded-lg border ${card.accent.ring} shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${card.accent.text}`} />
                </div>
              </div>
              {carregando ? (
                <Loader2 className={`w-5 h-5 animate-spin ${card.accent.text}`} />
              ) : (
                <p
                  className={`font-black text-white leading-tight ${
                    card.large ? "text-3xl" : "text-lg"
                  }`}
                >
                  {card.display}
                </p>
              )}
              <p className="text-[10px] text-gray-600 font-medium mt-1.5">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* KPI Admin — visível apenas para ADMIN */}
      {tipoUsuario === "ADMIN" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total de Cadastros",
              value: estatAdmin?.totalCadastros,
              icon: Users,
              accent: { ring: "border-violet-500/20", glow: "hover:border-violet-500/40", bg: "bg-violet-500/10", text: "text-violet-400" },
              sub: "usuários no sistema",
            },
            {
              label: "Usuários",
              value: estatAdmin?.totalUsuarios,
              icon: Users,
              accent: { ring: "border-sky-500/20", glow: "hover:border-sky-500/40", bg: "bg-sky-500/10", text: "text-sky-400" },
              sub: "perfil cliente",
            },
            {
              label: "Corretores",
              value: estatAdmin?.totalCorretores,
              icon: Handshake,
              accent: { ring: "border-orange-500/20", glow: "hover:border-orange-500/40", bg: "bg-orange-500/10", text: "text-orange-400" },
              sub: "perfil corretor",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`bg-[#12121e] border ${card.accent.ring} ${card.accent.glow} rounded-2xl p-5 transition-colors`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight">{card.label}</p>
                  <div className={`${card.accent.bg} p-2 rounded-lg border ${card.accent.ring} shrink-0`}>
                    <Icon className={`w-4 h-4 ${card.accent.text}`} />
                  </div>
                </div>
                {carregando || estatAdmin === null ? (
                  <Loader2 className={`w-5 h-5 animate-spin ${card.accent.text}`} />
                ) : (
                  <p className="font-black text-white text-3xl leading-tight">{card.value ?? "—"}</p>
                )}
                <p className="text-[10px] text-gray-600 font-medium mt-1.5">{card.sub}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Gráfico + painel lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar chart — vendas por mês */}
        <div className="lg:col-span-2 bg-[#12121e] border border-white/10 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Vendas nos últimos 6 meses
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                Imóveis marcados como vendidos
              </p>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-black text-green-400">
                {m.vendidos.length} total
              </span>
            </div>
          </div>

          <div className="h-56">
            {carregando ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-green-500" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={m.vendasMes}
                  barSize={32}
                  margin={{ top: 4, right: 4, bottom: 0, left: -22 }}
                >
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#15803d" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mes"
                    tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<BarTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.03)", radius: 8 } as any}
                  />
                  <Bar dataKey="vendas" radius={[6, 6, 0, 0]}>
                    {m.vendasMes.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.vendas > 0
                            ? "url(#barGrad)"
                            : "rgba(255,255,255,0.04)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-5">

          {/* Mix do portfólio */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-5">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
              Mix do Portfólio
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: "Rural",
                  count: m.rural,
                  pct: pctRural,
                  icon: Tractor,
                  from: "from-green-500",
                  to: "to-green-400",
                  text: "text-green-400",
                },
                {
                  label: "Urbano",
                  count: m.urbano,
                  pct: 100 - pctRural,
                  icon: Building,
                  from: "from-blue-500",
                  to: "to-blue-400",
                  text: "text-blue-400",
                },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${row.text} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-gray-300">
                          {row.label}
                        </span>
                        <span className="text-xs font-black text-gray-400">
                          {row.count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${row.from} ${row.to} rounded-full transition-all duration-700`}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {total > 0 && (
                <div className="pt-1">
                  <div className="h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 transition-all duration-700"
                      style={{ width: `${pctRural}%` }}
                    />
                    <div className="bg-blue-500 flex-1" />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] font-black text-green-500">
                      {Math.round(pctRural)}% rural
                    </span>
                    <span className="text-[9px] font-black text-blue-400">
                      {Math.round(100 - pctRural)}% urbano
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Funil de conversão */}
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-5 flex-1">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
              Funil de Conversão
            </h2>
            <div className="space-y-2">
              {[
                {
                  label: "Anúncios",
                  value: total,
                  color: "bg-blue-500/70",
                  pct: 100,
                },
                {
                  label: "Leads",
                  value: leads.length,
                  color: "bg-yellow-500/70",
                  pct:
                    total > 0
                      ? Math.min((leads.length / Math.max(total, 1)) * 100, 100)
                      : 0,
                },
                {
                  label: "Vendidos",
                  value: m.vendidos.length,
                  color: "bg-green-500/70",
                  pct:
                    total > 0
                      ? (m.vendidos.length / Math.max(total, 1)) * 100
                      : 0,
                },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-500 w-14 shrink-0 text-right">
                    {step.label}
                  </span>
                  <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden relative">
                    <div
                      className={`h-full ${step.color} rounded transition-all duration-700`}
                      style={{ width: `${step.pct}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-2 text-[10px] font-black text-white">
                      {step.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Taxa de fechamento
              </span>
              <span className="text-base font-black text-white">
                {m.taxaFechamento}%
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            href: "/admin/imoveis/novo",
            label: "Cadastrar Imóvel",
            desc: "Publicar novo anúncio",
            icon: Plus,
            border:
              "border-green-500/20 hover:border-green-500/40 hover:bg-green-500/[0.04]",
            iconStyle: "text-green-400 bg-green-500/10 border border-green-500/20",
          },
          {
            href: "/admin/imoveis",
            label: "Gerenciar Imóveis",
            desc: `${m.ativos.length} anúncio${m.ativos.length !== 1 ? "s" : ""} ativo${m.ativos.length !== 1 ? "s" : ""}`,
            icon: Home,
            border:
              "border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/[0.04]",
            iconStyle: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
          },
          {
            href: "/admin/leads",
            label: "Ver Leads",
            desc: `${leads.length} contato${leads.length !== 1 ? "s" : ""} recebido${leads.length !== 1 ? "s" : ""}`,
            icon: MessageSquare,
            border:
              "border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/[0.04]",
            iconStyle:
              "text-yellow-400 bg-yellow-500/10 border border-yellow-500/20",
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-4 bg-[#12121e] border ${action.border} rounded-2xl p-5 transition-all group`}
            >
              <div className={`p-3 rounded-xl ${action.iconStyle} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">{action.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>

    </div>
  );
}
