"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, X, Loader2, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { CIDADES_MT } from "../../data/cidades";

const EditorNoticias = dynamic(() => import("../../components/EditorNoticias"), { ssr: false });

const CATEGORIAS = [
  { value: "AGRONEGOCIO", label: "Agronegócio" },
  { value: "AVIACAO",     label: "Aviação" },
  { value: "ECONOMIA",    label: "Economia" },
  { value: "CIDADES",     label: "Cidades" },
  { value: "FAZENDAS",    label: "Fazendas" },
  { value: "INDUSTRIA",   label: "Indústria" },
];

// Marcador de notícia estadual: aparece em todas as páginas de cidade.
const TODAS_CIDADES = "TODAS";

interface Props {
  dadosIniciais?: any;
  noticiaId?: number;
}

export default function FormularioNoticia({ dadosIniciais, noticiaId }: Props) {
  const router = useRouter();
  const isEdit = !!noticiaId;

  const [titulo,     setTitulo]     = useState(dadosIniciais?.titulo     ?? "");
  const [resumo,     setResumo]     = useState(dadosIniciais?.resumo     ?? "");
  const [conteudo,   setConteudo]   = useState(dadosIniciais?.conteudo   ?? "");
  const [imagemCapa, setImagemCapa] = useState(dadosIniciais?.imagemCapa ?? "");
  const [categorias, setCategorias] = useState<string[]>(
    dadosIniciais?.categorias?.length ? dadosIniciais.categorias
      : dadosIniciais?.categoria ? [dadosIniciais.categoria] : []
  );
  const [autor,      setAutor]      = useState(dadosIniciais?.autor      ?? "");
  const [cidades,    setCidades]    = useState<string[]>(
    dadosIniciais?.cidades?.length ? dadosIniciais.cidades
      : dadosIniciais?.cidade ? [dadosIniciais.cidade] : []
  );
  const [publicado,  setPublicado]  = useState(dadosIniciais?.publicado  ?? false);
  const [destaque,   setDestaque]   = useState(dadosIniciais?.destaque   ?? false);
  const [serie,       setSerie]       = useState(dadosIniciais?.serie       ?? "");
  const [parteNumero, setParteNumero] = useState<string>(dadosIniciais?.parteNumero != null ? String(dadosIniciais.parteNumero) : "");
  const [tipo,        setTipo]        = useState(dadosIniciais?.tipo ?? "NOTICIA");
  const [bloco,       setBloco]       = useState(dadosIniciais?.bloco ?? "");
  const [blocoNumero, setBlocoNumero] = useState<string>(dadosIniciais?.blocoNumero != null ? String(dadosIniciais.blocoNumero) : "");
  const [blocosDaSerie, setBlocosDaSerie] = useState<{ nome: string; numero: number | null }[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [erro,     setErro]     = useState("");

  const resetScrollLock = () => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  };

  useEffect(() => resetScrollLock, []);

  /**
   * Carrega os blocos que já existem na série digitada.
   *
   * É isto que impede o erro que quebrou a série Castanha: lá o nome foi
   * digitado à mão em cada artigo e cada um virou uma série de um item só.
   * Aqui o bloco se escolhe numa lista; texto livre só para criar um novo.
   */
  useEffect(() => {
    const nome = serie.trim().toLowerCase();
    if (!nome) { setBlocosDaSerie([]); return; }
    let vivo = true;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias/admin/todas`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((todas: any[]) => {
        if (!vivo || !Array.isArray(todas)) return;
        const mapa = new Map<string, number | null>();
        for (const n of todas) {
          if ((n.serie ?? "").trim().toLowerCase() !== nome) continue;
          if (n.bloco && !mapa.has(n.bloco)) mapa.set(n.bloco, n.blocoNumero ?? null);
        }
        setBlocosDaSerie([...mapa.entries()]
          .map(([nome, numero]) => ({ nome, numero }))
          .sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99)));
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, [serie]);

  const token = () => localStorage.getItem("token") ?? "";

  const toggleCategoria = (value: string) =>
    setCategorias((prev) => prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]);

  const toggleCidade = (value: string) =>
    setCidades((prev) => prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]);

  const estadual = cidades.includes(TODAS_CIDADES);
  const toggleEstadual = () => setCidades(estadual ? [] : [TODAS_CIDADES]);
  const cidadesSelecionadas = cidades.filter((c) => c !== TODAS_CIDADES);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (categorias.length === 0) {
      setErro("Selecione ao menos uma categoria.");
      return;
    }

    setSalvando(true);

    const payload = {
      titulo, resumo, conteudo, imagemCapa, categorias, autor,
      cidades, publicado, destaque,
      serie: serie.trim() || null,
      parteNumero: serie.trim() && parteNumero ? Number(parteNumero) : null,
      tipo,
      bloco: serie.trim() && bloco.trim() ? bloco.trim() : null,
      blocoNumero: serie.trim() && bloco.trim() && blocoNumero ? Number(blocoNumero) : null,
    };
    const url    = isEdit
      ? `${process.env.NEXT_PUBLIC_API_URL}/noticias/${noticiaId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/noticias`;

    try {
      const res = await fetch(url, {
        method:  isEdit ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar.");
      router.push("/admin/noticias");
    } catch {
      setErro("Não foi possível salvar. Verifique os campos e tente novamente.");
      setSalvando(false);
    }
  };

  return (
    <div className="font-sans">
      <header className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/noticias")}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-colors outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white">
            {isEdit ? "Editar Notícia" : "Nova Notícia"}
          </h1>
          <p className="text-gray-400 mt-1">Preencha os campos abaixo e salve.</p>
        </div>
      </header>

      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold px-4 py-3 rounded-xl mb-6">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-5">

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Título *</label>
              <input
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                placeholder="Título da notícia"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Resumo *</label>
              <textarea
                required
                rows={3}
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all resize-none"
                placeholder="Resumo exibido nos cards da vitrine..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Conteúdo *</label>
              <EditorNoticias value={conteudo} onChange={setConteudo} />
            </div>
          </div>

          {/* Coluna lateral */}
          <div className="space-y-5">

            {/* Imagem de capa */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Imagem de Capa</label>
              {imagemCapa ? (
                <div className="relative">
                  <img src={imagemCapa} alt="Capa" className="w-full h-40 object-cover rounded-xl border border-white/10" />
                  <button
                    type="button"
                    onClick={() => setImagemCapa("")}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-red-600 transition-colors outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <CldUploadWidget
                  uploadPreset="imoveis_preset"
                  onSuccess={(result: any) => { setImagemCapa(result.info.secure_url); resetScrollLock(); }}
                  onClose={resetScrollLock}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className="w-full h-40 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-green-500/50 hover:text-green-400 transition-colors outline-none"
                    >
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-sm font-bold">Clique para fazer upload</span>
                    </button>
                  )}
                </CldUploadWidget>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Categorias * <span className="text-gray-600 font-normal">(selecione uma ou mais)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map((c) => {
                  const ativo = categorias.includes(c.value);
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => toggleCategoria(c.value)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all outline-none border ${
                        ativo
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-[#09090f] text-gray-400 border-white/10 hover:border-green-500/40 hover:text-green-400"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Autor</label>
              <input
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                placeholder="Nome do autor (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Cidades <span className="text-gray-600 font-normal">(opcional — uma ou mais)</span>
              </label>

              {/* Toggle estadual: aparece em todas as páginas de cidade */}
              <label className="flex items-center justify-between cursor-pointer bg-[#09090f] border border-white/10 rounded-xl px-4 py-3 mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-300">Todas as cidades</p>
                  <p className="text-xs text-gray-500">Notícia estadual — aparece em toda página de cidade</p>
                </div>
                <div
                  onClick={toggleEstadual}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${estadual ? "bg-green-600" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${estadual ? "left-7" : "left-1"}`} />
                </div>
              </label>

              {!estadual && (
                <>
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) toggleCidade(e.target.value); }}
                    className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">+ Adicionar cidade...</option>
                    {CIDADES_MT.filter((c) => !cidadesSelecionadas.includes(c.nomeBusca)).map((c) => (
                      <option key={c.slug} value={c.nomeBusca}>{c.nome}</option>
                    ))}
                  </select>
                  {cidadesSelecionadas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {cidadesSelecionadas.map((nomeBusca) => {
                        const c = CIDADES_MT.find((x) => x.nomeBusca === nomeBusca);
                        return (
                          <span
                            key={nomeBusca}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-600/15 text-green-400 border border-green-500/30"
                          >
                            {c?.nome ?? nomeBusca}
                            <button
                              type="button"
                              onClick={() => toggleCidade(nomeBusca)}
                              className="text-green-400/70 hover:text-red-400 transition-colors outline-none"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              <p className="text-xs text-gray-600 mt-1">
                {estadual
                  ? "Aparece no feed geral e na seção de notícias de todas as cidades."
                  : cidadesSelecionadas.length === 0
                  ? "Geral — aparece apenas no feed de notícias."
                  : "Vincula a notícia à página de cada cidade selecionada."}
              </p>
            </div>

            {/* Notícia ou artigo */}
            <div className="bg-[#09090f] border border-white/10 rounded-xl p-4">
              <label className="block text-sm font-bold text-gray-300 mb-2">Tipo de conteúdo</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "NOTICIA", t: "Notícia", d: "Datada. Entra no feed." },
                  { v: "ARTIGO",  t: "Artigo",  d: "Referência. Vai para /artigos." },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setTipo(o.v)}
                    className={`text-left px-3 py-2.5 rounded-xl border transition-all outline-none ${
                      tipo === o.v
                        ? "bg-green-600/15 border-green-500 text-white"
                        : "bg-[#12121e] border-white/10 text-gray-400 hover:border-white/25"
                    }`}
                  >
                    <span className="block text-sm font-bold">{o.t}</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">{o.d}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Série / Dossiê */}
            <div className="bg-[#09090f] border border-white/10 rounded-xl p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Série / Dossiê <span className="text-gray-600 font-normal">(opcional)</span>
                </label>
                <input
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                  placeholder="Ex: BR-163 — A Rodovia que Criou Cidades"
                />
                <p className="text-xs text-gray-600 mt-1">Agrupa esta notícia com outras da mesma série. Use o mesmo nome em todas as partes.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Parte nº</label>
                <input
                  type="number"
                  min={1}
                  value={parteNumero}
                  onChange={(e) => setParteNumero(e.target.value)}
                  disabled={!serie.trim()}
                  className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white placeholder-gray-600 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all disabled:opacity-40"
                  placeholder="1"
                />
                <p className="text-xs text-gray-600 mt-1">Define a ordem dentro da série (1, 2, 3...).</p>
              </div>

              {/* Bloco temático — escolhido numa lista, nunca digitado à toa.
                  Foi assim que a série Castanha virou sete séries de um item. */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Bloco temático <span className="text-gray-600 font-normal">(opcional)</span>
                </label>
                <select
                  value={blocosDaSerie.some((b) => b.nome === bloco) || !bloco ? bloco : "__novo__"}
                  disabled={!serie.trim()}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__novo__") { setBloco(" "); setBlocoNumero(""); return; }
                    setBloco(v);
                    const achado = blocosDaSerie.find((b) => b.nome === v);
                    setBlocoNumero(achado?.numero != null ? String(achado.numero) : "");
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-[#09090f] border border-white/10 text-white focus:border-green-500 outline-none transition-all disabled:opacity-40"
                >
                  <option value="">Sem bloco</option>
                  {blocosDaSerie.map((b) => (
                    <option key={b.nome} value={b.nome}>
                      {b.numero != null ? `${b.numero}. ` : ""}{b.nome}
                    </option>
                  ))}
                  <option value="__novo__">+ Criar novo bloco…</option>
                </select>

                {bloco !== "" && !blocosDaSerie.some((b) => b.nome === bloco) && (
                  <div className="grid grid-cols-[1fr_100px] gap-2 mt-2">
                    <input
                      value={bloco.trim()}
                      onChange={(e) => setBloco(e.target.value)}
                      autoFocus
                      className="px-4 py-3 rounded-xl bg-[#09090f] border border-green-500/40 text-white placeholder-gray-600 focus:border-green-500 outline-none transition-all"
                      placeholder="Ex: Diagnóstico e Contaminação"
                    />
                    <input
                      type="number"
                      min={1}
                      value={blocoNumero}
                      onChange={(e) => setBlocoNumero(e.target.value)}
                      className="px-3 py-3 rounded-xl bg-[#09090f] border border-green-500/40 text-white placeholder-gray-600 focus:border-green-500 outline-none transition-all"
                      placeholder="nº"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  {serie.trim()
                    ? "Agrupa as partes da série em seções temáticas na página de artigos."
                    : "Preencha a série primeiro."}
                </p>
              </div>
            </div>

            {/* Toggles */}
            <div className="bg-[#09090f] border border-white/10 rounded-xl p-4 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-gray-300">Publicado</p>
                  <p className="text-xs text-gray-500">Visível no portal público</p>
                </div>
                <div
                  onClick={() => setPublicado((v: boolean) => !v)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${publicado ? "bg-green-600" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${publicado ? "left-7" : "left-1"}`} />
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-gray-300">Destaque</p>
                  <p className="text-xs text-gray-500">Aparece no slider da home</p>
                </div>
                <div
                  onClick={() => setDestaque((v: boolean) => !v)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${destaque ? "bg-yellow-500" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${destaque ? "left-7" : "left-1"}`} />
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 outline-none"
            >
              {salvando ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : isEdit ? "Salvar Alterações" : "Publicar Notícia"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
