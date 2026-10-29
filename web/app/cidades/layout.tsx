import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "25 Cidades de Mato Grosso · Ranking e Scores | Urbano Connect",
  description:
    "O maior índice de cidades de Mato Grosso. Scores, rankings, análise imobiliária e dados de mercado das 25 principais cidades de MT — de Cuiabá a Sorriso.",
  openGraph: {
    title: "25 Cidades de Mato Grosso · Ranking e Scores | Urbano Connect",
    description:
      "Scores, rankings e análise imobiliária das 25 principais cidades de MT.",
    url: "https://urbanoconnect.com.br/cidades",
    images: [{ url: "https://urbanoconnect.com.br/og-image.png", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
