import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Urbano Connect",
    short_name: "UrbanoConnect",
    description: "Plataforma de inteligência imobiliária de Mato Grosso",
    start_url: "/",
    display: "standalone",
    background_color: "#080810",
    theme_color: "#b50a6b",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}