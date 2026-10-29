"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Loader2, CheckCircle2, XCircle } from "lucide-react";

const regras = [
  { id: "min8",       label: "Mínimo 8 caracteres",        test: (s: string) => s.length >= 8 },
  { id: "maiuscula",  label: "Uma letra maiúscula",         test: (s: string) => /[A-Z]/.test(s) },
  { id: "minuscula",  label: "Uma letra minúscula",         test: (s: string) => /[a-z]/.test(s) },
  { id: "numero",     label: "Um número",                   test: (s: string) => /[0-9]/.test(s) },
  { id: "especial",   label: "Um caractere especial (!@#$)", test: (s: string) => /[^A-Za-z0-9]/.test(s) },
];

function ChecklistSenha({ senha }: { senha: string }) {
  if (!senha) return null;
  return (
    <ul className="space-y-1 mt-2">
      {regras.map(r => {
        const ok = r.test(senha);
        return (
          <li key={r.id} className={`flex items-center gap-2 text-xs font-semibold transition-colors duration-200 ${ok ? "text-green-400" : "text-gray-500"}`}>
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all duration-200 ${ok ? "bg-green-500 border-green-500" : "border-gray-600"}`}>
              {ok && <CheckCircle2 className="w-2.5 h-2.5 text-black" />}
            </span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

function FormularioRedefinir() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState({ texto: "", tipo: "" });

  const senhaValida = regras.every(r => r.test(novaSenha));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem({ texto: "", tipo: "" });

    if (!token) {
      setMensagem({ texto: "Token de recuperação inválido ou ausente.", tipo: "erro" });
      return;
    }

    if (!senhaValida) {
      setMensagem({ texto: "A senha não atende todos os requisitos.", tipo: "erro" });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagem({ texto: "As senhas não coincidem.", tipo: "erro" });
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/redefinir-senha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha })
      });

      const texto = await res.text();

      if (res.ok) {
        setMensagem({ texto: "Senha redefinida com sucesso! Redirecionando...", tipo: "sucesso" });
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setMensagem({ texto: texto || "Link expirado ou inválido.", tipo: "erro" });
      }
    } catch {
      setMensagem({ texto: "Erro de conexão com o servidor.", tipo: "erro" });
    } finally {
      setSalvando(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Link Inválido</h2>
        <p className="text-gray-400 text-sm font-medium">O link de recuperação está incompleto ou ausente.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-black text-white mb-2">Nova Senha</h2>
      <p className="text-gray-400 text-sm font-medium mb-8">
        Crie uma nova senha forte para acessar sua conta na Urbano Connect.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nova Senha</label>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="password"
              required
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="w-full bg-[#09090f] border border-white/10 rounded-3xl pl-14 pr-6 py-5 text-white font-bold placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
              placeholder="••••••••"
            />
          </div>
          <ChecklistSenha senha={novaSenha} />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="password"
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className={`w-full bg-[#09090f] border rounded-3xl pl-14 pr-6 py-5 text-white font-bold placeholder-gray-600 focus:ring-1 transition-all outline-none ${
                confirmarSenha && confirmarSenha !== novaSenha
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-white/10 focus:border-green-500 focus:ring-green-500"
              }`}
              placeholder="••••••••"
            />
          </div>
          {confirmarSenha && confirmarSenha !== novaSenha && (
            <p className="text-xs text-red-400 font-semibold ml-1">As senhas não coincidem.</p>
          )}
        </div>

        {mensagem.texto && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold border animate-in zoom-in-95 duration-300 ${mensagem.tipo === "sucesso" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
            {mensagem.tipo === "sucesso" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {mensagem.texto}
          </div>
        )}

        <button
          type="submit"
          disabled={salvando || !senhaValida || novaSenha !== confirmarSenha}
          className="w-full bg-green-600 text-white font-black py-5 rounded-[2rem] hover:bg-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95 outline-none"
        >
          {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar e Entrar"}
        </button>
      </form>
    </div>
  );
}

// O componente principal envolve o formulário em um Suspense
export default function RedefinirSenhaPage() {
  return (
    <main className="min-h-screen bg-[#09090f] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Fundo imersivo AgroTech */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-600 rounded-full mix-blend-screen filter blur-[120px] opacity-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-500 rounded-full mix-blend-screen filter blur-[120px] opacity-5" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#12121e]/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/10">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-green-500" />
            <span className="text-green-500 font-bold tracking-widest uppercase text-xs">Verificando...</span>
          </div>
        }>
          <FormularioRedefinir />
        </Suspense>
      </div>
    </main>
  );
}