-- PostgreSQL requires a newly added enum value to commit before later migrations use it.
alter type public.notification_kind add value if not exists 'nest_deletion';
