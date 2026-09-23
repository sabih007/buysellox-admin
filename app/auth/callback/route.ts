import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for Supabase recovery links. Exchanges the one-time code for a
 * cookie session, then hands off to `next` (normally /reset-password).
 * Cookies are writable here, unlike in a Server Component, so the session sticks.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const linkError = searchParams.get("error_description") ?? searchParams.get("error");

  const bail = (reason: string) =>
    NextResponse.redirect(new URL(`/forgot-password?error=${encodeURIComponent(reason)}`, request.url));

  if (linkError) return bail(linkError);
  if (!code) return bail("That link is missing its recovery code.");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return bail(error.message);

  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", request.url));
}
