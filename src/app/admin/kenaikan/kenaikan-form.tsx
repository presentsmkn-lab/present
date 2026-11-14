"use client";

import { useMemo, useState } from "react";
import { confirmKenaikanAction } from "@/actions/admin";
import { SubmitButton } from "@/components/submit-button";
import { Alert, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export type KenaikanMember = {
  id: string;
  nis: string;
  nama_lengkap: string;
  kelas: string;
  rombel: string;
  jurusan: string;
};

const KELAS_ORDER = ["X", "XI", "XII"] as const;
const KELAS_TONE = { X: "blue", XI: "navy", XII: "amber" } as const;

export function KenaikanForm({ members }: { members: KenaikanMember[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(members.map((m) => m.id)));

  const retained = useMemo(
    () => members.filter((m) => !selected.has(m.id)),
    [members, selected],
  );

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(members.map((m) => m.id)));
  }

  function clearAll() {
    setSelected(new Set());
  }

  const groups = KELAS_ORDER.map((kelas) => ({
    kelas,
    items: members.filter((m) => m.kelas === kelas),
  })).filter((group) => group.items.length > 0);

  const confirmText =
    retained.length > 0
      ? `Jalankan kenaikan kelas? ${selected.size} siswa akan naik dan ${retained.length} siswa ditandai tinggal kelas.`
      : `Jalankan kenaikan kelas untuk ${selected.size} siswa?`;

  return (
    <form action={confirmKenaikanAction} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={selectAll} className="btn-secondary min-h-9 px-3 py-1 text-xs">
          Pilih semua
        </button>
        <button type="button" onClick={clearAll} className="btn-secondary min-h-9 px-3 py-1 text-xs">
          Kosongkan pilihan
        </button>
        <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
          {selected.size} naik
        </span>
        <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
          {retained.length} tinggal kelas
        </span>
      </div>

      <Alert tone="warning">
        Siswa yang <strong>tidak dicentang</strong> dianggap tinggal kelas, kelasnya tidak berubah,
        dan tetap dicatat di log kenaikan. Centang semua siswa yang berhak naik. Siswa kelas XII
        yang dicentang akan menjadi <strong>LULUS</strong>.
      </Alert>

      {groups.map((group) => (
        <section key={group.kelas}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Kelas {group.kelas}
            </h3>
            <Badge tone={KELAS_TONE[group.kelas]}>{group.items.length} siswa</Badge>
            <span className="muted text-[11px]">
              → {group.kelas === "X" ? "XI" : group.kelas === "XI" ? "XII" : "LULUS"}
            </span>
          </div>
          <div className="space-y-2">
            {group.items.map((member) => {
              const checked = selected.has(member.id);
              return (
                <label
                  key={member.id}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 transition-colors dark:bg-navy-900/60",
                    checked
                      ? "border-navy-300 dark:border-navy-500/40"
                      : "border-amber-300 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/5",
                  )}
                >
                  <input
                    type="checkbox"
                    name="naik"
                    value={member.id}
                    checked={checked}
                    onChange={() => toggle(member.id)}
                    className="h-5 w-5 shrink-0 rounded border-slate-300 accent-navy-800"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {member.nama_lengkap}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      {member.nis} • {member.kelas} {member.rombel} • {member.jurusan}
                    </span>
                  </span>
                  {!checked ? <Badge tone="amber">Tinggal kelas</Badge> : null}
                </label>
              );
            })}
          </div>
        </section>
      ))}

      <SubmitButton
        className="w-full"
        confirmText={confirmText}
        pendingText="Memproses kenaikan…"
      >
        Konfirmasi Kenaikan Kelas
      </SubmitButton>
    </form>
  );
}
