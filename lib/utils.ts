import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInHours, differenceInMinutes, format, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number): string {
  return `Rs. ${new Intl.NumberFormat("en-PK").format(amount)}`;
}

const LAKH_CRORE_CATEGORIES = new Set(["property-for-sale", "property-for-rent", "vehicles"]);

function trimDecimal(n: number): string {
  return n % 1 === 0 ? n.toString() : n.toFixed(1);
}

/**
 * Property/vehicle prices in Pakistan are read in lakh (1,00,000) and crore
 * (1,00,00,000), not grouped thousands — "Rs. 25 Lac" reads naturally where
 * "Rs. 2,500,000" doesn't. Falls back to formatPKR for other categories and
 * for amounts below one lakh.
 */
export function formatListingPrice(amount: number, categorySlug: string): string {
  if (!LAKH_CRORE_CATEGORIES.has(categorySlug)) return formatPKR(amount);
  if (amount >= 10_000_000) return `Rs. ${trimDecimal(amount / 10_000_000)} Crore`;
  if (amount >= 100_000) return `Rs. ${trimDecimal(amount / 100_000)} Lac`;
  return formatPKR(amount);
}

/**
 * Normalizes a Pakistani phone number (as free-typed at signup, e.g.
 * "03xx-xxxxxxx" or "+923xxxxxxxxx") to the digits-only international format
 * wa.me links require. Returns null rather than guessing when the input
 * doesn't look like a Pakistani mobile number.
 */
export function toWhatsAppNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0092")) return digits.slice(2);
  if (digits.startsWith("92") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `92${digits.slice(1)}`;
  if (digits.length === 10) return `92${digits}`;
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatChatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const minutes = differenceInMinutes(now, date);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (isToday(date)) return `${differenceInHours(now, date)}h`;
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMM");
}

/**
 * "Seen" read-receipt label: relative minutes for the first hour, then a
 * clock time (day-qualified once it's not today) so it stays unambiguous.
 */
export function formatSeenTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const minutes = differenceInMinutes(now, date);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return `yesterday at ${format(date, "h:mm a")}`;
  return format(date, "d MMM, h:mm a");
}
