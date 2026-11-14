import Link from "next/link";
import { requirePicExtra } from "@/lib/auth/pic-extra";
import { listSemesters } from "@/lib/queries/semester";
import { getMeetingMonths, getMeetings, getMonthsForSemester } from "@/lib/queries/presensi";
import {
  addMonths,
  currentMonth,
  formatTanggal,
  isValidMonth,
  lastMonths,
  monthLabel,
  semesterLabel,
} from "@/lib/date";
import { db } from "@/lib/supabase";
import { STATUS_LABEL, type PresensiStatus } from "@/types/db";
import { Badge, EmptyState, PageHeader, SearchParamsAlert } from "@/components/ui";
import { ArrowRightIcon, DownloadIcon, HistoryIcon } from "@/components/icons";
import { STATUS_TONE } from "@/lib/status";

export const metadata = { title: "Riwayat Presensi" };

export default async function RiwayatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bulan?: string; semester?: string; error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { extra } = await requirePicExtra(id);
  const query = await searchParams;
  const semesters = await listSemesters();

  const selectedSemester = semesters.find((s) => s.id === query.semester) ?? null;
  const semesterMonths = selectedSemester
    ? await getMonthsForSemester(extra.id, selectedSemester.id)
    : await getMeetingMonths(extra.id);

  const monthOptions = [...new Set([...semesterMonths, ...lastMonths(12)])].sort((a, b) => b.localeCompare(a));
  let selectedMonth = isValidMonth(query.bulan) ? query.bulan : currentMonth();
  if (!query.bulan && selectedSemester) {
    selectedMonth = semesterMonths[0] ?? currentMonth();
  }
  if (!isValidMonth(selectedMonth)) selectedMonth = currentMonth();

  const meetings = (await getMeetings(extra.id, selectedMonth)).filter(
    (m) => !selectedSemester || m.semester_id === selectedSemester.id,
  );

  const semesterCounts = await Promise.all(
    semesters.map(async (semester) => {
      const { count } = await db()
        .from("pertemuan")
        .select("id", { count: "exact", head: true })
        .eq("extra_id", extra.id)
        .eq("semester_id", semester.id);
      return { semester, count: count ?? 0 };
    }),
  );

  return (
    <main className="page">
      <PageHeader
        title="Riwayat Presensi"
        subtitle={extra.nama}
        back={`/pic/extra/${id}`}
        action={
          <Link href={`/api/export/extra/${id}`} className="btn-secondary px-3" aria-label="Export Excel">
            <DownloadIcon size={18} />
            <span className="hidden sm:inline">Export</span>
          </Link>
        }
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <form method="get" className="card mt-2 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
        <div>
          <label className="label" htmlFor="bulan">
            Bulan
          </label>
          <select id="bulan" name="bulan" defaultValue={selectedMonth} className="input">
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {monthLabel(month)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="semester">
            Semester
          </label>
          <select id="semester" name="semester" defaultValue={selectedSemester?.id ?? ""} className="input">
            <option value="">Semua semester</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semesterLabel(semester)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full">
            Lihat
          </button>
        </div>
      </form>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {monthLabel(selectedMonth)}
          </h2>
          {selectedMonth === currentMonth() ? <Badge tone="green">Bulan berjalan</Badge> : <Badge tone="slate">Read-only</Badge>}
        </div>
        {meetings.length === 0 ? (
          <EmptyState
            title="Tidak ada pertemuan"
            description="Belum ada pertemuan tercatat pada bulan dan semester yang dipilih."
            icon={<HistoryIcon size={24} />}
          />
        ) : (
          <div className="space-y-2">
            {meetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/pic/extra/${id}/presensi/${meeting.tanggal}`}
                className="block rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-navy-900/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatTanggal(meeting.tanggal, true)}
                    </p>
                    <p className="muted text-xs">
                      {meeting.total > 0 ? `${meeting.total} catatan presensi` : "Tidak ada catatan"}
                    </p>
                  </div>
                  <ArrowRightIcon size={18} className="shrink-0 text-slate-400" />
                </div>
                {meeting.total > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(Object.keys(STATUS_LABEL) as PresensiStatus[]).map((status) =>
                      meeting.counts[status] > 0 ? (
                        <Badge key={status} tone={STATUS_TONE[status]}>
                          {STATUS_LABEL[status]} {meeting.counts[status]}
                        </Badge>
                      ) : null,
                    )}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Rekap per semester
        </h2>
        <div className="space-y-2">
          {semesterCounts.length === 0 ? (
            <p className="muted text-sm">Belum ada semester.</p>
          ) : (
            semesterCounts.map(({ semester, count }) => (
              <Link
                key={semester.id}
                href={`/pic/extra/${id}/riwayat?semester=${semester.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {semesterLabel(semester)}
                  </p>
                  <p className="muted text-xs">{count} pertemuan tercatat</p>
                </div>
                {semester.is_active ? <Badge tone="green">Aktif</Badge> : null}
              </Link>
            ))
          )}
        </div>
        <p className="muted mt-3 text-xs">
          Untuk melihat semester lampau, pilih semester lalu pilih bulannya.{" "}
          <Link href={`/pic/extra/${id}/riwayat?bulan=${addMonths(currentMonth(), -1)}`} className="link">
            Bulan lalu
          </Link>
        </p>
      </section>
    </main>
  );
}
