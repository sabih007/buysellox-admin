"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/components/ui/ActionButton";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Failed" };
}

function done(id?: string) {
  revalidatePath("/users");
  if (id) revalidatePath(`/users/${id}`);
  revalidatePath("/settings");
}

export async function setUserVerified(id: string, verified: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().from("profiles").update({ is_verified: verified }).eq("id", id);
    if (error) throw error;
    done(id);
    return { ok: true, message: verified ? "Verified" : "Verification removed" };
  } catch (e) {
    return fail(e);
  }
}

export async function setUserRole(id: string, role: "user" | "admin"): Promise<ActionResult> {
  try {
    const me = await requireAdmin();
    if (id === me.id && role !== "admin") return { ok: false, error: "You can't remove your own admin role" };
    const { error } = await createAdminClient().from("profiles").update({ role }).eq("id", id);
    if (error) throw error;
    done(id);
    return { ok: true, message: role === "admin" ? "Now an admin" : "Admin role removed" };
  } catch (e) {
    return fail(e);
  }
}

/** Sets the three credit wallets to absolute values. */
export async function setUserCredits(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const read = (k: string) => {
      const n = Number(formData.get(k));
      if (!Number.isInteger(n) || n < 0 || n > 100000) throw new Error(`${k} must be a whole number ≥ 0`);
      return n;
    };
    const patch = { refresh_credits: read("refresh_credits"), featured_credits: read("featured_credits"), hot_credits: read("hot_credits") };
    const { error } = await createAdminClient().from("profiles").update(patch).eq("id", id);
    if (error) throw error;
    done(id);
    return { ok: true, message: "Credits updated" };
  } catch (e) {
    return fail(e);
  }
}

export async function updateUserProfile(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const full_name = String(formData.get("full_name") ?? "").trim() || null;
    const phone = String(formData.get("phone") ?? "").trim() || null;
    const city = String(formData.get("city") ?? "").trim() || null;
    const { error } = await createAdminClient().from("profiles").update({ full_name, phone, city }).eq("id", id);
    if (error) throw error;
    done(id);
    return { ok: true, message: "Profile saved" };
  } catch (e) {
    return fail(e);
  }
}

/** Bans via Supabase Auth (no sign-in possible; existing sessions expire on refresh). Optionally hides all their ads. */
export async function banUser(id: string, hideListings: boolean): Promise<ActionResult> {
  try {
    const me = await requireAdmin();
    if (id === me.id) return { ok: false, error: "You can't ban yourself" };
    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.updateUserById(id, { ban_duration: "876600h" }); // ~100 years
    if (error) throw error;
    if (hideListings) {
      const { error: lerr } = await supabase.from("listings").update({ status: "expired" }).eq("user_id", id).eq("status", "active");
      if (lerr) throw lerr;
    }
    done(id);
    return { ok: true, message: hideListings ? "Banned and ads hidden" : "Banned" };
  } catch (e) {
    return fail(e);
  }
}

export async function unbanUser(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().auth.admin.updateUserById(id, { ban_duration: "none" });
    if (error) throw error;
    done(id);
    return { ok: true, message: "Unbanned" };
  } catch (e) {
    return fail(e);
  }
}

/** Permanently deletes the auth user; profiles/listings/chats cascade via FKs. */
export async function deleteUser(id: string): Promise<ActionResult> {
  try {
    const me = await requireAdmin();
    if (id === me.id) return { ok: false, error: "You can't delete yourself" };
    const { error } = await createAdminClient().auth.admin.deleteUser(id);
    if (error) throw error;
    done();
    return { ok: true, message: "User deleted" };
  } catch (e) {
    return fail(e);
  }
}

/** Sends a password-reset email through Supabase Auth. */
export async function sendPasswordReset(email: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const { error } = await createAdminClient().auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { ok: true, message: "Reset email sent" };
  } catch (e) {
    return fail(e);
  }
}

/** Settings page: promote an existing account to admin by email. */
export async function addAdminByEmail(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email) return { ok: false, error: "Enter an email" };
    const supabase = createAdminClient();
    const { data } = await supabase.from("profiles").select("id, role").ilike("email", email).maybeSingle();
    if (!data) return { ok: false, error: "No account with that email — they must sign up on the site/app first" };
    if (data.role === "admin") return { ok: false, error: "Already an admin" };
    const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", data.id);
    if (error) throw error;
    done(data.id);
    return { ok: true, message: `${email} is now an admin` };
  } catch (e) {
    return fail(e);
  }
}
