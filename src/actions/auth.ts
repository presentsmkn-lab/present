"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/supabase";
import { decryptPassword, safeEqual, verifyHash } from "@/lib/auth/password";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/rate-limit";
import { firstError, loginSchema } from "@/lib/validation";
import { getPicExtras } from "@/lib/queries/extra";
import type { AdminRow, PicRow } from "@/types/db";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identitas: formData.get("identitas"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { identitas, password } = parsed.data;
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "lokal";

  const identityLimit = consumeRateLimit(`login:${ip}:${identitas.toLowerCase()}`, 6);
  const ipLimit = consumeRateLimit(`login-ip:${ip}`, 25);
  if (!identityLimit.allowed || !ipLimit.allowed) {
    return { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." };
  }

  try {
    const { data: adminData } = await db()
      .from("admins")
      .select("*")
      .eq("username", identitas)
      .maybeSingle();
    const admin = adminData as AdminRow | null;
    if (admin && (await verifyHash(password, admin.password_hash))) {
      await setSessionCookie({
        kind: "admin",
        id: admin.id,
        nama: admin.username,
        username: admin.username,
      });
      redirect("/admin");
    }

    const { data: picData } = await db()
      .from("pics")
      .select("*")
      .eq("nis", identitas)
      .maybeSingle();
    const pic = picData as PicRow | null;
    if (pic) {
      if (!pic.is_active) {
        return { error: "Akun PIC ini sedang dinonaktifkan. Hubungi admin." };
      }
      let stored = "";
      try {
        stored = decryptPassword(pic.password_encrypted);
      } catch {
        return { error: "Data akun bermasalah. Hubungi admin." };
      }
      if (safeEqual(password, stored)) {
        await setSessionCookie({
          kind: "pic",
          id: pic.id,
          nama: pic.nama_lengkap,
          nis: pic.nis,
        });
        const extras = await getPicExtras(pic.id);
        if (extras.length === 1) redirect(`/pic/extra/${extras[0].extra.id}`);
        redirect("/pic");
      }
    }
  } catch (error) {
    // redirect() melempar error khusus; teruskan.
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    const digest = (error as { digest?: string } | null)?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    return { error: "Tidak dapat memproses login. Coba lagi." };
  }

  return { error: "Username/NIS atau password salah." };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
