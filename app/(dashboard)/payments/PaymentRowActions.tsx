"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { confirmPayment, failPayment, refundPayment } from "@/lib/actions/misc";
import type { PaymentStatus } from "@/types/database";

export function PaymentRowActions({ id, status }: { id: string; status: PaymentStatus }) {
  const [confirming, setConfirming] = useState(false);

  if (status === "pending") {
    return confirming ? (
      <ActionForm action={confirmPayment.bind(null, id)} submitLabel="Confirm paid" submitClassName="btn-sm" className="justify-end gap-1">
        <input name="ref" className="input h-8 w-36 text-xs" placeholder="Txn ref (optional)" autoFocus />
        <button type="button" className="btn-ghost btn-sm" onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </ActionForm>
    ) : (
      <div className="flex justify-end gap-1">
        <button type="button" className="btn-primary btn-sm" onClick={() => setConfirming(true)}>
          Mark paid
        </button>
        <ActionButton action={failPayment.bind(null, id)} confirm="Mark this payment as failed?">
          Failed
        </ActionButton>
      </div>
    );
  }
  if (status === "paid") {
    return (
      <div className="flex justify-end">
        <ActionButton action={refundPayment.bind(null, id)} confirm="Mark refunded and remove the promotion from the ad? (Refund the money yourself in the payment provider.)">
          Refund
        </ActionButton>
      </div>
    );
  }
  return null;
}
