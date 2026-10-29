"use client";

import { useEffect, useRef, useState } from "react";

/**
 * SessionGuard
 * Encerra a sessão do usuário automaticamente por:
 *  1. Inatividade — sem interação (mouse/teclado/scroll/toque) por TEMPO_INATIVIDADE,
 *     exibindo um aviso AVISO_ANTES de deslogar (padrão de sistemas profissionais).
 *  2. Token expirado — ao abrir/voltar ao app, se o JWT já passou da validade
 *     (ex.: PC desligado durante a noite), desloga imediatamente.
 *
 * Roda globalmente (montado no layout raiz) e só age quando há sessão ativa.
 */

// Padrão de mercado para sistemas profissionais com painel admin + pagamentos + LGPD.
const TEMPO_INATIVIDADE = 15 * 60 * 1000; // 15 minutos até deslogar
const AVISO_ANTES       = 60 * 1000;      // mostra o aviso 1 min antes
const CHAVE_ATIVIDADE   = "ultimaAtividade";

export default function SessionGuard() {
  const timerLogout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerAviso  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalo   = useRef<ReturnType<typeof setInterval> | null>(null);
  const avisoRef    = useRef(false); // espelho do estado para uso dentro dos listeners

  const [avisoVisivel, setAvisoVisivel] = useState(false);
  const [restante, setRestante]         = useState(AVISO_ANTES / 1000);

  // Permite que o botão "Continuar conectado" dispare o reset definido dentro do effect
  const continuarRef = useRef<() => void>(() => {});

  useEffect(() => {
    const temToken = () => !!localStorage.getItem("token");

    const limparTimers = () => {
      if (timerLogout.current) clearTimeout(timerLogout.current);
      if (timerAviso.current) clearTimeout(timerAviso.current);
      if (intervalo.current) clearInterval(intervalo.current);
    };

    const setAviso = (v: boolean) => { avisoRef.current = v; setAvisoVisivel(v); };

    const encerrarSessao = () => {
      limparTimers();
      localStorage.removeItem("token");
      localStorage.removeItem("tipoUsuario");
      localStorage.removeItem("cidadeUsuario");
      localStorage.removeItem(CHAVE_ATIVIDADE);
      window.location.href = "/login?expirado=1";
    };

    // JWT já passou da validade?
    const tokenExpirado = () => {
      const t = localStorage.getItem("token");
      if (!t) return false;
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        return !payload.exp || Date.now() >= payload.exp * 1000;
      } catch {
        return true; // token ilegível = inválido
      }
    };

    const mostrarAviso = () => {
      setRestante(AVISO_ANTES / 1000);
      setAviso(true);
      intervalo.current = setInterval(() => {
        setRestante((s) => (s > 1 ? s - 1 : 0));
      }, 1000);
    };

    let ultimaGravacao = 0;
    const registrarAtividade = () => {
      if (!temToken()) return;
      if (avisoRef.current) return; // durante o aviso, só o botão reativa
      const agora = Date.now();
      if (agora - ultimaGravacao > 30_000) {
        localStorage.setItem(CHAVE_ATIVIDADE, String(agora));
        ultimaGravacao = agora;
      }
      limparTimers();
      timerAviso.current  = setTimeout(mostrarAviso, TEMPO_INATIVIDADE - AVISO_ANTES);
      timerLogout.current = setTimeout(encerrarSessao, TEMPO_INATIVIDADE);
    };

    const continuarConectado = () => {
      setAviso(false);
      ultimaGravacao = 0; // força regravar a atividade
      registrarAtividade();
    };
    continuarRef.current = continuarConectado;

    // Ao montar / voltar para a aba: valida token e tempo desde a última atividade
    const validarSessao = () => {
      if (!temToken()) return;
      if (tokenExpirado()) { encerrarSessao(); return; }
      const ultima = Number(localStorage.getItem(CHAVE_ATIVIDADE) || 0);
      if (ultima && Date.now() - ultima > TEMPO_INATIVIDADE) { encerrarSessao(); return; }
      registrarAtividade();
    };

    validarSessao();

    const eventos = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    eventos.forEach((e) => window.addEventListener(e, registrarAtividade, { passive: true }));

    const aoVoltar = () => { if (document.visibilityState === "visible") validarSessao(); };
    document.addEventListener("visibilitychange", aoVoltar);

    return () => {
      limparTimers();
      eventos.forEach((e) => window.removeEventListener(e, registrarAtividade));
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, []);

  if (!avisoVisivel) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#12121e] border border-white/10 rounded-2xl shadow-2xl p-7 text-center">
        <div className="text-4xl mb-3">⏱️</div>
        <h2 className="text-white font-black text-lg mb-2">Sua sessão vai expirar</h2>
        <p className="text-gray-400 text-sm mb-1">
          Por segurança, você será desconectado por inatividade em
        </p>
        <p className="text-green-400 font-black text-3xl tabular-nums mb-5">{restante}s</p>
        <button
          onClick={() => continuarRef.current()}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors outline-none"
        >
          Continuar conectado
        </button>
      </div>
    </div>
  );
}
