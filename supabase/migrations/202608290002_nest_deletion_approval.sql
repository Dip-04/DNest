-- Nest deletion requires creator initiation, partner approval, creator confirmation,
-- and remains recoverable by the creator for 30 days.

alter table public.nests
  add column if not exists deleted_at timestamptz,
  add column if not exists deletion_recoverable_until timestamptz;

create table public.nest_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  nest_id uuid not null unique references public.nests(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  partner_id uuid references public.profiles(id),
  status text not null default 'pending_partner'
    check (status in ('pending_partner', 'approved', 'declined', 'cancelled', 'finalized')),
  requested_at timestamptz not null default now(),
  responded_at timestamptz,
  finalized_at timestamptz,
  recoverable_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.nest_deletion_requests enable row level security;

create policy nest_deletion_requests_read on public.nest_deletion_requests
for select using (
  requested_by = auth.uid()
  or partner_id = auth.uid()
);

create or replace function public.request_nest_deletion(p_nest_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nest public.nests;
  v_partner uuid;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select * into v_nest
  from public.nests
  where id = p_nest_id
  for update;

  if not found or v_nest.deleted_at is not null then
    raise exception 'nest not found';
  end if;
  if v_nest.created_by <> auth.uid() then
    raise exception 'only the Nest creator can request deletion';
  end if;

  select user_id into v_partner
  from public.nest_members
  where nest_id = p_nest_id
    and user_id <> auth.uid()
    and status = 'active'
  limit 1;

  v_status := case when v_partner is null then 'approved' else 'pending_partner' end;

  insert into public.nest_deletion_requests (
    nest_id, requested_by, partner_id, status, requested_at,
    responded_at, finalized_at, recoverable_until, updated_at
  ) values (
    p_nest_id, auth.uid(), v_partner, v_status, now(),
    case when v_partner is null then now() else null end,
    null, null, now()
  )
  on conflict (nest_id) do update set
    requested_by = excluded.requested_by,
    partner_id = excluded.partner_id,
    status = excluded.status,
    requested_at = excluded.requested_at,
    responded_at = excluded.responded_at,
    finalized_at = null,
    recoverable_until = null,
    updated_at = now();

  if v_partner is not null then
    insert into public.notifications (
      nest_id, recipient_id, actor_id, kind, title, body, target_path
    ) values (
      p_nest_id,
      v_partner,
      auth.uid(),
      'nest_deletion',
      'Your partner asked to delete your Nest',
      'This holds your shared memories. Please take a breath and choose whether you are ready to let it go.',
      '/settings'
    );
  end if;

  return v_status;
end;
$$;

create or replace function public.respond_to_nest_deletion(
  p_nest_id uuid,
  p_approve boolean
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.nest_deletion_requests;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
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
  set status = v_status, responded_at = now(), updated_at = now()
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
    case when p_approve
      then 'The decision is back with you. Your Nest will only be deleted after your final confirmation.'
      else 'Your shared place is still here. Talk together before making another request.'
    end,
    '/settings'
  );

  return v_status;
end;
$$;

create or replace function public.cancel_nest_deletion(p_nest_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.nest_deletion_requests
  set status = 'cancelled', updated_at = now()
  where nest_id = p_nest_id
    and requested_by = auth.uid()
    and status in ('pending_partner', 'approved', 'declined');
  if not found then
    raise exception 'deletion request could not be cancelled';
  end if;
end;
$$;

create or replace function public.soft_delete_owned_nest(p_nest_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.nest_deletion_requests;
  v_recoverable_until timestamptz := now() + interval '30 days';
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select request.* into v_request
  from public.nest_deletion_requests request
  join public.nests nest on nest.id = request.nest_id
  where request.nest_id = p_nest_id
    and request.requested_by = auth.uid()
    and nest.created_by = auth.uid()
    and nest.deleted_at is null
  for update of request;

  if not found or v_request.status <> 'approved' then
    raise exception 'partner approval is required before deletion';
  end if;

  update public.nests
  set deleted_at = now(),
      deletion_recoverable_until = v_recoverable_until,
      updated_at = now()
  where id = p_nest_id;

  update public.nest_members
  set status = 'left', left_at = now()
  where nest_id = p_nest_id and status = 'active';

  update public.nest_deletion_requests
  set status = 'finalized',
      finalized_at = now(),
      recoverable_until = v_recoverable_until,
      updated_at = now()
  where id = v_request.id;

  return v_recoverable_until;
end;
$$;

create or replace function public.get_recoverable_owned_nests()
returns table (
  nest_id uuid,
  nest_name text,
  deleted_at timestamptz,
  recoverable_until timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select nest.id, nest.name, nest.deleted_at, nest.deletion_recoverable_until
  from public.nests nest
  where nest.created_by = auth.uid()
    and nest.deleted_at is not null
    and nest.deletion_recoverable_until > now()
  order by nest.deleted_at desc;
$$;

create or replace function public.recover_owned_nest(p_nest_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  perform 1
  from public.nests
  where id = p_nest_id
    and created_by = auth.uid()
    and deleted_at is not null
    and deletion_recoverable_until > now()
  for update;
  if not found then
    raise exception 'this Nest can no longer be recovered';
  end if;

  if exists (
    select 1 from public.nest_members
    where user_id = auth.uid()
      and status = 'active'
      and nest_id <> p_nest_id
  ) then
    raise exception 'you already belong to another Nest';
  end if;

  update public.nests
  set deleted_at = null, deletion_recoverable_until = null, updated_at = now()
  where id = p_nest_id;

  update public.nest_members member
  set status = 'active', left_at = null
  where member.nest_id = p_nest_id
    and not exists (
      select 1 from public.nest_members active_member
      where active_member.user_id = member.user_id
        and active_member.status = 'active'
        and active_member.nest_id <> p_nest_id
    );

  update public.nest_deletion_requests
  set status = 'cancelled', updated_at = now()
  where nest_id = p_nest_id;
end;
$$;

-- Remove the old permanent-delete escape hatch.
revoke execute on function public.delete_owned_nest(uuid) from authenticated;

revoke all on function public.request_nest_deletion(uuid) from public, anon;
revoke all on function public.respond_to_nest_deletion(uuid, boolean) from public, anon;
revoke all on function public.cancel_nest_deletion(uuid) from public, anon;
revoke all on function public.soft_delete_owned_nest(uuid) from public, anon;
revoke all on function public.get_recoverable_owned_nests() from public, anon;
revoke all on function public.recover_owned_nest(uuid) from public, anon;
grant execute on function public.request_nest_deletion(uuid) to authenticated;
grant execute on function public.respond_to_nest_deletion(uuid, boolean) to authenticated;
grant execute on function public.cancel_nest_deletion(uuid) to authenticated;
grant execute on function public.soft_delete_owned_nest(uuid) to authenticated;
grant execute on function public.get_recoverable_owned_nests() to authenticated;
grant execute on function public.recover_owned_nest(uuid) to authenticated;
