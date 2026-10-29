'use client';
import React from 'react';
import { Rocket, Clock } from 'lucide-react'; // Ou use ícones simples se não tiver lucide-react

interface Props {
  status: string;
  onReabrirModal: () => void;
}

export default function BannerStatusPagamento({ status, onReabrirModal }: Props) {
  if (status !== 'pending') return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-100 px-4 py-3 animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-amber-800">
          <Clock className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium">
            Identificamos um pagamento PIX pendente para sua conta PRO.
          </span>
        </div>
        
        <button 
          onClick={onReabrirModal}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm shadow-amber-200 uppercase tracking-wider"
        >
          <Rocket className="w-3 h-3" />
          Ver QR Code novamente
        </button>
      </div>
    </div>
  );
}