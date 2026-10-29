import type { NextConfig } from "next";

// ── Security headers modernos (OWASP Secure Headers) aplicados a todas as rotas ──
const securityHeaders = [
  {
    // Força HTTPS por 1 ano (inclui subdomínios)
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    // Impede o site de ser embutido em iframes (clickjacking)
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Impede o navegador de "adivinhar" o content-type (MIME sniffing)
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Não vaza a URL de origem para sites externos
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Bloqueia APIs sensíveis do navegador que o site não usa
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    // CSP: mitiga XSS limitando de onde scripts/estilos/imagens podem vir.
    // 'unsafe-inline'/'unsafe-eval' são exigidos pelo Next.js e bibliotecas de UI.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://upload-widget.cloudinary.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      // Imagens vêm de fontes diversas (notícias importadas, sites de prefeituras, Unsplash) —
      // liberar qualquer origem HTTPS; a proteção contra XSS fica no script-src restrito.
      "img-src 'self' data: blob: https:",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? ""} https://api.cloudinary.com https://api.mercadopago.com https://viacep.com.br https://servicodados.ibge.gov.br https://nominatim.openstreetmap.org`,
      "frame-src https://www.mercadopago.com.br https://www.mercadopago.com https://upload-widget.cloudinary.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
