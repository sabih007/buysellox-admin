import { format, formatDistanceToNowStrict } from "date-fns";
import type { Tone } from "@/components/ui";

export function fmtDate(iso: string | null | undefined, withTime = true) {
  if (!iso) return "—";
  return format(new Date(iso), withTime ? "d MMM yyyy, HH:mm" : "d MMM yyyy");
}

export function ago(iso: string | null | undefined) {
  if (!iso) return "—";
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}

export function money(n: number | null | undefined) {
  return `Rs ${Number(n ?? 0).toLocaleString("en-PK")}`;
}

export const listingStatusTone: Record<string, Tone> = { active: "success", pending: "warning", sold: "primary", expired: "neutral" };
export const paymentStatusTone: Record<string, Tone> = { paid: "success", pending: "warning", failed: "danger", refunded: "purple" };
export const reportStatusTone: Record<string, Tone> = { open: "danger", reviewed: "success", dismissed: "neutral" };
export const subStatusTone: Record<string, Tone> = { active: "success", past_due: "warning", cancelled: "neutral", expired: "neutral" };
export const badgeTone: Record<string, Tone> = { featured: "primary", top: "neutral", urgent: "danger", hot: "orange", super_hot: "purple" };

export function truncate(s: string | null | undefined, n = 80) {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
