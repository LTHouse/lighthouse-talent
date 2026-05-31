# How to fix something in prod

Prefer the path that needs the least raw database access.

1. **First choice — the admin UI.** If the operator-facing admin portal can do it,
   that's the path. No code change.
2. **Second choice — ship a button.** Open an issue describing the broken state,
   tag `@claude`, and let the builder add a UI control for it. Permanent fix, no
   script.
3. **Last resort — a one-off SQL patch** (process below).

## One-off SQL patch process

- Write the SQL in a new file at `scripts/one-offs/YYYY-MM-DD-short-description.sql`.
- Commit it via a regular PR — the reviewer agent (and a human, if available) must
  approve.
- Run it against **staging** first:
  ```bash
  npx dotenvx run -f .env -f .env.ops.local -- node scripts/run-sql.js --file=scripts/one-offs/<file>.sql --target=staging
  ```
- Verify the result against staging.
- Only after staging passes, run against **prod**:
  ```bash
  npx dotenvx run -f .env -f .env.ops.local -- node scripts/run-sql.js --file=scripts/one-offs/<file>.sql --target=prod --confirm
  ```
  (Prod also prompts for a literal `yes` on stdin.)
- **Never edit a SQL file that has already run against prod** — write a new one.
  The files in `scripts/one-offs/` are an audit trail.

> The runner wraps your SQL in a single transaction (`begin; … ; commit;`); any
> error rolls the whole thing back. Still: **never write a `DELETE`/`UPDATE`
> without a `WHERE` clause** (CLAUDE.md non-negotiable).

> Until a dedicated staging Supabase project exists (#9, blocked), `--target=staging`
> and `--target=prod` resolve to the same live project; the `--confirm` + `yes`
> prompt gates prod regardless.
