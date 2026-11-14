import { getSettings } from "@/lib/settings";

export async function BrandFooter() {
  const settings = await getSettings();
  const hasCreator = Boolean(settings.logo_pembuat_url || settings.nama_pembuat || settings.link_pembuat);
  return (
    <footer className="no-print mt-10 flex flex-col items-center gap-3 pb-4 pt-6 text-center">
      {hasCreator ? (
        <>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Dibuat oleh
          </p>
          {settings.logo_pembuat_url ? (
            <a
              href={settings.link_pembuat || "#"}
              target={settings.link_pembuat ? "_blank" : undefined}
              rel="noreferrer"
              className="inline-flex items-center justify-center"
              aria-label={`Pembuat aplikasi: ${settings.nama_pembuat || "klik untuk membuka tautan"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logo_pembuat_url}
                alt={settings.nama_pembuat || "Pembuat aplikasi"}
                className="h-9 w-auto max-w-[160px] object-contain"
              />
            </a>
          ) : (
            <a
              href={settings.link_pembuat || "#"}
              target={settings.link_pembuat ? "_blank" : undefined}
              rel="noreferrer"
              className="link text-sm"
            >
              {settings.nama_pembuat || "Pembuat aplikasi"}
            </a>
          )}
        </>
      ) : null}
      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} SMKN 10 Semarang • Pencatatan Ekstrakurikuler
      </p>
    </footer>
  );
}
