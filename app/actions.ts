"use server";

// Server Actions — the typed write paths. All DB writes go through here (or the
// data layer); components never mutate Supabase directly. Each re-validates the
// affected route so the server-rendered data refreshes.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import type { CandidateStatus } from "@/lib/data/candidates";

type CandidateUpdate = Database["public"]["Tables"]["candidates"]["Update"];

export interface CandidatePatch {
  status?: CandidateStatus;
  adminNotes?: string;
  adminInternalStatus?: string | null;
  vettedInPerson?: boolean;
  vettedAt?: string | null;
  vettedBy?: string | null;
  linkedinRefreshPriority?: string;
}

function patchToRow(patch: CandidatePatch): CandidateUpdate {
  const row: CandidateUpdate = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.adminNotes !== undefined) row.admin_notes = patch.adminNotes;
  if (patch.adminInternalStatus !== undefined) row.admin_internal_status = patch.adminInternalStatus;
  if (patch.vettedInPerson !== undefined) row.vetted_in_person = patch.vettedInPerson;
  if (patch.vettedAt !== undefined) row.vetted_at = patch.vettedAt;
  if (patch.vettedBy !== undefined) row.vetted_by = patch.vettedBy;
  if (patch.linkedinRefreshPriority !== undefined) row.linkedin_refresh_priority = patch.linkedinRefreshPriority;
  return row;
}

// Admin-only candidate mutation. RLS also enforces admin, but we check the role
// here too so we can fail clearly.
export async function updateCandidateAction(id: string, patch: CandidatePatch): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "admin") return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase.from("candidates").update(patchToRow(patch)).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

// Company requests a warm intro to a candidate.
export async function createIntroRequestAction(candidateId: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "company" || !user.companyId) return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase.from("intro_requests").insert({
    candidate_id: candidateId,
    company_id: user.companyId,
    message,
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/company");
  return { ok: true };
}

// Admin approves / declines an intro request.
export async function respondIntroAction(id: string, status: "approved" | "declined"): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "admin") return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase.from("intro_requests").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export interface IntakeForm {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedin?: string;
  currentRole?: string;
  currentCompany?: string;
  yearsExperience?: number;
  currentLocation?: string;
  relocationStatus?: string;
  workMode?: string;
  primaryRole?: string;
  roleTypes?: string[];
  honeypot?: string; // anti-spam: must be empty
}

// Public talent application (anon). RLS only allows inserting status='applied',
// is_demo=false. Honeypot: if filled, pretend success without inserting (#15).
export async function submitIntakeAction(form: IntakeForm): Promise<{ ok: boolean; error?: string }> {
  if (form.honeypot) return { ok: true }; // bot — silently drop
  if (!form.firstName || !form.lastName || !form.email) {
    return { ok: false, error: "Name and email are required." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("candidates").insert({
    first_name: form.firstName,
    last_name: form.lastName,
    email: form.email,
    phone: form.phone ?? null,
    linkedin_url: form.linkedin ?? null,
    current_role_title: form.currentRole ?? null,
    current_company: form.currentCompany ?? null,
    years_experience: form.yearsExperience ?? null,
    current_location: form.currentLocation ?? null,
    relocation_status: form.relocationStatus ?? null,
    work_mode: form.workMode ?? null,
    primary_role: form.primaryRole ?? null,
    role_types: form.roleTypes ?? [],
    status: "applied",
    is_demo: false,
    intake_source: "manual_entry",
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
