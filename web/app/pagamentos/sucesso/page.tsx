"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function SucessoPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processando' | 'sucesso'>('processando');

  useEffect(() => {
    const sincronizarUsuario = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Simulamos um pequeno delay para dar tempo do Webhook processar no Back-end
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Fazemos uma chamada para o seu endpoint de perfil para pegar o plano atualizado
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Atualiza o localStorage com os novos dados (agora com plano: 'PRO')
          localStorage.setItem('user', JSON.stringify(data));
          setStatus('sucesso');
        }
      } catch (error) {
        console.error("Erro ao sincronizar dados:", error);
        // Mesmo com erro, após algum tempo mandamos para a dashboard
        setStatus('sucesso');
      }
    };

    sincronizarUsuario();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 font-sans">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl p-10 border border-slate-700 text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <Image src="/logo-icon.png" alt="Urbano Connect" width={88} height={88} unoptimized className="drop-shadow-[0_0_16px_rgba(234,88,12,0.5)]" />
        </div>
        
        {status === 'processando' ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
            </div>
            <h2 className="text-2xl font-bold text-white">Finalizando sua assinatura...</h2>
            <p className="text-slate-400">
              Estamos preparando seu acesso ao Urbano Connect PRO. Um momento!
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center">
              <CheckCircleIcon className="h-20 w-20 text-emerald-500" />
            </div>
            
            <h2 className="text-3xl font-extrabold text-white">Assinatura Ativada!</h2>
            
            <p className="text-slate-400 text-lg">
              Parabéns! Você agora tem acesso total às ferramentas avançadas do <span className="text-emerald-400 font-bold">Urbano Connect PRO</span>.
            </p>

            <div className="bg-slate-700/50 rounded-2xl p-4 border border-slate-600">
              <p className="text-sm text-slate-300 italic">
                "Seus dados rurais agora estão em outro nível."
              </p>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="group w-full bg-emerald-500 text-slate-900 font-extrabold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <span>Ir para Dashboard</span>
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}