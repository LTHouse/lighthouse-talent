// Featured Talent of the Week. Admin curates; companies read. The "current week"
// is the Monday of the current week (ISO).
import { createClient } from "@/lib/supabase/server";
import { candidateFromRow, type Candidate } from "./candidates";

export interface FeaturedEntry {
  candidate: Candidate;
  curatorNote: string | null;
}
export interface FeaturedWeek {
  weekStarting: string;
  weeklyNote: string | null;
  entries: FeaturedEntry[];
}

// Monday (ISO) of the week containing `d` (default: today), as YYYY-MM-DD.
export function isoWeekStart(d = new Date()): string {
  const date = new Date(d);
  const dow = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - dow);
  return date.toISOString().slice(0, 10);
}

// Fetch a week + its featured candidates (joined). Returns null if no such week.
export async function getFeaturedWeek(weekStarting: string): Promise<FeaturedWeek | null> {
  const supabase = await createClient();
  const { data: week } = await supabase
    .from("featured_talent_weeks")
    .select("*")
    .eq("week_starting", weekStarting)
    .maybeSingle();
  if (!week) return null;

  const { data: fc } = await supabase
    .from("featured_candidates")
    .select("curator_note, candidates(*)")
    .eq("week_starting", weekStarting);

  const entries: FeaturedEntry[] = (fc ?? [])
    .filter((r) => r.candidates)
    .map((r) => ({
      curatorNote: r.curator_note,
      candidate: candidateFromRow(r.candidates!),
    }));

  return { weekStarting: week.week_starting, weeklyNote: week.weekly_note, entries };
}

export async function getCurrentFeatured(): Promise<FeaturedWeek | null> {
  return getFeaturedWeek(isoWeekStart());
}
