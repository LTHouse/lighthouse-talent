// "Sent for review" — admin pushes a candidate to a company's review queue.
// Admin sees all; a company sees its own (RLS).
import { createClient } from "@/lib/supabase/server";
import { candidateFromRow, type Candidate } from "./candidates";

export interface ReviewItem {
  id: string;
  candidate: Candidate | null;
  sentToCompanyId: string | null;
  sentBy: string | null;
  zapNote: string | null;
  status: string;
  responseReason: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export async function listSentForReview(): Promise<ReviewItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sent_for_review")
    .select("*, candidates(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    candidate: r.candidates ? candidateFromRow(r.candidates) : null,
    sentToCompanyId: r.sent_to_company_id,
    sentBy: r.sent_by,
    zapNote: r.zap_note,
    status: r.status,
    responseReason: r.response_reason,
    createdAt: r.created_at,
    respondedAt: r.responded_at,
  }));
}
