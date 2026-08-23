-- Profile coordinates are visible only to the user and their active Nest
-- partner through RLS. Publishing updates lets an open Home screen refresh
-- the distance/map without polling.
alter table public.profiles
  add column if not exists location_sharing boolean not null default false,
  add column if not exists location_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;
