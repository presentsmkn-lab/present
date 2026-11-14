import Link from "next/link";
import { db } from "@/lib/supabase";
import { listExtras } from "@/lib/queries/extra";
import { getActiveSemester } from "@/lib/queries/semester";
import { countMembers } from "@/lib/queries/members";
import { getJadwalSegments, jadwalPada } from "@/lib/queries/jadwal";
import { HARI_LABEL } from "@/types/db";
import { todayISO } from "@/lib/date";
import { Badge, EmptyState, PageHeader, SearchParamsAlert } from "@/components/ui";
import { ArrowRightIcon, PlusIcon, SchoolIcon } from "@/components/icons";

export const metadata = { title: "Kelola Ekstrakurikuler" };

export default async function AdminEkstrakurikulerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const query = await searchParams;
  const [extras, semester] = await Promise.all([listExtras(), getActiveSemester()]);

  const rows = await Promise.all(
    extras.map(async (extra) => {
      const [members, assignments, segments] = await Promise.all([
        semester ? countMembers(extra.id, semester.id) : Promise.resolve(0),
        db()
          .from("pic_extra")
          .select("id, peran, pic:pics(id, nama_lengkap, is_active)")
          .eq("extra_id", extra.id),
        getJadwalSegments(extra.id),
      ]);
      const pics = ((assignments.data ?? []) as unknown as Array<{
        id: string;
        peran: "utama" | "asisten";
        pic: { id: string; nama_lengkap: string; is_active: boolean } | Array<{ id: string; nama_lengkap: string; is_active: boolean }> | null;
      }>)
        .map((row) => ({
          ...row,
          pic: Array.isArray(row.pic) ? row.pic[0] : row.pic,
        }))
        .filter((row) => Boolean(row.pic));
      const days = jadwalPada(segments, todayISO());
      return { extra, members, pics, days };
    }),
  );

  return (
    <main className="page">
      <PageHeader
        title="Kelola Ekstrakurikuler"
        subtitle="Nama kegiatan, jadwal, dan penugasan PIC."
        back="/admin"
        action={
          <Link href="/admin/ekstrakurikuler/baru" className="btn-primary px-3">
            <PlusIcon size={18} /> Tambah
          </Link>
        }
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada ekstrakurikuler"
          description="Buat kegiatan terlebih dahulu, lalu tugaskan PIC utama atau asisten."
          icon={<SchoolIcon size={24} />}
          action={
            <Link href="/admin/ekstrakurikuler/baru" className="btn-primary">
              <PlusIcon size={18} /> Tambah Ekstrakurikuler
            </Link>
          }
        />
      ) : (
        <div className="mt-4 space-y-2.5">
          {rows.map(({ extra, members, pics, days }) => (
            <Link
              key={extra.id}
              href={`/admin/ekstrakurikuler/${extra.id}`}
              className="block rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-navy-900/60"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
                  <SchoolIcon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{extra.nama}</p>
                  <p className="muted text-xs">
                    {members} anggota aktif
                    {days.length > 0
                      ? ` • ${days.map((d) => HARI_LABEL[d]).join(", ")}`
                      : " • jadwal belum diatur"}
                  </p>
                </div>
                <ArrowRightIcon size={18} className="shrink-0 text-slate-400" />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {pics.length === 0 ? (
                  <Badge tone="amber">Belum ada PIC</Badge>
                ) : (
                  pics.map((row) =>
                    row.pic ? (
                      <Badge key={row.id} tone={row.peran === "utama" ? "navy" : "blue"}>
                        {row.pic.nama_lengkap}
                        {row.peran === "utama" ? " • Utama" : " • Asisten"}
                        {!row.pic.is_active ? " (nonaktif)" : ""}
                      </Badge>
                    ) : null,
                  )
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="muted mt-4 text-xs">
        Hapus ekstrakurikuler hanya melalui database untuk mencegah kehilangan data presensi. Untuk
        menghentikan pengelolaan, lepas penugasan PIC.
      </p>
    </main>
  );
}
