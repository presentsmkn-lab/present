import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePic } from "@/lib/auth/guards";
import { getPicExtras } from "@/lib/queries/extra";
import { getSettings } from "@/lib/settings";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { Alert, Avatar, EmptyState, PageHeader, SearchParamsAlert } from "@/components/ui";
import { ArrowRightIcon, CalendarIcon, SchoolIcon } from "@/components/icons";

export const metadata = { title: "Pilih Ekstrakurikuler" };

export default async function PicHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { pic } = await requirePic();
  const params = await searchParams;
  const extras = await getPicExtras(pic.id);
  if (extras.length === 1) redirect(`/pic/extra/${extras[0].extra.id}`);
  const settings = await getSettings();

  return (
    <>
      <AppHeader
        title={pic.nama_lengkap}
        subtitle={pic.nis}
        homeHref="/pic"
        logoSrc={settings.logo_sekolah_url}
      />
      <main className="page">
        <PageHeader
          title="Pilih Ekstrakurikuler"
          subtitle="Anda mengelola lebih dari satu kegiatan. Pilih salah satu untuk mulai."
        />
        <SearchParamsAlert error={params.error} ok={params.ok} />
        {extras.length === 0 ? (
          <EmptyState
            title="Belum ada ekstrakurikuler"
            description="Admin belum menugaskan Anda ke ekstrakurikuler mana pun. Hubungi admin sekolah."
            icon={<SchoolIcon size={24} />}
            action={
              <Link href="/pic/pengaturan" className="btn-secondary">
                Buka Pengaturan
              </Link>
            }
          />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {extras.map((item) => (
              <Link
                key={item.id}
                href={`/pic/extra/${item.extra.id}`}
                className="card flex min-h-20 items-center gap-3 transition-all duration-150 hover:border-navy-300 active:scale-[0.98] dark:hover:border-navy-500/40"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white dark:bg-navy-600">
                  <SchoolIcon size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-900 dark:text-white">
                    {item.extra.nama}
                  </span>
                  <span className="muted text-xs">
                    PIC {item.peran === "utama" ? "Utama" : "Asisten"}
                  </span>
                </span>
                <ArrowRightIcon className="shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        )}

        {extras.length > 0 ? (
          <Alert tone="info" className="mt-4">
            <span className="flex items-center gap-2">
              <CalendarIcon size={16} />
              Presensi bulan berjalan dapat diisi dari menu tengah.
            </span>
          </Alert>
        ) : null}
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-navy-900/60">
          <Avatar name={pic.nama_lengkap} src={pic.foto_url} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{pic.nama_lengkap}</p>
            <p className="muted text-xs">NIS {pic.nis}</p>
          </div>
          <Link href="/pic/pengaturan" className="link text-sm">
            Profil
          </Link>
        </div>
      </main>
      <BottomNav kind="pic" />
    </>
  );
}
