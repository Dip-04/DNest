drop policy if exists capsule_creator_metadata on public.time_capsules;
create policy capsule_member_metadata on public.time_capsules for select using(app_private.is_nest_member(nest_id));
