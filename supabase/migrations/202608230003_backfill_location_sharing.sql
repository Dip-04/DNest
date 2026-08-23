-- Existing coordinates came from the previous explicit "Use my current
-- location" action. Preserve that opt-in when introducing the sharing flag.
-- Rows stopped through the new control have location_updated_at populated and
-- are therefore never re-enabled by this one-time backfill.
update public.profiles
set location_sharing = true,
    location_updated_at = now()
where latitude is not null
  and longitude is not null
  and location_updated_at is null;
