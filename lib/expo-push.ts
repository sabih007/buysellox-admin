/**
 * Server-side client for Expo's push API (https://docs.expo.dev/push-notifications/sending-notifications/).
 * Chat-message pushes are sent by the DB trigger in 0025_push_tokens.sql;
 * this is for admin campaigns, where we also want per-token results so dead
 * tokens can be pruned.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/** Expo caps a single request at 100 messages. */
const CHUNK = 100;

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

export interface ExpoPushResult {
  sent: number;
  failed: number;
  /** Tokens Expo reported as no longer valid — delete them from push_tokens. */
  deadTokens: string[];
  /** First few error messages, for the admin UI. */
  errors: string[];
}

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushResult> {
  const result: ExpoPushResult = { sent: 0, failed: 0, deadTokens: [], errors: [] };
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  // Optional: set when "Enhanced push security" is enabled on the Expo project.
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;

  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);
    let tickets: ExpoTicket[];
    try {
      const res = await fetch(EXPO_PUSH_URL, { method: "POST", headers, body: JSON.stringify(chunk) });
      const json = (await res.json()) as { data?: ExpoTicket[]; errors?: { message: string }[] };
      if (!res.ok || !json.data) {
        throw new Error(json.errors?.[0]?.message ?? `Expo push API responded ${res.status}`);
      }
      tickets = json.data;
    } catch (e) {
      result.failed += chunk.length;
      if (result.errors.length < 5) result.errors.push(e instanceof Error ? e.message : String(e));
      continue;
    }

    tickets.forEach((ticket, idx) => {
      if (ticket.status === "ok") {
        result.sent += 1;
        return;
      }
      result.failed += 1;
      if (ticket.details?.error === "DeviceNotRegistered") result.deadTokens.push(chunk[idx].to);
      if (result.errors.length < 5 && ticket.message) result.errors.push(ticket.message);
    });
  }

  return result;
}
