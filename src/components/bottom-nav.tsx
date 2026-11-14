"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartIcon, ClipboardIcon, HomeIcon, SettingsIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type Kind = "pic" | "admin";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ElementType;
};

function buildItems(kind: Kind, extraId?: string): NavItem[] {
  const leftHref =
    kind === "pic" ? (extraId ? `/pic/extra/${extraId}/statistik` : "/pic") : "/admin/statistik";
  const centerHref =
    kind === "pic" ? (extraId ? `/pic/extra/${extraId}/presensi` : "/pic") : "/admin";
  const rightHref = kind === "pic" ? "/pic/pengaturan" : "/admin/pengaturan";
  return [
    { href: leftHref, label: "Statistik", Icon: ChartIcon },
    {
      href: centerHref,
      label: kind === "pic" ? "Presensi" : "Dashboard",
      Icon: kind === "pic" ? ClipboardIcon : HomeIcon,
    },
    { href: rightHref, label: "Pengaturan", Icon: SettingsIcon },
  ];
}

/** Cocok bila path sama persis, atau berada di bawah href-nya.
 *  Href root (mis. /admin) hanya cocok persis agar subhalaman tidak
 *  tertangkap sebagai menu tengah. */
function matchesHref(href: string, pathname: string, rootHref: string): boolean {
  if (pathname === href) return true;
  if (href === rootHref) return false;
  return pathname.startsWith(`${href}/`);
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z" />
    </svg>
  );
}

function NavItemContent({
  item,
  isActive,
  loading,
}: {
  item: NavItem;
  isActive: boolean;
  loading: boolean;
}) {
  return (
    <>
      {/* Kotak ikon: hanya item aktif yang tampil sebagai kotak menonjol. */}
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl border-0 transition-all duration-300 ease-out",
          isActive
            ? "-translate-y-3 bg-slate-900 text-white shadow-md dark:bg-blue-600"
            : "translate-y-0 bg-transparent text-slate-500 shadow-none dark:text-slate-400",
        )}
      >
        {isActive && loading ? <Spinner /> : <item.Icon size={22} />}
      </span>

      {/* Label tanpa pill/badge. */}
      <span
        className={cn(
          "text-[11px] leading-none transition-colors duration-300 ease-out",
          isActive
            ? "font-semibold text-blue-600 dark:text-blue-400"
            : "font-medium text-slate-500 dark:text-slate-400",
        )}
      >
        {item.label}
      </span>
    </>
  );
}

export function BottomNav({ kind, extraId }: { kind: Kind; extraId?: string }) {
  const pathname = usePathname();
  const items = useMemo(() => buildItems(kind, extraId), [kind, extraId]);
  const rootHref = kind === "admin" ? "/admin" : "/pic";
  const norm = pathname.replace(/\/$/, "") || "/";

  // Sumber kebenaran menu aktif adalah usePathname(). pendingPath hanya
  // dipakai sesaat untuk animasi optimistis selama navigasi berlangsung.
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const pathActiveIndex = useMemo(() => {
    // Prioritas: Pengaturan, lalu tengah (root), lalu Statistik.
    if (matchesHref(items[2].href, norm, rootHref)) return 2;
    if (matchesHref(items[1].href, norm, rootHref)) return 1;
    if (matchesHref(items[0].href, norm, rootHref)) return 0;
    // Subhalaman lain (anggota, jadwal, PIC, semester, dst.) dianggap
    // bagian dari menu tengah supaya selalu ada tepat satu menu aktif.
    if (norm === rootHref || norm.startsWith(`${rootHref}/`)) return 1;
    return -1;
  }, [items, norm, rootHref]);

  const pendingIndex = pendingPath
    ? items.findIndex((item) => item.href === pendingPath)
    : -1;
  const activeIndex = pendingIndex >= 0 ? pendingIndex : pathActiveIndex;
  const loading = pendingPath !== null;

  // Reset otomatis saat pathname berubah (termasuk tombol Back browser),
  // sehingga tile aktif selalu mengikuti halaman yang sedang dibuka.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset state sementara yang memang disinkronkan dengan pathname
    setPendingPath(null);
  }, [pathname]);

  // Jaring pengaman: bila navigasi gagal/redirect lama, jangan biarkan
  // spinner menyala selamanya.
  useEffect(() => {
    if (!pendingPath) return;
    const timer = window.setTimeout(() => setPendingPath(null), 8000);
    return () => window.clearTimeout(timer);
  }, [pendingPath]);

  return (
    <>
      {/* Selalu ada di DOM agar markup SSR dan client identik. */}
      <div className={cn("bn-progress-track", loading && "is-active")} aria-hidden="true">
        <div className={cn("bn-progress-shimmer", loading && "is-active")} />
      </div>

      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-navy-950/95"
        aria-label="Navigasi utama"
      >
        <div className="bottom-safe mx-auto grid max-w-lg grid-cols-3">
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <Link
                key={item.label}
                href={item.href}
                prefetch={false}
                aria-current={isActive ? "page" : undefined}
                aria-busy={isActive && loading}
                onClick={() => {
                  // Hanya tandai loading bila benar-benar pindah halaman.
                  if (item.href !== norm) setPendingPath(item.href);
                }}
                className="relative flex min-h-[74px] flex-col items-center justify-between gap-1 pb-2 pt-1 text-[11px] no-underline"
              >
                <NavItemContent item={item} isActive={isActive} loading={loading} />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
