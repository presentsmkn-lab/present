import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { changeAdminPasswordAction } from "@/actions/admin";
import { getSettings } from "@/lib/settings";
import { BrandFooter } from "@/components/brand-footer";
import { InstallAppButton } from "@/components/install-prompt";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, Avatar, Field, PageHeader, SearchParamsAlert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import {
  ArrowRightIcon,
  DownloadIcon,
  InfoIcon,
  LockIcon,
  SchoolIcon,
  SettingsIcon,
} from "@/components/icons";

export const metadata = { title: "Pengaturan Admin" };

export default async function AdminPengaturanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await requireAdmin();
  const query = await searchParams;
  const settings = await getSettings();

  return (
    <main className="page">
      <PageHeader title="Pengaturan" subtitle="Akun admin, tampilan, dan informasi aplikasi." />
      <SearchParamsAlert error={query.error} ok={query.ok} />

      <section className="card mt-2">
        <div className="flex items-center gap-3">
          <Avatar name={session.nama || "Admin"} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900 dark:text-white">
              {session.nama || "Administrator"}
            </p>
            <p className="muted text-xs">Username {session.username ?? "-"}</p>
          </div>
        </div>
        <p className="muted mt-3 text-xs">
          Akun admin tidak dapat didaftarkan dari aplikasi. Akun awal dibuat melalui seed script.
        </p>
      </section>

      <section className="card mt-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <LockIcon size={18} /> Ganti password admin
        </h2>
        <form action={changeAdminPasswordAction} className="mt-3 space-y-3">
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
            <Field label="Password baru" htmlFor="password_baru" hint="Minimal 8 karakter.">
              <input
                id="password_baru"
                name="password_baru"
                type="password"
                className="input"
                autoComplete="new-password"
                minLength={8}
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
                minLength={8}
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
        <Link
          href="/admin/branding"
          className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
            <SchoolIcon size={18} />
          </span>
          <span className="flex-1 text-sm font-medium">Logo & branding</span>
          <ArrowRightIcon size={16} className="text-slate-400" />
        </Link>
        <Link
          href="/admin/export"
          className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
            <DownloadIcon size={18} />
          </span>
          <span className="flex-1 text-sm font-medium">Export Excel</span>
          <ArrowRightIcon size={16} className="text-slate-400" />
        </Link>
        <Link
          href="/admin/pengaturan/tentang"
          className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
            <InfoIcon size={18} />
          </span>
          <span className="flex-1 text-sm font-medium">Tentang aplikasi</span>
          <ArrowRightIcon size={16} className="text-slate-400" />
        </Link>
        <Link
          href="/admin/pengaturan/tutorial"
          className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
            <SettingsIcon size={18} />
          </span>
          <span className="flex-1 text-sm font-medium">Tutorial penggunaan</span>
          <ArrowRightIcon size={16} className="text-slate-400" />
        </Link>
      </section>

      <Alert tone="info" className="mt-4">
        Tidak ada fitur lupa password. Jika password admin hilang, buat ulang akun melalui seed
        script di server dengan username berbeda.
      </Alert>

      <p className="muted mt-3 text-xs">
        Logo sekolah aktif: {settings.logo_sekolah_url ? "sudah diunggah" : "belum diunggah"} • Logo
        pembuat: {settings.logo_pembuat_url ? "sudah diunggah" : "belum diunggah"}
      </p>

      <BrandFooter />
    </main>
  );
}
