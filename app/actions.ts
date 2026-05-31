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

// Admin approves / declines an intro request. On approval, fire the (toggle-gated)
// Resend email Edge Function — it no-ops unless the outbound_emails master toggle
// is on, so this is safe to always call (#17).
export async function respondIntroAction(id: string, status: "approved" | "declined"): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "admin") return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase.from("intro_requests").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (status === "approved") {
    const { data: row } = await supabase
      .from("intro_requests")
      .select("message, candidates(first_name, last_name, email), companies(name)")
      .eq("id", id)
      .maybeSingle();
    const cand = row?.candidates;
    if (cand?.email) {
      // Best-effort; the function self-gates on the master toggle.
      await supabase.functions.invoke("send-intro-email", {
        body: {
          to: cand.email,
          candidateName: [cand.first_name, cand.last_name].filter(Boolean).join(" "),
          companyName: row?.companies?.name ?? "A company",
          reason: row?.message ?? "",
        },
      }).catch(() => { /* email is non-critical; never block the approval */ });
    }
  }

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

// ============================================================
// Sub-feature write paths (companies, workspace, featured, review)
// ============================================================
type Json = Database["public"]["Tables"]["saved_searches"]["Insert"]["filters"];

// ---- Companies (admin) ----
export async function createCompanyAction(input: {
  name: string; stage?: string; industry?: string; team?: number;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "admin") return { ok: false, error: "Not authorized." };
  if (!input.name?.trim()) return { ok: false, error: "Company name is required." };
  const supabase = await createClient();
  const { error } = await supabase.from("companies").insert({
    name: input.name.trim(),
    stage: input.stage || null,
    industry: input.industry || null,
    team: input.team ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

// ---- Saved searches (company) ----
export async function saveSearchAction(input: {
  name: string; kind: string; filters: Json; results: number;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "company" || !user.companyId) return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase.from("saved_searches").insert({
    company_id: user.companyId, name: input.name, kind: input.kind,
    filters: input.filters, results: input.results,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/company");
  return { ok: true };
}

export async function deleteSavedSearchAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "company") return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase.from("saved_searches").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/company");
  return { ok: true };
}

// ---- Shortlists (company) ----
export async function createShortlistAction(name: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "company" || !user.companyId) return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase.from("shortlists").insert({
    company_id: user.companyId, name, candidate_ids: [],
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/company");
  return { ok: true };
}

// Client computes the new id set (add/remove) and sends it; RLS scopes to the company.
export async function setShortlistCandidatesAction(id: string, candidateIds: string[]): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "company") return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase.from("shortlists").update({ candidate_ids: candidateIds }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/company");
  return { ok: true };
}

// ---- Featured talent (admin) ----
export async function upsertFeaturedWeekAction(weekStarting: string, weeklyNote: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "admin") return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("featured_talent_weeks")
    .upsert({ week_starting: weekStarting, weekly_note: weeklyNote }, { onConflict: "week_starting" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/company");
  return { ok: true };
}

export async function setFeaturedCandidateAction(
  weekStarting: string, candidateId: string, present: boolean, curatorNote = ""
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "admin") return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  // Ensure the week row exists first (FK target).
  await supabase.from("featured_talent_weeks").upsert({ week_starting: weekStarting }, { onConflict: "week_starting" });
  const { error } = present
    ? await supabase.from("featured_candidates").upsert(
        { week_starting: weekStarting, candidate_id: candidateId, curator_note: curatorNote },
        { onConflict: "week_starting,candidate_id" }
      )
    : await supabase.from("featured_candidates").delete()
        .eq("week_starting", weekStarting).eq("candidate_id", candidateId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/company");
  return { ok: true };
}

// ---- Sent for review ----
export async function sendForReviewAction(input: {
  candidateId: string; companyId: string; note: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "admin") return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase.from("sent_for_review").insert({
    candidate_id: input.candidateId,
    sent_to_company_id: input.companyId,
    sent_by: user.name,
    zap_note: input.note,
    status: "pending",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/company");
  return { ok: true };
}

export async function respondToReviewAction(
  id: string, status: "interested" | "passed", reason?: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await getSessionUser();
  if (user?.role !== "company") return { ok: false, error: "Not authorized." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("sent_for_review")
    .update({ status, response_reason: reason ?? null, responded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/company");
  return { ok: true };
}
