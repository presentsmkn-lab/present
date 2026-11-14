import "server-only";
import { db } from "@/lib/supabase";
import type { Hari, JadwalRow } from "@/types/db";

export type JadwalSegment = {
  berlaku_mulai: string;
  hari: Hari[];
};

const URUTAN_HARI: Hari[] = ["senin", "selasa", "rabu", "kamis", "jumat"];

export async function getJadwalRows(extraId: string): Promise<JadwalRow[]> {
  const { data, error } = await db()
    .from("extra_hari_jadwal")
    .select("*")
    .eq("extra_id", extraId)
    .order("berlaku_mulai", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as JadwalRow[];
}

/** Kelompokkan riwayat jadwal: satu kelompok per tanggal berlaku. */
export function toSegments(rows: JadwalRow[]): JadwalSegment[] {
  const map = new Map<string, Set<Hari>>();
  for (const row of rows) {
    if (!map.has(row.berlaku_mulai)) map.set(row.berlaku_mulai, new Set());
    map.get(row.berlaku_mulai)!.add(row.hari as Hari);
  }
  return [...map.entries()]
    .map(([berlaku_mulai, days]) => ({
      berlaku_mulai,
      hari: URUTAN_HARI.filter((h) => days.has(h)),
    }))
    .sort((a, b) => a.berlaku_mulai.localeCompare(b.berlaku_mulai));
}

/** Jadwal yang berlaku pada tanggal tertentu (riwayat tidak diubah). */
export function jadwalPada(segments: JadwalSegment[], dateISO: string): Hari[] {
  let result: Hari[] = [];
  for (const segment of segments) {
    if (segment.berlaku_mulai <= dateISO) result = segment.hari;
    else break;
  }
  return result;
}

export async function getJadwalSegments(extraId: string): Promise<JadwalSegment[]> {
  return toSegments(await getJadwalRows(extraId));
}

/** Ambil jadwal yang berlaku hari ini (untuk ringkasan). */
export function jadwalHariIni(segments: JadwalSegment[], today: string): Hari[] {
  return jadwalPada(segments, today);
}
