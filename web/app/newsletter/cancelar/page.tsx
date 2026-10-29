"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function CancelarContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/cancelar?token=${encodeURIComponent(token)}`)
      .then(r => r.ok ? setStatus("ok") : setStatus("error"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <main className="min-h-screen bg-[#09090f] flex flex-col items-center justify-center p-6">
      <Link href="/" className="text-2xl font-black tracking-tighter text-white mb-12">
        urbano<span className="text-green-500">connect</span>
      </Link>

      <div className="bg-[#12121e] border border-white/5 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-green-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-300 font-medium">Processando...</p>
          </>
        )}

        {status === "ok" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-xl font-black text-white mb-2">Inscrição cancelada</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Você foi removido da nossa lista de newsletter. Não enviaremos mais e-mails para este endereço.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl text-sm transition-all"
            >
              Voltar para o site
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-black text-white mb-2">Link inválido</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Este link de cancelamento é inválido ou já foi utilizado.
            </p>
            <Link
              href="/"
              className="inline-block mt-6 text-green-400 hover:text-green-300 font-bold text-sm transition-all"
            >
              Voltar para o site
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function CancelarNewsletter() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#09090f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
      </main>
    }>
      <CancelarContent />
    </Suspense>
  );
}
