/**
 * Hand-written mirror of the Supabase schema (supabase/migrations). Once the
 * project is linked, prefer regenerating this with:
 *   npx supabase gen types typescript --linked > types/database.ts
 */

export type Role = "user" | "admin";
export type ListingStatus = "active" | "sold" | "pending" | "expired";
export type Condition = "new" | "used";
export type Badge = "featured" | "urgent" | "top" | "hot" | "super_hot";
export type PaymentMethod = "jazzcash" | "easypaisa" | "card" | "lemonsqueezy";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type ReportStatus = "open" | "reviewed" | "dismissed";
export type ReportReason = "spam" | "scam" | "prohibited" | "harassment" | "other";
export type ReportTargetType = "listing" | "user" | "message";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  is_verified: boolean;
  email_verified: boolean;
  role: Role;
  created_at: string;
  refresh_credits: number;
  featured_credits: number;
  hot_credits: number;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  category_slug: string;
  subcategory: string | null;
  condition: Condition | null;
  attributes: Record<string, string | number | boolean | null>;
  city: string;
  city_slug: string;
  area: string | null;
  lat: number | null;
  lng: number | null;
  images: string[];
  status: ListingStatus;
  badge: Badge | null;
  promotion_rank: number;
  promoted_until: string | null;
  bumped_at: string | null;
  is_featured: boolean;
  views_count: number;
  created_at: string;
  expires_at: string;
  free_refresh_used_at: string | null;
  /** Attached by lib/listings.ts (attachSellerVerified) — not a real column. */
  seller_is_verified?: boolean;
}

export interface Package {
  id: string;
  key: "featured" | "urgent" | "top" | "bump" | "hot" | "super_hot";
  name: string;
  badge: Badge | null;
  promotion_rank: number;
  duration_days: number;
  price: number;
  credits: number;
  is_active: boolean;
}

export interface AdPromotion {
  id: string;
  listing_id: string | null;
  user_id: string;
  package_id: string;
  starts_at: string;
  expires_at: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_ref: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: "shop" | "dealer" | "business_pro";
  status: "active" | "cancelled" | "expired" | "past_due";
  ls_subscription_id: string | null;
  active_slot_limit: number;
  current_period_end: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  audio_url: string | null;
  audio_duration_ms: number | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  created_at: string;
  read_at: string | null;
}

export interface Report {
  id: string;
  /** Listing the report is about, or the listing behind a reported message; null for user reports (0027). */
  listing_id: string | null;
  reporter_id: string;
  target_type: ReportTargetType;
  /** Listing, profile or message id, per `target_type`. */
  target_id: string;
  /** Listing owner / reported user / message sender — the account admins act on. */
  reported_user_id: string;
  /** Listing title or message text at report time, for the admin queue. */
  excerpt: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
}

/** `blocker_id` blocked `blocked_id`; listings and chats are hidden both ways (0027). */
export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

/** Expo push token for one device of the mobile app (0025_push_tokens.sql). */
export interface PushToken {
  token: string;
  user_id: string;
  platform: "android" | "ios";
  created_at: string;
  updated_at: string;
}

/** Admin announcement sent to the mobile app (0026_push_campaigns.sql). */
export interface PushCampaign {
  id: string;
  created_by: string | null;
  title: string;
  body: string;
  path: string | null;
  audience:
    | { type: "all" }
    | { type: "city"; city: string }
    | { type: "active_sellers" }
    | { type: "user"; email: string };
  recipients: number;
  sent: number;
  failed: number;
  created_at: string;
}
