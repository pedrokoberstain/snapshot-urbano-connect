"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, TrendingDown, Calendar, MapPin } from "lucide-react";

interface Imovel {
  id: number;
  titulo: string;
  cidade: string;
  bairro: string;
  tipo: string;
  preco: number;
  valorFechamento: number;
  descontoPercentual: number;
  dataVenda: string;
  imagemPrincipal: string;
}

export default function ImoveisVendidosPage() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/imoveis/admin/vendidos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setImoveis(data))
      .finally(() => setCarregando(false));
  }, []);

  const formatarMoeda = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const totalVendido = imoveis.reduce((s, i) => s + (i.valorFechamento ?? 0), 0);
  const descontoMedio =
    imoveis.length > 0
      ? imoveis.reduce((s, i) => s + (i.descontoPercentual ?? 0), 0) / imoveis.length
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Imóveis Vendidos</h1>
        <p className="text-gray-400 mt-1">Histórico completo de vendas fechadas na plataforma.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#12121e] border border-white/5 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total de Vendas</p>
          <p className="text-3xl font-black text-white mt-1">{imoveis.length}</p>
        </div>
        <div className="bg-[#12121e] border border-white/5 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Volume Negociado</p>
          <p className="text-2xl font-black text-green-400 mt-1">{formatarMoeda(totalVendido)}</p>
        </div>
        <div className="bg-[#12121e] border border-white/5 rounded-2xl p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Desconto Médio</p>
          <p className="text-3xl font-black text-yellow-400 mt-1">
            {descontoMedio > 0 ? `${descontoMedio.toFixed(1)}%` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">abaixo do preço anunciado</p>
        </div>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="text-center py-20 text-gray-500">Carregando...</div>
      ) : imoveis.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Nenhum imóvel vendido ainda.</div>
      ) : (
        <div className="space-y-3">
          {imoveis.map((im) => (
            <div
              key={im.id}
              className="bg-[#12121e] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4"
            >
              {im.imagemPrincipal && (
                <img
                  src={im.imagemPrincipal}
                  alt={im.titulo}
                  className="w-full md:w-24 h-20 object-cover rounded-xl flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <BadgeCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="font-bold text-white truncate">{im.titulo}</span>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0">
                    {im.tipo}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  {im.bairro ? `${im.bairro}, ` : ""}{im.cidade}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-6 text-right">
                <div>
                  <p className="text-xs text-gray-500">Anunciado</p>
                  <p className="font-bold text-gray-300">{formatarMoeda(im.preco)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fechamento</p>
                  <p className="font-black text-green-400">{formatarMoeda(im.valorFechamento)}</p>
                </div>
                {im.descontoPercentual != null && (
                  <div>
                    <p className="text-xs text-gray-500">Desconto</p>
                    <div className="flex items-center gap-1 justify-end">
                      <TrendingDown className="w-3 h-3 text-yellow-400" />
                      <p className="font-black text-yellow-400">{im.descontoPercentual.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Data</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <p className="text-gray-300 text-sm">{formatarData(im.dataVenda)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
