"use client";

import { useState } from "react";
import { createNextSemesterAction } from "@/actions/admin";
import { SubmitButton } from "@/components/submit-button";
import { formatTanggal } from "@/lib/date";

export function CreateSemesterForm({
  nextLabel,
  previousLabel,
  defaultMulai,
  defaultSelesai,
}: {
  nextLabel: string;
  previousLabel: string | null;
  defaultMulai: string;
  defaultSelesai: string;
}) {
  const [mulai, setMulai] = useState(defaultMulai);
  const [selesai, setSelesai] = useState(defaultSelesai);
  const isDefault = mulai === defaultMulai && selesai === defaultSelesai;
  const invalid = !mulai || !selesai || selesai < mulai;

  return (
    <form action={createNextSemesterAction} className="mt-4 space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-white/10 dark:bg-white/5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Periode semester
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
          {invalid
            ? "Lengkapi tanggal semester"
            : `${formatTanggal(mulai)} – ${formatTanggal(selesai)}`}
        </p>
        <p className="muted mt-0.5 text-xs">
          {nextLabel}
          {previousLabel ? ` • setelah ${previousLabel}` : " • semester pertama"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="tanggal_mulai">
            Tanggal mulai
          </label>
          <input
            id="tanggal_mulai"
            name="tanggal_mulai"
            type="date"
            required
            value={mulai}
            max={selesai || undefined}
            onChange={(event) => setMulai(event.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="tanggal_selesai">
            Tanggal selesai
          </label>
          <input
            id="tanggal_selesai"
            name="tanggal_selesai"
            type="date"
            required
            value={selesai}
            min={mulai || undefined}
            onChange={(event) => setSelesai(event.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="muted text-xs">
          Default: {formatTanggal(defaultMulai)} – {formatTanggal(defaultSelesai)}
        </p>
        <button
          type="button"
          onClick={() => {
            setMulai(defaultMulai);
            setSelesai(defaultSelesai);
          }}
          disabled={isDefault}
          className="shrink-0 text-xs font-semibold text-navy-700 underline-offset-2 hover:underline disabled:text-slate-400 disabled:no-underline dark:text-navy-300 dark:disabled:text-slate-500"
        >
          Pakai tanggal default
        </button>
      </div>

      {invalid ? (
        <p role="alert" className="text-xs font-semibold text-red-600 dark:text-red-300">
          Tanggal selesai harus sama atau setelah tanggal mulai.
        </p>
      ) : null}

      <SubmitButton
        className="w-full"
        disabled={invalid}
        confirmText={`Buat dan aktifkan ${nextLabel}?\n\nPeriode: ${formatTanggal(mulai)} – ${formatTanggal(selesai)}`}
      >
        Buat Semester Berikutnya
      </SubmitButton>
    </form>
  );
}
