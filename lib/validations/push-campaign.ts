import { z } from "zod";

/** Where the app navigates when the notification is tapped (expo-router paths). */
export const PUSH_TARGETS = [
  { value: "", label: "Just open the app" },
  { value: "/post", label: "Post an ad" },
  { value: "/(tabs)/search", label: "Search" },
  { value: "/my-listings", label: "My ads" },
  { value: "/(tabs)/chats", label: "Chats" },
  { value: "/favorites", label: "Favourites" },
  { value: "category", label: "A category…" },
] as const;

export const pushAudienceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("all") }),
  z.object({ type: z.literal("city"), city: z.string().min(1, "Pick a city") }),
  z.object({ type: z.literal("active_sellers") }),
  z.object({ type: z.literal("user"), email: z.string().email("Enter a valid email") }),
]);

export const pushCampaignSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(60, "Keep the title under 60 characters"),
  body: z.string().trim().min(1, "Message is required").max(180, "Keep the message under 180 characters"),
  /** expo-router path; empty string = just open the app. */
  path: z
    .string()
    .trim()
    .max(200)
    .refine((p) => p === "" || p.startsWith("/"), "Path must start with /"),
  audience: pushAudienceSchema,
});

export type PushAudience = z.infer<typeof pushAudienceSchema>;
export type PushCampaignInput = z.infer<typeof pushCampaignSchema>;
