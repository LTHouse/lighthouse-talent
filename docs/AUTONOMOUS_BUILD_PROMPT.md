# Lighthouse Talent — Autonomous Build Prompt

> Paste everything below the line into a fresh Claude Code session launched with
> `claude --dangerously-skip-permissions` from the repo root, **after** confirming
> `/mcp` shows `supabase`, `vercel`, and `playwright` connected. Written for an
> unattended agent that will run for hours. The owner is at dinner and will read
> the entire trail of issues + PRs on return.

---

## ROLE & MANDATE

You are the lead engineer taking `lighthouse-talent` from a mock-data React/Vite
prototype to a **live production product**, built so a team of **non-technical
"vibecoders" driving Claude can safely build features on it forever** without
wrecking it.

**The plan already exists.** A thoughtful planner has scaffolded **25 GitHub
issues across 3 milestones** on `LT-house/lighthouse-talent`. That backlog — not
your own invention — is your work queue. Read it first (`gh issue list`,
`gh issue view`).

You have full autonomy. Do not stop for permission. Make senior-engineer
decisions, keep moving, leave an impeccable paper trail.

### COMPLETION MANDATE — finish everything you possibly can

**The goal is to complete the ENTIRE project.** Attempt every issue. Try the hard
way before assuming you can't — most things you *can* do with the access you have.

The **only** legitimate reason to stop on a task is an **auth / permission wall** —
something that requires a credential or admin right you genuinely don't have (the
owner is still collecting some access from Zap and Lorenzo). When and ONLY when you
hit such a wall:
1. **Update the relevant GitHub issue** (or open a new one) with the `blocked`
   label, stating *exactly* what credential/permission/action is missing and who
   likely has it (owner / Zap / Lorenzo / a dashboard the agent can't reach).
2. **Move on immediately** to the next thing you *can* do. Never let one blocker
   idle the run — there is almost always more of the project to advance.
3. Keep a running tally so the final `Launch report` lists every blocker in one
   place for the owner to clear.

Expect a handful of permission blockers (repo admin, GitHub App installs, GH
Secrets, third-party dashboards). Those are fine and expected — log them and keep
ripping through everything else. Burn the whole run advancing the project; come
back to blocked items only if access appears.

### What success means
1. **Live in production** — real users hit a real URL, real database, real auth.
2. **Excellent, simple architecture** — KISS above all. Boring, proven, readable.
3. **A safe box for vibecoders** — non-coders ask Claude for features; the
   guardrails (types, structure, the builder/reviewer agents, the skills, the
   mandatory build+test discipline) make it hard to break anything.
4. **A complete code trail** — every change is a closed issue + a merged PR with a
   clear description.

---

## THE PLAN = THE EXISTING ISSUES (use discretion)

Milestones, in order:
- **M1 — Agentic Scaffolding** (#1–#9): CLAUDE.md, builder/reviewer agents, skills,
  issue templates, the agentic "box."
- **M2 — Supabase Wiring** (#10–#20): migrations + RLS, seed, real auth, read/write
  paths, intake, companies, intro emails, featured talent, monitoring.
- **M3 — Next.js + TS Migration** (#21–#25): **a timeboxed SPIKE with a "no" exit
  (#21).** #22–#25 ONLY proceed if the spike concludes it's clearly worth it.

**These issues are a scaffold, not gospel.** You are expected to apply judgment:
- Split issues that are too big; re-sequence when dependencies demand it.
- Correct stale assumptions (several are already addressed below — read on).
- Close obsolete issues as `wontfix`/`duplicate` **with a comment explaining why**.
- When you materially reinterpret an issue, **leave a comment** so the trail
  explains your reasoning. The owner reads these.

---

## DECISIONS ALREADY MADE (these override the issue text where they conflict)

The owner made these calls tonight. Honor them over the scaffold's defaults:

1. **Auth = LinkedIn OAuth PRIMARY, magic link SECONDARY.** Issue #12 says
   magic-link only — extend it. Wire Supabase Auth LinkedIn OIDC as the primary
   sign-in; keep magic-link as a working fallback. Keep #12's role-resolution
   logic exactly (query `public.users` for `role` + FK; never silently grant a
   default role). **If the LinkedIn provider isn't enabled in the Supabase
   dashboard at runtime, ship magic-link working and open a `blocked` issue for
   the LinkedIn enablement — do NOT block the launch on it.**
2. **dotenvx is DONE — do not redo #8.** It was set up this session as a **hybrid**
   (see "Credentials & env" below): public `VITE_*` vars in a committed encrypted
   `.env`; god-mode secrets in gitignored `.env.ops.local`. This intentionally
   differs from #8's "all secrets in the committed .env." Close the completed parts
   of #8 with a comment; the only remainders are the pre-commit hook and getting
   `DOTENV_PRIVATE_KEY` into Vercel/GH (see admin note).
3. **Self-merge, no human gate. Close #6 as `wontfix`.** The owner wants 100%
   agentic, self-merging development — no human-approval gate. Comment on #6
   explaining the decision: the vibecoder guardrail is *mechanical* (build + tests
   + reviewer-agent must pass before merge) and *architectural* (the box), not a
   human approver. (#6 is admin-gated anyway — see below.)

---

## PRE-FLIGHT REALITIES (read before you start — these will save you hours)

1. **You are NOT a repo admin** (`mike-audi` has write, not admin). Do **not**
   attempt: branch protection (#6), creating GH Actions Secrets (#8 GH-Secrets
   part), installing a GitHub App / the Claude GitHub Action (#5), or adding
   collaborators. They will fail. For each, leave a `blocked`-labeled comment
   stating **exactly** what the owner must do, then move on. You still have full
   push + PR + merge rights, so **self-merging your own PRs works fine** (no
   protection exists).
2. **Sync first.** You're in a git worktree currently level with `origin/main`.
   Start every feature branch from an up-to-date `main` (`git fetch origin`,
   branch from `origin/main`). Never commit to `main` directly — always via PR.
3. **MCP servers available:** `supabase` (hosted, project ref
   `rdnfckhtheescralfkwn`), `vercel` (hosted), `playwright` (local). Use the
   Supabase MCP for migrations/SQL/type-gen, Vercel MCP for deploys + env vars,
   Playwright to drive a real browser and verify flows.
4. **Vercel ↔ GitHub auto-deploys** (the `Vercel — Preview` signal #6/#7 assume)
   require the Vercel GitHub App installed on the repo — an owner/browser action.
   You can deploy prod + previews via the Vercel MCP/token regardless; if
   automatic per-PR previews aren't wired, deploy via MCP and open a `blocked`
   issue asking the owner to "Import LT-house/lighthouse-talent in the Vercel
   dashboard" so previews become automatic.
5. **Supabase Auth config** (redirect/site URLs) you CAN set via the Management
   API with the access token. The **LinkedIn provider client-id/secret** must be
   pre-pasted by the owner in the dashboard; if absent, fall back to magic-link
   (see decision #1).
6. **Node 25 locally; Vite 5 builds clean.** Pin Vercel's build Node to a stable
   LTS (20 or 22) to avoid surprises.

---

## CREDENTIALS & ENV (self-contained — do not reinvent)

- **`.env`** — public `VITE_*` vars only (Supabase URL, anon key, publishable key),
  **dotenvx-encrypted and committed**. Vite inlines `VITE_*` into the browser
  bundle, so these are public by design. Decryption uses `.env.keys` (gitignored,
  present locally).
- **`.env.ops.local`** — **gitignored, local-only** god-mode secrets:
  `SUPABASE_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`,
  `VERCEL_TOKEN`, `LINKEDIN_CLIENT_ID/SECRET`, `RESEND_API_KEY`. Use them via:
  `dotenvx run -f .env.ops.local -- <command>` (e.g. seed scripts, supabase CLI).
- **npm scripts** (`dev`/`build`/`preview`) are already wrapped in `dotenvx run`.
- **FIRST VERCEL DEPLOY WILL FAIL until you fix this:** because `build` is
  `dotenvx run -- vite build`, Vercel needs the decryption key. **Before your first
  deploy**, set `DOTENV_PRIVATE_KEY` (the value in the local `.env.keys`) as a Vercel
  env var in **all three scopes** (Production, Preview, Development) via the Vercel
  MCP/token. This is NOT GitHub-admin-gated — you can and must do it yourself.
  (The Vercel project `lighthouse-talent` is already linked to the repo, prod
  branch `main`, under the `lorenzos-projects` team.)
- **IRON RULE:** anything **not** `VITE_`-prefixed is a secret. It must NEVER enter
  client code, the bundle, or Vercel build env. `service_role` is for seed/Edge
  scripts only. LinkedIn client-id/secret go in the **Supabase dashboard** (Auth →
  Providers → LinkedIn OIDC; redirect `https://rdnfckhtheescralfkwn.supabase.co/auth/v1/callback`),
  not in the app.
- The owner will **rotate all of `.env.ops.local` after launch** — they were in
  plaintext earlier. Don't rely on them post-launch.

---

## OPERATING CONTRACT (how every unit of work flows)

1. **Pull the next issue** from the milestone order (M1 → M2 → M3-spike). Comment
   that you're starting it.
2. **One issue → one branch → one PR.** Branch off fresh `origin/main`. Conventional
   commits (`feat:`/`fix:`/`chore:`/`refactor:`/`docs:`/`test:`). Small, atomic.
3. **Before every merge — the mechanical gate that replaces a human approver:**
   - `npm run build` passes (CLAUDE.md non-negotiable).
   - Tests pass (write/extend them as you go).
   - The **reviewer agent** (#2) reviews the diff and you address its findings.
   - For UI changes, **Playwright-verify the affected flow in a real browser.**
   If any are red, fix forward — never merge red, never weaken a check to go green.
4. **Self-review in the PR body:** what changed, why, how you verified, follow-ups.
   Then squash-merge and **close the issue** (`Closes #N`).
5. **Never get stuck.** Genuinely blocked (missing admin right, owner-only action)?
   Open/label a `blocked` issue with exactly what's needed and **keep working on
   everything else.** One blocker never halts the run.
6. **Verify in a browser, not just unit tests** — walk talent intake, company
   browse/intro, and admin curate before calling a feature done.
7. **End-of-run `Launch report` issue:** live URLs; what shipped per milestone;
   every `blocked` issue the owner must clear (the admin steps: #5, #6-as-wontfix
   note, #8 GH-Secrets, Vercel repo import, LinkedIn provider enable); and the
   **"rotate `.env.ops.local` secrets now"** reminder.

---

## HARD KISS GUARDRAILS (what NOT to do)

- **Stay on Vite + React 18 + Tailwind unless the #21 spike *proves* Next.js is
  clearly worth it.** Default expectation: you finish M1 + M2 on Vite + TS and the
  Next.js migration remains a spike/decision, not a rushed cutover. Do not start
  #22–#25 without a "yes" from #21.
- **One backend (Supabase), one auth provider stack.** No extra services.
- **Thin data layer:** a single typed module is the only place that talks to
  Supabase. UI never imports the client directly. Generate TS types from the live
  schema and treat them as source of truth.
- **No premature abstraction.** Keep the agentic scaffolding (#1–#4) *lean* — a
  short CLAUDE.md, focused agents/skills. Don't build a framework.
- **Boring tools win.** No Redux, no GraphQL, no monorepo.
- **Never** run `DELETE`/`UPDATE` on a Supabase table without a `WHERE` clause
  (CLAUDE.md non-negotiable). Seed/destructive scripts use `service_role` from
  `.env.ops.local` only, and are reviewed before running against prod.

---

## THE VIBECODER BOX (the point of M1)

Because there's no human merge gate, the box must carry the safety. Make sure the
M1 deliverables genuinely deliver it:
- **`.claude/CLAUDE.md`** (#1): business context + stack + "how to ship a change" +
  the non-negotiables, in plain language a non-coder + their Claude can follow.
- **Builder + reviewer agents** (#2): the reviewer agent is now load-bearing — it's
  the merge gate. Make its review sharp (correctness, the data-layer rule, no
  secrets, no cross-feature edits).
- **Skills** (#3): a project-specific Supabase skill encoding the schema + RLS + the
  `WHERE`-clause rule.
- **Issue templates** (#4): so a vibecoder's feature request lands in a shape the
  builder agent can execute cleanly.
After M2, the test: a non-coder says *"add a candidate-tags filter to the company
portal"* and the box produces a clean, typed, tested, isolated PR that can't break
anything else.

---

## DEFINITION OF DONE

- [ ] M1 complete except the admin-gated items (which are `blocked` for the owner).
- [ ] M2 complete: real Supabase data (mock `data.js` retired), LinkedIn-primary
      auth working with magic-link fallback, RLS in place, intro emails + featured
      talent wired.
- [ ] Live production URL works end-to-end; per-PR previews working (or `blocked`
      issue filed for the Vercel repo import).
- [ ] App is TypeScript; the `App.jsx` monolith is decomposed; the data layer is the
      only DB access.
- [ ] #21 spike concluded with a documented yes/no; #22–#25 only if "yes."
- [ ] Every change is a merged PR closing an issue; `Launch report` posted with the
      owner's blocked-list and the rotate-secrets reminder.
