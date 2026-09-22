import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge, EmptyState, Field, FilterBar, PageHeader, Pagination, UserLink } from "@/components/ui";
import { ActionButton } from "@/components/ui/ActionButton";
import { dismissAllForListing, setReportStatus, takeDownReported } from "@/lib/actions/misc";
import { listingSiteUrl } from "@/lib/env";
import { ago, listingStatusTone, reportStatusTone } from "@/lib/format";
import { listReports } from "@/lib/queries/misc";

export const metadata: Metadata = { title: "Reports" };

const REASONS = ["spam", "scam", "prohibited", "harassment", "other"];
const TARGETS = [
  { value: "listing", label: "Ad" },
  { value: "user", label: "User" },
  { value: "message", label: "Chat message" },
];
const TARGET_LABEL: Record<string, string> = { listing: "ad", user: "user", message: "message" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; reason?: string; target?: string; page?: string }>;
}) {
  const f = await searchParams;
  const status = f.status || "open";
  const { rows, total, page, pageSize } = await listReports({ ...f, status });

  return (
    <div>
      <PageHeader title="Reports" description={`${total} ${status} report${total === 1 ? "" : "s"}. Ads, sellers and chat messages users flagged from the site or the app — act on the ad or the account.`} />

      <FilterBar action="/reports">
        <Field label="Status">
          <select name="status" defaultValue={status} className="input">
            <option value="open">Open</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </Field>
        <Field label="About">
          <select name="target" defaultValue={f.target ?? ""} className="input">
            <option value="">Anything</option>
            {TARGETS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reason">
          <select name="reason" defaultValue={f.reason ?? ""} className="input">
            <option value="">Any</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title={status === "open" ? "Queue is clear" : "No reports"} description={status === "open" ? "Nothing has been flagged." : undefined} />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.id} className="card flex flex-col gap-3 p-4 md:flex-row">
              {r.listing?.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.listing.images[0]} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="h-24 w-24 shrink-0 rounded-lg bg-background" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{TARGET_LABEL[r.target_type] ?? r.target_type}</Badge>
                  <Badge tone="danger">{r.reason}</Badge>
                  <Badge tone={reportStatusTone[r.status]}>{r.status}</Badge>
                  {r.listing ? (
                    <Badge tone={listingStatusTone[r.listing.status]}>ad {r.listing.status}</Badge>
                  ) : r.listing_id ? (
                    <Badge>ad deleted</Badge>
                  ) : null}
                  <span className="text-xs text-ink-muted">{ago(r.created_at)}</span>
                </div>

                {r.target_type === "message" ? (
                  <blockquote className="mt-1 border-l-2 border-line pl-3 text-base italic text-ink">
                    {r.excerpt || <span className="text-ink-muted not-italic">(message text not captured)</span>}
                  </blockquote>
                ) : r.target_type === "user" ? (
                  <div className="mt-1 flex items-center gap-2 text-base font-bold text-ink">
                    Reported user: <UserLink user={r.reported} size={22} />
                  </div>
                ) : r.listing ? (
                  <Link href={`/listings/${r.listing.id}`} className="mt-1 block text-base font-bold text-ink hover:underline">
                    {r.listing.title}
                  </Link>
                ) : (
                  <div className="mt-1 text-base font-bold text-ink-muted">{r.excerpt ? `${r.excerpt} (listing deleted)` : "Listing no longer exists"}</div>
                )}
                <p className="mt-1 text-sm text-ink-soft">{r.details || <span className="text-ink-muted">No details given.</span>}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                  <span className="flex items-center gap-1">
                    Reported by <UserLink user={r.reporter} size={18} />
                  </span>
                  {r.target_type !== "user" ? (
                    <span className="flex items-center gap-1">
                      Against <UserLink user={r.reported} size={18} />
                    </span>
                  ) : null}
                  {r.listing ? (
                    <Link href={`/listings/${r.listing.id}`} className="hover:underline">
                      {r.target_type === "message" ? "Ad discussed →" : "Ad →"}
                    </Link>
                  ) : null}
                  {r.listing ? (
                    <a href={listingSiteUrl(r.listing)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                      <ExternalLink className="h-3 w-3" /> View on site
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-row flex-wrap gap-1.5 md:w-44 md:flex-col">
                {r.status === "open" && r.target_type === "listing" && r.listing ? (
                  <>
                    <ActionButton action={takeDownReported.bind(null, r.listing.id)} confirm="Take this ad down and close all its open reports?" className="btn-danger">
                      Take ad down
                    </ActionButton>
                    <ActionButton action={dismissAllForListing.bind(null, r.listing.id)}>Ad is fine — dismiss</ActionButton>
                  </>
                ) : null}
                {r.status === "open" && r.target_type !== "listing" ? (
                  <ActionButton action={setReportStatus.bind(null, r.id, "dismissed")}>Dismiss</ActionButton>
                ) : null}
                {r.status === "open" ? <ActionButton action={setReportStatus.bind(null, r.id, "reviewed")}>Mark reviewed</ActionButton> : null}
                {r.status !== "open" ? <ActionButton action={setReportStatus.bind(null, r.id, "open")}>Reopen</ActionButton> : null}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} params={{ ...f, status }} />
    </div>
  );
}
