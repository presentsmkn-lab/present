import { PageHeader } from "@/components/ui";
import { TutorialView } from "@/components/tutorial-view";

export const metadata = { title: "Tutorial Admin" };

export default async function AdminTutorialPage() {
  return (
    <main className="page">
      <PageHeader
        title="Tutorial Penggunaan"
        subtitle="Panduan langkah demi langkah untuk Admin dan PIC."
        back="/admin/pengaturan"
      />
      <TutorialView defaultRole="admin" />
    </main>
  );
}
