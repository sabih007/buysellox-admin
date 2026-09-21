import type { SupabaseClient } from "@supabase/supabase-js";
import type { Subscription } from "@/types/database";

export type SubscriptionTier =
  | "shop"
  | "dealer"
  | "business_pro"
  | "agent_starter"
  | "agency"
  | "agency_premium";

export interface TierInfo {
  name: string;
  price: number;
  activeSlotLimit: number;
  featuredCredits: number;
  hotCredits: number;
  refreshCredits: number;
  /** Which pricing page renders this tier's card — /me/subscription (general) or /partner (real_estate). */
  category: "general" | "real_estate";
}

/**
 * Fixed business-defined tiers (marketplace-packages-pakistan.md §3/§4) — kept
 * in code, not an admin-editable DB table like `packages`, since these
 * rarely change and each maps 1:1 to a real Lemon Squeezy subscription
 * variant (LEMONSQUEEZY_*_VARIANT_ID env vars) rather than a generic
 * custom-price override.
 */
export const TIER_INFO: Record<SubscriptionTier, TierInfo> = {
  shop: {
    name: "Shop",
    price: 4999,
    activeSlotLimit: 30,
    featuredCredits: 5,
    hotCredits: 0,
    refreshCredits: 30,
    category: "general",
  },
  dealer: {
    name: "Dealer",
    price: 12999,
    activeSlotLimit: 100,
    featuredCredits: 20,
    hotCredits: 3,
    refreshCredits: 120,
    category: "general",
  },
  business_pro: {
    name: "Business Pro",
    price: 24999,
    activeSlotLimit: 300,
    featuredCredits: 60,
    hotCredits: 10,
    refreshCredits: 400,
    category: "general",
  },
  // §4's "Super Hot credits/month" column is dropped for now — there's no
  // super_hot_credits wallet column yet (only featured_credits/hot_credits/
  // refresh_credits exist). Agents can still buy Super Hot à la carte.
  agent_starter: {
    name: "Agent Starter",
    price: 8999,
    activeSlotLimit: 30,
    featuredCredits: 8,
    hotCredits: 2,
    refreshCredits: 60,
    category: "real_estate",
  },
  agency: {
    name: "Agency",
    price: 34999,
    activeSlotLimit: 100,
    featuredCredits: 30,
    hotCredits: 10,
    refreshCredits: 300,
    category: "real_estate",
  },
  agency_premium: {
    name: "Agency Premium",
    price: 79999,
    activeSlotLimit: 250,
    featuredCredits: 75,
    hotCredits: 30,
    refreshCredits: 800,
    category: "real_estate",
  },
};

export const TIER_ORDER: SubscriptionTier[] = ["shop", "dealer", "business_pro"];
export const AGENT_TIER_ORDER: SubscriptionTier[] = ["agent_starter", "agency", "agency_premium"];

export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return typeof value === "string" && value in TIER_INFO;
}

export async function getSubscription(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Subscription | null;
}
