"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters");
      return;
    }
    setBusy(true);
    setError(null);

    const { error } = await createClient().auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    // The recovery session is already a real session, so land straight on the
    // dashboard — requireAdminPage() still decides whether they get in.
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="label">New password</span>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="label">Confirm password</span>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>
      {error ? <div className="text-sm text-danger">{error}</div> : null}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Update password
      </button>
      <p className="text-xs text-ink-muted">At least 8 characters. You&apos;ll stay signed in on this device.</p>
    </form>
  );
}
