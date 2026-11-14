import "server-only";
import { db } from "@/lib/supabase";
import { academicYearStart, todayISO } from "@/lib/date";
import type { SemesterRow } from "@/types/db";

export async function listSemesters(): Promise<SemesterRow[]> {
  const { data, error } = await db()
    .from("semesters")
    .select("*")
    .order("tahun_ajaran", { ascending: true })
    .order("semester_ke", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as SemesterRow[];
}

export async function getActiveSemester(): Promise<SemesterRow | null> {
  const { data } = await db().from("semesters").select("*").eq("is_active", true).maybeSingle();
  return (data as SemesterRow | null) ?? null;
}

export async function getSemester(id: string): Promise<SemesterRow | null> {
  const { data } = await db().from("semesters").select("*").eq("id", id).maybeSingle();
  return (data as SemesterRow | null) ?? null;
}

/** Urutan semester berikutnya setelah semester terakhir. */
export function nextSemester(latest: SemesterRow | null): {
  tahun_ajaran: string;
  semester_ke: 1 | 2;
} {
  if (!latest) {
    const [y, m] = todayISO().split("-").map(Number);
    const start = m >= 7 ? y : y - 1;
    return { tahun_ajaran: `${start}/${start + 1}`, semester_ke: 1 };
  }
  if (latest.semester_ke === 1) {
    return { tahun_ajaran: latest.tahun_ajaran, semester_ke: 2 };
  }
  const start = academicYearStart(latest.tahun_ajaran) + 1;
  return { tahun_ajaran: `${start}/${start + 1}`, semester_ke: 1 };
}

export function sortSemesters(list: SemesterRow[]): SemesterRow[] {
  return [...list].sort((a, b) => {
    if (a.tahun_ajaran !== b.tahun_ajaran) return a.tahun_ajaran.localeCompare(b.tahun_ajaran);
    return a.semester_ke - b.semester_ke;
  });
}
