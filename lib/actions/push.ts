"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sendExpoPush, type ExpoPushMessage } from "@/lib/expo-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushCampaignSchema, type PushAudience, type PushCampaignInput } from "@/lib/validations/push-campaign";

export interface SendResult {
  ok: boolean;
  error?: string;
  recipients: number;
  devices: number;
  sent: number;
  failed: number;
  errors?: string[];
  dryRun: boolean;
}

/**
 * Same behaviour as the website's /api/admin/push: `dryRun` only resolves the
 * audience; otherwise the campaign goes out through Expo and is logged to
 * push_campaigns.
 */
export async function sendPushCampaign(input: PushCampaignInput, dryRun: boolean): Promise<SendResult> {
  const empty = { recipients: 0, devices: 0, sent: 0, failed: 0, dryRun };
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return { ok: false, error: "Admins only", ...empty };
  }
  const parsed = pushCampaignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", ...empty };
  const { title, body, path, audience } = parsed.data;

  const supabase = createAdminClient();
  const userIds = await resolveAudience(supabase, audience);
  if (userIds !== null && userIds.length === 0) return { ok: true, ...empty };

  const tokenRows: { token: string; user_id: string }[] = [];
  const idBatches = userIds === null ? [null] : chunk(userIds, 500);
  for (const batch of idBatches) {
    let q = supabase.from("push_tokens").select("token, user_id");
    if (batch) q = q.in("user_id", batch);
    const { data, error } = await q;
    if (error) return { ok: false, error: error.message, ...empty };
    tokenRows.push(...(data ?? []));
  }
  const tokens = [...new Set(tokenRows.map((r) => r.token))];
  const recipients = new Set(tokenRows.map((r) => r.user_id)).size;

  if (dryRun) return { ok: true, recipients, devices: tokens.length, sent: 0, failed: 0, dryRun: true };

  const messages: ExpoPushMessage[] = tokens.map((to) => ({
    to,
    title,
    body,
    sound: "default",
    channelId: "messages",
    priority: "high",
    data: path ? { path } : {},
  }));
  const result = await sendExpoPush(messages);

  if (result.deadTokens.length) await supabase.from("push_tokens").delete().in("token", result.deadTokens);

  const { error: logError } = await supabase.from("push_campaigns").insert({
    created_by: admin.id,
    title,
    body,
    path: path || null,
    audience,
    recipients,
    sent: result.sent,
    failed: result.failed,
  });
  if (logError) result.errors.push(`Sent, but couldn't log the campaign: ${logError.message}`);

  revalidatePath("/notifications");
  return { ok: true, recipients, devices: tokens.length, sent: result.sent, failed: result.failed, errors: result.errors, dryRun: false };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function resolveAudience(supabase: ReturnType<typeof createAdminClient>, audience: PushAudience): Promise<string[] | null> {
  switch (audience.type) {
    case "all":
      return null;
    case "city": {
      const { data } = await supabase.from("profiles").select("id").eq("city", audience.city);
      return (data ?? []).map((r) => r.id);
    }
    case "active_sellers": {
      const { data } = await supabase.from("listings").select("user_id").eq("status", "active");
      return [...new Set((data ?? []).map((r) => r.user_id))];
    }
    case "user": {
      const { data } = await supabase.from("profiles").select("id").ilike("email", audience.email);
      return (data ?? []).map((r) => r.id);
    }
  }
}
