import Link from "next/link";
import { SchoolLogo } from "@/components/ui";
import { CheckIcon, InfoIcon, SchoolIcon, UsersIcon } from "@/components/icons";

const FITUR_UTAMA = [
  "Manajemen multi-semester dengan semester aktif dan riwayat per periode.",
  "Presensi pertemuan digital: Hadir, Izin, Sakit, atau Tidak Hadir (Alpa).",
  "Statistik real-time: persentase kehadiran, komposisi status, dan siswa tidak masuk beruntun.",
  "Export Excel rapi dengan satu sheet per semester beserta grafik.",
  "Dukungan PWA: dapat dipasang di layar utama Android maupun iPhone.",
];

export function TentangView({
  settings,
  role,
}: {
  settings: Record<string, string>;
  role: "admin" | "pic";
}) {
  const appNama =
    settings.app_nama?.trim() || "Pencatatan Ekstrakurikuler — SMK Negeri 10 Semarang";
  const appVersi = settings.app_versi?.trim() || "v1.0.0";
  const appDeskripsi =
    settings.app_deskripsi?.trim() ||
    "Aplikasi pencatatan ekstrakurikuler untuk mengelola keanggotaan, jadwal latihan, presensi pertemuan, dan statistik kehadiran siswa SMK Negeri 10 Semarang. Seluruh data tersimpan aman dan dapat diekspor menjadi laporan Excel.";
  const namaPembuat = settings.nama_pembuat?.trim() || "";
  const peranPembuat = settings.pembuat_peran?.trim() || "";
  const instansiPembuat = settings.pembuat_instansi?.trim() || "";
  const bioPembuat = settings.pembuat_bio?.trim() || "";
  const linkPembuat = settings.link_pembuat?.trim() || "";
  const creatorLogo = settings.logo_pembuat_url;

  return (
    <div className="space-y-4">
      {/* Identitas website */}
      <section className="card">
        <div className="flex flex-col items-center text-center">
          <SchoolLogo src={settings.logo_sekolah_url} size={76} rounded="rounded-3xl" />
          <h2 className="mt-3 break-words text-lg font-bold text-navy-900 dark:text-white">
            {appNama}
          </h2>
          <p className="muted text-sm">SMK Negeri 10 Semarang</p>
          <span className="mt-2 inline-flex items-center rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-semibold text-navy-700 dark:bg-white/10 dark:text-navy-200">
            Versi {appVersi}
          </span>
          <p className="muted mt-3 whitespace-pre-line break-words text-sm">{appDeskripsi}</p>
        </div>
      </section>

      {/* Profil pembuat */}
      <section className="card">
        <h3 className="mb-3 flex items-center justify-center gap-2 font-semibold text-slate-900 dark:text-white">
          <UsersIcon size={18} /> Profil Pembuat Aplikasi
        </h3>

        <div className="flex flex-col items-center text-center">
          {creatorLogo ? (
            <a
              href={linkPembuat || "#"}
              target={linkPembuat ? "_blank" : undefined}
              rel="noreferrer"
              className="inline-flex justify-center transition-transform active:scale-[0.97]"
              aria-label={`Kontak ${namaPembuat || "pembuat aplikasi"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creatorLogo}
                alt={namaPembuat || "Logo pembuat aplikasi"}
                className="h-16 w-auto max-w-[220px] object-contain"
              />
            </a>
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-white/10 dark:text-navy-200">
              <UsersIcon size={26} />
            </span>
          )}

          <p className="mt-3 break-words text-sm font-semibold text-slate-900 dark:text-white">
            {namaPembuat || "Nama pembuat belum diatur"}
          </p>
          {peranPembuat ? (
            <p className="muted break-words text-xs">{peranPembuat}</p>
          ) : null}
          {instansiPembuat ? (
            <p className="muted mt-0.5 break-words text-xs">{instansiPembuat}</p>
          ) : null}
          {bioPembuat ? (
            <p className="muted mt-2 whitespace-pre-line break-words text-sm">{bioPembuat}</p>
          ) : null}

          {linkPembuat ? (
            <a
              href={linkPembuat}
              target="_blank"
              rel="noreferrer"
              className="link mt-2 inline-block break-all text-sm"
            >
              Kunjungi kontak / tautan pembuat
            </a>
          ) : (
            <p className="muted mt-2 text-xs">Kontak/tautan pembuat belum diatur.</p>
          )}

          {creatorLogo ? (
            <p className="muted mt-3 text-[11px]">
              Logo pembuat dapat diklik menuju tautan yang ditetapkan admin.
            </p>
          ) : null}
        </div>
      </section>

      {/* Ringkasan fitur */}
      <section className="card">
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <InfoIcon size={18} /> Fitur Utama
        </h3>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {FITUR_UTAMA.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckIcon size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Keamanan data */}
      <section className="card">
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <SchoolIcon size={18} /> Keamanan & Data
        </h3>
        <p className="muted text-sm">
          Seluruh data disimpan di Supabase (PostgreSQL) dan hanya diakses melalui server aplikasi.
          Password PIC disimpan terenkripsi AES-256-GCM dan tidak pernah dikirim ke browser pengguna
          lain. Cookie session bersifat httpOnly dan ditandatangani.
        </p>
      </section>

      <div className="text-center">
        <Link
          href={role === "admin" ? "/admin/pengaturan/tutorial" : "/pic/pengaturan/tutorial"}
          className="link text-sm"
        >
          Buka Tutorial Penggunaan
        </Link>
      </div>
    </div>
  );
}
