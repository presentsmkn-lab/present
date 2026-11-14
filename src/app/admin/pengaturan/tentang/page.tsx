import { getSettings } from "@/lib/settings";
import { PageHeader, SearchParamsAlert } from "@/components/ui";
import { TentangView } from "@/components/info-pages";
import { TentangEditDialog } from "@/components/tentang-edit-dialog";

export const metadata = { title: "Tentang" };

export default async function AdminTentangPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const query = await searchParams;
  const settings = await getSettings();

  return (
    <main className="page">
      <PageHeader
        title="Tentang Aplikasi"
        subtitle="Informasi website dan profil pembuat aplikasi."
        back="/admin/pengaturan"
      />
      <SearchParamsAlert error={query.error} ok={query.ok} className="mb-3" />
      <div className="mb-4">
        <TentangEditDialog settings={settings} />
      </div>
      <TentangView settings={settings} role="admin" />
    </main>
  );
}
