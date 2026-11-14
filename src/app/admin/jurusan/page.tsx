import { createJurusanAction, updateJurusanAction } from "@/actions/admin";
import { listJurusan } from "@/lib/queries/extra";
import { db } from "@/lib/supabase";
import { Badge, EmptyState, Field, PageHeader, SearchParamsAlert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { EditIcon, SchoolIcon } from "@/components/icons";

export const metadata = { title: "Kelola Jurusan" };

export default async function AdminJurusanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const query = await searchParams;
  const [jurusan, members] = await Promise.all([
    listJurusan(),
    db().from("members").select("jurusan_id, status").eq("status", "aktif"),
  ]);
  const counts = new Map<string, number>();
  for (const row of (members.data ?? []) as Array<{ jurusan_id: string | null }>) {
    if (!row.jurusan_id) continue;
    counts.set(row.jurusan_id, (counts.get(row.jurusan_id) ?? 0) + 1);
  }

  return (
    <main className="page">
      <PageHeader
        title="Kelola Jurusan"
        subtitle="Kode singkat dan nama panjang jurusan."
        back="/admin"
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <section className="card mt-2">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <SchoolIcon size={18} /> Tambah jurusan
        </h2>
        <form action={createJurusanAction} className="space-y-3">
          <div className="field-grid">
            <Field label="Kode" htmlFor="kode" hint="Contoh: TKJ, TKR, AKL.">
              <input
                id="kode"
                name="kode"
                className="input uppercase"
                required
                maxLength={12}
                placeholder="TKJ"
                autoCapitalize="characters"
              />
            </Field>
            <Field label="Nama panjang" htmlFor="nama_panjang">
              <input
                id="nama_panjang"
                name="nama_panjang"
                className="input"
                required
                minLength={3}
                maxLength={150}
                placeholder="Teknik Komputer dan Jaringan"
              />
            </Field>
          </div>
          <SubmitButton className="w-full">Tambah Jurusan</SubmitButton>
        </form>
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Daftar jurusan
          </h2>
          <Badge tone="blue">{jurusan.length}</Badge>
        </div>
        {jurusan.length === 0 ? (
          <EmptyState
            title="Belum ada jurusan"
            description="Tambahkan jurusan sebelum PIC menambahkan anggota."
            icon={<SchoolIcon size={24} />}
          />
        ) : (
          <div className="space-y-2.5">
            {jurusan.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="badge bg-navy-900 text-white dark:bg-navy-600">{item.kode}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {item.nama_panjang}
                  </span>
                  <span className="muted text-[11px]">
                    {counts.get(item.id) ?? 0} siswa aktif
                  </span>
                </div>
                <details>
                  <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-navy-700 dark:text-navy-300">
                    <EditIcon size={14} /> Edit jurusan
                  </summary>
                  <form action={updateJurusanAction} className="mt-2 space-y-2">
                    <input type="hidden" name="id" value={item.id} />
                    <div className="field-grid">
                      <Field label="Kode" htmlFor={`kode-${item.id}`}>
                        <input
                          id={`kode-${item.id}`}
                          name="kode"
                          className="input uppercase"
                          defaultValue={item.kode}
                          required
                          maxLength={12}
                        />
                      </Field>
                      <Field label="Nama panjang" htmlFor={`nama-${item.id}`}>
                        <input
                          id={`nama-${item.id}`}
                          name="nama_panjang"
                          className="input"
                          defaultValue={item.nama_panjang}
                          required
                          maxLength={150}
                        />
                      </Field>
                    </div>
                    <SubmitButton variant="secondary" className="w-full">
                      Simpan Perubahan
                    </SubmitButton>
                  </form>
                </details>
              </div>
            ))}
          </div>
        )}
        <p className="muted mt-3 text-xs">
          Jurusan tidak dapat dihapus agar riwayat anggota tetap utuh. Perubahan kode dan nama
          berlaku langsung pada data anggota.
        </p>
      </section>
    </main>
  );
}
