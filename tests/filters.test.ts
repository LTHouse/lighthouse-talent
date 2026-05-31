import { describe, it, expect } from "vitest";
import { filterCandidates, interpretNL } from "@/lib/filters";
import { DEFAULT_FILTERS, type CandidateFilters } from "@/lib/constants";
import type { Candidate } from "@/lib/data/candidates";

// Minimal Candidate factory — only the fields filterCandidates reads matter.
function cand(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "c1", userId: null, firstName: "A", lastName: "B", email: null, phone: null,
    linkedin: null, linkedinVerified: false, photoSeed: 0, currentRole: null,
    currentCompany: null, yearsExperience: 5, currentLocation: "Nashville, TN",
    location: null, relocationStatus: "in_tn", workMode: "Hybrid", primaryRole: "Engineering",
    roleTypes: ["Engineering"], workHistory: [], education: [], hasStartupExperience: true,
    startupStage: null, startupSize: null, hasTechExperience: true, rankedMotivations: [],
    topMotivation: null, status: "active", vettingStatus: "Active", declined: false,
    dateApplied: null, introRequests: 0, lastActivity: null, adminNotes: null,
    adminInternalStatus: null, tag: null, isDemo: false, intakeSource: "imported",
    vettedInPerson: false, vettedAt: null, vettedBy: null, linkedinRefreshPriority: "normal",
    ...overrides,
  };
}
const f = (o: Partial<CandidateFilters> = {}): CandidateFilters => ({ ...DEFAULT_FILTERS, ...o });

describe("filterCandidates", () => {
  it("only surfaces active, non-declined candidates", () => {
    const list = [cand({ id: "a", status: "active" }), cand({ id: "b", status: "applied" }), cand({ id: "c", status: "active", declined: true })];
    expect(filterCandidates(f(), list).map((c) => c.id)).toEqual(["a"]);
  });

  it("vettedOnly keeps only vetted-in-person", () => {
    const list = [cand({ id: "v", vettedInPerson: true }), cand({ id: "n", vettedInPerson: false })];
    expect(filterCandidates(f({ vettedOnly: true }), list).map((c) => c.id)).toEqual(["v"]);
  });

  it("filters by role (primaryRole or roleTypes)", () => {
    const list = [cand({ id: "eng", primaryRole: "Engineering", roleTypes: ["Engineering"] }), cand({ id: "sales", primaryRole: "Sales", roleTypes: ["Sales"] })];
    expect(filterCandidates(f({ roles: ["Sales"] }), list).map((c) => c.id)).toEqual(["sales"]);
  });

  it("filters by YOE range", () => {
    const list = [cand({ id: "jr", yearsExperience: 2 }), cand({ id: "sr", yearsExperience: 10 })];
    expect(filterCandidates(f({ yoeMin: 5, yoeMax: 25 }), list).map((c) => c.id)).toEqual(["sr"]);
  });

  it("hasTech / hasStartup tri-state", () => {
    const list = [cand({ id: "tech", hasTechExperience: true }), cand({ id: "notech", hasTechExperience: false })];
    expect(filterCandidates(f({ hasTech: "yes" }), list).map((c) => c.id)).toEqual(["tech"]);
    expect(filterCandidates(f({ hasTech: "no" }), list).map((c) => c.id)).toEqual(["notech"]);
    expect(filterCandidates(f({ hasTech: "either" }), list)).toHaveLength(2);
  });

  it("location-availability filter only applies for a subset", () => {
    const list = [cand({ id: "tn", relocationStatus: "in_tn" }), cand({ id: "remote", relocationStatus: "remote_only" })];
    expect(filterCandidates(f({ locAvailability: ["remote_only"] }), list).map((c) => c.id)).toEqual(["remote"]);
    expect(filterCandidates(f(), list)).toHaveLength(2); // all three selected = no filter
  });

  it("workMode filter", () => {
    const list = [cand({ id: "h", workMode: "Hybrid" }), cand({ id: "r", workMode: "Remote" })];
    expect(filterCandidates(f({ workModes: ["Remote"] }), list).map((c) => c.id)).toEqual(["r"]);
  });
});

describe("interpretNL", () => {
  it("maps role keywords", () => {
    expect(interpretNL("senior software engineer").role).toBe("Engineering");
    expect(interpretNL("product manager").role).toBe("Product");
    expect(interpretNL("head of sales").role).toBe("Sales");
  });
  it("infers seniority into YOE", () => {
    expect(interpretNL("senior engineer").yoeMin).toBe(7);
    expect(interpretNL("junior designer").yoeMax).toBe(4);
  });
  it("detects tech/startup signal", () => {
    expect(interpretNL("startup founding engineer").hasStartup).toBe("yes");
    expect(interpretNL("saas product").hasTech).toBe("yes");
    expect(interpretNL("a barista").hasTech).toBe("either");
  });
});
