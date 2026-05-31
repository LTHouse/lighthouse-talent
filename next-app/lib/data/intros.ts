// Intro-request data layer (typed). Companies request warm intros; admins
// approve/decline. RLS scopes company reads/inserts to their own company.
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type IntroRow = Database["public"]["Tables"]["intro_requests"]["Row"];

export interface IntroRequest {
  id: string;
  candidateId: string | null;
  companyId: string | null;
  status: string;
  message: string | null;
  createdAt: string;
}

export function introFromRow(row: IntroRow): IntroRequest {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    companyId: row.company_id,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
  };
}

// Admin sees all; company sees its own (RLS enforces either way).
export async function listIntroRequests(): Promise<IntroRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("intro_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(introFromRow);
}
