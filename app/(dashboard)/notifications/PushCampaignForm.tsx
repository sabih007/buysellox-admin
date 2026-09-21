"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Users } from "lucide-react";
import { sendPushCampaign, type SendResult } from "@/lib/actions/push";
import { categories } from "@/lib/categories";
import { cities } from "@/lib/cities";
import { PUSH_TARGETS, type PushAudience } from "@/lib/validations/push-campaign";

type AudienceType = PushAudience["type"];

export function PushCampaignForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<string>("");
  const [categorySlug, setCategorySlug] = useState("");
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [preview, setPreview] = useState<SendResult | null>(null);
  const [result, setResult] = useState<SendResult | null>(null);
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);

  const path = target === "category" ? (categorySlug ? `/category/${categorySlug}` : "") : target;
  const audience = useMemo<PushAudience>(() => {
    switch (audienceType) {
      case "city":
        return { type: "city", city };
      case "user":
        return { type: "user", email: email.trim() };
      case "active_sellers":
        return { type: "active_sellers" };
      default:
        return { type: "all" };
    }
  }, [audienceType, city, email]);

  async function run(dryRun: boolean) {
    if (!dryRun && !window.confirm(`Send this notification to ${preview?.devices ?? "all matching"} devices now?`)) return;
    setBusy(dryRun ? "preview" : "send");
    const r = await sendPushCampaign({ title, body, path, audience }, dryRun);
    if (dryRun) setPreview(r);
    else {
      setResult(r);
      if (r.ok) {
        setTitle("");
        setBody("");
        setPreview(null);
        router.refresh();
      }
    }
    setBusy(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <label className="block">
          <span className="label">Title ({title.length}/60)</span>
          <input className="input" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Eid sale: 50% off Featured ads" />
        </label>
        <label className="block">
          <span className="label">Message ({body.length}/180)</span>
          <textarea className="input h-24 py-2" maxLength={180} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Promote your ad this week and reach 3× more buyers." />
        </label>
        <label className="block">
          <span className="label">When tapped, open</span>
          <select className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
            {PUSH_TARGETS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {target === "category" ? (
          <label className="block">
            <span className="label">Category</span>
            <select className="input" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
              <option value="">Pick a category</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="label">Audience</span>
          <select className="input" value={audienceType} onChange={(e) => setAudienceType(e.target.value as AudienceType)}>
            <option value="all">Everyone with the app</option>
            <option value="city">Users in a city</option>
            <option value="active_sellers">Users with active ads</option>
            <option value="user">One user (by email)</option>
          </select>
        </label>
        {audienceType === "city" ? (
          <label className="block">
            <span className="label">City</span>
            <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Pick a city</option>
              {cities.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {audienceType === "user" ? (
          <label className="block">
            <span className="label">Email</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        ) : null}

        <div className="rounded-lg border border-line bg-background p-3 text-sm">
          <div className="mb-1 text-xs font-semibold uppercase text-ink-muted">Preview</div>
          <div className="rounded-lg bg-surface p-3 shadow-sm">
            <div className="text-[10px] font-semibold uppercase text-ink-muted">Buysellox · now</div>
            <div className="font-bold text-ink">{title || "Title"}</div>
            <div className="text-ink-soft">{body || "Message"}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary" disabled={busy !== null || !title || !body} onClick={() => run(true)}>
            {busy === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Count recipients
          </button>
          <button type="button" className="btn-primary" disabled={busy !== null || !title || !body} onClick={() => run(false)}>
            {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send now
          </button>
        </div>
        {preview ? (
          <p className={`text-sm ${preview.ok ? "text-ink-soft" : "text-danger"}`}>
            {preview.ok ? `Would reach ${preview.recipients} user${preview.recipients === 1 ? "" : "s"} on ${preview.devices} device${preview.devices === 1 ? "" : "s"}.` : preview.error}
          </p>
        ) : null}
        {result ? (
          <div className={`rounded-lg px-3 py-2 text-sm ${result.ok ? "bg-success-light text-success" : "bg-danger-light text-danger"}`}>
            {result.ok ? `Sent to ${result.sent} device${result.sent === 1 ? "" : "s"} (${result.recipients} users)${result.failed ? `, ${result.failed} failed` : ""}.` : result.error}
            {result.errors?.length ? <ul className="mt-1 list-disc pl-4 text-xs">{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
