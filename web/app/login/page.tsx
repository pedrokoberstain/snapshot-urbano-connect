"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function LoginCadastro() {
  const router = useRouter();

  const [modo, setModo] = useState<"login" | "cadastro">("login");

  // Estados do Formulário Base
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [tipoConta, setTipoConta] = useState<"USUARIO" | "CORRETOR">("USUARIO");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");

  // Novos Estados (Endereço + CRECI)
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [creci, setCreci] = useState("");

  // --- NOVOS ESTADOS PARA O IBGE ---
  const [estadosIBGE, setEstadosIBGE] = useState<{ sigla: string; nome: string }[]>([]);
  const [cidadesIBGE, setCidadesIBGE] = useState<{ nome: string }[]>([]);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Aviso de sessão encerrada por inatividade/expiração (vindo do SessionGuard)
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("expirado") === "1") {
      setAviso("Sua sessão foi encerrada por inatividade. Faça login novamente para continuar.");
    }
  }, []);

  // ── LGPD: aceite dos Termos de Uso e Política de Privacidade ──
  const [aceitouTermos, setAceitouTermos] = useState(false);

  // ── BUSCA ESTADOS (IBGE) ────────────────────────────────
  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then(res => res.json())
      .then(data => setEstadosIBGE(data));
  }, []);

  // ── BUSCA CIDADES QUANDO O UF MUDA (IBGE) ────────────────
  useEffect(() => {
    if (!uf) {
      setCidadesIBGE([]);
      return;
    }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then(res => res.json())
      .then(data => setCidadesIBGE(data));
  }, [uf]);

  // Funções de Máscara Automática
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setCpf(v);
    }
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value;
    const apenasLetras = /^[a-zA-ZÀ-ÿ\s]*$/;
    if (apenasLetras.test(valorDigitado)) setNome(valorDigitado);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length <= 11) {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d)(\d{4})$/, "$1-$2");
      setTelefone(v);
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    let formattedCep = v;
    if (v.length > 5) formattedCep = v.replace(/^(\d{5})(\d)/, "$1-$2");
    setCep(formattedCep);

    if (v.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${v}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setRua(data.logradouro);
          setBairro(data.bairro);
          setUf(data.uf); // O UF muda aqui e dispara o useEffect das cidades
          setCidade(data.localidade); // A cidade muda aqui
          setErro("");
          document.getElementById("inputNumero")?.focus();
        } else {
          setErro("CEP não encontrado.");
        }
      } catch (error) {
        setErro("Erro de conexão ao buscar o CEP.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (modo === "cadastro" && tipoConta === "CORRETOR" && !creci.trim()) {
      setErro("Corretores precisam informar o número do CRECI para o cadastro.");
      return;
    }

    if (modo === "cadastro" && !aceitouTermos) {
      setErro("É necessário aceitar os Termos de Uso e a Política de Privacidade para criar a conta.");
      return;
    }

    if (modo === "cadastro" && (senha.length < 8 || !/[a-zA-Z]/.test(senha) || !/\d/.test(senha))) {
      setErro("A senha deve ter no mínimo 8 caracteres, com pelo menos uma letra e um número.");
      return;
    }

    if (modo === "cadastro" && senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      if (modo === "login") {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("token", data.token);
          localStorage.setItem("tipoUsuario", data.tipo);
          if (data.cidade) localStorage.setItem("cidadeUsuario", data.cidade);
          window.location.href = data.tipo === "USUARIO" ? "/" : "/admin";
        } else {
          setErro("E-mail ou senha incorretos.");
        }
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/registrar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome, email, senha,
            cpf: cpf.replace(/\D/g, ""),
            dataNascimento,
            telefone: telefone.replace(/\D/g, ""),
            tipo: tipoConta,
            cep: cep.replace(/\D/g, ""),
            rua, numero, complemento, bairro, cidade, uf,
            creci: tipoConta === "CORRETOR" ? creci : null,
            aceitouTermos,
          }),
        });

        if (res.ok) {
          setSucesso("Conta criada com sucesso! Faça login para continuar.");
          setModo("login");
          setSenha("");
          setConfirmarSenha("");
        } else {
          setErro("Erro ao criar conta. Verifique os dados ou se o e-mail já existe.");
        }
      }
    } catch (error) {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090f] flex flex-col justify-center items-center p-4 md:py-12 relative overflow-hidden font-sans">
      
      {/* Glows de Fundo AgroTech */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-500 rounded-full mix-blend-screen filter blur-[120px] opacity-10 pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-[#12121e]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10 relative z-10 my-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 outline-none group">
            <Image src="/logo-icon.png" alt="Urbano Connect" width={80} height={80} unoptimized className="group-hover:opacity-80 transition-opacity" />
            <span className="text-3xl font-extrabold text-white tracking-tighter group-hover:opacity-80 transition-opacity">
              urbano<span className="text-green-500">connect</span>
            </span>
          </Link>
          <p className="text-gray-400 font-medium">
            {modo === "login" ? "Bem-vindo de volta!" : "Crie sua conta na plataforma"}
          </p>
        </div>

        {/* Toggle Login/Cadastro */}
        <div className="flex bg-[#09090f] p-1.5 rounded-xl mb-8 relative max-w-lg mx-auto border border-white/5">
          <button 
            onClick={() => setModo("login")} 
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all outline-none ${modo === "login" ? "text-[#09090f] bg-green-400 shadow-md" : "text-gray-400 hover:text-gray-200"}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => setModo("cadastro")} 
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all outline-none ${modo === "cadastro" ? "text-[#09090f] bg-green-400 shadow-md" : "text-gray-400 hover:text-gray-200"}`}
          >
            Cadastrar
          </button>
        </div>

        {/* Alertas */}
        {aviso && (
          <div className="bg-amber-500/10 text-amber-400 text-sm font-bold p-4 rounded-xl mb-6 border border-amber-500/20 flex items-center gap-2">
            <span className="text-lg">⏱️</span> {aviso}
          </div>
        )}
        {erro && (
          <div className="bg-red-500/10 text-red-400 text-sm font-bold p-4 rounded-xl mb-6 border border-red-500/20 flex items-center gap-2">
            <span className="text-lg">⚠️</span> {erro}
          </div>
        )}
        {sucesso && (
          <div className="bg-green-500/10 text-green-400 text-sm font-bold p-4 rounded-xl mb-6 border border-green-500/20 flex items-center gap-2">
            <span className="text-lg">✅</span> {sucesso}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {modo === "cadastro" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
              
              {/* DADOS PESSOAIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-300 mb-2">Nome Completo</label>
                  <input type="text" required value={nome} onChange={handleNomeChange} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" placeholder="Seu nome" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">CPF</label>
                  <input type="text" required value={cpf} onChange={handleCpfChange} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" placeholder="000.000.000-00" maxLength={14} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Nascimento</label>
                  <input type="date" required value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} style={{ colorScheme: "dark" }} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-300 mb-2">Telefone / WhatsApp</label>
                  <input type="text" required value={telefone} onChange={handleTelefoneChange} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" placeholder="(00) 00000-0000" maxLength={15} />
                </div>
              </div>

              {/* TIPO DE CONTA */}
              <div className="pt-5 border-t border-white/5 mt-6">
                <label className="block text-sm font-bold text-gray-300 mb-3">Como deseja usar a plataforma?</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setTipoConta("USUARIO")} 
                    className={`cursor-pointer border-2 rounded-xl p-3.5 text-center transition-all ${tipoConta === "USUARIO" ? "border-green-500 bg-green-500/10" : "border-white/10 bg-[#09090f] hover:border-white/20"}`}
                  >
                    <p className={`text-sm font-bold ${tipoConta === "USUARIO" ? "text-green-400" : "text-gray-400"}`}>👤 Proprietário / Comprador</p>
                  </div>
                  <div 
                    onClick={() => setTipoConta("CORRETOR")} 
                    className={`cursor-pointer border-2 rounded-xl p-3.5 text-center transition-all ${tipoConta === "CORRETOR" ? "border-green-500 bg-green-500/10" : "border-white/10 bg-[#09090f] hover:border-white/20"}`}
                  >
                    <p className={`text-sm font-bold ${tipoConta === "CORRETOR" ? "text-green-400" : "text-gray-400"}`}>🏠 Corretor / Imobiliária</p>
                  </div>
                </div>
                {tipoConta === "CORRETOR" && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-black text-green-400 mb-2">Número do CRECI</label>
                    <input type="text" required value={creci} onChange={(e) => setCreci(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-green-500/5 border border-green-500/30 text-green-300 placeholder-green-700/50 focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none transition-all" placeholder="Ex: 12345-F" />
                  </div>
                )}
              </div>

              {/* ENDEREÇO COM IBGE INTEGRADO */}
              <div className="pt-5 border-t border-white/5 mt-6">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">Endereço de Cadastro</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">CEP</label>
                    <input type="text" required value={cep} onChange={handleCepChange} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all font-bold tracking-widest" placeholder="00000-000" maxLength={9} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-300 mb-2">Rua / Logradouro</label>
                    <input type="text" required value={rua} onChange={(e) => setRua(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" placeholder="Sua rua" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Número</label>
                    <input id="inputNumero" type="text" required value={numero} onChange={(e) => setNumero(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" placeholder="Ex: 123" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-300 mb-2">Complemento</label>
                    <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" placeholder="Apto, Fazenda, Lote (Opcional)" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Bairro</label>
                    <input type="text" required value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" placeholder="Seu bairro" />
                  </div>

                  {/* SELECT DE ESTADO (UF) */}
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">UF</label>
                    <select required value={uf} onChange={(e) => { setUf(e.target.value); setCidade(""); }} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all appearance-none cursor-pointer">
                      <option value="" className="text-gray-500">Estado</option>
                      {estadosIBGE.map(est => (
                        <option key={est.sigla} value={est.sigla} className="bg-[#12121e] text-white">{est.sigla}</option>
                      ))}
                    </select>
                  </div>

                  {/* SELECT DE CIDADE */}
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Cidade</label>
                    <select required value={cidade} onChange={(e) => setCidade(e.target.value)} disabled={!uf} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer">
                      <option value="" className="text-gray-500">Selecione...</option>
                      {cidadesIBGE.map(cid => (
                        <option key={cid.nome} value={cid.nome} className="bg-[#12121e] text-white">{cid.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* E-mail e Senha... */}
          <div className={`space-y-5 ${modo === "cadastro" ? "pt-5 border-t border-white/5 mt-6" : ""}`}>
            {modo === "cadastro" && <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">Dados de Acesso</h3>}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">E-mail</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" placeholder="exemplo@email.com" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-300">Senha</label>
                {modo === "login" && (
                  <Link href="/esqueci-senha" className="text-xs font-bold text-green-500 hover:text-green-400 transition-colors outline-none">
                    Esqueceu a senha?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input type={mostrarSenha ? "text" : "password"} required value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full px-4 py-3 pr-12 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" placeholder="••••••••" />
                <button type="button" onClick={() => setMostrarSenha(v => !v)} aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-300 transition-colors outline-none">
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {modo === "cadastro" && (
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Confirmar senha</label>
                <div className="relative">
                  <input type={mostrarConfirmar ? "text" : "password"} required value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} className="w-full px-4 py-3 pr-12 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all" placeholder="••••••••" />
                  <button type="button" onClick={() => setMostrarConfirmar(v => !v)} aria-label={mostrarConfirmar ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-300 transition-colors outline-none">
                    {mostrarConfirmar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmarSenha.length > 0 && senha !== confirmarSenha && (
                  <p className="text-xs text-red-400 mt-1.5">As senhas não coincidem.</p>
                )}
              </div>
            )}
          </div>

          {/* ── LGPD: aceite obrigatório no cadastro ── */}
          {modo === "cadastro" && (
            <label className="flex items-start gap-3 mt-6 cursor-pointer group">
              <input
                type="checkbox"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-white/20 bg-[#09090f] accent-green-500 cursor-pointer"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                Li e aceito os{" "}
                <Link href="/termos" target="_blank" className="text-green-500 underline hover:text-green-400">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link href="/privacidade" target="_blank" className="text-green-500 underline hover:text-green-400">
                  Política de Privacidade
                </Link>
                , e autorizo o tratamento dos meus dados pessoais conforme a LGPD.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center mt-6 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-[0.98] outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-[#09090f]"
          >
            {carregando ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processando...
              </span>
            ) : modo === "login" ? "Entrar na Plataforma" : "Criar Minha Conta"}
          </button>
        </form>
      </div>
    </main>
  );
}