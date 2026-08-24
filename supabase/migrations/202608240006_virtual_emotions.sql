alter type public.notification_kind add value if not exists 'virtual_emotion';

do $$
begin
  if not exists (
    select 1 from pg_type type
    join pg_namespace namespace on namespace.oid = type.typnamespace
    where namespace.nspname = 'public' and type.typname = 'virtual_emotion_type'
  ) then
    create type public.virtual_emotion_type as enum (
      'hug', 'kiss', 'cuddle', 'love', 'happy', 'miss_you',
      'flying_kiss', 'need_you', 'celebrate', 'hold_hands', 'comfort'
    );
  end if;
end
$$;

create table if not exists public.virtual_emotions (
  id uuid primary key default gen_random_uuid(),
  nest_id uuid not null references public.nests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type public.virtual_emotion_type not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint virtual_emotion_partners_differ check(sender_id <> recipient_id)
);

create index if not exists virtual_emotions_nest_created_idx
  on public.virtual_emotions(nest_id, created_at desc);
create index if not exists virtual_emotions_recipient_unread_idx
  on public.virtual_emotions(recipient_id, created_at desc)
  where read_at is null;

alter table public.virtual_emotions enable row level security;
drop policy if exists virtual_emotions_read on public.virtual_emotions;
drop policy if exists virtual_emotions_insert on public.virtual_emotions;
drop policy if exists virtual_emotions_recipient_update on public.virtual_emotions;
create policy virtual_emotions_read on public.virtual_emotions
  for select using(app_private.is_nest_member(nest_id));
create policy virtual_emotions_insert on public.virtual_emotions
  for insert with check(
    sender_id = auth.uid()
    and app_private.is_nest_member(nest_id)
    and app_private.is_nest_partner(nest_id, recipient_id)
  );
create policy virtual_emotions_recipient_update on public.virtual_emotions
  for update using(recipient_id = auth.uid())
  with check(recipient_id = auth.uid() and app_private.is_nest_member(nest_id));

grant select, insert, update on public.virtual_emotions to authenticated;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'virtual_emotions'
  ) then
    alter publication supabase_realtime add table public.virtual_emotions;
  end if;
end
$$;

alter table public.user_preferences
  alter column notifications set default '{"love_note":true,"thinking_of_you":true,"mood":true,"question_unlocked":true,"challenge":true,"meetup":true,"important_date":true,"capsule":true,"wishlist":true,"moment":true,"period_tracker":true,"virtual_emotion":true}'::jsonb;

update public.user_preferences
set notifications = jsonb_set(notifications, '{virtual_emotion}', 'true'::jsonb, true)
where not notifications ? 'virtual_emotion';
