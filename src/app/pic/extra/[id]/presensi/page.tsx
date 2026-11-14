import Link from "next/link";
import { requirePicExtra } from "@/lib/auth/pic-extra";
import { getActiveMembersForSemester } from "@/lib/queries/members";
import { ensureMeetings, getMeetings } from "@/lib/queries/presensi";
import { currentMonth, formatTanggal, monthLabel, todayISO } from "@/lib/date";
import { STATUS_LABEL, type PresensiStatus } from "@/types/db";
import { Alert, Badge, EmptyState, PageHeader, SearchParamsAlert } from "@/components/ui";
import { CalendarIcon, ClipboardIcon } from "@/components/icons";
import { STATUS_TONE } from "@/lib/status";

export const metadata = { title: "Presensi" };

export default async function PresensiPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { extra, semester } = await requirePicExtra(id);
  const query = await searchParams;
  const month = currentMonth();

  if (!semester) {
    return (
      <main className="page">
        <PageHeader title="Presensi" subtitle={extra.nama} back={`/pic/extra/${id}`} />
        <Alert tone="warning">Belum ada semester aktif. Hubungi admin.</Alert>
      </main>
    );
  }

  await ensureMeetings(extra.id, semester.id, month);
  const [meetings, activeMembers] = await Promise.all([
    getMeetings(extra.id, month),
    getActiveMembersForSemester(extra.id, semester.id),
  ]);
  const totalMembers = activeMembers.length;
  const today = todayISO();

  return (
    <main className="page">
      <PageHeader
        title="Presensi"
        subtitle={`${monthLabel(month)} • ${extra.nama}`}
        back={`/pic/extra/${id}`}
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <Alert tone="info" className="mt-2">
        Hanya pertemuan bulan ini yang dapat diisi. Bulan sebelumnya tersedia di Riwayat Presensi.
      </Alert>

      {meetings.length === 0 ? (
        <EmptyState
          title="Belum ada pertemuan bulan ini"
          description="Pastikan hari latihan sudah diatur. Pertemuan dibuat otomatis sesuai jadwal."
          icon={<CalendarIcon size={24} />}
          action={
            <Link href={`/pic/extra/${id}/jadwal`} className="btn-primary">
              Atur Jadwal
            </Link>
          }
        />
      ) : (
        <div className="mt-4 space-y-2.5">
          {meetings.map((meeting) => {
            const filled = meeting.total;
            const isToday = meeting.tanggal === today;
            return (
              <Link
                key={meeting.id}
                href={`/pic/extra/${id}/presensi/${meeting.tanggal}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-navy-300 dark:border-white/10 dark:bg-navy-900/60 dark:hover:border-navy-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatTanggal(meeting.tanggal, true)}
                      </p>
                      {isToday ? <Badge tone="navy">Hari ini</Badge> : null}
                    </div>
                    <p className="muted mt-0.5 text-xs">
                      {filled > 0 ? `${filled} dari ${totalMembers} anggota tercatat` : "Belum diisi"}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
                    <ClipboardIcon size={20} />
                  </span>
                </div>
                {filled > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
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
            );
          })}
        </div>
      )}
    </main>
  );
}
