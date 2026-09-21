"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ActionResult } from "@/components/ui/ActionButton";
import { cn } from "@/lib/utils";

interface ActionFormProps {
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  submitClassName?: string;
  confirm?: string;
  /** Clear fields after a successful submit. */
  resetOnSuccess?: boolean;
}

/** `<form>` around a server action, with pending/inline result and a route refresh on success. */
export function ActionForm({ action, children, submitLabel = "Save", className, submitClassName, confirm: confirmText, resetOnSuccess }: ActionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult | null, fd: FormData) => {
    let r: ActionResult;
    try {
      r = await action(fd);
    } catch (e) {
      r = { ok: false, error: e instanceof Error ? e.message : "Failed" };
    }
    if (r.ok) router.refresh();
    return r;
  }, null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={cn("flex flex-wrap items-end gap-2", className)}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
      <button type="submit" disabled={pending} className={cn("btn-primary", submitClassName)}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </button>
      {state && !state.ok ? <span className="basis-full text-xs text-danger">{state.error}</span> : null}
      {state && state.ok && state.message ? <span className="basis-full text-xs text-success">{state.message}</span> : null}
    </form>
  );
}
