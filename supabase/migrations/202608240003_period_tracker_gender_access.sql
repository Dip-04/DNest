-- Period records are editable only by profiles identifying as women.
-- Partners may still receive the explicit read-only view from migration 002.
create or replace function app_private.can_edit_period_tracker(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select lower(trim(coalesce(profile.gender_identity,''))) = any(array[
    'woman','female','girl','cis woman','cisgender woman','trans woman','transgender woman'
  ])
  from public.profiles profile
  where profile.id=profile_id
$$;

revoke all on function app_private.can_edit_period_tracker(uuid) from public;
grant execute on function app_private.can_edit_period_tracker(uuid) to authenticated;

drop policy if exists period_settings_owner_insert on public.period_tracker_settings;
drop policy if exists period_settings_owner_update on public.period_tracker_settings;
drop policy if exists period_settings_owner_delete on public.period_tracker_settings;
create policy period_settings_owner_insert on public.period_tracker_settings
  for insert with check(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()));
create policy period_settings_owner_update on public.period_tracker_settings
  for update using(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()))
  with check(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()));
create policy period_settings_owner_delete on public.period_tracker_settings
  for delete using(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()));

drop policy if exists period_cycles_owner_insert on public.period_cycles;
drop policy if exists period_cycles_owner_update on public.period_cycles;
drop policy if exists period_cycles_owner_delete on public.period_cycles;
create policy period_cycles_owner_insert on public.period_cycles
  for insert with check(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()));
create policy period_cycles_owner_update on public.period_cycles
  for update using(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()))
  with check(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()));
create policy period_cycles_owner_delete on public.period_cycles
  for delete using(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()));

drop policy if exists period_moods_owner_insert on public.period_day_moods;
drop policy if exists period_moods_owner_update on public.period_day_moods;
drop policy if exists period_moods_owner_delete on public.period_day_moods;
create policy period_moods_owner_insert on public.period_day_moods
  for insert with check(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()));
create policy period_moods_owner_update on public.period_day_moods
  for update using(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()))
  with check(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()));
create policy period_moods_owner_delete on public.period_day_moods
  for delete using(user_id=auth.uid() and app_private.can_edit_period_tracker(auth.uid()));

-- Keep avatar signing available to both active partners even if migration 001
-- was skipped in an older deployment.
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
