// Company portal view types. Saved searches, shortlists, the featured carousel,
// and the review queue are now LIVE Supabase data (re-exported from the data
// layer). The candidate data itself is also LIVE Supabase data.
export type { SavedSearch, Shortlist } from "@/lib/data/workspace";
export type { ReviewItem } from "@/lib/data/sentForReview";
export type { FeaturedEntry, FeaturedWeek } from "@/lib/data/featured";

export type SortBy = "yoe" | "recent" | "name";

// The company can respond to a review item with one of these (matches
// respondToReviewAction). Pending is the un-acted-on state.
export type ReviewStatus = "pending" | "interested" | "passed";

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
