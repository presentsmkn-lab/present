/**
 * Seed awal Pencatatan Ekstrakurikuler.
 *
 * Jalankan:
 *   npm run seed
 *
 * Variabel yang dibutuhkan di .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_ADMIN_USERNAME
 *   SEED_ADMIN_PASSWORD
 *
 * Opsional:
 *   SEED_ADMIN_NAMA       (label admin, default username)
 *   SEED_SAMPLE_JURUSAN   set "0" untuk melewati data contoh jurusan
 *   SEED_UPDATE_PASSWORD  set "1" untuk mereset password admin yang sudah ada
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} belum diatur.`);
  return value;
}

const SAMPLE_JURUSAN = [
  { kode: "TKJ", nama_panjang: "Teknik Komputer dan Jaringan" },
  { kode: "TKR", nama_panjang: "Teknik Kendaraan Ringan" },
  { kode: "AKL", nama_panjang: "Akuntansi dan Keuangan Lembaga" },
  { kode: "OTKP", nama_panjang: "Otomatisasi dan Tata Kelola Perkantoran" },
];

async function main() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const username = required("SEED_ADMIN_USERNAME").trim();
  const password = required("SEED_ADMIN_PASSWORD");

  if (username.length < 3) throw new Error("SEED_ADMIN_USERNAME minimal 3 karakter.");
  if (password.length < 8) throw new Error("SEED_ADMIN_PASSWORD minimal 8 karakter.");

  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: findError } = await db
    .from("admins")
    .select("id, username")
    .eq("username", username)
    .maybeSingle();
  if (findError) throw new Error(`Gagal memeriksa admin: ${findError.message}`);

  if (existing) {
    if (process.env.SEED_UPDATE_PASSWORD === "1") {
      const password_hash = await bcrypt.hash(password, 10);
      const { error } = await db.from("admins").update({ password_hash }).eq("id", existing.id);
      if (error) throw new Error(`Gagal memperbarui password admin: ${error.message}`);
      console.log(`Password admin "${username}" diperbarui.`);
    } else {
      console.log(`Admin "${username}" sudah ada. Password tidak diubah.`);
      console.log("Set SEED_UPDATE_PASSWORD=1 jika ingin mereset password.");
    }
  } else {
    const password_hash = await bcrypt.hash(password, 10);
    const { error } = await db.from("admins").insert({ username, password_hash });
    if (error) throw new Error(`Gagal membuat admin: ${error.message}`);
    console.log(`Admin pertama "${username}" berhasil dibuat.`);
  }

  if (process.env.SEED_SAMPLE_JURUSAN !== "0") {
    const { error } = await db
      .from("jurusan")
      .upsert(SAMPLE_JURUSAN, { onConflict: "kode", ignoreDuplicates: true });
    if (error) throw new Error(`Gagal menambahkan jurusan contoh: ${error.message}`);
    console.log(`${SAMPLE_JURUSAN.length} jurusan contoh dipastikan tersedia (tidak menimpa data lama).`);
  }

  console.log("Seed selesai. Buka /login dan masuk dengan akun admin.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
