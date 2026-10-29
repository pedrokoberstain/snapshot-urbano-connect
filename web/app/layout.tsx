import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "./components/CookieBanner";
import SessionGuard from "./components/SessionGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#22c55e",
};

export const metadata: Metadata = {
  title: "Urbano Connect",
  description: "Plataforma de inteligência imobiliária de Mato Grosso",
  openGraph: {
    title: "Urbano Connect",
    description: "Plataforma de inteligência imobiliária de Mato Grosso. Imóveis urbanos, fazendas e dados de mercado em um só lugar.",
    url: "https://urbanoconnect.com.br",
    siteName: "Urbano Connect",
    images: [
      {
        url: "https://urbanoconnect.com.br/og-image.png",
        width: 1200,
        height: 630,
        alt: "Urbano Connect — Inteligência Imobiliária do Mato Grosso",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Urbano Connect",
    description: "Plataforma de inteligência imobiliária de Mato Grosso.",
    images: ["https://urbanoconnect.com.br/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "128x128", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        {children}
        <SessionGuard />
        <CookieBanner />
      </body>
    </html>
  );
}