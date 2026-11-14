import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth/session";
import { getExtra, getExtraAccess } from "@/lib/queries/extra";
import { getActiveSemester, listSemesters } from "@/lib/queries/semester";
import { buildWorkbook } from "@/lib/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  const extra = await getExtra(id);
  if (!extra) {
    return NextResponse.json({ error: "Ekstrakurikuler tidak ditemukan." }, { status: 404 });
  }

  if (session.kind === "admin") {
    const { data } = await db().from("admins").select("id").eq("id", session.id).maybeSingle();
    if (!data) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  } else {
    const { data } = await db()
      .from("pics")
      .select("id, is_active")
      .eq("id", session.id)
      .maybeSingle();
    const pic = data as { id: string; is_active: boolean } | null;
    if (!pic || !pic.is_active) {
      return NextResponse.json({ error: "Akun tidak aktif." }, { status: 403 });
    }
    const access = await getExtraAccess(session.id, id);
    if (!access) {
      return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 403 });
    }
  }

  try {
    const [semesters, activeSemester] = await Promise.all([listSemesters(), getActiveSemester()]);
    const { buffer, filename } = await buildWorkbook({
      extras: [extra],
      semesters,
      activeSemester,
    });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat file Excel." },
      { status: 500 },
    );
  }
}
