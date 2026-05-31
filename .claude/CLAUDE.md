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

- **Today:** Vite + React 18 + Tailwind CSS. Single-page app.
- **Backend:** Supabase (Postgres + Auth + RLS + Edge Functions). Project ref
  `rdnfckhtheescralfkwn`.
- **Auth:** Supabase Auth — **LinkedIn OIDC is the primary sign-in**, email
  magic-link is the fallback.
- **Hosting:** Vercel (project `lighthouse-talent`, prod branch `main`).
- **Possible later:** a Next.js + TypeScript migration is a *spike with a "no"
  exit*. Do not start it without a documented "yes". Default expectation: stay on
  Vite.

## Where things live

- `src/App.jsx` — historically the entire app (~2700 lines). Being decomposed into
  feature modules under `src/features/` and shared bits under `src/components/`.
- `src/lib/supabase.js` — the Supabase client.
- `src/lib/data.*` — **the data layer: the ONLY place that talks to Supabase.**
  UI never imports the Supabase client directly. All reads/writes go through here.
- `src/auth.jsx` — auth context (`useAuth()`), the single seam for sign-in.
- `supabase/migrations/` — **the source of truth for the database schema.** Never
  hand-edit the DB in ways that aren't captured here.
- `scripts/` — operational scripts (seed, manual prod fixes). Use the service-role
  key only here, never in app code.
- `.claude/agents/` — the `builder` and `reviewer` subagents.
- `.claude/skills/` — installed expertise (Supabase, Postgres, React, etc.).

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
3. **The data layer (`src/lib/data.*`) is the only code that imports the Supabase
   client.** UI components call the data layer, never `supabase` directly.
4. **Secrets never enter client code or the bundle.** Anything not prefixed `VITE_`
   is a secret. The service-role key is for `scripts/` and Edge Functions only.
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
- npm scripts (`dev`/`build`/`preview`) are wrapped in `dotenvx run`.
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

- **2026-05-31 — Stay on Vite + React; Next.js migration rejected (NO-GO).** The
  #21 spike concluded 1/5 on its rubric (GO needs 4/5). This is an authenticated
  B2B portal, so SSR/SEO/server-component wins don't apply, while migrating the
  working 2,700-line app is high-cost. TypeScript can be adopted incrementally on
  Vite if wanted — that's a separate, smaller call. #22–#25 are closed `wontfix`.
  Full reasoning: [`docs/decisions/0001-stay-on-vite.md`](../docs/decisions/0001-stay-on-vite.md).
  **Don't re-litigate without new evidence** (e.g. a public SSR/SEO surface).
