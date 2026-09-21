import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Avatar, Badge, EmptyState, Field, FilterBar, PageHeader, Pagination, Table } from "@/components/ui";
import { cities } from "@/lib/cities";
import { ago } from "@/lib/format";
import { listUsers, type UserFilters } from "@/lib/queries/users";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<UserFilters> }) {
  const f = await searchParams;
  const { rows, total, page, pageSize } = await listUsers(f);

  return (
    <div>
      <PageHeader title="Users" description={`${total.toLocaleString()} accounts. Verify sellers, manage credits, ban or promote to admin.`} />

      <FilterBar action="/users">
        <Field label="Search" className="min-w-[220px] flex-1">
          <input name="q" defaultValue={f.q} className="input" placeholder="Name, email, phone or user id" />
        </Field>
        <Field label="Role">
          <select name="role" defaultValue={f.role ?? ""} className="input">
            <option value="">Any</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <Field label="Verified">
          <select name="verified" defaultValue={f.verified ?? ""} className="input">
            <option value="">Any</option>
            <option value="yes">Verified</option>
            <option value="no">Not verified</option>
          </select>
        </Field>
        <Field label="City">
          <select name="city" defaultValue={f.city ?? ""} className="input">
            <option value="">All</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sort">
          <select name="sort" defaultValue={f.sort ?? ""} className="input">
            <option value="">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </Field>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title="No users match" />
      ) : (
        <Table>
          <thead className="border-b border-line bg-background">
            <tr>
              <th className="th">User</th>
              <th className="th">Phone</th>
              <th className="th">City</th>
              <th className="th">Active ads</th>
              <th className="th">Credits (R/F/H)</th>
              <th className="th">Role</th>
              <th className="th">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0 hover:bg-background/60">
                <td className="td">
                  <Link href={`/users/${u.id}`} className="flex items-center gap-2.5 hover:underline">
                    <Avatar src={u.avatar_url} name={u.full_name} size={34} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 font-semibold text-ink">
                        <span className="truncate">{u.full_name ?? "Unnamed"}</span>
                        {u.is_verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-success" /> : null}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">{u.email ?? "no email"}</span>
                    </span>
                  </Link>
                </td>
                <td className="td whitespace-nowrap">{u.phone ?? "—"}</td>
                <td className="td">{u.city ?? "—"}</td>
                <td className="td">{u.listings_count ?? 0}</td>
                <td className="td whitespace-nowrap text-xs">
                  {u.refresh_credits} / {u.featured_credits} / {u.hot_credits}
                </td>
                <td className="td">{u.role === "admin" ? <Badge tone="purple">admin</Badge> : <Badge>user</Badge>}</td>
                <td className="td whitespace-nowrap text-xs text-ink-muted">{ago(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} params={f as Record<string, string | undefined>} />
    </div>
  );
}
