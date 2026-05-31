# Operational scripts

Privileged, run-by-hand scripts. They use the **service-role key** (full DB
access, bypasses RLS), so they live here and are **never imported by the app**.
Secrets are loaded by `dotenvx` from the gitignored `.env.ops.local`; the public
Supabase URL comes from the encrypted `.env`.

> ⚠️ Service-role bypasses RLS. Never run a `DELETE`/`UPDATE` without a `WHERE`
> clause. Review a destructive script before pointing it at prod.

## `seed-demo-candidates.mjs`

Seeds the ~154 mock candidates from `src/data.js` as **demo** data
(`is_demo=true`, `status='active'`). Demo rows are invisible to company users via
RLS (#10). Idempotent — upserts on `email`, so re-runs update in place.

```bash
# staging (default)
npx dotenvx run -f .env -f .env.ops.local -- node scripts/seed-demo-candidates.mjs --target=staging

# prod (requires --confirm)
npx dotenvx run -f .env -f .env.ops.local -- node scripts/seed-demo-candidates.mjs --target=prod --confirm
```

> Until a dedicated staging Supabase project exists (#9, blocked), both targets
> point at the single live project; the `--confirm` guard for prod is kept so the
> safety semantics hold once staging is stood up.
