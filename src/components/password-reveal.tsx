"use client";

import { useState } from "react";
import { EyeIcon, LockIcon } from "@/components/icons";

export function PasswordReveal({ value }: { value: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-navy-950/60">
        <LockIcon size={16} className="shrink-0 text-slate-400" />
        <code className="min-w-0 flex-1 truncate font-mono text-sm text-slate-900 dark:text-white">
          {shown ? value : "••••••••••"}
        </code>
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          className="icon-btn h-9 w-9"
          aria-label={shown ? "Sembunyikan password" : "Lihat password"}
        >
          <EyeIcon size={18} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={copy} className="btn-secondary flex-1 py-2 text-xs">
          {copied ? "Tersalin" : "Salin password"}
        </button>
        {shown ? (
          <button type="button" onClick={() => setShown(false)} className="btn-ghost py-2 text-xs">
            Sembunyikan
          </button>
        ) : null}
      </div>
    </div>
  );
}
