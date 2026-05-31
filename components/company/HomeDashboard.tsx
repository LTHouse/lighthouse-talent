"use client";

import { useMemo, type ReactNode } from "react";
import { Zap, BookOpenCheck, Star } from "lucide-react";
import { Card } from "@/components/ui";
import type { FeaturedWeek, ReviewItem, ReviewStatus, SavedSearch, Shortlist } from "./types";
import FeaturedCarousel from "./FeaturedCarousel";
import ReviewQueueCard from "./ReviewQueueCard";

interface HomeDashboardProps {
  companyName: string;
  reviewQueue: ReviewItem[];
  featured: FeaturedWeek | null;
  searches: SavedSearch[];
  shortlists: Shortlist[];
  onOpenCandidate: (id: string) => void;
  onRespondReview: (reviewId: string, status: ReviewStatus, reason?: string) => void;
  onRequestIntro: (id: string) => void;
  onGoSearch: () => void;
  onLoadSearch: (s: SavedSearch) => void;
  onOpenShortlist: () => void;
}

function SectionHeader({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h2 className="font-display text-2xl mb-3 flex items-baseline gap-2">
      {children}
      {typeof count === "number" && <span className="text-stone-400 text-lg font-display">({count})</span>}
    </h2>
  );
}

export default function HomeDashboard(props: HomeDashboardProps) {
  const {
    companyName, reviewQueue, featured, searches, shortlists,
    onOpenCandidate, onRespondReview, onRequestIntro, onGoSearch, onLoadSearch, onOpenShortlist,
  } = props;

  const greetingName = companyName || "team";
  // Items are already created_at-desc from the data layer; show the un-acted-on
  // (pending) ones first, then any the company has already responded to.
  const sortedQueue = useMemo(() => {
    const pending = reviewQueue.filter((r) => r.status === "pending");
    const responded = reviewQueue.filter((r) => r.status !== "pending");
    return [...pending, ...responded];
  }, [reviewQueue]);

  const featuredEntries = featured?.entries ?? [];
  const weeklyNote = featured?.weeklyNote ?? null;

  const recentSearches = searches.slice(0, 3);
  const recentShortlists = shortlists.slice(0, 3);
  const totalSavedSearches = searches.length;
  const totalShortlists = shortlists.length;
  const lastSearch = searches[0];

  return (
    <div>
      {/* Welcome banner */}
      <div className="mb-8">
        <h1 className="font-display text-4xl leading-tight">Welcome back, {greetingName}.</h1>
      </div>

      {/* SECTION 1: Featured this week */}
      <section className="border-t border-stone-200 pt-8 pb-10">
        <SectionHeader>Featured this week <Zap size={18} className="text-amber-500 fill-amber-500 inline align-middle ml-1" /></SectionHeader>
        {weeklyNote && (
          <blockquote className="border-l-4 border-amber-400 pl-4 py-1 text-base text-stone-700 italic mb-5 max-w-3xl">{weeklyNote}</blockquote>
        )}
        {featuredEntries.length === 0 ? (
          <p className="text-sm text-stone-500">
            No featured talent yet. <button onClick={onGoSearch} className="text-amber-600 hover:underline">Browse the full network →</button>
          </p>
        ) : (
          <FeaturedCarousel entries={featuredEntries} onOpenCandidate={onOpenCandidate} />
        )}
      </section>

      {/* SECTION 2: Sent for Review */}
      <section className="border-t border-stone-200 pt-8 pb-10">
        <SectionHeader count={sortedQueue.length}>Sent to you for review</SectionHeader>
        {sortedQueue.length === 0 ? (
          <p className="text-sm text-stone-500">Nothing waiting for review. Zap will send candidates here when there&apos;s a fit.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory">
            {sortedQueue.map((r) => {
              const c = r.candidate;
              if (!c) return null;
              return <ReviewQueueCard key={r.id} review={r} candidate={c}
                onOpen={() => onOpenCandidate(c.id)}
                onRespond={(status, reason) => onRespondReview(r.id, status, reason)}
                onRequestIntro={() => onRequestIntro(c.id)} />;
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: Quick Access */}
      <section className="border-t border-stone-200 pt-8 pb-4">
        <SectionHeader>Quick Access</SectionHeader>
        {totalSavedSearches === 0 && totalShortlists === 0 ? (
          <p className="text-sm text-stone-500">Your recent searches and shortlists will appear here.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            <Card padded={false} className="p-5">
              <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3 flex items-center gap-1.5"><BookOpenCheck size={12} /> Recent Searches</div>
              {recentSearches.length === 0 ? (
                <div className="text-sm text-stone-500 py-2">No saved searches yet.</div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {recentSearches.map((s) => (
                    <button key={s.id} onClick={() => onLoadSearch(s)} className="w-full text-left flex items-center justify-between gap-2 py-2.5 hover:text-amber-600 group">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{s.name ?? "Untitled search"}</div>
                        <div className="text-xs text-stone-500">{s.createdAt.slice(0, 10)}{s.results !== null ? ` · ${s.results} results` : ""}</div>
                      </div>
                      <span className="text-xs font-bold text-stone-500 group-hover:text-amber-600 flex-shrink-0">Run →</span>
                    </button>
                  ))}
                </div>
              )}
              {totalSavedSearches > 3 && lastSearch && (
                <button onClick={() => onLoadSearch(lastSearch)} className="mt-3 text-xs font-bold text-stone-500 hover:text-amber-600">View all {totalSavedSearches} saved searches →</button>
              )}
            </Card>
            <Card padded={false} className="p-5">
              <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3 flex items-center gap-1.5"><Star size={12} /> Recent Shortlists</div>
              {recentShortlists.length === 0 ? (
                <div className="text-sm text-stone-500 py-2">No shortlists yet.</div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {recentShortlists.map((s) => (
                    <button key={s.id} onClick={onOpenShortlist} className="w-full text-left flex items-center justify-between gap-2 py-2.5 hover:text-amber-600 group">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{s.name ?? "Untitled shortlist"}</div>
                        <div className="text-xs text-stone-500">{s.candidateIds.length} candidates{s.createdAt ? ` · ${s.createdAt.slice(0, 10)}` : ""}</div>
                      </div>
                      <span className="text-xs font-bold text-stone-500 group-hover:text-amber-600 flex-shrink-0">Open →</span>
                    </button>
                  ))}
                </div>
              )}
              {totalShortlists > 3 && (
                <button onClick={onOpenShortlist} className="mt-3 text-xs font-bold text-stone-500 hover:text-amber-600">View all {totalShortlists} shortlists →</button>
              )}
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
