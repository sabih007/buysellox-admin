import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/app/login/LoginForm";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const user = await getUser();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <div className="text-lg font-extrabold text-ink">Buysellox Admin</div>
            <div className="text-xs text-ink-muted">Super admin console</div>
          </div>
        </div>

        {error === "not_admin" ? (
          <div className="mb-4 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
            {user ? (
              <>
                <b>{user.email}</b> is signed in but isn&apos;t an admin. Sign out and use an admin account, or grant this account the admin role.
              </>
            ) : (
              "That account isn't an admin."
            )}
          </div>
        ) : null}

        <LoginForm next={next ?? "/"} signedInAs={user?.email ?? null} />
      </div>
    </main>
  );
}
