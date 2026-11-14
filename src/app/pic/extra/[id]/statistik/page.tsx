import Link from "next/link";
import { requirePicExtra } from "@/lib/auth/pic-extra";
import { listSemesters } from "@/lib/queries/semester";
import { getStats } from "@/lib/queries/stats";
import { semesterLabel, todayISO } from "@/lib/date";
import { STATUS_LABEL, type PresensiStatus } from "@/types/db";
import { Alert, Badge, EmptyState, PageHeader, SearchParamsAlert, StatCard } from "@/components/ui";
import { BarChart, PieChart } from "@/components/charts";
import { DownloadIcon, UsersIcon } from "@/components/icons";
import { STATUS_COLOR } from "@/lib/status";

export const metadata = { title: "Statistik" };

export default async function StatistikPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ semester?: string | string[]; error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { extra } = await requirePicExtra(id);
  const query = await searchParams;
  const semesters = await listSemesters();

  const requested = Array.isArray(query.semester)
    ? query.semester
    : query.semester
      ? [query.semester]
      : [];
  const selected = requested.length
    ? semesters.filter((s) => requested.includes(s.id))
    : semesters.filter((s) => s.is_active);
  const effective = selected.length > 0 ? selected : semesters.slice(-1);
  const stats = await getStats(extra.id, effective);

  const pieData = (Object.keys(STATUS_LABEL) as PresensiStatus[]).map((status) => ({
    label: STATUS_LABEL[status],
    value: stats.composition[status],
    color: STATUS_COLOR[status],
  }));

  return (
    <main className="page">
      <PageHeader
        title="Statistik"
        subtitle={extra.nama}
        back={`/pic/extra/${id}`}
        action={
          <Link href={`/api/export/extra/${id}`} className="btn-secondary px-3" aria-label="Export Excel">
            <DownloadIcon size={18} />
          </Link>
        }
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <details className="card mt-2" open={requested.length > 0}>
        <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">
          Filter semester
        </summary>
        <form method="get" className="mt-3 space-y-3">
          <div className="space-y-2">
            {semesters.length === 0 ? (
              <p className="muted text-sm">Belum ada semester.</p>
            ) : (
              semesters.map((semester) => (
                <label
                  key={semester.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10"
                >
                  <input
                    type="checkbox"
                    name="semester"
                    value={semester.id}
                    defaultChecked={effective.some((s) => s.id === semester.id)}
                    className="h-5 w-5 rounded border-slate-300 text-navy-700 accent-navy-800"
                  />
                  <span className="flex-1 text-sm">
                    {semesterLabel(semester)}
                    {semester.is_active ? " • aktif" : ""}
                  </span>
                </label>
              ))
            )}
          </div>
          <button type="submit" className="btn-primary w-full">
            Terapkan Filter
          </button>
          <p className="muted text-xs">
            Pilih beberapa semester untuk melihat data gabungan. Jika tidak memilih, semester aktif
            digunakan.
          </p>
        </form>
      </details>

      <p className="muted mt-3 text-xs">
        Periode: {effective.length > 0 ? effective.map((s) => semesterLabel(s)).join(", ") : "belum ada semester"}
      </p>

      <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Anggota" value={stats.totalMembers} icon={<UsersIcon size={18} />} />
        <StatCard label="Kehadiran" value={`${stats.averageAttendance}%`} />
        <StatCard label="Pertemuan" value={stats.totalMeetings} />
      </section>

      {effective.length === 0 ? (
        <Alert tone="warning" className="mt-4">
          Belum ada semester aktif. Hubungi admin.
        </Alert>
      ) : (
        <>
          <section className="card mt-4">
            <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">
              Komposisi status presensi
            </h2>
            <PieChart data={pieData} />
          </section>

          <section className="card mt-4">
            <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">Kehadiran per bulan</h2>
            <BarChart data={stats.monthly.map((m) => ({ label: m.label, value: m.persentase }))} />
          </section>

          <section className="mt-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tidak masuk beruntun
            </h2>
            {stats.streaks.length === 0 ? (
              <Alert tone="success">Tidak ada siswa dengan ketidakhadiran beruntun. 👍</Alert>
            ) : (
              <div className="space-y-2">
                {stats.streaks.map((student) => (
                  <div
                    key={student.member_id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {student.nama_lengkap}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {student.nis} • {student.kelas} {student.rombel}
                      </p>
                    </div>
                    <Badge tone={student.streak >= 3 ? "red" : "amber"}>
                      {student.streak}x tidak masuk beruntun
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <p className="muted mt-2 text-xs">
              Izin, Sakit, dan Tidak Hadir dihitung sebagai tidak masuk. Hari libur dilewati dan tidak
              memutus rangkaian.
            </p>
          </section>

          <section className="mt-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Rekap per siswa
            </h2>
            {stats.students.length === 0 ? (
              <EmptyState title="Belum ada anggota" description="Tambahkan anggota untuk melihat statistik." />
            ) : (
              <div className="space-y-2">
                {stats.students.map((student) => (
                  <div key={student.member_id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {student.nama_lengkap}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {student.nis} • {student.kelas} {student.rombel} • {student.jurusan}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-navy-800 dark:text-navy-200">
                        {student.persentase}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-navy-700 dark:bg-navy-400"
                        style={{ width: `${Math.min(100, student.persentase)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                        H {student.hadir}
                      </span>
                      <span className="badge bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200">
                        TH {student.tidak_hadir}
                      </span>
                      <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                        I {student.izin}
                      </span>
                      <span className="badge bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200">
                        S {student.sakit}
                      </span>
                      <span className="badge bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                        {student.totalPertemuan} pertemuan
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <p className="muted mt-4 text-center text-[11px]">
        Statistik dihitung dari presensi tersimpan. Anggota tanpa catatan dihitung tidak hadir pada
        persentase per siswa. Diperbarui {todayISO()}.
      </p>
    </main>
  );
}
