import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getSession } from "@/lib/auth/session";
import { listExtras } from "@/lib/queries/extra";
import { getActiveSemester, listSemesters } from "@/lib/queries/semester";
import { buildWorkbook } from "@/lib/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }
  if (session.kind !== "admin") {
    return NextResponse.json({ error: "Hanya admin yang dapat mengekspor semua data." }, { status: 403 });
  }
  const { data: admin } = await db().from("admins").select("id").eq("id", session.id).maybeSingle();
  if (!admin) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  }

  try {
    const [extras, semesters, activeSemester] = await Promise.all([
      listExtras(),
      listSemesters(),
      getActiveSemester(),
    ]);
    const { buffer, filename } = await buildWorkbook({ extras, semesters, activeSemester });
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
