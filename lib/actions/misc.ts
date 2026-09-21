"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/components/ui/ActionButton";
import { requireAdmin } from "@/lib/auth";
import { markPromotionFailed, markPromotionPaid } from "@/lib/promotions";
import { isSubscriptionTier, TIER_INFO } from "@/lib/subscriptions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ReportStatus } from "@/types/database";

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Failed" };
}

/* ───────────── Reports ───────────── */

export async function setReportStatus(id: string, status: ReportStatus): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!["open", "reviewed", "dismissed"].includes(status)) return { ok: false, error: "Bad status" };
    const { error } = await createAdminClient().from("reports").update({ status }).eq("id", id);
    if (error) throw error;
    revalidatePath("/reports");
    revalidatePath("/");
    return { ok: true, message: `Marked ${status}` };
  } catch (e) {
    return fail(e);
  }
}

/** Takes the reported ad down (status → expired) and closes every open report on it. */
export async function takeDownReported(listingId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("listings").update({ status: "expired" }).eq("id", listingId);
    if (error) throw error;
    await supabase.from("reports").update({ status: "reviewed" }).eq("listing_id", listingId).eq("status", "open");
    revalidatePath("/reports");
    revalidatePath("/listings");
    return { ok: true, message: "Ad taken down, reports closed" };
  } catch (e) {
    return fail(e);
  }
}

/** Dismisses every open report on a listing (it's fine). */
export async function dismissAllForListing(listingId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().from("reports").update({ status: "dismissed" }).eq("listing_id", listingId).eq("status", "open");
    if (error) throw error;
    revalidatePath("/reports");
    return { ok: true, message: "Reports dismissed" };
  } catch (e) {
    return fail(e);
  }
}

/* ───────────── Payments ───────────── */

/** Manually confirms a pending payment (e.g. JazzCash/Easypaisa verified by hand) — applies the package exactly like the webhook would. */
export async function confirmPayment(promotionId: string, formData: FormData): Promise<ActionResult> {
  try {
    const me = await requireAdmin();
    const ref = String(formData.get("ref") ?? "").trim() || `manual:${me.email ?? me.id}`;
    await markPromotionPaid(createAdminClient(), { promotionId, paymentRef: ref });
    revalidatePath("/payments");
    revalidatePath("/");
    return { ok: true, message: "Payment confirmed, package applied" };
  } catch (e) {
    return fail(e);
  }
}

export async function failPayment(promotionId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await markPromotionFailed(createAdminClient(), { promotionId });
    revalidatePath("/payments");
    return { ok: true, message: "Marked failed" };
  } catch (e) {
    return fail(e);
  }
}

/** Marks refunded and, if the promotion was for a listing, clears that listing's badge. Credits already granted for bundles are NOT clawed back — adjust on the user page if needed. */
export async function refundPayment(promotionId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("ad_promotions").update({ payment_status: "refunded" }).eq("id", promotionId).eq("payment_status", "paid").select("listing_id").maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false, error: "Only paid promotions can be refunded" };
    if (data.listing_id) {
      await supabase.from("listings").update({ badge: null, promotion_rank: 0, promoted_until: null, is_featured: false }).eq("id", data.listing_id);
    }
    revalidatePath("/payments");
    revalidatePath("/listings");
    return { ok: true, message: "Refunded" };
  } catch (e) {
    return fail(e);
  }
}

/* ───────────── Subscriptions ───────────── */

/** Create or replace a user's subscription by hand (comps, bank transfers, support). Optionally grants the tier's credits. */
export async function upsertSubscription(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const tier = String(formData.get("tier") ?? "");
    const months = Math.min(36, Math.max(1, Number(formData.get("months")) || 1));
    const grant = formData.get("grant") === "on";
    if (!isSubscriptionTier(tier)) return { ok: false, error: "Pick a tier" };

    const { data: user } = await supabase.from("profiles").select("id").ilike("email", email).maybeSingle();
    if (!user) return { ok: false, error: "No account with that email" };

    const info = TIER_INFO[tier];
    const end = new Date();
    end.setMonth(end.getMonth() + months);
    const { error } = await supabase
      .from("subscriptions")
      .upsert({ user_id: user.id, tier, status: "active", active_slot_limit: info.activeSlotLimit, current_period_end: end.toISOString(), ls_subscription_id: null }, { onConflict: "user_id" });
    if (error) throw error;

    if (grant) {
      const { error: gerr } = await supabase.rpc("grant_subscription_credits", {
        p_user_id: user.id,
        p_featured: info.featuredCredits,
        p_hot: info.hotCredits,
        p_refresh: info.refreshCredits,
      });
      if (gerr) throw gerr;
    }
    revalidatePath("/subscriptions");
    revalidatePath(`/users/${user.id}`);
    return { ok: true, message: `${info.name} active for ${months} month${months > 1 ? "s" : ""}${grant ? ", credits granted" : ""}` };
  } catch (e) {
    return fail(e);
  }
}

export async function setSubscriptionStatus(id: string, status: "active" | "cancelled" | "expired" | "past_due"): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().from("subscriptions").update({ status }).eq("id", id);
    if (error) throw error;
    revalidatePath("/subscriptions");
    return { ok: true, message: `Marked ${status}` };
  } catch (e) {
    return fail(e);
  }
}

export async function updateSubscriptionFields(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const limit = Number(formData.get("active_slot_limit"));
    const end = String(formData.get("current_period_end") ?? "");
    if (!Number.isInteger(limit) || limit < 0) return { ok: false, error: "Slot limit must be a whole number" };
    const patch: Record<string, unknown> = { active_slot_limit: limit };
    if (end) patch.current_period_end = new Date(end).toISOString();
    const { error } = await createAdminClient().from("subscriptions").update(patch).eq("id", id);
    if (error) throw error;
    revalidatePath("/subscriptions");
    return { ok: true, message: "Saved" };
  } catch (e) {
    return fail(e);
  }
}

/* ───────────── Packages ───────────── */

export async function updatePackage(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const name = String(formData.get("name") ?? "").trim();
    const price = Number(formData.get("price"));
    const duration_days = Number(formData.get("duration_days"));
    const credits = Number(formData.get("credits"));
    const is_active = formData.get("is_active") === "on";
    if (!name) return { ok: false, error: "Name required" };
    if (!Number.isFinite(price) || price < 0) return { ok: false, error: "Bad price" };
    if (!Number.isInteger(duration_days) || duration_days < 1) return { ok: false, error: "Duration must be ≥ 1 day" };
    if (!Number.isInteger(credits) || credits < 1) return { ok: false, error: "Credits must be ≥ 1" };
    const { error } = await createAdminClient().from("packages").update({ name, price, duration_days, credits, is_active }).eq("id", id);
    if (error) throw error;
    revalidatePath("/packages");
    return { ok: true, message: "Saved" };
  } catch (e) {
    return fail(e);
  }
}

/* ───────────── Chats ───────────── */

export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().from("messages").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/chats");
    return { ok: true, message: "Message deleted" };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteConversation(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().from("conversations").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/chats");
    return { ok: true, message: "Conversation deleted" };
  } catch (e) {
    return fail(e);
  }
}

/* ───────────── Property requirements ───────────── */

export async function setRequirementStatus(id: string, status: "active" | "fulfilled" | "expired"): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().from("property_requirements").update({ status }).eq("id", id);
    if (error) throw error;
    revalidatePath("/requirements");
    return { ok: true, message: `Marked ${status}` };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteRequirement(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().from("property_requirements").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/requirements");
    return { ok: true, message: "Deleted" };
  } catch (e) {
    return fail(e);
  }
}
