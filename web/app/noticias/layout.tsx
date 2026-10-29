import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notícias · Agronegócio, Imobiliário e Economia de MT | Urbano Connect",
  description:
    "Portal de notícias e análises do mercado imobiliário e agronegócio de Mato Grosso. BR-163, IVAA, Ferrovia, cotações e inteligência de mercado.",
  openGraph: {
    title: "Notícias de MT · Agro, Imóveis e Economia | Urbano Connect",
    description:
      "Análises independentes sobre o mercado imobiliário e agronegócio de Mato Grosso.",
    url: "https://urbanoconnect.com.br/noticias",
    images: [{ url: "https://urbanoconnect.com.br/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
