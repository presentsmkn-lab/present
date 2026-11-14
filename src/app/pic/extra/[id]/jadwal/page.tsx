import { requirePicExtra } from "@/lib/auth/pic-extra";
import { getJadwalRows, toSegments, jadwalPada } from "@/lib/queries/jadwal";
import { listLibur } from "@/lib/queries/presensi";
import { addLiburAction, removeLiburAction, saveJadwalAction } from "@/actions/pic";
import { formatTanggal, todayISO } from "@/lib/date";
import { HARI, HARI_LABEL } from "@/types/db";
import { Alert, Badge, Field, PageHeader, SearchParamsAlert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CalendarIcon, TrashIcon } from "@/components/icons";

export const metadata = { title: "Jadwal & Libur" };

export default async function JadwalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { extra, semester } = await requirePicExtra(id);
  const query = await searchParams;
  const today = todayISO();
  const [rows, libur] = await Promise.all([getJadwalRows(extra.id), listLibur(extra.id)]);
  const segments = toSegments(rows);
  const currentDays = jadwalPada(segments, today);
  const history = [...segments].reverse();

  return (
    <main className="page">
      <PageHeader title="Jadwal & Libur" subtitle={extra.nama} back={`/pic/extra/${id}`} />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      {!semester ? (
        <Alert tone="warning" className="mt-4">
          Belum ada semester aktif. Jadwal tetap dapat diatur, tetapi presensi menunggu semester.
        </Alert>
      ) : null}

      <section className="card mt-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
            <CalendarIcon size={18} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Jadwal berlaku sekarang</h2>
            <p className="muted text-xs">
              {currentDays.length > 0
                ? currentDays.map((d) => HARI_LABEL[d]).join(", ")
                : "Belum diatur"}
            </p>
          </div>
        </div>
        <form action={saveJadwalAction} className="space-y-4">
          <input type="hidden" name="extra_id" value={id} />
          <div>
            <p className="label">Hari latihan</p>
            <div className="flex flex-wrap gap-2">
              {HARI.map((hari) => (
                <label key={hari} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="hari"
                    value={hari}
                    defaultChecked={currentDays.includes(hari)}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors peer-checked:border-navy-800 peer-checked:bg-navy-900 peer-checked:text-white dark:border-white/15 dark:text-slate-200 dark:peer-checked:border-navy-500 dark:peer-checked:bg-navy-600">
                    {HARI_LABEL[hari]}
                  </span>
                </label>
              ))}
            </div>
            <p className="muted mt-1 text-xs">Boleh pilih lebih dari satu hari.</p>
          </div>
          <Field
            label="Berlaku mulai"
            htmlFor="berlaku_mulai"
            hint="Perubahan hanya berlaku dari tanggal ini. Riwayat pertemuan sebelumnya tidak berubah."
          >
            <input
              id="berlaku_mulai"
              name="berlaku_mulai"
              type="date"
              defaultValue={today}
              required
              className="input"
            />
          </Field>
          <SubmitButton className="w-full">Simpan Jadwal</SubmitButton>
        </form>
      </section>

      {history.length > 0 ? (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Riwayat jadwal
          </h2>
          <div className="space-y-2">
            {history.map((segment, index) => (
              <div
                key={segment.berlaku_mulai}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {segment.hari.map((h) => HARI_LABEL[h]).join(", ")}
                  </p>
                  <p className="muted text-xs">Berlaku mulai {formatTanggal(segment.berlaku_mulai)}</p>
                </div>
                {index === 0 ? <Badge tone="green">Terbaru</Badge> : <Badge tone="slate">Riwayat</Badge>}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Tandai hari libur
        </h2>
        <div className="card">
          <form action={addLiburAction} className="space-y-3">
            <input type="hidden" name="extra_id" value={id} />
            <div className="field-grid">
              <Field label="Tanggal" htmlFor="tanggal_libur">
                <input
                  id="tanggal_libur"
                  name="tanggal"
                  type="date"
                  className="input"
                  defaultValue={today}
                  required
                />
              </Field>
              <Field label="Alasan" htmlFor="alasan">
                <input
                  id="alasan"
                  name="alasan"
                  className="input"
                  placeholder="Contoh: Libur Maulid Nabi"
                  maxLength={150}
                  required
                />
              </Field>
            </div>
            <SubmitButton
              variant="secondary"
              className="w-full"
              confirmText="Tandai tanggal ini libur? Pertemuan dan presensi pada tanggal tersebut akan dihapus."
            >
              Tandai Libur
            </SubmitButton>
            <p className="muted text-xs">
              Pertemuan pada tanggal libur tidak dihitung. Data presensi pada tanggal itu akan
              dihapus.
            </p>
          </form>
        </div>

        {libur.length > 0 ? (
          <div className="mt-3 space-y-2">
            {libur.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {formatTanggal(item.tanggal, true)}
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">{item.alasan}</p>
                </div>
                <form action={removeLiburAction}>
                  <input type="hidden" name="extra_id" value={id} />
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="icon-btn text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-500/20"
                    aria-label={`Hapus libur ${formatTanggal(item.tanggal)}`}
                  >
                    <TrashIcon size={18} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted mt-3 text-sm">Belum ada hari libur ditandai.</p>
        )}
      </section>
    </main>
  );
}
