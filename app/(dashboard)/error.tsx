"use client";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg pt-16">
      <div className="card p-6">
        <h1 className="text-lg font-bold text-ink">Something went wrong</h1>
        <p className="mt-2 break-words text-sm text-danger">{error.message}</p>
        <p className="mt-2 text-xs text-ink-muted">If this mentions a missing table or function, the matching web migration hasn&apos;t been applied to Supabase yet. If it mentions the service-role key, check .env.local.</p>
        <button type="button" className="btn-primary mt-4" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
