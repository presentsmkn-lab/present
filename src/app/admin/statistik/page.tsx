import Link from "next/link";
import { listExtras } from "@/lib/queries/extra";
import { listSemesters } from "@/lib/queries/semester";
import { getStats } from "@/lib/queries/stats";
import { semesterLabel, todayISO } from "@/lib/date";
import { STATUS_LABEL, type PresensiStatus } from "@/types/db";
import { STATUS_COLOR } from "@/lib/status";
import { Alert, Badge, EmptyState, PageHeader, SearchParamsAlert, StatCard } from "@/components/ui";
import { PieChart } from "@/components/charts";
import { ChartIcon, SchoolIcon, UsersIcon } from "@/components/icons";

export const metadata = { title: "Statistik Admin" };

export default async function AdminStatistikPage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string | string[]; error?: string; ok?: string }>;
}) {
  const query = await searchParams;
  const [extras, semesters] = await Promise.all([listExtras(), listSemesters()]);

  const requested = Array.isArray(query.semester)
    ? query.semester
    : query.semester
      ? [query.semester]
      : [];
  const selected = requested.length
    ? semesters.filter((s) => requested.includes(s.id))
    : semesters.filter((s) => s.is_active);
  const effective = selected.length > 0 ? selected : semesters.slice(-1);

  const results = await Promise.all(
    extras.map(async (extra) => ({ extra, stats: await getStats(extra.id, effective) })),
  );

  const composition = { hadir: 0, tidak_hadir: 0, izin: 0, sakit: 0 } as Record<
    PresensiStatus,
    number
  >;
  let memberships = 0;
  let meetings = 0;
  const scored = [...results].sort((a, b) => b.stats.averageAttendance - a.stats.averageAttendance);
  for (const { stats } of results) {
    memberships += stats.totalMembers;
    meetings += stats.totalMeetings;
    for (const status of Object.keys(composition) as PresensiStatus[]) {
      composition[status] += stats.composition[status];
    }
  }
  const totalRecords = Object.values(composition).reduce((sum, value) => sum + value, 0);
  const average = totalRecords > 0 ? Math.round((composition.hadir / totalRecords) * 1000) / 10 : 0;

  const pieData = (Object.keys(STATUS_LABEL) as PresensiStatus[]).map((status) => ({
    label: STATUS_LABEL[status],
    value: composition[status],
    color: STATUS_COLOR[status],
  }));

  return (
    <main className="page">
      <PageHeader
        title="Statistik"
        subtitle="Ringkasan seluruh ekstrakurikuler."
        back="/admin"
        action={
          <Link href="/admin/export" className="btn-secondary px-3" aria-label="Export Excel">
            Excel
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
                    className="h-5 w-5 rounded border-slate-300 accent-navy-800"
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
            Jika tidak memilih, semester aktif digunakan. Pilih beberapa semester untuk data
            gabungan.
          </p>
        </form>
      </details>

      <p className="muted mt-3 text-xs">
        Periode: {effective.length > 0 ? effective.map((s) => semesterLabel(s)).join(", ") : "belum ada semester"}
      </p>

      <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Keanggotaan" value={memberships} icon={<UsersIcon size={18} />} />
        <StatCard label="Kehadiran" value={`${average}%`} icon={<ChartIcon size={18} />} />
        <StatCard label="Pertemuan" value={meetings} />
      </section>

      {effective.length === 0 ? (
        <Alert tone="warning" className="mt-4">
          Belum ada semester aktif. Buat semester dari menu Kelola Semester.
        </Alert>
      ) : extras.length === 0 ? (
        <EmptyState
          title="Belum ada ekstrakurikuler"
          description="Tambahkan ekstrakurikuler untuk melihat statistik."
          icon={<SchoolIcon size={24} />}
        />
      ) : (
        <>
          <section className="card mt-4">
            <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">
              Komposisi presensi keseluruhan
            </h2>
            <PieChart data={pieData} />
          </section>

          <section className="mt-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Kehadiran per ekstrakurikuler
            </h2>
            <div className="space-y-2">
              {scored.map(({ extra, stats }) => (
                <Link
                  key={extra.id}
                  href={`/admin/ekstrakurikuler/${extra.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {extra.nama}
                    </p>
                    <span className="text-sm font-bold text-navy-800 dark:text-navy-200">
                      {stats.averageAttendance}%
                    </span>
                  </div>
                  <p className="muted mt-0.5 text-[11px]">
                    {stats.totalMembers} anggota • {stats.totalMeetings} pertemuan •{" "}
                    {stats.composition.hadir} hadir
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-navy-700 dark:bg-navy-400"
                      style={{ width: `${Math.min(100, stats.averageAttendance)}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="card mt-5">
            <h2 className="mb-2 font-semibold text-slate-900 dark:text-white">
              Siswa tidak masuk beruntun
            </h2>
            {results.every((row) => row.stats.streaks.length === 0) ? (
              <Alert tone="success">Tidak ada siswa dengan ketidakhadiran beruntun. 👍</Alert>
            ) : (
              <div className="space-y-1.5">
                {results.flatMap(({ extra, stats }) =>
                  stats.streaks.slice(0, 5).map((student) => (
                    <div
                      key={`${extra.id}-${student.member_id}`}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-xs dark:border-white/10"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                          {student.nama_lengkap}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {student.nis} • {extra.nama}
                        </p>
                      </div>
                      <Badge tone={student.streak >= 3 ? "red" : "amber"}>
                        {student.streak}x
                      </Badge>
                    </div>
                  )),
                )}
              </div>
            )}
          </section>
        </>
      )}

      <p className="muted mt-4 text-center text-[11px]">
        Izin, Sakit, dan Tidak Hadir dihitung sebagai tidak masuk. Hari libur dilewati. Diperbarui{" "}
        {todayISO()}.
      </p>
    </main>
  );
}
