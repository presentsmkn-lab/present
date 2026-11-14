"use client";

import { useState } from "react";
import { deleteSemesterAction } from "@/actions/admin";
import { SubmitButton } from "@/components/submit-button";
import { AlertIcon, TrashIcon } from "@/components/icons";

export function DeleteSemesterDialog({
  id,
  label,
  active,
}: {
  id: string;
  label: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  function close() {
    setOpen(false);
    setStep(1);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="icon-btn text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
        aria-label={`Hapus ${label}`}
      >
        <TrashIcon size={18} />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-950/60 p-4 backdrop-blur-sm sm:items-center">
          <div
            className="card w-full max-w-sm shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hapus-semester-title"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200">
              <AlertIcon size={22} />
            </div>
            <h2 id="hapus-semester-title" className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
              Hapus semester?
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              <strong>{label}</strong>
              {active ? " adalah semester aktif." : "."} Semua anggota, pertemuan, presensi, dan
              riwayat perubahan pada semester ini akan ikut terhapus permanen.
            </p>

            {step === 1 ? (
              <>
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  Konfirmasi pertama: pastikan data semester ini sudah diekspor bila masih
                  dibutuhkan.
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={close} className="btn-secondary flex-1">
                    Batal
                  </button>
                  <button type="button" onClick={() => setStep(2)} className="btn-danger flex-1">
                    Lanjutkan
                  </button>
                </div>
              </>
            ) : (
              <form action={deleteSemesterAction} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="konfirmasi1" value="ya" />
                <input type="hidden" name="konfirmasi2" value="ya" />
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
                  Konfirmasi kedua: tindakan ini tidak dapat dibatalkan. Tekan tombol merah untuk
                  menghapus sekarang.
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={close} className="btn-secondary flex-1">
                    Batal
                  </button>
                  <SubmitButton variant="danger" className="flex-1" pendingText="Menghapus…">
                    Hapus Permanen
                  </SubmitButton>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
