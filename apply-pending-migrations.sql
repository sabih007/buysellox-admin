-- Paste into Supabase → SQL Editor → Run. Combines web migrations 0026 + 0027 (not yet applied on 2026-09-22). Delete this file afterwards.

-- ===== 0026_push_campaigns.sql =====
-- Admin push campaigns (/admin/notifications): announcements sent to the
-- mobile app via Expo's push API. Chat-message pushes (0025) are automatic;
-- this is the manual "send to everyone / a city / active sellers" tool.
--
-- Rows are written by app/api/admin/push with the service-role client after
-- it has verified the caller is an admin, so the only policy needed is
-- read access for admins (the log table on the admin page).

create table public.push_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  body text not null,
  -- expo-router path the app opens on tap, e.g. '/post' or '/category/vehicles'
  path text,
  -- { type: 'all' | 'city' | 'active_sellers' | 'user', city?: text, email?: text }
  audience jsonb not null,
  recipients integer not null default 0,
  sent integer not null default 0,
  failed integer not null default 0,
  created_at timestamptz not null default now()
);

create index push_campaigns_created_at_idx on public.push_campaigns (created_at desc);

alter table public.push_campaigns enable row level security;

create policy "Admins can read push campaigns"
  on public.push_campaigns for select
  using (public.is_admin());

-- ===== 0027_reports_and_blocks.sql =====
-- Report & block (roadmap Phase 0, trust).
--
-- 1. `reports` grows from listing-only to a polymorphic target
--    (listing | user | message) so the app and site can report sellers and
--    chat messages too. `reported_user_id` is denormalised so the admin
--    queue can spot repeat offenders without joining three tables, and
--    `excerpt` snapshots the listing title / message text at report time —
--    admins have no RLS access to other people's messages, and the listing
--    may be deleted by the time the queue is read.
-- 2. `blocks` — user A blocks user B. Hidden BOTH ways: neither sees the
--    other's active listings or their shared conversations, neither can
--    start a chat or send a message to the other, and "Show number" stops
--    revealing the phone. Only the blocker can see/undo their own rows.
--
-- Block checks in policies go through `blocked_user_ids()` (security
-- definer, stable) so a) the reverse direction is visible even though RLS
-- on `blocks` only exposes the caller's own rows, and b) the planner
-- evaluates it once per statement as a hashed set instead of per row.

-- ─────────────────────────────────────────────────────────────────────────
-- reports: polymorphic target
-- ─────────────────────────────────────────────────────────────────────────
alter table public.reports
  add column target_type text not null default 'listing'
    check (target_type in ('listing', 'user', 'message')),
  add column target_id uuid,
  add column reported_user_id uuid references public.profiles (id) on delete cascade,
  add column excerpt text;

update public.reports r
set target_id = r.listing_id,
    reported_user_id = l.user_id,
    excerpt = l.title
from public.listings l
where l.id = r.listing_id;

-- Reports whose listing vanished were cascade-deleted, so every row is filled.
alter table public.reports
  alter column target_id set not null,
  alter column reported_user_id set not null,
  alter column listing_id drop not null;

-- 'harassment' is the natural reason once users and messages can be reported.
alter table public.reports drop constraint reports_reason_check;
alter table public.reports
  add constraint reports_reason_check
  check (reason in ('spam', 'scam', 'prohibited', 'harassment', 'other'));

-- Admin queue reads open reports newest-first.
create index reports_status_created_idx on public.reports (status, created_at desc);
create index reports_reported_user_idx on public.reports (reported_user_id);

-- One open report per (reporter, target): tapping "Report" twice is a no-op
-- (clients treat 23505 as "already reported"), while a target can be
-- reported again after an admin has closed the earlier one.
-- Existing duplicates (same reporter, same listing, both still open) would
-- break the index — close all but the earliest first.
with dups as (
  select id, row_number() over (partition by reporter_id, target_type, target_id order by created_at) as rn
  from public.reports
  where status = 'open'
)
update public.reports r
set status = 'dismissed'
from dups
where dups.id = r.id and dups.rn > 1;

create unique index reports_open_once_idx
  on public.reports (reporter_id, target_type, target_id)
  where status = 'open';

-- Reporters may only report on their own behalf and never themselves.
drop policy "Users can create reports" on public.reports;
create policy "Users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id and reporter_id <> reported_user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- blocks
-- ─────────────────────────────────────────────────────────────────────────
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

create policy "Users can view own blocks"
  on public.blocks for select
  using (auth.uid() = blocker_id);

create policy "Users can block"
  on public.blocks for insert
  with check (auth.uid() = blocker_id);

create policy "Users can unblock"
  on public.blocks for delete
  using (auth.uid() = blocker_id);

-- Everyone the caller has blocked plus everyone who has blocked the caller.
-- Empty for anonymous callers, so public pages are unaffected.
create function public.blocked_user_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select blocked_id from public.blocks where blocker_id = auth.uid()
  union
  select blocker_id from public.blocks where blocked_id = auth.uid();
$$;

grant execute on function public.blocked_user_ids() to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- listings: hide both ways
-- ─────────────────────────────────────────────────────────────────────────
drop policy "Active listings are publicly readable" on public.listings;
create policy "Active listings are publicly readable"
  on public.listings for select
  using (
    auth.uid() = user_id
    or (status = 'active' and user_id not in (select public.blocked_user_ids()))
  );

-- ─────────────────────────────────────────────────────────────────────────
-- conversations / messages: hide and freeze both ways
-- ─────────────────────────────────────────────────────────────────────────
drop policy "Participants can view own conversations" on public.conversations;
create policy "Participants can view own conversations"
  on public.conversations for select
  using (
    (auth.uid() = buyer_id or auth.uid() = seller_id)
    and buyer_id not in (select public.blocked_user_ids())
    and seller_id not in (select public.blocked_user_ids())
  );

drop policy "Buyers can start conversations" on public.conversations;
create policy "Buyers can start conversations"
  on public.conversations for insert
  with check (
    auth.uid() = buyer_id
    and seller_id not in (select public.blocked_user_ids())
  );

-- The messages policies look up the conversation through the (now
-- block-aware) conversations policy above, so reads and sends of a blocked
-- thread are already refused. Restated here so the intent is explicit and
-- doesn't silently depend on the conversations policy staying that way.
drop policy "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
        and c.buyer_id not in (select public.blocked_user_ids())
        and c.seller_id not in (select public.blocked_user_ids())
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- get_seller_phone: no number for a blocked pair
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.get_seller_phone(p_listing_id uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_phone text;
begin
  if auth.uid() is null then
    return null;
  end if;

  select p.phone into v_phone
  from public.listings l
  join public.profiles p on p.id = l.user_id
  where l.id = p_listing_id
    and l.user_id not in (select public.blocked_user_ids());

  return v_phone;
end;
$$;
