'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'uc-cookie-consent';
const CONSENT_VERSION = '1.0';

type Consentimento = {
  versao: string;
  data: string;
  analytics: boolean;
};

export function getCookieConsent(): Consentimento | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const consent = JSON.parse(raw) as Consentimento;
    // Se a versão da política mudou, pede consentimento de novo
    if (consent.versao !== CONSENT_VERSION) return null;
    return consent;
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) {
      setVisivel(true);
    }
  }, []);

  const salvar = (analytics: boolean) => {
    const consent: Consentimento = {
      versao: CONSENT_VERSION,
      data: new Date().toISOString(),
      analytics,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setVisivel(false);
  };

  if (!visivel) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 inset-x-0 z-[100] bg-zinc-900 text-white shadow-2xl border-t border-zinc-700"
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-zinc-200 flex-1">
          Usamos cookies essenciais para o funcionamento da plataforma (login e preferências).
          Com o seu consentimento, também podemos usar cookies de análise para melhorar a sua
          experiência, conforme a <strong>LGPD</strong>. Saiba mais na nossa{' '}
          <Link href="/privacidade" className="underline text-green-400 hover:text-green-300">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => salvar(false)}
            className="px-4 py-2 text-sm rounded-lg border border-zinc-600 text-zinc-200 hover:bg-zinc-800 transition"
          >
            Apenas essenciais
          </button>
          <button
            onClick={() => salvar(true)}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-500 font-semibold transition"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
