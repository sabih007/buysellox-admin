"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

interface ActionButtonProps {
  /** Server action to run (bind its arguments on the server side). */
  action: () => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  /** If set, asks for confirmation first. */
  confirm?: string;
  title?: string;
}

/**
 * Runs a server action with pending state and optional confirm(), then
 * refreshes the route so server-rendered tables pick up the change.
 */
export function ActionButton({ action, children, className, confirm: confirmText, title }: ActionButtonProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<ActionResult | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        title={title}
        disabled={pending}
        className={cn("btn-secondary btn-sm", className)}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          start(async () => {
            let r: ActionResult;
            try {
              r = await action();
            } catch (e) {
              r = { ok: false, error: e instanceof Error ? e.message : "Failed" };
            }
            setStatus(r);
            if (r.ok) router.refresh();
            setTimeout(() => setStatus(null), 4000);
          });
        }}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {children}
      </button>
      {status && !status.ok ? <span className="text-xs text-danger">{status.error}</span> : null}
      {status && status.ok && status.message ? <span className="text-xs text-success">{status.message}</span> : null}
    </span>
  );
}
