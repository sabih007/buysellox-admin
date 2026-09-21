import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card, PageHeader, UserLink } from "@/components/ui";
import { ActionButton } from "@/components/ui/ActionButton";
import { deleteConversation, deleteMessage } from "@/lib/actions/misc";
import { fmtDate } from "@/lib/format";
import { getConversation } from "@/lib/queries/misc";
import { formatDuration, formatFileSize, formatListingPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Conversation" };

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getConversation(id);
  if (!d) notFound();
  const { conversation: c, messages } = d;

  return (
    <div>
      <PageHeader
        title={c.listing?.title ?? "Deleted ad"}
        description={c.listing ? `${formatListingPrice(c.listing.price, c.listing.category_slug)} · conversation started ${fmtDate(c.created_at)}` : `Conversation started ${fmtDate(c.created_at)}`}
        actions={
          <>
            {c.listing ? (
              <Link href={`/listings/${c.listing.id}`} className="btn-secondary">
                Open ad
              </Link>
            ) : null}
            <ActionButton action={deleteConversation.bind(null, c.id)} confirm="Delete this entire conversation for both users?" className="btn-danger">
              <Trash2 className="h-3.5 w-3.5" /> Delete conversation
            </ActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
        <Card>
          {messages.length === 0 ? (
            <p className="text-sm text-ink-muted">No messages yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((m) => {
                const mine = m.sender_id === c.seller_id;
                const who = mine ? c.seller : c.buyer;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`group max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary-light text-ink" : "bg-background text-ink"}`}>
                      <div className="mb-0.5 flex items-center justify-between gap-3 text-[11px] text-ink-muted">
                        <span className="font-semibold">{who?.full_name ?? (mine ? "Seller" : "Buyer")}</span>
                        <span>{fmtDate(m.created_at)}</span>
                      </div>
                      {m.body ? <p className="whitespace-pre-wrap">{m.body}</p> : null}
                      {m.audio_url ? (
                        <audio controls src={m.audio_url} className="mt-1 h-8 max-w-full">
                          Voice message {m.audio_duration_ms ? `(${formatDuration(m.audio_duration_ms)})` : ""}
                        </audio>
                      ) : null}
                      {m.attachment_url ? (
                        <a href={m.attachment_url} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-semibold text-primary-text hover:underline">
                          📎 {m.attachment_name ?? "Attachment"} {m.attachment_size ? `(${formatFileSize(m.attachment_size)})` : ""}
                        </a>
                      ) : null}
                      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-ink-muted">
                        <span>{m.read_at ? "Seen" : "Unread"}</span>
                        <span className="opacity-0 transition-opacity group-hover:opacity-100">
                          <ActionButton action={deleteMessage.bind(null, m.id)} confirm="Delete this message?" className="btn-danger h-6 px-1.5">
                            <Trash2 className="h-3 w-3" />
                          </ActionButton>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Buyer">
            <UserLink user={c.buyer} size={36} />
          </Card>
          <Card title="Seller">
            <UserLink user={c.seller} size={36} />
          </Card>
          {c.listing?.images?.[0] ? (
            <Card title="Ad">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.listing.images[0]} alt="" className="w-full rounded-lg object-cover" />
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
