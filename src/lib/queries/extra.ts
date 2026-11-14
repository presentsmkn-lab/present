import "server-only";
import { db } from "@/lib/supabase";
import type { ExtraRow, PicRow } from "@/types/db";

export type PicExtraSummary = {
  id: string;
  peran: "utama" | "asisten";
  extra: ExtraRow;
};

export async function listExtras(): Promise<ExtraRow[]> {
  const { data, error } = await db().from("extrakurikuler").select("*").order("nama");
  if (error) throw new Error(error.message);
  return (data ?? []) as ExtraRow[];
}

export async function getExtra(id: string): Promise<ExtraRow | null> {
  const { data } = await db().from("extrakurikuler").select("*").eq("id", id).maybeSingle();
  return (data as ExtraRow | null) ?? null;
}

export async function getPicExtras(picId: string): Promise<PicExtraSummary[]> {
  const { data, error } = await db()
    .from("pic_extra")
    .select("id, peran, extra:extrakurikuler(*)")
    .eq("pic_id", picId);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    peran: "utama" | "asisten";
    extra: ExtraRow | ExtraRow[] | null;
  }>;
  return rows
    .filter((r) => r.extra)
    .map((r) => ({
      id: r.id,
      peran: r.peran,
      extra: Array.isArray(r.extra) ? r.extra[0] : (r.extra as ExtraRow),
    }))
    .filter((r) => Boolean(r.extra))
    .sort((a, b) => a.extra.nama.localeCompare(b.extra.nama));
}

export async function getExtraAccess(
  picId: string,
  extraId: string,
): Promise<{ extra: ExtraRow; peran: "utama" | "asisten" } | null> {
  const { data } = await db()
    .from("pic_extra")
    .select("peran, extra:extrakurikuler(*)")
    .eq("pic_id", picId)
    .eq("extra_id", extraId)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as {
    peran: "utama" | "asisten";
    extra: ExtraRow | ExtraRow[] | null;
  };
  const extra = Array.isArray(row.extra) ? row.extra[0] : row.extra;
  if (!extra) return null;
  return { extra, peran: row.peran };
}

export async function getExtraPicList(extraId: string): Promise<
  Array<{ id: string; peran: "utama" | "asisten"; pic: PicRow }>
> {
  const { data } = await db()
    .from("pic_extra")
    .select("id, peran, pic:pics(*)")
    .eq("extra_id", extraId);
  const rows = (data ?? []) as unknown as Array<{
    id: string;
    peran: "utama" | "asisten";
    pic: PicRow | PicRow[] | null;
  }>;
  return rows
    .filter((r) => r.pic)
    .map((r) => ({
      id: r.id,
      peran: r.peran,
      pic: (Array.isArray(r.pic) ? r.pic[0] : r.pic) as PicRow,
    }));
}

export async function listPics(): Promise<PicRow[]> {
  const { data, error } = await db().from("pics").select("*").order("nama_lengkap");
  if (error) throw new Error(error.message);
  return (data ?? []) as PicRow[];
}

export async function listJurusan() {
  const { data, error } = await db().from("jurusan").select("*").order("kode");
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{
    id: string;
    kode: string;
    nama_panjang: string;
  }>;
}
