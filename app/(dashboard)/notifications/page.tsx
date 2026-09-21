import type { Metadata } from "next";
import { Smartphone } from "lucide-react";
import { PushCampaignForm } from "@/app/(dashboard)/notifications/PushCampaignForm";
import { Card, EmptyState, PageHeader, StatCard, Table } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { getPushStats, listCampaigns } from "@/lib/queries/misc";
import type { PushCampaign } from "@/types/database";

export const metadata: Metadata = { title: "Push notifications" };

function describeAudience(a: PushCampaign["audience"]) {
  switch (a.type) {
    case "all":
      return "Everyone";
    case "city":
      return `City: ${a.city}`;
    case "active_sellers":
      return "Users with active ads";
    case "user":
      return a.email;
  }
}

export default async function NotificationsPage() {
  const [campaigns, stats] = await Promise.all([listCampaigns().catch(() => [] as PushCampaign[]), getPushStats()]);

  return (
    <div>
      <PageHeader title="Push notifications" description="Send an announcement to people with the Buysellox app installed. Chat messages already notify automatically — this is for everything else." />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Registered devices" value={stats.devices.toLocaleString()} icon={<Smartphone className="h-5 w-5" />} />
        <StatCard label="Android" value={(stats.byPlatform.android ?? 0).toLocaleString()} tone="success" />
        <StatCard label="iOS" value={(stats.byPlatform.ios ?? 0).toLocaleString()} tone="neutral" />
      </div>

      <Card title="New campaign" className="mb-6">
        <PushCampaignForm />
      </Card>

      <h2 className="mb-2 text-sm font-bold text-ink">Recent campaigns</h2>
      {campaigns.length === 0 ? (
        <EmptyState title="Nothing sent yet" />
      ) : (
        <Table>
          <thead className="border-b border-line bg-background">
            <tr>
              <th className="th">Sent</th>
              <th className="th">Notification</th>
              <th className="th">Audience</th>
              <th className="th text-right">Users</th>
              <th className="th text-right">Delivered</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="td whitespace-nowrap text-xs text-ink-muted">{fmtDate(c.created_at)}</td>
                <td className="td">
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-ink-soft">{c.body}</div>
                  {c.path ? <div className="mt-0.5 text-xs text-ink-muted">Opens {c.path}</div> : null}
                </td>
                <td className="td text-ink-soft">{describeAudience(c.audience)}</td>
                <td className="td text-right">{c.recipients}</td>
                <td className="td text-right">
                  <span className="text-success">{c.sent}</span>
                  {c.failed > 0 ? <span className="text-danger"> / {c.failed} failed</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
