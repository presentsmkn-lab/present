import { deleteLogoAction, saveAppSettingsAction, uploadLogoAction } from "@/actions/admin";
import { getSettings } from "@/lib/settings";
import { Alert, Field, PageHeader, SchoolLogo, SearchParamsAlert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { AlertIcon, SchoolIcon, TrashIcon } from "@/components/icons";

export const metadata = { title: "Logo & Branding" };

const FILE_INPUT_CLASS =
  "input file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white dark:file:bg-navy-600";

export default async function AdminBrandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const query = await searchParams;
  const settings = await getSettings();

  return (
    <main className="page">
      <PageHeader
        title="Logo & Branding"
        subtitle="Logo sekolah, logo pembuat, dan tautan pembuat aplikasi."
        back="/admin"
      />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <section className="card mt-2">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <SchoolIcon size={18} /> Logo sekolah
        </h2>
        <p className="muted mt-1 text-sm">
          Tampil di halaman login, header, dan favicon aplikasi. Format PNG/JPG/WEBP, maksimal 2 MB.
        </p>
        <div className="mt-3 flex items-center gap-4">
          <SchoolLogo src={settings.logo_sekolah_url} size={72} rounded="rounded-2xl" />
          <div className="min-w-0 text-xs text-slate-500 dark:text-slate-400">
            {settings.logo_sekolah_url ? (
              <p className="break-all">{settings.logo_sekolah_url}</p>
            ) : (
              <p>Belum ada logo sekolah. Ikon bawaan digunakan.</p>
            )}
          </div>
        </div>
        <form action={uploadLogoAction} className="mt-3 space-y-3">
          <input type="hidden" name="kind" value="sekolah" />
          <Field label="Unggah logo sekolah" htmlFor="logo_sekolah" hint="Gambar akan diubah ke PNG.">
            <input
              id="logo_sekolah"
              name="file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={FILE_INPUT_CLASS}
              required
            />
          </Field>
          <SubmitButton className="w-full">Unggah Logo Sekolah</SubmitButton>
        </form>
        {settings.logo_sekolah_url ? (
          <form action={deleteLogoAction} className="mt-2">
            <input type="hidden" name="kind" value="sekolah" />
            <SubmitButton
              variant="secondary"
              className="w-full text-red-600 dark:text-red-300"
              confirmText="Hapus logo sekolah?"
            >
              <TrashIcon size={16} /> Hapus Logo Sekolah
            </SubmitButton>
          </form>
        ) : null}
      </section>

      <section className="card mt-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <AlertIcon size={18} /> Logo pembuat
        </h2>
        <p className="muted mt-1 text-sm">
          Tampil di footer, halaman Tentang, dan halaman login. Logo dapat diklik menuju tautan
          pembuat.
        </p>
        <div className="mt-3 flex min-h-20 items-center justify-center rounded-xl bg-slate-50 p-3 dark:bg-white/5">
          {settings.logo_pembuat_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_pembuat_url}
              alt={settings.nama_pembuat || "Logo pembuat"}
              className="h-14 w-auto max-w-[220px] object-contain"
            />
          ) : (
            <p className="muted text-xs">Belum ada logo pembuat.</p>
          )}
        </div>
        <form action={uploadLogoAction} className="mt-3 space-y-3">
          <input type="hidden" name="kind" value="pembuat" />
          <Field label="Unggah logo pembuat" htmlFor="logo_pembuat" hint="Gambar akan diubah ke PNG.">
            <input
              id="logo_pembuat"
              name="file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={FILE_INPUT_CLASS}
              required
            />
          </Field>
          <SubmitButton className="w-full">Unggah Logo Pembuat</SubmitButton>
        </form>

        {settings.logo_pembuat_url ? (
          <form action={deleteLogoAction} className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <input type="hidden" name="kind" value="pembuat" />
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Jika logo ini dihapus, garansi 1 tahun akan hangus.
            </p>
            <label className="flex min-h-11 items-start gap-2 text-xs text-amber-900 dark:text-amber-100">
              <input
                type="checkbox"
                name="konfirmasi_hapus"
                value="ya"
                required
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-amber-300 accent-amber-600"
              />
              Saya memahami peringatan tersebut dan tetap ingin menghapus logo pembuat.
            </label>
            <SubmitButton variant="danger" className="w-full">
              <TrashIcon size={16} /> Hapus Logo Pembuat
            </SubmitButton>
          </form>
        ) : null}
      </section>

      <section className="card mt-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Identitas pembuat</h2>
        <form action={saveAppSettingsAction} className="mt-3 space-y-3">
          <Field label="Nama pembuat" htmlFor="nama_pembuat" hint="Ditampilkan di footer dan Tentang.">
            <input
              id="nama_pembuat"
              name="nama_pembuat"
              className="input"
              defaultValue={settings.nama_pembuat ?? ""}
              maxLength={120}
              placeholder="Nama pembuat / tim"
            />
          </Field>
          <Field
            label="Tautan pembuat"
            htmlFor="link_pembuat"
            hint="Harus diawali http:// atau https://. Logo akan mengarah ke tautan ini."
          >
            <input
              id="link_pembuat"
              name="link_pembuat"
              type="url"
              className="input"
              defaultValue={settings.link_pembuat ?? ""}
              maxLength={500}
              placeholder="https://contoh.com"
            />
          </Field>
          <SubmitButton className="w-full">Simpan Identitas</SubmitButton>
        </form>
      </section>

      <Alert tone="warning" className="mt-4">
        Peringatan: jika logo pembuat dihapus, garansi 1 tahun akan hangus. Unggah ulang sebelum
        menghapus bila logo masih diperlukan.
      </Alert>
    </main>
  );
}
