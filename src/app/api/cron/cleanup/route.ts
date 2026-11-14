import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/auth/password";
import { oneMonthAgoISO } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function cleanup(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  let expected = "";
  try {
    expected = env("CRON_SECRET");
  } catch {
    return NextResponse.json({ error: "CRON_SECRET belum diatur." }, { status: 500 });
  }
  if (!token || !safeEqual(token, expected)) return unauthorized();

  const cutoff = `${oneMonthAgoISO()}T00:00:00.000Z`;
  const { data, error } = await db()
    .from("members")
    .delete()
    .eq("status", "lulus")
    .lt("lulus_at", cutoff)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    cutoff,
    deleted: data?.length ?? 0,
    ids: ((data ?? []) as Array<{ id: string }>).map((row) => row.id),
  });
}

export async function GET(request: Request) {
  return cleanup(request);
}

export async function POST(request: Request) {
  return cleanup(request);
}
