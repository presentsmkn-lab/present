"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateSemesterDatesAction } from "@/actions/admin";
import { SubmitButton } from "@/components/submit-button";
import { CalendarIcon } from "@/components/icons";
import { formatTanggal } from "@/lib/date";

/** Menutup dialog setelah server action selesai (berhasil maupun gagal). */
function CloseWhenDone({ onDone }: { onDone: () => void }) {
  const { pending } = useFormStatus();
  const started = useRef(false);

  useEffect(() => {
    if (pending) {
      started.current = true;
      return;
    }
    if (started.current) {
      started.current = false;
      onDone();
    }
  }, [pending, onDone]);

  return null;
}

export function SemesterDatesDialog({
  id,
  label,
  tanggalMulai,
  tanggalSelesai,
  defaultMulai,
  defaultSelesai,
}: {
  id: string;
  label: string;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  defaultMulai: string;
  defaultSelesai: string;
}) {
  const initialMulai = tanggalMulai ?? defaultMulai;
  const initialSelesai = tanggalSelesai ?? defaultSelesai;

  const [open, setOpen] = useState(false);
  const [mulai, setMulai] = useState(initialMulai);
  const [selesai, setSelesai] = useState(initialSelesai);
  const invalid = !mulai || !selesai || selesai < mulai;
  const isDefault = mulai === defaultMulai && selesai === defaultSelesai;

  function close() {
    setOpen(false);
  }

  function openDialog() {
    setMulai(tanggalMulai ?? defaultMulai);
    setSelesai(tanggalSelesai ?? defaultSelesai);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="icon-btn"
        aria-label={`Atur tanggal ${label}`}
      >
        <CalendarIcon size={18} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-950/60 p-4 backdrop-blur-sm sm:items-center">
          <div
            className="card w-full max-w-sm shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`tanggal-semester-${id}`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
              <CalendarIcon size={22} />
            </div>
            <h2
              id={`tanggal-semester-${id}`}
              className="mt-3 text-lg font-bold text-slate-900 dark:text-white"
            >
              Atur tanggal semester
            </h2>
            <p className="muted mt-1 text-sm">{label}</p>

            <form action={updateSemesterDatesAction} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={id} />
              <CloseWhenDone onDone={close} />

              <div>
                <label className="label" htmlFor={`mulai-${id}`}>
                  Tanggal mulai
                </label>
                <input
                  id={`mulai-${id}`}
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
                <label className="label" htmlFor={`selesai-${id}`}>
                  Tanggal selesai
                </label>
                <input
                  id={`selesai-${id}`}
                  name="tanggal_selesai"
                  type="date"
                  required
                  value={selesai}
                  min={mulai || undefined}
                  onChange={(event) => setSelesai(event.target.value)}
                  className="input"
                />
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
                  Pakai default
                </button>
              </div>

              {invalid ? (
                <p role="alert" className="text-xs font-semibold text-red-600 dark:text-red-300">
                  Tanggal selesai harus sama atau setelah tanggal mulai.
                </p>
              ) : null}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={close} className="btn-secondary flex-1">
                  Batal
                </button>
                <SubmitButton className="flex-1" disabled={invalid}>
                  Simpan
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
