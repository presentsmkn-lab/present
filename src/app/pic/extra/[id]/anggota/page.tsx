import Link from "next/link";
import { requirePicExtra } from "@/lib/auth/pic-extra";
import { getMembersForSemester } from "@/lib/queries/members";
import { formatTanggal } from "@/lib/date";
import { Alert, Avatar, Badge, EmptyState, PageHeader, SearchParamsAlert } from "@/components/ui";
import { ArrowRightIcon, PlusIcon, UsersIcon } from "@/components/icons";

export const metadata = { title: "Anggota" };

export default async function AnggotaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { extra, semester } = await requirePicExtra(id);
  const query = await searchParams;
  const members = semester ? await getMembersForSemester(extra.id, semester.id) : [];
  const active = members.filter((m) => m.member_extra_status === "aktif");
  const keluar = members.filter((m) => m.member_extra_status === "keluar");

  return (
    <main className="page">
      <PageHeader
        title="Anggota"
        subtitle={semester ? `${active.length} anggota aktif • Semester ${semester.semester_ke}` : "Belum ada semester aktif"}
        action={
          semester ? (
            <Link href={`/pic/extra/${id}/anggota/baru`} className="btn-primary px-3">
              <PlusIcon size={18} /> Tambah
            </Link>
          ) : undefined
        }
        back={`/pic/extra/${id}`}
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      {!semester ? (
        <Alert tone="warning" className="mt-4">
          Anggota ditampilkan per semester aktif. Admin belum mengaktifkan semester.
        </Alert>
      ) : active.length === 0 ? (
        <EmptyState
          title="Belum ada anggota"
          description="Tambahkan anggota pertama dengan NIS, nama, rombel, kelas, dan jurusan."
          icon={<UsersIcon size={24} />}
          action={
            <Link href={`/pic/extra/${id}/anggota/baru`} className="btn-primary">
              <PlusIcon size={18} /> Tambah Anggota
            </Link>
          }
        />
      ) : (
        <div className="mt-4 space-y-2">
          {active.map((member) => (
            <Link
              key={member.id}
              href={`/pic/extra/${id}/anggota/${member.id}`}
              className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
            >
              <Avatar name={member.nama_lengkap} size={42} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">
                    {member.nama_lengkap}
                  </p>
                  {member.status === "lulus" ? <Badge tone="amber">LULUS</Badge> : null}
                </div>
                <p className="muted truncate text-xs">
                  {member.nis} • Kelas {member.kelas} {member.rombel} • {member.jurusan?.kode ?? "-"}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Bergabung {formatTanggal(member.joined_extra_at ?? member.joined_at)}
                </p>
              </div>
              <ArrowRightIcon size={18} className="shrink-0 text-slate-400" />
            </Link>
          ))}
        </div>
      )}

      {keluar.length > 0 ? (
        <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
            Riwayat keluar ({keluar.length})
          </summary>
          <div className="mt-3 space-y-2">
            {keluar.map((member) => (
              <div key={member.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-white/5">
                <Avatar name={member.nama_lengkap} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {member.nama_lengkap}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {member.nis} • keluar dari kegiatan ini
                  </p>
                </div>
                <Badge tone="red">Keluar</Badge>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </main>
  );
}
