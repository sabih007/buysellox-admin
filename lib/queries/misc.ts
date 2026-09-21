import { db, like, pageRange, PROFILE_MINI, type ProfileMini } from "@/lib/queries/common";
import type { AdPromotion, Conversation, Listing, Message, Package, PushCampaign, Report, Subscription } from "@/types/database";

/* ───────────── Reports ───────────── */

export type ReportRow = Report & {
  listing: Pick<Listing, "id" | "title" | "status" | "images" | "user_id" | "city" | "category_slug" | "slug" | "city_slug"> | null;
  reporter: ProfileMini | null;
};

export async function listReports(f: { status?: string; reason?: string; page?: string }) {
  const { from, to, page, pageSize } = pageRange(Number(f.page) || 1);
  let q = db()
    .from("reports")
    .select(`*, listing:listings(id, title, status, images, user_id, city, category_slug, slug, city_slug), reporter:profiles!reports_reporter_id_fkey(${PROFILE_MINI})`, { count: "exact" });
  q = q.eq("status", f.status || "open");
  if (f.reason) q = q.eq("reason", f.reason);
  const { data, error, count } = await q.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as ReportRow[], total: count ?? 0, page, pageSize };
}

/* ───────────── Payments (ad_promotions) ───────────── */

export type PromotionRow = AdPromotion & {
  package: Pick<Package, "name" | "key" | "badge"> | null;
  listing: Pick<Listing, "id" | "title"> | null;
  user: ProfileMini | null;
};

export async function listPromotions(f: { q?: string; status?: string; method?: string; page?: string }) {
  const { from, to, page, pageSize } = pageRange(Number(f.page) || 1);
  let q = db()
    .from("ad_promotions")
    .select(`*, package:packages(name, key, badge), listing:listings(id, title), user:profiles!ad_promotions_user_id_fkey(${PROFILE_MINI})`, { count: "exact" });
  if (f.status) q = q.eq("payment_status", f.status);
  if (f.method) q = q.eq("payment_method", f.method);
  if (f.q) {
    const term = f.q.trim();
    if (/^[0-9a-f-]{36}$/i.test(term)) q = q.or(`id.eq.${term},user_id.eq.${term},listing_id.eq.${term}`);
    else q = q.ilike("payment_ref", like(term));
  }
  const { data, error, count } = await q.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as PromotionRow[], total: count ?? 0, page, pageSize };
}

export async function getPaymentTotals() {
  const supabase = db();
  const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [all, last30, pending] = await Promise.all([
    supabase.from("ad_promotions").select("amount").eq("payment_status", "paid").limit(10000),
    supabase.from("ad_promotions").select("amount").eq("payment_status", "paid").gte("created_at", since30).limit(10000),
    supabase.from("ad_promotions").select("amount").eq("payment_status", "pending").limit(10000),
  ]);
  const sum = (rows: { amount: number }[] | null) => (rows ?? []).reduce((s, r) => s + Number(r.amount), 0);
  return { allTime: sum(all.data), last30: sum(last30.data), last30Count: last30.data?.length ?? 0, pending: sum(pending.data), pendingCount: pending.data?.length ?? 0 };
}

/* ───────────── Subscriptions ───────────── */

export type SubscriptionRow = Subscription & { user: ProfileMini | null };

export async function listSubscriptions(f: { status?: string; tier?: string; q?: string; page?: string }) {
  const { from, to, page, pageSize } = pageRange(Number(f.page) || 1);
  let q = db().from("subscriptions").select(`*, user:profiles!subscriptions_user_id_fkey(${PROFILE_MINI})`, { count: "exact" });
  if (f.status) q = q.eq("status", f.status);
  if (f.tier) q = q.eq("tier", f.tier);
  if (f.q) {
    const term = f.q.trim();
    if (/^[0-9a-f-]{36}$/i.test(term)) q = q.or(`id.eq.${term},user_id.eq.${term}`);
    else q = q.ilike("ls_subscription_id", like(term));
  }
  const { data, error, count } = await q.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as SubscriptionRow[], total: count ?? 0, page, pageSize };
}

/* ───────────── Packages ───────────── */

export async function listPackages() {
  const { data, error } = await db().from("packages").select("*").order("promotion_rank", { ascending: false }).order("duration_days", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Package[];
}

/* ───────────── Chats ───────────── */

export type ConversationRow = Conversation & {
  listing: Pick<Listing, "id" | "title"> | null;
  buyer: ProfileMini | null;
  seller: ProfileMini | null;
  last_message?: Pick<Message, "body" | "created_at" | "sender_id" | "attachment_type" | "audio_url"> | null;
  message_count?: number;
};

export async function listConversations(f: { q?: string; page?: string }) {
  const supabase = db();
  const { from, to, page, pageSize } = pageRange(Number(f.page) || 1);
  let q = supabase
    .from("conversations")
    .select(`*, listing:listings(id, title), buyer:profiles!conversations_buyer_id_fkey(${PROFILE_MINI}), seller:profiles!conversations_seller_id_fkey(${PROFILE_MINI})`, { count: "exact" });
  if (f.q) {
    const term = f.q.trim();
    if (/^[0-9a-f-]{36}$/i.test(term)) q = q.or(`id.eq.${term},listing_id.eq.${term},buyer_id.eq.${term},seller_id.eq.${term}`);
    else {
      const { data: users } = await supabase.from("profiles").select("id").or(`full_name.ilike.${like(term)},email.ilike.${like(term)}`).limit(200);
      const ids = (users ?? []).map((u) => u.id as string);
      if (ids.length === 0) return { rows: [] as ConversationRow[], total: 0, page, pageSize };
      q = q.or(`buyer_id.in.(${ids.join(",")}),seller_id.in.(${ids.join(",")})`);
    }
  }
  const { data, error, count } = await q.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  const rows = (data ?? []) as unknown as ConversationRow[];

  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id, body, created_at, sender_id, attachment_type, audio_url")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false })
      .limit(2000);
    const last = new Map<string, ConversationRow["last_message"]>();
    const counts = new Map<string, number>();
    for (const m of msgs ?? []) {
      counts.set(m.conversation_id, (counts.get(m.conversation_id) ?? 0) + 1);
      if (!last.has(m.conversation_id)) last.set(m.conversation_id, m);
    }
    for (const r of rows) {
      r.last_message = last.get(r.id) ?? null;
      r.message_count = counts.get(r.id) ?? 0;
    }
  }
  return { rows, total: count ?? 0, page, pageSize };
}

export async function getConversation(id: string) {
  const supabase = db();
  const [{ data: conv, error }, msgs] = await Promise.all([
    supabase
      .from("conversations")
      .select(`*, listing:listings(id, title, price, category_slug, images), buyer:profiles!conversations_buyer_id_fkey(${PROFILE_MINI}), seller:profiles!conversations_seller_id_fkey(${PROFILE_MINI})`)
      .eq("id", id)
      .maybeSingle(),
    supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }).limit(1000),
  ]);
  if (error) throw error;
  if (!conv) return null;
  return {
    conversation: conv as unknown as ConversationRow & { listing: (Pick<Listing, "id" | "title" | "price" | "category_slug" | "images">) | null },
    messages: (msgs.data ?? []) as Message[],
  };
}

/* ───────────── Property requirements ───────────── */

export interface PropertyRequirement {
  id: string;
  user_id: string;
  category_slug: string;
  subcategory_slug: string | null;
  city_slug: string;
  city: string;
  area: string | null;
  min_budget: number | null;
  max_budget: number | null;
  bedrooms: number | null;
  attributes: Record<string, unknown>;
  description: string;
  images: string[];
  status: "active" | "fulfilled" | "expired";
  created_at: string;
  expires_at: string;
}

export type RequirementRow = PropertyRequirement & { user: ProfileMini | null };

export async function listRequirements(f: { status?: string; city?: string; page?: string }) {
  const { from, to, page, pageSize } = pageRange(Number(f.page) || 1);
  let q = db().from("property_requirements").select(`*, user:profiles!property_requirements_user_id_fkey(${PROFILE_MINI})`, { count: "exact" });
  if (f.status) q = q.eq("status", f.status);
  if (f.city) q = q.eq("city_slug", f.city);
  const { data, error, count } = await q.order("created_at", { ascending: false }).range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as unknown as RequirementRow[], total: count ?? 0, page, pageSize };
}

/* ───────────── Push campaigns ───────────── */

export async function listCampaigns() {
  const { data, error } = await db().from("push_campaigns").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []) as PushCampaign[];
}

export async function getPushStats() {
  const supabase = db();
  const [{ count: devices }, { data: platforms }] = await Promise.all([
    supabase.from("push_tokens").select("*", { count: "exact", head: true }),
    supabase.from("push_tokens").select("platform").limit(10000),
  ]);
  const byPlatform: Record<string, number> = {};
  for (const p of platforms ?? []) byPlatform[p.platform] = (byPlatform[p.platform] ?? 0) + 1;
  return { devices: devices ?? 0, byPlatform };
}

/* ───────────── Settings ───────────── */

export async function listAdmins() {
  const { data, error } = await db().from("profiles").select(PROFILE_MINI + ", created_at").eq("role", "admin").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as (ProfileMini & { created_at: string })[];
}

export async function getSavedSearchStats() {
  const { count } = await db().from("saved_searches").select("*", { count: "exact", head: true });
  return count ?? 0;
}
