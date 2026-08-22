# DNest security policy

DNest stores intimate shared content. Treat privacy failures as high severity.

## Authorization model

Authentication is provided by Supabase Auth and refreshed through the Next.js proxy. Authorization is PostgreSQL Row Level Security. `app_private.is_nest_member` is the central predicate; user-supplied `nest_id`, `user_id`, creator, and recipient fields are never sufficient on their own. A partial unique index restricts a user to one active Nest, invitation acceptance locks the row, and acceptance rejects a third active member.

Daily Question answers are directly selectable only by their author. `get_daily_answers` returns the partner’s body only after exactly two answers exist. Time Capsule content is excluded from normal column grants and is returned only by `open_time_capsule` after `unlock_at`. These rules do not depend on CSS or client state.

## Storage

All buckets are private. Shared paths begin with the Nest UUID and policies verify membership; avatar paths begin with the user UUID. MIME allowlists and bucket size ceilings are configured in migrations, server actions revalidate MIME/size, names are generated with UUIDs, and reads use expiring signed URLs. Do not make these buckets public.

## Request, browser, and secret security

- strict Zod validation at authentication and feature mutation boundaries
- origin verification on JSON mutation endpoints; SameSite Supabase cookies and Server Actions elsewhere
- production CSP, frame denial, nosniff, strict referrer and limited Permissions Policy
- private routes use `noindex`; `robots.txt` disallows authenticated paths
- service-role, VAPID private, cron, and provider secrets remain server-only
- analytics must never receive note/memory bodies, mood values, coordinates, answers, image paths, or invitation codes
- the service worker never caches Supabase responses or private media

## Production checklist

1. Rotate keys if any secret has entered source control or logs.
2. Apply every migration and verify RLS remains enabled on every private table.
3. Run cross-Nest select/insert/update/delete tests with two separate Nests.
4. Verify private storage denial using guessed object paths and expired signed URLs.
5. Verify invitation expiry/replay/email binding/third-member rejection.
6. Verify scheduled notes across representative time zones and DST boundaries.
7. Verify locked capsule and hidden-answer RPC behavior by calling Supabase directly.
8. Configure HTTPS, canonical Auth redirects, SMTP, VAPID, cron authentication, rate limits, backups, PITR, and log retention.
9. Review dependency audit results and CSP whenever dependencies change.

## Account and shared-Nest deletion

Export first. A single member may leave, but shared content must not be destroyed without the other member’s informed choice and the documented retention window. Production operators should authenticate the request, notify both members, revoke sessions/invitations, queue private object deletion, delete relational data transactionally, and retain only legally required audit metadata. Never perform this workflow with a browser-exposed service key.

## Reporting a vulnerability

Do not open a public issue containing personal data, tokens, or exploit details. Contact the private security address configured by the deployment owner. Include the affected route/table, reproduction steps, impact, and whether any real user data was accessed. The operator should acknowledge reports promptly, preserve evidence without logging private content, rotate compromised credentials, and notify affected users when required.
