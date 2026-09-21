import Link from "next/link";
import { Bell, CreditCard, Flag, MessageSquare, ShieldCheck, Tags, UserPlus, Users } from "lucide-react";
import { CategoryBarChart, DailyAreaChart } from "@/components/charts/Charts";
import { Badge, Card, EmptyState, PageHeader, StatCard, UserLink } from "@/components/ui";
import { getCategory } from "@/lib/categories";
import { ago, listingStatusTone, money, truncate } from "@/lib/format";
import { getOverview } from "@/lib/queries/stats";
import { formatListingPrice } from "@/lib/utils";

export default async function OverviewPage() {
  const o = await getOverview();
  const k = o.kpis;
  const categoryData = Object.entries(o.byCategory)
    .map(([slug, value]) => ({ name: getCategory(slug)?.name ?? slug, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <PageHeader title="Overview" description="What's happening across the website and the app right now." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Users" value={k.users.toLocaleString()} hint={`+${k.usersNew7} in the last 7 days`} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active ads" value={k.listingsActive.toLocaleString()} hint={`+${k.listingsNew7} posted this week`} icon={<Tags className="h-5 w-5" />} tone="success" />
        <StatCard label="Revenue (30d)" value={money(k.revenue30)} hint={`${k.paidCount30} paid promotions`} icon={<CreditCard className="h-5 w-5" />} tone="purple" />
        <StatCard label="Open reports" value={k.openReports} hint={k.listingsPending ? `${k.listingsPending} ads pending review` : "No ads pending"} icon={<Flag className="h-5 w-5" />} tone={k.openReports ? "danger" : "neutral"} />
        <StatCard label="Subscriptions" value={k.activeSubs} hint="active dealer/agent plans" icon={<ShieldCheck className="h-5 w-5" />} tone="orange" />
        <StatCard label="Messages (24h)" value={k.messages24h.toLocaleString()} hint="chat messages sent" icon={<MessageSquare className="h-5 w-5" />} />
        <StatCard label="App devices" value={k.devices.toLocaleString()} hint="registered for push" icon={<Bell className="h-5 w-5" />} tone="warning" />
        <StatCard label="New users (7d)" value={k.usersNew7} hint="signups this week" icon={<UserPlus className="h-5 w-5" />} tone="success" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Signups — last 30 days">
          <DailyAreaChart data={o.series.signups} label="Signups" />
        </Card>
        <Card title="Ads posted — last 30 days">
          <DailyAreaChart data={o.series.listings} label="Ads" color="#16a34a" />
        </Card>
        <Card title="Revenue — last 30 days">
          <DailyAreaChart data={o.series.revenue} label="Revenue" color="#9333ea" money />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Latest ads" actions={<Link href="/listings" className="text-xs font-semibold text-primary-text hover:underline">View all</Link>} className="xl:col-span-2">
          {o.recentListings.length === 0 ? (
            <EmptyState title="No ads yet" />
          ) : (
            <ul className="divide-y divide-line">
              {o.recentListings.map((l) => (
                <li key={l.id} className="flex items-center gap-3 py-2">
                  {l.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.images[0]} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-11 w-11 shrink-0 rounded-lg bg-background" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/listings/${l.id}`} className="block truncate text-sm font-semibold text-ink hover:underline">
                      {l.title}
                    </Link>
                    <div className="truncate text-xs text-ink-muted">
                      {formatListingPrice(l.price, l.category_slug)} · {l.city} · {l.owner?.full_name ?? "Unknown"} · {ago(l.created_at)}
                    </div>
                  </div>
                  <Badge tone={listingStatusTone[l.status]}>{l.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Open reports" actions={<Link href="/reports" className="text-xs font-semibold text-primary-text hover:underline">Review</Link>}>
            {o.recentReports.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing to review. 🎉</p>
            ) : (
              <ul className="divide-y divide-line">
                {o.recentReports.map((r) => (
                  <li key={r.id} className="py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge tone="danger">{r.reason}</Badge>
                      <Link href={`/listings/${r.listing_id}`} className="truncate font-medium text-ink hover:underline">
                        {r.listing?.title ?? "Deleted ad"}
                      </Link>
                    </div>
                    <div className="mt-0.5 text-xs text-ink-muted">
                      {truncate(r.details, 70) || "No details"} · {ago(r.created_at)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Active ads by category">{categoryData.length ? <CategoryBarChart data={categoryData} /> : <p className="text-sm text-ink-muted">No active ads.</p>}</Card>
        </div>
      </div>

      <Card title="New users" className="mt-4" actions={<Link href="/users" className="text-xs font-semibold text-primary-text hover:underline">View all</Link>}>
        {o.recentUsers.length === 0 ? (
          <p className="text-sm text-ink-muted">No users yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {o.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                <UserLink user={u} />
                <span className="shrink-0 text-xs text-ink-muted">{ago(u.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
