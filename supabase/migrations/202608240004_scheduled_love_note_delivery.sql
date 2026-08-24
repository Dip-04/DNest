create extension if not exists pg_cron with schema extensions;

create or replace function app_private.deliver_due_love_notes(p_recipient_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  delivered_count integer;
begin
  with delivered as (
    update public.love_notes
    set status = 'delivered',
        delivered_at = now()
    where status = 'scheduled'
      and deliver_at <= now()
      and (p_recipient_id is null or recipient_id = p_recipient_id)
    returning nest_id, sender_id, recipient_id
  ), notified as (
    insert into public.notifications (
      nest_id,
      recipient_id,
      actor_id,
      kind,
      title,
      body,
      target_path
    )
    select
      delivered.nest_id,
      delivered.recipient_id,
      delivered.sender_id,
      'love_note'::public.notification_kind,
      'A Love Note is waiting',
      'Your partner left something for you.',
      '/notes'
    from delivered
    where not exists (
      select 1
      from public.user_preferences preferences
      where preferences.user_id = delivered.recipient_id
        and preferences.notifications @> '{"love_note": false}'::jsonb
    )
    returning 1
  )
  select count(*)::integer into delivered_count from delivered;

  return delivered_count;
end;
$$;

revoke all on function app_private.deliver_due_love_notes(uuid) from public;

create or replace function public.deliver_my_due_love_notes()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  return app_private.deliver_due_love_notes(auth.uid());
end;
$$;

revoke all on function public.deliver_my_due_love_notes() from public;
grant execute on function public.deliver_my_due_love_notes() to authenticated;

create or replace function public.deliver_scheduled_love_notes()
returns integer
language sql
security definer
set search_path = ''
as $$
  select app_private.deliver_due_love_notes(null);
$$;

revoke all on function public.deliver_scheduled_love_notes() from public, anon, authenticated;
grant execute on function public.deliver_scheduled_love_notes() to service_role;

select cron.schedule(
  'deliver-scheduled-love-notes',
  '* * * * *',
  'select public.deliver_scheduled_love_notes()'
);
