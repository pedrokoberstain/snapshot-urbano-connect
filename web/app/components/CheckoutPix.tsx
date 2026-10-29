'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CheckoutPixProps {
  planoSelecionado: string;
  onClose: () => void;
}

interface DadosPix {
  qr_code_base64: string;
  qr_code_copia_e_cola: string;
  payment_id: string;
}

export default function CheckoutPix({ planoSelecionado, onClose }: CheckoutPixProps) {
  const [loading, setLoading] = useState(false);
  const [dadosPix, setDadosPix] = useState<DadosPix | null>(null);
  const [copiado, setCopiado] = useState(false);
  
  // NOVO: Estado para controlar a tela de sucesso
  const [pagamentoConcluido, setPagamentoConcluido] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (dadosPix && !pagamentoConcluido) {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const usuario = await response.json();
            if (usuario.plano === 'PRO') {
              clearInterval(interval);
              // Em vez de alert, ativamos a interface de sucesso!
              setPagamentoConcluido(true);
            }
          }
        } catch (error) {
          console.error("Erro ao verificar status:", error);
        }
      }, 4000);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [dadosPix, pagamentoConcluido]);

  const gerarPix = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); 
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pagamentos/pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plano: planoSelecionado })
      });

      if (response.ok) {
        const data = await response.json();
        setDadosPix(data);
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const copiarCodigo = () => {
    if (dadosPix) {
      navigator.clipboard.writeText(dadosPix.qr_code_copia_e_cola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  // --- RENDERIZAÇÃO DA TELA DE SUCESSO (A PARTE "FODA") ---
  if (pagamentoConcluido) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
            🚀
          </div>
          
          <h2 className="mb-2 text-3xl font-extrabold text-slate-900 italic">VOCÊ AGORA É PRO!</h2>
          <p className="mb-8 text-slate-500 font-medium">O Urbano Connect foi atualizado com sucesso.</p>

          <div className="mb-8 space-y-3 text-left">
            <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 font-semibold uppercase tracking-tight">
              <span className="text-emerald-500 text-xl">✓</span> Inteligência RuraL Avançada Liberada
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 font-semibold uppercase tracking-tight">
              <span className="text-emerald-500 text-xl">✓</span> Raio-X de Imóveis ilimitado
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 font-semibold uppercase tracking-tight">
              <span className="text-emerald-400 text-xl">✓</span> Suporte Prioritário Ativado
            </div>
          </div>

          <button 
            onClick={() => {
                onClose();
                router.push('/'); // Manda para a página inicial
                router.refresh(); // Atualiza os dados da sessão
            }}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-5 font-black text-white shadow-lg shadow-emerald-200 transition-all hover:scale-[1.03] active:scale-[0.98] uppercase tracking-widest"
          >
            ACESSAR MINHAS FERRAMENTAS
          </button>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO DO MODAL DE PAGAMENTO (QR CODE) ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-900">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">✕</button>

        <h2 className="text-2xl font-bold text-center mb-1">Pagamento Seguro</h2>
        <p className="text-center text-slate-500 mb-6 uppercase text-[10px] tracking-widest font-bold">Urbano Connect {planoSelecionado}</p>

        {!dadosPix ? (
          <div className="flex flex-col items-center py-6">
            <div className="mb-6 bg-emerald-50 p-4 rounded-full text-emerald-500 text-3xl font-bold italic">UC</div>
            <button onClick={gerarPix} disabled={loading} className="w-full rounded-xl bg-emerald-500 py-4 font-bold text-white shadow-lg hover:bg-emerald-600 disabled:bg-slate-300">
              {loading ? 'GERANDO PIX...' : 'GERAR QR CODE PIX'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 text-center">
            <div className="rounded-2xl border-2 border-slate-100 p-3 mb-5 bg-white shadow-inner">
              <img src={`data:image/png;base64,${dadosPix.qr_code_base64}`} alt="PIX" className="w-52 h-52 object-contain" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-tighter">Utilize o Pix Copia e Cola abaixo</p>
            <div className="flex w-full items-center gap-2 mb-8">
              <input type="text" readOnly value={dadosPix.qr_code_copia_e_cola} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[10px] font-mono text-slate-400 outline-none" />
              <button onClick={copiarCodigo} className={`rounded-lg px-4 py-3 text-xs font-black text-white transition-all ${copiado ? 'bg-emerald-500' : 'bg-slate-900'}`}>
                {copiado ? 'OK' : 'COPIAR'}
              </button>
            </div>
            <div className="flex items-center justify-center gap-3 text-emerald-600 bg-emerald-50 py-4 rounded-xl w-full border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-black tracking-widest">AGUARDANDO PAGAMENTO...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}