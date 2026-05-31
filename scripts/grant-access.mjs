// Grant a person access to the app: create-or-find their auth user and map them
// in public.users with a role (+ optional FK). This is the supported way to
// onboard an admin / company / talent login (#54). Service-role; scripts-only.
//
//   npx dotenvx run -f .env -f .env.ops.local -- node scripts/grant-access.mjs \
//     --email=person@co.com --role=company --company-id=<uuid>
//   ... --role=talent --candidate-id=<uuid>   (links candidates.user_id too)
//   ... --role=admin
//
// Idempotent: re-running updates the existing mapping.
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const get = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
const email = get("email");
const role = get("role");
const companyId = get("company-id") || null;
const candidateId = get("candidate-id") || null;

function die(m) { console.error(m); process.exit(1); }
if (!email) die("Missing --email=");
if (!["admin", "company", "talent"].includes(role || "")) die("--role must be admin | company | talent");
if (role === "company" && !companyId) die("--role=company requires --company-id=<uuid>");

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) die("Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run via dotenvx (see header).");

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

// 1) create-or-find the auth user
const { data: list, error: le } = await sb.auth.admin.listUsers();
if (le) die(`listUsers failed: ${le.message}`);
let user = list.users.find((u) => u.email === email);
if (!user) {
  const { data, error } = await sb.auth.admin.createUser({ email, email_confirm: true });
  if (error) die(`createUser failed: ${error.message}`);
  user = data.user;
  console.log(`created auth user ${email} (${user.id})`);
} else {
  console.log(`auth user exists ${email} (${user.id})`);
}

// 2) for talent, link the candidate row to this user so RLS (user_id = auth.uid()) works
if (role === "talent" && candidateId) {
  const { error } = await sb.from("candidates").update({ user_id: user.id }).eq("id", candidateId);
  if (error) die(`linking candidate failed: ${error.message}`);
  console.log(`linked candidates.user_id for ${candidateId}`);
}

// 3) upsert the public.users mapping
const { error: ue } = await sb.from("users").upsert(
  { id: user.id, role, company_id: companyId, candidate_id: candidateId },
  { onConflict: "id" }
);
if (ue) die(`users upsert failed: ${ue.message}`);

console.log(`✅ ${email} is now role=${role}${companyId ? ` company=${companyId}` : ""}${candidateId ? ` candidate=${candidateId}` : ""}`);
console.log("They sign in via LinkedIn or magic link with this email and land in their portal.");
