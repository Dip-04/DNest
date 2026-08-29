-- The responding partner, not the creator, supplies the reason/final note.
alter table public.nest_deletion_requests
  add column if not exists partner_note text
    check (partner_note is null or char_length(partner_note) between 1 and 1000);

create function app_private.clear_previous_deletion_note()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.requested_at is distinct from old.requested_at then
    new.partner_note := null;
  end if;
  return new;
end;
$$;

create trigger clear_previous_deletion_note
before update on public.nest_deletion_requests
for each row execute function app_private.clear_previous_deletion_note();

revoke all on function app_private.clear_previous_deletion_note()
  from public, anon, authenticated;

revoke execute on function public.respond_to_nest_deletion(uuid, boolean) from authenticated;
drop function public.respond_to_nest_deletion(uuid, boolean);

create function public.respond_to_nest_deletion(
  p_nest_id uuid,
  p_approve boolean,
  p_partner_note text
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.nest_deletion_requests;
  v_status text;
  v_note text := trim(p_partner_note);
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if v_note is null or char_length(v_note) not between 1 and 1000 then
    raise exception 'a final note between 1 and 1000 characters is required';
  end if;

  select * into v_request
  from public.nest_deletion_requests
  where nest_id = p_nest_id
  for update;

  if not found or v_request.partner_id <> auth.uid() then
    raise exception 'only the requested partner can respond';
  end if;
  if v_request.status <> 'pending_partner' then
    raise exception 'this deletion request is no longer pending';
  end if;

  v_status := case when p_approve then 'approved' else 'declined' end;
  update public.nest_deletion_requests
  set status = v_status,
      partner_note = v_note,
      responded_at = now(),
      updated_at = now()
  where id = v_request.id;

  insert into public.notifications (
    nest_id, recipient_id, actor_id, kind, title, body, target_path
  ) values (
    p_nest_id,
    v_request.requested_by,
    auth.uid(),
    'nest_deletion',
    case when p_approve
      then 'Your partner approved the deletion request'
      else 'Your partner wants to keep your Nest'
    end,
    'Your partner left a personal note for you. Open the deletion request to read it.',
    '/settings'
  );

  return v_status;
end;
$$;

revoke all on function public.respond_to_nest_deletion(uuid, boolean, text)
  from public, anon;
grant execute on function public.respond_to_nest_deletion(uuid, boolean, text)
  to authenticated;
