-- Revocable credentials used by the native iOS and Android companions.
-- Only the service role can read or write token hashes; users create keys
-- through the authenticated Next.js route.

create table if not exists public.native_widget_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists native_widget_access_user_idx
  on public.native_widget_access(user_id, platform, created_at desc);

alter table public.native_widget_access enable row level security;
revoke all on public.native_widget_access from anon, authenticated;
