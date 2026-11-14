"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DownloadIcon, InfoIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "pwa_prompt_terakhir";
const DAY = 24 * 60 * 60 * 1000;
const INSTALL_EVENT = "ekskul:pwa-install";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function subscribeStandalone(callback: () => void): () => void {
  const query = window.matchMedia("(display-mode: standalone)");
  window.addEventListener("appinstalled", callback);
  query.addEventListener?.("change", callback);
  return () => {
    window.removeEventListener("appinstalled", callback);
    query.removeEventListener?.("change", callback);
  };
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS 13+ dapat melaporkan diri sebagai Macintosh.
  return /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
}

function dismissedRecently(): boolean {
  try {
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    return Date.now() - last < DAY;
  } catch {
    return false;
  }
}

function rememberDismiss(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* abaikan */
  }
}

function forgetDismiss(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* abaikan */
  }
}

/** Pop-up tawaran install. Dipasang sekali di root layout. */
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [ios] = useState(isIOS);
  const [installed, setInstalled] = useState(isStandalone);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    const handler = (event: Event) => {
      // Cegah mini-infobar bawaan; kita tampilkan bottom-sheet sendiri.
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      deferredRef.current = promptEvent;
      setDeferred(promptEvent);
      if (!dismissedRecently() && !isStandalone()) setVisible(true);
    };

    const installedHandler = () => {
      setInstalled(true);
      setVisible(false);
      deferredRef.current = null;
      setDeferred(null);
      forgetDismiss();
    };

    const manualHandler = () => {
      if (isStandalone()) {
        setInstalled(true);
        return;
      }
      setVisible(true);
    };

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const standaloneHandler = () => {
      if (standaloneQuery.matches) setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    window.addEventListener(INSTALL_EVENT, manualHandler);
    standaloneQuery.addEventListener?.("change", standaloneHandler);

    // iOS/Safari tidak mendukung beforeinstallprompt. Tampilkan panduan
    // manual setelah halaman siap, kecuali baru saja ditutup pengguna.
    let timer: number | undefined;
    if (isIOS() && !dismissedRecently()) {
      timer = window.setTimeout(() => setVisible(true), 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      window.removeEventListener(INSTALL_EVENT, manualHandler);
      standaloneQuery.removeEventListener?.("change", standaloneHandler);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const dismiss = useCallback(() => {
    rememberDismiss();
    setVisible(false);
  }, []);

  async function install() {
    const current = deferredRef.current;
    if (!current) return;
    await current.prompt();
    const choice = await current.userChoice;
    deferredRef.current = null;
    setDeferred(null);
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setVisible(false);
      forgetDismiss();
    } else {
      dismiss();
    }
  }

  if (!visible || installed) return null;

  return (
    <div
      className="no-print fixed inset-0 z-[70] flex items-end justify-center bg-navy-950/55 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={dismiss}
    >
      <div
        className="card w-full max-w-md rounded-t-3xl p-5 shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white dark:bg-blue-600">
            <DownloadIcon size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="install-title" className="text-lg font-bold text-navy-900 dark:text-white">
              Pasang Aplikasi
            </h2>
            <p className="muted mt-1 text-sm">
              Pasang Presensi Ekskul SMKN 10 di layar utama HP agar bisa dibuka cepat seperti
              aplikasi biasa.
            </p>
          </div>
        </div>

        {ios ? (
          <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
            <p className="flex items-start gap-2 font-semibold">
              <InfoIcon size={18} className="mt-0.5 shrink-0" />
              Panduan untuk iPhone/iPad (Safari)
            </p>
            <ol className="ml-6 list-decimal space-y-1 text-xs sm:text-sm">
              <li>
                Ketuk ikon <strong>Bagikan (Share)</strong> di bagian bawah browser Safari.
              </li>
              <li>
                Pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>, lalu ketuk
                <strong> Tambah</strong>.
              </li>
            </ol>
          </div>
        ) : deferred ? (
          <button type="button" onClick={install} className="btn-primary mt-4 w-full">
            <DownloadIcon size={18} /> Install Sekarang
          </button>
        ) : (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200">
            <InfoIcon size={18} className="mt-0.5 shrink-0" />
            <span>
              Buka menu browser (titik tiga), lalu pilih <strong>Instal aplikasi</strong> atau{" "}
              <strong>Tambahkan ke layar utama</strong>.
            </span>
          </div>
        )}

        <button type="button" onClick={dismiss} className="btn-ghost mt-2 w-full">
          Nanti saja
        </button>
      </div>
    </div>
  );
}

/** Tombol manual untuk memicu pop-up install dari halaman Pengaturan. */
export function InstallAppButton({ className }: { className?: string }) {
  const installed = useSyncExternalStore(
    subscribeStandalone,
    isStandalone,
    () => false,
  );

  if (installed) {
    return (
      <div
        className={cn(
          "flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
          className,
        )}
      >
        <DownloadIcon size={18} /> Aplikasi sudah terpasang
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(INSTALL_EVENT))}
      className={cn("btn-primary w-full", className)}
    >
      <DownloadIcon size={18} /> Install Aplikasi ke HP
    </button>
  );
}
