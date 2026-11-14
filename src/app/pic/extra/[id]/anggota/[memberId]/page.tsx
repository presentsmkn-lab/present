import { notFound } from "next/navigation";
import { requirePicExtra } from "@/lib/auth/pic-extra";
import { listJurusan } from "@/lib/queries/extra";
import { getMemberForExtra } from "@/lib/queries/members";
import { removeMemberAction, updateMemberAction } from "@/actions/pic";
import { Alert, Badge, PageHeader, SearchParamsAlert } from "@/components/ui";
import { MemberForm } from "@/components/member-form";
import { SubmitButton } from "@/components/submit-button";
import { formatTanggal } from "@/lib/date";
import { TrashIcon } from "@/components/icons";

export const metadata = { title: "Edit Anggota" };

export default async function EditAnggotaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; memberId: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id, memberId } = await params;
  const { extra } = await requirePicExtra(id);
  const query = await searchParams;
  const [member, jurusan] = await Promise.all([getMemberForExtra(extra.id, memberId), listJurusan()]);
  if (!member) notFound();

  const aktif = member.member_extra_status === "aktif" && member.status !== "lulus";

  return (
    <main className="page">
      <PageHeader
        title="Edit Anggota"
        subtitle={`${member.nama_lengkap} • ${member.nis}`}
        back={`/pic/extra/${id}/anggota`}
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <div className="card mb-4 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{member.nama_lengkap}</p>
          <p className="muted text-xs">
            Bergabung {formatTanggal(member.joined_extra_at ?? member.joined_at)} • Kelas {member.kelas}{" "}
            {member.rombel}
          </p>
        </div>
        <Badge tone={member.status === "lulus" ? "amber" : member.member_extra_status === "keluar" ? "red" : "green"}>
          {member.status === "lulus" ? "LULUS" : member.member_extra_status === "keluar" ? "Keluar" : "Aktif"}
        </Badge>
      </div>

      {member.status === "lulus" ? (
        <Alert tone="warning">
          Siswa sudah berstatus LULUS dan akan dihapus otomatis 1 bulan setelah tanggal lulus. Data
          masih dapat diekspor sampai saat itu.
        </Alert>
      ) : !aktif ? (
        <Alert tone="warning">
          Anggota ini sudah dikeluarkan dari kegiatan pada semester ini. Tambahkan kembali melalui
          data anggota jika diperlukan.
        </Alert>
      ) : jurusan.length === 0 ? (
        <Alert tone="warning">Admin belum mengisi daftar jurusan.</Alert>
      ) : (
        <div className="card">
          <MemberForm
            action={updateMemberAction}
            extraId={id}
            jurusan={jurusan}
            member={member}
            submitLabel="Simpan Perubahan"
          />
        </div>
      )}

      {aktif ? (
        <form action={removeMemberAction} className="mt-4">
          <input type="hidden" name="extra_id" value={id} />
          <input type="hidden" name="member_id" value={member.id} />
          <SubmitButton
            variant="danger"
            className="w-full"
            confirmText={`Keluarkan ${member.nama_lengkap} dari ${extra.nama}? Riwayat presensi tetap disimpan.`}
          >
            <TrashIcon size={18} /> Keluarkan dari Ekstrakurikuler
          </SubmitButton>
          <p className="muted mt-2 text-center text-xs">
            Anggota tidak dihapus permanen, hanya dikeluarkan dari kegiatan ini.
          </p>
        </form>
      ) : null}
    </main>
  );
}
