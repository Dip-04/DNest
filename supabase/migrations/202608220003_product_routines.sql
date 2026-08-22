create extension if not exists citext;

create or replace function public.get_or_assign_daily_question(p_nest_id uuid,p_date date) returns table(id uuid,question text,category text) language plpgsql security definer set search_path='' as $$
declare v_question_id uuid; v_count integer; v_offset integer;
begin
 if not app_private.is_nest_member(p_nest_id,auth.uid()) then raise exception 'forbidden'; end if;
 select question_id into v_question_id from public.daily_question_assignments where nest_id=p_nest_id and local_date=p_date;
 if v_question_id is null then
  select count(*) into v_count from public.daily_questions where active;
  if v_count=0 then raise exception 'no active questions'; end if;
  v_offset:=mod(abs(hashtext(p_nest_id::text||p_date::text)),v_count);
  select q.id into v_question_id from public.daily_questions q where q.active order by q.id offset v_offset limit 1;
  insert into public.daily_question_assignments(nest_id,local_date,question_id) values(p_nest_id,p_date,v_question_id) on conflict(nest_id,local_date) do update set question_id=public.daily_question_assignments.question_id returning question_id into v_question_id;
 end if;
 return query select q.id,q.question,q.category from public.daily_questions q where q.id=v_question_id;
end $$;

create or replace function app_private.notify_question_unlock() returns trigger language plpgsql security definer set search_path='' as $$
declare v_count integer; v_member uuid;
begin
 select count(*) into v_count from public.daily_question_answers where nest_id=new.nest_id and local_date=new.local_date;
 if v_count=2 then
  for v_member in select user_id from public.nest_members where nest_id=new.nest_id and status='active' loop
   insert into public.notifications(nest_id,recipient_id,kind,title,body,target_path) values(new.nest_id,v_member,'question_unlocked','Your answers are open','Both of you answered today’s question.','/questions');
  end loop;
 end if;
 return new;
end $$;
create trigger daily_answer_unlock after insert on public.daily_question_answers for each row execute function app_private.notify_question_unlock();

create or replace function public.convert_wishlist_to_moment(p_item_id uuid,p_moment_at timestamptz) returns uuid language plpgsql security definer set search_path='' as $$
declare v_item public.wishlist_items; v_id uuid;
begin
 select * into v_item from public.wishlist_items where id=p_item_id and app_private.is_nest_member(nest_id,auth.uid()) for update;
 if not found then raise exception 'not found'; end if;
 if v_item.converted_moment_id is not null then return v_item.converted_moment_id; end if;
 if v_item.status<>'done' then raise exception 'wishlist item is not done'; end if;
 insert into public.moments(nest_id,created_by,title,story,moment_at,category,location_name,latitude,longitude) values(v_item.nest_id,auth.uid(),v_item.title,coalesce(v_item.description,''),p_moment_at,'Wishlist Dream',v_item.location_name,v_item.latitude,v_item.longitude) returning id into v_id;
 update public.wishlist_items set converted_moment_id=v_id where id=p_item_id;
 return v_id;
end $$;

grant execute on function public.get_or_assign_daily_question(uuid,date),public.convert_wishlist_to_moment(uuid,timestamptz) to authenticated;
