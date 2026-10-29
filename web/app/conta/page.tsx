"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  Lock, 
  ArrowLeft, 
  Phone, 
  Mail, 
  CreditCard, 
  Save, 
  Loader2,
  CheckCircle2,
  XCircle,
  Camera
} from "lucide-react";

export default function ContaUsuarioComum() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<"perfil" | "seguranca">("perfil");
  const [dados, setDados] = useState({ nome: "", email: "", cpf: "", telefone: "" });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [mensagem, setMensagem] = useState({ texto: "", tipo: "" });
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // ── LGPD: exportação de dados e exclusão de conta ──
  const [exportando, setExportando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState("");

  const buscarDadosDoPerfil = async () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (res.ok) {
        const usuarioBanco = await res.json();
        setDados({
          nome: usuarioBanco.nome || "",
          email: usuarioBanco.email || "",
          cpf: usuarioBanco.cpf || "",
          telefone: usuarioBanco.telefone || "",
        });
      }
    } catch (error) { console.error(error); } 
    finally { setCarregando(false); }
  };

  useEffect(() => { buscarDadosDoPerfil(); }, [router]);

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setMensagem({ texto: "", tipo: "" });
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ nome: dados.nome, telefone: dados.telefone })
      });
      if (res.ok) {
        setMensagem({ texto: "Perfil atualizado com sucesso!", tipo: "sucesso" });
        setTimeout(() => setMensagem({ texto: "", tipo: "" }), 4000);
      } else {
        setMensagem({ texto: "Erro ao atualizar perfil.", tipo: "erro" });
      }
    } catch (error) { setMensagem({ texto: "Erro de conexão.", tipo: "erro" }); }
    finally { setSalvando(false); }
  };

  const handleSalvarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      setMensagem({ texto: "As senhas não coincidem.", tipo: "erro" });
      return;
    }
    setSalvandoSenha(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me/senha`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha })
      });
      if (res.ok) {
        setMensagem({ texto: "Senha alterada!", tipo: "sucesso" });
        setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
      } else {
        setMensagem({ texto: "Verifique sua senha atual.", tipo: "erro" });
      }
    } catch (error) { setMensagem({ texto: "Erro de conexão.", tipo: "erro" }); }
    finally { setSalvandoSenha(false); }
  };

  // ── LGPD: baixa todos os dados pessoais em JSON (portabilidade — Art. 18) ──
  const handleExportarDados = async () => {
    setExportando(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me/dados`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "meus-dados-urbanoconnect.json";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setMensagem({ texto: "Erro ao exportar os dados.", tipo: "erro" });
      }
    } catch (error) { setMensagem({ texto: "Erro de conexão.", tipo: "erro" }); }
    finally { setExportando(false); }
  };

  // ── LGPD: exclusão (anonimização) definitiva da conta — Art. 18 ──
  const handleExcluirConta = async () => {
    if (!senhaExclusao) {
      setMensagem({ texto: "Informe sua senha para confirmar a exclusão.", tipo: "erro" });
      return;
    }
    setExcluindo(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ senha: senhaExclusao })
      });
      if (res.ok) {
        localStorage.clear();
        window.location.href = "/";
      } else {
        setMensagem({ texto: "Senha incorreta. A conta não foi excluída.", tipo: "erro" });
      }
    } catch (error) { setMensagem({ texto: "Erro de conexão.", tipo: "erro" }); }
    finally { setExcluindo(false); }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#09090f] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
          <span className="text-green-500 font-bold tracking-widest uppercase text-sm">Carregando perfil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090f] font-sans pb-20 relative overflow-hidden">
      
      {/* Glows de Fundo */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-green-600 rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none"></div>

      <main className="max-w-6xl mx-auto pt-10 px-4 relative z-10">
        
        {/* Breadcrumb & Title */}
        <div className="mb-10">
          <Link href="/" className="group inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors mb-4 outline-none">
            <div className="p-2 rounded-full bg-white/5 border border-white/5 group-hover:bg-green-500/10 group-hover:border-green-500/20 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold">Voltar</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Configurações da Conta</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-3 space-y-2">
            <button 
              onClick={() => setAbaAtiva("perfil")}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 outline-none ${
                abaAtiva === "perfil" 
                ? "bg-green-500/10 text-green-400 border border-green-500/20 translate-x-2" 
                : "text-gray-400 border border-transparent hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <User className="w-5 h-5" /> Meu Perfil
            </button>
            <button 
              onClick={() => setAbaAtiva("seguranca")}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 outline-none ${
                abaAtiva === "seguranca" 
                ? "bg-green-500/10 text-green-400 border border-green-500/20 translate-x-2" 
                : "text-gray-400 border border-transparent hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <Lock className="w-5 h-5" /> Segurança e Senha
            </button>
          </aside>

          {/* Main Content Area */}
          <section className="lg:col-span-9">
            <div className="bg-[#12121e]/80 backdrop-blur-md rounded-[2rem] shadow-2xl border border-white/5 p-8 md:p-12 transition-all duration-500">
              
              {abaAtiva === "perfil" ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Avatar Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-8 mb-12">
                    <div className="relative group cursor-pointer">
                      <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-green-600 to-emerald-400 flex items-center justify-center text-[#09090f] text-4xl font-black shadow-lg border-2 border-[#12121e] group-hover:scale-105 transition-transform">
                        {dados.nome.charAt(0).toUpperCase()}
                      </div>
                      <button className="absolute -bottom-2 -right-2 p-3 bg-[#09090f] rounded-2xl shadow-lg border border-white/10 hover:border-green-500/50 hover:bg-[#12121e] transition-colors text-green-400 outline-none">
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-2xl font-black text-white">{dados.nome}</h2>
                      <p className="text-gray-400 font-medium">{dados.email}</p>
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Conta Verificada
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSalvarPerfil} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                          <input 
                            type="text" 
                            value={dados.nome}
                            onChange={(e) => setDados({...dados, nome: e.target.value})}
                            className="w-full bg-[#09090f] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" 
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Telefone</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                          <input 
                            type="text" 
                            value={dados.telefone}
                            onChange={(e) => setDados({...dados, telefone: e.target.value})}
                            className="w-full bg-[#09090f] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" 
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] ml-1">E-mail (Permanente)</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                          <input type="email" value={dados.email} disabled className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-gray-500 font-bold cursor-not-allowed" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] ml-1">CPF (Permanente)</label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                          <input type="text" value={dados.cpf} disabled className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-gray-500 font-bold cursor-not-allowed" />
                        </div>
                      </div>
                    </div>

                    {mensagem.texto && (
                      <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300 border ${mensagem.tipo === "sucesso" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        {mensagem.tipo === "sucesso" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="font-bold text-sm">{mensagem.texto}</span>
                      </div>
                    )}

                    <div className="pt-8 border-t border-white/5 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={salvando}
                        className="bg-green-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all disabled:opacity-50 flex items-center gap-2 group outline-none active:scale-95"
                      >
                        {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="mb-10">
                    <h2 className="text-2xl font-black text-white">Segurança da Conta</h2>
                    <p className="text-gray-400 font-medium mt-1">Gerencie seu acesso e proteja seus dados.</p>
                  </div>
                  
                  <form onSubmit={handleSalvarSenha} className="max-w-md space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Senha Atual</label>
                      <input 
                        type="password" 
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        className="w-full bg-[#09090f] border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" 
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Nova Senha</label>
                      <input 
                        type="password" 
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="w-full bg-[#09090f] border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" 
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Confirmar Senha</label>
                      <input 
                        type="password" 
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        className="w-full bg-[#09090f] border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" 
                        placeholder="••••••••"
                      />
                    </div>

                    {mensagem.texto && (
                      <div className={`p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95 duration-300 border ${mensagem.tipo === "sucesso" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        {mensagem.tipo === "sucesso" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="font-bold text-sm">{mensagem.texto}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={salvandoSenha}
                      className="w-full bg-[#09090f] border border-green-500/30 text-green-400 hover:bg-green-500/10 font-black py-4 rounded-2xl transition-all disabled:opacity-50 mt-4 active:scale-95 outline-none"
                    >
                      {salvandoSenha ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Atualizar Credenciais"}
                    </button>
                  </form>

                  {/* ── LGPD: Privacidade e Dados Pessoais ── */}
                  <div className="max-w-md mt-12 pt-10 border-t border-white/5">
                    <h3 className="text-lg font-black text-white mb-1">Privacidade e Dados (LGPD)</h3>
                    <p className="text-gray-500 text-sm font-medium mb-6">
                      Você tem direito de acessar, exportar e excluir os seus dados pessoais.
                    </p>

                    <button
                      onClick={handleExportarDados}
                      disabled={exportando}
                      className="w-full bg-[#09090f] border border-white/10 text-gray-300 hover:border-green-500/30 hover:text-green-400 font-bold py-4 rounded-2xl transition-all disabled:opacity-50 active:scale-95 outline-none mb-4"
                    >
                      {exportando ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "📦 Baixar meus dados (JSON)"}
                    </button>

                    {!confirmandoExclusao ? (
                      <button
                        onClick={() => setConfirmandoExclusao(true)}
                        className="w-full bg-[#09090f] border border-red-500/20 text-red-400 hover:bg-red-500/10 font-bold py-4 rounded-2xl transition-all active:scale-95 outline-none"
                      >
                        Excluir minha conta
                      </button>
                    ) : (
                      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
                        <p className="text-red-400 text-sm font-bold">
                          ⚠️ Esta ação é irreversível. Seus dados pessoais serão anonimizados
                          permanentemente. Confirme a sua senha para prosseguir:
                        </p>
                        <input
                          type="password"
                          value={senhaExclusao}
                          onChange={(e) => setSenhaExclusao(e.target.value)}
                          className="w-full bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder-gray-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                          placeholder="Sua senha atual"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setConfirmandoExclusao(false); setSenhaExclusao(""); }}
                            className="flex-1 bg-[#09090f] border border-white/10 text-gray-400 font-bold py-3 rounded-xl hover:text-white transition-all outline-none"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleExcluirConta}
                            disabled={excluindo}
                            className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-500 transition-all disabled:opacity-50 outline-none"
                          >
                            {excluindo ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Excluir definitivamente"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}