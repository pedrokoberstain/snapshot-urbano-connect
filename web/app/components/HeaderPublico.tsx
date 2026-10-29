"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, Popover, Transition } from "@headlessui/react";
import {
  ChevronDown, Home, Building2, Trees, LineChart, BadgeCheck,
  Megaphone, Settings, Heart, LogOut, Menu as MenuIcon, X,
  Crown, Info, Newspaper, Library, MapPin, Tractor, Plane, TrendingUp,
  BarChart2, Factory, MapPinned, FlaskConical, Mail,
} from "lucide-react";

/**
 * HeaderPublico Component
 * * Componente principal de navegação para a área pública do Urbano Connect.
 * Implementa design glassmorphism, menus acessíveis com Headless UI,
 * lógica de autenticação via JWT local e navegação âncora inteligente.
 */
export default function HeaderPublico() {
  const router = useRouter();

  // Estados de Autenticação e Interface
  const [logado, setLogado] = useState(false);
  const [iniciais, setIniciais] = useState("");
  const [isCorretor, setIsCorretor] = useState(false);
  /** Engenheiro, arquiteto ou analista credenciado — conta comum, mas com painel. */
  const [ehProfissional, setEhProfissional] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  /**
   * Effect responsável por validar a sessão do usuário ao montar o componente.
   * Lê o JWT do localStorage, decodifica a role (ADMIN/CORRETOR) e busca o nome do perfil.
   */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLogado(true);
    
    // Busca os dados atualizados do usuário para popular o Avatar
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.nome) setIniciais(data.nome.charAt(0).toUpperCase());
      })
      .catch(err => console.error("Falha ao buscar perfil:", err));

    // Decodifica o JWT base64 para gerenciar permissões (RBAC) no Front-end
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const cargo = payload.tipo || payload.role || "";
      
      if (cargo.includes('ADMIN') || cargo.includes('CORRETOR')) {
          setIsCorretor(true);
      } else {
        // Engenheiro, arquiteto e analista têm conta comum: o cargo no token
        // diz USUARIO e não revela nada sobre a credencial. Sem perguntar à
        // API, o profissional loga e fica sem nenhum caminho até o painel —
        // que foi exatamente o que aconteceu no primeiro teste.
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/iqc/minhas-partes`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
          .then(res => { if (res.ok) setEhProfissional(true); })
          .catch(() => { /* sem acesso ao IQC: segue como cliente comum */ });
      }
    } catch (e) {
      console.error("Erro na decodificação do JWT", e);
    }
  }, []);

  /**
   * Encerra a sessão do usuário, limpando o cache local e forçando o redirecionamento.
   */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tipoUsuario");
    localStorage.removeItem("cidadeUsuario");
    
    setLogado(false);
    setIsCorretor(false);
    window.location.href = "/login";
  };

  /**
   * Navegação Inteligente (Anchor Routing)
   * Direciona o usuário para a seção de Vitrine e aplica o filtro via Query Params.
   * * @param categoria Categoria do imóvel (CASA, APARTAMENTO, RURAL)
   */
  const navegarParaVitrine = (categoria: string) => {
    setMenuMobileAberto(false);
    
    if (window.location.pathname === '/') {
      // Se já estiver na Home, aplica o param e faz scroll suave
      router.push(`/?categoria=${categoria}#vitrine`, { scroll: false });
      document.getElementById("vitrine")?.scrollIntoView({ behavior: "smooth" });
    } else {
      // Se estiver em outra rota, redireciona forçando o carregamento na âncora
      router.push(`/?categoria=${categoria}#vitrine`);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full h-20 bg-[#09090f]/80 backdrop-blur-md border-b border-white/10 z-[100] flex items-center shadow-lg">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">
        
        {/* =======================
            LADO ESQUERDO / BRANDING
            ======================= */}
        <div className="flex items-center gap-4">
          <button 
            className="lg:hidden p-2 -ml-2 text-gray-300 hover:text-white transition-colors outline-none"
            onClick={() => setMenuMobileAberto(!menuMobileAberto)}
            aria-label="Alternar Menu"
          >
            {menuMobileAberto ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
          
          <Link href="/" className="flex-shrink-0 group outline-none flex items-center gap-2.5">
            <Image
              src="/logo-icon.png"
              alt="Urbano Connect"
              width={82}
              height={82}
              unoptimized
              className="group-hover:opacity-80 transition-opacity drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]"
            />
            <span className="text-2xl font-black tracking-tighter text-white group-hover:opacity-80 transition-opacity">
              urbano<span className="text-green-500">connect</span>
            </span>
          </Link>
        </div>

        {/* ==============================
            NAVEGAÇÃO CENTRAL (DESKTOP)
            ============================== */}
        <nav className="hidden lg:flex items-center gap-6 z-50">

          {/* Dropdown: Imóveis */}
          <Popover className="relative">
            {({ open, close }) => (
              <>
                <Popover.Button className={`group inline-flex items-center gap-1 text-sm font-bold outline-none transition-colors ${open ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}>
                  <span>Imóveis</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                </Popover.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-3"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-3"
                >
                  <Popover.Panel className="absolute left-1/2 z-10 mt-6 w-72 -translate-x-1/2 transform px-4 sm:px-0">
                    <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 bg-[#12121e] p-3">

                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-3 pt-1 pb-2">Buscar por tipo</p>

                      <button onClick={() => { navegarParaVitrine('CASA'); close(); }} className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover/item:scale-110 transition-transform">
                          <Home className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-100">Casas</p>
                          <p className="text-xs text-gray-500">Imóveis residenciais</p>
                        </div>
                      </button>

                      <button onClick={() => { navegarParaVitrine('APARTAMENTO'); close(); }} className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item mt-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover/item:scale-110 transition-transform">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-100">Apartamentos</p>
                          <p className="text-xs text-gray-500">Prontos para morar</p>
                        </div>
                      </button>

                      <button onClick={() => { navegarParaVitrine('RURAL'); close(); }} className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item mt-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500 group-hover/item:scale-110 transition-transform">
                          <Trees className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-100">Rurais e Terrenos</p>
                          <p className="text-xs text-gray-500">Fazendas e lotes</p>
                        </div>
                      </button>

                      <div className="h-px bg-white/5 mx-2 my-3" />
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-3 pb-2">Para Corretores</p>

                      <Link href="/admin" onClick={() => close()} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500 group-hover/item:scale-110 transition-transform">
                          <LineChart className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-100">Inteligência IA</p>
                          <p className="text-xs text-gray-500">Avalie propriedades</p>
                        </div>
                      </Link>

                      <Link href="/admin/imoveis/novo" onClick={() => close()} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item mt-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500 group-hover/item:scale-110 transition-transform">
                          <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-100">Anunciar Imóvel</p>
                          <p className="text-xs text-gray-500">Alcance mais clientes</p>
                        </div>
                      </Link>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>

          {/* Dropdown: Mercado */}
          <Popover className="relative">
            {({ open, close }) => (
              <>
                <Popover.Button className={`group inline-flex items-center gap-1 text-sm font-bold outline-none transition-colors ${open ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}>
                  <span>Mercado</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                </Popover.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-3"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-3"
                >
                  <Popover.Panel className="absolute left-1/2 z-10 mt-6 w-72 -translate-x-1/2 transform px-4 sm:px-0">
                    <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 bg-[#12121e] p-3">
                      {[
                        { label: "Agronegócio", sub: "Commodities, fazendas e safras", href: "/noticias?categoria=AGRONEGOCIO", icon: Tractor,   cor: "bg-green-500/10 text-green-400" },
                        { label: "Urbano",       sub: "Cidades, serviços e expansão",  href: "/noticias?categoria=CIDADES",     icon: Building2,  cor: "bg-blue-500/10 text-blue-400" },
                        { label: "Aviação",      sub: "Aeroportos e logística aérea",  href: "/noticias?categoria=AVIACAO",     icon: Plane,      cor: "bg-sky-500/10 text-sky-400" },
                        { label: "Economia",     sub: "Índices, crédito e câmbio",      href: "/noticias?categoria=ECONOMIA",    icon: TrendingUp, cor: "bg-amber-500/10 text-amber-400" },
                        { label: "Indicadores",  sub: "Preços, IGPM e benchmarks",     href: "/noticias?categoria=ECONOMIA",    icon: BarChart2,  cor: "bg-violet-500/10 text-violet-400" },
                        { label: "Indústria",    sub: "Setor industrial e produção",   href: "/noticias?categoria=INDUSTRIA",   icon: Factory,    cor: "bg-orange-500/10 text-orange-400" },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link key={item.label} href={item.href} onClick={() => close()} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group/item mt-1 first:mt-0">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.cor} group-hover/item:scale-110 transition-transform`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-100">{item.label}</p>
                              <p className="text-xs text-gray-500">{item.sub}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>

          {/* Links Fixos */}
          <Link href="/cidades" className="text-sm font-bold text-gray-300 hover:text-green-500 outline-none transition-colors">Cidades</Link>
          <Link href="/regioes" className="text-sm font-bold text-gray-300 hover:text-green-500 outline-none transition-colors">Regiões</Link>
          <Link href="/noticias" className="text-sm font-bold text-gray-300 hover:text-green-500 outline-none transition-colors">Notícias</Link>
          <Link href="/artigos" className="text-sm font-bold text-gray-300 hover:text-green-500 outline-none transition-colors">Artigos</Link>
          <Link href="/sobre" className="text-sm font-bold text-gray-300 hover:text-green-500 outline-none transition-colors">Sobre Nós</Link>

          <div className="h-4 w-px bg-white/10 mx-1"></div>

          <Link href="/planos" className="group flex items-center gap-1.5 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 outline-none hover:scale-105 transition-transform">
            <Crown className="w-4 h-4 text-green-400 group-hover:-translate-y-1 transition-transform" /> Planos PRO
          </Link>
        </nav>

        {/* ==================================
            LADO DIREITO (CONTROLES DE SESSÃO)
            ================================== */}
        <div className="flex items-center gap-3 sm:gap-5">
          {logado && isCorretor && (
            <Link href="/admin" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Painel Corretor
            </Link>
          )}

          {logado ? (
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="w-11 h-11 rounded-full bg-gradient-to-tr from-green-600 to-emerald-400 text-white font-black shadow-md hover:scale-105 transition-transform flex items-center justify-center border-2 border-[#09090f]">
                {iniciais || "U"}
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95 translate-y-2"
                enterTo="transform opacity-100 scale-100 translate-y-0"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100 translate-y-0"
                leaveTo="transform opacity-0 scale-95 translate-y-2"
              >
                <Menu.Items className="absolute right-0 mt-3 w-64 origin-top-right rounded-2xl bg-[#12121e] shadow-2xl ring-1 ring-white/10 focus:outline-none overflow-hidden">
                  <div className="p-4 bg-white/5 border-b border-white/5 text-center">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Minha Conta</p>
                    <p className="text-sm font-bold text-gray-100 truncate px-2 italic opacity-80">Logado como {isCorretor ? 'Corretor' : ehProfissional ? 'Profissional' : 'Cliente'}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    {ehProfissional && (
                      <Menu.Item>{({ active }) => (<Link href="/admin/iqc" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${active ? 'bg-green-500/10 text-green-400' : 'text-green-400'}`}><LineChart className="w-4 h-4" /> Painel de Avaliações</Link>)}</Menu.Item>
                    )}
                    <Menu.Item>{({ active }) => (<Link href="/credenciais" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${active ? 'bg-white/5 text-green-400' : 'text-gray-300'}`}><BadgeCheck className="w-4 h-4" /> Minha Credencial</Link>)}</Menu.Item>
                    <Menu.Item>{({ active }) => (<Link href="/meu-condominio" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${active ? 'bg-white/5 text-green-400' : 'text-gray-300'}`}><Home className="w-4 h-4" /> Meu Condomínio</Link>)}</Menu.Item>
                    <Menu.Item>{({ active }) => (<Link href="/conta" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${active ? 'bg-white/5 text-green-400' : 'text-gray-300'}`}><Settings className="w-4 h-4" /> Perfil e Segurança</Link>)}</Menu.Item>
                    <Menu.Item>{({ active }) => (<Link href="/favoritos" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors ${active ? 'bg-white/5 text-green-400' : 'text-gray-300'}`}><Heart className="w-4 h-4" /> Imóveis Favoritos</Link>)}</Menu.Item>
                    <hr className="border-white/5 mx-2 my-1" />
                    <Menu.Item>{({ active }) => (<button onClick={handleLogout} className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl w-full text-left transition-colors ${active ? 'bg-red-500/10 text-red-400' : 'text-red-500'}`}><LogOut className="w-4 h-4" /> Encerrar Sessão</button>)}</Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          ) : (
            <Link href="/login" className="bg-white text-[#09090f] px-7 py-2.5 rounded-full text-sm font-black hover:bg-green-400 hover:text-[#09090f] transition-all">Entrar</Link>
          )}
        </div>
      </div>

      {/* =======================================
          NAVEGAÇÃO MOBILE (DRAWER DOWN)
          ======================================= */}
      <Transition
        show={menuMobileAberto}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-2"
      >
        <div className="absolute top-20 left-0 w-full bg-[#12121e] border-b border-white/10 shadow-2xl lg:hidden">
          <nav className="flex flex-col p-4 space-y-1">

            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 pt-2 mb-2">Imóveis</p>
            <button onClick={() => navegarParaVitrine('CASA')} className="w-full text-left px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3">
              <Home className="w-5 h-5 text-blue-400" /> Casas
            </button>
            <button onClick={() => navegarParaVitrine('APARTAMENTO')} className="w-full text-left px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3">
              <Building2 className="w-5 h-5 text-indigo-400" /> Apartamentos
            </button>
            <button onClick={() => navegarParaVitrine('RURAL')} className="w-full text-left px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3">
              <Trees className="w-5 h-5 text-green-500" /> Áreas Rurais
            </button>
            <Link href="/admin" onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3">
              <LineChart className="w-5 h-5 text-yellow-500" /> Inteligência IA
            </Link>
            <Link href="/admin/imoveis/novo" onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-yellow-500" /> Anunciar Imóvel
            </Link>

            <div className="h-px bg-white/5 my-2 mx-4" />

            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 pt-2 mb-2">Mercado</p>
            <Link href="/noticias?categoria=AGRONEGOCIO" onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><Tractor   className="w-5 h-5 text-green-400" /> Agronegócio</Link>
            <Link href="/noticias?categoria=CIDADES"     onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><Building2  className="w-5 h-5 text-blue-400"   /> Urbano</Link>
            <Link href="/noticias?categoria=AVIACAO"     onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><Plane      className="w-5 h-5 text-sky-400"    /> Aviação</Link>
            <Link href="/noticias?categoria=ECONOMIA"    onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><TrendingUp className="w-5 h-5 text-amber-400"  /> Economia</Link>
            <Link href="/noticias?categoria=ECONOMIA"    onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><BarChart2  className="w-5 h-5 text-violet-400" /> Indicadores</Link>
            <Link href="/noticias?categoria=INDUSTRIA"   onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><Factory    className="w-5 h-5 text-orange-400"  /> Indústria</Link>

            <div className="h-px bg-white/5 my-2 mx-4" />

            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 pt-2 mb-2">Institucional</p>
            <Link href="/cidades" onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><MapPin       className="w-5 h-5 text-green-400"  /> Cidades de MT</Link>
            <Link href="/regioes" onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><MapPinned    className="w-5 h-5 text-blue-400"   /> Regiões e Polos</Link>
            <Link href="/sobre#metodologia" onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><FlaskConical className="w-5 h-5 text-violet-400" /> Metodologia</Link>
            <Link href="/noticias" onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><Newspaper    className="w-5 h-5 text-indigo-400" /> Notícias e Mercado</Link>
            <Link href="/artigos" onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><Library      className="w-5 h-5 text-amber-400"  /> Artigos e Séries</Link>
            <Link href="/sobre" onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><Info         className="w-5 h-5 text-gray-400"   /> Sobre Nós</Link>
            <Link href="/sobre#contato" onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-gray-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3"><Mail         className="w-5 h-5 text-emerald-400"/> Contato</Link>
            <Link href="/planos" onClick={() => setMenuMobileAberto(false)} className="px-4 py-3 text-green-400 font-black hover:bg-green-500/10 rounded-xl transition-colors flex items-center gap-3 bg-green-500/5 border border-green-500/10"><Crown className="w-5 h-5" /> Conhecer Planos PRO</Link>

            {logado && isCorretor && (
              <div className="pt-4 mt-2">
                <Link href="/admin" onClick={() => setMenuMobileAberto(false)} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl font-bold transition-colors"><LineChart className="w-5 h-5" /> Acessar Painel</Link>
              </div>
            )}
          </nav>
        </div>
      </Transition>
    </header>
  );
}