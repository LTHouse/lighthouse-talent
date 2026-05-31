# Lighthouse Talent — AI source of truth

> README.md is for humans. **This file is for AI agents.** Read it first, every time.
> It is authoritative. If something here conflicts with an old comment in the code,
> this file wins — but if you think this file is wrong, say so in your PR instead of
> silently diverging.

## What this is

Lighthouse Talent is a **curated startup-talent network for Nashville**. It is a
portal that startups **pay to access**. There are three kinds of user:

- **Talent** — people who apply to join the network, get vetted, and get listed.
- **Companies** — startups who pay to browse the vetted talent and request warm
  intros to candidates they like.
- **Admin** — the Lighthouse team (Lorenzo, Zap) who curate the network: vet
  applicants, feature talent, approve intros, and run the business.

The product makes money from companies. Talent is free to apply. Admin is the
internal control room. (An `investor` role exists dormant in the schema — no UI
today; don't delete it, don't build for it.)

## Who's involved

- **Lorenzo** — operator (runs the business, owns relationships).
- **Zap** — operator (curation, vetting, day-to-day).
- **Mike** — developer / owner of the technical platform.

AI agents work **on behalf of these humans**, never autonomously against their
interests. When product scope is ambiguous, ask in a PR comment — don't invent.

## Stack

**Migrating to Next.js + TypeScript** (owner decision, 2026-05-31). The new app and the legacy Vite app coexist until parity, then the Vite app is retired (#25).

- **Target (`next-app/`):** Next.js 16 (App Router) + React 19 + **TypeScript (strict + `noUncheckedIndexedAccess`)** + Tailwind v4. `@supabase/ssr` for cookie-based server auth. New work goes here — follow the `typescript-standards` skill.
- **Legacy (`src/`):** the original Vite + React 18 SPA, still the deployed prod app at the repo root until cutover. Don't add features here.
- **Backend:** Supabase (Postgres + Auth + RLS + Edge Functions). Project ref `rdnfckhtheescralfkwn`.
- **Auth:** Supabase Auth — **LinkedIn OIDC primary**, email magic-link fallback.
- **Hosting:** Vercel (project `lighthouse-talent`, prod branch `main`).
- **Next 16 note:** middleware is `proxy.ts`; `cookies()`/`searchParams` are async. It's not the Next.js in your training — check `next-app/node_modules/next/dist/docs/`.

## Where things live

**`next-app/` — the target app (new work goes here):**
- `next-app/app/` — App Router routes: `/` (landing + login), `/admin`, `/company`,
  `/talent`, `/auth/callback`. Server Components by default.
- `next-app/lib/data/` — **the data layer: the ONLY place that queries Supabase.**
  Components call typed functions here; they never build queries inline.
- `next-app/lib/supabase/` — `server.ts` / `client.ts` clients; `next-app/proxy.ts`
  refreshes the session (Next 16's middleware).
- `next-app/lib/auth.ts` — server-side session + role resolution.
- `next-app/lib/database.types.ts` — generated DB types (`npm run gen:types`).
- `next-app/components/` — decomposed, reusable UI.

**`src/` — the legacy Vite app (deployed today; don't add features):**
- `src/App.jsx` (~2700-line monolith), `src/lib/data.jsx` (its data layer),
  `src/auth.jsx`. Being replaced route-by-route by `next-app/`.

**Shared:**
- `supabase/migrations/` — **the source of truth for the DB schema.** Never
  hand-edit the DB in ways not captured here.
- `scripts/` — operational scripts (seed, one-off SQL). Service-role key only here.
- `.claude/agents/` — `builder` + `reviewer` subagents. `.claude/skills/` —
  installed expertise (Supabase, Postgres, React, TypeScript).

## How to ship a change (the workflow)

1. A change starts as a **GitHub issue** (use the Feature/Bug templates). The
   issue's acceptance criteria are the contract.
2. One issue → one branch → one PR. Branch off fresh `origin/main`. Conventional
   commit prefixes (`feat:` / `fix:` / `chore:` / `refactor:` / `docs:` / `test:`).
3. **Before merging, the mechanical gate (this replaces a human approver):**
   - `npm run build` passes. **Non-negotiable.**
   - Tests pass (add/extend them with your change).
   - The **reviewer** agent reviews the diff and its blocking findings are fixed.
   - For UI changes, verify the flow in a real browser (Playwright).
4. PR body explains: what changed, why, how you verified, follow-ups. Then merge
   and close the issue (`Closes #N`).
5. **Never merge red. Never weaken a check to make it pass.** Fix forward.

See `README.md` for the operator-facing (non-technical) version of this.

## Non-negotiables

1. **Always run `npm run build` before committing.** If it fails, you are not done.
2. **Never run `DELETE` or `UPDATE` against a Supabase table without a `WHERE`
   clause.** No exceptions. Destructive/seed scripts use the service-role key from
   `.env.ops.local` and are reviewed before running against prod.
3. **The data layer is the only code that queries Supabase** (`next-app/lib/data/`
   in the new app, `src/lib/data.jsx` in the legacy one). UI calls it, never
   `supabase` directly.
4. **Secrets never enter client code or the bundle.** Only `NEXT_PUBLIC_*` (new
   app) / `VITE_*` (legacy) reach the browser; everything else is a secret. The
   service-role key is for `scripts/` and Edge Functions only.
5. **Don't invent product scope.** If a change needs a feature no issue describes,
   stop and ask in a PR comment.
6. **KISS.** One backend (Supabase), one auth stack, boring proven tools. No Redux,
   no GraphQL, no premature abstraction.

## Environment & secrets

- `.env` — public `VITE_*` vars, **dotenvx-encrypted and committed** (safe; Vite
  inlines them into the browser anyway). Decryption key is `.env.keys` (gitignored).
- `.env.ops.local` — **gitignored, local-only** god-mode secrets (service-role key,
  Vercel token, Resend key, LinkedIn client secret). Use via
  `dotenvx run -f .env.ops.local -- <command>`.
- npm scripts are wrapped in `dotenvx run`. The new app's public vars are
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same encrypted
  `.env`); the legacy app uses the `VITE_*` equivalents.
- LinkedIn OAuth client id/secret live in the **Supabase dashboard** (Auth →
  Providers → LinkedIn OIDC), not in the app.

## Data model quick reference

- `candidates` — talent profiles. `is_demo=true` rows are seed/demo and are hidden
  from companies via RLS. `status` enum: `applied → reviewing → vetting_scheduled →
  active / pre_onboard / hidden / archived`.
- `users` — joins `auth.users` to a `role` (`talent`/`company`/`admin`/`investor`)
  and an optional `candidate_id` / `company_id`. **Never silently grant a default
  role** — no `public.users` row means "not set up yet".
- `companies`, `intro_requests`, `featured_talent_weeks`, `featured_candidates`,
  `platform_settings` (holds the `outbound_emails` master toggle, ships disabled).

RLS is enabled on **every** table. The `supabase` skill in `.claude/skills/` is
authoritative on the policy patterns.

## Decisions

- **2026-05-31 — Migrate to Next.js 16 + TypeScript.** Owner's call. The new app
  lives in `next-app/` and is built to Vercel/Supabase/TS best practices (strict
  TS, `@supabase/ssr`, generated DB types, decomposed components). It coexists with
  the legacy Vite app until parity, then Vite is retired (#25). (An earlier spike
  had recommended staying on Vite; the owner reviewed and chose to migrate anyway.)
