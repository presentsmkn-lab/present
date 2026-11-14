import { notFound } from "next/navigation";
import { requirePicExtra } from "@/lib/auth/pic-extra";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Badge } from "@/components/ui";
import { semesterLabel } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function PicExtraLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { extra, peran, semester } = await requirePicExtra(id);
  const settings = await getSettings();

  return (
    <>
      <AppHeader
        title={extra.nama}
        subtitle={semester ? semesterLabel(semester) : "Belum ada semester aktif"}
        homeHref={`/pic/extra/${id}`}
        logoSrc={settings.logo_sekolah_url}
        badge={<Badge tone={peran === "utama" ? "navy" : "blue"}>{peran === "utama" ? "UTAMA" : "ASISTEN"}</Badge>}
      />
      <div className="flex-1">{children}</div>
      <BottomNav kind="pic" extraId={id} />
    </>
  );
}
