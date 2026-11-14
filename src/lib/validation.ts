import { z } from "zod";

const teks = (label: string, min = 1, max = 200) =>
  z
    .string({ message: `${label} wajib diisi.` })
    .trim()
    .min(min, `${label} minimal ${min} karakter.`)
    .max(max, `${label} maksimal ${max} karakter.`);

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid.");

export const uuidSchema = z.string().uuid("ID tidak valid.");

export const loginSchema = z.object({
  identitas: teks("Username / NIS", 2, 60),
  password: teks("Password", 4, 100),
});

export const picCreateSchema = z.object({
  nis: teks("NIS", 3, 30).regex(/^[0-9A-Za-z.-]+$/, "NIS hanya boleh huruf, angka, titik, dan strip."),
  nama: teks("Nama lengkap", 2, 120),
  password: teks("Password", 6, 100),
});

export const picUpdateSchema = picCreateSchema
  .partial({ password: true })
  .extend({ id: uuidSchema, is_active: z.boolean() });

export const passwordSchema = teks("Password", 6, 100);

export const extraSchema = z.object({
  nama: teks("Nama ekstrakurikuler", 2, 120),
});

export const jurusanSchema = z.object({
  kode: teks("Kode jurusan", 1, 12)
    .transform((v) => v.toUpperCase())
    .refine((v) => /^[A-Z0-9]+$/.test(v), "Kode jurusan hanya huruf dan angka."),
  nama_panjang: teks("Nama panjang jurusan", 3, 150),
});

export const assignPicSchema = z.object({
  extra_id: uuidSchema,
  pic_id: uuidSchema,
  peran: z.enum(["utama", "asisten"]),
});

export const memberSchema = z.object({
  nis: teks("NIS", 2, 30).regex(/^[0-9A-Za-z.-]+$/, "NIS hanya boleh huruf, angka, titik, dan strip."),
  nama_lengkap: teks("Nama lengkap", 2, 120),
  rombel: teks("Rombel", 1, 20),
  kelas: z.enum(["X", "XI", "XII"], { message: "Kelas tidak valid." }),
  jurusan_id: uuidSchema,
  joined_at: dateSchema.optional(),
});

export const memberUpdateSchema = memberSchema.extend({
  id: uuidSchema,
  joined_at: dateSchema,
});

export const jadwalSchema = z.object({
  hari: z
    .array(z.enum(["senin", "selasa", "rabu", "kamis", "jumat"]))
    .min(1, "Pilih minimal satu hari latihan."),
  berlaku_mulai: dateSchema,
});

export const liburSchema = z.object({
  tanggal: dateSchema,
  alasan: teks("Alasan libur", 2, 150),
});

export const profileSchema = z.object({
  nama_lengkap: teks("Nama lengkap", 2, 120),
});

export const changePasswordSchema = z
  .object({
    password_lama: teks("Password lama", 4, 100),
    password_baru: teks("Password baru", 6, 100),
    konfirmasi: teks("Konfirmasi password", 6, 100),
  })
  .refine((data) => data.password_baru === data.konfirmasi, {
    message: "Konfirmasi password tidak sama.",
    path: ["konfirmasi"],
  });

export const pengaturanSchema = z.object({
  link_pembuat: z
    .string()
    .trim()
    .max(500, "Link terlalu panjang.")
    .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "Link harus diawali http:// atau https://"),
  nama_pembuat: z.string().trim().max(120, "Nama terlalu panjang.").optional().default(""),
});

const linkOpsional = z
  .string()
  .trim()
  .max(500, "Link terlalu panjang.")
  .refine(
    (v) => v === "" || /^https?:\/\/.+/i.test(v),
    "Kontak/tautan harus diawali http:// atau https://",
  )
  .optional()
  .default("");

export const tentangSchema = z.object({
  app_nama: teks("Nama aplikasi", 2, 120),
  app_versi: teks("Versi aplikasi", 1, 40),
  app_deskripsi: teks("Deskripsi aplikasi", 10, 1200),
  nama_pembuat: z.string().trim().max(120, "Nama pembuat terlalu panjang.").optional().default(""),
  pembuat_peran: z.string().trim().max(120, "Peran pembuat terlalu panjang.").optional().default(""),
  pembuat_instansi: z.string().trim().max(160, "Instansi terlalu panjang.").optional().default(""),
  pembuat_bio: z.string().trim().max(600, "Bio pembuat terlalu panjang.").optional().default(""),
  link_pembuat: linkOpsional,
});

export const kenaikanDateSchema = z.object({ tanggal: dateSchema });

const semesterRangeShape = {
  tanggal_mulai: dateSchema,
  tanggal_selesai: dateSchema,
};

export const semesterCreateSchema = z
  .object(semesterRangeShape)
  .refine((data) => data.tanggal_selesai >= data.tanggal_mulai, {
    message: "Tanggal selesai harus sama atau setelah tanggal mulai.",
    path: ["tanggal_selesai"],
  });

export const semesterDatesSchema = z
  .object({ id: uuidSchema, ...semesterRangeShape })
  .refine((data) => data.tanggal_selesai >= data.tanggal_mulai, {
    message: "Tanggal selesai harus sama atau setelah tanggal mulai.",
    path: ["tanggal_selesai"],
  });

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Data tidak valid.";
}

export function collectErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !result[key]) result[key] = issue.message;
  }
  return result;
}
