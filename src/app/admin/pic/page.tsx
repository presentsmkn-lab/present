import Link from "next/link";
import { listPics } from "@/lib/queries/extra";
import { db } from "@/lib/supabase";
import { Avatar, Badge, EmptyState, PageHeader, SearchParamsAlert } from "@/components/ui";
import { ArrowRightIcon, PlusIcon, UsersIcon } from "@/components/icons";

export const metadata = { title: "Kelola PIC" };

export default async function AdminPicPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const query = await searchParams;
  const [pics, assignments] = await Promise.all([
    listPics(),
    db().from("pic_extra").select("pic_id, extra:extrakurikuler(nama)"),
  ]);
  const byPic = new Map<string, string[]>();
  for (const row of (assignments.data ?? []) as unknown as Array<{
    pic_id: string;
    extra: { nama: string } | Array<{ nama: string }> | null;
  }>) {
    const extra = Array.isArray(row.extra) ? row.extra[0] : row.extra;
    if (!byPic.has(row.pic_id)) byPic.set(row.pic_id, []);
    if (extra?.nama) byPic.get(row.pic_id)!.push(extra.nama);
  }

  return (
    <main className="page">
      <PageHeader
        title="Kelola PIC"
        subtitle="Penanggung jawab ekstrakurikuler."
        back="/admin"
        action={
          <Link href="/admin/pic/baru" className="btn-primary px-3">
            <PlusIcon size={18} /> Tambah
          </Link>
        }
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      {pics.length === 0 ? (
        <EmptyState
          title="Belum ada PIC"
          description="Tambahkan akun PIC dengan NIS dan password. Admin dapat melihat password kapan saja."
          icon={<UsersIcon size={24} />}
          action={
            <Link href="/admin/pic/baru" className="btn-primary">
              <PlusIcon size={18} /> Tambah PIC
            </Link>
          }
        />
      ) : (
        <div className="mt-4 space-y-2">
          {pics.map((pic) => {
            const extras = byPic.get(pic.id) ?? [];
            return (
              <Link
                key={pic.id}
                href={`/admin/pic/${pic.id}`}
                className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
              >
                <Avatar name={pic.nama_lengkap} src={pic.foto_url} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                      {pic.nama_lengkap}
                    </p>
                    {!pic.is_active ? <Badge tone="red">Nonaktif</Badge> : null}
                  </div>
                  <p className="muted text-xs">NIS {pic.nis}</p>
                  <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                    {extras.length > 0 ? extras.join(", ") : "Belum ditugaskan"}
                  </p>
                </div>
                <ArrowRightIcon size={18} className="shrink-0 text-slate-400" />
              </Link>
            );
          })}
        </div>
      )}
      <p className="muted mt-4 text-xs">
        Password PIC disimpan terenkripsi AES-256-GCM. Admin dapat melihat dan mereset password dari
        halaman detail PIC.
      </p>
    </main>
  );
}
