"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import {
  LayoutDashboard,
  Home,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Newspaper,
  BadgeCheck,
  Mail,
  Users,
  DollarSign,
  Landmark,
  Building,
  Building2,
  Loader2,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState({ nome: "", tipo: "" });
  const [verificando, setVerificando] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const tipo = localStorage.getItem("tipoUsuario");

    if (!token) {
      router.push("/login");
      return;
    }

    // ADMIN e CORRETOR entram direto — o tipo da conta já basta.
    if (tipo && tipo !== "USUARIO") {
      Promise.resolve().then(() => {
        setUsuario((prev) => ({ ...prev, tipo }));
        setVerificando(false);
      });
      return;
    }

    // USUARIO pode ser um profissional credenciado: engenheiro, arquiteto e
    // analista têm conta comum, e antes eram chutados para a home aqui — ou
    // seja, ficavam trancados fora do próprio trabalho. Quem decide é a API,
    // que conhece credencial e partes designadas; o localStorage não conhece.
    let vivo = true;
    api.get("/iqc/minhas-partes")
      .then(() => {
        if (!vivo) return;
        setUsuario((prev) => ({ ...prev, tipo: "PROFISSIONAL" }));
        setVerificando(false);
      })
      .catch(() => { if (vivo) router.push("/"); });
    return () => { vivo = false; };
  }, [router]);

  const isAdmin = usuario.tipo === "ADMIN";
  const isProfissional = usuario.tipo === "PROFISSIONAL";

  const menuCorretor = [
    { name: "Visão Geral",     icon: LayoutDashboard, path: "/admin" },
    { name: "Meus Imóveis",    icon: Home,             path: "/admin/imoveis" },
    { name: "Condomínios",     icon: Building,         path: "/admin/condominios" },
    { name: "Auditoria IQC",   icon: Building2,        path: "/admin/iqc" },
    { name: "Leads / Contatos",icon: MessageSquare,    path: "/admin/leads" },
    { name: "Minha Conta",     icon: Settings,         path: "/admin/conta" },
  ];

  const menuAdmin = [
    { name: "Visão Geral",      icon: LayoutDashboard, path: "/admin" },
    { name: "Imóveis",          icon: Home,             path: "/admin/imoveis" },
    { name: "Imóveis Vendidos", icon: BadgeCheck,       path: "/admin/imoveis/vendidos" },
    { name: "Condomínios",      icon: Building,         path: "/admin/condominios" },
    { name: "Auditoria IQC",    icon: Building2,        path: "/admin/iqc" },
    { name: "Notícias",         icon: Newspaper,        path: "/admin/noticias" },
    { name: "Newsletter",       icon: Mail,             path: "/admin/newsletter" },
    { name: "Leads / Contatos", icon: MessageSquare,    path: "/admin/leads" },
    { name: "Usuários",         icon: Users,            path: "/admin/usuarios" },
    { name: "Credenciais",      icon: BadgeCheck,       path: "/admin/credenciais" },
    { name: "Base IPTU",        icon: Landmark,         path: "/admin/cadastro-iptu" },
    { name: "Preços dos Planos",icon: DollarSign,       path: "/admin/planos" },
    { name: "Minha Conta",      icon: Settings,         path: "/admin/conta" },
  ];

  /** O profissional credenciado só tem o que fazer no IQC. */
  const menuProfissional = [
    { name: "Auditoria IQC", icon: Building2, path: "/admin/iqc" },
    { name: "Condomínios",   icon: Building,  path: "/admin/condominios" },
    { name: "Minha Conta",   icon: Settings,  path: "/admin/conta" },
  ];

  const menuItems = isAdmin ? menuAdmin : isProfissional ? menuProfissional : menuCorretor;

  // Enquanto a API não confirma, não renderiza o painel: piscar o menu inteiro
  // para quem vai ser redirecionado é pior que esperar meio segundo.
  if (verificando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090f]">
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#09090f] font-sans">
      
      {/* Header Mobile (Aparece apenas em telas pequenas) */}
      <div className="lg:hidden fixed top-0 left-0 w-full h-16 bg-[#12121e]/90 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 outline-none">
          <Image src="/logo-icon.png" alt="Urbano Connect" width={36} height={36} unoptimized />
          <span className="text-lg font-black tracking-tighter text-white">urbano<span className="text-green-500">connect</span></span>
        </Link>
        <button 
          onClick={() => setMenuAberto(!menuAberto)}
          className="p-2 text-gray-400 hover:text-white transition-colors outline-none"
        >
          {menuAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay Escuro para Mobile quando o menu está aberto */}
      {menuAberto && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* Sidebar Lateral Moderna */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-[#12121e] border-r border-white/5 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          menuAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-4 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 outline-none group">
            <Image src="/logo-icon.png" alt="Urbano Connect" width={40} height={40} unoptimized className="group-hover:opacity-80 transition-opacity shrink-0" />
            <div className="min-w-0">
              <span className="text-lg font-black tracking-tighter text-white group-hover:opacity-80 transition-opacity leading-none block">
                urbano<span className="text-green-500">connect</span>
              </span>
              <p className="text-[9px] text-green-500 font-bold uppercase tracking-widest mt-0.5">
                Painel {usuario.tipo}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icone = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMenuAberto(false)} // Fecha o menu ao clicar no mobile
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all outline-none ${
                  isActive
                    ? "bg-green-500/10 text-green-400 border-l-2 border-green-500"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent"
                }`}
              >
                <Icone className={`w-5 h-5 ${isActive ? "text-green-500" : "text-gray-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all outline-none"
          >
            <LogOut className="w-5 h-5 text-red-500" /> Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 lg:ml-64 pt-20 lg:pt-0 p-4 md:p-8 relative">
        {/* Glow sutil no fundo da área principal */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 rounded-full filter blur-[100px] pointer-events-none"></div>
        
        <div className="w-full relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}