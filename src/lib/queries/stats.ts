import "server-only";
import { db } from "@/lib/supabase";
import { monthLabel } from "@/lib/date";
import { emptyCounts, listLibur, STATUSES } from "@/lib/queries/presensi";
import type { MemberRow, PresensiStatus, SemesterRow } from "@/types/db";

export type StudentStat = {
  member_id: string;
  nis: string;
  nama_lengkap: string;
  rombel: string;
  kelas: string;
  jurusan: string;
  hadir: number;
  tidak_hadir: number;
  izin: number;
  sakit: number;
  totalPertemuan: number;
  persentase: number;
};

export type MonthlyStat = {
  key: string;
  label: string;
  hadir: number;
  total: number;
  persentase: number;
};

export type StreakStat = {
  member_id: string;
  nis: string;
  nama_lengkap: string;
  rombel: string;
  kelas: string;
  streak: number;
};

export type StatsResult = {
  totalMembers: number;
  totalMeetings: number;
  averageAttendance: number;
  composition: Record<PresensiStatus, number>;
  monthly: MonthlyStat[];
  students: StudentStat[];
  streaks: StreakStat[];
};

type MeetingLite = { id: string; tanggal: string; semester_id: string };

type MembershipLite = {
  member_id: string;
  semester_id: string;
  member: MemberRow | MemberRow[] | null;
};

type PresensiLite = {
  pertemuan_id: string;
  member_id: string;
  status: PresensiStatus;
};

async function fetchMemberships(extraId: string, semesterIds: string[]): Promise<MembershipLite[]> {
  const all: MembershipLite[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db()
      .from("member_extra")
      .select("member_id, semester_id, member:members(*)")
      .eq("extra_id", extraId)
      .in("semester_id", semesterIds)
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as unknown as MembershipLite[];
    all.push(...page);
    if (page.length < 1000) break;
  }
  return all;
}

async function fetchPresensi(meetingIds: string[]): Promise<PresensiLite[]> {
  if (meetingIds.length === 0) return [];
  const all: PresensiLite[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db()
      .from("presensi")
      .select("pertemuan_id, member_id, status")
      .in("pertemuan_id", meetingIds)
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as PresensiLite[];
    all.push(...page);
    if (page.length < 1000) break;
  }
  return all;
}

export async function getStats(
  extraId: string,
  semesters: SemesterRow[],
): Promise<StatsResult> {
  const semesterIds = semesters.map((s) => s.id);
  if (semesterIds.length === 0) {
    return {
      totalMembers: 0,
      totalMeetings: 0,
      averageAttendance: 0,
      composition: emptyCounts(),
      monthly: [],
      students: [],
      streaks: [],
    };
  }

  const [{ data: meetingData, error: meetingError }, libur, { data: jurusanData }] = await Promise.all([
    db()
      .from("pertemuan")
      .select("id, tanggal, semester_id")
      .eq("extra_id", extraId)
      .in("semester_id", semesterIds)
      .order("tanggal", { ascending: true }),
    listLibur(extraId),
    db().from("jurusan").select("id, kode"),
  ]);
  if (meetingError) throw new Error(meetingError.message);
  const jurusanMap = new Map(
    ((jurusanData ?? []) as Array<{ id: string; kode: string }>).map((j) => [j.id, j.kode]),
  );

  const liburSet = new Set(libur.map((l) => l.tanggal));
  const meetings = ((meetingData ?? []) as MeetingLite[]).filter(
    (m) => !liburSet.has(m.tanggal),
  );
  const meetingById = new Map(meetings.map((m) => [m.id, m]));

  const [memberships, presensiRows] = await Promise.all([
    fetchMemberships(extraId, semesterIds),
    fetchPresensi(meetings.map((m) => m.id)),
  ]);

  const members = new Map<string, MemberRow>();
  const memberSemesters = new Map<string, Set<string>>();
  for (const row of memberships) {
    const member = Array.isArray(row.member) ? row.member[0] : row.member;
    if (!member) continue;
    members.set(member.id, member);
    if (!memberSemesters.has(member.id)) memberSemesters.set(member.id, new Set());
    memberSemesters.get(member.id)!.add(row.semester_id);
  }

  const meetingsBySemester = new Map<string, number>();
  for (const m of meetings) {
    meetingsBySemester.set(m.semester_id, (meetingsBySemester.get(m.semester_id) ?? 0) + 1);
  }
  const meetingsFor = (memberId: string): number => {
    const sems = memberSemesters.get(memberId);
    if (!sems) return 0;
    let total = 0;
    for (const s of sems) total += meetingsBySemester.get(s) ?? 0;
    return total;
  };

  const composition = emptyCounts();
  const byMember = new Map<string, Record<PresensiStatus, number>>();
  const byMonth = new Map<string, { hadir: number; total: number }>();
  const datesByMember = new Map<string, Array<{ date: string; status: PresensiStatus }>>();

  for (const row of presensiRows) {
    const meeting = meetingById.get(row.pertemuan_id);
    if (!meeting) continue;
    composition[row.status] += 1;
    if (!byMember.has(row.member_id)) byMember.set(row.member_id, emptyCounts());
    byMember.get(row.member_id)![row.status] += 1;
    const month = meeting.tanggal.slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, { hadir: 0, total: 0 });
    const bucket = byMonth.get(month)!;
    bucket.total += 1;
    if (row.status === "hadir") bucket.hadir += 1;
    if (!datesByMember.has(row.member_id)) datesByMember.set(row.member_id, []);
    datesByMember.get(row.member_id)!.push({ date: meeting.tanggal, status: row.status });
  }

  const students: StudentStat[] = [...members.values()]
    .map((member) => {
      const counts = byMember.get(member.id) ?? emptyCounts();
      const total = meetingsFor(member.id);
      return {
        member_id: member.id,
        nis: member.nis,
        nama_lengkap: member.nama_lengkap,
        rombel: member.rombel,
        kelas: member.kelas,
        jurusan: member.jurusan_id ? jurusanMap.get(member.jurusan_id) ?? "-" : "-",
        hadir: counts.hadir,
        tidak_hadir: counts.tidak_hadir,
        izin: counts.izin,
        sakit: counts.sakit,
        totalPertemuan: total,
        persentase: total > 0 ? Math.round((counts.hadir / total) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap, "id"));

  const withdrawals = composition.hadir + composition.tidak_hadir + composition.izin + composition.sakit;
  const averageAttendance =
    withdrawals > 0 ? Math.round((composition.hadir / withdrawals) * 1000) / 10 : 0;

  const monthly: MonthlyStat[] = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({
      key,
      label: monthLabel(key),
      hadir: v.hadir,
      total: v.total,
      persentase: v.total > 0 ? Math.round((v.hadir / v.total) * 1000) / 10 : 0,
    }));

  const streaks: StreakStat[] = [];
  for (const [memberId, rows] of datesByMember) {
    const member = members.get(memberId);
    if (!member) continue;
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    let streak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].status === "hadir") break;
      streak += 1;
    }
    if (streak > 0) {
      streaks.push({
        member_id: member.id,
        nis: member.nis,
        nama_lengkap: member.nama_lengkap,
        rombel: member.rombel,
        kelas: member.kelas,
        streak,
      });
    }
  }
  streaks.sort((a, b) => b.streak - a.streak || a.nama_lengkap.localeCompare(b.nama_lengkap, "id"));

  return {
    totalMembers: members.size,
    totalMeetings: meetings.length,
    averageAttendance,
    composition,
    monthly,
    students,
    streaks,
  };
}

export async function getSummaryForSemester(extraId: string, semesterId: string) {
  const [{ count: activeMembers }, { count: meetingCount, data: meetings }] = await Promise.all([
    db()
      .from("member_extra")
      .select("id", { count: "exact", head: true })
      .eq("extra_id", extraId)
      .eq("semester_id", semesterId)
      .eq("status", "aktif"),
    db()
      .from("pertemuan")
      .select("id, tanggal", { count: "exact" })
      .eq("extra_id", extraId)
      .eq("semester_id", semesterId),
  ]);

  const ids = ((meetings ?? []) as Array<{ id: string }>).map((m) => m.id);
  let hadir = 0;
  let total = 0;
  if (ids.length > 0) {
    const { data } = await db()
      .from("presensi")
      .select("status")
      .in("pertemuan_id", ids);
    for (const row of (data ?? []) as Array<{ status: PresensiStatus }>) {
      if (STATUSES.includes(row.status)) {
        total += 1;
        if (row.status === "hadir") hadir += 1;
      }
    }
  }
  return {
    activeMembers: activeMembers ?? 0,
    meetingCount: meetingCount ?? 0,
    attendance: total > 0 ? Math.round((hadir / total) * 1000) / 10 : 0,
  };
}
