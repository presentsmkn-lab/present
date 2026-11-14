import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  // Next.js hanya mengetik purpose tunggal, sedangkan Web App Manifest
  // mengizinkan kombinasi "any maskable". Cast di bawah mempertahankan
  // nilai runtime yang benar untuk Chrome/Android.
  const icons = [
    {
      src: "/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any maskable",
    },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any maskable",
    },
    {
      src: "/icons/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ] as unknown as NonNullable<MetadataRoute.Manifest["icons"]>;

  return {
    name: "Presensi Ekskul SMKN 10 Semarang",
    short_name: "Ekskul SMKN 10",
    description:
      "Pencatatan presensi, keanggotaan, dan statistik ekstrakurikuler SMKN 10 Semarang.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1120",
    theme_color: "#2563eb",
    lang: "id",
    categories: ["education", "productivity"],
    icons,
    shortcuts: [
      { name: "Presensi", url: "/pic" },
      { name: "Pengaturan", url: "/pic/pengaturan" },
    ],
  };
}
