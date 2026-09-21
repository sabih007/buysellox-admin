"use client";

import { useState } from "react";
import { Badge, UserLink } from "@/components/ui";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { setSubscriptionStatus, updateSubscriptionFields } from "@/lib/actions/misc";
import { fmtDate, subStatusTone } from "@/lib/format";
import type { SubscriptionRow as Row } from "@/lib/queries/misc";
import { TIER_INFO, isSubscriptionTier } from "@/lib/subscriptions";

export function SubscriptionRow({ sub: s }: { sub: Row }) {
  const [editing, setEditing] = useState(false);
  const tierName = isSubscriptionTier(s.tier) ? TIER_INFO[s.tier].name : s.tier;
  const dateValue = s.current_period_end ? new Date(s.current_period_end).toISOString().slice(0, 10) : "";

  return (
    <tr className="border-b border-line last:border-0 hover:bg-background/60">
      <td className="td">
        <UserLink user={s.user} />
      </td>
      <td className="td font-medium">{tierName}</td>
      <td className="td">
        <Badge tone={subStatusTone[s.status]}>{s.status}</Badge>
      </td>
      <td className="td">{s.active_slot_limit}</td>
      <td className="td whitespace-nowrap text-xs">{fmtDate(s.current_period_end, false)}</td>
      <td className="td text-xs text-ink-muted">{s.ls_subscription_id ? `LS ${s.ls_subscription_id}` : "manual"}</td>
      <td className="td">
        {editing ? (
          <ActionForm action={updateSubscriptionFields.bind(null, s.id)} submitLabel="Save" submitClassName="btn-sm" className="justify-end gap-1">
            <input name="active_slot_limit" type="number" min={0} defaultValue={s.active_slot_limit} className="input h-8 w-20 text-xs" title="Slots" />
            <input name="current_period_end" type="date" defaultValue={dateValue} className="input h-8 w-36 text-xs" />
            <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </ActionForm>
        ) : (
          <div className="flex justify-end gap-1">
            <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(true)}>
              Edit
            </button>
            {s.status !== "active" ? (
              <ActionButton action={setSubscriptionStatus.bind(null, s.id, "active")}>Activate</ActionButton>
            ) : (
              <ActionButton action={setSubscriptionStatus.bind(null, s.id, "cancelled")} confirm="Cancel this plan? The user drops back to the free tier limits.">
                Cancel
              </ActionButton>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
