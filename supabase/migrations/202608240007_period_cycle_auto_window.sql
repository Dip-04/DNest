-- A user logs only day 1. DNest owns the rest of the default five-day window.
update public.period_cycles
set
  end_date = start_date + 4,
  period_length = 5,
  updated_at = now()
where end_date is null;

create or replace function app_private.complete_period_window()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.end_date is null then
    new.end_date := new.start_date + 4;
    new.period_length := 5;
  elsif new.period_length is null then
    new.period_length := (new.end_date - new.start_date) + 1;
  end if;
  return new;
end;
$$;

drop trigger if exists complete_period_window on public.period_cycles;
create trigger complete_period_window
before insert on public.period_cycles
for each row execute function app_private.complete_period_window();
