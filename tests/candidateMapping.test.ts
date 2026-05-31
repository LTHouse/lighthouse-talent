import { describe, it, expect } from "vitest";
// The seed/script mapping module (pure, no DB import) — same translation logic
// the data layer relies on.
import {
  candidateToRow,
  candidatePatchToRow,
  candidateFromRow,
  STATUS_DB_TO_DISPLAY,
  STATUS_DISPLAY_TO_DB,
  // @ts-expect-error — plain JS module, no types
} from "../scripts/candidate-mapping.js";

describe("candidateToRow", () => {
  it("maps camelCase to snake_case columns and drops undefined", () => {
    const row = candidateToRow({ firstName: "Ada", currentRole: "Engineer", yearsExperience: 7, linkedin: "https://li/in/ada" });
    expect(row.first_name).toBe("Ada");
    expect(row.current_role_title).toBe("Engineer");
    expect(row.years_experience).toBe(7);
    expect(row.linkedin_url).toBe("https://li/in/ada");
    expect("last_name" in row).toBe(false); // undefined dropped
  });
});

describe("candidatePatchToRow", () => {
  it("maps known camelCase keys", () => {
    expect(candidatePatchToRow({ adminNotes: "hi" })).toEqual({ admin_notes: "hi" });
  });
  it("passes snake_case-native keys through untouched", () => {
    const r = candidatePatchToRow({ vetted_in_person: true, vetted_at: "2026-01-01", status: "active" });
    expect(r).toEqual({ vetted_in_person: true, vetted_at: "2026-01-01", status: "active" });
  });
  it("translates a display vettingStatus into the enum", () => {
    expect(candidatePatchToRow({ vettingStatus: "Active" }).status).toBe("active");
  });
});

describe("status maps", () => {
  it("round-trip display <-> enum", () => {
    expect(STATUS_DB_TO_DISPLAY.active).toBe("Active");
    expect(STATUS_DISPLAY_TO_DB["Active"]).toBe("active");
  });
});

describe("candidateFromRow", () => {
  it("maps a row to the camelCase shape with vettingStatus", () => {
    const c = candidateFromRow({
      id: "x", first_name: "Ada", last_name: "Lovelace", status: "active",
      role_types: ["Engineering"], work_history: [], education: [], ranked_motivations: [],
    });
    expect(c.firstName).toBe("Ada");
    expect(c.lastName).toBe("Lovelace");
    expect(c.vettingStatus).toBe("Active");
  });
});
