"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  ClipboardIcon,
  DownloadIcon,
  InfoIcon,
  SchoolIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/icons";

type Role = "admin" | "pic";

type Step = {
  title: string;
  text: string;
  tips?: string[];
  icon: React.ReactNode;
  link?: { href: string; label: string };
};

const ADMIN_STEPS: Step[] = [
  {
    title: "Login & Pengaturan Awal",
    text: "Masuk menggunakan username dan password admin. Setelah masuk, atur tema tampilan (terang/gelap) lalu unggah Logo Sekolah dan Logo Pembuat melalui menu Pengaturan > Logo & Branding.",
    tips: [
      "Logo sekolah tampil di halaman login, header, dan ikon aplikasi.",
      "Logo pembuat tampil di footer, halaman Tentang, dan halaman login.",
    ],
    icon: <SettingsIcon size={20} />,
    link: { href: "/admin/branding", label: "Buka Logo & Branding" },
  },
  {
    title: "Buat & Aktifkan Semester",
    text: "Buka menu Kelola Semester, lalu tekan “Buat Semester Berikutnya” untuk mengaktifkan tahun ajaran dan semester berjalan (Semester 1 atau Semester 2) sebelum mulai mencatat data.",
    tips: [
      "Semester baru otomatis menyalin anggota aktif dari semester sebelumnya.",
      "Atur tanggal mulai dan tanggal selesai semester agar rentang laporan akurat.",
    ],
    icon: <CalendarIcon size={20} />,
    link: { href: "/admin/semester", label: "Buka Kelola Semester" },
  },
  {
    title: "Kelola Data Ekstrakurikuler & Jurusan",
    text: "Buka menu Kelola Ekstrakurikuler, tambahkan nama-nama kegiatan ekstrakurikuler yang aktif di sekolah. Lengkapi juga data jurusan (kode dan nama panjang) melalui menu Kelola Jurusan.",
    tips: [
      "Data jurusan dipakai saat PIC menambahkan anggota siswa.",
      "Satu ekstrakurikuler dapat memiliki lebih dari satu PIC (utama dan asisten).",
    ],
    icon: <SchoolIcon size={20} />,
    link: { href: "/admin/ekstrakurikuler", label: "Buka Kelola Ekstrakurikuler" },
  },
  {
    title: "Buat Akun PIC & Tugaskan Kegiatan",
    text: "Buka menu Kelola PIC, buat akun Pembina/Pengurus (PIC) menggunakan NIS sebagai kredensial login. Setelah akun dibuat, tugaskan PIC sebagai utama atau asisten pada masing-masing ekstrakurikuler.",
    tips: [
      "Password PIC disimpan terenkripsi; admin dapat melihat dan meresetnya.",
      "PIC yang dinonaktifkan tidak dapat login sampai diaktifkan kembali.",
    ],
    icon: <UsersIcon size={20} />,
    link: { href: "/admin/pic", label: "Buka Kelola PIC" },
  },
  {
    title: "Pantau Statistik & Export Laporan",
    text: "Buka tab Statistik pada navigasi bawah untuk memantau persentase kehadiran seluruh ekstrakurikuler per semester. Gunakan tombol Export Excel untuk mengunduh laporan rekapitulasi lengkap beserta grafik.",
    tips: [
      "Filter satu atau beberapa semester sekaligus untuk data gabungan.",
      "File Excel berisi satu sheet per semester dengan kolom kehadiran dan persentase.",
    ],
    icon: <ChartIcon size={20} />,
    link: { href: "/admin/statistik", label: "Buka Statistik" },
  },
  {
    title: "Kelola Informasi Halaman Tentang",
    text: "Buka Pengaturan > Tentang Aplikasi untuk memperbarui deskripsi website, nama aplikasi, versi, serta profil pembuat aplikasi (nama, peran, instansi, bio, dan kontak/tautan).",
    tips: [
      "Perubahan langsung tersimpan permanen dan tampil di halaman Tentang Admin maupun PIC.",
      "Isi kontak/tautan agar logo pembuat dapat diklik menuju halaman yang dituju.",
    ],
    icon: <InfoIcon size={20} />,
    link: { href: "/admin/pengaturan/tentang", label: "Buka Tentang Aplikasi" },
  },
];

function picSteps(extraId?: string): Step[] {
  return [
    {
      title: "Login Menggunakan NIS",
      text: "Buka halaman login, masukkan NIS yang telah didaftarkan Admin beserta passwordnya, lalu tekan Masuk. NIS adalah identitas login PIC; tidak ada akun terpisah untuk siswa.",
      tips: ["Jika akun dinonaktifkan, hubungi admin sekolah untuk mengaktifkannya kembali."],
      icon: <UsersIcon size={20} />,
    },
    {
      title: "Pilih Ekstrakurikuler",
      text: "Pada dashboard PIC, pilih kegiatan ekstrakurikuler yang Anda kelola. Jika Anda mengampu lebih dari satu ekskul, pilih salah satu sesuai jadwal kegiatan.",
      tips: ["Jika hanya mengampu satu ekskul, Anda akan langsung diarahkan ke halaman ekskul tersebut."],
      icon: <SchoolIcon size={20} />,
      link: { href: "/pic", label: "Buka Dashboard PIC" },
    },
    {
      title: "Kelola Data Anggota Siswa",
      text: "Masuk ke menu Anggota, lalu tambahkan siswa peserta ekstrakurikuler dengan mengisi nama lengkap, NIS, kelas/jurusan, dan rombel. Siswa tidak perlu membuat akun login.",
      tips: [
        "Gunakan tombol edit untuk memperbarui data atau mengeluarkan anggota dari ekskul.",
        "Anggota yang sudah keluar tetap tersimpan pada riwayat semester sebelumnya.",
      ],
      icon: <UsersIcon size={20} />,
      link: extraId
        ? { href: `/pic/extra/${extraId}/anggota`, label: "Buka Anggota" }
        : undefined,
    },
    {
      title: "Catat Presensi Pertemuan",
      text: "Buka menu Presensi/Pertemuan, buat sesi pertemuan baru (isi tanggal dan materi/catatan latihan), lalu tandai status setiap anggota: Hadir, Izin, Sakit, atau Tidak Hadir (Alpa). Tekan Simpan setelah selesai.",
      tips: [
        "Hanya presensi bulan berjalan yang dapat diubah; bulan lalu bersifat baca-saja.",
        "Setiap perubahan tercatat pada log perubahan presensi.",
      ],
      icon: <ClipboardIcon size={20} />,
      link: extraId
        ? { href: `/pic/extra/${extraId}/presensi`, label: "Buka Presensi" }
        : undefined,
    },
    {
      title: "Cek Rekap & Export Data",
      text: "Lihat persentase kehadiran anggota pada menu Statistik/Rekap ekskul, termasuk grafik dan daftar siswa yang tidak masuk beruntun. Unduh laporan Excel bila diperlukan.",
      tips: [
        "Filter per semester atau gabungkan beberapa semester untuk melihat tren kehadiran.",
        "File Excel memuat rekap semua semester dalam sheet terpisah.",
      ],
      icon: <DownloadIcon size={20} />,
      link: extraId
        ? { href: `/pic/extra/${extraId}/statistik`, label: "Buka Statistik" }
        : undefined,
    },
  ];
}

export function TutorialView({
  defaultRole,
  extraId,
}: {
  defaultRole: Role;
  extraId?: string;
}) {
  const [role, setRole] = useState<Role>(defaultRole);
  const steps = role === "admin" ? ADMIN_STEPS : picSteps(extraId);

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Pilih panduan pengguna"
        className="grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 dark:border-white/10 dark:bg-white/5"
      >
        {(
          [
            { key: "admin", label: "Panduan Admin" },
            { key: "pic", label: "Panduan PIC (Pembina)" },
          ] as const
        ).map((tab) => {
          const active = role === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRole(tab.key)}
              className={cn(
                "min-h-12 rounded-xl px-2 text-xs font-semibold transition-all duration-200 sm:text-sm",
                active
                  ? "bg-navy-900 text-white shadow-sm dark:bg-blue-600"
                  : "text-slate-600 hover:bg-white active:scale-[0.98] dark:text-slate-300 dark:hover:bg-white/10",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <section className="card bg-navy-900 text-white dark:bg-navy-800">
        <h2 className="text-lg font-bold">
          {role === "admin" ? "Panduan lengkap Admin" : "Panduan lengkap PIC (Pembina)"}
        </h2>
        <p className="mt-1 text-sm text-navy-100">
          {role === "admin"
            ? "Enam langkah berurutan menyiapkan data induk, akun PIC, semester, hingga laporan."
            : "Lima langkah berurutan dari login sampai mengunduh rekap kehadiran."}
        </p>
        <p className="mt-2 text-xs text-navy-200">
          {steps.length} langkah • Ikuti secara berurutan agar data tetap rapi.
        </p>
      </section>

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={step.title} className="card">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white dark:bg-navy-600">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="flex items-start gap-2 font-semibold text-slate-900 dark:text-white">
                  <span className="mt-0.5 shrink-0 text-navy-700 dark:text-navy-200">
                    {step.icon}
                  </span>
                  <span className="min-w-0 break-words">{step.title}</span>
                </h3>
                <p className="muted mt-1 break-words text-sm">{step.text}</p>

                {step.tips?.length ? (
                  <ul className="mt-2 space-y-1">
                    {step.tips.map((tip) => (
                      <li
                        key={tip}
                        className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400"
                      >
                        <CheckIcon size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                        <span className="min-w-0 break-words">{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {step.link ? (
                  <Link
                    href={step.link.href}
                    className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-navy-700 active:scale-[0.98] dark:text-navy-300"
                  >
                    {step.link.label} <ArrowRightIcon size={14} />
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section className="card">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <InfoIcon size={18} /> Butuh bantuan?
        </h3>
        <p className="muted mt-1 text-sm">
          Hubungi admin sekolah bila akun dinonaktifkan, lupa password, atau ekstrakurikuler belum
          ditugaskan. Demi keamanan, tidak ada fitur lupa password mandiri.
        </p>
      </section>
    </div>
  );
}
