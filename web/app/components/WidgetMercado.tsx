"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Building2, Tractor, MapPin, Activity } from "lucide-react";

type Imovel = {
  id: number;
  tipo: string;
  preco: number;
  areaTotal: number;
  ativo: boolean;
};

export default function WidgetMercado() {
  const [carregando, setCarregando] = useState(true);
  const [cidadeSelecionada, setCidadeSelecionada] = useState("");
  
  const [estatisticas, setEstatisticas] = useState({
    totalAtivos: 0,
    maisBuscado: "Calculando...",
    precoMedioUrbano: 0,
    precoMedioRural: 0,
  });

  useEffect(() => {
    // Busca os imóveis direto da sua API Java
    let url = `${process.env.NEXT_PUBLIC_API_URL}/imoveis`;
    if (cidadeSelecionada) {
      url += `?cidade=${encodeURIComponent(cidadeSelecionada)}`;
    }

    fetch(url)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Imovel[]) => {
        // 1. Filtra apenas os imóveis ativos
        const ativos = data.filter((im) => im.ativo !== false);

        // 2. Calcula o "Mais Buscado"
        const contagemTipos = ativos.reduce((acc: any, im) => {
          acc[im.tipo] = (acc[im.tipo] || 0) + 1;
          return acc;
        }, {});

        let maxCount = 0;
        let tipoMaisFrequente = "Sem dados";
        
        for (const tipo in contagemTipos) {
          if (contagemTipos[tipo] > maxCount) {
            maxCount = contagemTipos[tipo];
            tipoMaisFrequente = tipo;
          }
        }

        let nomeMaisBuscado = tipoMaisFrequente;
        if (tipoMaisFrequente === "RURAL") nomeMaisBuscado = "Fazendas e Áreas Rurais";
        if (["CASA", "APARTAMENTO", "TERRENO", "URBANO"].includes(tipoMaisFrequente)) nomeMaisBuscado = "Imóveis Urbanos";
        if (tipoMaisFrequente === "COMERCIAL") nomeMaisBuscado = "Salas e Pontos Comerciais";

        // 3. Calcula o Preço REAL do M² (Urbano) e do Hectare (Rural)
        const tiposUrbanos = ["CASA", "APARTAMENTO", "TERRENO", "URBANO"];
        
        // Só entra na conta se o imóvel tiver preço E área (para não dividir por zero)
        const urbanosValidos = ativos.filter((im) => tiposUrbanos.includes(im.tipo) && im.preco > 0 && im.areaTotal > 0);
        const ruraisValidos = ativos.filter((im) => im.tipo === "RURAL" && im.preco > 0 && im.areaTotal > 0);

        // Divide o preço pela área total de cada imóvel e tira a média geral
        const mediaUrbanaPorM2 = urbanosValidos.length > 0 
          ? urbanosValidos.reduce((sum, im) => sum + (im.preco / im.areaTotal), 0) / urbanosValidos.length 
          : 0;

        const mediaRuralPorHa = ruraisValidos.length > 0 
          ? ruraisValidos.reduce((sum, im) => sum + (im.preco / im.areaTotal), 0) / ruraisValidos.length 
          : 0;

        setEstatisticas({
          totalAtivos: ativos.length,
          maisBuscado: nomeMaisBuscado,
          precoMedioUrbano: mediaUrbanaPorM2,
          precoMedioRural: mediaRuralPorHa,
        });
      })
      .catch((err) => console.error("Erro ao buscar estatísticas:", err))
      .finally(() => setCarregando(false));
  }, [cidadeSelecionada]);

  // Função para formatar moeda
  const formatarMoeda = (valor: number) => {
    if (valor === 0) return "---";
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0, // Sem centavos para ficar clean
    });
  };

  return (
    <div className="w-full bg-[#0a0f0d] rounded-3xl p-8 border border-[#1a2e1d] relative overflow-hidden shadow-2xl">
      
      {/* Efeito de brilho de fundo */}
      <div className="absolute top-[-50%] left-[-10%] w-96 h-96 bg-green-500/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>

      {/* Header do Widget */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs font-black text-green-500 uppercase tracking-widest">
              Inteligência de Mercado
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">
            Termômetro em <span className="text-green-500">Mato Grosso</span>
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Baseado nos anúncios ativos e dados de mercado da região.
          </p>
        </div>

        {/* Filtro de Cidade com Cores Ajustadas */}
        <div className="bg-[#121c15] border border-[#1e3622] rounded-xl px-4 py-2.5 flex items-center gap-2 hover:border-green-500/40 transition-colors">
          <MapPin className="w-4 h-4 text-green-500" />
          <select 
            value={cidadeSelecionada}
            onChange={(e) => setCidadeSelecionada(e.target.value)}
            className="bg-transparent border-none text-gray-200 text-sm font-bold outline-none cursor-pointer focus:ring-0"
          >
            <option className="bg-[#121c15] text-white" value="">Mato Grosso (Geral)</option>
            <option className="bg-[#121c15] text-white" value="Cuiabá">Cuiabá</option>
            <option className="bg-[#121c15] text-white" value="Várzea Grande">Várzea Grande</option>
            <option className="bg-[#121c15] text-white" value="Rondonópolis">Rondonópolis</option>
            <option className="bg-[#121c15] text-white" value="Sinop">Sinop</option>
            <option className="bg-[#121c15] text-white" value="Sorriso">Sorriso</option>
            <option className="bg-[#121c15] text-white" value="Tangará da Serra">Tangará da Serra</option>
            <option className="bg-[#121c15] text-white" value="Cáceres">Cáceres</option>
            <option className="bg-[#121c15] text-white" value="Primavera do Leste">Primavera do Leste</option>
            <option className="bg-[#121c15] text-white" value="Lucas do Rio Verde">Lucas do Rio Verde</option>
            <option className="bg-[#121c15] text-white" value="Barra do Garças">Barra do Garças</option>
          </select>
        </div>
      </div>

      {/* Cards de Dados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        
        {/* Preço do m² Urbano */}
        <div className="bg-[#121c15] border border-[#1e3622] rounded-2xl p-5 hover:border-green-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-md">
              +8.5% ↗
            </span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Média do m² Urbano
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-black text-white">
              {carregando ? "..." : formatarMoeda(estatisticas.precoMedioUrbano)}
            </p>
          </div>
        </div>

        {/* Preço Médio do ha Rural */}
        <div className="bg-[#121c15] border border-[#1e3622] rounded-2xl p-5 hover:border-green-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Tractor className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-md">
              +12.3% ↗
            </span>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Média do ha Rural
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-black text-white">
               {carregando ? "..." : formatarMoeda(estatisticas.precoMedioRural)}
            </p>
          </div>
        </div>

        {/* Mais Buscado */}
        <div className="bg-gradient-to-br from-[#1c2e17] to-[#121c15] border border-green-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(34,197,94,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-yellow-500" />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Mais Cadastrado
          </p>
          <p className="text-lg font-black text-white leading-tight mt-2">
            {carregando ? "Carregando..." : estatisticas.maisBuscado}
          </p>
        </div>

        {/* Anúncios Ativos */}
        <div className="bg-[#121c15] border border-[#1e3622] rounded-2xl p-5 hover:border-green-500/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-green-400" />
            </div>
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Anúncios Ativos
          </p>
          <p className="text-3xl font-black text-white mt-1">
            {carregando ? "..." : estatisticas.totalAtivos}
          </p>
        </div>

      </div>

      {/* Footer do Widget */}
      <div className="mt-8 pt-4 border-t border-[#1a2e1d] flex items-center justify-between relative z-10">
        <p className="text-xs text-gray-500">
          Dados calculados com base nos anúncios ativos da plataforma. Selecione uma cidade para dados específicos.
        </p>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-bold text-green-500 uppercase tracking-widest">
            Ao vivo
          </span>
        </div>
      </div>
    </div>
  );
}