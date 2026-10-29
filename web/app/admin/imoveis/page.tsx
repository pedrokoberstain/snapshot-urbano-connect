"use client";

import { useAuth } from '@/lib/hooks/useAuth';
import { BlurLock } from '@/app/components/BlurLock';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, ExternalLink, Edit2, Trash2, Home,
  Sparkles, X, TrendingUp, Target, Map, Calculator,
  AlertTriangle, CheckCircle2, Info, ChevronDown,
  Building, Tractor, Sprout, Handshake, Tag, RotateCcw, PartyPopper,
  Search, SlidersHorizontal, Layers, DollarSign, TrendingDown, BarChart3
} from "lucide-react";

const fmtPreco = (valor?: number | null) =>
  valor != null
    ? valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';

export default function ListaImoveisAdmin() {
  const { isPro, loading: authLoading } = useAuth();
  const router = useRouter();
  const [imoveis, setImoveis] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // Controle de Abas
  const [abaAtiva, setAbaAtiva] = useState<'ATIVOS' | 'VENDIDOS'>('ATIVOS');

  // Estados do Modal IA
  const [modalIaAberto, setModalIaAberto] = useState(false);
  const [imovelAnalise, setImovelAnalise] = useState<any>(null);
  const [mostrarExplicacaoMath, setMostrarExplicacaoMath] = useState(false);

  // --- NOVO ESTADO: Tela de Comemoração ---
  const [celebracao, setCelebracao] = useState<any>(null);

  // --- MODAL DE CONFIRMAÇÃO DE VENDA ---
  const [modalVendaAberto, setModalVendaAberto] = useState(false);
  const [imovelParaVender, setImovelParaVender] = useState<any>(null);
  const [valorCentavos, setValorCentavos] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const formatarMoeda = (centavos: number) =>
    (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '');
    setValorCentavos(parseInt(digitos || '0', 10));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/imoveis`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Falha na autenticação ou servidor");
        return res.json();
      })
      .then((data) => {
        setImoveis(data);
        setCarregando(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar imóveis:", err);
        setCarregando(false);
      });
  }, [router]);

  // --- MARCAR COMO VENDIDO ---
  const abrirModalVenda = (imovel: any) => {
    setImovelParaVender(imovel);
    setValorCentavos(Math.round((imovel.preco || 0) * 100));
    setModalVendaAberto(true);
  };

  const confirmarVenda = async () => {
    if (!imovelParaVender) return;
    setModalVendaAberto(false);

    const token = localStorage.getItem("token");
    const valorFinal = valorCentavos / 100;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/imoveis/${imovelParaVender.id}/vender`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          valorFechamento: valorFinal > 0 ? valorFinal : null
        })
      });

      if (res.ok) {
        const imovelAtualizado = {
          ...imovelParaVender,
          vendido: true,
          ativo: false,
          valorFechamento: valorFinal > 0 ? valorFinal : null,
          dataVenda: new Date().toISOString()
        };
        setImoveis(imoveis.map(i => i.id === imovelParaVender.id ? imovelAtualizado : i));

        setCelebracao(imovelAtualizado);
        setTimeout(() => setCelebracao(null), 6000);
      } else {
        alert("Erro ao comunicar a venda ao servidor.");
      }
    } catch (error) {
      console.error(error);
      alert("Falha de conexão com o servidor.");
    }
  };

  // --- REATIVAR IMÓVEL VENDIDO ---
  const reativarImovel = async (id: number) => {
    if (!confirm("Deseja cancelar a venda e voltar este imóvel para a vitrine ativa?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/imoveis/${id}/reativar`, {
        method: "PATCH", 
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (res.ok) {
        setImoveis(imoveis.map(imovel => 
          imovel.id === id ? { ...imovel, vendido: false, ativo: true } : imovel
        ));
      } else {
        alert("Erro ao reativar o imóvel.");
      }
    } catch (error) {
      console.error(error);
      alert("Falha de conexão com o servidor.");
    }
  };

  const excluirImovel = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este imóvel permanentemente?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/imoveis/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setImoveis(imoveis.filter((imovel) => imovel.id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const abrirRaioX = (imovel: any) => {
    setImovelAnalise(imovel);
    setMostrarExplicacaoMath(false);
    setModalIaAberto(true);
  };

  if (authLoading || carregando) {
    return (
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-green-500 font-bold tracking-widest uppercase text-sm">Sincronizando acesso...</span>
        </div>
      </div>
    );
  }

  // --- LÓGICA DA IA ---
  let precoSolicitado = 0;
  let avaliacaoAlgoritmo = 0;
  let score = 1;
  let margemSeguraMin = 0;
  let margemSeguraMax = 0;
  let isRural = false;
  let sprawlIndex = "1.0";
  let diagnostico1Title = "";
  let diagnostico1Value = "";
  let diagnostico1Desc = "";
  let diagnostico2Title = "";
  let diagnostico2Value = "";
  let diagnostico2Desc = "";

  if (imovelAnalise) {
    precoSolicitado = imovelAnalise.preco || 0;
    score = imovelAnalise.scoreOportunidade ?? imovelAnalise.score_oportunidade ?? 1;
    isRural = imovelAnalise.tipo === "RURAL" || imovelAnalise.tipo === "FAZENDA";

    if (score > 0 && precoSolicitado > 0) {
      avaliacaoAlgoritmo = precoSolicitado / score;
    } else {
      avaliacaoAlgoritmo = precoSolicitado * 1.05;
    }

    margemSeguraMin = avaliacaoAlgoritmo * 0.92;
    margemSeguraMax = avaliacaoAlgoritmo * 1.08;

    if (isRural) {
      diagnostico1Title = "Índice Logístico (Escoamento)";
      diagnostico1Value = imovelAnalise.distanciaRodovia ? `${imovelAnalise.distanciaRodovia} km` : "Alta";
      diagnostico1Desc = "Proximidade de silos e rodovias pavimentadas (BR-163/MT-130).";
      diagnostico2Title = "Vocação Produtiva";
      diagnostico2Value = imovelAnalise.aptidao || "Dupla Aptidão";
      diagnostico2Desc = "Classificação baseada em topografia, argila e histórico de safra.";
    } else {
      sprawlIndex = imovelAnalise.sprawl ? imovelAnalise.sprawl.toFixed(1) : (1.2 + Math.random() * 0.8).toFixed(1);
      diagnostico1Title = "Índice de Sprawl (Expansão)";
      diagnostico1Value = sprawlIndex;
      diagnostico1Desc = "Área em consolidação – alta expectativa de valorização urbana no entorno.";
      diagnostico2Title = "Padrão de Acabamento";
      diagnostico2Value = imovelAnalise.padrao ? `Score ${imovelAnalise.padrao}` : "Premium";
      diagnostico2Desc = "Classificação baseada em materiais, projeto arquitetônico e infraestrutura.";
    }
  }

  const ativos = imoveis.filter(im => !im.vendido);
  const vendidos = imoveis.filter(im => im.vendido);
  const totalCarteira = ativos.reduce((sum, im) => sum + (im.preco || 0), 0);
  const totalFaturado = vendidos.reduce((sum, im) => sum + (im.valorFechamento || im.preco || 0), 0);

  const imoveisExibidos = imoveis
    .filter(im => abaAtiva === 'ATIVOS' ? !im.vendido : im.vendido)
    .filter(im => !busca || im.titulo?.toLowerCase().includes(busca.toLowerCase()) || im.cidade?.toLowerCase().includes(busca.toLowerCase()))
    .filter(im => !filtroTipo || im.tipo === filtroTipo);

  return (
    <main className="min-h-screen bg-[#09090f] font-sans relative overflow-hidden pb-20">
      
      {!isPro && <BlurLock />}

      {/* ── OVERLAY DE COMEMORAÇÃO (GAMIFICAÇÃO) ── */}
      {celebracao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-500">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Efeitos de luz dourada */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/20 blur-[150px] rounded-full animate-pulse" />
          </div>

          <div className="bg-gradient-to-b from-[#1a150c] to-[#09090f] border-2 border-amber-500/50 rounded-[3rem] p-10 md:p-16 max-w-2xl w-full text-center relative z-10 shadow-[0_0_100px_rgba(245,158,11,0.3)] animate-in zoom-in slide-in-from-bottom-12 duration-700">
            <button onClick={() => setCelebracao(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            
            <div className="mx-auto w-24 h-24 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
              <PartyPopper className="w-12 h-12 text-amber-400 animate-bounce" />
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 uppercase tracking-tighter italic mb-4">
              Negócio Fechado!
            </h2>
            
            <p className="text-lg text-gray-300 font-medium mb-8">
              O imóvel <strong className="text-white">{celebracao.titulo}</strong> foi marcado como vendido e movido para o seu histórico de sucesso.
            </p>

            <div className="bg-black/40 border border-amber-500/20 rounded-2xl p-6 inline-block w-full max-w-md">
              <p className="text-xs font-black text-amber-500/70 uppercase tracking-widest mb-1">Valor de Fechamento</p>
              <p className="text-3xl md:text-4xl font-black text-amber-400">
                R$ {fmtPreco(celebracao.valorFechamento ?? celebracao.preco)}
              </p>
              {celebracao.valorFechamento && celebracao.valorFechamento !== celebracao.preco && (
                <p className="text-xs text-amber-500/50 mt-1 font-medium">
                  Anunciado por R$ {fmtPreco(celebracao.preco)}
                </p>
              )}
            </div>

            <button 
              onClick={() => setCelebracao(null)}
              className="mt-10 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest px-10 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(245,158,11,0.3)]"
            >
              Continuar Vendendo
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMAÇÃO DE VENDA ── */}
      {modalVendaAberto && imovelParaVender && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#12121e] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  <Handshake className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-lg font-black text-white">Registrar Venda</h2>
              </div>
              <button onClick={() => setModalVendaAberto(false)} className="p-2 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-400 font-medium mb-6">
              Confirmando a venda de <strong className="text-white">{imovelParaVender.titulo}</strong>. Informe o valor real de fechamento do negócio.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                Valor de Fechamento
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatarMoeda(valorCentavos)}
                  onChange={handleValorChange}
                  className="w-full bg-[#09090f] border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white font-black text-lg focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <p className="text-xs text-gray-600 mt-1.5 font-medium">
                Preço anunciado: R$ {fmtPreco(imovelParaVender.preco)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalVendaAberto(false)}
                className="flex-1 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:text-white font-bold text-sm transition-colors hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarVenda}
                className="flex-1 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
              >
                Confirmar Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glow de Fundo padrão */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-green-600 rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none"></div>

      <div className={`w-full p-4 md:p-10 relative z-10 transition-all duration-500 ${!isPro ? 'blur-md pointer-events-none select-none' : ''}`}>
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-green-500 font-bold text-sm mb-3 transition-colors outline-none">
              <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-white">Gerenciar Imóveis</h1>
          </div>
          <Link href={isPro ? "/admin/imoveis/novo" : "/planos"} className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg active:scale-95">
            <Plus className="w-5 h-5" /> Novo Imóvel
          </Link>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20 shrink-0">
              <Home className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Anúncios Ativos</p>
              <p className="text-2xl font-black text-white">{ativos.length}</p>
            </div>
          </div>
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 shrink-0">
              <Handshake className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Vendidos</p>
              <p className="text-2xl font-black text-white">{vendidos.length}</p>
            </div>
          </div>
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 shrink-0">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Em Carteira</p>
              <p className="text-lg font-black text-white leading-tight">R$ {fmtPreco(totalCarteira)}</p>
            </div>
          </div>
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Faturado</p>
              <p className="text-lg font-black text-white leading-tight">R$ {fmtPreco(totalFaturado)}</p>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-6 mb-6 border-b border-white/10">
          <button onClick={() => setAbaAtiva('ATIVOS')} className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors relative ${abaAtiva === 'ATIVOS' ? 'text-green-500' : 'text-gray-500 hover:text-gray-300'}`}>
            Anúncios Ativos
            {abaAtiva === 'ATIVOS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 rounded-t-full" />}
          </button>
          <button onClick={() => setAbaAtiva('VENDIDOS')} className={`pb-4 text-sm font-black uppercase tracking-widest transition-colors relative flex items-center gap-2 ${abaAtiva === 'VENDIDOS' ? 'text-amber-500' : 'text-gray-500 hover:text-gray-300'}`}>
            Histórico de Vendas
            {abaAtiva === 'VENDIDOS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full" />}
          </button>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por título ou cidade..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-[#12121e] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 font-medium focus:outline-none focus:border-green-500/40 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-500 shrink-0" />
            {[
              { label: 'Todos', value: '' },
              { label: 'Urbano', value: 'URBANO' },
              { label: 'Rural', value: 'RURAL' },
            ].map(op => (
              <button
                key={op.value}
                onClick={() => setFiltroTipo(op.value)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  filtroTipo === op.value
                    ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                    : 'bg-[#12121e] text-gray-500 border border-white/10 hover:text-gray-300 hover:border-white/20'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-[#12121e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden backdrop-blur-xl animate-in fade-in duration-300">
          {imoveisExibidos.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                {busca || filtroTipo
                  ? <Search className="w-10 h-10 text-gray-500" />
                  : abaAtiva === 'ATIVOS' ? <Home className="w-10 h-10 text-gray-500" /> : <Tag className="w-10 h-10 text-gray-500" />}
              </div>
              <h3 className="text-xl font-black text-gray-300 mb-2 uppercase tracking-tight">
                {busca || filtroTipo ? 'Nenhum resultado encontrado' : abaAtiva === 'ATIVOS' ? 'Nenhum imóvel ativo' : 'Nenhuma venda registrada'}
              </h3>
              {(busca || filtroTipo) && (
                <button onClick={() => { setBusca(''); setFiltroTipo(''); }} className="mt-4 text-xs font-bold text-green-500 hover:text-green-400 transition-colors">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">Imóvel</th>
                    <th className="px-5 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">{abaAtiva === 'VENDIDOS' ? 'Valor de Fechamento' : 'Preço'}</th>
                    <th className="px-5 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-wider">{abaAtiva === 'VENDIDOS' ? 'Data da Venda' : 'Cadastrado em'}</th>
                    <th className="px-5 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {imoveisExibidos.map((imovel) => (
                    <tr key={imovel.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-16 rounded-xl overflow-hidden bg-[#09090f] border border-white/10 relative shrink-0">
                            <img src={imovel.imagemPrincipal || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&w=200&q=80"} alt={imovel.titulo} className="w-full h-full object-cover" />
                            {imovel.vendido && <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-bold text-base ${imovel.vendido ? 'text-gray-400' : 'text-gray-100'}`}>{imovel.titulo}</span>
                              {imovel.vendido
                                ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">Vendido</span>
                                : imovel.ativo
                                  ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-green-500/10 text-green-400 border border-green-500/20">Ativo</span>
                                  : <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-gray-800 text-gray-400 border border-gray-700">Oculto</span>
                              }
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium">
                              {imovel.tipo === 'RURAL' ? <Tractor className="w-3 h-3 text-green-500" /> : <Building className="w-3 h-3 text-blue-500" />}
                              {imovel.cidade}{imovel.bairro ? `, ${imovel.bairro}` : ''}
                            </p>
                            {imovel.areaTotal && (
                              <p className="text-xs text-gray-600 mt-0.5 font-medium">
                                {imovel.tipo === 'RURAL'
                                  ? `${(imovel.areaTotal / 10000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ha`
                                  : `${imovel.areaTotal.toLocaleString('pt-BR')} m²`}
                                {imovel.quartos ? ` · ${imovel.quartos} qts` : ''}
                                {imovel.banheiros ? ` · ${imovel.banheiros} ban` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {imovel.vendido && imovel.valorFechamento ? (
                          <div>
                            <span className="font-black text-amber-400">R$ {fmtPreco(imovel.valorFechamento)}</span>
                            {imovel.valorFechamento !== imovel.preco && (
                              <p className="text-xs text-gray-600 font-medium mt-0.5 line-through">R$ {fmtPreco(imovel.preco)}</p>
                            )}
                          </div>
                        ) : (
                          <span className={`font-black ${imovel.vendido ? 'text-gray-500' : 'text-green-400'}`}>R$ {fmtPreco(imovel.preco)}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {imovel.vendido && imovel.dataVenda ? (
                          <span className="text-sm font-bold text-gray-300">
                            {new Date(imovel.dataVenda).toLocaleDateString('pt-BR')}
                          </span>
                        ) : imovel.dataCadastro ? (
                          <span className="text-sm font-bold text-gray-300">
                            {new Date(imovel.dataCadastro).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* BOTÕES DE VENDER OU REATIVAR */}
                          {imovel.vendido ? (
                            <button onClick={() => reativarImovel(imovel.id)} className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors border border-transparent hover:border-emerald-400/30" title="Reativar Imóvel">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => abrirModalVenda(imovel)} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/30" title="Marcar como Vendido">
                              <Handshake className="w-4 h-4" />
                            </button>
                          )}

                          <button onClick={() => abrirRaioX(imovel)} className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-colors" title="Raio-X IA"><Sparkles className="w-4 h-4" /></button>
                          
                          {!imovel.vendido && (
                            <button onClick={() => window.open(`/imovel/${imovel.id}`, '_blank')} className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"><ExternalLink className="w-4 h-4" /></button>
                          )}

                          <button onClick={() => router.push(`/admin/imoveis/editar/${imovel.id}`)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => excluirImovel(imovel.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL RAIO-X DA IA */}
      {modalIaAberto && imovelAnalise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0f0f17] border border-purple-500/20 rounded-3xl w-full max-w-3xl overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.15)] flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">

            {/* Header */}
            <div className="bg-gradient-to-r from-[#1a1025] to-[#0f0f17] p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Urbano Connect IA</h2>
                  <p className="text-xs text-purple-300/60 font-bold uppercase tracking-widest">{imovelAnalise.tipo} • {imovelAnalise.cidade}</p>
                </div>
              </div>
              <button onClick={() => setModalIaAberto(false)} className="p-2 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo */}
            <div className="p-6 md:p-8 overflow-y-auto">

              {/* Preços */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Preço Solicitado</p>
                  <p className="text-3xl font-black text-white">R$ {fmtPreco(precoSolicitado)}</p>
                </div>
                <div className="bg-purple-900/10 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute right-[-20px] top-[-20px] opacity-10"><Target className="w-32 h-32 text-purple-400" /></div>
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Avaliação do Algoritmo</p>
                  <p className="text-3xl font-black text-purple-300">R$ {avaliacaoAlgoritmo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>

              {/* Negociação e Score */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-green-900/20 to-[#12121e] border border-green-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Faixa de Negociação Segura</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-4 font-medium">Margem recomendada para aceite de propostas sem depreciação de mercado.</p>
                  <div className="flex items-center justify-between bg-black/30 rounded-xl p-4 border border-white/5">
                    <span className="text-lg font-bold text-gray-300">R$ {margemSeguraMin.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    <span className="text-xs font-black text-gray-600 uppercase">Até</span>
                    <span className="text-lg font-bold text-white">R$ {margemSeguraMax.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <div className="bg-[#12121e] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute top-3 right-3"><Info className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" /></div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Score Oportunidade</span>
                  <p className={`text-5xl font-black tracking-tighter ${score <= 0.8 ? 'text-green-500' : score <= 0.95 ? 'text-blue-500' : 'text-orange-500'}`}>
                    {score.toFixed(2)}
                  </p>
                  <span className="mt-2 text-[10px] font-bold text-gray-400 uppercase bg-white/5 px-3 py-1 rounded-full">
                    {score <= 0.8 ? 'Excelente Compra' : score <= 0.95 ? 'Boa Oportunidade' : 'Preço de Mercado'}
                  </span>
                </div>
              </div>

              {/* Diagnóstico */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  {isRural ? <Sprout className="w-4 h-4 text-gray-400" /> : <Building className="w-4 h-4 text-gray-400" />}
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{isRural ? 'Diagnóstico Rural' : 'Diagnóstico Urbano'}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{diagnostico1Title}</p>
                    <p className="text-2xl font-black text-white mb-2">{diagnostico1Value}</p>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">{diagnostico1Desc}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{diagnostico2Title}</p>
                    <p className="text-2xl font-black text-white mb-2">{diagnostico2Value}</p>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">{diagnostico2Desc}</p>
                  </div>
                </div>
              </div>

              {/* Acordeão: Matemática da IA */}
              <div className="border-t border-white/10 pt-6">
                <button
                  onClick={() => setMostrarExplicacaoMath(!mostrarExplicacaoMath)}
                  className="w-full flex items-center justify-between text-left group outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Entenda a Matemática da IA</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${mostrarExplicacaoMath ? 'rotate-180' : ''}`} />
                </button>

                {mostrarExplicacaoMath && (
                  <div className="mt-4 bg-black/40 border border-purple-500/20 rounded-xl p-5 text-sm text-gray-400 leading-relaxed animate-in slide-in-from-top-2 duration-300">
                    <p className="mb-3">
                      A avaliação do <strong>Urbano Connect IA</strong> utiliza um modelo de <em>Regressão Hedônica</em>. O valor do imóvel não é deduzido apenas pelo metro quadrado/hectare, mas decomposto em atributos físicos, localização e dinâmica econômica regional.
                    </p>
                    <div className="bg-[#0f0f17] p-3 rounded-lg border border-white/5 font-mono text-[10px] text-purple-300 mb-3 overflow-x-auto">
                      ln(P) = β0 + β1 ln(area) + β2(infraestrutura) + β3(valor_venal_iptu) + β4(sprawl) + ε
                    </div>
                    <ul className="space-y-2 text-xs">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                        <span><strong>{isRural ? 'Índice de Escoamento:' : 'Sprawl Urbano:'}</strong> {isRural ? 'Mede o custo logístico baseado na distância de rodovias principais.' : 'Mede a expansão imobiliária na região, indicando forte potencial de valorização futura.'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                        <span><strong>Score de Oportunidade:</strong> É a divisão entre o Preço Solicitado e o Preço Estimado pelo Algoritmo. Quanto menor o Score, maior a barganha.</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="bg-[#12121e] border-t border-white/5 p-4 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-600">
                Modelo Econométrico Urbano Connect • Inteligência de Mercado
              </p>
            </div>

          </div>
        </div>
      )}
      
    </main>
  );
}