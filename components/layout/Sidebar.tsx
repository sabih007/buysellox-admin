"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Building2,
  CreditCard,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/listings", label: "Listings", icon: Tags },
  { href: "/users", label: "Users", icon: Users },
  { href: "/reports", label: "Reports", icon: Flag },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/subscriptions", label: "Subscriptions", icon: ShieldCheck },
  { href: "/packages", label: "Packages", icon: Package },
  { href: "/chats", label: "Chats", icon: MessageSquare },
  { href: "/requirements", label: "Requirements", icon: Building2 },
  { href: "/notifications", label: "Push notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ email, counts }: { email: string | null; counts: { pendingListings: number; openReports: number; pendingPayments: number } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const badgeFor = (href: string) => {
    if (href === "/listings" && counts.pendingListings) return counts.pendingListings;
    if (href === "/reports" && counts.openReports) return counts.openReports;
    if (href === "/payments" && counts.pendingPayments) return counts.pendingPayments;
    return 0;
  };

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const n = badgeFor(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-white" : "text-ink-soft hover:bg-background hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {n ? <span className={cn("rounded-full px-1.5 text-[10px] font-bold", active ? "bg-white/25 text-white" : "bg-danger text-white")}>{n}</span> : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
        <Link href="/" className="text-base font-extrabold text-ink">
          Buysellox <span className="text-primary">Admin</span>
        </Link>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {open ? (
        <div className="border-b border-line bg-surface p-3 md:hidden">
          {nav}
          <button type="button" onClick={signOut} className="btn-ghost mt-2 w-full justify-start">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="text-base font-extrabold text-ink">
            Buysellox <span className="text-primary">Admin</span>
          </span>
        </Link>
        {nav}
        <div className="mt-auto border-t border-line pt-3">
          <div className="truncate px-1 text-xs text-ink-muted" title={email ?? ""}>
            {email}
          </div>
          <button type="button" onClick={signOut} className="btn-ghost mt-1 w-full justify-start">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
