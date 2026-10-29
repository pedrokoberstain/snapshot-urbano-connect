"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import FormularioNoticia from "../../FormularioNoticia";

export default function EditarNoticia() {
  const { id } = useParams();
  const [noticia, setNoticia] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") ?? "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/noticias/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setNoticia(data))
      .finally(() => setCarregando(false));
  }, [id]);

  if (carregando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!noticia) {
    return <p className="text-red-400 font-bold">Notícia não encontrada.</p>;
  }

  return <FormularioNoticia dadosIniciais={noticia} noticiaId={Number(id)} />;
}
