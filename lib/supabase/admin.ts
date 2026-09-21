import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely. Never import this from a
 * client component or anywhere reachable by the browser bundle; it's for
 * server-verified writes only (e.g. confirming a Lemon Squeezy payment
 * succeeded) where the caller must be trusted regardless of which user's
 * session is making the request. See supabase/migrations/0008_lock_down_promotions.sql —
 * `ad_promotions.payment_status` and the promotion columns on `listings` can
 * only be written by this client now.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
