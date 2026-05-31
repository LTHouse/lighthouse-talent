# ADR 0001 — Stay on Vite + React; do NOT migrate to Next.js (for now)

- **Date:** 2026-05-31
- **Decided by:** autonomous build run (lead engineer), on the owner's KISS mandate
- **Issue:** #21 (Next.js spike). Gates #22–#25.
- **Status:** Accepted — **NO-GO** on the Vite→Next.js migration.

## Context

#21 is the one Phase-3 issue with an explicit **"no" exit**, and its rubric puts
the **burden of proof on YES**: *proceed only if 4 of 5 criteria affirmatively
pass.* The owner's standing guardrail (the build prompt) is even more pointed:

> "Stay on Vite + React 18 + Tailwind unless the #21 spike *proves* Next.js is
> clearly worth it. Default expectation: you finish M1 + M2 on Vite + TS and the
> Next.js migration remains a spike/decision, not a rushed cutover."

By the time the spike came up, **M1 and M2 were already delivered on Vite and
running in production** (real LinkedIn + magic-link auth, RLS, seeded data, live at
https://lighthouse-talent.vercel.app). So the question is not "can we ship on
Vite" — we demonstrably can — but "is Next.js *clearly worth* migrating a working,
deployed 2,700-line app."

## Decision rubric — scored honestly

A YES requires 4/5 to **pass**. Pass conditions are affirmative claims that can
only be proven by building the slice; where the build wasn't justified, the
criterion is recorded as **NOT DEMONSTRATED** (which is *not* a pass).

| Criterion | Pass condition | Result |
|---|---|---|
| Auth feels right | Cookie SSR session works first try, no hydration flicker | **N/A / not a gain** — client-side Supabase auth already works cleanly in prod (verified: LinkedIn + magic-link, role resolution, session persistence). SSR cookies would solve a flicker we don't have. |
| Type safety adds value | TS catches ≥1 bug the spike would've shipped | **NOT DEMONSTRATED** — plausible, but the data-layer boundary is already centralized and small; the win is marginal and doesn't require Next.js (TS can be adopted incrementally on Vite if desired). |
| Build/deploy faster or equal | Cold preview deploy < 90s | **NOT DEMONSTRATED** — current Vite prod builds finish in ~7s on Vercel; Next.js is very unlikely to be *faster*. |
| DX is better | Builder finishes spike in ≤3 days, no major friction | **NOT DEMONSTRATED** — and migrating the existing 2,700-line monolith (not just the spike) is days of risky rework with no user-facing payoff. |
| No new vendor lock-in | Same Vercel free tier + Supabase, no new paid services | **PASS** — Next.js would also run on Vercel/Supabase. (The one criterion that clearly passes — but it's a non-regression, not a reason to migrate.) |

**Score: 1 / 5 pass.** Threshold for GO is 4 / 5. → **NO-GO.**

## Rationale

This is an **authenticated internal/B2B portal**, not a public content site. The
headline Next.js benefits — SSR/SSG for SEO, server components, edge rendering —
are largely irrelevant here, while the costs (rewriting a working monolith,
SSR/auth-cookie complexity, a second mental model) are real. The Vite SPA already
satisfies every M1/M2 requirement in production. KISS wins.

TypeScript's value (catching boundary bugs) is real but **decoupled from Next.js**
— if we want it, we can adopt TS incrementally on the existing Vite app. That's a
separate, smaller decision for later, not a reason to take on a framework
migration now.

## Consequences

- Stay on **Vite + React 18 + Tailwind**.
- **#22–#25 do not proceed** (gated on a #21 YES that wasn't earned). Closed as
  `wontfix` with a pointer here; reopen if the context changes (e.g. a public
  marketing surface that needs SSR/SEO).
- The dedicated `typescript-standards` skill (#21) is **deferred** with the
  migration; revisit if/when TS is adopted on Vite.
- Future agents: **do not re-litigate** this without new evidence. If a real need
  for SSR/SEO appears, write ADR 0002 superseding this one.
