"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/esqueci-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setSucesso(true);
      } else {
        const texto = await res.text();
        setErro(texto || "E-mail não encontrado em nossa base de dados.");
      }
    } catch {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090f] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Fundo imersivo AgroTech */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-600 rounded-full mix-blend-screen filter blur-[120px] opacity-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-500 rounded-full mix-blend-screen filter blur-[120px] opacity-5" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#12121e]/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/10">
        
        <Link href="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-green-400 transition-colors mb-8 text-sm font-bold outline-none">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Login
        </Link>

        {sucesso ? (
          <div className="text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">E-mail Enviado!</h2>
            <p className="text-gray-400 text-sm font-medium mb-8 leading-relaxed">
              Se o e-mail <strong className="text-gray-200">{email}</strong> estiver cadastrado em nossa base, você receberá um link para redefinir sua senha em instantes.
            </p>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Não esqueça de checar a caixa de Spam.</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-white mb-2">Esqueceu a senha?</h2>
            <p className="text-gray-400 text-sm font-medium mb-8">
              Digite seu e-mail abaixo e enviaremos instruções para você criar uma nova senha de acesso.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Seu E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#09090f] border border-white/10 rounded-3xl pl-14 pr-6 py-5 text-white font-bold placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none" 
                    placeholder="exemplo@email.com"
                  />
                </div>
              </div>

              {erro && (
                <div className="p-4 rounded-xl flex items-center gap-3 text-sm font-bold border bg-red-500/10 text-red-400 border-red-500/20 animate-in zoom-in-95 duration-300">
                  <XCircle className="w-5 h-5 shrink-0" />
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando || !email}
                className="w-full bg-green-600 text-white font-black py-5 rounded-[2rem] hover:bg-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95 outline-none"
              >
                {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Link de Recuperação"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}