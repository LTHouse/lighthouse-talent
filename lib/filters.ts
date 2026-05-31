// Candidate filtering + best-effort NL query interpretation. Pure functions ported
// from the Vite app; operate on the typed Candidate shape + CandidateFilters.
import type { Candidate } from "@/lib/data/candidates";
import type { CandidateFilters, TriState } from "@/lib/constants";

export function filterCandidates(filters: CandidateFilters, candidates: Candidate[]): Candidate[] {
  return candidates.filter((c) => {
    // Only surface active, non-declined candidates to companies.
    if (c.status !== "active" || c.declined) return false;
    if (filters.vettedOnly && !c.vettedInPerson) return false;
    if (filters.roles.length > 0) {
      const match = (c.primaryRole != null && filters.roles.includes(c.primaryRole)) || c.roleTypes.some((r) => filters.roles.includes(r));
      if (!match) return false;
    }
    if (c.yearsExperience != null) {
      if (c.yearsExperience < filters.yoeMin) return false;
      if (c.yearsExperience > filters.yoeMax) return false;
    }
    if (filters.hasTech === "yes" && !c.hasTechExperience) return false;
    if (filters.hasTech === "no" && c.hasTechExperience) return false;
    if (filters.hasStartup === "yes" && !c.hasStartupExperience) return false;
    if (filters.hasStartup === "no" && c.hasStartupExperience) return false;
    if (filters.locAvailability.length > 0 && filters.locAvailability.length < 3) {
      if (c.relocationStatus == null || !filters.locAvailability.includes(c.relocationStatus)) return false;
    }
    if (filters.currentLocationFilter) {
      if (!(c.currentLocation ?? "").toLowerCase().includes(filters.currentLocationFilter.toLowerCase())) return false;
    }
    if (filters.workModes.length > 0) {
      if (c.workMode == null || !filters.workModes.includes(c.workMode)) return false;
    }
    return true;
  });
}

export interface NLResult {
  role: string | null;
  yoeMin: number;
  yoeMax: number;
  hasTech: TriState;
  hasStartup: TriState;
}

export function interpretNL(query: string): NLResult {
  const q = (query || "").toLowerCase();
  const roleMap: Record<string, string> = {
    engineer: "Engineering", developer: "Engineering", swe: "Engineering", engineering: "Engineering",
    "product manager": "Product", pm: "Product", product: "Product",
    design: "Design", ux: "Design", ui: "Design",
    ops: "Operations", operations: "Operations", "chief of staff": "Operations",
    marketing: "Marketing", growth: "Marketing",
    sales: "Sales", "ae ": "Sales", bd: "Sales",
    "customer success": "Customer Success", "cs ": "Customer Success",
    data: "Data", analytics: "Data",
    finance: "Finance", cfo: "Finance",
    founder: "Founding Team", "co-founder": "Founding Team",
  };
  let role: string | null = null;
  for (const [k, v] of Object.entries(roleMap)) {
    if (q.includes(k)) { role = v; break; }
  }
  let yoeMin = 0;
  let yoeMax = 25;
  if (/senior|principal|head of|vp|chief|director|staff|lead/i.test(query)) yoeMin = 7;
  if (/junior|entry|associate/i.test(query)) yoeMax = 4;
  const hasTech: TriState = /(tech|software|saas|engineering|product|ml|ai|infrastructure)/i.test(query) ? "yes" : "either";
  const hasStartup: TriState = /(startup|founding|early[\s-]stage|pre[\s-]seed|seed|series\s+a)/i.test(query) ? "yes" : "either";
  return { role, yoeMin, yoeMax, hasTech, hasStartup };
}
