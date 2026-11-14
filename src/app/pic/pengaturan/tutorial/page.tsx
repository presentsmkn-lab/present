import { requirePic } from "@/lib/auth/guards";
import { getPicExtras } from "@/lib/queries/extra";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { PageHeader } from "@/components/ui";
import { TutorialView } from "@/components/tutorial-view";

export const metadata = { title: "Tutorial" };

export default async function PicTutorialPage() {
  const { pic } = await requirePic();
  const [settings, extras] = await Promise.all([getSettings(), getPicExtras(pic.id)]);
  const extraId = extras.length === 1 ? extras[0].extra.id : undefined;

  return (
    <>
      <AppHeader
        title="Tutorial"
        subtitle={pic.nama_lengkap}
        homeHref={extraId ? `/pic/extra/${extraId}` : "/pic"}
        logoSrc={settings.logo_sekolah_url}
      />
      <main className="page">
        <PageHeader
          title="Tutorial Penggunaan"
          subtitle="Panduan langkah demi langkah untuk PIC dan Admin."
          back="/pic/pengaturan"
        />
        <TutorialView defaultRole="pic" extraId={extraId} />
      </main>
      <BottomNav kind="pic" extraId={extraId} />
    </>
  );
}
