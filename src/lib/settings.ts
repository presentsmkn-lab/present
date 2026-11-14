import "server-only";
import { cache } from "react";
import { db } from "@/lib/supabase";
import type { AppSettings } from "@/types/db";

export const getSettings = cache(async (): Promise<AppSettings> => {
  const { data } = await db().from("app_settings").select("key, value");
  const result: AppSettings = {};
  for (const row of (data ?? []) as Array<{ key: string; value: string }>) {
    result[row.key] = row.value;
  }
  return result;
});

export async function setSetting(key: string, value: string): Promise<void> {
  const { error } = await db()
    .from("app_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw new Error(`Gagal menyimpan pengaturan: ${error.message}`);
}
