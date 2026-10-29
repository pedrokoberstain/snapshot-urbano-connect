import type { Metadata } from "next";
import { getCidadeBySlug } from "../../data/cidades";
import CidadeClient from "./CidadeClient";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const cidade = getCidadeBySlug(slug);
  if (!cidade) return { title: "Cidade não encontrada | Urbano Connect" };
  return {
    title: `${cidade.nome} · Mercado Imobiliário e Score | Urbano Connect`,
    description: `${cidade.descricao} Veja imóveis, notícias e análise de mercado em ${cidade.nome}, MT.`,
    openGraph: {
      title: `${cidade.nome}, MT | Urbano Connect`,
      description: cidade.descricao,
      url: `https://urbanoconnect.com.br/cidade/${slug}`,
      images: [{ url: cidade.imagem, width: 1200, height: 630, alt: cidade.nome }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cidade.nome}, MT | Urbano Connect`,
      description: cidade.descricao,
      images: [cidade.imagem],
    },
  };
}

export default function Page() {
  return <CidadeClient />;
}
