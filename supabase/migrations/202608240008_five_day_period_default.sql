-- Period tracking is intentionally simple: log day 1 and DNest fills five days.
update public.period_tracker_settings
set default_period_length = 5, updated_at = now()
where default_period_length <> 5;

alter table public.period_tracker_settings
  alter column default_period_length set default 5;

alter table public.period_tracker_settings
  drop constraint if exists period_tracker_settings_five_day_default;
alter table public.period_tracker_settings
  add constraint period_tracker_settings_five_day_default
  check(default_period_length = 5);

insert into public.period_tracker_settings(user_id, default_period_length, timezone)
select profile.id, 5, coalesce(nullif(profile.timezone, ''), 'UTC')
from public.profiles profile
where lower(trim(coalesce(profile.gender_identity, ''))) = any(array[
  'woman','female','girl','cis woman','cisgender woman','trans woman','transgender woman'
])
on conflict(user_id) do update
set default_period_length = 5;

create or replace function app_private.ensure_five_day_period_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(trim(coalesce(new.gender_identity, ''))) = any(array[
    'woman','female','girl','cis woman','cisgender woman','trans woman','transgender woman'
  ]) then
    insert into public.period_tracker_settings(user_id, default_period_length, timezone)
    values(new.id, 5, coalesce(nullif(new.timezone, ''), 'UTC'))
    on conflict(user_id) do update set default_period_length = 5;
  end if;
  return new;
end;
$$;

drop trigger if exists ensure_five_day_period_settings on public.profiles;
create trigger ensure_five_day_period_settings
after insert or update of gender_identity on public.profiles
for each row execute function app_private.ensure_five_day_period_settings();
