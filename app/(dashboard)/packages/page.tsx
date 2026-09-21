import type { Metadata } from "next";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { ActionForm } from "@/components/ui/ActionForm";
import { updatePackage } from "@/lib/actions/misc";
import { badgeTone } from "@/lib/format";
import { BADGE_LABEL } from "@/lib/packages";
import { listPackages } from "@/lib/queries/misc";

export const metadata: Metadata = { title: "Packages" };

export default async function PackagesPage() {
  const packages = await listPackages();

  return (
    <div>
      <PageHeader
        title="Promotion packages"
        description="Prices and durations shown on the site's Promote page and in the app. Changes apply to new purchases immediately; existing promotions keep their original expiry."
      />

      {packages.length === 0 ? (
        <EmptyState title="No packages" description="The packages table is empty — seed it from the web repo migrations." />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {packages.map((p) => (
            <Card
              key={p.id}
              title={`${p.name} (${p.key})`}
              actions={
                <span className="flex items-center gap-1.5">
                  {p.badge ? <Badge tone={badgeTone[p.badge]}>{BADGE_LABEL[p.badge]}</Badge> : <Badge>bump</Badge>}
                  <Badge tone={p.is_active ? "success" : "neutral"}>{p.is_active ? "on sale" : "hidden"}</Badge>
                </span>
              }
            >
              <ActionForm action={updatePackage.bind(null, p.id)} submitLabel="Save" className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <label className="block col-span-2 md:col-span-4">
                  <span className="label">Display name</span>
                  <input name="name" defaultValue={p.name} className="input" required />
                </label>
                <label className="block">
                  <span className="label">Price (Rs)</span>
                  <input name="price" type="number" min={0} defaultValue={p.price} className="input" required />
                </label>
                <label className="block">
                  <span className="label">Duration (days)</span>
                  <input name="duration_days" type="number" min={1} defaultValue={p.duration_days} className="input" required />
                </label>
                <label className="block">
                  <span className="label">Credits (bundles)</span>
                  <input name="credits" type="number" min={1} defaultValue={p.credits} className="input" required />
                </label>
                <label className="flex h-10 items-end gap-2 pb-2 text-sm">
                  <input type="checkbox" name="is_active" defaultChecked={p.is_active} /> On sale
                </label>
              </ActionForm>
              <p className="mt-2 text-xs text-ink-muted">
                Rank {p.promotion_rank} · id {p.id}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
