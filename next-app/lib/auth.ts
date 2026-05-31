// Server-side session + role resolution. A user's role comes from public.users
// (never defaulted): no row → not provisioned. Mirrors the Vite app's rule.
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/data/candidates";

export interface SessionUser {
  id: string;
  email: string | null;
  name: string;
  role: AppRole;
  candidateId: string | null;
  companyId: string | null;
}

// Returns the provisioned user, or null if signed out / not set up yet.
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null; // authenticated but not provisioned

  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  return {
    id: user.id,
    email: user.email ?? null,
    name: meta.full_name || meta.name || (user.email ?? "").split("@")[0] || "there",
    role: profile.role,
    candidateId: profile.candidate_id,
    companyId: profile.company_id,
  };
}
