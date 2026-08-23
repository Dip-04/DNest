-- Repair invite-code hashing with pgcrypto's actual Supabase schema and add
-- an owner-only Nest deletion boundary. Storage objects are removed through
-- the Storage API by the authenticated server action before this RPC runs.

create or replace function public.create_nest_invitation(
  p_nest_id uuid,
  p_email public.citext default null
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_email public.citext;
begin
  if not app_private.is_nest_member(p_nest_id, auth.uid()) then
    raise exception 'forbidden';
  end if;
  if app_private.active_member_count(p_nest_id) >= 2 then
    raise exception 'nest is full';
  end if;

  v_email := nullif(lower(trim(p_email::text)), '')::public.citext;
  update public.nest_invitations
    set status = 'revoked'
    where nest_id = p_nest_id and status = 'pending';

  v_token := upper(encode(extensions.gen_random_bytes(6), 'hex'));
  insert into public.nest_invitations(
    nest_id,
    invited_by,
    invited_email,
    token_hash
  ) values (
    p_nest_id,
    auth.uid(),
    v_email,
    encode(extensions.digest(v_token, 'sha256'), 'hex')
  );
  return v_token;
end;
$$;

create or replace function public.accept_nest_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.nest_invitations;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  select * into v_inv
    from public.nest_invitations
    where token_hash = encode(
      extensions.digest(upper(trim(p_token)), 'sha256'),
      'hex'
    )
    for update;
  if not found or v_inv.status <> 'pending' or v_inv.expires_at <= now() then
    raise exception 'invitation invalid or expired';
  end if;
  if v_inv.invited_email is not null
    and lower(v_inv.invited_email) <> lower(coalesce(auth.jwt() ->> 'email', ''))
  then
    raise exception 'invitation belongs to another email';
  end if;
  if exists (
    select 1 from public.nest_members
    where user_id = auth.uid() and status = 'active'
  ) then
    raise exception 'already belongs to a nest';
  end if;
  if app_private.active_member_count(v_inv.nest_id) >= 2 then
    raise exception 'nest is full';
  end if;

  insert into public.nest_members(nest_id, user_id)
    values (v_inv.nest_id, auth.uid());
  update public.nest_invitations
    set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
    where id = v_inv.id;
  return v_inv.nest_id;
end;
$$;

create or replace function public.delete_owned_nest(p_nest_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  delete from public.nests
    where id = p_nest_id and created_by = auth.uid();
  if not found then
    raise exception 'only the Nest creator can delete it';
  end if;
end;
$$;

revoke all on function public.create_nest_invitation(uuid, public.citext) from public, anon;
revoke all on function public.accept_nest_invitation(text) from public, anon;
revoke all on function public.delete_owned_nest(uuid) from public, anon;
grant execute on function public.create_nest_invitation(uuid, public.citext) to authenticated;
grant execute on function public.accept_nest_invitation(text) to authenticated;
grant execute on function public.delete_owned_nest(uuid) to authenticated;
