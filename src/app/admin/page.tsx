import Link from "next/link";
import { db } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { getActiveSemester } from "@/lib/queries/semester";
import { listExtras } from "@/lib/queries/extra";
import { getJadwalSegments, jadwalPada } from "@/lib/queries/jadwal";
import { getMembersForSemester } from "@/lib/queries/members";
import { todayISO, formatTanggal, semesterLabel, semesterRangeLabel } from "@/lib/date";
import { ActionTile, Alert, Badge, PageHeader, SearchParamsAlert, StatCard } from "@/components/ui";
import {
  CalendarIcon,
  ChartIcon,
  ClipboardIcon,
  DownloadIcon,
  EditIcon,
  SchoolIcon,
  UsersIcon,
} from "@/components/icons";

export const metadata = { title: "Dashboard Admin" };

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const [settings, activeSemester, extras, picsCount, membersCount, kenaikanData] =
    await Promise.all([
      getSettings(),
      getActiveSemester(),
      listExtras(),
      db().from("pics").select("id", { count: "exact", head: true }).eq("is_active", true),
      db().from("members").select("id", { count: "exact", head: true }).eq("status", "aktif"),
      db()
        .from("kenaikan_jadwal")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const kenaikan = kenaikanData.data as { tanggal: string } | null;
  const today = todayISO();
  const kenaikanSelesai = kenaikan && settings.kenaikan_selesai === kenaikan.tanggal;
  const kenaikanSiap = Boolean(kenaikan && today >= kenaikan.tanggal && !kenaikanSelesai);

  const extraSummaries = await Promise.all(
    extras.map(async (extra) => {
      const members = activeSemester
        ? await getMembersForSemester(extra.id, activeSemester.id)
        : [];
      const active = members.filter((m) => m.member_extra_status === "aktif");
      const segments = await getJadwalSegments(extra.id);
      const days = jadwalPada(segments, today);
      return { extra, activeCount: active.length, days };
    }),
  );

  return (
    <main className="page">
      <PageHeader
        title="Dashboard Admin"
        subtitle="Kelola data induk dan pantau kegiatan ekstrakurikuler."
      />
      <SearchParamsAlert error={params.error} ok={params.ok} />

      <section className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="PIC aktif" value={picsCount.count ?? 0} icon={<UsersIcon />} />
        <StatCard label="Ekstrakurikuler" value={extras.length} icon={<SchoolIcon />} />
        <StatCard label="Anggota aktif" value={membersCount.count ?? 0} icon={<UsersIcon />} />
        <StatCard
          label="Semester aktif"
          value={activeSemester ? `Sem ${activeSemester.semester_ke}` : "—"}
          hint={activeSemester ? activeSemester.tahun_ajaran : "Belum ada"}
          icon={<CalendarIcon />}
        />
      </section>

      {!activeSemester ? (
        <Alert tone="warning" className="mt-4">
          Belum ada semester aktif. Buka <Link href="/admin/semester" className="link">Kelola Semester</Link>{" "}
          dan tekan “Buat Semester Berikutnya”.
        </Alert>
      ) : null}

      {kenaikanSiap ? (
        <Link href="/admin/kenaikan" className="mt-4 block">
          <Alert tone="warning">
            <strong>Waktunya kenaikan kelas.</strong> Tanggal {formatTanggal(kenaikan!.tanggal)} sudah tiba.
            Buka halaman kenaikan untuk memeriksa siswa lalu konfirmasi.
          </Alert>
        </Link>
      ) : kenaikan && !kenaikanSelesai ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-navy-900/60">
          <span className="font-semibold text-slate-900 dark:text-white">Kenaikan kelas dijadwalkan</span>
          <span className="muted"> • {formatTanggal(kenaikan.tanggal)}</span>
        </div>
      ) : kenaikanSelesai ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          Kenaikan kelas untuk {formatTanggal(kenaikan!.tanggal)} sudah dijalankan.
        </div>
      ) : null}

      <h2 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Kelola data
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ActionTile
          href="/admin/pic"
          title="Kelola PIC"
          description="Tambah, lihat password, reset, nonaktifkan."
          icon={<UsersIcon />}
          badge={picsCount.count ?? 0}
        />
        <ActionTile
          href="/admin/ekstrakurikuler"
          title="Kelola Ekstrakurikuler"
          description="Nama kegiatan dan penugasan PIC utama/asisten."
          icon={<SchoolIcon />}
          badge={extras.length}
        />
        <ActionTile
          href="/admin/semester"
          title="Kelola Semester"
          description={
            activeSemester
              ? `Aktif: ${semesterLabel(activeSemester)} • ${semesterRangeLabel(activeSemester)}`
              : "Buat semester pertama."
          }
          icon={<CalendarIcon />}
        />
        <ActionTile
          href="/admin/kenaikan"
          title="Kenaikan Kelas"
          description={kenaikan ? `Dijadwalkan ${formatTanggal(kenaikan.tanggal)}` : "Atur tanggal kenaikan kelas."}
          icon={<ClipboardIcon />}
        />
        <ActionTile
          href="/admin/jurusan"
          title="Kelola Jurusan"
          description="Kode dan nama panjang jurusan."
          icon={<EditIcon />}
        />
      </div>

      <h2 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Lainnya
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <ActionTile
          href="/admin/statistik"
          title="Statistik"
          description="Ringkasan seluruh ekstrakurikuler."
          icon={<ChartIcon />}
        />
        <ActionTile
          href="/admin/export"
          title="Export Excel"
          description="Satu ekstrakurikuler atau semua sekaligus."
          icon={<DownloadIcon />}
        />
        <ActionTile
          href="/admin/branding"
          title="Logo & Branding"
          description="Logo sekolah, logo pembuat, dan tautannya."
          icon={<SchoolIcon />}
        />
        <ActionTile
          href="/admin/pengaturan"
          title="Pengaturan"
          description="Akun admin, tema, tentang, dan tutorial."
          icon={<ChartIcon />}
        />
      </div>

      <section className="mt-6 space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Ekstrakurikuler & anggota semester aktif
        </h2>
        {extras.length === 0 ? (
          <p className="muted">Belum ada ekstrakurikuler.</p>
        ) : (
          extraSummaries.map(({ extra, activeCount, days }) => (
            <Link
              key={extra.id}
              href={`/admin/ekstrakurikuler/${extra.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-white/10 dark:bg-navy-900/60"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
                <SchoolIcon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-900 dark:text-white">
                  {extra.nama}
                </span>
                <span className="muted block text-xs">
                  {activeCount} anggota
                  {days.length > 0
                    ? ` • latihan ${days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}`
                    : " • jadwal belum diatur"}
                </span>
              </span>
              <Badge tone="slate">Detail</Badge>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
