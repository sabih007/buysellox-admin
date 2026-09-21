import type { Metadata } from "next";
import { ShieldOff } from "lucide-react";
import { Badge, Card, KV, PageHeader, UserLink } from "@/components/ui";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { addAdminByEmail, setUserRole } from "@/lib/actions/users";
import { requireAdminPage } from "@/lib/auth";
import { SITE_URL } from "@/lib/env";
import { fmtDate } from "@/lib/format";
import { getSavedSearchStats, listAdmins } from "@/lib/queries/misc";
import { FREE_TIER_ACTIVE_LIMIT } from "@/lib/settings";
import { TIER_INFO, type SubscriptionTier } from "@/lib/subscriptions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdminPage();
  const [admins, savedSearches] = await Promise.all([listAdmins(), getSavedSearchStats()]);

  return (
    <div>
      <PageHeader title="Settings" description="Who can access this console, and the platform's fixed configuration." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Administrators">
          <ul className="mb-3 divide-y divide-line">
            {admins.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                <UserLink user={a} />
                <span className="flex items-center gap-2">
                  {a.id === me.id ? <Badge tone="primary">you</Badge> : null}
                  {a.id !== me.id ? (
                    <ActionButton action={setUserRole.bind(null, a.id, "user")} confirm={`Remove admin access from ${a.email}?`}>
                      <ShieldOff className="h-3.5 w-3.5" /> Remove
                    </ActionButton>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
          <ActionForm action={addAdminByEmail} submitLabel="Add admin" resetOnSuccess>
            <label className="block flex-1">
              <span className="label">Add an admin by email (they must already have a Buysellox account)</span>
              <input name="email" type="email" className="input" placeholder="name@example.com" required />
            </label>
          </ActionForm>
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Environment">
            <KV
              items={[
                { label: "Public site", value: SITE_URL },
                { label: "Supabase project", value: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "") ?? "not set" },
                { label: "Service-role key", value: process.env.SUPABASE_SERVICE_ROLE_KEY ? "configured" : <span className="text-danger">missing</span> },
                { label: "Expo access token", value: process.env.EXPO_ACCESS_TOKEN ? "configured" : "not set (fine unless push security is on)" },
                { label: "Saved-search alerts", value: `${savedSearches.toLocaleString()} active` },
                { label: "Signed in as", value: me.email ?? me.id },
                { label: "Admin since", value: fmtDate(me.profile.created_at, false) },
              ]}
            />
          </Card>

          <Card title="Platform limits (fixed in code)">
            <p className="mb-2 text-xs text-ink-muted">
              These mirror <code>lib/listings.ts</code> and <code>lib/subscriptions.ts</code> in the web repo. Change them there and redeploy the site + app; promotion package prices are editable under Packages.
            </p>
            <KV
              items={[
                { label: "Free tier active ads", value: FREE_TIER_ACTIVE_LIMIT },
                ...(Object.keys(TIER_INFO) as SubscriptionTier[]).map((t) => ({
                  label: TIER_INFO[t].name,
                  value: `Rs ${TIER_INFO[t].price.toLocaleString()} · ${TIER_INFO[t].activeSlotLimit} slots · ${TIER_INFO[t].featuredCredits}F/${TIER_INFO[t].hotCredits}H/${TIER_INFO[t].refreshCredits}R credits`,
                })),
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
