// Seed the mock candidates from src/data.js into Supabase as DEMO data
// (is_demo=true, status='active'). Demo rows are hidden from company users by RLS.
//
// Run (loads the public URL from the encrypted .env and the service-role key
// from .env.ops.local):
//   npx dotenvx run -f .env -f .env.ops.local -- node scripts/seed-demo-candidates.mjs --target=staging
//   npx dotenvx run -f .env -f .env.ops.local -- node scripts/seed-demo-candidates.mjs --target=prod --confirm
//
// Idempotent: upserts on `email`, so re-runs update in place (no duplicates).
// Uses the service-role key — destructive/privileged, so it lives in scripts/
// only and is never imported by the app.
import { createClient } from "@supabase/supabase-js";
import { CANDIDATES } from "../src/data.js";
import { candidateToRow } from "../src/lib/candidateMapping.js";

const args = process.argv.slice(2);
const target = (args.find((a) => a.startsWith("--target=")) || "--target=staging").split("=")[1];
const confirmed = args.includes("--confirm");

if (!["staging", "prod"].includes(target)) {
  console.error(`Unknown --target=${target}. Use staging or prod.`);
  process.exit(1);
}
if (target === "prod" && !confirmed) {
  console.error("Refusing to seed prod without --confirm. Re-run with --target=prod --confirm.");
  process.exit(1);
}

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  console.error("Run via: npx dotenvx run -f .env -f .env.ops.local -- node scripts/seed-demo-candidates.mjs ...");
  process.exit(1);
}

// NOTE: until a dedicated staging Supabase project exists (see #9, blocked),
// both targets point at the single live project. The --confirm guard for prod
// is kept so the safety semantics hold once staging is stood up.
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const rows = CANDIDATES.map((c) => ({
  ...candidateToRow(c),
  is_demo: true,       // force: this is demo data
  status: "active",    // force: demo candidates are listable
  intake_source: "imported",
}));

console.log(`Seeding ${rows.length} demo candidates → ${target} (${url}) ...`);

// Upsert in batches, keyed on email, so re-runs don't duplicate.
const BATCH = 100;
let upserted = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const slice = rows.slice(i, i + BATCH);
  const { data, error } = await supabase
    .from("candidates")
    .upsert(slice, { onConflict: "email", ignoreDuplicates: false })
    .select("id");
  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }
  upserted += data.length;
  console.log(`  upserted ${upserted}/${rows.length}`);
}

const { count } = await supabase
  .from("candidates")
  .select("*", { count: "exact", head: true })
  .eq("is_demo", true);

console.log(`Done. candidates where is_demo=true: ${count} (src/data.js length: ${CANDIDATES.length})`);
if (count !== CANDIDATES.length) {
  console.warn("WARNING: demo count does not match src/data.js length — investigate.");
  process.exit(1);
}
