import type { MetadataRoute } from "next";
import { toolMeta } from "@/text/meta";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "e6nlaq's Lab",
    short_name: "e6nlaq's Lab",
    description: toolMeta[""].description,
    lang: "ja",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f1f1f1",
    theme_color: "#ffffff",
    categories: ["utilities", "education", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Tools",
        short_name: "Tools",
        url: "/tools",
      },
      {
        name: "QR Reader",
        short_name: "QR Reader",
        url: "/tools/qr-reader",
      },
    ],
  };
}
