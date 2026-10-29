"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Mail, Users, Send, CheckCircle2, Loader2, AlertCircle,
  BookOpen, Trash2, Star, Save, X, ChevronRight, MousePointerClick, Link2, FlaskConical,
  Eye, PenLine,
} from "lucide-react";

const EditorNoticias = dynamic(() => import("../../components/EditorNoticias"), { ssr: false });

interface Stats     { ativos: number; total: number }
interface Assinante { id: number; email: string; nome: string; dataCadastro: string }
interface Template  { id: number; nome: string; assunto: string; conteudo: string; padrao: boolean; dataCriacao: string }

// Mirrors EmailService.montarTemplateNewsletter on the backend
function buildEmailHtml(
  assunto: string,
  conteudoHtml: string,
  urlBotao: string | null,
  textoBotao: string | null,
): string {
  const btn =
    urlBotao && urlBotao.trim()
      ? (() => {
          const texto =
            textoBotao && textoBotao.trim()
              ? textoBotao.trim()
              : "Ver conteúdo completo";
          return `
      <div style="text-align:center;margin:32px 0 8px;">
        <a href="${urlBotao.trim()}" target="_blank"
           style="display:inline-block;background:#22c55e;color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.01em;">
          ${texto} &nbsp;→
        </a>
      </div>`;
        })()
      : "";

  const conteudo =
    conteudoHtml ||
    '<p style="color:#9ca3af;font-style:italic;margin:0;">O conteúdo do e-mail aparecerá aqui conforme você escreve…</p>';
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${assunto || "Preview do e-mail"}</title>
</head>
<body style="margin:0;padding:0;background:#09090f;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090f;">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<tr><td align="center" style="padding-bottom:36px;">
  <table cellpadding="0" cellspacing="0">
    <tr><td style="background:#12121e;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px 32px;text-align:center;">
      <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-1px;font-family:Arial,sans-serif;">urbano</span><span style="font-size:26px;font-weight:900;color:#22c55e;letter-spacing:-1px;font-family:Arial,sans-serif;">connect</span>
      <p style="margin:6px 0 0;font-size:10px;font-weight:700;color:#22c55e;letter-spacing:0.25em;text-transform:uppercase;font-family:Arial,sans-serif;">Mato Grosso · Newsletter</p>
    </td></tr>
  </table>
</td></tr>

<tr><td style="background:#12121e;border-radius:16px;padding:36px;border:1px solid rgba(255,255,255,0.06);">
  <div style="color:#e2e8f0;font-size:15px;line-height:1.75;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    ${conteudo}
  </div>
  ${btn}
</td></tr>

<tr><td style="padding:32px 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="height:1px;background:rgba(34,197,94,0.2);"></td></tr>
  </table>
</td></tr>

<tr><td align="center" style="padding-bottom:40px;">
  <p style="color:#6b7280;font-size:12px;margin:0 0 8px;font-family:Arial,sans-serif;">Você está recebendo este e-mail porque se inscreveu na Urbano Connect.</p>
  <a href="#" style="color:#22c55e;font-size:12px;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;">Cancelar inscrição</a>
  <p style="color:#374151;font-size:11px;margin:16px 0 0;font-family:Arial,sans-serif;">© ${year} Urbano Connect · Mato Grosso, Brasil</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export default function NewsletterAdminPage() {
  const base  = process.env.NEXT_PUBLIC_API_URL;
  const token = () => localStorage.getItem("token") ?? "";
  const hdrs  = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });

  const [stats,      setStats]      = useState<Stats | null>(null);
  const [assinantes, setAssinantes] = useState<Assinante[]>([]);
  const [templates,  setTemplates]  = useState<Template[]>([]);

  // Compose
  const [assunto,    setAssunto]    = useState("");
  const [conteudo,   setConteudo]   = useState("");
  const [urlBotao,   setUrlBotao]   = useState("");
  const [textoBotao, setTextoBotao] = useState("Ver conteúdo completo");
  const [usarBotao,  setUsarBotao]  = useState(false);
  const [enviando,   setEnviando]   = useState(false);
  const [confirmar,  setConfirmar]  = useState(false);
  const [resultado,  setResultado]  = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);

  // Write / Preview tab
  const [abaCompose, setAbaCompose] = useState<"escrever" | "preview">("escrever");

  // Test
  const [testeAberto,    setTesteAberto]    = useState(false);
  const [emailTeste,     setEmailTeste]     = useState("");
  const [enviandoTeste,  setEnviandoTeste]  = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);

  // Save template
  const [salvarAberto, setSalvarAberto] = useState(false);
  const [nomeTemplate, setNomeTemplate] = useState("");
  const [salvandoTpl,  setSalvandoTpl]  = useState(false);
  const nomeRef = useRef<HTMLInputElement>(null);

  // Mobile panel tab
  const [abaAtiva, setAbaAtiva] = useState<"templates" | "compose">("templates");

  // Live preview HTML (mirrors backend template)
  const emailHtml = useMemo(
    () =>
      buildEmailHtml(
        assunto,
        conteudo,
        usarBotao && urlBotao.trim() ? urlBotao : null,
        usarBotao && textoBotao.trim() ? textoBotao : null,
      ),
    [assunto, conteudo, urlBotao, textoBotao, usarBotao],
  );

  useEffect(() => {
    const h = hdrs();
    Promise.all([
      fetch(`${base}/newsletter/stats`,      { headers: h }).then(r => r.json()),
      fetch(`${base}/newsletter/assinantes`, { headers: h }).then(r => r.json()),
      fetch(`${base}/newsletter/templates`,  { headers: h }).then(r => r.json()),
    ]).then(([s, a, t]) => {
      setStats(s);
      setAssinantes(Array.isArray(a) ? a : []);
      setTemplates(Array.isArray(t) ? t : []);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarTemplate = (t: Template) => {
    setAssunto(t.assunto);
    setConteudo(t.conteudo);
    setResultado(null);
    setConfirmar(false);
    setAbaAtiva("compose");
    setAbaCompose("escrever");
  };

  const excluirTemplate = async (id: number) => {
    if (!confirm("Excluir este modelo?")) return;
    const res = await fetch(`${base}/newsletter/templates/${id}`, {
      method: "DELETE", headers: hdrs(),
    });
    if (res.ok) setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const salvarComoTemplate = async () => {
    if (!nomeTemplate.trim() || !assunto.trim() || !conteudo.trim()) return;
    setSalvandoTpl(true);
    const res = await fetch(`${base}/newsletter/templates`, {
      method: "POST",
      headers: hdrs(),
      body: JSON.stringify({ nome: nomeTemplate, assunto, conteudo }),
    });
    if (res.ok) {
      const novo = await res.json();
      setTemplates(prev => [...prev, novo]);
      setSalvarAberto(false);
      setNomeTemplate("");
    }
    setSalvandoTpl(false);
  };

  const handleTestar = async () => {
    if (!emailTeste.trim() || !assunto.trim() || !conteudo.trim()) return;
    setEnviandoTeste(true);
    setResultadoTeste(null);
    try {
      const res = await fetch(`${base}/newsletter/testar`, {
        method: "POST", headers: hdrs(),
        body: JSON.stringify({
          emailTeste: emailTeste.trim(),
          assunto,
          conteudo,
          urlBotao:   usarBotao && urlBotao.trim()   ? urlBotao.trim()   : null,
          textoBotao: usarBotao && textoBotao.trim() ? textoBotao.trim() : null,
        }),
      });
      const data = await res.json();
      setResultadoTeste({ tipo: res.ok ? "ok" : "erro", msg: data.mensagem });
    } catch {
      setResultadoTeste({ tipo: "erro", msg: "Erro de conexão." });
    } finally {
      setEnviandoTeste(false);
    }
  };

  const handleEnviar = async () => {
    if (!assunto.trim() || !conteudo.trim()) return;
    setEnviando(true);
    setConfirmar(false);
    setResultado(null);
    try {
      const res = await fetch(`${base}/newsletter/enviar`, {
        method: "POST", headers: hdrs(),
        body: JSON.stringify({
          assunto,
          conteudo,
          urlBotao:   usarBotao && urlBotao.trim()   ? urlBotao.trim()   : null,
          textoBotao: usarBotao && textoBotao.trim() ? textoBotao.trim() : null,
        }),
      });
      const data = await res.json();
      setResultado({ tipo: res.ok ? "ok" : "erro", msg: data.mensagem ?? "Erro ao enviar." });
      if (res.ok) { setAssunto(""); setConteudo(""); }
    } catch {
      setResultado({ tipo: "erro", msg: "Erro de conexão." });
    } finally {
      setEnviando(false);
    }
  };

  const padrao = templates.filter(t =>  t.padrao);
  const meus   = templates.filter(t => !t.padrao);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">Newsletter</h1>
        <p className="text-gray-400 mt-1">Modelos prontos, compose e disparo para assinantes.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#12121e] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-400" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ativos</p>
          </div>
          <p className="text-3xl font-black text-white">{stats?.ativos ?? "—"}</p>
        </div>
        <div className="bg-[#12121e] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</p>
          </div>
          <p className="text-3xl font-black text-white">{stats?.total ?? "—"}</p>
        </div>
        <div className="bg-[#12121e] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Retenção</p>
          </div>
          <p className="text-3xl font-black text-white">
            {stats && stats.total > 0
              ? `${Math.round((stats.ativos / stats.total) * 100)}%`
              : "—"}
          </p>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex lg:hidden bg-[#12121e] border border-white/5 rounded-xl p-1 gap-1">
        {(["templates", "compose"] as const).map(aba => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              abaAtiva === aba ? "bg-green-500/10 text-green-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {aba === "templates" ? "📋 Modelos" : "✉️ Compor"}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex gap-6 items-start">

        {/* ── TEMPLATES SIDEBAR ───────────────────────────────── */}
        <div className={`w-full lg:w-72 flex-shrink-0 space-y-4 ${abaAtiva === "compose" ? "hidden lg:block" : "block"}`}>
          <div className="bg-[#12121e] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-black text-gray-300 uppercase tracking-wider">Modelos padrão</span>
            </div>
            <div className="divide-y divide-white/5">
              {padrao.map(t => (
                <TemplateCard key={t.id} t={t} onUsar={carregarTemplate} />
              ))}
            </div>
          </div>

          <div className="bg-[#12121e] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-black text-gray-300 uppercase tracking-wider">Meus modelos</span>
              </div>
              <span className="text-[10px] text-gray-500">{meus.length} salvo(s)</span>
            </div>
            {meus.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-gray-600">Nenhum modelo salvo ainda.</p>
                <p className="text-[10px] text-gray-700 mt-1">Compose e clique em "Salvar modelo".</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {meus.map(t => (
                  <TemplateCard key={t.id} t={t} onUsar={carregarTemplate} onExcluir={excluirTemplate} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── COMPOSE CARD ────────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-5 ${abaAtiva === "templates" ? "hidden lg:block" : "block"}`}>
          <div className="bg-[#12121e] border border-white/5 rounded-2xl overflow-hidden">

            {/* Card header */}
            <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-green-400" /> Compor
                </h2>
                {/* Write / Preview tabs */}
                <div className="flex items-center bg-white/5 rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => setAbaCompose("escrever")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      abaCompose === "escrever"
                        ? "bg-[#12121e] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <PenLine className="w-3 h-3" /> Escrever
                  </button>
                  <button
                    onClick={() => setAbaCompose("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      abaCompose === "preview"
                        ? "bg-[#12121e] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                </div>
              </div>

              {/* Save template */}
              {!salvarAberto ? (
                <button
                  onClick={() => { setSalvarAberto(true); setTimeout(() => nomeRef.current?.focus(), 50); }}
                  disabled={!assunto.trim() || !conteudo.trim()}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar modelo
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    ref={nomeRef}
                    value={nomeTemplate}
                    onChange={e => setNomeTemplate(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") salvarComoTemplate();
                      if (e.key === "Escape") setSalvarAberto(false);
                    }}
                    placeholder="Nome do modelo..."
                    maxLength={100}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 text-xs focus:border-green-500/50 focus:outline-none w-44 transition-all"
                  />
                  <button
                    onClick={salvarComoTemplate}
                    disabled={salvandoTpl || !nomeTemplate.trim()}
                    className="flex items-center gap-1 bg-green-500/15 hover:bg-green-500/25 text-green-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                  >
                    {salvandoTpl ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Salvar
                  </button>
                  <button onClick={() => setSalvarAberto(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {resultado && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border mb-5 ${
                  resultado.tipo === "ok"
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20"
                }`}>
                  {resultado.tipo === "ok"
                    ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    : <AlertCircle  className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                  <p className={`text-sm font-bold ${resultado.tipo === "ok" ? "text-green-400" : "text-red-400"}`}>
                    {resultado.msg}
                  </p>
                </div>
              )}

              {/* ── ESCREVER ────────────────────────────── */}
              <div className={abaCompose === "escrever" ? "space-y-5" : "hidden"}>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Assunto</label>
                  <input
                    type="text"
                    value={assunto}
                    onChange={e => setAssunto(e.target.value)}
                    maxLength={150}
                    placeholder="Ex: 📰 Nova publicação: Análise do mercado de Sinop"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Conteúdo</label>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <EditorNoticias value={conteudo} onChange={setConteudo} />
                  </div>
                </div>

                {/* CTA Button */}
                <div className={`rounded-xl border transition-all ${usarBotao ? "border-green-500/20 bg-green-500/5" : "border-white/5 bg-white/2"}`}>
                  <button
                    type="button"
                    onClick={() => setUsarBotao(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <MousePointerClick className={`w-4 h-4 ${usarBotao ? "text-green-400" : "text-gray-500"}`} />
                      <span className={`text-sm font-bold ${usarBotao ? "text-green-400" : "text-gray-400"}`}>
                        Adicionar botão de chamada para ação (CTA)
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${usarBotao ? "bg-green-500/20 text-green-400" : "bg-white/5 text-gray-500"}`}>
                      {usarBotao ? "Ativado" : "Opcional"}
                    </span>
                  </button>

                  {usarBotao && (
                    <div className="px-4 pb-4 space-y-3 border-t border-green-500/10 pt-3">
                      <p className="text-xs text-gray-500">
                        Um botão verde será inserido no final do e-mail, compatível com Gmail, Outlook e Apple Mail.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                            <Link2 className="w-3 h-3 inline mr-1" /> URL de destino
                          </label>
                          <input
                            type="url"
                            value={urlBotao}
                            onChange={e => setUrlBotao(e.target.value)}
                            placeholder="https://urbanoconnect.com.br/noticias/123"
                            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:border-green-500/50 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                            Texto do botão
                          </label>
                          <input
                            type="text"
                            value={textoBotao}
                            onChange={e => setTextoBotao(e.target.value)}
                            maxLength={60}
                            placeholder="Ver conteúdo completo"
                            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:border-green-500/50 focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── PREVIEW ─────────────────────────────── */}
              {abaCompose === "preview" && (
                <div>
                  {/* Assunto banner */}
                  {assunto && (
                    <div className="mb-4 px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex-shrink-0">Assunto</span>
                      <span className="text-sm text-white font-semibold truncate">{assunto}</span>
                    </div>
                  )}
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <EmailPreviewPanel html={emailHtml} />
                  </div>
                  <p className="text-[11px] text-gray-600 mt-2 text-center">
                    Preview exato do e-mail que será recebido pelos assinantes
                  </p>
                </div>
              )}
            </div>

            {/* Footer: test + send (always visible) */}
            <div className="px-6 pb-6 space-y-4 border-t border-white/5 pt-5">

              {/* Test email */}
              {!testeAberto ? (
                <button
                  onClick={() => { setTesteAberto(true); setResultadoTeste(null); }}
                  disabled={!assunto.trim() || !conteudo.trim()}
                  className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-yellow-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <FlaskConical className="w-3.5 h-3.5" /> Enviar e-mail de teste
                </button>
              ) : (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5" /> Envio de teste — só você vai receber
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailTeste}
                      onChange={e => setEmailTeste(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleTestar()}
                      placeholder="seu@email.com"
                      className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:border-yellow-500/50 focus:outline-none transition-all"
                    />
                    <button
                      onClick={handleTestar}
                      disabled={enviandoTeste || !emailTeste.trim()}
                      className="flex items-center gap-1.5 bg-yellow-500/15 hover:bg-yellow-500/25 disabled:opacity-50 text-yellow-400 font-bold text-sm px-4 py-2.5 rounded-lg transition-all"
                    >
                      {enviandoTeste ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {enviandoTeste ? "Enviando..." : "Enviar teste"}
                    </button>
                    <button onClick={() => setTesteAberto(false)} className="text-gray-500 hover:text-gray-300 transition-colors px-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {resultadoTeste && (
                    <p className={`text-xs font-bold flex items-center gap-1.5 ${resultadoTeste.tipo === "ok" ? "text-green-400" : "text-red-400"}`}>
                      {resultadoTeste.tipo === "ok"
                        ? <CheckCircle2 className="w-3.5 h-3.5" />
                        : <AlertCircle  className="w-3.5 h-3.5" />}
                      {resultadoTeste.msg}
                    </p>
                  )}
                </div>
              )}

              {/* Send to list */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <p className="text-xs text-gray-500">
                  Enviar para <span className="text-white font-bold">{stats?.ativos ?? 0}</span> assinante(s) ativo(s)
                </p>
                {!confirmar ? (
                  <button
                    onClick={() => setConfirmar(true)}
                    disabled={!assunto.trim() || !conteudo.trim() || (stats?.ativos ?? 0) === 0}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-6 py-3 rounded-xl text-sm transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" /> Enviar newsletter
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setConfirmar(false)}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:bg-white/5 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleEnviar}
                      disabled={enviando}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-60 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
                    >
                      {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {enviando ? "Enviando..." : `Confirmar — ${stats?.ativos} pessoas`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscriber list */}
          {assinantes.length > 0 && (
            <div className="bg-[#12121e] border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="font-black text-white text-sm">Assinantes ativos</h2>
              </div>
              <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                {assinantes.map(a => (
                  <div key={a.id} className="px-6 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{a.nome || a.email}</p>
                      {a.nome && <p className="text-xs text-gray-500 truncate">{a.email}</p>}
                    </div>
                    <p className="text-xs text-gray-500 flex-shrink-0">
                      {new Date(a.dataCadastro).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Email preview inside a scaled iframe ─────────────────────────────────────

function EmailPreviewPanel({ html }: { html: string }) {
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const iframeRef   = useRef<HTMLIFrameElement>(null);
  const [scale, setScale]               = useState(1);
  const [contentHeight, setContentHeight] = useState(820);

  useEffect(() => {
    const measure = () => {
      if (wrapperRef.current) {
        const w = wrapperRef.current.clientWidth;
        setScale(Math.min(1, (w - 2) / 620));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  const handleLoad = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc) {
        const h = doc.documentElement.scrollHeight;
        if (h > 100) setContentHeight(h);
      }
    } catch { /* sandboxed */ }
  };

  return (
    <div
      ref={wrapperRef}
      style={{ height: Math.ceil(contentHeight * scale) + 4, position: "relative", overflow: "hidden" }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={html}
        onLoad={handleLoad}
        sandbox="allow-same-origin"
        title="Preview do e-mail"
        style={{
          display: "block",
          width: "620px",
          height: contentHeight,
          border: "none",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  t,
  onUsar,
  onExcluir,
}: {
  t: Template;
  onUsar: (t: Template) => void;
  onExcluir?: (id: number) => void;
}) {
  return (
    <div className="group px-4 py-3 hover:bg-white/3 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-200 truncate">{t.nome}</p>
          <p className="text-[11px] text-gray-500 truncate mt-0.5">{t.assunto}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {!t.padrao && onExcluir && (
            <button
              onClick={() => onExcluir(t.id)}
              className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
              title="Excluir modelo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onUsar(t)}
            className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 hover:bg-green-500/20 px-2.5 py-1.5 rounded-lg transition-all"
          >
            Usar <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
