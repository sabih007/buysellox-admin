"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Eye, Loader2, Trash2 } from "lucide-react";
import { Badge, Table } from "@/components/ui";
import { ActionButton } from "@/components/ui/ActionButton";
import { bulkListingStatus, deleteListing, setListingStatus } from "@/lib/actions/listings";
import { listingSiteUrl } from "@/lib/env";
import { ago, badgeTone, listingStatusTone } from "@/lib/format";
import type { ListingRow } from "@/lib/queries/listings";
import { formatListingPrice } from "@/lib/utils";
import { BADGE_LABEL } from "@/lib/packages";

export function ListingsTable({ rows }: { rows: ListingRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const bulk = (status: "active" | "expired" | "delete") => {
    const ids = [...selected];
    if (status === "delete" && !window.confirm(`Delete ${ids.length} ads permanently?`)) return;
    start(async () => {
      const r = await bulkListingStatus(ids, status);
      setMsg(r.ok ? r.message ?? "Done" : r.error);
      if (r.ok) {
        setSelected(new Set());
        router.refresh();
      }
      setTimeout(() => setMsg(null), 4000);
    });
  };

  return (
    <div>
      {selected.size > 0 ? (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-primary-light px-3 py-2 text-sm text-primary-text">
          <span className="font-semibold">{selected.size} selected</span>
          <button className="btn-secondary btn-sm" disabled={pending} onClick={() => bulk("active")}>
            Approve / activate
          </button>
          <button className="btn-secondary btn-sm" disabled={pending} onClick={() => bulk("expired")}>
            Take down
          </button>
          <button className="btn-danger btn-sm" disabled={pending} onClick={() => bulk("delete")}>
            Delete
          </button>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {msg ? <span className="text-xs">{msg}</span> : null}
        </div>
      ) : null}

      <Table>
        <thead className="border-b border-line bg-background">
          <tr>
            <th className="th w-8">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
            </th>
            <th className="th">Ad</th>
            <th className="th">Seller</th>
            <th className="th">Price</th>
            <th className="th">Status</th>
            <th className="th">Posted</th>
            <th className="th text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="border-b border-line last:border-0 hover:bg-background/60">
              <td className="td">
                <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} aria-label="Select" />
              </td>
              <td className="td">
                <div className="flex items-center gap-3">
                  {l.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.images[0]} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-background" />
                  )}
                  <div className="min-w-0">
                    <Link href={`/listings/${l.id}`} className="line-clamp-1 font-semibold text-ink hover:underline">
                      {l.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                      <span>{l.category}</span>
                      <span>·</span>
                      <span>{l.city}</span>
                      {l.badge ? <Badge tone={badgeTone[l.badge]}>{BADGE_LABEL[l.badge]}</Badge> : null}
                      <span className="inline-flex items-center gap-0.5">
                        <Eye className="h-3 w-3" /> {l.views_count}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="td">
                {l.owner ? (
                  <Link href={`/users/${l.owner.id}`} className="hover:underline">
                    <div className="max-w-[160px] truncate font-medium">{l.owner.full_name ?? "Unnamed"}</div>
                    <div className="max-w-[160px] truncate text-xs text-ink-muted">{l.owner.email}</div>
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="td whitespace-nowrap font-semibold">{formatListingPrice(l.price, l.category_slug)}</td>
              <td className="td">
                <Badge tone={listingStatusTone[l.status]}>{l.status}</Badge>
              </td>
              <td className="td whitespace-nowrap text-xs text-ink-muted">{ago(l.created_at)}</td>
              <td className="td">
                <div className="flex justify-end gap-1">
                  {l.status !== "active" ? (
                    <ActionButton action={setListingStatus.bind(null, l.id, "active")} title="Approve / activate" className="text-success">
                      <Check className="h-3.5 w-3.5" />
                    </ActionButton>
                  ) : (
                    <ActionButton action={setListingStatus.bind(null, l.id, "expired")} title="Take down">
                      Take down
                    </ActionButton>
                  )}
                  <a href={listingSiteUrl(l)} target="_blank" rel="noreferrer" className="btn-secondary btn-sm" title="Open on site">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <ActionButton action={deleteListing.bind(null, l.id)} confirm="Delete this ad permanently?" className="btn-danger" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
