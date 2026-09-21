"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next, signedInAs }: { next: string; signedInAs: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.replace(next.startsWith("/") ? next : "/");
    router.refresh();
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="label">Email</span>
        <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error ? <div className="text-sm text-danger">{error}</div> : null}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign in
      </button>
      {signedInAs ? (
        <button type="button" onClick={signOut} className="btn-ghost w-full">
          Sign out of {signedInAs}
        </button>
      ) : null}
      <p className="text-xs text-ink-muted">Use the same Buysellox account as on the website. Only accounts with the admin role can enter.</p>
    </form>
  );
}
