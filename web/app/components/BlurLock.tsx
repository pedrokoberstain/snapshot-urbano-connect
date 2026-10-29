import Link from 'next/link';
import { LockClosedIcon } from '@heroicons/react/24/solid';

export function BlurLock() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700">
      <div className="text-center p-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-600 max-w-sm">
        <LockClosedIcon className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Conteúdo Exclusivo PRO</h3>
        <p className="text-slate-400 mb-6 text-sm">
          Assine o plano PRO para visualizar leads, estatísticas e ferramentas avançadas de mercado.
        </p>
        <Link 
          href="/planos"
          className="block w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 rounded-xl transition-all"
        >
          Ver Planos
        </Link>
      </div>
    </div>
  );
}