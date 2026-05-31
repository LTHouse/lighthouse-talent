// Company workspace data layer: saved searches + shortlists. RLS scopes both to
// the caller's company.
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { CandidateFilters } from "@/lib/constants";

export type SavedSearchRow = Database["public"]["Tables"]["saved_searches"]["Row"];
export type ShortlistRow = Database["public"]["Tables"]["shortlists"]["Row"];

export interface SavedSearch {
  id: string;
  name: string | null;
  kind: string | null;
  filters: Partial<CandidateFilters>;
  results: number | null;
  createdAt: string;
}

export interface Shortlist {
  id: string;
  name: string | null;
  candidateIds: string[];
  createdAt: string;
}

export function savedSearchFromRow(row: SavedSearchRow): SavedSearch {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    filters: (row.filters ?? {}) as Partial<CandidateFilters>,
    results: row.results,
    createdAt: row.created_at,
  };
}

export function shortlistFromRow(row: ShortlistRow): Shortlist {
  return {
    id: row.id,
    name: row.name,
    candidateIds: row.candidate_ids ?? [],
    createdAt: row.created_at,
  };
}

export async function listSavedSearches(): Promise<SavedSearch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(savedSearchFromRow);
}

export async function listShortlists(): Promise<Shortlist[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shortlists")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(shortlistFromRow);
}
