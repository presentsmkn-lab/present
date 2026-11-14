import Link from "next/link";
import { listExtras } from "@/lib/queries/extra";
import { listSemesters } from "@/lib/queries/semester";
import { semesterLabel } from "@/lib/date";
import { Alert, Badge, EmptyState, PageHeader, SearchParamsAlert } from "@/components/ui";
import { DownloadIcon, SchoolIcon } from "@/components/icons";

export const metadata = { title: "Export Excel" };

export default async function AdminExportPage({
  searchParams,
}: {
  searchParams: Promise<{ extra?: string; error?: string; ok?: string }>;
}) {
  const query = await searchParams;
  const [extras, semesters] = await Promise.all([listExtras(), listSemesters()]);
  const highlighted = extras.find((extra) => extra.id === query.extra) ?? null;
  const latest = semesters[semesters.length - 1] ?? null;

  return (
    <main className="page">
      <PageHeader
        title="Export Excel"
        subtitle="Satu sheet per semester, lengkap dengan grafik kehadiran."
        back="/admin"
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <section className="card mt-2 bg-navy-900 text-white dark:bg-navy-800">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <DownloadIcon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Export semua ekstrakurikuler</h2>
            <p className="mt-1 text-sm text-navy-100">
              Semua kegiatan dalam satu file. Setiap kombinasi ekstrakurikuler dan semester menjadi
              sheet tersendiri.
            </p>
            <Link href="/api/export/all" className="btn mt-3 bg-white text-navy-900 hover:bg-navy-50">
              <DownloadIcon size={18} /> Unduh Semua
            </Link>
          </div>
        </div>
      </section>

      {highlighted ? (
        <Alert tone="info" className="mt-4">
          Dipilih dari halaman detail: <strong>{highlighted.nama}</strong>.{" "}
          <Link href={`/api/export/extra/${highlighted.id}`} className="link">
            Unduh sekarang
          </Link>
          .
        </Alert>
      ) : null}

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Export per ekstrakurikuler
          </h2>
          <Badge tone="blue">{extras.length}</Badge>
        </div>
        {extras.length === 0 ? (
          <EmptyState
            title="Belum ada ekstrakurikuler"
            description="Tambahkan ekstrakurikuler dan anggota sebelum melakukan export."
            icon={<SchoolIcon size={24} />}
          />
        ) : (
          <div className="space-y-2">
            {extras.map((extra) => (
              <div
                key={extra.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
                  <SchoolIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {extra.nama}
                  </p>
                  <p className="muted text-xs">Semua semester dalam sheet terpisah</p>
                </div>
                <Link
                  href={`/api/export/extra/${extra.id}`}
                  className="btn-secondary min-h-9 px-3 py-1 text-xs"
                >
                  <DownloadIcon size={16} /> Excel
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card mt-5">
        <h2 className="font-semibold text-slate-900 dark:text-white">Informasi file</h2>
        <ul className="muted mt-2 space-y-1.5 text-sm">
          <li>• Nama file: Ekstrakurikuler_[Nama]_[TahunAjaran]_Sem[X].xlsx</li>
          <li>• Kolom: Nama Lengkap, NIS, Kelas, Rombel, Jurusan, Hadir, Tidak Hadir, Izin, Sakit, Persentase.</li>
          <li>• Grafik pie komposisi presensi dan bar kehadiran per bulan disertakan sebagai gambar.</li>
          <li>
            • Semester terakhir:{" "}
            {latest ? semesterLabel(latest) : "belum ada semester"}
          </li>
        </ul>
      </section>
    </main>
  );
}
