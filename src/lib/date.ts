const TZ = "Asia/Jakarta";
const DAY_NAMES = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"] as const;
export type DayName = (typeof DAY_NAMES)[number];

/** Tanggal hari ini (zona Asia/Jakarta) dalam format YYYY-MM-DD. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function currentMonth(): string {
  return todayISO().slice(0, 7);
}

export function isValidMonth(value: string | undefined | null): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function formatTanggal(dateISO: string, withWeekday = false): string {
  if (!dateISO) return "-";
  const d = new Date(`${dateISO.slice(0, 10)}T00:00:00Z`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withWeekday ? { weekday: "long" } : {}),
    timeZone: "UTC",
  }).format(d);
}

export function formatTanggalSingkat(dateISO: string): string {
  if (!dateISO) return "-";
  const d = new Date(`${dateISO.slice(0, 10)}T00:00:00Z`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(d);
}

export function formatDateTime(value: string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(value));
}

/** 0 = Minggu, 1 = Senin, ... 6 = Sabtu (dihitung dari string tanggal). */
export function weekdayOf(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00Z`).getUTCDay();
}

export function dayNameOf(dateISO: string): DayName {
  return DAY_NAMES[weekdayOf(dateISO)];
}

export function datesInMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: last }, (_, i) => {
    const d = String(i + 1).padStart(2, "0");
    return `${month}-${d}`;
  });
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function lastMonths(count: number): string[] {
  const result: string[] = [];
  let m = currentMonth();
  for (let i = 0; i < count; i++) {
    result.push(m);
    m = addMonths(m, -1);
  }
  return result;
}

export function semesterLabel(s: { tahun_ajaran: string; semester_ke: number }): string {
  return `${s.tahun_ajaran} • Semester ${s.semester_ke}`;
}

export function academicYearStart(tahunAjaran: string): number {
  return Number(tahunAjaran.split("/")[0]);
}

/** Rentang tanggal bawaan untuk sebuah semester (Juli–Desember / Januari–Juni). */
export function defaultSemesterRange(
  tahunAjaran: string,
  semesterKe: 1 | 2,
): { tanggal_mulai: string; tanggal_selesai: string } {
  const start = academicYearStart(tahunAjaran);
  if (semesterKe === 1) {
    return { tanggal_mulai: `${start}-07-01`, tanggal_selesai: `${start}-12-31` };
  }
  return { tanggal_mulai: `${start + 1}-01-01`, tanggal_selesai: `${start + 1}-06-30` };
}

/** Label rentang tanggal semester yang aman untuk data lama (kolom masih kosong). */
export function semesterRangeLabel(semester: {
  tanggal_mulai?: string | null;
  tanggal_selesai?: string | null;
}): string {
  const mulai = semester.tanggal_mulai ?? null;
  const selesai = semester.tanggal_selesai ?? null;
  if (mulai && selesai) return `${formatTanggal(mulai)} – ${formatTanggal(selesai)}`;
  if (mulai) return `Mulai ${formatTanggal(mulai)}`;
  if (selesai) return `Selesai ${formatTanggal(selesai)}`;
  return "Tanggal belum diatur";
}

export function isPastMonth(month: string): boolean {
  return month < currentMonth();
}

export function oneMonthAgoISO(): string {
  const d = new Date(`${todayISO()}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 10);
}
