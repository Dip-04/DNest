# DNest implementation plan

DNest is a private, mutually created space for exactly two partners. The implementation favors memories over messages, feeling over metrics, and small daily rituals over engagement pressure.

| Domain | Route | Main UI | Database / boundary | Permission | Test focus |
|---|---|---|---|---|---|
| Auth | `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` | Auth forms | Supabase Auth | Identity owner | session and validation |
| Pairing | `/onboarding`, `/invite/[token]` | Nest creation/invite | `nests`, `nest_members`, `nest_invitations`, `accept_nest_invitation()` | authenticated, max two | expiry, replay, third member |
| Home | `/home` | emotional dashboard | nest-scoped read models | active member | dates, empty states |
| Moments | `/moments`, `/moments/new` | gallery, timeline, editor | `moments`, `moment_media` + private storage | active member | CRUD and IDOR |
| Notes | `/notes` | note composer/history | `love_notes`, delivery worker | active member; recipient reveal | scheduling/timezone |
| Rituals | `/questions`, home | mood, question, thinking gesture | `daily_moods`, `daily_questions`, answers, events | active member; answer RPC hides early text | one/day, reveal rule, cooldown |
| Together | `/together` | ideas, surprise, challenges | ideas, favorites, challenges/completions | active member | filters/progress |
| Plans | `/plans` | meetup, tasks, wishlist, dates | meetups/tasks, wishlist, important dates | active member | realtime-safe writes, conversion |
| Memory | `/moments?view=book`, `/map`, `/capsules`, `/recaps` | book, map, locked reveal, recaps | locations, time capsules, recap views | active member; capsule RPC time-gates | lock enforcement |
| Notifications | `/notifications`, `/settings` | inbox/preferences | notifications, subscriptions/preferences | recipient only | read state, private payloads |
| PWA | manifest/service worker | install/offline shell | no private response caching | n/a | manifest/offline |

## Delivery phases

1. Next.js foundation, tokens, accessible shell, Supabase SSR auth.
2. Normalized PostgreSQL schema, helper functions, exhaustive RLS and private storage policies.
3. Core moments, rituals, notes, activities and planning experiences.
4. Notification/scheduling functions, PWA, privacy and production hardening.
5. Unit/component/E2E/security tests, CI, deployment documentation.

The repository includes production integrations. Local rendering without Supabase configuration stays on public pages; private product routes require a valid authenticated Supabase session.
