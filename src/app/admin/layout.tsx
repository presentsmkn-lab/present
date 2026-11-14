import { requireAdmin } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        title="Admin"
        subtitle="SMKN 10 Semarang"
        homeHref="/admin"
        logoSrc={settings.logo_sekolah_url}
        badge={<Badge tone="navy">ADMIN</Badge>}
      />
      <div className="flex-1">{children}</div>
      <BottomNav kind="admin" />
    </div>
  );
}
