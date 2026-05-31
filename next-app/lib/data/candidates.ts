// Candidate data layer (typed). The ONLY module that queries the candidates
// table. UI calls these functions; it never builds Supabase queries itself.
// Rows are typed from the generated Database types and mapped to the camelCase
// shape the UI renders.
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type CandidateRow = Database["public"]["Tables"]["candidates"]["Row"];
export type CandidateStatus = Database["public"]["Enums"]["candidate_status"];
export type AppRole = Database["public"]["Enums"]["user_role"];

const STATUS_DB_TO_DISPLAY: Record<CandidateStatus, string> = {
  applied: "New",
  reviewing: "Reviewing",
  vetting_scheduled: "Vetting Call Scheduled",
  active: "Active",
  pre_onboard: "Pre-Onboarding",
  hidden: "Hidden",
  archived: "Declined",
};

export interface Candidate {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  linkedin: string | null;
  currentRole: string | null;
  currentCompany: string | null;
  yearsExperience: number | null;
  location: string | null;
  primaryRole: string | null;
  roleTypes: string[];
  status: CandidateStatus;
  vettingStatus: string;
  isDemo: boolean;
}

export function candidateFromRow(row: CandidateRow): Candidate {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    linkedin: row.linkedin_url,
    currentRole: row.current_role_title,
    currentCompany: row.current_company,
    yearsExperience: row.years_experience,
    location: row.location,
    primaryRole: row.primary_role,
    roleTypes: row.role_types ?? [],
    status: row.status,
    vettingStatus: STATUS_DB_TO_DISPLAY[row.status] ?? row.status,
    isDemo: row.is_demo,
  };
}

// UX-only role filter; RLS is the real boundary (see supabase/migrations).
export async function listCandidates(role: AppRole | null, userId?: string): Promise<Candidate[]> {
  const supabase = await createClient();
  let query = supabase.from("candidates").select("*");
  if (role === "company") {
    query = query.eq("is_demo", false).eq("status", "active");
  } else if (role === "talent" && userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(candidateFromRow);
}
