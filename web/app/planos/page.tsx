"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import CheckoutPix from '../components/CheckoutPix';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  QrCode, 
  Lock,
  UserCircle,
  Award,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

type PrecoPlano = { tipo: string; valor: number; descricao: string };

function formatarPreco(valor: number) {
  const [inteiro, decimal] = valor.toFixed(2).split(".");
  return { inteiro, decimal };
}

export default function PlanosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [modalPixAberto, setModalPixAberto] = useState(false);
  const [planoEscolhido, setPlanoEscolhido] = useState<string>('');
  const [avisoLogin, setAvisoLogin] = useState(false);
  const [faqAberto, setFaqAberto] = useState<number | null>(null);
  const [precos, setPrecos] = useState<Record<string, PrecoPlano>>({});

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/precos-planos`)
      .then(r => r.json())
      .then((d: PrecoPlano[]) => {
        const mapa: Record<string, PrecoPlano> = {};
        d.forEach(p => { mapa[p.tipo] = p; });
        setPrecos(mapa);
      })
      .catch(() => {});
  }, []);

  const verificarAutenticacao = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAvisoLogin(true);
      setTimeout(() => {
        router.push('/login?redirect=/planos');
      }, 3000);
      return false;
    }
    return token;
  };

  const handleAssinar = async (tipoPlano: string) => {
    const token = verificarAutenticacao();
    if (!token) return;

    setLoading(tipoPlano);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagamentos/assinar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plano: tipoPlano })
      });

      if (!response.ok) throw new Error('Falha na comunicação com o servidor.');

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL não encontrada.');
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Não foi possível iniciar o pagamento. Tente novamente mais tarde.");
    } finally {
      setLoading(null);
    }
  };

  const handleAbrirPix = (tipoPlano: string) => {
    const isAutenticado = verificarAutenticacao();
    if (!isAutenticado) return;

    setPlanoEscolhido(tipoPlano);
    setModalPixAberto(true);
  };

  const faqs = [
    {
      pergunta: "A liberação do acesso PRO é imediata?",
      resposta: "Sim! Optando pelo pagamento via PIX, o sistema identifica a transação em tempo real e o seu acesso às ferramentas da IA e contatos ilimitados é liberado na mesma hora."
    },
    {
      pergunta: "Como funciona a garantia de 7 dias?",
      resposta: "Você pode assinar e testar a plataforma na prática. Se dentro de 7 dias você achar que o Urbano Connect não ajuda nas suas vendas, basta enviar um e-mail e devolvemos 100% do seu dinheiro, sem burocracia."
    },
    {
      pergunta: "Posso cancelar o plano mensal quando quiser?",
      resposta: "Completamente. O plano mensal não tem fidelidade. Você assina, usa os recursos avançados de análise de mercado e, se desejar, pode cancelar a renovação com um clique no painel."
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090f] text-gray-200 font-sans relative overflow-hidden selection:bg-green-600 selection:text-white pb-24">
      
      {/* ── NOTIFICAÇÃO DE REDIRECIONAMENTO (TOAST) ── */}
      {avisoLogin && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-top-8 duration-500">
          <div className="bg-[#12121e] border-2 border-emerald-500/50 rounded-2xl p-5 shadow-[0_0_40px_rgba(16,185,129,0.2)] flex items-center gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-xl">
              <UserCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-sm uppercase tracking-tight">Identifique-se</p>
              <p className="text-gray-400 text-xs font-medium">Crie uma conta ou faça login para adquirir seu plano PRO.</p>
            </div>
            <div className="w-1.5 h-10 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* ── EFEITOS DE LUZ AO FUNDO ── */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-green-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none" />

      {/* ── NAVEGAÇÃO SUPERIOR ── */}
      <div className="max-w-[1200px] mx-auto px-6 pt-8 relative z-10">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors outline-none group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Voltar para a plataforma
        </button>
      </div>

      {/* ── HEADER DA PÁGINA ── */}
      <div className="text-center max-w-4xl mx-auto mt-12 mb-16 relative z-10 px-6">
        <div className="flex justify-center mb-4">
          <Image src="/logo-icon.png" alt="Urbano Connect" width={96} height={96} unoptimized className="drop-shadow-[0_0_20px_rgba(234,88,12,0.5)]" />
        </div>
        <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-green-500" /> Acesso Seguro e Imediato
        </span>
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-[1.1]">
          Escolha o plano ideal para <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            dominar o mercado.
          </span>
        </h1>
        <p className="mt-6 text-xl text-gray-400 font-medium max-w-2xl mx-auto">
          Cancele a qualquer momento. Sem taxas ocultas. Liberte todo o potencial do agronegócio e mercado urbano no Mato Grosso.
        </p>
      </div>

      {/* ── GRID DE PLANOS ── */}
      <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-6 relative z-10 items-stretch">
        
        {/* CARD MENSAL */}
        <div className={`bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 flex flex-col hover:border-white/20 transition-all duration-300 ${avisoLogin ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          <div className="mb-8">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Pro Mensal</h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Ideal para testar nossas ferramentas.</p>
          </div>
          
          <div className="mb-8">
            <p className="flex items-start text-white">
              <span className="text-2xl font-bold mt-1">R$</span>
              <span className="text-6xl font-black tracking-tighter">{precos.MENSAL ? formatarPreco(precos.MENSAL.valor).inteiro : "29"}</span>
              <span className="text-2xl font-bold mt-1">,{precos.MENSAL ? formatarPreco(precos.MENSAL.valor).decimal : "90"}</span>
              <span className="text-gray-500 ml-2 self-end mb-2 font-medium">/mês</span>
            </p>
          </div>

          <ul className="space-y-4 flex-1 mb-10">
            {['Acesso a todas as ferramentas', 'Análise de Imóveis Padrão', 'Cotações CEPEA atualizadas', 'Suporte via Email'].map((item, i) => (
              <li key={i} className="flex items-center text-gray-300 font-medium">
                <CheckCircle2 className="text-green-500 w-5 h-5 mr-3 shrink-0" /> {item}
              </li>
            ))}
          </ul>
          
          <div className="space-y-4 mt-auto">
            {/* Padronizado py-4 em todos os botões para alinhar perfeitamente */}
            <button
              onClick={() => handleAbrirPix('MENSAL')}
              disabled={loading !== null}
              className="w-full bg-white text-black hover:bg-gray-100 font-black uppercase tracking-widest py-4 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 outline-none"
            >
              <QrCode className="w-5 h-5" /> Pagar com PIX
            </button>
            <button
              onClick={() => handleAssinar('MENSAL')}
              disabled={loading !== null}
              className="w-full bg-transparent text-gray-400 border border-white/10 hover:bg-white/5 hover:text-white font-bold py-4 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 outline-none"
            >
              <CreditCard className="w-4 h-4" /> {loading === 'MENSAL' ? 'Aguarde...' : 'Cartão de Crédito'}
            </button>
          </div>
        </div>

        {/* CARD ANUAL (DESTAQUE) */}
        <div className={`bg-gradient-to-b from-green-900/40 to-black backdrop-blur-xl border border-green-500/50 rounded-[2.5rem] p-10 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_50px_rgba(34,197,94,0.15)] transition-all duration-300 ${avisoLogin ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-max">
            <div className="bg-green-500 text-black text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
              <Zap className="w-3 h-3" /> Mais Vantajoso
            </div>
          </div>

          <div className="mb-8 mt-2">
            <h3 className="text-2xl font-black text-green-400 uppercase tracking-tight">Pro Anual</h3>
            <p className="text-sm text-gray-400 font-medium mt-1">Para visionários e fechadores de negócios.</p>
          </div>
          
          <div className="mb-8">
            <p className="flex items-start text-white">
              <span className="text-2xl font-bold mt-1">R$</span>
              <span className="text-6xl font-black tracking-tighter">{precos.ANUAL ? formatarPreco(precos.ANUAL.valor).inteiro : "299"}</span>
              <span className="text-2xl font-bold mt-1">,{precos.ANUAL ? formatarPreco(precos.ANUAL.valor).decimal : "00"}</span>
              <span className="text-gray-400 ml-2 self-end mb-2 font-medium">/ano</span>
            </p>
            {precos.MENSAL && precos.ANUAL && (() => {
              const economia = Math.round((1 - precos.ANUAL.valor / (precos.MENSAL.valor * 12)) * 100);
              return economia > 0 ? <p className="text-green-400 text-sm font-bold uppercase tracking-wider mt-2">✨ Economize {economia}% ao ano</p> : null;
            })()}
          </div>

          <ul className="space-y-4 flex-1 mb-10">
            {[
              'Tudo do plano mensal incluído', 
              'Dados Técnicos Rurais Avançados', 
              'Raio-X Inteligente com IA', 
              'Contato direto com proprietários via WhatsApp',
              'Atendimento VIP Prioritário'
            ].map((item, i) => (
              <li key={i} className="flex items-start text-white font-medium">
                <CheckCircle2 className="text-green-400 w-5 h-5 mr-3 shrink-0 mt-0.5" /> 
                {item}
              </li>
            ))}
          </ul>

          <div className="space-y-4 mt-auto">
            {/* Padronizado py-4 em todos os botões */}
            <button
              onClick={() => handleAbrirPix('ANUAL')}
              disabled={loading !== null}
              className="w-full bg-green-600 text-white hover:bg-green-500 font-black uppercase tracking-widest py-4 px-4 rounded-2xl shadow-[0_10px_30px_rgba(34,197,94,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 outline-none"
            >
              <QrCode className="w-5 h-5" /> Pagar com PIX Agora
            </button>
            <button
              onClick={() => handleAssinar('ANUAL')}
              disabled={loading !== null}
              className="w-full bg-black/40 text-gray-300 border border-green-500/30 hover:bg-black/60 hover:text-white font-bold py-4 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 outline-none"
            >
              <CreditCard className="w-4 h-4" /> {loading === 'ANUAL' ? 'Aguarde...' : 'Assinar com Cartão'}
            </button>
          </div>
        </div>

      </div>

      {/* ── GATILHOS DE CONVERSÃO (GARANTIA E FAQ) ── */}
      <div className="max-w-[800px] mx-auto mt-24 relative z-10 px-6">
        
        {/* Banner de Garantia */}
        <div className="bg-gradient-to-r from-emerald-900/20 to-transparent border border-emerald-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 mb-16">
          <div className="bg-emerald-500/10 p-4 rounded-full">
            <Award className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Garantia Incondicional de 7 Dias</h3>
            <p className="text-gray-400 text-sm font-medium">
              Risco absolutamente zero. Assine e explore o algoritmo de precificação e os contatos da plataforma. Se não ficar satisfeito nos primeiros 7 dias, devolvemos 100% do seu investimento.
            </p>
          </div>
        </div>

        {/* FAQ - Perguntas Frequentes */}
        <div>
          <div className="flex items-center justify-center gap-3 mb-8">
            <HelpCircle className="w-5 h-5 text-gray-500" />
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight text-center">Perguntas Frequentes</h3>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-[#12121e] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10"
              >
                <button 
                  onClick={() => setFaqAberto(faqAberto === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 outline-none"
                >
                  <span className="font-bold text-gray-200 text-left">{faq.pergunta}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 shrink-0 ${faqAberto === index ? 'rotate-180 text-emerald-500' : ''}`} />
                </button>
                {faqAberto === index && (
                  <div className="px-6 pb-6 text-sm text-gray-400 font-medium animate-in slide-in-from-top-2 duration-300">
                    {faq.resposta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── RODAPÉ DE SEGURANÇA ── */}
      <div className="max-w-2xl mx-auto mt-20 text-center flex flex-col items-center justify-center space-y-4 relative z-10 px-6">
        <div className="flex items-center gap-2 text-gray-500 text-sm font-bold uppercase tracking-widest">
          <Lock className="w-4 h-4 text-emerald-500" /> Pagamento 100% Seguro
        </div>
        <p className="text-xs text-gray-600 font-medium italic">
          Transações processadas de ponta a ponta pelo Mercado Pago. Seus dados financeiros não são armazenados em nossa plataforma.
        </p>
      </div>

      {/* ── MODAL DO PIX ── */}
      {modalPixAberto && (
        <CheckoutPix 
          planoSelecionado={planoEscolhido} 
          onClose={() => setModalPixAberto(false)} 
        />
      )}
    </div>
  );
}