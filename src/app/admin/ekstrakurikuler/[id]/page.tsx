import Link from "next/link";
import { notFound } from "next/navigation";
import { getExtra, getExtraPicList, listPics } from "@/lib/queries/extra";
import { getActiveSemester } from "@/lib/queries/semester";
import { countMembers } from "@/lib/queries/members";
import { getJadwalSegments, jadwalPada } from "@/lib/queries/jadwal";
import { assignPicAction, removePicAssignmentAction, updateExtraAction } from "@/actions/admin";
import { todayISO } from "@/lib/date";
import { HARI_LABEL } from "@/types/db";
import { Alert, Badge, EmptyState, Field, PageHeader, SearchParamsAlert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { DownloadIcon, PlusIcon, SchoolIcon, TrashIcon, UsersIcon } from "@/components/icons";

export const metadata = { title: "Detail Ekstrakurikuler" };

export default async function DetailEkstrakurikulerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const extra = await getExtra(id);
  if (!extra) notFound();

  const [assignments, pics, semester, segments] = await Promise.all([
    getExtraPicList(id),
    listPics(),
    getActiveSemester(),
    getJadwalSegments(id),
  ]);
  const members = semester ? await countMembers(id, semester.id) : 0;
  const days = jadwalPada(segments, todayISO());
  const activePics = pics.filter((pic) => pic.is_active);
  const assignedPicIds = new Set(assignments.map((row) => row.pic.id));

  return (
    <main className="page">
      <PageHeader
        title="Detail Ekstrakurikuler"
        subtitle={extra.nama}
        back="/admin/ekstrakurikuler"
        action={
          <Link
            href={`/api/export/extra/${extra.id}`}
            className="btn-secondary px-3"
            aria-label="Export Excel"
          >
            <DownloadIcon size={18} />
          </Link>
        }
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <section className="card mt-2">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white dark:bg-navy-600">
            <SchoolIcon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{extra.nama}</p>
            <p className="muted text-xs">
              {members} anggota aktif
              {days.length > 0 ? ` • latihan ${days.map((d) => HARI_LABEL[d]).join(", ")}` : " • jadwal belum diatur"}
            </p>
          </div>
          <Badge tone={semester ? "green" : "amber"}>
            {semester ? `Sem ${semester.semester_ke}` : "Tanpa semester"}
          </Badge>
        </div>

        <form action={updateExtraAction} className="mt-4 space-y-3">
          <input type="hidden" name="id" value={extra.id} />
          <Field label="Nama ekstrakurikuler" htmlFor="nama">
            <input
              id="nama"
              name="nama"
              className="input"
              defaultValue={extra.nama}
              required
              minLength={2}
              maxLength={120}
            />
          </Field>
          <SubmitButton variant="secondary" className="w-full">
            Simpan Nama
          </SubmitButton>
        </form>
      </section>

      <section className="card mt-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <PlusIcon size={18} /> Tugaskan PIC
        </h2>
        {activePics.length === 0 ? (
          <Alert tone="warning" className="mt-3">
            Belum ada PIC aktif.{" "}
            <Link href="/admin/pic/baru" className="link">
              Tambah PIC
            </Link>{" "}
            terlebih dahulu.
          </Alert>
        ) : (
          <form action={assignPicAction} className="mt-3 space-y-3">
            <input type="hidden" name="extra_id" value={extra.id} />
            <div className="field-grid">
              <Field label="PIC" htmlFor="pic_id">
                <select id="pic_id" name="pic_id" className="input" required defaultValue="">
                  <option value="" disabled>
                    Pilih PIC
                  </option>
                  {activePics.map((pic) => (
                    <option key={pic.id} value={pic.id}>
                      {pic.nama_lengkap} ({pic.nis}){assignedPicIds.has(pic.id) ? " — sudah ditugaskan" : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Peran" htmlFor="peran">
                <select id="peran" name="peran" className="input" defaultValue="utama">
                  <option value="utama">PIC Utama</option>
                  <option value="asisten">Asisten</option>
                </select>
              </Field>
            </div>
            <SubmitButton className="w-full">Simpan Penugasan</SubmitButton>
            <p className="muted text-xs">
              Memilih PIC yang sudah ditugaskan akan memperbarui perannya, bukan membuat duplikat.
            </p>
          </form>
        )}
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          PIC yang ditugaskan
        </h2>
        {assignments.length === 0 ? (
          <EmptyState
            title="Belum ada PIC"
            description="Tanpa PIC, tidak ada yang dapat mengelola anggota dan presensi kegiatan ini."
            icon={<UsersIcon size={24} />}
          />
        ) : (
          <div className="space-y-2">
            {assignments.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/pic/${row.pic.id}`}
                    className="truncate text-sm font-semibold text-slate-900 hover:underline dark:text-white"
                  >
                    {row.pic.nama_lengkap}
                  </Link>
                  <p className="muted text-xs">
                    NIS {row.pic.nis}
                    {!row.pic.is_active ? " • akun nonaktif" : ""}
                  </p>
                </div>
                <Badge tone={row.peran === "utama" ? "navy" : "blue"}>
                  {row.peran === "utama" ? "Utama" : "Asisten"}
                </Badge>
                <form action={removePicAssignmentAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="extra_id" value={extra.id} />
                  <button
                    type="submit"
                    className="icon-btn text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                    aria-label={`Lepas penugasan ${row.pic.nama_lengkap}`}
                  >
                    <TrashIcon size={18} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link href={`/admin/pic`} className="btn-secondary">
          <UsersIcon size={18} /> Kelola Semua PIC
        </Link>
        <Link href={`/admin/export?extra=${extra.id}`} className="btn-secondary">
          <DownloadIcon size={18} /> Export Excel
        </Link>
      </div>
    </main>
  );
}
