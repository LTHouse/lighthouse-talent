// LinkedIn enrichment seam.
//
// PRODUCTION: this will call a Supabase Edge Function that wraps Proxycurl's
// Person Profile endpoint (https://nubela.co/proxycurl/docs#people-api-person-profile-endpoint),
// then write the response into candidates.linkedin_data along with a timestamp.
//
// DEVELOPMENT (current): returns a deterministic mock payload shaped like the
// Proxycurl response so the UI can be wired and verified before credentials land.
//
// Lorenzo's prereqs before flipping to real Proxycurl:
//   1. Sign up at https://nubela.co/proxycurl and get an API key
//   2. Register a LinkedIn Developer App for The Lighthouse (OAuth)
//   3. Store both as Supabase secrets (PROXYCURL_API_KEY, LINKEDIN_OAUTH_*)
//   4. Deploy the matching Edge Function (sketch below in the comment block)
//
// Migration to apply when wiring real persistence:
//   alter table candidates add column linkedin_data jsonb;
//   alter table candidates add column linkedin_data_last_updated timestamptz;
//   alter table candidates add column linkedin_data_source text;
//   alter table candidates add column linkedin_refresh_priority text default 'normal';
//
// Edge Function sketch (supabase/functions/enrich-linkedin/index.ts):
//   const res = await fetch(`https://nubela.co/proxycurl/api/v2/linkedin?url=${url}`, {
//     headers: { Authorization: `Bearer ${Deno.env.get("PROXYCURL_API_KEY")}` },
//   });
//   const payload = await res.json();
//   await supabase.from("candidates").update({
//     linkedin_data: payload,
//     linkedin_data_last_updated: new Date().toISOString(),
//     linkedin_data_source: "proxycurl",
//   }).eq("id", candidateId);

const MOCK_COMPANIES = ["Stripe", "Notion", "Airtable", "Shopify", "Linear", "Vercel", "Ramp", "Brex"];
const MOCK_SCHOOLS = ["Vanderbilt University", "Belmont University", "MTSU", "University of Tennessee"];
const MOCK_SKILLS = ["Product strategy", "Roadmapping", "User research", "Stakeholder management", "Hiring", "OKRs", "Data analysis", "SQL"];

function _hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Mock implementation — deterministic per LinkedIn URL so the same handle always
// "enriches" to the same payload. Replace with the real Edge Function call when ready.
export async function enrichFromLinkedIn(linkedinUrl) {
  await new Promise(r => setTimeout(r, 800)); // simulate network
  const h = _hash(linkedinUrl || "demo");
  const stints = 2 + (h % 3); // 2-4 roles
  const baseYear = 2026 - 2 * stints;
  return {
    source: "proxycurl-mock",
    public_identifier: (linkedinUrl.match(/in\/([^/]+)/)?.[1]) || "demo-user",
    full_name: null, // intentionally null; real Proxycurl returns this and the UI uses our captured name
    headline: "Senior Operator",
    occupation: "Building things at startups",
    summary: "Operator focused on early-stage product and growth. Currently exploring what's next.",
    experiences: Array.from({ length: stints }).map((_, i) => {
      const start = baseYear + i * 2;
      const end = i === stints - 1 ? "Present" : start + 2;
      return {
        company: MOCK_COMPANIES[(h + i) % MOCK_COMPANIES.length],
        title: ["Senior PM", "Head of Ops", "Director of Operations", "VP Product"][(h + i) % 4],
        starts_at: { year: start },
        ends_at: end === "Present" ? null : { year: end },
        description: "Led cross-functional initiatives, shipped product, hired team.",
      };
    }),
    education: [
      { school: MOCK_SCHOOLS[h % MOCK_SCHOOLS.length], degree: "BA", field: "Economics", year: baseYear - 4 },
    ],
    skills: Array.from({ length: 5 }).map((_, i) => MOCK_SKILLS[(h + i) % MOCK_SKILLS.length]),
  };
}

// Refresh-cadence helpers — staleness checks for admin UI + the (disabled-until-go-live) cron job.
export const REFRESH_PRIORITY_DAYS = { high: 7, normal: 60, frozen: Infinity };

export function isStale(lastUpdatedISO, priority = "normal") {
  if (priority === "frozen") return false;
  if (!lastUpdatedISO) return true;
  const ageDays = (Date.now() - new Date(lastUpdatedISO).getTime()) / 86400000;
  return ageDays >= (REFRESH_PRIORITY_DAYS[priority] ?? 60);
}
