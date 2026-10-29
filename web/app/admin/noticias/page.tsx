"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, Loader2, BarChart2, Search, X } from "lucide-react";

const CORES_CATEGORIA: Record<string, string> = {
  AGRONEGOCIO: "bg-green-500/20 text-green-400 border-green-500/30",
  AVIACAO:     "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ECONOMIA:    "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CIDADES:     "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  FAZENDAS:    "bg-orange-500/20 text-orange-400 border-orange-500/30",
  INDUSTRIA:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const LABELS_CATEGORIA: Record<string, string> = {
  AGRONEGOCIO: "Agronegócio",
  AVIACAO:     "Aviação",
  ECONOMIA:    "Economia",
  CIDADES:     "Cidades",
  FAZENDAS:    "Fazendas",
  INDUSTRIA:   "Indústria",
};

const CATEGORIAS = [
  { value: "",            label: "Todas"       },
  { value: "AGRONEGOCIO", label: "Agronegócio" },
  { value: "AVIACAO",     label: "Aviação"     },
  { value: "ECONOMIA",    label: "Economia"    },
  { value: "CIDADES",     label: "Cidades"     },
  { value: "FAZENDAS",    label: "Fazendas"    },
  { value: "INDUSTRIA",   label: "Indústria"   },
];

const ORDENACOES = [
  { value: "recentes", label: "Mais recentes" },
  { value: "antigas",  label: "Mais antigas"  },
  { value: "vistas",   label: "Mais vistas"   },
  { value: "titulo",   label: "Título (A–Z)"  },
];

const STATUS = [
  { value: "",          label: "Todas"      },
  { value: "publicado", label: "Publicadas" },
  { value: "rascunho",  label: "Rascunhos"  },
  { value: "destaque",  label: "Destaques"  },
];

/** Sem acento, minúsculo e aparado: a busca acha "Cuiabá" com "cuiaba", e a
    ordenação A–Z não põe títulos com espaço à frente no topo. */
const normalizar = (s: string) =>
  (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export default function AdminNoticias() {
  const router = useRouter();
  const [noticias, setNoticias] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("recentes");

  const token = () => localStorage.getItem("token") ?? "";

  const carregar = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias/admin/todas`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => {
        // Sessão expirada ou sem permissão de ADMIN: manda relogar em vez de mostrar lista vazia
        if (r.status === 401 || r.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => { if (data) setNoticias(Array.isArray(data) ? data : []); })
      .catch(() => {})
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    if (!token()) { router.push("/login"); return; }
    carregar();
  }, []);

  const excluir = async (id: number) => {
    if (!confirm("Excluir esta notícia?")) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    setNoticias((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleCampo = async (noticia: any, campo: "publicado" | "destaque") => {
    const atualizado = { ...noticia, [campo]: !noticia[campo] };
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias/${noticia.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: atualizado.titulo,
        resumo: atualizado.resumo,
        conteudo: atualizado.conteudo,
        imagemCapa: atualizado.imagemCapa,
        categorias: atualizado.categorias?.length ? atualizado.categorias : [atualizado.categoria],
        cidades: atualizado.cidades ?? [],
        publicado: atualizado.publicado,
        destaque: atualizado.destaque,
        autor: atualizado.autor,
        serie: atualizado.serie,
        parteNumero: atualizado.parteNumero,
      }),
    });
    if (res.ok) {
      const salvo = await res.json();
      setNoticias((prev) => prev.map((n) => (n.id === salvo.id ? salvo : n)));
    }
  };

  const categoriasDe = (n: any): string[] =>
    n.categorias?.length ? n.categorias : n.categoria ? [n.categoria] : [];

  const combinaStatus = (n: any) =>
    filtroStatus === ""          ? true
    : filtroStatus === "publicado" ? n.publicado
    : filtroStatus === "rascunho"  ? !n.publicado
    : /* destaque */                 n.destaque;

  const alvoBusca = normalizar(busca).trim();
  const combinaBusca = (n: any) =>
    !alvoBusca ||
    normalizar(n.titulo).includes(alvoBusca) ||
    normalizar(n.autor).includes(alvoBusca) ||
    normalizar(n.serie).includes(alvoBusca) ||
    (n.cidades ?? []).some((c: string) => normalizar(c).includes(alvoBusca));

  const data = (n: any) => new Date(n.dataPublicacao).getTime() || 0;

  const noticiasFiltradas = noticias
    .filter((n) => !filtroCategoria || categoriasDe(n).includes(filtroCategoria))
    .filter(combinaStatus)
    .filter(combinaBusca)
    .sort((a, b) =>
      ordem === "antigas" ? data(a) - data(b)
      : ordem === "vistas" ? (b.acessos ?? 0) - (a.acessos ?? 0)
      : ordem === "titulo" ? normalizar(a.titulo).localeCompare(normalizar(b.titulo))
      : /* recentes */       data(b) - data(a)
    );

  const limparFiltros = () => { setFiltroCategoria(""); setFiltroStatus(""); setBusca(""); };
  const temFiltro = !!(filtroCategoria || filtroStatus || busca);

  return (
    <div className="font-sans">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Notícias</h1>
          <p className="text-gray-400 mt-1">Gerencie as publicações do portal.</p>
        </div>
        <Link
          href="/admin/noticias/nova"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-3 rounded-xl transition-all text-sm outline-none"
        >
          <Plus className="w-4 h-4" /> Nova Notícia
        </Link>
      </header>

      {/* Busca, status e ordenação */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, autor, série ou cidade…"
            className="w-full bg-[#12121e] border border-white/5 focus:border-green-500/50 rounded-xl pl-10 pr-9 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 outline-none transition-colors"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              title="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFiltroStatus(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all outline-none border ${
                filtroStatus === s.value
                  ? "bg-white/10 text-white border-white/20"
                  : "bg-[#12121e] text-gray-500 border-white/5 hover:text-gray-300 hover:border-white/15"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <select
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
          title="Ordenar por"
          className="bg-[#12121e] border border-white/5 focus:border-green-500/50 rounded-xl px-3 py-2.5 text-sm text-gray-300 outline-none cursor-pointer transition-colors"
        >
          {ORDENACOES.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#12121e]">{o.label}</option>
          ))}
        </select>
      </div>

      {/* Filtro de categorias */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        {CATEGORIAS.map((c) => {
          const ativo = filtroCategoria === c.value;
          // A contagem respeita status e busca — dizer "Cidades 78" enquanto o
          // filtro está em Rascunhos seria mentira.
          const base = noticias.filter((n) => combinaStatus(n) && combinaBusca(n));
          const qtd = c.value
            ? base.filter((n) => categoriasDe(n).includes(c.value)).length
            : base.length;
          return (
            <button
              key={c.value}
              onClick={() => setFiltroCategoria(c.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all outline-none border ${
                ativo
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-[#12121e] text-gray-400 border-white/5 hover:border-white/15 hover:text-gray-200"
              }`}
            >
              {c.label}
              <span className={`ml-1.5 ${ativo ? "text-green-200" : "text-gray-600"}`}>{qtd}</span>
            </button>
          );
        })}
      </div>

      {!carregando && (
        <div className="mb-5 flex items-center gap-3 text-xs text-gray-500">
          <span>
            Exibindo <strong className="text-gray-300">{noticiasFiltradas.length}</strong>
            {noticiasFiltradas.length !== noticias.length && <> de {noticias.length}</>}
            {noticiasFiltradas.length === 1 ? " notícia" : " notícias"}
          </span>
          {temFiltro && (
            <button onClick={limparFiltros} className="text-green-400 hover:text-green-300 font-bold outline-none">
              limpar filtros
            </button>
          )}
        </div>
      )}

      {carregando ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      ) : noticiasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-[#12121e] rounded-2xl border border-white/5">
          <p className="text-gray-400 font-medium mb-4">
            {busca
              ? `Nenhuma notícia encontrada para “${busca}”.`
              : temFiltro
              ? "Nenhuma notícia com esses filtros."
              : "Nenhuma notícia cadastrada ainda."}
          </p>
          {temFiltro ? (
            <button onClick={limparFiltros} className="text-green-400 font-bold hover:text-green-300 outline-none">
              Limpar filtros
            </button>
          ) : (
            <Link href="/admin/noticias/nova" className="text-green-400 font-bold hover:text-green-300">
              Criar primeira notícia →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {noticiasFiltradas.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl p-5 flex items-center gap-4 border-l-4 transition-colors ${
                n.destaque
                  ? "bg-yellow-500/5 border border-yellow-500/30 border-l-yellow-400 hover:border-yellow-500/50"
                  : n.publicado
                  ? "bg-green-500/5 border border-green-500/20 border-l-green-500 hover:border-green-500/40"
                  : "bg-[#12121e] border border-white/5 border-l-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              {n.imagemCapa && (
                <img
                  src={n.imagemCapa}
                  alt={n.titulo}
                  className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {categoriasDe(n).map((cat) => (
                    <span key={cat} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${CORES_CATEGORIA[cat] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                      {LABELS_CATEGORIA[cat] ?? cat}
                    </span>
                  ))}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    n.publicado
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  }`}>
                    {n.publicado ? "Publicado" : "Rascunho"}
                  </span>
                  {n.destaque && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      Destaque
                    </span>
                  )}
                </div>
                <p className="text-white font-bold text-sm truncate">{n.titulo}</p>
                <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-2">
                  {n.autor && `${n.autor} · `}
                  {new Date(n.dataPublicacao).toLocaleDateString("pt-BR")}
                  <span className="flex items-center gap-1 text-gray-600">
                    <BarChart2 className="w-3 h-3" />
                    {n.acessos ?? 0}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleCampo(n, "destaque")}
                  title={n.destaque ? "Remover destaque" : "Marcar como destaque"}
                  className="p-2 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors outline-none"
                >
                  {n.destaque ? <Star className="w-4 h-4" /> : <StarOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => toggleCampo(n, "publicado")}
                  title={n.publicado ? "Despublicar" : "Publicar"}
                  className="p-2 rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-500/10 transition-colors outline-none"
                >
                  {n.publicado ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <Link
                  href={`/admin/noticias/editar/${n.id}`}
                  className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors outline-none"
                >
                  <Edit2 className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => excluir(n.id)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors outline-none"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
