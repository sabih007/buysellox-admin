export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://buysellox.com").replace(/\/$/, "");

/** Canonical public URL for a listing — same shape as lib/api.ts listingWebUrl in the app. */
export function listingSiteUrl(l: { category_slug: string; city_slug: string; slug: string }) {
  return `${SITE_URL}/${l.category_slug}/${l.city_slug}/${l.slug}`;
}
