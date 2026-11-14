import { createPicAction } from "@/actions/admin";
import { Field, PageHeader, SearchParamsAlert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "Tambah PIC" };

export default async function TambahPicPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="page">
      <PageHeader
        title="Tambah PIC"
        subtitle="Akun Penanggung Jawab ekstrakurikuler."
        back="/admin/pic"
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />
      <div className="card mt-4">
        <form action={createPicAction} className="space-y-4">
          <Field label="NIS" htmlFor="nis" hint="NIS dipakai untuk login PIC.">
            <input
              id="nis"
              name="nis"
              className="input"
              required
              minLength={3}
              maxLength={30}
              placeholder="Contoh: 19876543"
              inputMode="text"
              autoCapitalize="none"
            />
          </Field>
          <Field label="Nama lengkap" htmlFor="nama">
            <input id="nama" name="nama" className="input" required maxLength={120} placeholder="Nama PIC" />
          </Field>
          <Field
            label="Password awal"
            htmlFor="password"
            hint="Minimal 6 karakter. Admin dapat melihat dan mereset password ini nanti."
          >
            <input
              id="password"
              name="password"
              type="text"
              className="input"
              required
              minLength={6}
              maxLength={100}
              placeholder="Password untuk PIC"
              autoComplete="off"
            />
          </Field>
          <SubmitButton className="w-full">Simpan PIC</SubmitButton>
        </form>
      </div>
    </main>
  );
}
