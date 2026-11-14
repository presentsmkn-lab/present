import { SchoolLogo } from "@/components/ui";
import { RetryButton } from "./retry-button";

export const metadata = { title: "Anda sedang offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <SchoolLogo size={72} rounded="rounded-3xl" />
      <h1 className="mt-6 text-2xl font-bold text-navy-900 dark:text-white">Anda sedang offline</h1>
      <p className="muted mt-2 max-w-sm">
        Koneksi internet tidak tersedia. Periksa jaringan Anda, lalu coba lagi. Data yang sudah
        tersimpan di server tidak akan hilang.
      </p>
      <div className="mt-6">
        <RetryButton />
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Halaman yang sedang dibuka mungkin memerlukan koneksi untuk menampilkan data terbaru.
      </p>
    </main>
  );
}
