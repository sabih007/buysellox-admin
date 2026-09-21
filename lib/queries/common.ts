import { createAdminClient } from "@/lib/supabase/admin";

export const PAGE_SIZE = 25;

export function db() {
  return createAdminClient();
}

export function pageRange(page: number, pageSize = PAGE_SIZE) {
  const p = Math.max(1, page);
  return { from: (p - 1) * pageSize, to: p * pageSize - 1, page: p, pageSize };
}

export function toInt(v: string | undefined, fallback = 1) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Escapes a user-typed search term for use inside an ilike pattern. */
export function like(term: string) {
  return `%${term.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
}

export function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

/** Minimal profile fields joined onto other rows. */
export const PROFILE_MINI = "id, full_name, email, avatar_url, is_verified";
export type ProfileMini = { id: string; full_name: string | null; email: string | null; avatar_url: string | null; is_verified: boolean };

/** Buckets ISO timestamps into per-day counts for the last `days` days (oldest first). */
export function bucketByDay<T extends { created_at: string }>(rows: T[], days: number, valueOf?: (r: T) => number) {
  const out: { day: string; value: number }[] = [];
  const index = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    index.set(key, out.length);
    out.push({ day: key, value: 0 });
  }
  for (const r of rows) {
    const key = r.created_at.slice(0, 10);
    const i = index.get(key);
    if (i !== undefined) out[i].value += valueOf ? valueOf(r) : 1;
  }
  return out;
}
