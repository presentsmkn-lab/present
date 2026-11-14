import "server-only";
import { db } from "@/lib/supabase";
import { currentMonth, datesInMonth, dayNameOf, todayISO } from "@/lib/date";
import { getJadwalSegments, jadwalPada } from "@/lib/queries/jadwal";
import type {
  Hari,
  LiburRow,
  PertemuanRow,
  PresensiRow,
  PresensiStatus,
  SemesterRow,
} from "@/types/db";

export const STATUSES: PresensiStatus[] = ["hadir", "tidak_hadir", "izin", "sakit"];

export function emptyCounts(): Record<PresensiStatus, number> {
  return { hadir: 0, tidak_hadir: 0, izin: 0, sakit: 0 };
}

export type MeetingSummary = PertemuanRow & {
  semester: SemesterRow | null;
  counts: Record<PresensiStatus, number>;
  total: number;
};

export async function listLibur(extraId: string): Promise<LiburRow[]> {
  const { data, error } = await db()
    .from("libur")
    .select("*")
    .eq("extra_id", extraId)
    .order("tanggal", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as LiburRow[];
}

async function liburDates(extraId: string, start: string, end: string): Promise<Set<string>> {
  const { data } = await db()
    .from("libur")
    .select("tanggal")
    .eq("extra_id", extraId)
    .gte("tanggal", start)
    .lte("tanggal", end);
  return new Set(((data ?? []) as Array<{ tanggal: string }>).map((r) => r.tanggal));
}

/**
 * Pastikan pertemuan bulan berjalan tersedia sesuai jadwal yang berlaku
 * pada masing-masing tanggal. Hanya untuk bulan berjalan; bulan lampau
 * bersifat read-only.
 */
export async function ensureMeetings(
  extraId: string,
  semesterId: string,
  month = currentMonth(),
): Promise<void> {
  if (month !== currentMonth()) return;
  const segments = await getJadwalSegments(extraId);
  if (segments.length === 0) return;

  const dates = datesInMonth(month);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const [libur, existing] = await Promise.all([
    liburDates(extraId, start, end),
    db()
      .from("pertemuan")
      .select("tanggal")
      .eq("extra_id", extraId)
      .gte("tanggal", start)
      .lte("tanggal", end),
  ]);
  const already = new Set(
    ((existing.data ?? []) as Array<{ tanggal: string }>).map((r) => r.tanggal),
  );
  const rows: Array<{ extra_id: string; semester_id: string; tanggal: string }> = [];
  for (const date of datesInMonth(month)) {
    if (libur.has(date) || already.has(date)) continue;
    const day = dayNameOf(date) as Hari;
    const days = jadwalPada(segments, date);
    if (days.includes(day)) {
      rows.push({ extra_id: extraId, semester_id: semesterId, tanggal: date });
    }
  }
  if (rows.length === 0) return;
  const { error } = await db()
    .from("pertemuan")
    .upsert(rows, { onConflict: "extra_id,tanggal", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

type MeetingWithCounts = PertemuanRow & {
  counts: Record<PresensiStatus, number>;
  total: number;
};

async function attachCounts(meetings: PertemuanRow[]): Promise<MeetingWithCounts[]> {
  if (meetings.length === 0) return [];
  const { data } = await db()
    .from("presensi")
    .select("pertemuan_id, status")
    .in(
      "pertemuan_id",
      meetings.map((m) => m.id),
    );
  const perMeeting = new Map<string, Record<PresensiStatus, number>>();
  for (const row of (data ?? []) as Array<{ pertemuan_id: string; status: PresensiStatus }>) {
    if (!perMeeting.has(row.pertemuan_id)) perMeeting.set(row.pertemuan_id, emptyCounts());
    perMeeting.get(row.pertemuan_id)![row.status] += 1;
  }
  return meetings.map((m) => {
    const counts = perMeeting.get(m.id) ?? emptyCounts();
    return {
      ...m,
      counts,
      total: STATUSES.reduce((sum, s) => sum + counts[s], 0),
    };
  });
}

export async function getMeetings(
  extraId: string,
  month: string,
): Promise<MeetingSummary[]> {
  const dates = datesInMonth(month);
  const start = dates[0];
  const end = dates[dates.length - 1];
  const { data, error } = await db()
    .from("pertemuan")
    .select("*, semester:semesters(*)")
    .eq("extra_id", extraId)
    .gte("tanggal", start)
    .lte("tanggal", end)
    .order("tanggal", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Array<
    PertemuanRow & { semester: SemesterRow | SemesterRow[] | null }
  >;
  const normalized = rows.map((row) => {
    const base: Partial<typeof row> = { ...row };
    delete base.semester;
    return base as PertemuanRow;
  });
  const withCounts = await attachCounts(normalized);
  return withCounts.map((m, i) => {
    const raw = rows[i];
    const sem = Array.isArray(raw.semester) ? raw.semester[0] ?? null : raw.semester;
    return { ...m, semester: sem };
  });
}

export async function getMeetingByDate(
  extraId: string,
  date: string,
): Promise<MeetingSummary | null> {
  const { data } = await db()
    .from("pertemuan")
    .select("*, semester:semesters(*)")
    .eq("extra_id", extraId)
    .eq("tanggal", date)
    .maybeSingle();
  if (!data) return null;
  const raw = data as unknown as PertemuanRow & { semester: SemesterRow | SemesterRow[] | null };
  const semester = Array.isArray(raw.semester) ? raw.semester[0] ?? null : raw.semester;
  const base: Partial<typeof raw> = { ...raw };
  delete base.semester;
  const [withCounts] = await attachCounts([base as PertemuanRow]);
  return { ...withCounts, semester };
}

export async function getPresensiRows(pertemuanId: string): Promise<PresensiRow[]> {
  const { data, error } = await db()
    .from("presensi")
    .select("*")
    .eq("pertemuan_id", pertemuanId);
  if (error) throw new Error(error.message);
  return (data ?? []) as PresensiRow[];
}

export async function getPresensiLog(pertemuanId: string, limit = 30) {
  const presensi = await getPresensiRows(pertemuanId);
  if (presensi.length === 0) return [];
  const { data } = await db()
    .from("presensi_log")
    .select("id, status_lama, status_baru, diubah_oleh, created_at, presensi_id")
    .in(
      "presensi_id",
      presensi.map((p) => p.id),
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  const memberByPresensi = new Map(presensi.map((p) => [p.id, p.member_id]));
  return ((data ?? []) as Array<{
    id: string;
    status_lama: string | null;
    status_baru: string;
    diubah_oleh: string;
    created_at: string;
    presensi_id: string;
  }>).map((log) => ({ ...log, member_id: memberByPresensi.get(log.presensi_id) ?? null }));
}

export function isEditableMonth(dateISO: string): boolean {
  return dateISO.slice(0, 7) === currentMonth();
}

export function isFutureDate(dateISO: string): boolean {
  return dateISO > todayISO();
}

/** Simpan presensi + catat log perubahan. */
export async function savePresensi(
  pertemuanId: string,
  extraId: string,
  statuses: Record<string, PresensiStatus>,
  actor: string,
): Promise<{ changed: number }> {
  const { data: meetingData } = await db()
    .from("pertemuan")
    .select("id, extra_id, semester_id, tanggal")
    .eq("id", pertemuanId)
    .eq("extra_id", extraId)
    .maybeSingle();
  const meeting = meetingData as PertemuanRow | null;
  if (!meeting) throw new Error("Pertemuan tidak ditemukan.");
  if (!isEditableMonth(meeting.tanggal)) {
    throw new Error("Presensi bulan sebelumnya hanya dapat dilihat.");
  }

  const { data: membershipData } = await db()
    .from("member_extra")
    .select("member_id, status, member:members(status)")
    .eq("extra_id", extraId)
    .eq("semester_id", meeting.semester_id)
    .eq("status", "aktif");
  const allowed = new Set(
    ((membershipData ?? []) as unknown as Array<{
      member_id: string;
      member: { status: string } | Array<{ status: string }> | null;
    }>)
      .filter((row) => {
        const m = Array.isArray(row.member) ? row.member[0] : row.member;
        return m?.status === "aktif";
      })
      .map((row) => row.member_id),
  );

  const existing = await getPresensiRows(pertemuanId);
  const oldMap = new Map(existing.map((p) => [p.member_id, p.status]));
  const changedRows = Object.entries(statuses)
    .filter(([memberId, status]) => allowed.has(memberId) && oldMap.get(memberId) !== status)
    .map(([member_id, status]) => ({
      pertemuan_id: pertemuanId,
      member_id,
      status,
      updated_by: actor,
      updated_at: new Date().toISOString(),
    }));
  if (changedRows.length === 0) return { changed: 0 };

  const { data: saved, error } = await db()
    .from("presensi")
    .upsert(changedRows, { onConflict: "pertemuan_id,member_id" })
    .select("id, member_id, status");
  if (error) throw new Error(error.message);

  const logs = ((saved ?? []) as Array<{ id: string; member_id: string; status: string }>).map(
    (row) => ({
      presensi_id: row.id,
      status_lama: oldMap.get(row.member_id) ?? null,
      status_baru: row.status,
      diubah_oleh: actor,
    }),
  );
  if (logs.length > 0) {
    const { error: logError } = await db().from("presensi_log").insert(logs);
    if (logError) throw new Error(logError.message);
  }
  return { changed: changedRows.length };
}

export async function getMeetingMonths(extraId: string): Promise<string[]> {
  const { data } = await db()
    .from("pertemuan")
    .select("tanggal")
    .eq("extra_id", extraId)
    .order("tanggal", { ascending: false });
  const months = new Set(((data ?? []) as Array<{ tanggal: string }>).map((r) => r.tanggal.slice(0, 7)));
  return [...months];
}

export async function getMonthsForSemester(
  extraId: string,
  semesterId: string,
): Promise<string[]> {
  const { data } = await db()
    .from("pertemuan")
    .select("tanggal")
    .eq("extra_id", extraId)
    .eq("semester_id", semesterId)
    .order("tanggal", { ascending: false });
  const months = new Set(((data ?? []) as Array<{ tanggal: string }>).map((r) => r.tanggal.slice(0, 7)));
  return [...months];
}
