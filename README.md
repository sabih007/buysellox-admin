# Buysellox Admin

Super-admin dashboard for the Buysellox website + mobile app. Separate Next.js project, deployed on its own (e.g. `admin.buysellox.com`), talking to the same Supabase project as the site and app.

## What it does

| Section | What you can do |
| --- | --- |
| **Overview** | KPIs (users, active ads, 30-day revenue, open reports, subscriptions, chat volume, app devices), 30-day charts, latest ads/users/reports |
| **Listings** | Search/filter every ad (any status), approve pending ads, take down, mark sold, delete, bulk actions, free promotions (Featured/Hot/Super Hot for N days), bump, extend expiry, edit title/price/description, remove photos |
| **Users** | Search by name/email/phone, verified-seller badge, admin role, edit profile, set credit wallets, ban / ban + hide ads, unban, password reset, delete account |
| **Reports** | Queue of user reports with the ad preview — take the ad down, dismiss, mark reviewed, reopen |
| **Payments** | All promotion purchases and credit bundles; revenue totals; manually confirm pending JazzCash/Easypaisa payments (applies the package exactly like the webhook), mark failed, refund |
| **Subscriptions** | Dealer/shop/agency plans; grant a plan manually (with credits), cancel/activate, edit slot limit and period end |
| **Packages** | Edit promotion prices, durations, bundle credits, on/off sale |
| **Chats** | Browse conversations, read threads (text, voice, attachments), delete abusive messages or whole conversations |
| **Requirements** | Property "I'm looking for…" posts — fulfil, expire, delete |
| **Push notifications** | Send announcements to app users (everyone / city / active sellers / one user) with recipient preview and campaign history |
| **Settings** | Manage admins, environment status, platform limits |

## Setup

```bash
npm install --legacy-peer-deps
cp .env.example .env.local   # fill in the values below
```

`.env.local`:

| Var | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as the website / app |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API → `service_role`. **Server-only secret** — never commit it or expose it to a browser |
| `NEXT_PUBLIC_SITE_URL` | Public site, for "open on site" links (default `https://buysellox.com`) |
| `EXPO_ACCESS_TOKEN` | Optional; only if "Enhanced push security" is enabled on the Expo project |

Make yourself the first admin (the account must already exist on the site/app):

```bash
npm run make-admin you@example.com
```

Then:

```bash
npm run dev      # http://localhost:3000
```

Sign in with your normal Buysellox email + password. Non-admin accounts are refused.

## Deploying

Any Node host works (Vercel is the simplest — import the repo, add the four env vars, deploy). Put it on its own subdomain and keep it out of search engines (the app already sends `noindex`).

## Notes

- Everything runs through the Supabase **service-role** key on the server, so the dashboard can see and change anything regardless of RLS. Every server action re-checks that the caller is an admin.
- The shared `lib/*` files listed in `CLAUDE.md` are copies of the web repo's — re-copy them when the site changes.
- Schema changes (new tables, RPCs) belong in the web repo's `supabase/migrations`, not here.
