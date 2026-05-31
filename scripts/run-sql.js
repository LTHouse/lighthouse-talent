// The single one-off SQL runner (#20). Runs a reviewed .sql file from
// scripts/one-offs/ against Supabase, wrapped in one transaction. There is no
// other CLI write surface — the admin UI is the normal path (see SAFETY.md).
//
//   npx dotenvx run -f .env -f .env.ops.local -- node scripts/run-sql.js \
//     --file=scripts/one-offs/2026-05-31-fix-thing.sql --target=staging
//   ... then --target=prod --confirm   (also prompts for a literal "yes")
//
// Uses the Supabase Management API query endpoint with SUPABASE_ACCESS_TOKEN
// (god-mode, from .env.ops.local). NOTE: this intentionally uses the access token,
// not the service-role key — the service-role key drives PostgREST and can't run
// arbitrary multi-statement SQL; the Management API can, with no extra dependency.
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";

// target -> project ref. Staging == prod until a real staging project exists (#9).
const PROJECT_REFS = {
  staging: "rdnfckhtheescralfkwn",
  prod: "rdnfckhtheescralfkwn",
};

const args = process.argv.slice(2);
const fileArg = args.find((a) => a.startsWith("--file="))?.split("=")[1];
const target = args.find((a) => a.startsWith("--target="))?.split("=")[1] || "staging";
const confirmed = args.includes("--confirm");

function die(msg) { console.error(msg); process.exit(1); }

if (!fileArg) die("Missing --file=scripts/one-offs/<file>.sql");
if (!fileArg.includes("scripts/one-offs/")) die("--file must live inside scripts/one-offs/");
if (!PROJECT_REFS[target]) die(`Unknown --target=${target}. Use staging or prod.`);
if (target === "prod" && !confirmed) die("Refusing to run against prod without --confirm.");

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) die("Missing SUPABASE_ACCESS_TOKEN. Run via: npx dotenvx run -f .env -f .env.ops.local -- node scripts/run-sql.js ...");

const sql = readFileSync(fileArg, "utf8");
const ref = PROJECT_REFS[target];

console.log(`\n--- ${fileArg} → ${target} (${ref}) ---\n${sql}\n---`);

async function confirmProd() {
  if (target !== "prod") return;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((res) => rl.question("About to run against PROD. Type 'yes' to continue: ", res));
  rl.close();
  if (answer.trim() !== "yes") die("Aborted — confirmation was not 'yes'.");
}

await confirmProd();

// Wrap in a transaction so a mid-file error rolls everything back.
const wrapped = `begin;\n${sql}\ncommit;`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: wrapped }),
});

if (!res.ok) {
  const body = await res.text();
  die(`SQL failed (HTTP ${res.status}) — transaction rolled back.\n${body}`);
}

const result = await res.json();
console.log("OK. Result:", JSON.stringify(result));
