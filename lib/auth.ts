import { redirect } from "next/navigation";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface AdminSession {
  id: string;
  email: string | null;
  profile: Profile;
}

/**
 * The signed-in user, if they're an admin (profiles.role = 'admin'). The role
 * column can only be written with the service-role key (web migration 0017),
 * so trusting it here is safe.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const user = await getUser();
  if (!user) return null;
  const { data } = await createAdminClient().from("profiles").select("*").eq("id", user.id).maybeSingle();
  const profile = data as Profile | null;
  if (!profile || profile.role !== "admin") return null;
  return { id: user.id, email: user.email ?? profile.email, profile };
});

/** For layouts/pages: redirects non-admins. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/login?error=not_admin");
  return session;
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error("Admins only");
  return session;
}
