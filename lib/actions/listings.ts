"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/components/ui/ActionButton";
import { requireAdmin } from "@/lib/auth";
import { PROMOTION_RANK, type Badge } from "@/lib/packages";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ListingStatus } from "@/types/database";

const STATUSES: ListingStatus[] = ["active", "pending", "sold", "expired"];
const BADGES: Exclude<Badge, null>[] = ["super_hot", "hot", "top", "featured", "urgent"];

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Failed" };
}

function done() {
  revalidatePath("/listings");
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function setListingStatus(id: string, status: ListingStatus): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!STATUSES.includes(status)) return { ok: false, error: "Bad status" };
    const patch: Record<string, unknown> = { status };
    // Re-activating gives the ad a fresh 30-day window, like the site's repost.
    if (status === "active") patch.expires_at = new Date(Date.now() + 30 * 86400_000).toISOString();
    const { error } = await createAdminClient().from("listings").update(patch).eq("id", id);
    if (error) throw error;
    done();
    return { ok: true, message: `Marked ${status}` };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteListing(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().from("listings").delete().eq("id", id);
    if (error) throw error;
    done();
    return { ok: true, message: "Deleted" };
  } catch (e) {
    return fail(e);
  }
}

/** Manually promote (badge + rank for N days) or clear a promotion. Bypasses payment — for comps/support. */
export async function setListingBadge(id: string, badge: Badge, days: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    if (badge === null) {
      const { error } = await supabase.from("listings").update({ badge: null, promotion_rank: 0, promoted_until: null, is_featured: false }).eq("id", id);
      if (error) throw error;
      done();
      return { ok: true, message: "Promotion cleared" };
    }
    if (!BADGES.includes(badge)) return { ok: false, error: "Bad badge" };
    const d = Math.min(365, Math.max(1, Math.floor(days || 7)));
    const { error } = await supabase
      .from("listings")
      .update({
        badge,
        promotion_rank: PROMOTION_RANK[badge],
        promoted_until: new Date(Date.now() + d * 86400_000).toISOString(),
        is_featured: badge === "featured",
      })
      .eq("id", id);
    if (error) throw error;
    done();
    return { ok: true, message: `${badge} for ${d} days` };
  } catch (e) {
    return fail(e);
  }
}

export async function bumpListing(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().from("listings").update({ bumped_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    done();
    return { ok: true, message: "Bumped to top" };
  } catch (e) {
    return fail(e);
  }
}

export async function extendListing(id: string, days: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const d = Math.min(365, Math.max(1, Math.floor(days || 30)));
    const { data } = await createAdminClient().from("listings").select("expires_at").eq("id", id).maybeSingle();
    const base = data?.expires_at && new Date(data.expires_at) > new Date() ? new Date(data.expires_at) : new Date();
    const { error } = await createAdminClient()
      .from("listings")
      .update({ expires_at: new Date(base.getTime() + d * 86400_000).toISOString(), status: "active" })
      .eq("id", id);
    if (error) throw error;
    done();
    return { ok: true, message: `Extended ${d} days` };
  } catch (e) {
    return fail(e);
  }
}

export async function updateListingFields(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price"));
    const area = String(formData.get("area") ?? "").trim();
    if (title.length < 3) return { ok: false, error: "Title is too short" };
    if (!Number.isFinite(price) || price < 0) return { ok: false, error: "Bad price" };
    const { error } = await createAdminClient().from("listings").update({ title, description, price, area: area || null }).eq("id", id);
    if (error) throw error;
    done();
    return { ok: true, message: "Saved" };
  } catch (e) {
    return fail(e);
  }
}

export async function removeListingImage(id: string, url: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data } = await supabase.from("listings").select("images").eq("id", id).maybeSingle();
    const images = ((data?.images ?? []) as string[]).filter((u) => u !== url);
    const { error } = await supabase.from("listings").update({ images }).eq("id", id);
    if (error) throw error;
    done();
    return { ok: true, message: "Photo removed" };
  } catch (e) {
    return fail(e);
  }
}

/** Bulk status change from the listings table. */
export async function bulkListingStatus(ids: string[], status: ListingStatus | "delete"): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!ids.length) return { ok: false, error: "Nothing selected" };
    const supabase = createAdminClient();
    if (status === "delete") {
      const { error } = await supabase.from("listings").delete().in("id", ids);
      if (error) throw error;
    } else {
      if (!STATUSES.includes(status)) return { ok: false, error: "Bad status" };
      const { error } = await supabase.from("listings").update({ status }).in("id", ids);
      if (error) throw error;
    }
    done();
    return { ok: true, message: `${ids.length} updated` };
  } catch (e) {
    return fail(e);
  }
}
