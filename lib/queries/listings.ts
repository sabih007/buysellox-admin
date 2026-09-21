import { db, like, pageRange, PROFILE_MINI, type ProfileMini } from "@/lib/queries/common";
import type { AdPromotion, Listing, Package, Report } from "@/types/database";

export interface ListingFilters {
  q?: string;
  status?: string;
  category?: string;
  city?: string;
  badge?: string;
  /** "reported" = has at least one open report */
  flag?: string;
  sort?: string;
  page?: string;
}

export type ListingRow = Listing & { owner: ProfileMini | null };

export async function listListings(f: ListingFilters) {
  const supabase = db();
  const { from, to, page, pageSize } = pageRange(Number(f.page) || 1);

  let q = supabase.from("listings").select(`*, owner:profiles!listings_user_id_fkey(${PROFILE_MINI})`, { count: "exact" });
  if (f.q) {
    const term = f.q.trim();
    // Allow pasting a listing id straight into the search box.
    if (/^[0-9a-f-]{36}$/i.test(term)) q = q.eq("id", term);
    else q = q.or(`title.ilike.${like(term)},description.ilike.${like(term)},slug.ilike.${like(term)}`);
  }
  if (f.status) q = q.eq("status", f.status);
  if (f.category) q = q.eq("category_slug", f.category);
  if (f.city) q = q.eq("city_slug", f.city);
  if (f.badge === "any") q = q.not("badge", "is", null);
  else if (f.badge) q = q.eq("badge", f.badge);
  if (f.flag === "reported") {
    const { data } = await supabase.from("reports").select("listing_id").eq("status", "open").limit(5000);
    const ids = [...new Set((data ?? []).map((r) => r.listing_id as string))];
    q = q.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  }

  switch (f.sort) {
    case "oldest":
      q = q.order("created_at", { ascending: true });
      break;
    case "views":
      q = q.order("views_count", { ascending: false });
      break;
    case "price_desc":
      q = q.order("price", { ascending: false });
      break;
    case "price_asc":
      q = q.order("price", { ascending: true });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  const { data, error, count } = await q.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as ListingRow[], total: count ?? 0, page, pageSize };
}

export async function getListingDetail(id: string) {
  const supabase = db();
  const [{ data: listing, error }, reports, promotions, favorites, conversations] = await Promise.all([
    supabase.from("listings").select(`*, owner:profiles!listings_user_id_fkey(${PROFILE_MINI}, phone, city, created_at)`).eq("id", id).maybeSingle(),
    supabase.from("reports").select(`*, reporter:profiles!reports_reporter_id_fkey(${PROFILE_MINI})`).eq("listing_id", id).order("created_at", { ascending: false }),
    supabase.from("ad_promotions").select("*, package:packages(name, key)").eq("listing_id", id).order("created_at", { ascending: false }),
    supabase.from("favorites").select("*", { count: "exact", head: true }).eq("listing_id", id),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("listing_id", id),
  ]);
  if (error) throw error;
  if (!listing) return null;
  return {
    listing: listing as unknown as Listing & { owner: (ProfileMini & { phone: string | null; city: string | null; created_at: string }) | null },
    reports: (reports.data ?? []) as unknown as (Report & { reporter: ProfileMini | null })[],
    promotions: (promotions.data ?? []) as unknown as (AdPromotion & { package: Pick<Package, "name" | "key"> | null })[],
    favoritesCount: favorites.count ?? 0,
    conversationsCount: conversations.count ?? 0,
  };
}
