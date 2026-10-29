"use client";

import FormularioImovel from "@/app/components/FormularioImovel";
import { useAuth } from '@/lib/hooks/useAuth';
import { BlurLock } from '@/app/components/BlurLock';

export default function PaginaNovoImovel() {
  const { isPro, loading } = useAuth();

  if (loading) return null; // Evita piscar conteúdo

  return (
    <div className="relative min-h-screen">
      {/* Se não for PRO, bloqueia a criação */}
      {!isPro && <BlurLock />}
      
      <div className={!isPro ? 'blur-md pointer-events-none select-none' : ''}>
        <FormularioImovel />
      </div>
    </div>
  );
}