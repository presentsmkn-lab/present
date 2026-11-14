import { setKenaikanDateAction } from "@/actions/admin";
import { db } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { formatDateTime, formatTanggal, todayISO } from "@/lib/date";
import { Alert, Badge, Field, PageHeader, SearchParamsAlert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CalendarIcon, ClipboardIcon, HistoryIcon } from "@/components/icons";
import { KenaikanForm, type KenaikanMember } from "./kenaikan-form";

export const metadata = { title: "Kenaikan Kelas" };

export default async function AdminKenaikanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const query = await searchParams;
  const [jadwalData, settings, membersData, logsData] = await Promise.all([
    db()
      .from("kenaikan_jadwal")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getSettings(),
    db()
      .from("members")
      .select("id, nis, nama_lengkap, kelas, rombel, jurusan:jurusan(kode)")
      .in("kelas", ["X", "XI", "XII"])
      .eq("status", "aktif")
      .order("kelas")
      .order("nama_lengkap"),
    db()
      .from("kenaikan_log")
      .select("id, tanggal, dari_kelas, ke_kelas, member_nis, member_nama, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const jadwal = jadwalData.data as { id: string; tanggal: string } | null;
  const today = todayISO();
  const completed = Boolean(jadwal && settings.kenaikan_selesai === jadwal.tanggal);
  const ready = Boolean(jadwal && today >= jadwal.tanggal && !completed);

  const members: KenaikanMember[] = ((membersData.data ?? []) as unknown as Array<{
    id: string;
    nis: string;
    nama_lengkap: string;
    kelas: string;
    rombel: string;
    jurusan: { kode: string } | Array<{ kode: string }> | null;
  }>).map((row) => ({
    id: row.id,
    nis: row.nis,
    nama_lengkap: row.nama_lengkap,
    kelas: row.kelas,
    rombel: row.rombel,
    jurusan: (Array.isArray(row.jurusan) ? row.jurusan[0]?.kode : row.jurusan?.kode) ?? "-",
  }));

  const counts = {
    X: members.filter((m) => m.kelas === "X").length,
    XI: members.filter((m) => m.kelas === "XI").length,
    XII: members.filter((m) => m.kelas === "XII").length,
  };
  const logs = (logsData.data ?? []) as Array<{
    id: string;
    tanggal: string;
    dari_kelas: string;
    ke_kelas: string;
    member_nis: string | null;
    member_nama: string | null;
    created_at: string;
  }>;

  return (
    <main className="page">
      <PageHeader
        title="Kenaikan Kelas"
        subtitle="X → XI, XI → XII, XII → LULUS. Dijalankan manual setelah tanggal tiba."
        back="/admin"
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <section className="card mt-2">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <CalendarIcon size={18} /> Tanggal kenaikan kelas
        </h2>
        <p className="muted mt-1 text-sm">
          Siswa dapat dinaikkan mulai tanggal ini. Menyimpan tanggal baru akan mereset status
          kenaikan sebelumnya.
        </p>
        <form action={setKenaikanDateAction} className="mt-3 space-y-3">
          <Field label="Tanggal" htmlFor="tanggal">
            <input
              id="tanggal"
              name="tanggal"
              type="date"
              className="input"
              defaultValue={jadwal?.tanggal ?? today}
              required
            />
          </Field>
          <SubmitButton variant="secondary" className="w-full">
            Simpan Tanggal
          </SubmitButton>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {jadwal ? (
            <Badge tone={completed ? "green" : ready ? "amber" : "blue"}>
              Dijadwalkan {formatTanggal(jadwal.tanggal)}
            </Badge>
          ) : (
            <Badge tone="slate">Belum dijadwalkan</Badge>
          )}
          {completed ? <Badge tone="green">Sudah dijalankan</Badge> : null}
          {ready ? <Badge tone="amber">Siap dijalankan</Badge> : null}
        </div>
      </section>

      {completed ? (
        <Alert tone="success" className="mt-4">
          Kenaikan kelas untuk {formatTanggal(jadwal!.tanggal)} sudah dijalankan. Log perubahan ada
          di bagian bawah halaman.
        </Alert>
      ) : !jadwal ? (
        <Alert tone="warning" className="mt-4">
          Tentukan tanggal kenaikan kelas terlebih dahulu.
        </Alert>
      ) : !ready ? (
        <Alert tone="info" className="mt-4">
          Kenaikan kelas baru dapat dijalankan pada {formatTanggal(jadwal.tanggal)} atau setelahnya.
        </Alert>
      ) : members.length === 0 ? (
        <Alert tone="warning" className="mt-4">
          Tidak ada siswa aktif berkelas X, XI, atau XII.
        </Alert>
      ) : (
        <section className="mt-4">
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="card-tight text-center">
              <p className="muted text-xs">Kelas X</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{counts.X}</p>
              <p className="text-[11px] text-slate-400">→ XI</p>
            </div>
            <div className="card-tight text-center">
              <p className="muted text-xs">Kelas XI</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{counts.XI}</p>
              <p className="text-[11px] text-slate-400">→ XII</p>
            </div>
            <div className="card-tight text-center">
              <p className="muted text-xs">Kelas XII</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{counts.XII}</p>
              <p className="text-[11px] text-slate-400">→ LULUS</p>
            </div>
          </div>
          <KenaikanForm members={members} />
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <HistoryIcon size={16} /> Log kenaikan terakhir
        </h2>
        {logs.length === 0 ? (
          <p className="muted text-sm">Belum ada log kenaikan kelas.</p>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-white/10 dark:bg-navy-900/60"
              >
                <ClipboardIcon size={15} className="shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                    {log.member_nama ?? "Siswa"} ({log.member_nis ?? "-"})
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {log.dari_kelas === log.ke_kelas
                      ? `Tinggal kelas di kelas ${log.dari_kelas}`
                      : `${log.dari_kelas} → ${log.ke_kelas}`}{" "}
                    • {formatDateTime(log.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="muted mt-3 text-xs">
          Siswa berstatus LULUS akan dihapus permanen oleh cron harian setelah 1 bulan, termasuk
          keanggotaan dan presensinya.
        </p>
      </section>
    </main>
  );
}
