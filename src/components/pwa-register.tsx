"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Service worker hanya dipasang di production. Saat development, cache
    // aset statis dapat menyajikan chunk lama dan memicu hydration mismatch.
    // Bersihkan registrasi/cache lama agar perangkat yang pernah membuka
    // aplikasi lewat IP jaringan kembali memuat kode terbaru.
    if (process.env.NODE_ENV !== "production") {
      void (async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
          }
        } catch {
          // Pembersihan bersifat opsional; aplikasi tetap berjalan.
        }
      })();
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registrasi service worker dapat gagal di browser lama; aplikasi tetap berjalan.
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
