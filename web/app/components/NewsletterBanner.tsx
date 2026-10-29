"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export default function NewsletterBanner() {
  const [email, setEmail]       = useState("");
  const [nome, setNome]         = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "ok" | "error" | "duplicate">("idle");
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/inscrever`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nome }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setStatus("duplicate");
        setMensagem(data.mensagem);
      } else if (res.ok) {
        setStatus("ok");
        setMensagem(data.mensagem);
        setEmail("");
        setNome("");
      } else {
        setStatus("error");
        setMensagem("Erro ao realizar inscrição. Tente novamente.");
      }
    } catch {
      setStatus("error");
      setMensagem("Erro de conexão. Tente novamente.");
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e1a12] via-[#0f1f14] to-[#09120c] border border-green-900/40 p-8 md:p-10">
      {/* Glow decorativo */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
        {/* Texto */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
              <Mail className="w-4 h-4 text-green-400" />
            </span>
            <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em]">
              Newsletter · Urbano Connect
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
            Inteligência de mercado<br className="hidden md:block" /> direto no seu e-mail
          </h2>
          <p className="text-gray-400 text-sm mt-2 max-w-sm leading-relaxed">
            Análises semanais sobre agronegócio, imóveis rurais e economia de Mato Grosso. Sem spam.
          </p>
        </div>

        {/* Formulário */}
        <div className="flex-1 max-w-md w-full">
          {status === "ok" ? (
            <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-5">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-bold text-sm">{mensagem}</p>
                <p className="text-green-600 text-xs mt-1">Você receberá os próximos destaques da semana.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome (opcional)"
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30 transition-all"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="flex-shrink-0 flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-black font-bold px-5 py-3 rounded-xl text-sm transition-all active:scale-95"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Inscrever <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>

              {(status === "error" || status === "duplicate") && (
                <p className="text-xs text-yellow-400 font-medium">{mensagem}</p>
              )}

              <p className="text-[11px] text-gray-600">
                Ao se inscrever, você concorda em receber e-mails da Urbano Connect.
                Você pode cancelar a qualquer momento.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
