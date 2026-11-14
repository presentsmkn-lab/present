import { requirePic } from "@/lib/auth/guards";
import { getPicExtras } from "@/lib/queries/extra";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { PageHeader } from "@/components/ui";
import { TentangView } from "@/components/info-pages";

export const metadata = { title: "Tentang" };

export default async function PicTentangPage() {
  const { pic } = await requirePic();
  const [settings, extras] = await Promise.all([getSettings(), getPicExtras(pic.id)]);
  const extraId = extras.length === 1 ? extras[0].extra.id : undefined;

  return (
    <>
      <AppHeader
        title="Tentang"
        subtitle={pic.nama_lengkap}
        homeHref={extraId ? `/pic/extra/${extraId}` : "/pic"}
        logoSrc={settings.logo_sekolah_url}
      />
      <main className="page">
        <PageHeader title="Tentang" back="/pic/pengaturan" />
        <TentangView settings={settings} role="pic" />
      </main>
      <BottomNav kind="pic" extraId={extraId} />
    </>
  );
}
