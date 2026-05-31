// Shared constants ported from the Vite app. Single source of truth for the
// filter/role/status vocabularies the portals share.
import type { CandidateStatus } from "@/lib/data/candidates";

export const ROLE_TYPES = [
  "Engineering", "Product", "Design", "Operations", "Marketing",
  "Sales", "Customer Success", "Data", "Finance", "Founding Team", "Other",
] as const;

export const WORK_MODES = ["In-person Nashville", "Hybrid", "Remote", "Open"] as const;

export const RELOCATION_LABELS: Record<string, string> = {
  in_tn: "In Tennessee",
  willing_to_relocate: "Willing to relocate to Nashville",
  remote_only: "Remote only",
};

export const RELOCATION_OPTIONS = [
  { value: "in_tn", label: "I'm already in Tennessee" },
  { value: "willing_to_relocate", label: "I'm willing to relocate to Nashville for the right role" },
  { value: "remote_only", label: "I'm only interested in remote roles" },
] as const;

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  applied: "New",
  reviewing: "Reviewing",
  vetting_scheduled: "Vetting Call Scheduled",
  active: "Active",
  pre_onboard: "Pre-Onboarding",
  hidden: "Hidden",
  archived: "Archived",
};

export const STATUS_ORDER: CandidateStatus[] = [
  "pre_onboard", "applied", "reviewing", "vetting_scheduled", "active", "hidden", "archived",
];

// Deterministic avatar palette (bg, fg).
export const AVATAR_COLORS: ReadonlyArray<readonly [string, string]> = [
  ["#FACC15", "#0A0A0A"], ["#FB923C", "#0A0A0A"], ["#38BDF8", "#0A0A0A"], ["#A78BFA", "#fff"],
  ["#F87171", "#fff"], ["#34D399", "#0A0A0A"], ["#FBBF24", "#0A0A0A"], ["#F472B6", "#fff"],
];

export type TriState = "yes" | "no" | "either";

export interface CandidateFilters {
  vettedOnly: boolean;
  roles: string[];
  yoeMin: number;
  yoeMax: number;
  hasTech: TriState;
  hasStartup: TriState;
  locAvailability: string[];
  currentLocationFilter: string;
  workModes: string[];
}

export const DEFAULT_FILTERS: CandidateFilters = {
  vettedOnly: false,
  roles: [],
  yoeMin: 0,
  yoeMax: 25,
  hasTech: "either",
  hasStartup: "either",
  locAvailability: ["in_tn", "willing_to_relocate", "remote_only"],
  currentLocationFilter: "",
  workModes: [],
};
