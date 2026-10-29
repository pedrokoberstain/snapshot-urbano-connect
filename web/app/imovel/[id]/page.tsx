"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Maximize, CheckCircle2, ArrowLeft, Send,
  Tractor, Droplets, Truck, FileCheck, Leaf, BarChart3,
  BedDouble, Bath, CarFront, AlertCircle
} from "lucide-react";

// ── Helpers visuais ────────────────────────────────────────
function BadgeOk({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border ${
      ok
        ? "bg-green-500/10 border-green-500/20 text-green-400"
        : "bg-white/5 border-white/10 text-gray-500"
    }`}>
      <span className={`w-2 h-2 rounded-full shadow-sm ${ok ? "bg-green-400 shadow-green-500/50" : "bg-gray-600"}`} />
      {label}
    </div>
  );
}

function Escala({ valor, max = 5 }: { valor: number; max?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full ${
            i < valor ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

function InfoCard({ label, value, unit }: { label: string; value: any; unit?: string }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 transition-all hover:bg-white/10">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-gray-100 font-black text-lg">
        {value}{unit && <span className="text-sm font-medium text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function SecaoRural({ titulo, icone, cor, children }: {
  titulo: string;
  icone: React.ReactNode;
  cor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 text-sm font-black uppercase tracking-wider ${cor}`}>
        {icone}
        {titulo}
      </div>
      {children}
    </div>
  );
}

export default function DetalhesImovel() {
  const params = useParams();
  const id = params.id;

  const [imovel, setImovel] = useState<any>(null);
  
  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState("");
  
  // Estados de Controle
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroValidacao, setErroValidacao] = useState(""); // NOVO: Controle de erro visual
  const [fotoDestaque, setFotoDestaque] = useState<string>("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/imoveis/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setImovel(data);
        setMensagem(`Olá! Tenho interesse no imóvel "${data.titulo}". Pode me passar mais informações?`);
        if (data.imagemPrincipal) setFotoDestaque(data.imagemPrincipal);
        else if (data.galeria?.length > 0) setFotoDestaque(data.galeria[0]);
      })
      .catch((err) => console.error("Erro ao buscar imóvel:", err));
  }, [id]);

  // ── MÁSCARA DE TELEFONE (DDD) 99999-9999 ──
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value;
    
    // Remove tudo que não for número
    valor = valor.replace(/\D/g, "");
    
    // Limita a 11 números (DDD + 9 dígitos)
    if (valor.length > 11) valor = valor.slice(0, 11);
    
    // Aplica a máscara: (99) 99999-9999
    if (valor.length > 2) {
      valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    }
    if (valor.length > 9) {
      valor = `${valor.slice(0, 10)}-${valor.slice(10)}`;
    }
    
    setTelefone(valor);
    
    // Se o usuário começar a corrigir, limpa a mensagem de erro
    if (erroValidacao) setErroValidacao("");
  };

  const enviarLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroValidacao("");

    // ── VALIDAÇÃO ANTES DO ENVIO ──
    const numeroLimpo = telefone.replace(/\D/g, "");
    
    // Verifica se o nome tem pelo menos sobrenome
    if (nome.trim().split(" ").length < 2) {
      setErroValidacao("Por favor, insira nome e sobrenome.");
      return;
    }

    // Verifica se o telefone tem DDD + pelo menos 8 dígitos (10 total)
    if (numeroLimpo.length < 10) {
      setErroValidacao("Telefone incompleto. Digite com DDD.");
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, telefone: numeroLimpo, mensagem, imovelId: Number(id) }),
      });
      
      if (response.ok) {
        setEnviado(true);
        setNome(""); 
        setEmail(""); 
        setTelefone("");
      } else {
        setErroValidacao("Ops! Verifique os campos e tente novamente.");
      }
    } catch (error) {
      setErroValidacao("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (!imovel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090f] gap-4 font-sans">
        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
        <p className="text-green-500 font-bold tracking-widest uppercase text-sm animate-pulse">Preparando imóvel...</p>
      </div>
    );
  }

  const rural = imovel.dadosRurais;
  const isRural = imovel.tipo === "RURAL" && rural;

  return (
    <main className="min-h-screen bg-[#09090f] font-sans pb-20 relative overflow-hidden">

      {/* Glows de Fundo */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-green-600 rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>

      {/* HEADER */}
      <header className="bg-[#12121e]/90 backdrop-blur-md border-b border-white/5 h-20 flex items-center sticky top-0 z-40 shadow-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-gray-400 hover:text-green-400 flex items-center gap-2 transition-colors outline-none">
            <ArrowLeft className="w-4 h-4" /> Voltar à vitrine
          </Link>
          <div className="text-2xl font-black text-white tracking-tighter">
            urbano<span className="text-green-500">connect</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      {/* CONTAINER WIDE */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12 relative z-10">

        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div className="flex-1">
            <span className="bg-green-500/10 text-green-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest mb-4 inline-block border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
              {imovel.tipo}
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight leading-tight">
              {imovel.titulo}
            </h1>
            <p className="text-gray-400 font-medium flex items-center gap-2 text-lg">
              <MapPin className="w-6 h-6 text-green-500" />
              {imovel.bairro}{imovel.bairro ? ", " : ""}{imovel.cidade}
            </p>
          </div>
          <div className="w-full md:w-auto md:text-right bg-[#12121e]/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/10 shrink-0">
            <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1">
              Valor do Investimento
            </p>
            <p className="text-4xl lg:text-5xl font-black text-green-400">
              R$ {imovel.preco?.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {/* LAYOUT MODERNO */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* COLUNA PRINCIPAL */}
          <div className="flex-1 min-w-0 space-y-8 lg:space-y-12">
            {/* GALERIA */}
            <div className="flex flex-col gap-3">
              <div className="w-full h-[350px] md:h-[500px] lg:h-[650px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 bg-[#12121e] group relative">
                <img
                  src={fotoDestaque || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&w=1200&q=80"}
                  alt={imovel.titulo}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090f]/60 to-transparent opacity-60"></div>
              </div>
              {imovel.galeria?.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x custom-scrollbar">
                  {imovel.galeria.map((fotoUrl: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setFotoDestaque(fotoUrl)}
                      className={`flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 transition-all duration-300 snap-center outline-none ${
                        fotoDestaque === fotoUrl
                          ? "border-green-500 opacity-100 shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-100"
                          : "border-transparent opacity-50 hover:opacity-100 scale-95 hover:scale-100"
                      }`}
                    >
                      <img src={fotoUrl} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DETALHES BÁSICOS */}
            <div className="bg-[#12121e]/80 backdrop-blur-md p-8 lg:p-10 rounded-[2.5rem] shadow-xl border border-white/5">
              <h2 className="text-2xl font-black text-white mb-8">Detalhes do Imóvel</h2>
              
              <div className="flex flex-wrap gap-4 mb-10">
                {imovel.areaTotal && (
                  <div className="bg-[#09090f] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px] flex-1">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                      <Maximize className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Área Total</span>
                    <span className="text-lg font-black text-white">{imovel.areaTotal} {isRural ? "ha" : "m²"}</span>
                  </div>
                )}

                {imovel.quartos > 0 && (
                  <div className="bg-[#09090f] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px] flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                      <BedDouble className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Quartos</span>
                    <span className="text-lg font-black text-white">{imovel.quartos}</span>
                  </div>
                )}

                {imovel.banheiros > 0 && (
                  <div className="bg-[#09090f] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px] flex-1">
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mb-3">
                      <Bath className="w-5 h-5 text-teal-400" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Banheiros</span>
                    <span className="text-lg font-black text-white">{imovel.banheiros}</span>
                  </div>
                )}

                {imovel.vagasGaragem > 0 && (
                  <div className="bg-[#09090f] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px] flex-1">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-3">
                      <CarFront className="w-5 h-5 text-orange-400" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Vagas</span>
                    <span className="text-lg font-black text-white">{imovel.vagasGaragem}</span>
                  </div>
                )}

                {isRural && rural.areaUtil && (
                  <div className="bg-[#09090f] border border-green-500/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px] flex-1">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                      <Leaf className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Área Útil</span>
                    <span className="font-black text-lg text-green-400">{rural.areaUtil} ha</span>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="font-bold text-white mb-4 text-xl">Sobre este imóvel</h3>
                <p className="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                  {imovel.descricao || "Nenhuma descrição detalhada foi informada para este anúncio."}
                </p>
              </div>
            </div>

            {/* ── LAUDO RURAL ─────────────────────────────── */}
            {isRural && (
              <div className="bg-[#12121e]/80 backdrop-blur-md p-8 lg:p-10 rounded-[2.5rem] shadow-xl border-2 border-green-500/20 space-y-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full filter blur-[80px]"></div>
                <div className="flex items-center gap-5 border-b border-white/10 pb-8 relative z-10">
                  <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                    <Tractor className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Laudo Técnico Rural</h2>
                    <p className="text-green-500/80 mt-1 font-bold text-sm tracking-wide uppercase">Dados técnicos para análise de investimento</p>
                  </div>
                </div>

                {(rural.tipoSolo || rural.percentualArgila || rural.fertilidadeSolo) && (
                  <SecaoRural titulo="Solo" cor="text-green-400" icone={<Leaf className="w-5 h-5" />}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5 relative z-10">
                      {rural.tipoSolo && <InfoCard label="Tipo de Solo" value={rural.tipoSolo} />}
                      {rural.percentualArgila && <InfoCard label="Teor de Argila" value={rural.percentualArgila} unit="%" />}
                      {rural.nivelNutrientes && <InfoCard label="Nível de Nutrientes" value={rural.nivelNutrientes} unit="mg/dm³" />}
                      {rural.necessidadeCorrecaoSolo && <InfoCard label="Correção Necessária" value={rural.necessidadeCorrecaoSolo} unit="ton/ha" />}
                    </div>
                  </SecaoRural>
                )}
                
                {(rural.usoAtual || rural.usoPotencial || rural.areaReservaLegal) && (
                  <SecaoRural titulo="Uso da Terra" cor="text-green-400" icone={<BarChart3 className="w-5 h-5" />}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5 relative z-10">
                      {rural.areaUtil && <InfoCard label="Área Útil" value={rural.areaUtil} unit="ha" />}
                      {rural.areaReservaLegal && <InfoCard label="Reserva Legal" value={rural.areaReservaLegal} unit="ha" />}
                      {rural.areaApp && <InfoCard label="APP" value={rural.areaApp} unit="ha" />}
                      {rural.usoAtual && <InfoCard label="Uso Atual" value={rural.usoAtual} />}
                      {rural.usoPotencial && <InfoCard label="Uso Potencial" value={rural.usoPotencial} />}
                    </div>
                  </SecaoRural>
                )}

                {(rural.disponibilidadeAgua !== null || rural.tipoFonteAgua) && (
                  <SecaoRural titulo="Recursos Hídricos" cor="text-blue-400" icone={<Droplets className="w-5 h-5" />}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5 relative z-10">
                      <BadgeOk ok={rural.disponibilidadeAgua} label="Disponível" />
                      <BadgeOk ok={rural.perenidadeAgua} label="Água Perene" />
                      <BadgeOk ok={rural.irrigacao} label="Irrigação" />
                    </div>
                  </SecaoRural>
                )}
              </div>
            )}
          </div>

          {/* FORMULÁRIO LATERAL (LEAD) */}
          <aside className="w-full lg:w-[400px] xl:w-[420px] shrink-0">
            <div className="bg-[#12121e]/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/10 sticky top-28">
              {enviado ? (
                <div className="py-10 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                    <CheckCircle2 className="w-12 h-12 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Mensagem Enviada!</h3>
                  <p className="text-gray-400 font-medium mb-8">
                    O corretor responsável entrará em contato com você o mais rápido possível.
                  </p>
                  <button
                    onClick={() => setEnviado(false)}
                    className="w-full border-2 border-white/10 text-gray-300 font-bold px-6 py-4 rounded-full hover:bg-white/5 hover:text-white transition-colors outline-none"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <div className="animate-in fade-in duration-300">
                  <h3 className="text-2xl font-black text-white mb-2">
                    {isRural ? "Interessado na fazenda?" : "Gostou do imóvel?"}
                  </h3>
                  <p className="text-gray-400 font-medium mb-6">
                    Fale com o corretor agora mesmo e agende uma visita.
                  </p>

                  <form onSubmit={enviarLead} className="space-y-4">
                    <input 
                      required 
                      type="text" 
                      placeholder="Seu nome completo" 
                      value={nome}
                      onChange={(e) => {
                        setNome(e.target.value);
                        if (erroValidacao) setErroValidacao("");
                      }}
                      className="w-full px-5 py-4 bg-[#09090f] border border-white/10 rounded-xl text-white font-medium outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-600" 
                    />
                    <input 
                      required 
                      type="email" 
                      placeholder="Seu e-mail principal" 
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (erroValidacao) setErroValidacao("");
                      }}
                      className="w-full px-5 py-4 bg-[#09090f] border border-white/10 rounded-xl text-white font-medium outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-600" 
                    />
                    
                    {/* CAMPO DE TELEFONE COM MÁSCARA */}
                    <input 
                      required 
                      type="tel" 
                      placeholder="WhatsApp ex: (65) 99999-9999" 
                      value={telefone}
                      onChange={handleTelefoneChange}
                      maxLength={15} // Segurança extra (15 caracteres é o limite da formatação)
                      className="w-full px-5 py-4 bg-[#09090f] border border-white/10 rounded-xl text-white font-medium outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-600" 
                    />

                    <textarea 
                      required 
                      placeholder="Sua mensagem" 
                      rows={4} 
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      className="w-full px-5 py-4 bg-[#09090f] border border-white/10 rounded-xl text-white font-medium outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none placeholder-gray-600" 
                    />
                    
                    {/* AVISO DE ERRO VISUAL */}
                    {erroValidacao && (
                      <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-lg text-sm font-bold border border-red-500/20 animate-in slide-in-from-top-1">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {erroValidacao}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={enviando}
                      className="w-full bg-green-600 text-white font-black uppercase tracking-widest px-6 py-4 rounded-xl hover:bg-green-500 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 outline-none active:scale-95"
                    >
                      {enviando
                        ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Send className="w-5 h-5" /> Enviar Mensagem</>
                      }
                    </button>

                    {/* ── LGPD: aviso de privacidade no envio do lead ── */}
                    <p className="text-[11px] text-gray-500 leading-relaxed text-center">
                      Ao enviar, você concorda que seus dados de contato sejam compartilhados
                      com o corretor responsável por este imóvel, conforme a nossa{" "}
                      <a href="/privacidade" target="_blank" className="underline text-gray-400 hover:text-green-400">
                        Política de Privacidade
                      </a>.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}