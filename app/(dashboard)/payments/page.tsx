import type { Metadata } from "next";
import Link from "next/link";
import { Clock, CreditCard, TrendingUp } from "lucide-react";
import { PaymentRowActions } from "@/app/(dashboard)/payments/PaymentRowActions";
import { Badge, EmptyState, Field, FilterBar, PageHeader, Pagination, StatCard, Table, UserLink } from "@/components/ui";
import { fmtDate, money, paymentStatusTone } from "@/lib/format";
import { getPaymentTotals, listPromotions } from "@/lib/queries/misc";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; method?: string; page?: string }> }) {
  const f = await searchParams;
  const [{ rows, total, page, pageSize }, totals] = await Promise.all([listPromotions(f), getPaymentTotals()]);

  return (
    <div>
      <PageHeader title="Payments & promotions" description="Every Featured/Hot/bump purchase and credit bundle. Confirm manual JazzCash/Easypaisa payments here." />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Revenue — all time" value={money(totals.allTime)} icon={<CreditCard className="h-5 w-5" />} tone="purple" />
        <StatCard label="Revenue — 30 days" value={money(totals.last30)} hint={`${totals.last30Count} paid`} icon={<TrendingUp className="h-5 w-5" />} tone="success" />
        <StatCard label="Awaiting payment" value={money(totals.pending)} hint={`${totals.pendingCount} pending`} icon={<Clock className="h-5 w-5" />} tone="warning" />
      </div>

      <FilterBar action="/payments">
        <Field label="Search" className="min-w-[220px] flex-1">
          <input name="q" defaultValue={f.q} className="input" placeholder="Payment ref, or a promotion / user / listing id" />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={f.status ?? ""} className="input">
            <option value="">Any</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </Field>
        <Field label="Method">
          <select name="method" defaultValue={f.method ?? ""} className="input">
            <option value="">Any</option>
            <option value="jazzcash">JazzCash</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="card">Card</option>
            <option value="lemonsqueezy">Lemon Squeezy</option>
          </select>
        </Field>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title="No payments match" />
      ) : (
        <Table>
          <thead className="border-b border-line bg-background">
            <tr>
              <th className="th">When</th>
              <th className="th">Buyer</th>
              <th className="th">Package</th>
              <th className="th">For</th>
              <th className="th">Amount</th>
              <th className="th">Method / ref</th>
              <th className="th">Status</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-background/60">
                <td className="td whitespace-nowrap text-xs text-ink-muted">{fmtDate(p.created_at)}</td>
                <td className="td">
                  <UserLink user={p.user} />
                </td>
                <td className="td font-medium">{p.package?.name ?? "—"}</td>
                <td className="td">
                  {p.listing ? (
                    <Link href={`/listings/${p.listing.id}`} className="line-clamp-1 hover:underline">
                      {p.listing.title}
                    </Link>
                  ) : (
                    <span className="text-ink-muted">Credit bundle</span>
                  )}
                </td>
                <td className="td whitespace-nowrap font-semibold">{money(p.amount)}</td>
                <td className="td text-xs">
                  <div>{p.payment_method}</div>
                  <div className="max-w-[160px] truncate text-ink-muted" title={p.payment_ref ?? ""}>
                    {p.payment_ref ?? "—"}
                  </div>
                </td>
                <td className="td">
                  <Badge tone={paymentStatusTone[p.payment_status]}>{p.payment_status}</Badge>
                </td>
                <td className="td">
                  <PaymentRowActions id={p.id} status={p.payment_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} params={f} />
    </div>
  );
}
