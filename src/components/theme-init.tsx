"use client";

import { useEffect } from "react";

/** Applies the persisted theme (or system default) immediately on mount. */
export function ThemeInit() {
  useEffect(() => {
    try {
      const el = document.documentElement;
      const stored = localStorage.getItem("tema");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldDark =
        stored === "gelap" || (stored !== null && stored !== "terang" && prefersDark);
      el.classList.toggle("dark", shouldDark);
    } catch {
      // abaikan jika localStorage tidak tersedia
    }
  }, []);
  return null;
}
