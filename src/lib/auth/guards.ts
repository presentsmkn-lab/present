import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/supabase";
import type { PicRow, Session } from "@/types/db";

export const requireAdmin = cache(async (): Promise<Session> => {
  const session = await getSession();
  if (!session || session.kind !== "admin") redirect("/login");
  const { data } = await db().from("admins").select("id").eq("id", session.id).maybeSingle();
  if (!data) redirect("/login");
  return session;
});

export const requirePic = cache(async (): Promise<{ session: Session; pic: PicRow }> => {
  const session = await getSession();
  if (!session || session.kind !== "pic") redirect("/login");
  const { data } = await db()
    .from("pics")
    .select("*")
    .eq("id", session.id)
    .maybeSingle();
  if (!data || !data.is_active) {
    redirect("/login?error=akun-nonaktif");
  }
  return { session, pic: data as PicRow };
});
