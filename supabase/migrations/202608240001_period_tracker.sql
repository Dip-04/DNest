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

create index if not exists period_cycles_user_start_idx
  on public.period_cycles(user_id,start_date desc);

alter table public.period_tracker_settings enable row level security;
alter table public.period_cycles enable row level security;

create policy period_settings_private on public.period_tracker_settings
  for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy period_cycles_private on public.period_cycles
  for all using(user_id=auth.uid()) with check(user_id=auth.uid());

create trigger touch_period_tracker_settings before update on public.period_tracker_settings
  for each row execute function app_private.touch_updated_at();
create trigger touch_period_cycles before update on public.period_cycles
  for each row execute function app_private.touch_updated_at();

grant select,insert,update,delete on public.period_tracker_settings to authenticated;
grant select,insert,update,delete on public.period_cycles to authenticated;

-- A signed avatar may be requested by either its owner or their active Nest partner.
drop policy if exists avatar_owner_read on storage.objects;
drop policy if exists avatar_owner_or_partner_read on storage.objects;
create policy avatar_owner_or_partner_read on storage.objects for select using(
  bucket_id='avatars' and (
    (storage.foldername(name))[1]=auth.uid()::text or
    exists(
      select 1 from public.nest_members me
      join public.nest_members them using(nest_id)
      where me.user_id=auth.uid() and me.status='active'
        and them.user_id=((storage.foldername(name))[1])::uuid and them.status='active'
    )
  )
);
