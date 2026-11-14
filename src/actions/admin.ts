"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth/guards";
import { encryptPassword, hashPassword, verifyHash } from "@/lib/auth/password";
import {
  firstError,
  jurusanSchema,
  kenaikanDateSchema,
  pengaturanSchema,
  picCreateSchema,
  picUpdateSchema,
  extraSchema,
  assignPicSchema,
  semesterCreateSchema,
  semesterDatesSchema,
  tentangSchema,
  uuidSchema,
} from "@/lib/validation";
import { listSemesters, nextSemester, sortSemesters } from "@/lib/queries/semester";
import { getSettings, setSetting } from "@/lib/settings";
import { defaultSemesterRange, todayISO } from "@/lib/date";
import type { AdminRow, MemberRow, SemesterRow } from "@/types/db";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

const MIGRASI_TANGGAL_HINT =
  "Kolom tanggal semester belum ada di database. Jalankan file supabase/migrations/20261115000000_semester_dates.sql di Supabase SQL Editor terlebih dahulu.";

/** Pesan ramah bila migrasi tanggal semester belum diterapkan. */
function semesterDbMessage(code: string | undefined, message: string): string {
  return code === "42703" ? MIGRASI_TANGGAL_HINT : message;
}

function done(path: string, message: string): never {
  redirect(`${path}?ok=${encodeURIComponent(message)}`);
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

// --------------------------------------------------------------------------
// PIC
// --------------------------------------------------------------------------
export async function createPicAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = picCreateSchema.safeParse({
    nis: formData.get("nis"),
    nama: formData.get("nama"),
    password: formData.get("password"),
  });
  if (!parsed.success) fail("/admin/pic/baru", firstError(parsed.error));

  const { data, error } = await db()
    .from("pics")
    .insert({
      nis: parsed.data.nis,
      nama_lengkap: parsed.data.nama,
      password_encrypted: encryptPassword(parsed.data.password),
      is_active: true,
    })
    .select("id")
    .maybeSingle();
  if (error) {
    fail(
      "/admin/pic/baru",
      error.code === "23505" ? "NIS tersebut sudah dipakai PIC lain." : error.message,
    );
  }
  revalidatePath("/admin/pic");
  done(`/admin/pic/${(data as { id: string }).id}`, "PIC berhasil ditambahkan.");
}

export async function updatePicAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = text(formData, "id");
  const path = `/admin/pic/${id}`;
  const password = text(formData, "password");
  const parsed = picUpdateSchema.safeParse({
    id,
    nis: formData.get("nis"),
    nama: formData.get("nama"),
    password: password || undefined,
    is_active: checked(formData, "is_active"),
  });
  if (!parsed.success) fail(path, firstError(parsed.error));

  const update: Record<string, unknown> = {
    nis: parsed.data.nis,
    nama_lengkap: parsed.data.nama,
    is_active: parsed.data.is_active,
  };
  if (password) update.password_encrypted = encryptPassword(password);

  const { error } = await db().from("pics").update(update).eq("id", id);
  if (error) {
    fail(path, error.code === "23505" ? "NIS tersebut sudah dipakai PIC lain." : error.message);
  }
  revalidatePath("/admin/pic");
  revalidatePath(path);
  done(path, "Data PIC diperbarui.");
}

export async function resetPicPasswordAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const password = text(formData, "password");
  if (!id.success || password.length < 6 || password.length > 100) {
    fail("/admin/pic", "Password baru minimal 6 karakter.");
  }
  const { error } = await db()
    .from("pics")
    .update({ password_encrypted: encryptPassword(password) })
    .eq("id", id.data);
  if (error) fail(`/admin/pic/${id.data}`, error.message);
  revalidatePath(`/admin/pic/${id.data}`);
  done(`/admin/pic/${id.data}`, "Password PIC berhasil direset.");
}

// --------------------------------------------------------------------------
// Ekstrakurikuler & PIC assignment
// --------------------------------------------------------------------------
export async function createExtraAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = extraSchema.safeParse({ nama: formData.get("nama") });
  if (!parsed.success) fail("/admin/ekstrakurikuler/baru", firstError(parsed.error));
  const { data, error } = await db()
    .from("extrakurikuler")
    .insert({ nama: parsed.data.nama })
    .select("id")
    .maybeSingle();
  if (error) {
    fail(
      "/admin/ekstrakurikuler/baru",
      error.code === "23505" ? "Nama ekstrakurikuler sudah ada." : error.message,
    );
  }
  revalidatePath("/admin/ekstrakurikuler");
  done(
    `/admin/ekstrakurikuler/${(data as { id: string }).id}`,
    "Ekstrakurikuler berhasil dibuat. Tugaskan PIC agar bisa dikelola.",
  );
}

export async function updateExtraAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const parsed = extraSchema.safeParse({ nama: formData.get("nama") });
  if (!id.success) fail("/admin/ekstrakurikuler", "ID tidak valid.");
  if (!parsed.success) fail(`/admin/ekstrakurikuler/${id.data}`, firstError(parsed.error));
  const { error } = await db()
    .from("extrakurikuler")
    .update({ nama: parsed.data.nama })
    .eq("id", id.data);
  if (error) {
    fail(
      `/admin/ekstrakurikuler/${id.data}`,
      error.code === "23505" ? "Nama ekstrakurikuler sudah ada." : error.message,
    );
  }
  revalidatePath("/admin/ekstrakurikuler");
  done(`/admin/ekstrakurikuler/${id.data}`, "Nama ekstrakurikuler diperbarui.");
}

export async function assignPicAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = assignPicSchema.safeParse({
    extra_id: formData.get("extra_id"),
    pic_id: formData.get("pic_id"),
    peran: formData.get("peran"),
  });
  if (!parsed.success) {
    fail(`/admin/ekstrakurikuler/${String(formData.get("extra_id") ?? "")}`, firstError(parsed.error));
  }
  const { error } = await db()
    .from("pic_extra")
    .upsert(parsed.data, { onConflict: "pic_id,extra_id" });
  if (error) fail(`/admin/ekstrakurikuler/${parsed.data.extra_id}`, error.message);
  revalidatePath(`/admin/ekstrakurikuler/${parsed.data.extra_id}`);
  done(`/admin/ekstrakurikuler/${parsed.data.extra_id}`, "Penugasan PIC disimpan.");
}

export async function removePicAssignmentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const extraId = text(formData, "extra_id");
  if (!id.success) fail(`/admin/ekstrakurikuler/${extraId}`, "ID penugasan tidak valid.");
  const { error } = await db().from("pic_extra").delete().eq("id", id.data);
  if (error) fail(`/admin/ekstrakurikuler/${extraId}`, error.message);
  revalidatePath(`/admin/ekstrakurikuler/${extraId}`);
  done(`/admin/ekstrakurikuler/${extraId}`, "Penugasan PIC dihapus.");
}

// --------------------------------------------------------------------------
// Jurusan
// --------------------------------------------------------------------------
export async function createJurusanAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = jurusanSchema.safeParse({
    kode: formData.get("kode"),
    nama_panjang: formData.get("nama_panjang"),
  });
  if (!parsed.success) fail("/admin/jurusan", firstError(parsed.error));
  const { error } = await db().from("jurusan").insert(parsed.data);
  if (error) {
    fail(
      "/admin/jurusan",
      error.code === "23505" ? "Kode jurusan sudah dipakai." : error.message,
    );
  }
  revalidatePath("/admin/jurusan");
  done("/admin/jurusan", "Jurusan ditambahkan.");
}

export async function updateJurusanAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const parsed = jurusanSchema.safeParse({
    kode: formData.get("kode"),
    nama_panjang: formData.get("nama_panjang"),
  });
  if (!id.success) fail("/admin/jurusan", "ID jurusan tidak valid.");
  if (!parsed.success) fail("/admin/jurusan", firstError(parsed.error));
  const { error } = await db().from("jurusan").update(parsed.data).eq("id", id.data);
  if (error) {
    fail(
      "/admin/jurusan",
      error.code === "23505" ? "Kode jurusan sudah dipakai." : error.message,
    );
  }
  revalidatePath("/admin/jurusan");
  done("/admin/jurusan", "Data jurusan diperbarui.");
}

// --------------------------------------------------------------------------
// Semester
// --------------------------------------------------------------------------
export async function createNextSemesterAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const semesters = sortSemesters(await listSemesters());
  const latest = semesters[semesters.length - 1] ?? null;
  const next = nextSemester(latest);
  const previousActive = semesters.filter((s) => s.is_active);
  const fallback = defaultSemesterRange(next.tahun_ajaran, next.semester_ke);

  const parsed = semesterCreateSchema.safeParse({
    tanggal_mulai: text(formData, "tanggal_mulai") || fallback.tanggal_mulai,
    tanggal_selesai: text(formData, "tanggal_selesai") || fallback.tanggal_selesai,
  });
  if (!parsed.success) fail("/admin/semester", firstError(parsed.error));

  const { error: deactivateError } = await db()
    .from("semesters")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) fail("/admin/semester", deactivateError.message);

  const { data: created, error } = await db()
    .from("semesters")
    .insert({
      ...next,
      tanggal_mulai: parsed.data.tanggal_mulai,
      tanggal_selesai: parsed.data.tanggal_selesai,
      is_active: true,
    })
    .select("*")
    .maybeSingle();
  if (error || !created) {
    if (previousActive[0]) {
      await db().from("semesters").update({ is_active: true }).eq("id", previousActive[0].id);
    }
    fail(
      "/admin/semester",
      error?.code === "23505"
        ? "Semester tersebut sudah ada."
        : semesterDbMessage(error?.code, error?.message ?? "Gagal membuat semester."),
    );
  }

  const newSemester = created as SemesterRow;
  const source = previousActive[0] ?? latest;
  if (source) {
    const { data: memberships } = await db()
      .from("member_extra")
      .select("member_id, extra_id, joined_at, status, member:members(status)")
      .eq("semester_id", source.id)
      .eq("status", "aktif");
    const rows = ((memberships ?? []) as unknown as Array<{
      member_id: string;
      extra_id: string;
      joined_at: string;
      status: string;
      member: { status: string } | Array<{ status: string }> | null;
    }>)
      .filter((m) => {
        const member = Array.isArray(m.member) ? m.member[0] : m.member;
        return member?.status === "aktif";
      })
      .map((m) => ({
        member_id: m.member_id,
        extra_id: m.extra_id,
        semester_id: newSemester.id,
        joined_at: m.joined_at,
        status: "aktif",
      }));
    if (rows.length > 0) {
      await db()
        .from("member_extra")
        .upsert(rows, { onConflict: "member_id,extra_id,semester_id", ignoreDuplicates: true });
    }
  }

  revalidatePath("/", "layout");
  done(
    "/admin/semester",
    `Semester ${newSemester.tahun_ajaran} Semester ${newSemester.semester_ke} dibuat dan diaktifkan.`,
  );
}

export async function activateSemesterAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) fail("/admin/semester", "ID semester tidak valid.");
  const { data: target } = await db().from("semesters").select("id").eq("id", id.data).maybeSingle();
  if (!target) fail("/admin/semester", "Semester tidak ditemukan.");
  await db().from("semesters").update({ is_active: false }).eq("is_active", true);
  const { error } = await db().from("semesters").update({ is_active: true }).eq("id", id.data);
  if (error) fail("/admin/semester", error.message);
  revalidatePath("/", "layout");
  done("/admin/semester", "Semester aktif diperbarui.");
}

export async function updateSemesterDatesAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = semesterDatesSchema.safeParse({
    id: formData.get("id"),
    tanggal_mulai: formData.get("tanggal_mulai"),
    tanggal_selesai: formData.get("tanggal_selesai"),
  });
  if (!parsed.success) fail("/admin/semester", firstError(parsed.error));

  const { data: target } = await db()
    .from("semesters")
    .select("id")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!target) fail("/admin/semester", "Semester tidak ditemukan.");

  const { error } = await db()
    .from("semesters")
    .update({
      tanggal_mulai: parsed.data.tanggal_mulai,
      tanggal_selesai: parsed.data.tanggal_selesai,
    })
    .eq("id", parsed.data.id);
  if (error) fail("/admin/semester", semesterDbMessage(error.code, error.message));

  revalidatePath("/admin/semester");
  revalidatePath("/admin");
  done("/admin/semester", "Tanggal semester diperbarui.");
}

export async function deleteSemesterAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const konfirmasi1 = text(formData, "konfirmasi1");
  const konfirmasi2 = text(formData, "konfirmasi2");
  if (!id.success) fail("/admin/semester", "ID semester tidak valid.");
  if (konfirmasi1 !== "ya" || konfirmasi2 !== "ya") {
    fail("/admin/semester", "Konfirmasi ganda diperlukan untuk menghapus semester.");
  }
  const semesters = sortSemesters(await listSemesters());
  if (semesters.length <= 1) {
    fail("/admin/semester", "Semester terakhir tidak boleh dihapus. Buat semester berikutnya terlebih dahulu.");
  }
  const target = semesters.find((s) => s.id === id.data);
  if (!target) fail("/admin/semester", "Semester tidak ditemukan.");
  const { error } = await db().from("semesters").delete().eq("id", id.data);
  if (error) fail("/admin/semester", error.message);
  if (target.is_active) {
    const remaining = semesters.filter((s) => s.id !== id.data);
    const replacement = remaining[remaining.length - 1];
    if (replacement) {
      await db().from("semesters").update({ is_active: true }).eq("id", replacement.id);
    }
  }
  revalidatePath("/", "layout");
  done("/admin/semester", `Semester ${target.tahun_ajaran} Semester ${target.semester_ke} dihapus.`);
}

// --------------------------------------------------------------------------
// Kenaikan kelas
// --------------------------------------------------------------------------
export async function setKenaikanDateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = kenaikanDateSchema.safeParse({ tanggal: formData.get("tanggal") });
  if (!parsed.success) fail("/admin/kenaikan", firstError(parsed.error));
  await db().from("kenaikan_jadwal").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await db().from("kenaikan_jadwal").insert({ tanggal: parsed.data.tanggal });
  if (error) fail("/admin/kenaikan", error.message);
  await setSetting("kenaikan_selesai", "");
  revalidatePath("/admin");
  revalidatePath("/admin/kenaikan");
  done("/admin/kenaikan", "Tanggal kenaikan kelas disimpan.");
}

export async function confirmKenaikanAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { data: jadwalData } = await db()
    .from("kenaikan_jadwal")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const jadwal = jadwalData as { id: string; tanggal: string } | null;
  if (!jadwal) fail("/admin/kenaikan", "Belum ada tanggal kenaikan kelas.");
  const today = todayISO();
  if (today < jadwal.tanggal) {
    fail("/admin/kenaikan", "Kenaikan kelas belum dapat dijalankan sebelum tanggal yang ditentukan.");
  }
  const settings = await getSettings();
  if (settings.kenaikan_selesai === jadwal.tanggal) {
    fail("/admin/kenaikan", "Kenaikan kelas untuk tanggal ini sudah dijalankan.");
  }

  const naikIds = new Set(
    formData
      .getAll("naik")
      .filter((v): v is string => typeof v === "string")
      .map((v) => v),
  );

  const { data: membersData } = await db()
    .from("members")
    .select("*")
    .in("kelas", ["X", "XI", "XII"])
    .eq("status", "aktif");
  const members = (membersData ?? []) as MemberRow[];
  if (members.length === 0) fail("/admin/kenaikan", "Tidak ada siswa aktif yang bisa dinaikkan.");

  const naikXI: string[] = [];
  const naikXII: string[] = [];
  const lulus: string[] = [];
  const logs: Array<Record<string, unknown>> = [];

  for (const member of members) {
    if (!naikIds.has(member.id)) continue; // ditandai tidak naik (tinggal kelas)
    let ke: "XI" | "XII" | "LULUS" | null = null;
    if (member.kelas === "X") {
      ke = "XI";
      naikXI.push(member.id);
    } else if (member.kelas === "XI") {
      ke = "XII";
      naikXII.push(member.id);
    } else if (member.kelas === "XII") {
      ke = "LULUS";
      lulus.push(member.id);
    }
    if (!ke) continue;
    logs.push({
      tanggal: today,
      dari_kelas: member.kelas,
      ke_kelas: ke,
      member_id: member.id,
      member_nis: member.nis,
      member_nama: member.nama_lengkap,
    });
  }

  if (logs.length === 0) fail("/admin/kenaikan", "Tidak ada siswa yang dipilih untuk naik kelas.");

  let tinggalKelas = 0;
  for (const member of members) {
    if (naikIds.has(member.id)) continue;
    tinggalKelas += 1;
    logs.push({
      tanggal: today,
      dari_kelas: member.kelas,
      ke_kelas: member.kelas,
      member_id: member.id,
      member_nis: member.nis,
      member_nama: member.nama_lengkap,
    });
  }

  const errors: string[] = [];
  if (naikXI.length > 0) {
    const { error } = await db().from("members").update({ kelas: "XI" }).in("id", naikXI);
    if (error) errors.push(error.message);
  }
  if (naikXII.length > 0) {
    const { error } = await db().from("members").update({ kelas: "XII" }).in("id", naikXII);
    if (error) errors.push(error.message);
  }
  if (lulus.length > 0) {
    const { error } = await db()
      .from("members")
      .update({ kelas: "LULUS", status: "lulus", lulus_at: new Date().toISOString() })
      .in("id", lulus);
    if (error) errors.push(error.message);
    const { error: membershipError } = await db()
      .from("member_extra")
      .update({ status: "keluar" })
      .in("member_id", lulus);
    if (membershipError) errors.push(membershipError.message);
  }
  if (errors.length > 0) fail("/admin/kenaikan", `Sebagian gagal diproses: ${errors[0]}`);

  const { error: logError } = await db().from("kenaikan_log").insert(logs);
  if (logError) fail("/admin/kenaikan", logError.message);
  await setSetting("kenaikan_selesai", jadwal.tanggal);

  revalidatePath("/", "layout");
  done(
    "/admin/kenaikan",
    `Kenaikan kelas selesai: ${naikXI.length} siswa ke XI, ${naikXII.length} ke XII, ${lulus.length} lulus${
      tinggalKelas > 0 ? `, ${tinggalKelas} siswa tinggal kelas` : ""
    }.`,
  );
}

// --------------------------------------------------------------------------
// Logo & pengaturan aplikasi
// --------------------------------------------------------------------------
export async function uploadLogoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const kind = text(formData, "kind");
  if (kind !== "sekolah" && kind !== "pembuat") fail("/admin/branding", "Jenis logo tidak valid.");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    fail("/admin/branding", "Pilih file logo terlebih dahulu.");
  }
  if (file.size > 2 * 1024 * 1024) {
    fail("/admin/branding", "Ukuran logo maksimal 2 MB.");
  }
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    fail("/admin/branding", "Format logo harus PNG, JPG, atau WEBP.");
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const png = await sharp(input)
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const path = `${kind}-${Date.now()}.png`;
    const { error } = await db()
      .storage.from("branding")
      .upload(path, png, { contentType: "image/png", upsert: false });
    if (error) fail("/admin/branding", `Gagal upload: ${error.message}`);

    const settings = await getSettings();
    const oldUrl = kind === "sekolah" ? settings.logo_sekolah_url : settings.logo_pembuat_url;
    const marker = "/storage/v1/object/public/branding/";
    if (oldUrl && oldUrl.includes(marker)) {
      const oldPath = decodeURIComponent(oldUrl.split(marker)[1] ?? "");
      if (oldPath) await db().storage.from("branding").remove([oldPath]);
    }

    const { data } = db().storage.from("branding").getPublicUrl(path);
    await setSetting(kind === "sekolah" ? "logo_sekolah_url" : "logo_pembuat_url", data.publicUrl);
    revalidatePath("/", "layout");
    done("/admin/branding", "Logo berhasil diunggah.");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT")) throw error;
    const digest = (error as { digest?: string } | null)?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    fail("/admin/branding", "Gambar tidak dapat diproses. Gunakan file gambar yang valid.");
  }
}

export async function deleteLogoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const kind = text(formData, "kind");
  if (kind !== "sekolah" && kind !== "pembuat") fail("/admin/branding", "Jenis logo tidak valid.");
  if (kind === "pembuat" && text(formData, "konfirmasi_hapus") !== "ya") {
    fail("/admin/branding", "Centang peringatan garansi sebelum menghapus logo pembuat.");
  }
  const settings = await getSettings();
  const url = kind === "sekolah" ? settings.logo_sekolah_url : settings.logo_pembuat_url;
  const marker = "/storage/v1/object/public/branding/";
  if (url && url.includes(marker)) {
    const path = decodeURIComponent(url.split(marker)[1] ?? "");
    if (path) await db().storage.from("branding").remove([path]);
  }
  await setSetting(kind === "sekolah" ? "logo_sekolah_url" : "logo_pembuat_url", "");
  revalidatePath("/", "layout");
  done("/admin/branding", "Logo dihapus.");
}

export async function saveAppSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = pengaturanSchema.safeParse({
    link_pembuat: text(formData, "link_pembuat"),
    nama_pembuat: text(formData, "nama_pembuat") || undefined,
  });
  if (!parsed.success) fail("/admin/branding", firstError(parsed.error));
  await setSetting("link_pembuat", parsed.data.link_pembuat);
  await setSetting("nama_pembuat", parsed.data.nama_pembuat ?? "");
  revalidatePath("/", "layout");
  done("/admin/branding", "Pengaturan branding disimpan.");
}

export async function saveTentangAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = tentangSchema.safeParse({
    app_nama: formData.get("app_nama"),
    app_versi: formData.get("app_versi"),
    app_deskripsi: formData.get("app_deskripsi"),
    nama_pembuat: text(formData, "nama_pembuat"),
    pembuat_peran: text(formData, "pembuat_peran"),
    pembuat_instansi: text(formData, "pembuat_instansi"),
    pembuat_bio: text(formData, "pembuat_bio"),
    link_pembuat: text(formData, "link_pembuat"),
  });
  if (!parsed.success) fail("/admin/pengaturan/tentang", firstError(parsed.error));

  const entries: Array<[string, string]> = [
    ["app_nama", parsed.data.app_nama],
    ["app_versi", parsed.data.app_versi],
    ["app_deskripsi", parsed.data.app_deskripsi],
    ["nama_pembuat", parsed.data.nama_pembuat ?? ""],
    ["pembuat_peran", parsed.data.pembuat_peran ?? ""],
    ["pembuat_instansi", parsed.data.pembuat_instansi ?? ""],
    ["pembuat_bio", parsed.data.pembuat_bio ?? ""],
    ["link_pembuat", parsed.data.link_pembuat ?? ""],
  ];
  for (const [key, value] of entries) await setSetting(key, value);

  revalidatePath("/", "layout");
  done("/admin/pengaturan/tentang", "Informasi Tentang Aplikasi berhasil disimpan.");
}

// --------------------------------------------------------------------------
// Akun admin
// --------------------------------------------------------------------------
export async function changeAdminPasswordAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const current = text(formData, "password_lama");
  const next = text(formData, "password_baru");
  const confirm = text(formData, "konfirmasi");
  if (next.length < 8) fail("/admin/pengaturan", "Password baru minimal 8 karakter.");
  if (next !== confirm) fail("/admin/pengaturan", "Konfirmasi password tidak sama.");
  const { data } = await db().from("admins").select("*").eq("id", session.id).maybeSingle();
  const admin = data as AdminRow | null;
  if (!admin || !(await verifyHash(current, admin.password_hash))) {
    fail("/admin/pengaturan", "Password lama salah.");
  }
  const { error } = await db()
    .from("admins")
    .update({ password_hash: await hashPassword(next) })
    .eq("id", session.id);
  if (error) fail("/admin/pengaturan", error.message);
  done("/admin/pengaturan", "Password admin diperbarui.");
}
