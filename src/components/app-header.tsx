import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/actions/auth";
import { LogoutIcon } from "@/components/icons";
import { SchoolLogo } from "@/components/ui";

export function AppHeader({
  title,
  subtitle,
  homeHref,
  logoSrc,
  badge,
}: {
  title: string;
  subtitle?: string;
  homeHref: string;
  logoSrc?: string | null;
  badge?: ReactNode;
}) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-white/10 dark:bg-navy-950/90">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4">
        <Link href={homeHref} className="shrink-0" aria-label="Ke halaman utama">
          <SchoolLogo src={logoSrc} size={36} rounded="rounded-xl" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight text-navy-900 dark:text-white">
            {title}
          </p>
          {subtitle ? (
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        {badge}
        <form action={logoutAction}>
          <button type="submit" className="icon-btn" aria-label="Keluar" title="Keluar">
            <LogoutIcon size={20} />
          </button>
        </form>
      </div>
    </header>
  );
}
