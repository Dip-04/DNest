-- DNest production schema. Apply with `supabase db push`.
create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.member_status as enum ('active','left');
create type public.invitation_status as enum ('pending','accepted','revoked','expired');
create type public.wishlist_status as enum ('dream','planning','done');
create type public.note_status as enum ('scheduled','delivered','archived');
create type public.notification_kind as enum ('love_note','thinking_of_you','mood','question_unlocked','challenge','meetup','important_date','capsule','wishlist','moment');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  avatar_path text,
  birthday date,
  timezone text not null default 'UTC',
  city text,
  latitude numeric(9,6), longitude numeric(9,6),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.nests (
  id uuid primary key default gen_random_uuid(), name text not null default 'Our Nest' check(char_length(name)<=80),
  relationship_start date, cover_path text, created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.nest_members (
  nest_id uuid not null references public.nests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.member_status not null default 'active', joined_at timestamptz not null default now(), left_at timestamptz,
  primary key(nest_id,user_id)
);
create unique index one_active_nest_per_user on public.nest_members(user_id) where status='active';
create table public.nest_invitations (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade,
  invited_by uuid not null references public.profiles(id), invited_email citext,
  token_hash text not null unique, status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default now()+interval '7 days', accepted_by uuid references public.profiles(id), accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index one_pending_invite_per_nest on public.nest_invitations(nest_id) where status='pending';

create table public.moments (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade,
  created_by uuid not null references public.profiles(id), title text not null check(char_length(title) between 1 and 120),
  story text not null default '' check(char_length(story)<=10000), moment_at timestamptz not null, timezone text not null default 'UTC',
  mood text, category text not null default 'Everyday Memory' check(char_length(category)<=50), location_name text,
  latitude numeric(9,6), longitude numeric(9,6), is_favorite boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index moments_nest_date_idx on public.moments(nest_id,moment_at desc);
create table public.moment_media (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade,
  moment_id uuid not null references public.moments(id) on delete cascade, storage_path text not null,
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp','image/avif')), alt_text text not null default '',
  width integer, height integer, sort_order smallint not null default 0, created_at timestamptz not null default now(), unique(moment_id,storage_path)
);
create table public.love_notes (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id), recipient_id uuid not null references public.profiles(id),
  body text not null check(char_length(body) between 1 and 3000), theme text not null default 'Love',
  status public.note_status not null default 'delivered', deliver_at timestamptz not null default now(), delivered_at timestamptz, opened_at timestamptz,
  created_at timestamptz not null default now(), constraint different_note_participants check(sender_id<>recipient_id)
);
create index love_notes_delivery_idx on public.love_notes(status,deliver_at) where status='scheduled';
create table public.thinking_of_you_events (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id), recipient_id uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create index thinking_cooldown_idx on public.thinking_of_you_events(sender_id,created_at desc);
create table public.daily_moods (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade,
  user_id uuid not null references public.profiles(id), local_date date not null, mood text not null check(char_length(mood)<=30),
  note text check(char_length(note)<=300), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,local_date)
);
create table public.daily_questions (
  id uuid primary key default gen_random_uuid(), question text not null unique check(char_length(question) between 5 and 300), category text not null, active boolean not null default true, created_at timestamptz not null default now()
);
create table public.daily_question_assignments (
  nest_id uuid not null references public.nests(id) on delete cascade, local_date date not null, question_id uuid not null references public.daily_questions(id),
  created_at timestamptz not null default now(), primary key(nest_id,local_date)
);
create table public.daily_question_answers (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade,
  question_id uuid not null references public.daily_questions(id), local_date date not null, user_id uuid not null references public.profiles(id),
  answer text not null check(char_length(answer) between 1 and 2000), answered_at timestamptz not null default now(), unique(nest_id,local_date,user_id)
);

create table public.date_ideas (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null, duration_minutes integer not null check(duration_minutes between 5 and 480),
  category text not null, instructions text[] not null default '{}', active boolean not null default true
);
create table public.saved_date_ideas (nest_id uuid not null references public.nests(id) on delete cascade, idea_id uuid not null references public.date_ideas(id) on delete cascade, saved_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), primary key(nest_id,idea_id));
create table public.challenges (id uuid primary key default gen_random_uuid(), title text not null unique, description text not null, duration_days smallint not null check(duration_days between 1 and 31), prompts text[] not null);
create table public.nest_challenges (id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade, challenge_id uuid not null references public.challenges(id), started_by uuid not null references public.profiles(id), starts_on date not null, completed_at timestamptz, created_at timestamptz not null default now());
create table public.challenge_completions (nest_challenge_id uuid not null references public.nest_challenges(id) on delete cascade, user_id uuid not null references public.profiles(id), day_number smallint not null check(day_number>0), reflection text check(char_length(reflection)<=1000), completed_at timestamptz not null default now(), primary key(nest_challenge_id,user_id,day_number));

create table public.meetups (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade, created_by uuid not null references public.profiles(id),
  title text not null default 'Our next hello', starts_at timestamptz not null, ends_at timestamptz, timezone text not null,
  destination text not null, notes text check(char_length(notes)<=3000), cover_path text, travel_info jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at is null or ends_at>=starts_at)
);
create index meetups_upcoming_idx on public.meetups(nest_id,starts_at);
create table public.meetup_tasks (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade, meetup_id uuid not null references public.meetups(id) on delete cascade,
  created_by uuid not null references public.profiles(id), assigned_to uuid references public.profiles(id), title text not null check(char_length(title)<=160),
  description text check(char_length(description)<=1000), category text not null default 'Custom', completed boolean not null default false,
  due_date date, notes text check(char_length(notes)<=1000), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade, created_by uuid not null references public.profiles(id),
  title text not null check(char_length(title)<=160), description text check(char_length(description)<=3000), image_path text, category text,
  location_name text, latitude numeric(9,6), longitude numeric(9,6), status public.wishlist_status not null default 'dream', notes text check(char_length(notes)<=2000),
  converted_moment_id uuid references public.moments(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.time_capsules (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade, created_by uuid not null references public.profiles(id),
  title text not null check(char_length(title)<=160), encrypted_content text not null check(char_length(encrypted_content)<=10000), unlock_at timestamptz not null,
  target_timezone text not null, strict_lock boolean not null default true, opened_at timestamptz, created_at timestamptz not null default now()
);
create table public.time_capsule_media (id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade, capsule_id uuid not null references public.time_capsules(id) on delete cascade, storage_path text not null, mime_type text not null, created_at timestamptz not null default now());
create table public.important_dates (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade, created_by uuid not null references public.profiles(id),
  title text not null check(char_length(title)<=160), event_date date not null, timezone text not null default 'UTC', category text not null default 'Custom', recurring_yearly boolean not null default false,
  remind_days_before smallint[] not null default '{7,1}', notes text check(char_length(notes)<=1000), created_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade, recipient_id uuid not null references public.profiles(id),
  actor_id uuid references public.profiles(id), kind public.notification_kind not null, title text not null, body text not null,
  target_path text check(target_path is null or target_path like '/%'), read_at timestamptz, created_at timestamptz not null default now()
);
create index notifications_inbox_idx on public.notifications(recipient_id,created_at desc);
create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade, notifications jsonb not null default '{"love_note":true,"thinking_of_you":true,"mood":true,"question_unlocked":true,"challenge":true,"meetup":true,"important_date":true,"capsule":true,"wishlist":true,"moment":true}',
  reduced_motion boolean, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.push_subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, endpoint text not null unique, p256dh text not null, auth text not null, created_at timestamptz not null default now(), last_used_at timestamptz);
create table public.recaps (id uuid primary key default gen_random_uuid(), nest_id uuid not null references public.nests(id) on delete cascade, period_start date not null, period_end date not null, kind text not null check(kind in ('monthly','yearly')), data jsonb not null, generated_at timestamptz not null default now(), unique(nest_id,kind,period_start));

create schema if not exists app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to authenticated;

create or replace function app_private.is_nest_member(p_nest_id uuid, p_user_id uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.nest_members m where m.nest_id=p_nest_id and m.user_id=p_user_id and m.status='active') $$;
create or replace function app_private.is_nest_partner(p_nest_id uuid,p_user_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select app_private.is_nest_member(p_nest_id,p_user_id) $$;
create or replace function app_private.active_member_count(p_nest_id uuid) returns integer language sql stable security definer set search_path='' as $$ select count(*)::integer from public.nest_members where nest_id=p_nest_id and status='active' $$;

create or replace function public.create_nest(p_name text,p_relationship_start date default null) returns uuid language plpgsql security definer set search_path='' as $$ declare v_id uuid; begin if auth.uid() is null then raise exception 'authentication required'; end if; if exists(select 1 from public.nest_members where user_id=auth.uid() and status='active') then raise exception 'already belongs to a nest'; end if; insert into public.nests(name,relationship_start,created_by) values(left(trim(p_name),80),p_relationship_start,auth.uid()) returning id into v_id; insert into public.nest_members(nest_id,user_id) values(v_id,auth.uid()); return v_id; end $$;
create or replace function public.create_nest_invitation(p_nest_id uuid,p_email citext default null) returns text language plpgsql security definer set search_path='' as $$ declare v_token text; begin if not app_private.is_nest_member(p_nest_id,auth.uid()) then raise exception 'forbidden'; end if; if app_private.active_member_count(p_nest_id)>=2 then raise exception 'nest is full'; end if; update public.nest_invitations set status='revoked' where nest_id=p_nest_id and status='pending'; v_token:=upper(encode(gen_random_bytes(6),'hex')); insert into public.nest_invitations(nest_id,invited_by,invited_email,token_hash) values(p_nest_id,auth.uid(),lower(p_email),encode(digest(v_token,'sha256'),'hex')); return v_token; end $$;
create or replace function public.accept_nest_invitation(p_token text) returns uuid language plpgsql security definer set search_path='' as $$ declare v_inv public.nest_invitations; begin if auth.uid() is null then raise exception 'authentication required'; end if; select * into v_inv from public.nest_invitations where token_hash=encode(digest(upper(trim(p_token)),'sha256'),'hex') for update; if not found or v_inv.status<>'pending' or v_inv.expires_at<=now() then raise exception 'invitation invalid or expired'; end if; if v_inv.invited_email is not null and lower(v_inv.invited_email)<>lower(coalesce(auth.jwt()->>'email','')) then raise exception 'invitation belongs to another email'; end if; if exists(select 1 from public.nest_members where user_id=auth.uid() and status='active') then raise exception 'already belongs to a nest'; end if; if app_private.active_member_count(v_inv.nest_id)>=2 then raise exception 'nest is full'; end if; insert into public.nest_members(nest_id,user_id) values(v_inv.nest_id,auth.uid()); update public.nest_invitations set status='accepted',accepted_by=auth.uid(),accepted_at=now() where id=v_inv.id; return v_inv.nest_id; end $$;

create or replace function public.send_thinking_of_you(p_nest_id uuid) returns uuid language plpgsql security definer set search_path='' as $$ declare v_recipient uuid; v_id uuid; begin if not app_private.is_nest_member(p_nest_id,auth.uid()) then raise exception 'forbidden'; end if; if exists(select 1 from public.thinking_of_you_events where sender_id=auth.uid() and created_at>now()-interval '15 minutes') then raise exception 'A little pause keeps this gesture meaningful'; end if; select user_id into v_recipient from public.nest_members where nest_id=p_nest_id and user_id<>auth.uid() and status='active'; if v_recipient is null then raise exception 'partner has not joined'; end if; insert into public.thinking_of_you_events(nest_id,sender_id,recipient_id) values(p_nest_id,auth.uid(),v_recipient) returning id into v_id; insert into public.notifications(nest_id,recipient_id,actor_id,kind,title,body,target_path) values(p_nest_id,v_recipient,auth.uid(),'thinking_of_you','Thinking of you','Your partner is thinking about you.','/home'); return v_id; end $$;

create or replace function public.get_daily_answers(p_nest_id uuid,p_date date) returns table(user_id uuid,answer text,answered_at timestamptz,unlocked boolean) language sql stable security definer set search_path='' as $$ select a.user_id, case when (select count(*) from public.daily_question_answers x where x.nest_id=p_nest_id and x.local_date=p_date)=2 or a.user_id=auth.uid() then a.answer else null end, a.answered_at, (select count(*) from public.daily_question_answers x where x.nest_id=p_nest_id and x.local_date=p_date)=2 from public.daily_question_answers a where a.nest_id=p_nest_id and a.local_date=p_date and app_private.is_nest_member(p_nest_id,auth.uid()) $$;
create or replace function public.open_time_capsule(p_capsule_id uuid) returns table(id uuid,title text,content text,unlock_at timestamptz,opened_at timestamptz) language plpgsql security definer set search_path='' as $$ declare v public.time_capsules; begin select * into v from public.time_capsules t where t.id=p_capsule_id and app_private.is_nest_member(t.nest_id,auth.uid()); if not found then raise exception 'not found'; end if; if v.unlock_at>now() then raise exception 'capsule is still locked'; end if; update public.time_capsules set opened_at=coalesce(public.time_capsules.opened_at,now()) where public.time_capsules.id=p_capsule_id; return query select v.id,v.title,v.encrypted_content,v.unlock_at,coalesce(v.opened_at,now()); end $$;

create or replace function app_private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end $$;
create trigger touch_profiles before update on public.profiles for each row execute function app_private.touch_updated_at();
create trigger touch_nests before update on public.nests for each row execute function app_private.touch_updated_at();
create trigger touch_moments before update on public.moments for each row execute function app_private.touch_updated_at();
create trigger touch_moods before update on public.daily_moods for each row execute function app_private.touch_updated_at();
create trigger touch_meetups before update on public.meetups for each row execute function app_private.touch_updated_at();
create trigger touch_meetup_tasks before update on public.meetup_tasks for each row execute function app_private.touch_updated_at();
create trigger touch_wishlist before update on public.wishlist_items for each row execute function app_private.touch_updated_at();

create or replace function app_private.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),split_part(new.email,'@',1))); insert into public.user_preferences(user_id) values(new.id); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function app_private.handle_new_user();

alter table public.profiles enable row level security; alter table public.nests enable row level security; alter table public.nest_members enable row level security; alter table public.nest_invitations enable row level security;
alter table public.moments enable row level security; alter table public.moment_media enable row level security; alter table public.love_notes enable row level security; alter table public.thinking_of_you_events enable row level security; alter table public.daily_moods enable row level security; alter table public.daily_questions enable row level security; alter table public.daily_question_assignments enable row level security; alter table public.daily_question_answers enable row level security;
alter table public.date_ideas enable row level security; alter table public.saved_date_ideas enable row level security; alter table public.challenges enable row level security; alter table public.nest_challenges enable row level security; alter table public.challenge_completions enable row level security;
alter table public.meetups enable row level security; alter table public.meetup_tasks enable row level security; alter table public.wishlist_items enable row level security; alter table public.time_capsules enable row level security; alter table public.time_capsule_media enable row level security; alter table public.important_dates enable row level security; alter table public.notifications enable row level security; alter table public.user_preferences enable row level security; alter table public.push_subscriptions enable row level security; alter table public.recaps enable row level security;

create policy profiles_self_or_partner_read on public.profiles for select using(id=auth.uid() or exists(select 1 from public.nest_members me join public.nest_members them using(nest_id) where me.user_id=auth.uid() and me.status='active' and them.user_id=profiles.id and them.status='active'));
create policy profiles_self_update on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy nest_member_read on public.nests for select using(app_private.is_nest_member(id)); create policy nest_member_update on public.nests for update using(app_private.is_nest_member(id)) with check(app_private.is_nest_member(id));
create policy nest_members_read on public.nest_members for select using(app_private.is_nest_member(nest_id));
create policy invites_member_read on public.nest_invitations for select using(app_private.is_nest_member(nest_id));

-- Uniform nest membership policies for ordinary shared resources.
create policy moments_read on public.moments for select using(app_private.is_nest_member(nest_id)); create policy moments_insert on public.moments for insert with check(app_private.is_nest_member(nest_id) and created_by=auth.uid()); create policy moments_update on public.moments for update using(app_private.is_nest_member(nest_id)) with check(app_private.is_nest_member(nest_id)); create policy moments_delete on public.moments for delete using(app_private.is_nest_member(nest_id));
create policy media_read on public.moment_media for select using(app_private.is_nest_member(nest_id)); create policy media_write on public.moment_media for insert with check(app_private.is_nest_member(nest_id)); create policy media_delete on public.moment_media for delete using(app_private.is_nest_member(nest_id));
create policy notes_read on public.love_notes for select using(app_private.is_nest_member(nest_id) and (sender_id=auth.uid() or (recipient_id=auth.uid() and deliver_at<=now() and status<>'scheduled'))); create policy notes_insert on public.love_notes for insert with check(app_private.is_nest_member(nest_id) and sender_id=auth.uid() and app_private.is_nest_partner(nest_id,recipient_id)); create policy notes_update on public.love_notes for update using(app_private.is_nest_member(nest_id) and (sender_id=auth.uid() or recipient_id=auth.uid())); create policy notes_delete on public.love_notes for delete using(sender_id=auth.uid());
create policy thinking_read on public.thinking_of_you_events for select using(app_private.is_nest_member(nest_id));
create policy moods_read on public.daily_moods for select using(app_private.is_nest_member(nest_id)); create policy moods_insert on public.daily_moods for insert with check(app_private.is_nest_member(nest_id) and user_id=auth.uid()); create policy moods_update on public.daily_moods for update using(user_id=auth.uid()) with check(user_id=auth.uid() and app_private.is_nest_member(nest_id));
create policy public_questions_read on public.daily_questions for select to authenticated using(active); create policy assignments_read on public.daily_question_assignments for select using(app_private.is_nest_member(nest_id));
-- Direct select is deliberately restricted to the answer owner. Partner reads go through get_daily_answers().
create policy answer_own_read on public.daily_question_answers for select using(user_id=auth.uid() and app_private.is_nest_member(nest_id)); create policy answer_own_insert on public.daily_question_answers for insert with check(user_id=auth.uid() and app_private.is_nest_member(nest_id)); create policy answer_own_update on public.daily_question_answers for update using(user_id=auth.uid()) with check(user_id=auth.uid() and app_private.is_nest_member(nest_id));
create policy ideas_read on public.date_ideas for select to authenticated using(active); create policy saved_ideas_all on public.saved_date_ideas for all using(app_private.is_nest_member(nest_id)) with check(app_private.is_nest_member(nest_id) and saved_by=auth.uid()); create policy challenges_read on public.challenges for select to authenticated using(true);
create policy nest_challenges_all on public.nest_challenges for all using(app_private.is_nest_member(nest_id)) with check(app_private.is_nest_member(nest_id) and started_by=auth.uid()); create policy completions_all on public.challenge_completions for all using(exists(select 1 from public.nest_challenges nc where nc.id=nest_challenge_id and app_private.is_nest_member(nc.nest_id))) with check(user_id=auth.uid() and exists(select 1 from public.nest_challenges nc where nc.id=nest_challenge_id and app_private.is_nest_member(nc.nest_id)));
create policy meetups_all on public.meetups for all using(app_private.is_nest_member(nest_id)) with check(app_private.is_nest_member(nest_id)); create policy meetup_tasks_all on public.meetup_tasks for all using(app_private.is_nest_member(nest_id)) with check(app_private.is_nest_member(nest_id)); create policy wishlist_all on public.wishlist_items for all using(app_private.is_nest_member(nest_id)) with check(app_private.is_nest_member(nest_id));
-- Capsule bodies never leave via table SELECT. Only metadata is exposed by this view; content is returned by time-gated RPC.
create policy capsule_creator_metadata on public.time_capsules for select using(created_by=auth.uid() and app_private.is_nest_member(nest_id)); create policy capsule_insert on public.time_capsules for insert with check(created_by=auth.uid() and app_private.is_nest_member(nest_id)); create policy capsule_delete on public.time_capsules for delete using(created_by=auth.uid() and app_private.is_nest_member(nest_id));
create policy capsule_media_creator on public.time_capsule_media for all using(exists(select 1 from public.time_capsules c where c.id=capsule_id and c.created_by=auth.uid() and app_private.is_nest_member(c.nest_id))) with check(exists(select 1 from public.time_capsules c where c.id=capsule_id and c.created_by=auth.uid() and app_private.is_nest_member(c.nest_id)));
create policy dates_all on public.important_dates for all using(app_private.is_nest_member(nest_id)) with check(app_private.is_nest_member(nest_id));
create policy notifications_recipient on public.notifications for select using(recipient_id=auth.uid()); create policy notifications_update on public.notifications for update using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
create policy preferences_self on public.user_preferences for all using(user_id=auth.uid()) with check(user_id=auth.uid()); create policy push_self on public.push_subscriptions for all using(user_id=auth.uid()) with check(user_id=auth.uid()); create policy recaps_read on public.recaps for select using(app_private.is_nest_member(nest_id));

-- Storage object names must begin with the owning user for avatars or nest UUID for shared buckets.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('avatars','avatars',false,5242880,array['image/jpeg','image/png','image/webp','image/avif']),
 ('moment-media','moment-media',false,15728640,array['image/jpeg','image/png','image/webp','image/avif']),
 ('time-capsules','time-capsules',false,15728640,array['image/jpeg','image/png','image/webp','image/avif']),
 ('wishlist-images','wishlist-images',false,10485760,array['image/jpeg','image/png','image/webp','image/avif']),
 ('relationship-assets','relationship-assets',false,15728640,array['image/jpeg','image/png','image/webp','image/avif']) on conflict(id) do nothing;
create policy avatar_owner_read on storage.objects for select using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text); create policy avatar_owner_write on storage.objects for insert with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy shared_media_read on storage.objects for select using(bucket_id in('moment-media','time-capsules','wishlist-images','relationship-assets') and app_private.is_nest_member(((storage.foldername(name))[1])::uuid));
create policy shared_media_insert on storage.objects for insert with check(bucket_id in('moment-media','time-capsules','wishlist-images','relationship-assets') and app_private.is_nest_member(((storage.foldername(name))[1])::uuid) and owner_id=auth.uid()::text);
create policy shared_media_update on storage.objects for update using(bucket_id in('moment-media','time-capsules','wishlist-images','relationship-assets') and app_private.is_nest_member(((storage.foldername(name))[1])::uuid) and owner_id=auth.uid()::text);
create policy shared_media_delete on storage.objects for delete using(bucket_id in('moment-media','time-capsules','wishlist-images','relationship-assets') and app_private.is_nest_member(((storage.foldername(name))[1])::uuid) and owner_id=auth.uid()::text);

grant execute on function public.create_nest(text,date), public.create_nest_invitation(uuid,citext), public.accept_nest_invitation(text), public.send_thinking_of_you(uuid), public.get_daily_answers(uuid,date), public.open_time_capsule(uuid) to authenticated;
revoke all on public.time_capsules from anon,authenticated; grant select(id,nest_id,created_by,title,unlock_at,target_timezone,strict_lock,opened_at,created_at),insert(id,nest_id,created_by,title,encrypted_content,unlock_at,target_timezone,strict_lock,opened_at,created_at),delete on public.time_capsules to authenticated;

alter publication supabase_realtime add table public.daily_moods, public.meetup_tasks, public.wishlist_items, public.notifications, public.moments;
