import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Ban } from "lucide-react";
import { UserActions } from "@/app/(dashboard)/users/[id]/UserActions";
import { Avatar, Badge, Card, KV, PageHeader, Table } from "@/components/ui";
import { ActionForm } from "@/components/ui/ActionForm";
import { setUserCredits, updateUserProfile } from "@/lib/actions/users";
import { cities } from "@/lib/cities";
import { ago, fmtDate, listingStatusTone, money, paymentStatusTone, subStatusTone } from "@/lib/format";
import { getUserDetail, isBanned } from "@/lib/queries/users";
import { TIER_INFO, isSubscriptionTier } from "@/lib/subscriptions";
import { formatListingPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "User" };

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getUserDetail(id);
  if (!d) notFound();
  const { profile: p, listings, subscription, promotions, auth } = d;
  const banned = isBanned(auth);
  const active = listings.filter((l) => l.status === "active").length;

  return (
    <div>
      <PageHeader
        title={p.full_name ?? "Unnamed user"}
        description={p.email ?? p.id}
        actions={
          <>
            {p.role === "admin" ? <Badge tone="purple" className="text-xs">admin</Badge> : null}
            {p.is_verified ? (
              <Badge tone="success" className="text-xs">
                <BadgeCheck className="mr-1 h-3 w-3" /> verified seller
              </Badge>
            ) : null}
            {banned ? (
              <Badge tone="danger" className="text-xs">
                <Ban className="mr-1 h-3 w-3" /> banned
              </Badge>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card title="Actions">
            <UserActions user={{ id: p.id, email: p.email, role: p.role, is_verified: p.is_verified, banned }} />
          </Card>

          <Card title={`Ads (${listings.length} total, ${active} active)`}>
            {listings.length === 0 ? (
              <p className="text-sm text-ink-muted">No ads posted.</p>
            ) : (
              <Table className="shadow-none">
                <thead className="border-b border-line bg-background">
                  <tr>
                    <th className="th">Ad</th>
                    <th className="th">Price</th>
                    <th className="th">Status</th>
                    <th className="th">Views</th>
                    <th className="th">Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => (
                    <tr key={l.id} className="border-b border-line last:border-0">
                      <td className="td">
                        <Link href={`/listings/${l.id}`} className="line-clamp-1 font-medium hover:underline">
                          {l.title}
                        </Link>
                        <div className="text-xs text-ink-muted">
                          {l.category} · {l.city}
                        </div>
                      </td>
                      <td className="td whitespace-nowrap">{formatListingPrice(l.price, l.category_slug)}</td>
                      <td className="td">
                        <Badge tone={listingStatusTone[l.status]}>{l.status}</Badge>
                      </td>
                      <td className="td">{l.views_count}</td>
                      <td className="td whitespace-nowrap text-xs text-ink-muted">{ago(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card title={`Payments (${promotions.length})`}>
            {promotions.length === 0 ? (
              <p className="text-sm text-ink-muted">No purchases.</p>
            ) : (
              <ul className="divide-y divide-line">
                {promotions.map((pr) => (
                  <li key={pr.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div>
                      <div className="font-medium">
                        {pr.package?.name ?? pr.package_id} · {money(pr.amount)}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {pr.payment_method} · {pr.payment_ref ?? "no ref"} · {fmtDate(pr.created_at)}
                      </div>
                    </div>
                    <Badge tone={paymentStatusTone[pr.payment_status]}>{pr.payment_status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Profile">
            <div className="mb-3 flex items-center gap-3">
              <Avatar src={p.avatar_url} name={p.full_name} size={56} />
              <div className="min-w-0 text-sm">
                <div className="truncate font-semibold">{p.full_name ?? "Unnamed"}</div>
                <div className="truncate text-ink-muted">{p.email}</div>
              </div>
            </div>
            <ActionForm action={updateUserProfile.bind(null, p.id)} submitLabel="Save profile" className="grid grid-cols-1 gap-2">
              <label className="block">
                <span className="label">Full name</span>
                <input name="full_name" defaultValue={p.full_name ?? ""} className="input" />
              </label>
              <label className="block">
                <span className="label">Phone</span>
                <input name="phone" defaultValue={p.phone ?? ""} className="input" />
              </label>
              <label className="block">
                <span className="label">City</span>
                <select name="city" defaultValue={p.city ?? ""} className="input">
                  <option value="">—</option>
                  {cities.map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </ActionForm>
            <div className="mt-3">
              <KV
                items={[
                  { label: "Joined", value: fmtDate(p.created_at) },
                  { label: "Email verified", value: p.email_verified ? "Yes" : "No" },
                  { label: "Last sign-in", value: auth?.last_sign_in_at ? ago(auth.last_sign_in_at) : "never" },
                  { label: "Sign-in via", value: auth?.providers.join(", ") || "—" },
                  { label: "App devices", value: d.devices.length ? d.devices.map((x) => x.platform).join(", ") : "none" },
                  { label: "Reports filed", value: d.reportsMade },
                  { label: "User ID", value: p.id },
                ]}
              />
            </div>
          </Card>

          <Card title="Credits">
            <ActionForm action={setUserCredits.bind(null, p.id)} submitLabel="Update credits" className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="label">Refresh</span>
                <input name="refresh_credits" type="number" min={0} defaultValue={p.refresh_credits} className="input" />
              </label>
              <label className="block">
                <span className="label">Featured</span>
                <input name="featured_credits" type="number" min={0} defaultValue={p.featured_credits} className="input" />
              </label>
              <label className="block">
                <span className="label">Hot</span>
                <input name="hot_credits" type="number" min={0} defaultValue={p.hot_credits} className="input" />
              </label>
            </ActionForm>
          </Card>

          <Card title="Subscription">
            {subscription ? (
              <KV
                items={[
                  { label: "Tier", value: isSubscriptionTier(subscription.tier) ? TIER_INFO[subscription.tier].name : subscription.tier },
                  { label: "Status", value: <Badge tone={subStatusTone[subscription.status]}>{subscription.status}</Badge> },
                  { label: "Active ad slots", value: subscription.active_slot_limit },
                  { label: "Renews / ends", value: fmtDate(subscription.current_period_end, false) },
                  { label: "Lemon Squeezy", value: subscription.ls_subscription_id ?? "manual" },
                ]}
              />
            ) : (
              <p className="text-sm text-ink-muted">Free tier (5 active ads).</p>
            )}
            <Link href={`/subscriptions?q=${p.id}`} className="mt-2 inline-block text-xs font-semibold text-primary-text hover:underline">
              Manage in subscriptions
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
