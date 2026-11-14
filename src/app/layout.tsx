import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { InstallPrompt } from "@/components/install-prompt";
import { ThemeInit } from "@/components/theme-init";

export const metadata: Metadata = {
  title: {
    default: "Pencatatan Ekstrakurikuler — SMKN 10 Semarang",
    template: "%s | Ekskul SMKN 10",
  },
  description:
    "Aplikasi pencatatan presensi, keanggotaan, dan statistik kegiatan ekstrakurikuler SMKN 10 Semarang.",
  applicationName: "Ekskul SMKN 10",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Ekskul SMKN 10",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full" data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col font-sans">
        {children}
        <ThemeInit />
        <PwaRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
