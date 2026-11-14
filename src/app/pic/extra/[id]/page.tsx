import Link from "next/link";
import { requirePicExtra } from "@/lib/auth/pic-extra";
import { getActiveMembersForSemester } from "@/lib/queries/members";
import { getJadwalSegments, jadwalPada } from "@/lib/queries/jadwal";
import { ensureMeetings, getMeetings } from "@/lib/queries/presensi";
import { getSummaryForSemester } from "@/lib/queries/stats";
import { currentMonth, formatTanggal, monthLabel, todayISO } from "@/lib/date";
import { HARI_LABEL } from "@/types/db";
import { ActionTile, Alert, Badge, EmptyState, PageHeader, SearchParamsAlert, StatCard } from "@/components/ui";
import {
  CalendarIcon,
  ChartIcon,
  ClipboardIcon,
  ClockIcon,
  DownloadIcon,
  HistoryIcon,
  UsersIcon,
} from "@/components/icons";

export const metadata = { title: "Ekstrakurikuler" };

export default async function ExtraOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { extra, semester } = await requirePicExtra(id);
  const query = await searchParams;
  const today = todayISO();
  const month = currentMonth();

  let memberCount = 0;
  let summary = { activeMembers: 0, meetingCount: 0, attendance: 0 };
  let meetings: Awaited<ReturnType<typeof getMeetings>> = [];
  if (semester) {
    await ensureMeetings(extra.id, semester.id, month);
    [memberCount, summary, meetings] = await Promise.all([
      getActiveMembersForSemester(extra.id, semester.id).then((m) => m.length),
      getSummaryForSemester(extra.id, semester.id),
      getMeetings(extra.id, month),
    ]);
  }
  const segments = await getJadwalSegments(extra.id);
  const todayDays = jadwalPada(segments, today);
  const todaysMeeting = meetings.find((m) => m.tanggal === today);
  const upcoming = meetings.filter((m) => m.tanggal >= today).slice(0, 3);

  const dayNames = todayDays.map((d) => HARI_LABEL[d]);

  return (
    <main className="page">
      <PageHeader title={extra.nama} subtitle="Ringkasan kegiatan dan akses cepat." />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      {!semester ? (
        <Alert tone="warning" className="mt-4">
          Belum ada semester aktif. Hubungi admin untuk membuat semester sebelum mengisi anggota dan
          presensi.
        </Alert>
      ) : null}

      <section className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Anggota aktif" value={memberCount} icon={<UsersIcon />} />
        <StatCard label="Kehadiran" value={`${summary.attendance}%`} hint={`${summary.meetingCount} pertemuan`} icon={<ChartIcon />} />
        <StatCard label="Latihan" value={dayNames.length > 0 ? dayNames.join(", ") : "—"} hint="Jadwal berlaku saat ini" icon={<CalendarIcon />} />
        <StatCard label="Semester" value={semester ? `Sem ${semester.semester_ke}` : "—"} hint={semester?.tahun_ajaran ?? "Belum aktif"} icon={<CalendarIcon />} />
      </section>

      {todaysMeeting ? (
        <Link
          href={`/pic/extra/${id}/presensi/${today}`}
          className="mt-4 block overflow-hidden rounded-2xl bg-navy-900 p-4 text-white shadow-lg shadow-navy-900/20 dark:bg-navy-700"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-navy-200">
            <ClockIcon size={16} /> Hari ini • {formatTanggal(today, true)}
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold">Isi presensi sekarang</p>
              <p className="text-sm text-navy-100">
                {todaysMeeting.total > 0
                  ? `${todaysMeeting.total} anggota sudah tercatat`
                  : "Belum ada yang tercatat"}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ClipboardIcon size={24} />
            </span>
          </div>
        </Link>
      ) : (
        <div className="card-tight mt-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
            <CalendarIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {todayDays.length > 0 ? "Tidak ada pertemuan hari ini" : "Tidak ada latihan hari ini"}
            </p>
            <p className="muted text-xs">
              {todayDays.length > 0
                ? "Pertemuan bisa ditandai libur dari halaman Jadwal."
                : `Jadwal latihan: ${dayNames.join(", ") || "belum diatur"}`}
            </p>
          </div>
        </div>
      )}

      <h2 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Menu ekstrakurikuler
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ActionTile
          href={`/pic/extra/${id}/presensi`}
          title="Presensi"
          description={`Pertemuan ${monthLabel(month)}`}
          icon={<ClipboardIcon />}
          badge={meetings.length}
        />
        <ActionTile
          href={`/pic/extra/${id}/anggota`}
          title="Anggota"
          description="Tambah, edit, atau keluarkan anggota."
          icon={<UsersIcon />}
          badge={memberCount}
        />
        <ActionTile
          href={`/pic/extra/${id}/jadwal`}
          title="Jadwal & Libur"
          description="Hari latihan dan penanda hari libur."
          icon={<CalendarIcon />}
        />
        <ActionTile
          href={`/pic/extra/${id}/riwayat`}
          title="Riwayat Presensi"
          description="Lihat presensi bulan dan semester sebelumnya."
          icon={<HistoryIcon />}
        />
        <ActionTile
          href={`/pic/extra/${id}/statistik`}
          title="Statistik"
          description="Kehadiran, komposisi status, dan siswa bermasalah."
          icon={<ChartIcon />}
        />
        <ActionTile
          href={`/api/export/extra/${id}`}
          title="Export Excel"
          description="Semua semester dalam sheet terpisah."
          icon={<DownloadIcon />}
        />
      </div>

      {upcoming.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pertemuan berikutnya
          </h2>
          <div className="space-y-2">
            {upcoming.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/pic/extra/${id}/presensi/${meeting.tanggal}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-navy-900/60"
              >
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {formatTanggal(meeting.tanggal, true)}
                </span>
                <Badge tone={meeting.total > 0 ? "green" : "slate"}>
                  {meeting.total > 0 ? "Terisi" : "Belum"}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!semester ? (
        <EmptyState
          title="Menunggu semester aktif"
          description="Setelah admin membuat semester, Anda dapat menambah anggota dan mengisi presensi."
        />
      ) : null}
    </main>
  );
}
