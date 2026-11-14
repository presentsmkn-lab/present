import Link from "next/link";
import { requirePicExtra } from "@/lib/auth/pic-extra";
import { listJurusan } from "@/lib/queries/extra";
import { addMemberAction } from "@/actions/pic";
import { Alert, PageHeader, SearchParamsAlert } from "@/components/ui";
import { MemberForm } from "@/components/member-form";
import { todayISO } from "@/lib/date";

export const metadata = { title: "Tambah Anggota" };

export default async function TambahAnggotaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { extra, semester } = await requirePicExtra(id);
  const query = await searchParams;
  const jurusan = await listJurusan();

  return (
    <main className="page">
      <PageHeader title="Tambah Anggota" subtitle={extra.nama} back={`/pic/extra/${id}/anggota`} />
      <SearchParamsAlert error={query.error} ok={query.ok} />
      {!semester ? (
        <Alert tone="warning" className="mt-4">
          Belum ada semester aktif. Hubungi admin.
        </Alert>
      ) : jurusan.length === 0 ? (
        <Alert tone="warning" className="mt-4">
          Admin belum mengisi daftar jurusan. Minta admin menambah jurusan terlebih dahulu.
        </Alert>
      ) : (
        <div className="card mt-4">
          <MemberForm
            action={addMemberAction}
            extraId={id}
            jurusan={jurusan}
            joinedAt={todayISO()}
            submitLabel="Tambah ke Anggota"
          />
          <p className="muted mt-3 text-xs">
            Jika NIS sudah terdaftar pada ekstrakurikuler lain, data siswa akan dipakai ulang dan
            ditambahkan ke kegiatan ini.
          </p>
        </div>
      )}
      <Link href={`/pic/extra/${id}/anggota`} className="btn-ghost mt-3 w-full">
        Batal
      </Link>
    </main>
  );
}
