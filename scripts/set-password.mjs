/**
 * Sets a new password for an existing Buysellox account.
 * Passwords can only be written with the service-role key, so this is the
 * break-glass path when an admin is locked out and can't use the
 * "Forgot password" flow (e.g. email delivery is down).
 *
 *   node scripts/set-password.mjs you@example.com
 *   node scripts/set-password.mjs you@example.com 'new-password'
 *
 * Prefer the no-argument form — it prompts without echoing, so the password
 * never lands in your shell history.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import readline from "node:readline";

const [, , email, passwordArg] = process.argv;
if (!email) {
  console.error("Usage: node scripts/set-password.mjs <email> [password]");
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

/** Reads a line without echoing it back to the terminal. */
function askHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (s) => {
      if (!muted) rl.output.write(s);
    };
    rl.question(query, (answer) => {
      rl.output.write("\n");
      rl.close();
      resolve(answer);
    });
    muted = true;
  });
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// profiles.id is the auth user id, so the profile lookup doubles as an existence check.
const { data: profile, error } = await supabase.from("profiles").select("id, email, role").ilike("email", email).maybeSingle();
if (error) throw error;

let userId = profile?.id;
let found = profile?.email ?? email;
if (!userId) {
  // No profile row — fall back to scanning auth users (e.g. a signup that never got a profile).
  for (let page = 1; page <= 20 && !userId; page++) {
    const { data, error: lerr } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (lerr) throw lerr;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) {
      userId = hit.id;
      found = hit.email;
    }
    if (data.users.length < 200) break;
  }
}
if (!userId) {
  console.error(`No account with email ${email}.`);
  process.exit(1);
}

let password = passwordArg;
if (!password) {
  password = await askHidden(`New password for ${found}: `);
  const again = await askHidden("Confirm password: ");
  if (password !== again) {
    console.error("Passwords don't match.");
    process.exit(1);
  }
}
if (!password || password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const { error: uerr } = await supabase.auth.admin.updateUserById(userId, { password });
if (uerr) throw uerr;
console.log(`Password updated for ${found}${profile?.role ? ` (role=${profile.role})` : ""}`);
