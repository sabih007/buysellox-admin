"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    // Sent from the browser so the PKCE verifier lands in this browser's cookies —
    // /auth/callback needs it to exchange the code for a session.
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo });

    // Anything other than a transport failure is reported the same way, so this
    // page can't be used to discover which emails have accounts.
    if (error && error.status && error.status >= 500) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setSent(true);
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="rounded-lg bg-background px-3 py-3 text-sm text-ink-soft">
        If an account exists for <b className="text-ink">{email.trim()}</b>, a reset link is on its way. The link works once and
        expires in about an hour — open it in this browser.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="label">Email</span>
        <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {error ? <div className="text-sm text-danger">{error}</div> : null}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send reset link
      </button>
    </form>
  );
}
