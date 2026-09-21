import type { Metadata } from "next";
import { SubscriptionRow } from "@/app/(dashboard)/subscriptions/SubscriptionRow";
import { Card, EmptyState, Field, FilterBar, PageHeader, Pagination, Table } from "@/components/ui";
import { ActionForm } from "@/components/ui/ActionForm";
import { upsertSubscription } from "@/lib/actions/misc";
import { listSubscriptions } from "@/lib/queries/misc";
import { TIER_INFO, type SubscriptionTier } from "@/lib/subscriptions";

export const metadata: Metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<{ status?: string; tier?: string; q?: string; page?: string }> }) {
  const f = await searchParams;
  const { rows, total, page, pageSize } = await listSubscriptions(f);
  const tiers = Object.keys(TIER_INFO) as SubscriptionTier[];

  return (
    <div>
      <PageHeader title="Subscriptions" description={`${total} dealer / shop / agency plans. Lemon Squeezy manages renewals; use the form to grant a plan by hand.`} />

      <Card title="Grant or replace a plan manually" className="mb-4">
        <ActionForm action={upsertSubscription} submitLabel="Activate plan" resetOnSuccess>
          <Field label="User email" className="flex-1">
            <input name="email" type="email" className="input" placeholder="user@example.com" required />
          </Field>
          <Field label="Tier">
            <select name="tier" className="input" defaultValue="shop">
              {tiers.map((t) => (
                <option key={t} value={t}>
                  {TIER_INFO[t].name} — {TIER_INFO[t].activeSlotLimit} slots
                </option>
              ))}
            </select>
          </Field>
          <Field label="Months" className="min-w-0 w-24">
            <input name="months" type="number" min={1} max={36} defaultValue={1} className="input" />
          </Field>
          <label className="flex h-10 items-center gap-2 text-sm">
            <input type="checkbox" name="grant" defaultChecked /> Grant the tier&apos;s credits
          </label>
        </ActionForm>
      </Card>

      <FilterBar action="/subscriptions">
        <Field label="Search" className="min-w-[200px] flex-1">
          <input name="q" defaultValue={f.q} className="input" placeholder="User id or Lemon Squeezy id" />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={f.status ?? ""} className="input">
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </Field>
        <Field label="Tier">
          <select name="tier" defaultValue={f.tier ?? ""} className="input">
            <option value="">Any</option>
            {tiers.map((t) => (
              <option key={t} value={t}>
                {TIER_INFO[t].name}
              </option>
            ))}
          </select>
        </Field>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title="No subscriptions" />
      ) : (
        <Table>
          <thead className="border-b border-line bg-background">
            <tr>
              <th className="th">User</th>
              <th className="th">Tier</th>
              <th className="th">Status</th>
              <th className="th">Slots</th>
              <th className="th">Period end</th>
              <th className="th">Source</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <SubscriptionRow key={s.id} sub={s} />
            ))}
          </tbody>
        </Table>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} params={f} />
    </div>
  );
}
