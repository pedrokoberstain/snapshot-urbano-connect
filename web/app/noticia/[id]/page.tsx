import type { Metadata } from "next";
import NoticiaClient from "./NoticiaClient";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/noticias/${id}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return { title: "Notícia | Urbano Connect" };
    const n = await res.json();
    return {
      title: `${n.titulo} | Urbano Connect`,
      description: n.resumo ?? "Notícia do mercado imobiliário e agronegócio de Mato Grosso.",
      openGraph: {
        title: n.titulo,
        description: n.resumo ?? "",
        url: `https://urbanoconnect.com.br/noticia/${id}`,
        images: n.imagemCapa ? [{ url: n.imagemCapa, width: 1200, height: 630 }] : [],
        type: "article",
        publishedTime: n.dataPublicacao,
      },
      twitter: {
        card: "summary_large_image",
        title: n.titulo,
        description: n.resumo ?? "",
        images: n.imagemCapa ? [n.imagemCapa] : [],
      },
    };
  } catch {
    return { title: "Notícia | Urbano Connect" };
  }
}

export default function Page() {
  return <NoticiaClient />;
}
