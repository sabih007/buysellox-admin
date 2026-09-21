export type PackageKey = "featured" | "urgent" | "top" | "bump" | "hot" | "super_hot";

export type Badge = "featured" | "urgent" | "top" | "hot" | "super_hot" | null;

/**
 * Ranking weight applied to `listings.promotion_rank`. Higher sorts first.
 * `urgent`/`top` are retired (no longer sold — see supabase/migrations/0013)
 * but kept here since historical listings/packages can still reference them.
 */
export const PROMOTION_RANK: Record<Exclude<Badge, null>, number> = {
  super_hot: 60,
  hot: 40,
  top: 30,
  featured: 20,
  urgent: 5,
};

/** Badge display precedence when a listing could show more than one signal. */
export const BADGE_PRIORITY: Exclude<Badge, null>[] = ["super_hot", "hot", "top", "featured", "urgent"];

export const BADGE_LABEL: Record<Exclude<Badge, null>, string> = {
  super_hot: "Super Hot",
  hot: "Hot",
  top: "Top Ad",
  featured: "Featured",
  urgent: "Urgent",
};

/** Tailwind color tokens per badge, matching the Buysellox.com design system (§3). */
export const BADGE_COLOR: Record<Exclude<Badge, null>, { bg: string; text: string }> = {
  super_hot: { bg: "bg-gold", text: "text-white" },
  hot: { bg: "bg-danger", text: "text-white" },
  top: { bg: "bg-gold", text: "text-white" },
  featured: { bg: "bg-primary", text: "text-white" },
  urgent: { bg: "bg-danger", text: "text-white" },
};

export function highestPriorityBadge(badges: Badge[]): Badge {
  for (const b of BADGE_PRIORITY) {
    if (badges.includes(b)) return b;
  }
  return null;
}

/**
 * Default package catalog seeded into the `packages` table. Prices/durations are
 * admin-editable at runtime — this is only the initial seed (see supabase/seed.sql).
 * Matches marketplace-packages-pakistan.md §2's boost lineup.
 */
export const defaultPackages = [
  {
    key: "super_hot" as PackageKey,
    name: "Super Hot",
    badge: "super_hot" as Badge,
    promotion_rank: PROMOTION_RANK.super_hot,
    duration_days: 30,
    price: 9999,
    credits: 1,
  },
  {
    key: "hot" as PackageKey,
    name: "Hot",
    badge: "hot" as Badge,
    promotion_rank: PROMOTION_RANK.hot,
    duration_days: 15,
    price: 2999,
    credits: 1,
  },
  {
    key: "featured" as PackageKey,
    name: "Featured",
    badge: "featured" as Badge,
    promotion_rank: PROMOTION_RANK.featured,
    duration_days: 7,
    price: 1499,
    credits: 1,
  },
  {
    key: "bump" as PackageKey,
    name: "Refresh",
    badge: null,
    promotion_rank: 0,
    duration_days: 0,
    // Lemon Squeezy enforces a minimum checkout amount (~PKR 139, drifts with
    // FX since it's pegged to a USD floor) — keep real headroom above it.
    price: 149,
    credits: 1,
  },
  {
    key: "bump" as PackageKey,
    name: "Bump bundle (10 credits)",
    badge: null,
    promotion_rank: 0,
    duration_days: 0,
    price: 799,
    credits: 10,
  },
];
