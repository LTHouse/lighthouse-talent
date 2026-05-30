# CLAUDE.md — project source of truth

This file is for AI agents working on this codebase. `README.md` is for humans; this is for Claude (and any other agent). Keep it accurate as the project evolves — when a decision gets made, record it here.

## What this is

Lighthouse Talent is a curated talent portal that **Zap** runs under **lt.house**. She and her assistant **Lorenzo** are constantly meeting strong people through events and referrals — folks who are qualified for startups and want startup work, most often passive candidates who have a job today but would leave for the right opportunity. The portal exists to filter out the noise of the public job market and surface only that pre-vetted talent to hiring startups.

Startups **pay Zap a fixed rate for access** to the portal, where they search for talent matching what they're hiring for and then either **reach out directly** or **ask Zap for an intro**. The product's whole job is to simplify and automate the triage motion that Zap and Lorenzo do by hand today: matching the right pre-curated person to the right startup.

There are three roles in the product:

- **Talent** — apply / get sourced, get curated and listed.
- **Companies (startups)** — pay for access, browse and search talent, reach out or request an intro.
- **Admin** — Zap and Lorenzo: curate and vet talent, manage company access, run the business.

## Who's involved

- **Zap** — operator, runs lt.house. Owns the business and product direction.
- **Lorenzo** — operator, Zap's assistant. Sources and triages talent.
- **Mike** — developer.

AI agents work **on behalf of these humans, not autonomously.** Decisions that change the product, the business, or anything a startup pays for go through a human — surface the question, don't decide it yourself.

## Stack

- **Today:** Vite + React 18 + Tailwind. Icons via `lucide-react`, charts via `recharts`. No TypeScript yet.
- **Phase 2:** Supabase backend (`@supabase/supabase-js` is already a dependency). Real persistence, auth, and data access land here.
- **Phase 3 (possible):** migration to Next.js + TypeScript.

## Where things live

- `src/App.jsx` — effectively the entire app today (~2700 lines). This will be split into components/routes as Phase 2 progresses.
- `src/data.js` — data (currently large; moves to Supabase in Phase 2).
- `src/auth.jsx` — auth scaffolding.
- `src/lib/` — shared helpers.
- `docs/` — project docs (e.g. `supabase-migrations.md`).

Don't refactor `App.jsx` into pieces as a side effect of an unrelated change — that split is its own deliberate piece of work.

## Workflow

To ship a change:

1. Open a GitHub issue describing the change.
2. Tag `@claude` in a comment to have an agent pick it up.
3. Run `npm run build` and confirm it passes before committing — never push a broken build.
4. Open a PR; review it.
5. Merge.

See `README.md` for the human-facing version.

## Non-negotiables

These are never-cross lines. A violation causes real, hard-to-undo damage — surface the situation to a human rather than work around any of them.

**Technical**

1. **Never commit secrets, and never put the Supabase service-role key (or any privileged key) in client-side code.** This is a client-only app — everything in the code ships to the browser. The client uses the **anon key + Row Level Security** only.
2. **Never run an irreversible destructive operation against production data.** No `DELETE` or `UPDATE` without a `WHERE` clause, no dropping or truncating tables — not without explicit human sign-off.
3. **Never push directly to `main`.** Every change goes through a PR.

**Product**

4. **Never auto-list unvetted talent.** A person is only visible in the portal after Zap or Lorenzo has curated/vetted them. Intake never publishes straight to the portal.
5. **Keep the portal gated to paying startups.** Talent is only exposed to startups who have paid for access — never to unpaid or public visitors.
