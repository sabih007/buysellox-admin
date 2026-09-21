import { db, like, pageRange } from "@/lib/queries/common";
import type { AdPromotion, Listing, Package, Profile, Subscription } from "@/types/database";

export interface UserFilters {
  q?: string;
  role?: string;
  verified?: string;
  city?: string;
  sort?: string;
  page?: string;
}

export type UserRow = Profile & { listings_count?: number };

export async function listUsers(f: UserFilters) {
  const supabase = db();
  const { from, to, page, pageSize } = pageRange(Number(f.page) || 1);

  let q = supabase.from("profiles").select("*", { count: "exact" });
  if (f.q) {
    const term = f.q.trim();
    if (/^[0-9a-f-]{36}$/i.test(term)) q = q.eq("id", term);
    else q = q.or(`full_name.ilike.${like(term)},email.ilike.${like(term)},phone.ilike.${like(term)}`);
  }
  if (f.role) q = q.eq("role", f.role);
  if (f.verified === "yes") q = q.eq("is_verified", true);
  if (f.verified === "no") q = q.eq("is_verified", false);
  if (f.city) q = q.eq("city", f.city);
  q = f.sort === "oldest" ? q.order("created_at", { ascending: true }) : q.order("created_at", { ascending: false });

  const { data, error, count } = await q.range(from, to);
  if (error) throw error;
  const rows = (data ?? []) as UserRow[];

  // Active-ad count per user on this page (one query, not N).
  if (rows.length) {
    const { data: ls } = await supabase
      .from("listings")
      .select("user_id")
      .in(
        "user_id",
        rows.map((r) => r.id)
      )
      .eq("status", "active")
      .limit(5000);
    const counts: Record<string, number> = {};
    for (const l of ls ?? []) counts[l.user_id] = (counts[l.user_id] ?? 0) + 1;
    for (const r of rows) r.listings_count = counts[r.id] ?? 0;
  }

  return { rows, total: count ?? 0, page, pageSize };
}

export interface AuthInfo {
  last_sign_in_at: string | null;
  banned_until: string | null;
  providers: string[];
  email_confirmed_at: string | null;
}

export async function getUserDetail(id: string) {
  const supabase = db();
  const [{ data: profile, error }, listings, subscription, promotions, auth, reportsMade, pushTokens] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("listings").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(100),
    supabase.from("subscriptions").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("ad_promotions").select("*, package:packages(name, key)").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.auth.admin.getUserById(id),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("reporter_id", id),
    supabase.from("push_tokens").select("platform, updated_at").eq("user_id", id),
  ]);
  if (error) throw error;
  if (!profile) return null;

  const u = auth.data?.user;
  const authInfo: AuthInfo | null = u
    ? {
        last_sign_in_at: u.last_sign_in_at ?? null,
        // `banned_until` isn't on the public type but is returned by the admin API.
        banned_until: ((u as unknown as { banned_until?: string | null }).banned_until ?? null) || null,
        providers: (u.app_metadata?.providers as string[] | undefined) ?? [],
        email_confirmed_at: u.email_confirmed_at ?? null,
      }
    : null;

  return {
    profile: profile as Profile,
    listings: (listings.data ?? []) as Listing[],
    subscription: (subscription.data ?? null) as Subscription | null,
    promotions: (promotions.data ?? []) as unknown as (AdPromotion & { package: Pick<Package, "name" | "key"> | null })[],
    auth: authInfo,
    reportsMade: reportsMade.count ?? 0,
    devices: (pushTokens.data ?? []) as { platform: string; updated_at: string }[],
  };
}

export function isBanned(auth: AuthInfo | null) {
  return Boolean(auth?.banned_until && new Date(auth.banned_until) > new Date());
}
