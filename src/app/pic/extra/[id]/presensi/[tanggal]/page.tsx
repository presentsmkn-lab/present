import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePicExtra } from "@/lib/auth/pic-extra";
import {
  ensureMeetings,
  getMeetingByDate,
  getPresensiLog,
  getPresensiRows,
  isEditableMonth,
} from "@/lib/queries/presensi";
import { getMembersForSemester } from "@/lib/queries/members";
import { savePresensiAction } from "@/actions/pic";
import { currentMonth, formatDateTime, formatTanggal } from "@/lib/date";
import { STATUS_LABEL, type PresensiStatus } from "@/types/db";
import { Alert, Badge, PageHeader, SearchParamsAlert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ClockIcon } from "@/components/icons";
import { STATUS_TONE, statusLabel } from "@/lib/status";

export const metadata = { title: "Isi Presensi" };

const STATUS_OPTIONS: PresensiStatus[] = ["hadir", "tidak_hadir", "izin", "sakit"];
const OPTION_STYLE: Record<PresensiStatus, string> = {
  hadir:
    "peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white dark:peer-checked:border-emerald-500 dark:peer-checked:bg-emerald-600",
  tidak_hadir:
    "peer-checked:border-red-600 peer-checked:bg-red-600 peer-checked:text-white dark:peer-checked:border-red-500 dark:peer-checked:bg-red-600",
  izin:
    "peer-checked:border-amber-500 peer-checked:bg-amber-500 peer-checked:text-white dark:peer-checked:border-amber-400 dark:peer-checked:bg-amber-500",
  sakit:
    "peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white dark:peer-checked:border-blue-500 dark:peer-checked:bg-blue-600",
};

export default async function PresensiDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; tanggal: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id, tanggal } = await params;
  const { extra, semester } = await requirePicExtra(id);
  const query = await searchParams;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) notFound();

  let meeting = await getMeetingByDate(extra.id, tanggal);
  if (!meeting && semester && tanggal.slice(0, 7) === currentMonth()) {
    await ensureMeetings(extra.id, semester.id, currentMonth());
    meeting = await getMeetingByDate(extra.id, tanggal);
  }
  if (!meeting) notFound();

  const [members, presensi, logs] = await Promise.all([
    getMembersForSemester(extra.id, meeting.semester_id),
    getPresensiRows(meeting.id),
    getPresensiLog(meeting.id),
  ]);
  const editable = isEditableMonth(meeting.tanggal);
  const statusMap = new Map(presensi.map((p) => [p.member_id, p.status]));
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const activeMembers = members.filter(
    (m) => m.member_extra_status === "aktif" && m.status === "aktif",
  );
  const readOnlyMembers = members.filter(
    (m) => m.member_extra_status === "aktif" || statusMap.has(m.id),
  );

  return (
    <main className="page">
      <PageHeader
        title="Presensi"
        subtitle={`${formatTanggal(meeting.tanggal, true)} • ${extra.nama}`}
        back={
          editable
            ? `/pic/extra/${id}/presensi`
            : `/pic/extra/${id}/riwayat?bulan=${meeting.tanggal.slice(0, 7)}`
        }
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {editable ? (
          <Badge tone="green">Dapat diedit</Badge>
        ) : (
          <Badge tone="amber">Hanya lihat</Badge>
        )}
        <span className="muted text-xs">
          {formatTanggal(meeting.tanggal)} • Semester {meeting.semester?.semester_ke ?? "-"}
        </span>
      </div>

      {!editable ? (
        <Alert tone="info" className="mt-3">
          Presensi bulan sebelumnya bersifat read-only. Perubahan tidak dapat dilakukan.
        </Alert>
      ) : (
        <p className="muted mt-3 text-xs">
          Semua anggota otomatis berstatus Hadir. Ubah hanya yang tidak hadir, lalu simpan.
        </p>
      )}

      {editable ? (
        <form action={savePresensiAction} className="mt-4 space-y-3">
          <input type="hidden" name="extra_id" value={id} />
          <input type="hidden" name="pertemuan_id" value={meeting.id} />
          <input type="hidden" name="tanggal" value={meeting.tanggal} />

          {activeMembers.length === 0 ? (
            <Alert tone="warning">
              Belum ada anggota aktif pada semester ini.{" "}
              <Link href={`/pic/extra/${id}/anggota`} className="link">
                Tambah anggota
              </Link>
            </Alert>
          ) : null}

          {activeMembers.map((member) => {
            const current = statusMap.get(member.id);
            return (
              <div key={member.id} className="card p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {member.nama_lengkap}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {member.nis} • {member.kelas} {member.rombel}
                    </p>
                  </div>
                  {current ? <Badge tone={STATUS_TONE[current]}>{STATUS_LABEL[current]}</Badge> : null}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {STATUS_OPTIONS.map((status) => (
                    <label key={status} className="cursor-pointer">
                      <input
                        type="radio"
                        name={`status_${member.id}`}
                        value={status}
                        defaultChecked={current ? current === status : status === "hadir"}
                        className="peer sr-only"
                      />
                      <span
                        className={`flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-1 text-center text-[11px] font-semibold leading-tight text-slate-600 transition-colors dark:border-white/15 dark:text-slate-300 ${OPTION_STYLE[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          {activeMembers.length > 0 ? (
            <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-white/10 dark:bg-navy-950/95">
              <SubmitButton className="w-full">Simpan Presensi</SubmitButton>
            </div>
          ) : null}
        </form>
      ) : (
        <div className="mt-4 space-y-2">
          {readOnlyMembers.map((member) => {
            const status = statusMap.get(member.id);
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {member.nama_lengkap}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {member.nis} • {member.kelas} {member.rombel}
                  </p>
                </div>
                <Badge tone={status ? STATUS_TONE[status] : "slate"}>{statusLabel(status)}</Badge>
              </div>
            );
          })}
        </div>
      )}

      <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
          Riwayat perubahan ({logs.length})
        </summary>
        {logs.length === 0 ? (
          <p className="muted mt-2 text-sm">Belum ada perubahan tercatat.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start gap-2 border-b border-slate-100 pb-2 last:border-0 dark:border-white/5">
                <ClockIcon size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0 text-xs">
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {memberMap.get(log.member_id ?? "")?.nama_lengkap ?? "Anggota"} —{" "}
                    {log.status_lama ? `${statusLabel(log.status_lama)} → ` : ""}
                    {statusLabel(log.status_baru)}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {log.diubah_oleh} • {formatDateTime(log.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </details>

      <div className="mt-4 text-center">
        <Link href={`/pic/extra/${id}/jadwal`} className="link text-xs">
          Tandai tanggal ini sebagai libur
        </Link>
      </div>
    </main>
  );
}
