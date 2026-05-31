---
name: typescript-standards
description: Project TypeScript rules for the Next.js app (next-app/). Use when writing or reviewing any .ts/.tsx in this repo — strict mode, no any, typed DB boundary, Server vs Client Components.
---

# TypeScript standards (Lighthouse Talent — Next.js app)

Applies to everything under `next-app/`. The Vite app (`src/`) stays JS until it's
retired at cutover (#25).

## Hard rules
- **`strict: true` + `noUncheckedIndexedAccess: true`.** Don't relax tsconfig to
  make an error go away — fix the type. Array/record access can be `undefined`;
  handle it (`?? fallback`, a guard, or `.at()`).
- **No `any`.** If a type is genuinely unknown, use `unknown` and narrow. No
  `@ts-ignore` / `@ts-expect-error` without a one-line reason comment.
- **The database is the source of truth for types.** Import row/enum types from
  `@/lib/database.types` (regenerate with `npm run gen:types`). Never hand-write a
  shape that mirrors a table.
- **All DB access goes through the data layer** (`next-app/lib/data/*`). Components
  call typed functions; they never build Supabase queries inline. The browser
  never imports the service-role key.

## Conventions
- `type` for unions/aliases; `interface` for object shapes that may be extended.
- Validate external input (form bodies, webhook payloads, search params) at the
  boundary before trusting it. Prefer a small parser/guard over a cast.
- **Server Components by default.** Add `"use client"` only when you need state,
  effects, or browser APIs (e.g. the login screen, the sign-out button). Keep
  client components small and push data fetching to the server.
- Supabase: `lib/supabase/server.ts` in Server Components / Route Handlers /
  Server Actions (uses async `cookies()`); `lib/supabase/client.ts` in client
  components. Session refresh lives in `proxy.ts` (Next 16's middleware).
- Name files for their export; one component per file for anything non-trivial.

## Next 16 gotchas (this is NOT the Next.js in your training data)
- Middleware is now **`proxy.ts`** (root), exporting `proxy(request)`.
- `cookies()`, `headers()`, `params`, and `searchParams` are **async** — `await`
  them. `searchParams` is a `Promise` in page props.
- Before using an unfamiliar Next API, check `next-app/node_modules/next/dist/docs/`.

## Don't
- No `as` casting to silence the compiler. No disabling strict per-file.
- No data fetching in `proxy.ts` (it runs on every request).
- No secrets (anything not `NEXT_PUBLIC_`) in client components or the bundle.
