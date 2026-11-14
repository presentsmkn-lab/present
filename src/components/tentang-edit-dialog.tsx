"use client";

import { useState } from "react";
import Link from "next/link";
import { saveTentangAction } from "@/actions/admin";
import { SubmitButton } from "@/components/submit-button";
import { EditIcon, InfoIcon } from "@/components/icons";

function Input({
  label,
  name,
  defaultValue,
  placeholder,
  maxLength,
  required,
  hint,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={`tentang-${name}`}>
        {label}
      </label>
      <input
        id={`tentang-${name}`}
        name={name}
        type={type}
        className="input"
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
      />
      {hint ? <p className="muted mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

export function TentangEditDialog({ settings }: { settings: Record<string, string> }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary w-full"
      >
        <EditIcon size={18} /> Edit Informasi Tentang
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy-950/60 p-4 backdrop-blur-sm sm:items-center">
          <div
            className="card max-h-[90dvh] w-full max-w-lg overflow-y-auto shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tentang-edit-title"
          >
            <div className="sticky -top-4 z-10 -mx-4 -mt-4 mb-3 flex items-start gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-navy-900/95">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
                <InfoIcon size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="tentang-edit-title"
                  className="text-base font-bold text-slate-900 dark:text-white"
                >
                  Edit Informasi Tentang
                </h2>
                <p className="muted text-xs">
                  Perubahan tampil di halaman Tentang Admin dan PIC.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-btn -mr-2 -mt-1"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <form action={saveTentangAction} className="space-y-3">
              <Input
                label="Nama aplikasi"
                name="app_nama"
                required
                maxLength={120}
                defaultValue={
                  settings.app_nama || "Pencatatan Ekstrakurikuler — SMK Negeri 10 Semarang"
                }
              />
              <Input
                label="Versi aplikasi"
                name="app_versi"
                required
                maxLength={40}
                defaultValue={settings.app_versi || "v1.0.0"}
                placeholder="v1.0.0"
              />
              <div>
                <label className="label" htmlFor="tentang-app_deskripsi">
                  Deskripsi website
                </label>
                <textarea
                  id="tentang-app_deskripsi"
                  name="app_deskripsi"
                  className="input min-h-28"
                  rows={4}
                  required
                  maxLength={1200}
                  defaultValue={
                    settings.app_deskripsi ||
                    "Aplikasi pencatatan ekstrakurikuler untuk mengelola keanggotaan, jadwal latihan, presensi pertemuan, dan statistik kehadiran siswa SMK Negeri 10 Semarang."
                  }
                />
              </div>

              <div className="divider pt-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Profil pembuat aplikasi
                </p>
              </div>

              <Input
                label="Nama pembuat"
                name="nama_pembuat"
                defaultValue={settings.nama_pembuat || ""}
                maxLength={120}
                placeholder="Nama pembuat / tim"
              />
              <Input
                label="Peran / jabatan"
                name="pembuat_peran"
                defaultValue={settings.pembuat_peran || ""}
                maxLength={120}
                placeholder="Pengembang Aplikasi / Siswa XI RPL 2"
              />
              <Input
                label="Instansi / sekolah"
                name="pembuat_instansi"
                defaultValue={settings.pembuat_instansi || ""}
                maxLength={160}
                placeholder="SMK Negeri 10 Semarang"
              />
              <div>
                <label className="label" htmlFor="tentang-pembuat_bio">
                  Bio / keterangan singkat
                </label>
                <textarea
                  id="tentang-pembuat_bio"
                  name="pembuat_bio"
                  className="input min-h-24"
                  rows={3}
                  maxLength={600}
                  defaultValue={settings.pembuat_bio || ""}
                  placeholder="Ceritakan singkat tentang pembuat aplikasi."
                />
              </div>
              <Input
                label="Kontak / tautan (opsional)"
                name="link_pembuat"
                type="url"
                defaultValue={settings.link_pembuat || ""}
                maxLength={500}
                placeholder="https://contoh.com"
                hint="Harus diawali http:// atau https://. Logo pembuat akan mengarah ke tautan ini."
              />

              <p className="muted text-xs">
                Ingin mengubah logo? Buka halaman{" "}
                <Link href="/admin/branding" className="link" onClick={() => setOpen(false)}>
                  Logo & Branding
                </Link>
                .
              </p>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                  Batal
                </button>
                <SubmitButton className="flex-1">Simpan</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
