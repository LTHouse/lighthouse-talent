# Installed skills

These skills give the `builder` and `reviewer` agents real, version-pinned
expertise instead of generic prompts. Each was **copied verbatim** from its
upstream repo (no submodules, no marketplace) and carries an attribution line at
the top of its `SKILL.md`. To update one, re-copy by hand from upstream.

The folder name follows issue #3; the upstream skills sometimes carry a
vendor-prefixed `name:` in their frontmatter (noted below) — that's the verbatim
upstream value and is what shows in `/skills`.

| Folder | `/skills` name | Source | License | Used by |
|---|---|---|---|---|
| `frontend-design` | `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills) `skills/frontend-design/` @ da20c92 | Apache 2.0 | builder |
| `react-best-practices` | `vercel-react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) `skills/react-best-practices/` @ 1801156 | MIT | builder, reviewer |
| `web-design-guidelines` | `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) `skills/web-design-guidelines/` @ 1801156 | MIT | builder, reviewer |
| `supabase` | `supabase` | [supabase/agent-skills](https://github.com/supabase/agent-skills) `skills/supabase/` @ 577e626 | MIT | builder, reviewer |
| `postgres-best-practices` | `supabase-postgres-best-practices` | [supabase/agent-skills](https://github.com/supabase/agent-skills) `skills/supabase-postgres-best-practices/` @ 577e626 | MIT | builder, reviewer |
| `git-commit` | `git-commit` | [github/awesome-copilot](https://github.com/github/awesome-copilot) `skills/git-commit/` @ 9b74459 | MIT | builder |
| `prd` | `prd` | [github/awesome-copilot](https://github.com/github/awesome-copilot) `skills/prd/` @ 9b74459 | MIT | builder |

## What each one is for

- **frontend-design** — distinctive, production-grade UI; avoids generic AI
  aesthetics. The builder uses it when creating/styling components.
- **react-best-practices** — React/Next performance patterns from Vercel.
- **web-design-guidelines** — accessibility/UX review checklist; the reviewer
  uses it on UI PRs.
- **supabase** — the full Supabase product surface: Auth, Edge Functions, RLS,
  migrations, SSR, the CLI/MCP. **Authoritative on RLS policy patterns** (see #10).
- **postgres-best-practices** — deep Postgres rules: query perf, RLS, schema
  design, concurrency. Complements `supabase`.
- **git-commit** — conventional commit message generation.
- **prd** — structures a vibecoder's loose feature request into a clear spec.

## Deferred (install on demand, not now)

- A custom **Supabase-on-this-project** skill (our schema + RLS + the WHERE-clause
  rule) — Phase 2.
- ~~A **TypeScript-standards** skill~~ — **installed** as `typescript-standards/`
  (project-specific) now that the Next.js + TS migration is underway.
- A **security-review** skill — once patterns to document exist.
- `deploy-to-vercel`, `vercel-optimize`, `composition-patterns`,
  `react-view-transitions` — install when a specific need surfaces.
