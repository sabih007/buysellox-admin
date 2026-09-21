/**
 * Grants (or revokes) the admin role for an existing Buysellox account.
 * The `role` column can only be written with the service-role key, so this
 * is the one-time bootstrap for the very first admin; after that, use
 * Settings → Administrators in the dashboard.
 *
 *   node scripts/make-admin.mjs you@example.com
 *   node scripts/make-admin.mjs you@example.com --revoke
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const [, , email, flag] = process.argv;
if (!email) {
  console.error("Usage: node scripts/make-admin.mjs <email> [--revoke]");
  process.exit(1);
}

const env = {};
try {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !line.startsWith("#")) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
} catch {}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data: profile, error } = await supabase.from("profiles").select("id, email, role").ilike("email", email).maybeSingle();
if (error) throw error;
if (!profile) {
  console.error(`No profile with email ${email}. Sign up on the website or app first.`);
  process.exit(1);
}
const role = flag === "--revoke" ? "user" : "admin";
const { error: uerr } = await supabase.from("profiles").update({ role }).eq("id", profile.id);
if (uerr) throw uerr;
console.log(`${profile.email} is now role=${role}`);
