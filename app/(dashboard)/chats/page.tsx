import type { Metadata } from "next";
import Link from "next/link";
import { Mic, Paperclip } from "lucide-react";
import { EmptyState, Field, FilterBar, PageHeader, Pagination, Table, UserLink } from "@/components/ui";
import { ago, truncate } from "@/lib/format";
import { listConversations } from "@/lib/queries/misc";

export const metadata: Metadata = { title: "Chats" };

export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const f = await searchParams;
  const { rows, total, page, pageSize } = await listConversations(f);

  return (
    <div>
      <PageHeader title="Chats" description={`${total.toLocaleString()} conversations between buyers and sellers. Read-only unless you need to remove abusive content.`} />

      <FilterBar action="/chats">
        <Field label="Search" className="min-w-[240px] flex-1">
          <input name="q" defaultValue={f.q} className="input" placeholder="Participant name/email, or a conversation / listing / user id" />
        </Field>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title="No conversations" />
      ) : (
        <Table>
          <thead className="border-b border-line bg-background">
            <tr>
              <th className="th">Ad</th>
              <th className="th">Buyer</th>
              <th className="th">Seller</th>
              <th className="th">Last message</th>
              <th className="th">Msgs</th>
              <th className="th">Started</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-background/60">
                <td className="td">
                  <Link href={`/chats/${c.id}`} className="line-clamp-2 font-medium hover:underline">
                    {c.listing?.title ?? "Deleted ad"}
                  </Link>
                </td>
                <td className="td">
                  <UserLink user={c.buyer} />
                </td>
                <td className="td">
                  <UserLink user={c.seller} />
                </td>
                <td className="td text-xs text-ink-soft">
                  {c.last_message ? (
                    <span className="flex items-center gap-1">
                      {c.last_message.audio_url ? <Mic className="h-3 w-3" /> : null}
                      {c.last_message.attachment_type ? <Paperclip className="h-3 w-3" /> : null}
                      {truncate(c.last_message.body, 60) || (c.last_message.audio_url ? "Voice message" : "Attachment")}
                      <span className="text-ink-muted">· {ago(c.last_message.created_at)}</span>
                    </span>
                  ) : (
                    <span className="text-ink-muted">No messages</span>
                  )}
                </td>
                <td className="td">{c.message_count ?? 0}</td>
                <td className="td whitespace-nowrap text-xs text-ink-muted">{ago(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <Pagination page={page} pageSize={pageSize} total={total} params={f} />
    </div>
  );
}
