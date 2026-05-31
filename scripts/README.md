# Operational scripts

Privileged, run-by-hand scripts. They use the **service-role key** (full DB
access, bypasses RLS), so they live here and are **never imported by the app**.
Secrets are loaded by `dotenvx` from the gitignored `.env.ops.local`; the public
Supabase URL comes from the encrypted `.env`.

> ⚠️ Service-role bypasses RLS. Never run a `DELETE`/`UPDATE` without a `WHERE`
> clause. Review a destructive script before pointing it at prod.

## `grant-access.mjs`

Onboard a login: create-or-find the person's auth user and map them in
`public.users` with a role (+ optional FK). For talent it also links
`candidates.user_id` so their RLS-scoped self-edit works. Idempotent.

```bash
# a company login (needs an existing companies row id)
npx dotenvx run -f .env -f .env.ops.local -- node scripts/grant-access.mjs \
  --email=hiring@startup.com --role=company --company-id=<uuid>

# a talent login linked to their candidate row
npx dotenvx run -f .env -f .env.ops.local -- node scripts/grant-access.mjs \
  --email=person@gmail.com --role=talent --candidate-id=<uuid>

# an admin
npx dotenvx run -f .env -f .env.ops.local -- node scripts/grant-access.mjs \
  --email=teammate@lighthouse.com --role=admin
```

They then sign in via LinkedIn / magic link with that email and land in their portal.

## `seed-demo-candidates.mjs`

Seeds the mock candidates from `demo-candidates.data.js` as **demo** data
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
