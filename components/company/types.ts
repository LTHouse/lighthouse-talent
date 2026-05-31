// Local-state types for the company portal. These back the not-yet-persisted
// surfaces (saved searches, shortlists, featured carousel, review queue) with
// honest-empty client state. The candidate data itself is LIVE Supabase data.
// TODO(#16/#17/#18): replace these client-state shapes with Supabase tables.
import type { CandidateFilters } from "@/lib/constants";

export type SortBy = "yoe" | "recent" | "name";

export interface SavedSearch {
  id: number;
  name: string;
  kind: "filter" | "advanced";
  query?: string;
  filters?: CandidateFilters;
  createdAt: string;
  results: number;
}

export interface Shortlist {
  id: number;
  name: string;
  candidateIds: string[];
  createdAt: string;
}

export type ReviewStatus = "pending" | "interested" | "passed" | "discussion_requested";

export interface ReviewItem {
  id: number;
  candidateId: string;
  zapNote: string;
  sentAt: string;
  status: ReviewStatus;
  responseReason?: string | null;
}

export interface FeaturedItem {
  candidateId: string;
  curatorNote?: string;
  weekStarting: string; // ISO date; the week the candidate was featured
}

// ── Resources (static content, ported from the Vite app — NOT candidate data) ──
export type ResourceType = "article" | "download";

export interface Resource {
  id: number;
  category: string;
  type: ResourceType;
  title: string;
  desc: string;
  views: number;
  updatedAt: string;
  fileType?: string;
}
