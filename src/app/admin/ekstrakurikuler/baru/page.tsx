import { createExtraAction } from "@/actions/admin";
import { Field, PageHeader, SearchParamsAlert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "Tambah Ekstrakurikuler" };

export default async function TambahEkstrakurikulerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="page">
      <PageHeader
        title="Tambah Ekstrakurikuler"
        subtitle="Buat kegiatan baru, lalu tugaskan PIC."
        back="/admin/ekstrakurikuler"
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />
      <div className="card mt-4">
        <form action={createExtraAction} className="space-y-4">
          <Field label="Nama ekstrakurikuler" htmlFor="nama" hint="Contoh: Pramuka, PMR, Futsal.">
            <input
              id="nama"
              name="nama"
              className="input"
              required
              minLength={2}
              maxLength={120}
              placeholder="Nama kegiatan"
            />
          </Field>
          <SubmitButton className="w-full">Simpan Ekstrakurikuler</SubmitButton>
        </form>
      </div>
      <p className="muted mt-4 text-xs">
        Setelah dibuat, Anda akan diarahkan ke halaman detail untuk menugaskan PIC utama/asisten.
      </p>
    </main>
  );
}
