import "server-only";
import { db } from "@/lib/supabase";
import type { MemberRow, MemberWithJurusan } from "@/types/db";

type RawMembership = {
  id: string;
  joined_at: string;
  status: "aktif" | "keluar";
  member:
    | (MemberRow & { jurusan: { kode: string; nama_panjang: string } | { kode: string; nama_panjang: string }[] | null })
    | Array<MemberRow & { jurusan: { kode: string; nama_panjang: string } | { kode: string; nama_panjang: string }[] | null }>
    | null;
};

function normalize(raw: RawMembership): MemberWithJurusan | null {
  const member = Array.isArray(raw.member) ? raw.member[0] : raw.member;
  if (!member) return null;
  const jurusan = Array.isArray(member.jurusan) ? member.jurusan[0] ?? null : member.jurusan;
  return {
    ...member,
    jurusan: jurusan ?? null,
    member_extra_status: raw.status,
    joined_extra_at: raw.joined_at,
  };
}

export async function getMembersForSemester(
  extraId: string,
  semesterId: string,
): Promise<MemberWithJurusan[]> {
  const { data, error } = await db()
    .from("member_extra")
    .select(
      "id, joined_at, status, member:members(*, jurusan:jurusan(kode, nama_panjang))",
    )
    .eq("extra_id", extraId)
    .eq("semester_id", semesterId);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawMembership[])
    .map(normalize)
    .filter((m): m is MemberWithJurusan => Boolean(m))
    .sort((a, b) =>
      (a.nama_lengkap ?? "").localeCompare(b.nama_lengkap ?? "", "id"),
    );
}

/** Anggota aktif yang dipakai untuk presensi & statistik periode. */
export async function getActiveMembersForSemester(
  extraId: string,
  semesterId: string,
): Promise<MemberWithJurusan[]> {
  const members = await getMembersForSemester(extraId, semesterId);
  return members.filter((m) => m.member_extra_status === "aktif" && m.status === "aktif");
}

export async function getMemberForExtra(
  extraId: string,
  memberId: string,
): Promise<MemberWithJurusan | null> {
  const { data } = await db()
    .from("member_extra")
    .select("id, joined_at, status, member:members(*, jurusan:jurusan(kode, nama_panjang))")
    .eq("extra_id", extraId)
    .eq("member_id", memberId)
    .order("joined_at", { ascending: false })
    .limit(1);
  const row = ((data ?? []) as unknown as RawMembership[])[0];
  return row ? normalize(row) : null;
}

export async function findMemberByNis(nis: string): Promise<MemberRow | null> {
  const { data } = await db().from("members").select("*").eq("nis", nis).maybeSingle();
  return (data as MemberRow | null) ?? null;
}

export async function countMembers(extraId: string, semesterId: string): Promise<number> {
  const { count } = await db()
    .from("member_extra")
    .select("id", { count: "exact", head: true })
    .eq("extra_id", extraId)
    .eq("semester_id", semesterId)
    .eq("status", "aktif");
  return count ?? 0;
}
