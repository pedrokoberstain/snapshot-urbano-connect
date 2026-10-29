"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; 
import FormularioImovel from "@/app/components/FormularioImovel";
import { useAuth } from '@/lib/hooks/useAuth';
import { BlurLock } from '@/app/components/BlurLock';

export default function PaginaEditarImovel() {
  const { isPro, loading: authLoading } = useAuth();
  const params = useParams(); 
  const id = params?.id as string; 

  const [dadosDoBanco, setDadosDoBanco] = useState(null);

  useEffect(() => {
    if (!id || !isPro) return; // Só busca dados se for PRO

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/imoveis/${id}`).then(res => {
        if (!res.ok) throw new Error("Erro ao buscar dados do imóvel");
        return res.json();
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/imoveis/${id}/rural`).then(res => {
        return res.ok && res.status !== 204 ? res.json() : null;
      })
    ])
    .then(([imovelData, ruralData]) => {
      setDadosDoBanco({ ...imovelData, rural: ruralData || {} });
    })
    .catch(err => console.error("Falha no fetch:", err));

  }, [id, isPro]);

  if (authLoading) return null;

  // Se não for PRO, mostra o bloqueio imediatamente
  if (!isPro) {
    return (
      <div className="relative min-h-screen">
        <BlurLock />
        <div className="blur-md pointer-events-none p-10">
           <h1 className="text-2xl font-bold text-white">Editar Imóvel</h1>
           <div className="h-96 bg-slate-800 rounded-xl mt-4"></div>
        </div>
      </div>
    );
  }

  if (!dadosDoBanco) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="w-10 h-10 border-4 border-[#b50a6b] border-t-transparent rounded-full animate-spin"></span>
          <p className="font-bold text-gray-500">Buscando informações do imóvel...</p>
        </div>
      </div>
    );
  }

  return <FormularioImovel isEdit={true} imovelId={id} dadosIniciais={dadosDoBanco} />;
}