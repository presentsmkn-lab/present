"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("tema", next ? "gelap" : "terang");
    } catch {
      // abaikan
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left dark:border-white/10 dark:bg-navy-950/50"
      aria-pressed={dark}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
          {dark ? <MoonIcon size={20} /> : <SunIcon size={20} />}
        </span>
        <span>
          <span className="block font-semibold text-slate-900 dark:text-white">Mode gelap</span>
          <span className="muted text-xs">{dark ? "Aktif" : "Nonaktif"}</span>
        </span>
      </span>
      <span
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors",
          dark ? "bg-navy-600" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
            dark ? "translate-x-6" : "translate-x-1",
          )}
        />
      </span>
    </button>
  );
}
