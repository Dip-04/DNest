# DNest UI Redesign Plan

## Guardrails

- Preserve all routes, text content, Supabase queries, authentication, server actions, forms, validation, SEO, PWA behavior, and privacy controls.
- Keep private images and relationship data inside authenticated views.
- Limit Three.js to the public landing hero and provide a CSS-rendered fallback.
- Respect reduced-motion, keyboard navigation, contrast, and mobile performance.

## Existing UI Audit

- App Router with public marketing/legal pages, auth pages, invitation/onboarding, and one authenticated `(nest)` layout.
- Shared UI foundations: `AppShell`, `MarketingHeader/Footer`, `AuthCard`, `AnimatedPage`, `MomentCard`, `MoodPicker`, `MeetupCountdown`, `MemoryMap`, and `EmptyState`.
- Existing stack includes Tailwind CSS, Lucide, Framer Motion, `next/font`, `next/image`, and responsive E2E coverage.
- Current visuals use warm ivory/rose/plum tokens and a functional persisted theme switcher. Cards and feature pages share semantic CSS classes, making a design-system upgrade low risk.
- React Three Fiber, Drei, and Three.js are not currently installed and will be added only for the isolated landing hero.

## Implementation

1. Expand light/dark design tokens, texture, elevation, typography, buttons, fields, cards, and motion states.
2. Upgrade public and authenticated navigation with a refined nest mark, active states, mobile central-add treatment, and theme controls.
3. Build a lazy landing-only 3D nest using low-poly geometry, restrained lighting, pointer response, reduced DPR, visibility-aware rendering, and a no-WebGL/mobile fallback.
4. Recompose the existing landing content into an editorial hero, memory gallery, relationship path, letter, meetup, album, together, capsule, map, privacy, and final CTA presentation without changing product claims.
5. Restyle authentication as a split premium welcome surface while preserving every form field/action.
6. Apply shared visual metaphors to Moments, moods, countdowns, notes, timeline, wishlist, capsules, empty states, notifications, and settings through presentation-only classes.
7. Validate desktop/mobile and light/dark behavior, then run lint, TypeScript, unit tests, E2E, and production build.
