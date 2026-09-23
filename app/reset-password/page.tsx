import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ResetPasswordForm } from "@/app/reset-password/ResetPasswordForm";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage() {
  // /auth/callback has already traded the recovery code for a session by now.
  // No session means the link was stale, already used, or opened in another browser.
  const user = await getUser();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <div className="text-lg font-extrabold text-ink">Set a new password</div>
            <div className="text-xs text-ink-muted">{user?.email ?? "Recovery link required"}</div>
          </div>
        </div>

        {user ? (
          <ResetPasswordForm />
        ) : (
          <>
            <div className="mb-3 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
              This reset link is invalid or has expired. Links work once and last about an hour, and must be opened in the same
              browser that requested them.
            </div>
            <Link href="/forgot-password" className="btn-primary w-full">
              Request a new link
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
