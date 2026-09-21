import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdPromotion, Listing, Package, PaymentMethod } from "@/types/database";

export async function getActivePackages(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("is_active", true)
    .order("promotion_rank", { ascending: false })
    .order("duration_days", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Package[];
}

/**
 * Applies a package's badge/rank (or bump) to its listing. Shared by every
 * payment path — also called directly by app/api/listings/[id]/apply-credit
 * after spending a Featured/Hot subscription credit, so the "don't
 * downgrade, take the later expiry" logic only lives in one place.
 */
export async function applyPackageToListing(
  supabase: SupabaseClient,
  { listingId, packageRow }: { listingId: string; packageRow: Package }
) {
  const now = new Date();
  const isBump = packageRow.key === "bump";
  const computedExpiry = new Date(now.getTime() + packageRow.duration_days * 24 * 60 * 60 * 1000);

  if (isBump) {
    const { error } = await supabase
      .from("listings")
      .update({ bumped_at: now.toISOString() })
      .eq("id", listingId);
    if (error) throw error;
    return;
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("promotion_rank, promoted_until")
    .eq("id", listingId)
    .single();
  if (listingError) throw listingError;
  const current = listing as Pick<Listing, "promotion_rank" | "promoted_until">;

  if (packageRow.promotion_rank < current.promotion_rank) return; // §6: don't downgrade an active stronger badge

  const currentExpiry = current.promoted_until ? new Date(current.promoted_until) : null;
  const promotedUntil =
    currentExpiry && currentExpiry > computedExpiry ? currentExpiry : computedExpiry;

  const { error } = await supabase
    .from("listings")
    .update({
      badge: packageRow.badge,
      promotion_rank: packageRow.promotion_rank,
      promoted_until: promotedUntil.toISOString(),
      is_featured: ["featured", "top", "hot", "super_hot"].includes(packageRow.badge ?? ""),
    })
    .eq("id", listingId);
  if (error) throw error;
}

/** Credits a bundle purchase to the buyer's wallet instead of applying it to a listing. */
async function grantRefreshCredits(
  supabase: SupabaseClient,
  { userId, credits }: { userId: string; credits: number }
) {
  const { error } = await supabase.rpc("increment_refresh_credits", {
    p_user_id: userId,
    p_amount: credits,
  });
  if (error) throw error;
}

function computeExpiresAt(packageRow: Package) {
  const now = new Date();
  if (packageRow.key === "bump") return now;
  return new Date(now.getTime() + packageRow.duration_days * 24 * 60 * 60 * 1000);
}

export interface PurchasePromotionInput {
  /** Omitted for a credit-bundle purchase — it isn't promoting any particular listing. */
  listingId?: string;
  userId: string;
  packageId: string;
  paymentMethod: PaymentMethod;
}

/** Starts a real-gateway purchase: records the attempt as `pending` before redirecting off-site. */
export async function createPendingPromotion(
  supabase: SupabaseClient,
  { listingId, userId, packageId, paymentMethod }: PurchasePromotionInput
) {
  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("*")
    .eq("id", packageId)
    .single();
  if (pkgError) throw pkgError;
  const packageRow = pkg as Package;

  const now = new Date();
  const { data: promotion, error: insertError } = await supabase
    .from("ad_promotions")
    .insert({
      listing_id: listingId ?? null,
      user_id: userId,
      package_id: packageId,
      starts_at: now.toISOString(),
      expires_at: computeExpiresAt(packageRow).toISOString(),
      amount: packageRow.price,
      payment_method: paymentMethod,
      payment_status: "pending",
    })
    .select()
    .single();
  if (insertError) throw insertError;

  return { promotion: promotion as AdPromotion, packageRow };
}

/**
 * Confirms a real-gateway payment succeeded and applies it — called from the
 * Lemon Squeezy webhook only (lib/supabase/admin.ts client). Idempotent: the
 * `payment_status = 'pending'` filter means a duplicate webhook delivery (LS
 * retries at-least-once) is a no-op rather than re-applying the package or
 * throwing on a zero-row update.
 */
export async function markPromotionPaid(
  supabase: SupabaseClient,
  { promotionId, paymentRef }: { promotionId: string; paymentRef: string }
) {
  const { data: promotion, error } = await supabase
    .from("ad_promotions")
    .update({ payment_status: "paid", payment_ref: paymentRef })
    .eq("id", promotionId)
    .eq("payment_status", "pending")
    .select("listing_id, package_id, user_id")
    .maybeSingle();
  if (error) throw error;
  if (!promotion) return; // already paid (duplicate webhook) or unknown id

  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("*")
    .eq("id", promotion.package_id)
    .single();
  if (pkgError) throw pkgError;
  const packageRow = pkg as Package;

  if (promotion.listing_id === null) {
    // Credit-bundle purchase — not tied to a listing, credit the wallet instead.
    await grantRefreshCredits(supabase, { userId: promotion.user_id, credits: packageRow.credits });
    return;
  }

  await applyPackageToListing(supabase, { listingId: promotion.listing_id, packageRow });
}

export async function markPromotionFailed(
  supabase: SupabaseClient,
  { promotionId, paymentRef }: { promotionId: string; paymentRef?: string }
) {
  const { error } = await supabase
    .from("ad_promotions")
    .update({ payment_status: "failed", payment_ref: paymentRef ?? null })
    .eq("id", promotionId);
  if (error) throw error;
}

export interface AdPromotionWithDetails extends AdPromotion {
  package: Pick<Package, "name" | "key" | "badge"> | null;
  listing: Pick<Listing, "title" | "slug" | "category_slug" | "city_slug"> | null;
}

export async function getMyPromotions(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("ad_promotions")
    .select("*, package:packages(name, key, badge), listing:listings(title, slug, category_slug, city_slug)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as AdPromotionWithDetails[];
}
