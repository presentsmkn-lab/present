"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { db } from "@/lib/supabase";
import { requirePic } from "@/lib/auth/guards";
import { decryptPassword, encryptPassword, safeEqual } from "@/lib/auth/password";
import { getExtraAccess } from "@/lib/queries/extra";
import { getActiveSemester } from "@/lib/queries/semester";
import { getMembersForSemester } from "@/lib/queries/members";
import { isEditableMonth, savePresensi } from "@/lib/queries/presensi";
import { getSettings } from "@/lib/settings";
import { todayISO } from "@/lib/date";
import {
  changePasswordSchema,
  firstError,
  jadwalSchema,
  liburSchema,
  memberSchema,
  memberUpdateSchema,
  profileSchema,
  uuidSchema,
} from "@/lib/validation";
import type { MemberRow, PicRow, PresensiStatus } from "@/types/db";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function done(path: string, message: string): never {
  redirect(`${path}?ok=${encodeURIComponent(message)}`);
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireExtra(extraId: string) {
  const { pic } = await requirePic();
  if (!uuidSchema.safeParse(extraId).success) redirect("/pic");
  const access = await getExtraAccess(pic.id, extraId);
  if (!access) redirect("/pic?error=Anda%20tidak%20memiliki%20akses%20ke%20ekstrakurikuler%20tersebut.");
  const semester = await getActiveSemester();
  return { pic, extra: access.extra, semester };
}

async function requireExtraWithSemester(extraId: string) {
  const context = await requireExtra(extraId);
  if (!context.semester) {
    redirect(`/pic/extra/${extraId}?error=Belum%20ada%20semester%20aktif.%20Hubungi%20admin.`);
  }
  return { ...context, semester: context.semester };
}

// --------------------------------------------------------------------------
// Anggota
// --------------------------------------------------------------------------
export async function addMemberAction(formData: FormData): Promise<void> {
  const extraId = text(formData, "extra_id");
  const { semester } = await requireExtraWithSemester(extraId);
  const path = `/pic/extra/${extraId}/anggota`;
  const parsed = memberSchema.safeParse({
    nis: formData.get("nis"),
    nama_lengkap: formData.get("nama_lengkap"),
    rombel: formData.get("rombel"),
    kelas: formData.get("kelas"),
    jurusan_id: formData.get("jurusan_id"),
    joined_at: text(formData, "joined_at") || undefined,
  });
  if (!parsed.success) fail(path, firstError(parsed.error));
  const data = parsed.data;
  const joinedAt = data.joined_at || todayISO();

  const { data: existingData, error: findError } = await db()
    .from("members")
    .select("*")
    .eq("nis", data.nis)
    .maybeSingle();
  if (findError) fail(path, findError.message);
  let member = existingData as MemberRow | null;

  if (member && member.status === "lulus") {
    fail(path, "Siswa dengan NIS ini sudah berstatus LULUS dan tidak dapat ditambahkan kembali.");
  }

  if (member) {
    const { error } = await db()
      .from("members")
      .update({
        nama_lengkap: data.nama_lengkap,
        rombel: data.rombel,
        kelas: data.kelas,
        jurusan_id: data.jurusan_id,
        status: "aktif",
      })
      .eq("id", member.id);
    if (error) fail(path, error.message);
  } else {
    const { data: created, error } = await db()
      .from("members")
      .insert({
        nis: data.nis,
        nama_lengkap: data.nama_lengkap,
        rombel: data.rombel,
        kelas: data.kelas,
        jurusan_id: data.jurusan_id,
        status: "aktif",
        joined_at: joinedAt,
      })
      .select("*")
      .maybeSingle();
    if (error || !created) fail(path, error?.message ?? "Gagal menambah anggota.");
    member = created as MemberRow;
  }

  const { data: membership } = await db()
    .from("member_extra")
    .select("id")
    .eq("member_id", member.id)
    .eq("extra_id", extraId)
    .eq("semester_id", semester.id)
    .maybeSingle();

  if (membership) {
    const { error } = await db()
      .from("member_extra")
      .update({ status: "aktif", joined_at: joinedAt })
      .eq("id", (membership as { id: string }).id);
    if (error) fail(path, error.message);
  } else {
    const { error } = await db().from("member_extra").insert({
      member_id: member.id,
      extra_id: extraId,
      semester_id: semester.id,
      joined_at: joinedAt,
      status: "aktif",
    });
    if (error) fail(path, error.message);
  }

  revalidatePath(path);
  revalidatePath(`/pic/extra/${extraId}`);
  done(path, `${data.nama_lengkap} ditambahkan sebagai anggota.`);
}

export async function updateMemberAction(formData: FormData): Promise<void> {
  const extraId = text(formData, "extra_id");
  const { semester } = await requireExtraWithSemester(extraId);
  const path = `/pic/extra/${extraId}/anggota`;
  const parsed = memberUpdateSchema.safeParse({
    id: formData.get("id"),
    nis: formData.get("nis"),
    nama_lengkap: formData.get("nama_lengkap"),
    rombel: formData.get("rombel"),
    kelas: formData.get("kelas"),
    jurusan_id: formData.get("jurusan_id"),
    joined_at: text(formData, "joined_at") || todayISO(),
  });
  if (!parsed.success) fail(path, firstError(parsed.error));
  const data = parsed.data;

  const { data: membership } = await db()
    .from("member_extra")
    .select("id")
    .eq("member_id", data.id)
    .eq("extra_id", extraId)
    .eq("semester_id", semester.id)
    .eq("status", "aktif")
    .limit(1)
    .maybeSingle();
  if (!membership) fail(path, "Anggota tidak ditemukan pada ekstrakurikuler ini.");

  const { error } = await db()
    .from("members")
    .update({
      nis: data.nis,
      nama_lengkap: data.nama_lengkap,
      rombel: data.rombel,
      kelas: data.kelas,
      jurusan_id: data.jurusan_id,
    })
    .eq("id", data.id);
  if (error) {
    fail(path, error.code === "23505" ? "NIS tersebut sudah dipakai siswa lain." : error.message);
  }

  await db()
    .from("member_extra")
    .update({ joined_at: data.joined_at })
    .eq("member_id", data.id)
    .eq("extra_id", extraId)
    .eq("semester_id", semester.id);

  revalidatePath(path);
  done(path, "Data anggota diperbarui.");
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const extraId = text(formData, "extra_id");
  const { semester } = await requireExtraWithSemester(extraId);
  const memberId = uuidSchema.safeParse(formData.get("member_id"));
  const path = `/pic/extra/${extraId}/anggota`;
  if (!memberId.success) fail(path, "Anggota tidak valid.");
  const { error } = await db()
    .from("member_extra")
    .update({ status: "keluar" })
    .eq("member_id", memberId.data)
    .eq("extra_id", extraId)
    .eq("semester_id", semester.id);
  if (error) fail(path, error.message);
  revalidatePath(path);
  done(path, "Anggota dikeluarkan dari ekstrakurikuler ini.");
}

// --------------------------------------------------------------------------
// Jadwal & libur
// --------------------------------------------------------------------------
export async function saveJadwalAction(formData: FormData): Promise<void> {
  const extraId = text(formData, "extra_id");
  await requireExtra(extraId);
  const path = `/pic/extra/${extraId}/jadwal`;
  const parsed = jadwalSchema.safeParse({
    hari: formData.getAll("hari").filter((v): v is string => typeof v === "string"),
    berlaku_mulai: formData.get("berlaku_mulai"),
  });
  if (!parsed.success) fail(path, firstError(parsed.error));

  const { error: deleteError } = await db()
    .from("extra_hari_jadwal")
    .delete()
    .eq("extra_id", extraId)
    .eq("berlaku_mulai", parsed.data.berlaku_mulai);
  if (deleteError) fail(path, deleteError.message);

  const { error } = await db().from("extra_hari_jadwal").insert(
    parsed.data.hari.map((hari) => ({
      extra_id: extraId,
      hari,
      berlaku_mulai: parsed.data.berlaku_mulai,
    })),
  );
  if (error) fail(path, error.message);

  // Pertemuan masa depan yang belum berlangsung dibuat ulang mengikuti jadwal baru.
  await db()
    .from("pertemuan")
    .delete()
    .eq("extra_id", extraId)
    .gt("tanggal", todayISO());

  revalidatePath(path);
  revalidatePath(`/pic/extra/${extraId}`);
  done(path, "Jadwal latihan disimpan. Riwayat sebelumnya tidak berubah.");
}

export async function addLiburAction(formData: FormData): Promise<void> {
  const extraId = text(formData, "extra_id");
  await requireExtra(extraId);
  const path = `/pic/extra/${extraId}/jadwal`;
  const parsed = liburSchema.safeParse({
    tanggal: formData.get("tanggal"),
    alasan: formData.get("alasan"),
  });
  if (!parsed.success) fail(path, firstError(parsed.error));

  const { error } = await db()
    .from("libur")
    .upsert(
      { extra_id: extraId, tanggal: parsed.data.tanggal, alasan: parsed.data.alasan },
      { onConflict: "extra_id,tanggal" },
    );
  if (error) fail(path, error.message);

  await db()
    .from("pertemuan")
    .delete()
    .eq("extra_id", extraId)
    .eq("tanggal", parsed.data.tanggal);

  revalidatePath(path);
  revalidatePath(`/pic/extra/${extraId}/presensi`);
  done(path, "Hari libur ditandai dan tidak dihitung sebagai pertemuan.");
}

export async function removeLiburAction(formData: FormData): Promise<void> {
  const extraId = text(formData, "extra_id");
  await requireExtra(extraId);
  const path = `/pic/extra/${extraId}/jadwal`;
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) fail(path, "Data libur tidak valid.");
  const { error } = await db().from("libur").delete().eq("id", id.data).eq("extra_id", extraId);
  if (error) fail(path, error.message);
  revalidatePath(path);
  revalidatePath(`/pic/extra/${extraId}/presensi`);
  done(path, "Tanda libur dihapus. Pertemuan akan dibuat kembali sesuai jadwal.");
}

// --------------------------------------------------------------------------
// Presensi
// --------------------------------------------------------------------------
export async function savePresensiAction(formData: FormData): Promise<void> {
  const extraId = text(formData, "extra_id");
  const { pic } = await requireExtra(extraId);
  const meetingId = uuidSchema.safeParse(formData.get("pertemuan_id"));
  const tanggal = text(formData, "tanggal");
  if (!meetingId.success) fail(`/pic/extra/${extraId}/presensi`, "Pertemuan tidak valid.");
  if (!isEditableMonth(tanggal)) {
    fail(
      `/pic/extra/${extraId}/presensi`,
      "Presensi bulan sebelumnya hanya dapat dilihat, tidak dapat diubah.",
    );
  }

  const statuses: Record<string, PresensiStatus> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("status_") || typeof value !== "string") continue;
    const memberId = key.slice("status_".length);
    if (!uuidSchema.safeParse(memberId).success) continue;
    if (!["hadir", "tidak_hadir", "izin", "sakit"].includes(value)) continue;
    statuses[memberId] = value as PresensiStatus;
  }

  if (Object.keys(statuses).length === 0) {
    fail(`/pic/extra/${extraId}/presensi/${tanggal}`, "Tidak ada status yang dipilih.");
  }

  try {
    const result = await savePresensi(
      meetingId.data,
      extraId,
      statuses,
      `PIC: ${pic.nama_lengkap} (${pic.nis})`,
    );
    revalidatePath(`/pic/extra/${extraId}/presensi`);
    revalidatePath(`/pic/extra/${extraId}/presensi/${tanggal}`);
    revalidatePath(`/pic/extra/${extraId}/statistik`);
    done(
      `/pic/extra/${extraId}/presensi/${tanggal}`,
      result.changed === 0 ? "Tidak ada perubahan presensi." : `Presensi disimpan (${result.changed} perubahan).`,
    );
  } catch (error) {
    const digest = (error as { digest?: string } | null)?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    fail(
      `/pic/extra/${extraId}/presensi/${tanggal}`,
      error instanceof Error ? error.message : "Gagal menyimpan presensi.",
    );
  }
}

/** Dipakai halaman detail untuk memuat daftar anggota pada semester pertemuan. */
export async function membersForMeetingSemester(extraId: string, semesterId: string) {
  await requireExtra(extraId);
  return getMembersForSemester(extraId, semesterId);
}

// --------------------------------------------------------------------------
// Profil & password PIC
// --------------------------------------------------------------------------
export async function updateProfileAction(formData: FormData): Promise<void> {
  const { pic } = await requirePic();
  const path = "/pic/pengaturan";
  const parsed = profileSchema.safeParse({ nama_lengkap: formData.get("nama_lengkap") });
  if (!parsed.success) fail(path, firstError(parsed.error));

  let fotoUrl = pic.foto_url;
  const file = formData.get("foto");
  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) fail(path, "Ukuran foto maksimal 2 MB.");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      fail(path, "Format foto harus PNG, JPG, atau WEBP.");
    }
    try {
      const input = Buffer.from(await file.arrayBuffer());
      const png = await sharp(input)
        .resize({ width: 600, height: 600, fit: "cover", position: "centre" })
        .png()
        .toBuffer();
      const objectPath = `pic-${pic.id}-${Date.now()}.png`;
      const { error: uploadError } = await db()
        .storage.from("branding")
        .upload(objectPath, png, { contentType: "image/png", upsert: false });
      if (uploadError) fail(path, `Gagal upload foto: ${uploadError.message}`);
      fotoUrl = db().storage.from("branding").getPublicUrl(objectPath).data.publicUrl;
      await removeBrandingObject(pic.foto_url);
    } catch (error) {
      const digest = (error as { digest?: string } | null)?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
      fail(path, "Foto tidak dapat diproses. Gunakan gambar lain.");
    }
  } else if (text(formData, "hapus_foto") === "ya") {
    await removeBrandingObject(pic.foto_url);
    fotoUrl = null;
  }

  const { error } = await db()
    .from("pics")
    .update({ nama_lengkap: parsed.data.nama_lengkap, foto_url: fotoUrl })
    .eq("id", pic.id);
  if (error) fail(path, error.message);
  revalidatePath("/", "layout");
  done(path, "Profil diperbarui.");
}

async function removeBrandingObject(url: string | null): Promise<void> {
  if (!url) return;
  const marker = "/storage/v1/object/public/branding/";
  if (!url.includes(marker)) return;
  const path = decodeURIComponent(url.split(marker)[1] ?? "");
  if (path) await db().storage.from("branding").remove([path]);
}

export async function changePicPasswordAction(formData: FormData): Promise<void> {
  const { pic } = await requirePic();
  const path = "/pic/pengaturan";
  const parsed = changePasswordSchema.safeParse({
    password_lama: formData.get("password_lama"),
    password_baru: formData.get("password_baru"),
    konfirmasi: formData.get("konfirmasi"),
  });
  if (!parsed.success) fail(path, firstError(parsed.error));
  let current = "";
  try {
    current = decryptPassword(pic.password_encrypted);
  } catch {
    fail(path, "Data akun bermasalah. Hubungi admin.");
  }
  if (!safeEqual(parsed.data.password_lama, current)) fail(path, "Password lama salah.");
  const { error } = await db()
    .from("pics")
    .update({ password_encrypted: encryptPassword(parsed.data.password_baru) })
    .eq("id", pic.id);
  if (error) fail(path, error.message);
  done(path, "Password berhasil diubah. Gunakan password baru saat login berikutnya.");
}

/** Dipakai untuk mengecek apakah PIC sudah punya foto (server). */
export async function getPicProfile(): Promise<PicRow> {
  const { pic } = await requirePic();
  return pic;
}

export async function getBranding(): Promise<Record<string, string>> {
  await requirePic();
  return getSettings();
}
