alter type public.notification_kind add value if not exists 'period_tracker';

alter table public.user_preferences
  alter column notifications set default '{"love_note":true,"thinking_of_you":true,"mood":true,"question_unlocked":true,"challenge":true,"meetup":true,"important_date":true,"capsule":true,"wishlist":true,"moment":true,"period_tracker":true}'::jsonb;

update public.user_preferences
set notifications = jsonb_set(notifications, '{period_tracker}', 'true'::jsonb, true)
where not notifications ? 'period_tracker';
