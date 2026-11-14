import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requirePic } from "@/lib/auth/guards";
import { getExtraAccess } from "@/lib/queries/extra";
import { getActiveSemester } from "@/lib/queries/semester";
import type { ExtraRow, PicRow, SemesterRow, Session } from "@/types/db";

export const requirePicExtra = cache(
  async (
    extraId: string,
  ): Promise<{
    session: Session;
    pic: PicRow;
    extra: ExtraRow;
    peran: "utama" | "asisten";
    semester: SemesterRow | null;
  }> => {
    const { session, pic } = await requirePic();
    const access = await getExtraAccess(pic.id, extraId);
    if (!access) notFound();
    const semester = await getActiveSemester();
    return { session, pic, extra: access.extra, peran: access.peran, semester };
  },
);
