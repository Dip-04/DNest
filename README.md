# DNest

**Our little place, no matter the distance.** DNest is a private, installable relationship companion for exactly two partners. It preserves memories, supports small daily rituals, and helps plan the next hello without becoming chat, a public network, or a relationship scorecard.

## Product surface

- Supabase email authentication, verification, password recovery, SSR sessions, and protected routes
- one Nest with a database-enforced maximum of two active members and hashed, expiring, one-use invitations
- Home dashboard with partner time, optional distance, days together, meetup countdown, moods, Thinking of You, On This Day, and recent Moments
- private Moments with multi-image upload, Memory Book, search/filter, and year-grouped relationship timeline
- immediate and scheduled Love Notes, daily hidden-until-both-answer questions, virtual date ideas, and couple challenges
- meetups, collaborative checklist, wishlist states, atomic Wishlist-to-Moment conversion, important dates, recaps, and server-enforced Time Capsules
- in-app notifications, Web Push registration, PWA manifest/service worker, offline shell, and authenticated private export

## Stack and architecture

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, Lucide, Framer Motion, Supabase PostgreSQL/Auth/Storage/Realtime/Edge Functions, Vitest, Testing Library, and Playwright.

The code is domain-oriented under `src/features`, with reusable UI in `src/components`, server/auth boundaries in `src/lib`, route composition in `src/app`, and versioned database infrastructure in `supabase`. Most pages are Server Components. Interactive countdowns, maps, push setup, and motion are isolated Client Components. Three.js is intentionally absent from public pages because it would not justify the additional JavaScript cost.

## Local development

Requirements: Node.js 22+, npm 10+, Supabase CLI, and a Supabase project.

```bash
npm ci
copy .env.example .env.local
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
npm run dev
```

Open `http://localhost:3000`. For a local Supabase stack, use `supabase start`, copy its URL and anon key into `.env.local`, then run `supabase db reset`.

## Environment variables

See `.env.example`. Set `NEXT_PUBLIC_APP_URL` to the canonical custom HTTPS origin in Vercel production, for example `https://dnest.example`. Metadata prefers that explicit value, falls back to Vercel's stable `VERCEL_PROJECT_PRODUCTION_URL`, and never fails a build merely because deployment variables are not yet available. Do not set the variable to a Vercel preview URL when a custom domain exists.

Only the Supabase URL, anon key, application URL, public map/VAPID key, analytics flag, and Google meta-verification value may be browser-visible. `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, cron secrets, and provider secrets are server-only.

## Database and migrations

`supabase/migrations` creates the schema, constraints, indexes, functions, triggers, RLS policies, private storage buckets, realtime publication entries, and static question/date-idea/challenge catalogs. Apply migrations in filename order with `supabase db push`.

Generate project-specific database types with:

```bash
supabase gen types typescript --linked > src/types/supabase.generated.ts
```

## Scheduled notes and notifications

```bash
supabase functions deploy deliver-scheduled-notes
supabase secrets set CRON_SECRET=... SUPABASE_SERVICE_ROLE_KEY=...
```

Invoke the function from Supabase Cron or an authenticated Vercel Cron. Configure VAPID variables for browser push registration. Notification payloads use generic copy and do not contain note bodies, moods, locations, answers, or memory content.

## SEO and indexing architecture

Public indexable routes are `/`, `/features`, `/privacy`, and `/terms`. They have unique descriptions, canonical URLs, Open Graph/Twitter cards, semantic content, and internal links. Only those four URLs appear in `/sitemap.xml`.

Auth, invite, onboarding, offline, API, callback, and authenticated Nest routes are excluded from the sitemap, disallowed in `robots.txt`, marked with `noindex, nofollow, nocache` metadata where HTML is rendered, and receive `X-Robots-Tag` protection. Robots directives supplement authentication and RLS; they are not used as an access-control mechanism.

The production domain is derived from `NEXT_PUBLIC_APP_URL`. Never set it to a Vercel preview URL when a custom domain exists. `/opengraph-image` contains only generic DNest branding and never renders user data.

## Google Search Console Setup

Google decides whether and when a URL is indexed. These steps make DNest eligible and observable; they do not guarantee ranking or immediate indexing.

1. Deploy DNest to Vercel and connect the intended custom production domain.
2. Set `NEXT_PUBLIC_APP_URL=https://YOUR_REAL_DOMAIN` in the Vercel Production environment.
3. Open [Google Search Console](https://search.google.com/search-console) and add DNest as a property.
4. Choose a **Domain property** to cover all protocols and subdomains. Domain properties use a DNS TXT record and do not use `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
5. Alternatively, choose a **URL-prefix property** for the exact canonical HTTPS origin. If Google offers the HTML tag method, copy only the value from `content="..."` into `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
6. Add the selected DNS record at the domain provider, or add the meta verification value to the Vercel Production environment.
7. Redeploy if using the meta-tag method, then complete verification in Search Console.
8. Open `https://YOUR_REAL_DOMAIN/robots.txt` and confirm the sitemap line points to the canonical domain.
9. Open `https://YOUR_REAL_DOMAIN/sitemap.xml` and confirm it contains only the four public marketing URLs.
10. In Search Console, open **Sitemaps**, submit `https://YOUR_REAL_DOMAIN/sitemap.xml`, and wait for it to be fetched.
11. Use **URL Inspection** on the canonical homepage, run the live test, and request indexing if the page is eligible.
12. Monitor Page Indexing, Core Web Vitals, Enhancements, and manual/security actions. Indexing can take time and is never guaranteed.

### Bing Webmaster Tools

The same standards-based sitemap works with Bing. Optionally add the site in [Bing Webmaster Tools](https://www.bing.com/webmasters), verify the domain or import the Search Console property, and submit the same `/sitemap.xml`. No Bing-specific application code is required.

## PWA and brand assets

`app/manifest.ts` declares standalone behavior, theme/background colors, 192px/512px standard icons, and full-bleed maskable variants. The reproducible icon generator is `scripts/generate-icons.py`; it requires Pillow. The service worker deliberately bypasses Supabase and never persists private API responses or signed media.

## Testing

```bash
npm run lint
npm run typecheck
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
```

Authenticated two-user and direct-RLS tests require a disposable Supabase project and two test accounts. Never point destructive fixtures at production.

## Deploy to Supabase and Vercel

1. Create a Supabase project, configure the canonical site URL and Auth redirects, then run `supabase db push`.
2. Deploy the Edge Function and configure cron and server-only secrets.
3. Import the repository into Vercel and add every required `.env.example` value to the correct environment.
4. Set `NEXT_PUBLIC_APP_URL` to the canonical custom HTTPS origin without a path. In Supabase Auth URL Configuration, set the Site URL to that same origin and add both `https://YOUR_DOMAIN/auth/callback` and `http://localhost:3000/auth/callback` to Redirect URLs. Supabase falls back to its Site URL when a requested redirect is not allow-listed, so leaving the Site URL on localhost causes production password-reset emails to open localhost.
5. Deploy, inspect `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/favicon.ico`, and `/opengraph-image`, then run the production smoke suite.

## Security model

See `SECURITY.md`. Supabase Auth establishes identity; RLS checks active Nest membership for every shared row and object; sensitive reads use reveal/time-gated RPCs; uploads have MIME/size limits and generated paths; signed URLs are short-lived; private exports are authenticated and `no-store`.

## Known deployment dependencies

- Supabase credentials are required for private routes and live RLS integration tests.
- Web Push delivery requires VAPID keys and a scheduler.
- Email quality and sender branding depend on the SMTP provider configured in Supabase Auth.
- Legal counsel must review the public Privacy and Terms pages and add the production operator’s legal details before launch.
- Nest deletion is creator-only, requires exact-name and browser confirmation, removes Nest-prefixed private Storage objects through the server-only service role, and then invokes an owner-checked database RPC. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only in every deployment.
