# ADR 0002 — Migrate to Next.js + TypeScript (supersedes ADR 0001)

- **Date:** 2026-05-31
- **Decided by:** owner (explicit override of the spike's NO-GO)
- **Supersedes:** [ADR 0001](./0001-stay-on-vite.md)
- **Status:** Accepted — proceed with the Next.js 15 + TypeScript migration.

## Context

ADR 0001 recommended staying on Vite (the #21 spike scored 1/5). The **owner
reviewed that and chose to migrate anyway** — they want a Next.js 15 + TypeScript
codebase with a decomposed component architecture (the `App.jsx` monolith split
into modules), built to Vercel/Supabase/TS best practices.

That is a legitimate owner call: it prioritizes long-term codebase quality and the
"beautiful, typed, decomposed" target over the short-term KISS minimum. This ADR
records the override so the trail is honest.

## Decision

- Migrate to **Next.js 15 (App Router) + TypeScript (strict)**.
- `@supabase/ssr` for cookie-based server-side auth.
- Tailwind, theme ported to match the existing look exactly.
- Generated Supabase types as the source of truth for the data layer.
- Decompose: shared UI primitives + per-route, per-feature components — no monolith.
- #21–#25 reopened and back in scope.

## Migration strategy (incremental, not a risky big-bang)

1. Scaffold `next-app/` **alongside** the working Vite app (do not break prod).
2. Foundation first: SSR auth, typed data layer, generated DB types, theme, shared
   UI, route skeleton.
3. Port portals one at a time (admin → company → talent) against the established
   pattern.
4. **Cut over only at parity** (#25): point Vercel at the Next app, then archive/
   remove the Vite app. Until then both coexist.

## Consequences

- Bigger effort than ADR 0001's path; done incrementally to keep prod live.
- TypeScript strictness + generated DB types raise the floor for the vibecoder box.
