"use client";

import { useAuth } from '@/lib/hooks/useAuth';
import { BlurLock } from '../../components/BlurLock';
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  User, 
  MessageCircle,
  ExternalLink,
  Lock
} from "lucide-react";

export default function PainelLeads() {
  const { user, isPro, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    // Só buscamos os leads se o usuário for PRO para evitar erros 403 desnecessários
    if (isPro) {
      const token = localStorage.getItem("token");
      
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
      .then(async (res) => {
        if (!res.ok || res.status === 204) return [];
        const text = await res.text();
        return text ? JSON.parse(text) : [];
      })
      .then(data => {
        setLeads(data);
        setLoadingLeads(false);
      })
      .catch(err => {
        console.error("Erro ao carregar leads:", err);
        setLeads([]);
        setLoadingLeads(false);
      });
    } else {
      // Se não for PRO, paramos o loading para mostrar o BlurLock
      setLoadingLeads(false);
    }
  }, [isPro]);

  const abrirWhatsApp = (lead: any) => {
    if (!isPro) return; // Segurança extra no clique
    const telefoneLimpo = lead.telefone.replace(/\D/g, "");
    const nomeImovel = lead.tituloImovel || lead.imovelInteresse?.titulo || "seu imóvel";
    const mensagem = `Olá ${lead.nome}! Sou corretor da Urbano Connect. Recebi seu interesse no imóvel "${nomeImovel}". Como posso te ajudar?`;
    window.open(`https://api.whatsapp.com/send?phone=55${telefoneLimpo}&text=${encodeURIComponent(mensagem)}`, "_blank");
  };

  // Estado de carregamento inicial (Autenticação)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090f]">
        <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090f] font-sans pb-20 relative overflow-hidden">
      
      {/* Glows de Fundo AgroTech */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-green-600 rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto p-4 md:p-10 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-white tracking-tight">Gestão de Leads</h1>
              {!isPro && <Lock className="w-5 h-5 text-yellow-500" />}
            </div>
            <p className="text-gray-400 font-medium mt-1">Veja quem tem interesse nas suas propriedades e feche negócios.</p>
          </div>
          
          <div className="bg-[#12121e]/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg border border-white/10 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total de Contatos</p>
              <p className="text-2xl font-black text-green-400">{isPro ? leads.length : '--'}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 border border-green-500/20">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO COM BLOQUEIO */}
        <div className="relative">
          
          {/* O BLOQUEIO: Só aparece se não for PRO */}
          {!isPro && <BlurLock />}

          {/* LISTA DE LEADS (Com Blur se não for PRO) */}
          <div className={`grid grid-cols-1 gap-5 ${!isPro ? 'blur-md select-none pointer-events-none' : ''}`}>
            {loadingLeads ? (
               <div className="text-center py-20 text-gray-500">Buscando informações do banco...</div>
            ) : leads.length === 0 ? (
              <div className="bg-[#12121e] rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center">
                <MessageSquare className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-bold text-gray-300">Nenhum lead encontrado</h3>
                <p className="text-gray-500 text-sm">Seus contatos aparecerão aqui.</p>
              </div>
            ) : (
              leads.map((lead) => {
                const imovelId = lead.imovelId || lead.imovelInteresse?.id;
                return (
                  <div key={lead.id} className="bg-[#12121e]/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-lg hover:border-green-500/30 transition-all group">
                    <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
                      
                      <div className="lg:col-span-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-green-400 transition-colors border border-white/5">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-100 text-lg leading-tight">{lead.nome}</h4>
                          <div className="flex flex-col gap-1 mt-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {lead.email}</span>
                            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {lead.telefone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-5">
                        <div className="bg-[#09090f] rounded-2xl p-4 text-sm text-gray-300 italic border border-white/5">
                          "{lead.mensagem}"
                        </div>
                      </div>

                      <div className="lg:col-span-3 flex justify-end gap-3">
                        <Link 
                          href={`/imovel/${imovelId}`}
                          className="flex items-center justify-center gap-2 bg-white/5 text-gray-300 font-bold text-xs uppercase px-5 py-4 rounded-2xl hover:bg-white/10 transition-all"
                          target="_blank"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Anúncio
                        </Link>

                        <button 
                          onClick={() => abrirWhatsApp(lead)}
                          className="flex-1 bg-[#25D366] text-[#09090f] font-black text-xs uppercase px-6 py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-5 h-5" />
                          Responder
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}