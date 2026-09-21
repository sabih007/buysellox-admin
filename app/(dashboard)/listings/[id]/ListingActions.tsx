"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUp, Check, Trash2, X } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { bumpListing, deleteListing, extendListing, removeListingImage, setListingBadge, setListingStatus, updateListingFields } from "@/lib/actions/listings";
import { fmtDate } from "@/lib/format";
import { BADGE_LABEL, type Badge } from "@/lib/packages";
import type { ListingStatus } from "@/types/database";

interface Props {
  listing: { id: string; status: ListingStatus; badge: Badge; promoted_until: string | null; expires_at: string };
}

export function ListingActions({ listing: l }: Props) {
  const router = useRouter();
  const [badge, setBadge] = useState<string>(l.badge ?? "featured");
  const [days, setDays] = useState(7);
  const [extend, setExtend] = useState(30);

  return (
    <div className="space-y-4">
      <div>
        <div className="label">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {l.status !== "active" ? (
            <ActionButton action={setListingStatus.bind(null, l.id, "active")} className="btn-primary">
              <Check className="h-3.5 w-3.5" /> Approve / activate
            </ActionButton>
          ) : null}
          {l.status !== "expired" ? <ActionButton action={setListingStatus.bind(null, l.id, "expired")}>Take down (expire)</ActionButton> : null}
          {l.status !== "pending" ? <ActionButton action={setListingStatus.bind(null, l.id, "pending")}>Send to pending</ActionButton> : null}
          {l.status !== "sold" ? <ActionButton action={setListingStatus.bind(null, l.id, "sold")}>Mark sold</ActionButton> : null}
          <ActionButton action={bumpListing.bind(null, l.id)}>
            <ArrowUp className="h-3.5 w-3.5" /> Bump to top
          </ActionButton>
          <ActionButton
            action={async () => {
              const r = await deleteListing(l.id);
              if (r.ok) router.replace("/listings");
              return r;
            }}
            confirm="Delete this ad permanently? This also removes its chats, favourites and reports."
            className="btn-danger"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </ActionButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="label">Promotion (free of charge — for comps/support)</div>
          <div className="flex flex-wrap items-center gap-1.5">
            <select className="input w-auto" value={badge} onChange={(e) => setBadge(e.target.value)}>
              {(Object.keys(BADGE_LABEL) as Exclude<Badge, null>[]).map((b) => (
                <option key={b} value={b}>
                  {BADGE_LABEL[b]}
                </option>
              ))}
            </select>
            <input type="number" min={1} max={365} className="input w-20" value={days} onChange={(e) => setDays(Number(e.target.value))} />
            <span className="text-xs text-ink-muted">days</span>
            <ActionButton action={() => setListingBadge(l.id, badge as Exclude<Badge, null>, days)} className="btn-primary">
              Apply
            </ActionButton>
            {l.badge ? (
              <ActionButton action={setListingBadge.bind(null, l.id, null, 0)}>
                <X className="h-3.5 w-3.5" /> Clear
              </ActionButton>
            ) : null}
          </div>
          {l.badge ? <p className="mt-1 text-xs text-ink-muted">Currently {BADGE_LABEL[l.badge]} until {fmtDate(l.promoted_until)}.</p> : null}
        </div>

        <div>
          <div className="label">Expiry</div>
          <div className="flex flex-wrap items-center gap-1.5">
            <input type="number" min={1} max={365} className="input w-20" value={extend} onChange={(e) => setExtend(Number(e.target.value))} />
            <span className="text-xs text-ink-muted">days</span>
            <ActionButton action={() => extendListing(l.id, extend)}>Extend & keep active</ActionButton>
          </div>
          <p className="mt-1 text-xs text-ink-muted">Expires {fmtDate(l.expires_at)}.</p>
        </div>
      </div>
    </div>
  );
}

export function ListingEditForm({ listing: l }: { listing: { id: string; title: string; description: string; price: number; area: string | null } }) {
  return (
    <ActionForm action={updateListingFields.bind(null, l.id)} submitLabel="Save changes" className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="block md:col-span-2">
        <span className="label">Title</span>
        <input name="title" defaultValue={l.title} className="input" maxLength={80} required />
      </label>
      <label className="block">
        <span className="label">Price (Rs)</span>
        <input name="price" type="number" min={0} defaultValue={l.price} className="input" required />
      </label>
      <label className="block">
        <span className="label">Area / neighbourhood</span>
        <input name="area" defaultValue={l.area ?? ""} className="input" maxLength={120} />
      </label>
      <label className="block md:col-span-2">
        <span className="label">Description</span>
        <textarea name="description" defaultValue={l.description} className="input h-32 py-2" maxLength={4000} />
      </label>
    </ActionForm>
  );
}

export function ListingPhotos({ id, images }: { id: string; images: string[] }) {
  if (images.length === 0) return <p className="text-sm text-ink-muted">No photos.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((u, i) => (
        <div key={u} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={u} alt="" className="h-28 w-28 rounded-lg object-cover" />
          {i === 0 ? <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-bold text-white">Cover</span> : null}
          <span className="absolute bottom-1 right-1">
            <ActionButton action={removeListingImage.bind(null, id, u)} confirm="Remove this photo from the ad?" className="btn-danger h-6 px-1.5" title="Remove photo">
              <X className="h-3 w-3" />
            </ActionButton>
          </span>
        </div>
      ))}
    </div>
  );
}
