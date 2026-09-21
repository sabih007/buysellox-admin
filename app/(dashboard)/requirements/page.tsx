import type { Metadata } from "next";
import { Badge, EmptyState, Field, FilterBar, PageHeader, Pagination, UserLink } from "@/components/ui";
import { ActionButton } from "@/components/ui/ActionButton";
import { deleteRequirement, setRequirementStatus } from "@/lib/actions/misc";
import { getCategory } from "@/lib/categories";
import { cities } from "@/lib/cities";
import { ago, fmtDate } from "@/lib/format";
import { listRequirements } from "@/lib/queries/misc";
import { formatListingPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Property requirements" };

const tone = { active: "success", fulfilled: "primary", expired: "neutral" } as const;

export default async function RequirementsPage({ searchParams }: { searchParams: Promise<{ status?: string; city?: string; page?: string }> }) {
  const f = await searchParams;
  const { rows, total, page, pageSize } = await listRequirements(f);

  return (
    <div>
      <PageHeader title="Property requirements" description={`${total} buyer requirement posts ("I'm looking for…") on the property board.`} />

      <FilterBar action="/requirements">
        <Field label="Status">
          <select name="status" defaultValue={f.status ?? ""} className="input">
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="expired">Expired</option>
          </select>
        </Field>
        <Field label="City">
          <select name="city" defaultValue={f.city ?? ""} className="input">
            <option value="">All</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title="No requirements" />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => {
            const cat = getCategory(r.category_slug);
            const sub = cat?.subcategories.find((s) => s.slug === r.subcategory_slug)?.name;
            const budget =
              r.min_budget || r.max_budget
                ? `${r.min_budget ? formatListingPrice(r.min_budget, r.category_slug) : "Any"} – ${r.max_budget ? formatListingPrice(r.max_budget, r.category_slug) : "any"}`
                : "No budget given";
            return (
              <div key={r.id} className="card flex flex-col gap-3 p-4 md:flex-row">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={tone[r.status]}>{r.status}</Badge>
                    <Badge tone="primary">{cat?.name ?? r.category_slug}</Badge>
                    {sub ? <Badge>{sub}</Badge> : null}
                    {r.bedrooms ? <Badge>{r.bedrooms} bed</Badge> : null}
                    <span className="text-xs text-ink-muted">{ago(r.created_at)} · expires {fmtDate(r.expires_at, false)}</span>
                  </div>
                  <div className="mt-1 text-base font-bold text-ink">
                    {r.area ? `${r.area}, ` : ""}
                    {r.city} · {budget}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{r.description || <span className="text-ink-muted">No description.</span>}</p>
                  {r.images?.length ? (
                    <div className="mt-2 flex gap-1.5">
                      {r.images.slice(0, 5).map((u) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={u} src={u} alt="" className="h-14 w-14 rounded-md object-cover" />
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-2 text-xs text-ink-muted">
                    <UserLink user={r.user} size={18} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-row flex-wrap gap-1.5 md:w-40 md:flex-col">
                  {r.status !== "active" ? <ActionButton action={setRequirementStatus.bind(null, r.id, "active")}>Reactivate</ActionButton> : null}
                  {r.status === "active" ? <ActionButton action={setRequirementStatus.bind(null, r.id, "fulfilled")}>Mark fulfilled</ActionButton> : null}
                  {r.status === "active" ? <ActionButton action={setRequirementStatus.bind(null, r.id, "expired")}>Expire</ActionButton> : null}
                  <ActionButton action={deleteRequirement.bind(null, r.id)} confirm="Delete this requirement post?" className="btn-danger">
                    Delete
                  </ActionButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} params={f} />
    </div>
  );
}
