// LinkedIn enrichment seam.
//
// HISTORY: Earlier specs recommended Proxycurl as the enrichment vendor.
// Proxycurl shut down in July 2025 after losing a federal lawsuit to LinkedIn/Microsoft
// and was required to delete all customer data. The broader third-party enrichment
// market is now in a more legally exposed position.
//
// MVP DECISION (current): no third-party enrichment. Use Sign In with LinkedIn for
// identity verification only (name, email, photo, public profile URL, LinkedIn ID).
// Role + company are candidate-self-reported. The vetted bolt (set by Zap during the
// in-person vetting call) is the source of professional verification.
//
// This file remains as the seam where enrichment will plug in IF/WHEN the vendor
// market settles, or once Lighthouse scales to a LinkedIn Talent Solutions partnership.
// Until then, `enrichFromLinkedIn` returns a deterministic mock payload so the existing
// admin freshness UI keeps working for the "spot enrich" demo flow.
//
// Lorenzo's prereqs for go-live (no third-party enrichment, only OAuth):
//   1. Register a LinkedIn Developer App for The Lighthouse:
//      - https://developer.linkedin.com
//      - Add the "Sign In with LinkedIn using OpenID Connect" product
//      - Get Client ID + Client Secret
//   2. Store as Supabase secrets: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
//   3. Apply the migration:
//      alter table candidates add column linkedin_verified boolean default false;
//      alter table candidates add column linkedin_id text;
//      alter table candidates add column intake_source text default 'Manual entry';
//      alter table candidates add column linkedin_data jsonb;              -- reserved for future
//      alter table candidates add column linkedin_data_last_updated timestamptz;  -- reserved
//      alter table candidates add column linkedin_data_source text;        -- reserved
//      alter table candidates add column linkedin_refresh_priority text default 'normal';
//   4. Update the placement agreement to include the 12-month attribution clause
//      (work with Frost Brown Todd — small amendment to existing template).
//
// Anti-poaching layers wired into the UI:
//   - LinkedIn URL hidden on all company-facing surfaces (visible to admin only)
//   - window.__lt_profile_views logs every company-side candidate detail view
//   - 12-month attribution clause is contractual (Lorenzo's task, not Cowork's)

const MOCK_COMPANIES = ["Stripe", "Notion", "Airtable", "Shopify", "Linear", "Vercel", "Ramp", "Brex"];
const MOCK_SCHOOLS = ["Vanderbilt University", "Belmont University", "MTSU", "University of Tennessee"];
const MOCK_SKILLS = ["Product strategy", "Roadmapping", "User research", "Stakeholder management", "Hiring", "OKRs", "Data analysis", "SQL"];

function _hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Returns a Proxycurl-shaped mock so the admin "Refresh now" button has something
// to render. Once a real enrichment vendor is chosen, swap the body for the live
// API call — the consumers expect the same shape.
export async function enrichFromLinkedIn(linkedinUrl) {
  await new Promise(r => setTimeout(r, 800)); // simulate network
  const h = _hash(linkedinUrl || "demo");
  const stints = 2 + (h % 3); // 2-4 roles
  const baseYear = 2026 - 2 * stints;
  return {
    source: "mock-no-vendor", // intentional — Proxycurl is gone, no live source yet
    public_identifier: (linkedinUrl.match(/in\/([^/]+)/)?.[1]) || "demo-user",
    full_name: null,
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

// Staleness helper — still useful in admin UI for "high-priority candidates" annotation
// even though no enrichment vendor is active. When a vendor lands, the scheduled job
// uses this to decide which rows to refresh.
export const REFRESH_PRIORITY_DAYS = { high: 7, normal: 60, frozen: Infinity };

export function isStale(lastUpdatedISO, priority = "normal") {
  if (priority === "frozen") return false;
  if (!lastUpdatedISO) return true;
  const ageDays = (Date.now() - new Date(lastUpdatedISO).getTime()) / 86400000;
  return ageDays >= (REFRESH_PRIORITY_DAYS[priority] ?? 60);
}
