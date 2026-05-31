// Candidate data layer (typed). The ONLY module that queries the candidates
// table. Rows are typed from the generated Database types and mapped to one clean
// camelCase shape the UI uses everywhere (the Vite app mixed snake/camel — we don't).
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type CandidateRow = Database["public"]["Tables"]["candidates"]["Row"];
export type CandidateStatus = Database["public"]["Enums"]["candidate_status"];
export type AppRole = Database["public"]["Enums"]["user_role"];

export interface WorkHistoryEntry {
  title?: string;
  company?: string;
  startYear?: number;
  endYear?: number | null;
}
export interface EducationEntry {
  school?: string;
  degree?: string;
  year?: number;
}

export interface Candidate {
  id: string;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  linkedinVerified: boolean;
  photoSeed: number | null;
  currentRole: string | null;
  currentCompany: string | null;
  yearsExperience: number | null;
  currentLocation: string | null;
  location: string | null;
  relocationStatus: string | null;
  workMode: string | null;
  primaryRole: string | null;
  roleTypes: string[];
  workHistory: WorkHistoryEntry[];
  education: EducationEntry[];
  hasStartupExperience: boolean | null;
  startupStage: string | null;
  startupSize: string | null;
  hasTechExperience: boolean | null;
  rankedMotivations: string[];
  topMotivation: string | null;
  status: CandidateStatus;
  vettingStatus: string;
  declined: boolean;
  dateApplied: string | null;
  introRequests: number;
  lastActivity: string | null;
  adminNotes: string | null;
  adminInternalStatus: string | null;
  tag: string | null;
  isDemo: boolean;
  intakeSource: string;
  vettedInPerson: boolean;
  vettedAt: string | null;
  vettedBy: string | null;
  linkedinRefreshPriority: string;
}

const STATUS_DB_TO_DISPLAY: Record<CandidateStatus, string> = {
  applied: "New",
  reviewing: "Reviewing",
  vetting_scheduled: "Vetting Call Scheduled",
  active: "Active",
  pre_onboard: "Pre-Onboarding",
  hidden: "Hidden",
  archived: "Declined",
};

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function candidateFromRow(row: CandidateRow): Candidate {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    linkedin: row.linkedin_url,
    linkedinVerified: row.linkedin_verified,
    photoSeed: row.photo_seed,
    currentRole: row.current_role_title,
    currentCompany: row.current_company,
    yearsExperience: row.years_experience,
    currentLocation: row.current_location,
    location: row.location,
    relocationStatus: row.relocation_status,
    workMode: row.work_mode,
    primaryRole: row.primary_role,
    roleTypes: row.role_types ?? [],
    workHistory: asArray<WorkHistoryEntry>(row.work_history),
    education: asArray<EducationEntry>(row.education),
    hasStartupExperience: row.has_startup_experience,
    startupStage: row.startup_stage,
    startupSize: row.startup_size,
    hasTechExperience: row.has_tech_experience,
    rankedMotivations: row.ranked_motivations ?? [],
    topMotivation: row.top_motivation,
    status: row.status,
    vettingStatus: STATUS_DB_TO_DISPLAY[row.status] ?? row.status,
    declined: row.declined,
    dateApplied: row.date_applied,
    introRequests: row.intro_requests,
    lastActivity: row.last_activity,
    adminNotes: row.admin_notes,
    adminInternalStatus: row.admin_internal_status,
    tag: row.tag,
    isDemo: row.is_demo,
    intakeSource: row.intake_source,
    vettedInPerson: row.vetted_in_person,
    vettedAt: row.vetted_at,
    vettedBy: row.vetted_by,
    linkedinRefreshPriority: row.linkedin_refresh_priority,
  };
}

// UX-only role filter; RLS is the real boundary (see supabase/migrations).
export async function listCandidates(role: AppRole | null, userId?: string): Promise<Candidate[]> {
  const supabase = await createClient();
  let query = supabase.from("candidates").select("*").order("created_at", { ascending: true });
  if (role === "company") {
    query = query.eq("is_demo", false).eq("status", "active");
  } else if (role === "talent" && userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(candidateFromRow);
}

export async function getCandidate(id: string): Promise<Candidate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("candidates").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? candidateFromRow(data) : null;
}
