-- Keep this migration safe when it is applied manually without 202608240001.
create table if not exists public.period_tracker_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  default_cycle_length smallint not null default 28 check(default_cycle_length between 20 and 45),
  default_period_length smallint not null default 5 check(default_period_length between 1 and 15),
  timezone text not null default 'UTC',
  tracker_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.period_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date,
  cycle_length smallint check(cycle_length between 15 and 90),
  period_length smallint check(period_length between 1 and 15),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint period_cycle_dates_valid check(end_date is null or end_date >= start_date),
  unique(user_id,start_date)
);
create index if not exists period_cycles_user_start_idx on public.period_cycles(user_id,start_date desc);
alter table public.period_tracker_settings enable row level security;
alter table public.period_cycles enable row level security;
grant select,insert,update,delete on public.period_tracker_settings to authenticated;
grant select,insert,update,delete on public.period_cycles to authenticated;

alter table public.profiles add column if not exists gender_identity text
  check(gender_identity is null or char_length(gender_identity) between 1 and 60);
alter table public.profiles add column if not exists location_accuracy_m numeric(10,2)
  check(location_accuracy_m is null or location_accuracy_m >= 0);

alter table public.period_tracker_settings
  add column if not exists share_with_partner boolean not null default false;

create table if not exists public.period_day_moods (
  user_id uuid not null references public.profiles(id) on delete cascade,
  local_date date not null,
  mood text not null check(char_length(mood) between 1 and 40),
  note text check(note is null or char_length(note) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,local_date)
);
alter table public.period_day_moods enable row level security;
create trigger touch_period_day_moods before update on public.period_day_moods
  for each row execute function app_private.touch_updated_at();

drop policy if exists period_settings_private on public.period_tracker_settings;
drop policy if exists period_cycles_private on public.period_cycles;

create policy period_settings_owner_select on public.period_tracker_settings
  for select using(user_id=auth.uid());
create policy period_settings_partner_select on public.period_tracker_settings
  for select using(share_with_partner and exists(
    select 1 from public.nest_members me join public.nest_members owner using(nest_id)
    where me.user_id=auth.uid() and me.status='active'
      and owner.user_id=period_tracker_settings.user_id and owner.status='active'
  ));
create policy period_settings_owner_insert on public.period_tracker_settings
  for insert with check(user_id=auth.uid());
create policy period_settings_owner_update on public.period_tracker_settings
  for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy period_settings_owner_delete on public.period_tracker_settings
  for delete using(user_id=auth.uid());

create policy period_cycles_owner_select on public.period_cycles
  for select using(user_id=auth.uid());
create policy period_cycles_partner_select on public.period_cycles
  for select using(exists(
    select 1 from public.period_tracker_settings settings
    join public.nest_members owner on owner.user_id=settings.user_id and owner.status='active'
    join public.nest_members me on me.nest_id=owner.nest_id and me.status='active'
    where settings.user_id=period_cycles.user_id and settings.share_with_partner
      and me.user_id=auth.uid()
  ));
create policy period_cycles_owner_insert on public.period_cycles for insert with check(user_id=auth.uid());
create policy period_cycles_owner_update on public.period_cycles for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy period_cycles_owner_delete on public.period_cycles for delete using(user_id=auth.uid());

create policy period_moods_owner_select on public.period_day_moods for select using(user_id=auth.uid());
create policy period_moods_partner_select on public.period_day_moods for select using(exists(
  select 1 from public.period_tracker_settings settings
  join public.nest_members owner on owner.user_id=settings.user_id and owner.status='active'
  join public.nest_members me on me.nest_id=owner.nest_id and me.status='active'
  where settings.user_id=period_day_moods.user_id and settings.share_with_partner
    and me.user_id=auth.uid()
));
create policy period_moods_owner_insert on public.period_day_moods for insert with check(user_id=auth.uid());
create policy period_moods_owner_update on public.period_day_moods for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy period_moods_owner_delete on public.period_day_moods for delete using(user_id=auth.uid());

grant select,insert,update,delete on public.period_day_moods to authenticated;

create or replace function app_private.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,display_name,gender_identity)
  values(
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),split_part(new.email,'@',1)),
    nullif(left(trim(new.raw_user_meta_data->>'gender_identity'),60),'')
  );
  insert into public.user_preferences(user_id) values(new.id);
  return new;
end $$;
