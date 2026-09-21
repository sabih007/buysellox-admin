import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "purple" | "orange";

export const toneClass: Record<Tone, string> = {
  neutral: "bg-background text-ink-soft",
  primary: "bg-primary-light text-primary-text",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-[#b45309]",
  danger: "bg-danger-light text-danger",
  purple: "bg-purple-light text-[#6b21a8]",
  orange: "bg-orange-light text-[#c2410c]",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap", toneClass[tone], className)}>{children}</span>;
}

export function StatCard({ label, value, hint, icon, tone = "primary" }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone }) {
  return (
    <div className="card flex items-start gap-3 p-4">
      {icon ? <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", toneClass[tone])}>{icon}</div> : null}
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
        <div className="mt-0.5 text-2xl font-extrabold text-ink">{value}</div>
        {hint ? <div className="mt-0.5 text-xs text-ink-muted">{hint}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <div className="text-sm font-semibold text-ink">{title}</div>
      {description ? <div className="mt-1 text-sm text-ink-muted">{description}</div> : null}
    </div>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("card overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse">{children}</table>
    </div>
  );
}

export function Card({ children, className, title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <section className={cn("card p-4", className)}>
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function KV({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {items.map((it) => (
        <div key={it.label} className="flex justify-between gap-3 border-b border-line py-1.5 text-sm last:border-0">
          <dt className="shrink-0 text-ink-muted">{it.label}</dt>
          <dd className="min-w-0 truncate text-right font-medium text-ink">{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Query-string pagination — keeps every other param intact. */
export function Pagination({ page, pageSize, total, params }: { page: number; pageSize: number; total: number; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-ink-muted">
      <span>
        {from}–{to} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <Link aria-disabled={page <= 1} className={cn("btn-secondary btn-sm", page <= 1 && "pointer-events-none opacity-40")} href={href(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Link>
        <span className="px-2">
          {page} / {pages}
        </span>
        <Link aria-disabled={page >= pages} className={cn("btn-secondary btn-sm", page >= pages && "pointer-events-none opacity-40")} href={href(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/** GET filter bar. Any child input/select becomes a query param on submit. */
export function FilterBar({ children, action }: { children: ReactNode; action: string }) {
  return (
    <form action={action} method="get" className="card mb-4 flex flex-wrap items-end gap-2 p-3">
      {children}
      <button className="btn-primary" type="submit">
        Apply
      </button>
      <Link href={action} className="btn-ghost">
        Reset
      </Link>
    </form>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block min-w-[140px]", className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Avatar({ src, name, size = 32 }: { src?: string | null; name?: string | null; size?: number }) {
  const initial = (name ?? "U").trim().slice(0, 1).toUpperCase() || "U";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-primary-light font-bold text-primary-text" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {initial}
    </span>
  );
}

export function UserLink({ user, size = 28 }: { user: { id: string; full_name: string | null; email?: string | null; avatar_url?: string | null } | null | undefined; size?: number }) {
  if (!user) return <span className="text-ink-muted">Unknown user</span>;
  return (
    <Link href={`/users/${user.id}`} className="flex items-center gap-2 hover:underline">
      <Avatar src={user.avatar_url} name={user.full_name} size={size} />
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink">{user.full_name ?? "Unnamed"}</span>
        {user.email ? <span className="block truncate text-xs text-ink-muted">{user.email}</span> : null}
      </span>
    </Link>
  );
}
