import Link from "next/link";
import { activateSemesterAction } from "@/actions/admin";
import { listSemesters, nextSemester, sortSemesters } from "@/lib/queries/semester";
import { db } from "@/lib/supabase";
import { defaultSemesterRange, semesterLabel, semesterRangeLabel } from "@/lib/date";
import { Badge, PageHeader, SearchParamsAlert } from "@/components/ui";
import { CalendarIcon, CheckIcon, PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { CreateSemesterForm } from "./create-semester-form";
import { DeleteSemesterDialog } from "./delete-semester-dialog";
import { SemesterDatesDialog } from "./semester-dates-dialog";

export const metadata = { title: "Kelola Semester" };

export default async function AdminSemesterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const query = await searchParams;
  const semesters = sortSemesters(await listSemesters());
  const latest = semesters[semesters.length - 1] ?? null;
  const next = nextSemester(latest);
  const nextRange = defaultSemesterRange(next.tahun_ajaran, next.semester_ke);
  const active = semesters.find((s) => s.is_active) ?? null;

  const stats = await Promise.all(
    semesters.map(async (semester) => {
      const [members, meetings] = await Promise.all([
        db()
          .from("member_extra")
          .select("id", { count: "exact", head: true })
          .eq("semester_id", semester.id)
          .eq("status", "aktif"),
        db()
          .from("pertemuan")
          .select("id", { count: "exact", head: true })
          .eq("semester_id", semester.id),
      ]);
      return {
        semester,
        members: members.count ?? 0,
        meetings: meetings.count ?? 0,
      };
    }),
  );

  return (
    <main className="page">
      <PageHeader
        title="Kelola Semester"
        subtitle="Atur periode, urutan, dan keaktifan semester. Semester baru menyalin anggota aktif dari semester sebelumnya."
        back="/admin"
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      {/* Ringkasan semester aktif */}
      <section className="mt-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-blue-700 dark:bg-white/10 dark:text-blue-200">
            <CalendarIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-blue-950 dark:text-blue-50">Semester aktif</p>
              {active ? <Badge tone="blue">Aktif</Badge> : <Badge tone="slate">Belum ada</Badge>}
            </div>
            {active ? (
              <>
                <p className="mt-0.5 text-sm font-medium text-blue-900 dark:text-blue-100">
                  {semesterLabel(active)}
                </p>
                <p className="mt-0.5 text-xs text-blue-800/80 dark:text-blue-200/80">
                  {semesterRangeLabel(active)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-blue-900 dark:text-blue-100">
                Buat semester pertama untuk mulai mencatat kegiatan.
              </p>
            )}
          </div>
        </div>
        <p className="mt-3 border-t border-blue-200/70 pt-3 text-xs leading-relaxed text-blue-800/80 dark:border-blue-500/20 dark:text-blue-200/80">
          Hanya satu semester yang dapat aktif pada satu waktu. Semester baru dibuat berurutan
          (Semester 1 → 2 → tahun ajaran berikutnya) dan otomatis menyalin anggota aktif.
        </p>
      </section>

      {/* Buat semester berikutnya */}
      <section className="card mt-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 dark:bg-white/10">
            <PlusIcon size={20} className="text-navy-800 dark:text-navy-200" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Buat semester berikutnya
              </h2>
              <Badge tone="navy">Langkah berikutnya</Badge>
            </div>
            <p className="muted mt-0.5 text-xs">
              Tanggal periode terisi otomatis. Ubah bila kalender sekolah berbeda.
            </p>
          </div>
        </div>

        <CreateSemesterForm
          nextLabel={`${next.tahun_ajaran} • Semester ${next.semester_ke}`}
          previousLabel={latest ? semesterLabel(latest) : null}
          defaultMulai={nextRange.tanggal_mulai}
          defaultSelesai={nextRange.tanggal_selesai}
        />
      </section>

      {/* Daftar semester */}
      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Daftar semester
          </h2>
          <Badge tone="blue">{semesters.length}</Badge>
        </div>

        {semesters.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center dark:border-white/10 dark:bg-white/5">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 dark:bg-white/10">
              <CalendarIcon size={24} className="text-navy-600 dark:text-navy-300" />
            </span>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">Belum ada semester</p>
              <p className="muted mt-0.5 text-sm">
                Klik tombol di atas untuk membuat semester pertama.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {stats.map(({ semester, members, meetings }) => {
              const isActive = semester.is_active;
              const hasDates = Boolean(semester.tanggal_mulai && semester.tanggal_selesai);
              const fallback = defaultSemesterRange(semester.tahun_ajaran, semester.semester_ke);
              return (
                <div
                  key={semester.id}
                  className={cn(
                    "rounded-2xl border p-3.5 transition-colors",
                    isActive
                      ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                      : "border-slate-200 bg-white dark:border-white/10 dark:bg-navy-900/60",
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon pill */}
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400",
                      )}
                    >
                      <CalendarIcon size={20} />
                    </span>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {semesterLabel(semester)}
                        </p>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                            Aktif
                          </span>
                        ) : (
                          <Badge tone="slate">Nonaktif</Badge>
                        )}
                      </div>

                      <p
                        className={cn(
                          "mt-1 inline-flex items-center gap-1.5 text-xs",
                          hasDates
                            ? "text-slate-600 dark:text-slate-300"
                            : "font-medium text-amber-700 dark:text-amber-300",
                        )}
                      >
                        <CalendarIcon size={13} className="shrink-0" />
                        {hasDates ? semesterRangeLabel(semester) : "Tanggal belum diatur"}
                      </p>

                      <p className="muted mt-1 text-xs">
                        {members} anggota • {meetings} pertemuan
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-0.5">
                      <SemesterDatesDialog
                        id={semester.id}
                        label={semesterLabel(semester)}
                        tanggalMulai={semester.tanggal_mulai}
                        tanggalSelesai={semester.tanggal_selesai}
                        defaultMulai={fallback.tanggal_mulai}
                        defaultSelesai={fallback.tanggal_selesai}
                      />
                      {semesters.length > 1 ? (
                        <DeleteSemesterDialog
                          id={semester.id}
                          label={semesterLabel(semester)}
                          active={isActive}
                        />
                      ) : null}
                    </div>
                  </div>

                  {!isActive ? (
                    <form action={activateSemesterAction} className="mt-3">
                      <input type="hidden" name="id" value={semester.id} />
                      <button
                        type="submit"
                        className="btn-secondary min-h-9 w-full py-1.5 text-xs"
                      >
                        <CheckIcon size={15} />
                        Jadikan semester aktif
                      </button>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <p className="muted mt-3 text-xs">
          Semester terakhir tidak dapat dihapus. Jika semester aktif dihapus, semester terbaru yang
          tersisa otomatis diaktifkan.{" "}
          {active ? (
            <Link href="/admin/export" className="link">
              Export data sebelum menghapus.
            </Link>
          ) : null}
        </p>
      </section>
    </main>
  );
}
