import { bucketByDay, daysAgo, db, PROFILE_MINI, type ProfileMini } from "@/lib/queries/common";
import type { Listing, Report } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST filter builder is shared across head-only count queries
async function count(table: string, apply?: (q: any) => any): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = db().from(table).select("*", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

/** Badge counts shown in the sidebar. */
export async function getSidebarCounts() {
  const [pendingListings, openReports, pendingPayments] = await Promise.all([
    count("listings", (q) => q.eq("status", "pending")),
    count("reports", (q) => q.eq("status", "open")),
    count("ad_promotions", (q) => q.eq("payment_status", "pending")),
  ]);
  return { pendingListings, openReports, pendingPayments };
}

export async function getOverview() {
  const supabase = db();
  const since7 = daysAgo(7);
  const since30 = daysAgo(30);
  const since1 = daysAgo(1);

  const [
    users,
    usersNew7,
    listingsActive,
    listingsPending,
    listingsNew7,
    openReports,
    activeSubs,
    messages24h,
    devices,
    revenueRows,
    signupRows,
    listingRows,
    recentListings,
    recentReports,
    recentUsers,
    categoryRows,
  ] = await Promise.all([
    count("profiles"),
    count("profiles", (q) => q.gte("created_at", since7)),
    count("listings", (q) => q.eq("status", "active")),
    count("listings", (q) => q.eq("status", "pending")),
    count("listings", (q) => q.gte("created_at", since7)),
    count("reports", (q) => q.eq("status", "open")),
    count("subscriptions", (q) => q.eq("status", "active")),
    count("messages", (q) => q.gte("created_at", since1)),
    count("push_tokens"),
    supabase.from("ad_promotions").select("amount, created_at").eq("payment_status", "paid").gte("created_at", since30).limit(5000),
    supabase.from("profiles").select("created_at").gte("created_at", since30).limit(5000),
    supabase.from("listings").select("created_at").gte("created_at", since30).limit(5000),
    supabase.from("listings").select(`*, owner:profiles!listings_user_id_fkey(${PROFILE_MINI})`).order("created_at", { ascending: false }).limit(8),
    supabase.from("reports").select(`*, listing:listings(id, title), reporter:profiles!reports_reporter_id_fkey(${PROFILE_MINI})`).eq("status", "open").order("created_at", { ascending: false }).limit(6),
    supabase.from("profiles").select(PROFILE_MINI + ", created_at, city").order("created_at", { ascending: false }).limit(8),
    supabase.from("listings").select("category_slug").eq("status", "active").limit(5000),
  ]);

  const paid = (revenueRows.data ?? []) as { amount: number; created_at: string }[];
  const revenue30 = paid.reduce((s, r) => s + Number(r.amount), 0);

  const byCategory: Record<string, number> = {};
  for (const r of (categoryRows.data ?? []) as { category_slug: string }[]) byCategory[r.category_slug] = (byCategory[r.category_slug] ?? 0) + 1;

  return {
    kpis: { users, usersNew7, listingsActive, listingsPending, listingsNew7, openReports, activeSubs, messages24h, devices, revenue30, paidCount30: paid.length },
    series: {
      signups: bucketByDay((signupRows.data ?? []) as { created_at: string }[], 30),
      listings: bucketByDay((listingRows.data ?? []) as { created_at: string }[], 30),
      revenue: bucketByDay(paid, 30, (r) => Number(r.amount)),
    },
    byCategory,
    recentListings: (recentListings.data ?? []) as unknown as (Listing & { owner: ProfileMini | null })[],
    recentReports: (recentReports.data ?? []) as unknown as (Report & { listing: { id: string; title: string } | null; reporter: ProfileMini | null })[],
    recentUsers: (recentUsers.data ?? []) as unknown as (ProfileMini & { created_at: string; city: string | null })[],
  };
}
