import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ListingActions, ListingEditForm, ListingPhotos } from "@/app/(dashboard)/listings/[id]/ListingActions";
import { Badge, Card, KV, PageHeader, UserLink } from "@/components/ui";
import { ActionButton } from "@/components/ui/ActionButton";
import { setReportStatus } from "@/lib/actions/misc";
import { listingSiteUrl } from "@/lib/env";
import { ago, badgeTone, fmtDate, listingStatusTone, money, paymentStatusTone, reportStatusTone } from "@/lib/format";
import { BADGE_LABEL } from "@/lib/packages";
import { getListingDetail } from "@/lib/queries/listings";
import { formatListingPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Listing" };

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getListingDetail(id);
  if (!d) notFound();
  const { listing: l, reports, promotions } = d;
  const attrs = Object.entries(l.attributes ?? {}).filter(([k, v]) => v !== null && v !== "" && !k.endsWith("_unit"));

  return (
    <div>
      <PageHeader
        title={l.title}
        description={`${l.category}${l.subcategory ? ` › ${l.subcategory}` : ""} · ${l.area ? `${l.area}, ` : ""}${l.city} · posted ${ago(l.created_at)}`}
        actions={
          <>
            <Badge tone={listingStatusTone[l.status]} className="text-xs">
              {l.status}
            </Badge>
            {l.badge ? <Badge tone={badgeTone[l.badge]} className="text-xs">{BADGE_LABEL[l.badge]}</Badge> : null}
            <a href={listingSiteUrl(l)} target="_blank" rel="noreferrer" className="btn-secondary">
              <ExternalLink className="h-4 w-4" /> Open on site
            </a>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <Card title="Moderation">
            <ListingActions listing={{ id: l.id, status: l.status, badge: l.badge, promoted_until: l.promoted_until, expires_at: l.expires_at }} />
          </Card>

          <Card title={`Photos (${l.images.length})`}>
            <ListingPhotos id={l.id} images={l.images} />
          </Card>

          <Card title="Edit ad">
            <ListingEditForm listing={{ id: l.id, title: l.title, description: l.description, price: l.price, area: l.area }} />
          </Card>

          <Card title="Details">
            <KV
              items={[
                { label: "Price", value: `${formatListingPrice(l.price, l.category_slug)} (${money(l.price)})` },
                { label: "Condition", value: l.condition ?? "—" },
                ...attrs.map(([k, v]) => ({ label: k.replace(/_/g, " "), value: String(v) })),
                { label: "Views", value: l.views_count },
                { label: "Favourites", value: d.favoritesCount },
                { label: "Chats started", value: d.conversationsCount },
                { label: "Created", value: fmtDate(l.created_at) },
                { label: "Expires", value: fmtDate(l.expires_at) },
                { label: "Bumped", value: fmtDate(l.bumped_at) },
                { label: "Promoted until", value: fmtDate(l.promoted_until) },
                { label: "Promotion rank", value: l.promotion_rank },
                { label: "Coordinates", value: l.lat && l.lng ? `${l.lat.toFixed(4)}, ${l.lng.toFixed(4)}` : "—" },
                { label: "Slug", value: l.slug },
                { label: "ID", value: l.id },
              ]}
            />
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Seller">
            <UserLink user={l.owner} size={40} />
            {l.owner ? (
              <KV
                items={[
                  { label: "Phone", value: l.owner.phone ?? "—" },
                  { label: "City", value: l.owner.city ?? "—" },
                  { label: "Verified", value: l.owner.is_verified ? "Yes" : "No" },
                  { label: "Member since", value: fmtDate(l.owner.created_at, false) },
                ]}
              />
            ) : null}
          </Card>

          <Card title={`Reports (${reports.length})`}>
            {reports.length === 0 ? (
              <p className="text-sm text-ink-muted">No reports on this ad.</p>
            ) : (
              <ul className="divide-y divide-line">
                {reports.map((r) => (
                  <li key={r.id} className="py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <Badge tone="danger">{r.reason}</Badge>
                        <Badge tone={reportStatusTone[r.status]}>{r.status}</Badge>
                      </span>
                      <span className="text-xs text-ink-muted">{ago(r.created_at)}</span>
                    </div>
                    {r.details ? <p className="mt-1 text-ink-soft">{r.details}</p> : null}
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-ink-muted">
                      <span>by {r.reporter ? <Link href={`/users/${r.reporter.id}`} className="hover:underline">{r.reporter.full_name ?? r.reporter.email}</Link> : "unknown"}</span>
                      {r.status === "open" ? (
                        <span className="flex gap-1">
                          <ActionButton action={setReportStatus.bind(null, r.id, "reviewed")}>Reviewed</ActionButton>
                          <ActionButton action={setReportStatus.bind(null, r.id, "dismissed")}>Dismiss</ActionButton>
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`Promotions (${promotions.length})`}>
            {promotions.length === 0 ? (
              <p className="text-sm text-ink-muted">Never promoted.</p>
            ) : (
              <ul className="divide-y divide-line">
                {promotions.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <div>
                      <div className="font-medium">
                        {p.package?.name ?? p.package_id} · {money(p.amount)}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {p.payment_method} · {fmtDate(p.created_at)}
                      </div>
                    </div>
                    <Badge tone={paymentStatusTone[p.payment_status]}>{p.payment_status}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/payments?q=${l.id}`} className="mt-2 inline-block text-xs font-semibold text-primary-text hover:underline">
              Open in payments
            </Link>
          </Card>

          <Card title="Description">
            <p className="whitespace-pre-wrap text-sm text-ink-soft">{l.description || "—"}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
