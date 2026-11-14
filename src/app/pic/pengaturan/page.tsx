import Link from "next/link";
import { requirePic } from "@/lib/auth/guards";
import { getPicExtras } from "@/lib/queries/extra";
import { getSettings } from "@/lib/settings";
import { changePicPasswordAction, updateProfileAction } from "@/actions/pic";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { BrandFooter } from "@/components/brand-footer";
import { InstallAppButton } from "@/components/install-prompt";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, Avatar, Field, PageHeader, SearchParamsAlert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ArrowRightIcon, InfoIcon, LockIcon, SchoolIcon } from "@/components/icons";

export const metadata = { title: "Pengaturan" };

export default async function PicPengaturanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { pic } = await requirePic();
  const query = await searchParams;
  const [settings, extras] = await Promise.all([getSettings(), getPicExtras(pic.id)]);
  const extraId = extras.length === 1 ? extras[0].extra.id : undefined;

  return (
    <>
      <AppHeader
        title="Pengaturan"
        subtitle={pic.nama_lengkap}
        homeHref={extraId ? `/pic/extra/${extraId}` : "/pic"}
        logoSrc={settings.logo_sekolah_url}
      />
      <main className="page">
        <PageHeader title="Pengaturan" subtitle="Profil, keamanan, dan tampilan aplikasi." />
        <SearchParamsAlert error={query.error} ok={query.ok} />

        <section className="card mt-4">
          <div className="flex items-center gap-3">
            <Avatar name={pic.nama_lengkap} src={pic.foto_url} size={56} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{pic.nama_lengkap}</p>
              <p className="muted text-xs">NIS {pic.nis}</p>
              <p className="text-[11px] text-slate-400">
                {extras.length} ekstrakurikuler • {pic.is_active ? "Akun aktif" : "Nonaktif"}
              </p>
            </div>
          </div>

          <form action={updateProfileAction} className="mt-4 space-y-3">
            <Field label="Nama lengkap" htmlFor="nama_lengkap">
              <input
                id="nama_lengkap"
                name="nama_lengkap"
                className="input"
                defaultValue={pic.nama_lengkap}
                required
                maxLength={120}
              />
            </Field>
            <Field
              label="Foto profil (opsional)"
              htmlFor="foto"
              hint="PNG/JPG/WEBP maksimal 2 MB. Foto akan dipotong menjadi persegi."
            >
              <input
                id="foto"
                name="foto"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="input file:mr-3 file:rounded-lg file:border-0 file:bg-navy-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white dark:file:bg-navy-600"
              />
            </Field>
            {pic.foto_url ? (
              <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input type="checkbox" name="hapus_foto" value="ya" className="h-5 w-5 rounded border-slate-300 accent-navy-800" />
                Hapus foto profil saat menyimpan
              </label>
            ) : null}
            <SubmitButton className="w-full">Simpan Profil</SubmitButton>
          </form>
          <p className="muted mt-2 text-xs">
            NIS adalah identitas login dan hanya dapat diubah oleh admin.
          </p>
        </section>

        <section className="card mt-4">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <LockIcon size={18} /> Ganti password
          </h2>
          <form action={changePicPasswordAction} className="mt-3 space-y-3">
            <Field label="Password lama" htmlFor="password_lama">
              <input
                id="password_lama"
                name="password_lama"
                type="password"
                className="input"
                autoComplete="current-password"
                required
              />
            </Field>
            <div className="field-grid">
              <Field label="Password baru" htmlFor="password_baru" hint="Minimal 6 karakter.">
                <input
                  id="password_baru"
                  name="password_baru"
                  type="password"
                  className="input"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </Field>
              <Field label="Konfirmasi password" htmlFor="konfirmasi">
                <input
                  id="konfirmasi"
                  name="konfirmasi"
                  type="password"
                  className="input"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </Field>
            </div>
            <SubmitButton variant="secondary" className="w-full">
              Ganti Password
            </SubmitButton>
          </form>
        </section>

        <section className="card mt-4">
          <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Tampilan</h2>
          <ThemeToggle />
          <p className="muted mt-2 text-xs">Preferensi tema disimpan di perangkat ini.</p>
        </section>

        <section className="card mt-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Aplikasi di HP</h2>
          <p className="muted mb-3 mt-1 text-sm">
            Pasang aplikasi ke layar utama agar bisa dibuka cepat seperti aplikasi biasa. Dapat
            dipasang di Android (Chrome/Edge) maupun iPhone (Safari).
          </p>
          <InstallAppButton />
        </section>

        <section className="mt-4 space-y-2">
          {extras.length > 1 ? (
            <Link
              href="/pic"
              className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
                <SchoolIcon size={18} />
              </span>
              <span className="flex-1 text-sm font-medium">Ganti ekstrakurikuler</span>
              <ArrowRightIcon size={16} className="text-slate-400" />
            </Link>
          ) : null}
          <Link
            href="/pic/pengaturan/tentang"
            className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
              <InfoIcon size={18} />
            </span>
            <span className="flex-1 text-sm font-medium">Tentang aplikasi</span>
            <ArrowRightIcon size={16} className="text-slate-400" />
          </Link>
          <Link
            href="/pic/pengaturan/tutorial"
            className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
              <SchoolIcon size={18} />
            </span>
            <span className="flex-1 text-sm font-medium">Tutorial penggunaan</span>
            <ArrowRightIcon size={16} className="text-slate-400" />
          </Link>
        </section>

        <Alert tone="info" className="mt-4">
          Lupa password? Admin dapat melihat dan mereset password PIC. Tidak ada fitur lupa password
          mandiri.
        </Alert>

        <BrandFooter />
      </main>
      <BottomNav kind="pic" extraId={extraId} />
    </>
  );
}
