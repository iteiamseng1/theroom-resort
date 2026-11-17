import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TheRoom Resort ชุมแพ",
    short_name: "TheRoom Resort",
    description: "ระบบบริหารจัดการโรงแรม ที่พักรายเดือน ห้องอาหาร POS และแม่บ้าน",
    start_url: "/",
    display: "standalone",
    background_color: "#2D160B",
    theme_color: "#2D160B",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
