import type { Metadata } from "next";
import { EmptyState, Field, FilterBar, PageHeader, Pagination } from "@/components/ui";
import { ListingsTable } from "@/app/(dashboard)/listings/ListingsTable";
import { categories } from "@/lib/categories";
import { cities } from "@/lib/cities";
import { listListings, type ListingFilters } from "@/lib/queries/listings";

export const metadata: Metadata = { title: "Listings" };

export default async function ListingsPage({ searchParams }: { searchParams: Promise<ListingFilters> }) {
  const f = await searchParams;
  const { rows, total, page, pageSize } = await listListings(f);

  return (
    <div>
      <PageHeader title="Listings" description={`${total.toLocaleString()} ads match. Approve, take down, promote or edit any ad from here.`} />

      <FilterBar action="/listings">
        <Field label="Search" className="min-w-[220px] flex-1">
          <input name="q" defaultValue={f.q} className="input" placeholder="Title, description, slug or listing id" />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={f.status ?? ""} className="input">
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
            <option value="expired">Expired</option>
          </select>
        </Field>
        <Field label="Category">
          <select name="category" defaultValue={f.category ?? ""} className="input">
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
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
        <Field label="Promotion">
          <select name="badge" defaultValue={f.badge ?? ""} className="input">
            <option value="">Any</option>
            <option value="any">Promoted</option>
            <option value="featured">Featured</option>
            <option value="hot">Hot</option>
            <option value="super_hot">Super Hot</option>
          </select>
        </Field>
        <Field label="Flag">
          <select name="flag" defaultValue={f.flag ?? ""} className="input">
            <option value="">—</option>
            <option value="reported">Has open reports</option>
          </select>
        </Field>
        <Field label="Sort">
          <select name="sort" defaultValue={f.sort ?? ""} className="input">
            <option value="">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="views">Most viewed</option>
            <option value="price_desc">Price high → low</option>
            <option value="price_asc">Price low → high</option>
          </select>
        </Field>
      </FilterBar>

      {rows.length === 0 ? <EmptyState title="No listings match" description="Try widening the filters." /> : <ListingsTable rows={rows} />}
      <Pagination page={page} pageSize={pageSize} total={total} params={f as Record<string, string | undefined>} />
    </div>
  );
}
