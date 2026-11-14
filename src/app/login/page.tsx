import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { SchoolLogo } from "@/components/ui";
import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session?.kind === "admin") redirect("/admin");
  if (session?.kind === "pic") redirect("/pic");

  const params = await searchParams;
  const settings = await getSettings();
  const error =
    params.error === "akun-nonaktif"
      ? "Akun PIC Anda sedang dinonaktifkan. Hubungi admin."
      : undefined;

  const schoolLogo = settings.logo_sekolah_url;
  const creatorLogo = settings.logo_pembuat_url;
  const creatorName = settings.nama_pembuat || "Pembuat aplikasi";

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,#1e40af33,transparent_60%)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex min-h-[84px] items-center justify-center gap-3">
            {schoolLogo || !creatorLogo ? (
              <SchoolLogo src={schoolLogo} size={84} rounded="rounded-3xl" />
            ) : null}

            {schoolLogo && creatorLogo ? (
              <span
                aria-hidden="true"
                className="h-10 w-px bg-slate-300 dark:bg-white/15"
              />
            ) : null}

            {creatorLogo ? (
              <Link
                href={settings.link_pembuat || "#"}
                target={settings.link_pembuat ? "_blank" : undefined}
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-white p-1.5 ring-1 ring-slate-200 transition-transform active:scale-[0.96] dark:bg-white/5 dark:ring-white/10"
                aria-label={`Logo ${creatorName}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={creatorLogo}
                  alt={creatorName}
                  className="h-12 w-auto max-w-[104px] object-contain"
                />
              </Link>
            ) : null}
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-navy-600 dark:text-navy-300">
            SMK Negeri 10 Semarang
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            Pencatatan Ekstrakurikuler
          </h1>
          <p className="muted mt-1 text-sm">Presensi, anggota, dan statistik dalam satu tempat.</p>
        </div>

        <div className="card p-5 shadow-lg shadow-navy-900/5">
          <LoginForm initialError={error} />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} SMKN 10 Semarang
          </p>
        </div>
      </div>
    </main>
  );
}
