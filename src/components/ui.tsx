import Link from "next/link";
import type { ReactNode } from "react";
import { cn, initials } from "@/lib/utils";
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, InfoIcon, SchoolIcon } from "@/components/icons";

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "success" | "error" | "warning";
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
    error:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100",
    warning:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
  }[tone];
  return (
    <div className={cn("flex items-start gap-2 rounded-xl border p-3 text-sm", styles, className)}>
      <span className="mt-0.5 shrink-0">
        {tone === "success" ? <CheckIcon size={18} /> : tone === "error" || tone === "warning" ? <AlertIcon size={18} /> : <InfoIcon size={18} />}
      </span>
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

export function SearchParamsAlert({
  error,
  ok,
  className,
}: {
  error?: string;
  ok?: string;
  className?: string;
}) {
  if (!error && !ok) return null;
  return (
    <div className={cn("space-y-2", className)}>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {ok ? <Alert tone="success">{ok}</Alert> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "red" | "amber" | "blue" | "navy";
}) {
  const styles = {
    slate: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
    red: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200",
    navy: "bg-navy-900 text-white dark:bg-navy-600",
  }[tone];
  return <span className={cn("badge", styles)}>{children}</span>;
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start gap-2">
      {back ? (
        <Link href={back} className="icon-btn -ml-2 mt-0.5" aria-label="Kembali">
          <ArrowLeftIcon />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight text-navy-900 dark:text-white sm:text-2xl">
          {title}
        </h1>
        {subtitle ? <p className="muted mt-0.5">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 break-words text-xs font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {icon ? (
          <span className="shrink-0 text-navy-600 dark:text-navy-300">{icon}</span>
        ) : null}
      </div>
      <div className="mt-1 break-words text-2xl font-bold text-navy-900 dark:text-white">
        {value}
      </div>
      {hint ? <div className="muted mt-1 text-xs">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-10 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-700 dark:bg-white/10 dark:text-navy-200">
        {icon ?? <InfoIcon size={24} />}
      </div>
      <h3 className="font-semibold text-navy-900 dark:text-white">{title}</h3>
      {description ? <p className="muted max-w-sm">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ActionTile({
  href,
  title,
  description,
  icon,
  badge,
}: {
  href: string;
  title: string;
  description?: string;
  icon: ReactNode;
  badge?: string | number;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[48px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-150 hover:border-navy-300 hover:bg-navy-50/40 active:scale-[0.98] dark:border-white/10 dark:bg-navy-900/70 dark:hover:border-navy-500/40 dark:hover:bg-white/5"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-800 dark:bg-white/10 dark:text-navy-200">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">
            {title}
          </span>
          {badge !== undefined ? <Badge tone="blue">{badge}</Badge> : null}
        </span>
        {description ? <span className="muted mt-0.5 block break-words text-xs">{description}</span> : null}
      </span>
      <ArrowRightIcon size={18} className="shrink-0 text-slate-400 group-hover:text-navy-600 dark:group-hover:text-navy-300" />
    </Link>
  );
}

export function SchoolLogo({
  src,
  name = "SMKN 10 Semarang",
  size = 56,
  rounded = "rounded-2xl",
}: {
  src?: string | null;
  name?: string;
  size?: number;
  rounded?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("shrink-0 object-contain", rounded)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-navy-900 text-white ring-1 ring-white/20",
        rounded,
      )}
      style={{ width: size, height: size }}
      aria-label={name}
    >
      <SchoolIcon size={Math.round(size * 0.52)} />
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 44,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="shrink-0 rounded-full object-cover ring-2 ring-white/60 dark:ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-800 ring-2 ring-white/60 dark:bg-navy-700 dark:text-white dark:ring-white/10"
      style={{ width: size, height: size }}
    >
      {initials(name) || "?"}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  htmlFor,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  htmlFor?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="muted mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}
