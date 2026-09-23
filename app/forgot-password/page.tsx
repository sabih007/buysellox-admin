import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/app/forgot-password/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <div className="text-lg font-extrabold text-ink">Forgot password</div>
            <div className="text-xs text-ink-muted">We&apos;ll email you a reset link</div>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">{error}</div> : null}

        <ForgotPasswordForm />

        <Link href="/login" className="btn-ghost mt-3 w-full">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
