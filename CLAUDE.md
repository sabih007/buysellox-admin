@AGENTS.md

# Buysellox Admin (Next.js)

Super-admin console for the Buysellox marketplace. Sibling of `../buysellox-web` (public site, github.com/sabih007/OneBazaar) and `../BuySellox App` (Expo app). All three share ONE Supabase project.

- **Data access is service-role only.** Every query/mutation goes through `lib/supabase/admin.ts` (`createAdminClient()`), which bypasses RLS. The cookie client in `lib/supabase/server.ts` exists only to identify the signed-in user. Never import the admin client from a client component.
- **Auth:** `lib/auth.ts` — `requireAdminPage()` in layouts/pages, `requireAdmin()` at the top of every server action. Admin = `profiles.role = 'admin'` (column is service-role-writable only, web migration 0017). First admin: `npm run make-admin you@example.com`.
- **Mutations are server actions** in `lib/actions/*.ts` returning `ActionResult`; UI triggers them with `components/ui/ActionButton.tsx` / `ActionForm.tsx` (bind arguments with `.bind(null, …)`).
- **Reads** live in `lib/queries/*.ts`. PostgREST caps rows at 1000 by default — stat queries pass an explicit `.limit()`.
- `lib/categories.ts`, `lib/cities.ts`, `lib/packages.ts`, `lib/promotions.ts`, `lib/subscriptions.ts`, `lib/expo-push.ts`, `lib/validations/push-campaign.ts`, `lib/utils.ts`, `types/database.ts` are **copies of the web repo's files**. Keep them identical; re-copy when the site changes them. Don't fork their logic here. Schema changes go in the web repo's `supabase/migrations`.
- Next.js 16: `proxy.ts` (not middleware), async `params`/`searchParams`. Read `node_modules/next/dist/docs/` before using unfamiliar APIs.
- Styling: Tailwind v4 with brand tokens in `app/globals.css` (`card`, `btn-*`, `input`, `th`/`td` utilities). Icons: `lucide-react`. Charts: `recharts`.
- Check: `npm run typecheck`, `npm run lint`, `npm run build`.
