"use client";

// Company portal shell — owns all interactive state: tab nav, the filter-first
// search (with the Advanced NL box), candidate drill-in, and the intro modal.
// Candidates are LIVE Supabase data passed from the server component; search and
// filtering happen client-side over that array (same behavior as the Vite app).
// Saved searches, shortlists, the featured carousel, and the review queue are
// local component state for now (honest-empty start).
// TODO(#16/#17/#18): wire saved searches / shortlists / featured / review queue to Supabase.
import { useMemo, useState } from "react";
import { Zap, Home, Search, BookOpenCheck, Star, FileText } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import { filterCandidates, interpretNL } from "@/lib/filters";
import { DEFAULT_FILTERS } from "@/lib/constants";
import type { CandidateFilters } from "@/lib/constants";
import type { Candidate } from "@/lib/data/candidates";
import { createIntroRequestAction } from "@/app/actions";
import type { FeaturedItem, ReviewItem, ReviewStatus, SavedSearch, Shortlist } from "./types";
import HomeDashboard from "./HomeDashboard";
import CompanySearch from "./CompanySearch";
import CandidateProfile from "./CandidateProfile";
import IntroRequestModal from "./IntroRequestModal";
import MySearchesView from "./MySearchesView";
import ShortlistsView from "./ShortlistsView";
import ResourcesView from "./ResourcesView";

type Tab = "home" | "search" | "searches" | "shortlists" | "resources";

interface CompanyPortalClientProps {
  candidates: Candidate[];
  companyName: string;
}

const NAV: ReadonlyArray<{ k: Tab; l: string; icon: typeof Home }> = [
  { k: "home", l: "Home", icon: Home },
  { k: "search", l: "Search", icon: Search },
  { k: "searches", l: "My Searches", icon: BookOpenCheck },
  { k: "shortlists", l: "Shortlists", icon: Star },
  { k: "resources", l: "Resources", icon: FileText },
];

// Current featured week — local-state placeholder until the featured table exists.
const NOW_WEEK = new Date().toISOString().slice(0, 10);

export default function CompanyPortalClient({ candidates, companyName }: CompanyPortalClientProps) {
  const [tab, setTab] = useState<Tab>("home");
  const [filters, setFilters] = useState<CandidateFilters>(DEFAULT_FILTERS);
  const [nlQuery, setNlQuery] = useState("");
  const [usedAdvanced, setUsedAdvanced] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Candidate[]>([]);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [showIntroModalId, setShowIntroModalId] = useState<string | null>(null);
  const [introSubmitting, setIntroSubmitting] = useState(false);
  const [introError, setIntroError] = useState<string | null>(null);
  const [introToast, setIntroToast] = useState<string | null>(null);

  // ── Local-state surfaces (honest-empty start; not yet persisted) ──
  // TODO(#16/#17/#18): wire to Supabase.
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [featuredItems] = useState<FeaturedItem[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([]);
  const weeklyNote: string | null = null;

  const activeCandidate = useMemo(
    () => (activeCandidateId ? candidates.find((c) => c.id === activeCandidateId) ?? null : null),
    [activeCandidateId, candidates],
  );
  const introCandidate = useMemo(
    () => (showIntroModalId ? candidates.find((c) => c.id === showIntroModalId) ?? null : null),
    [showIntroModalId, candidates],
  );

  function runFilterSearch(currentFilters: CandidateFilters = filters) {
    setLoading(true);
    setUsedAdvanced(false);
    window.setTimeout(() => {
      setResults(filterCandidates(currentFilters, candidates));
      setSearched(true);
      setLoading(false);
    }, 600);
  }

  function runAdvancedSearch() {
    setLoading(true);
    setUsedAdvanced(true);
    window.setTimeout(() => {
      const interp = interpretNL(nlQuery);
      const merged: CandidateFilters = {
        ...filters,
        roles: interp.role ? [interp.role] : filters.roles,
        yoeMin: interp.yoeMin,
        yoeMax: interp.yoeMax,
        hasTech: interp.hasTech,
        hasStartup: interp.hasStartup,
      };
      setFilters(merged);
      setResults(filterCandidates(merged, candidates));
      setSearched(true);
      setLoading(false);
    }, 1200);
  }

  function saveCurrentSearch() {
    const name = window.prompt("Name this saved search:", "");
    if (!name) return;
    const record: SavedSearch = {
      id: Date.now(),
      name,
      kind: usedAdvanced ? "advanced" : "filter",
      query: usedAdvanced ? nlQuery : undefined,
      filters: usedAdvanced ? undefined : filters,
      createdAt: new Date().toISOString().slice(0, 10),
      results: results.length,
    };
    setSearches((arr) => [...arr, record]);
  }

  function loadSearch(s: SavedSearch) {
    if (s.kind === "filter") {
      const next = { ...DEFAULT_FILTERS, ...s.filters };
      setFilters(next);
      setNlQuery("");
      setUsedAdvanced(false);
      setTab("search");
      setActiveCandidateId(null);
      window.setTimeout(() => runFilterSearch(next), 50);
    } else {
      setNlQuery(s.query ?? "");
      setUsedAdvanced(true);
      setTab("search");
      setActiveCandidateId(null);
      window.setTimeout(() => runAdvancedSearch(), 50);
    }
  }

  function addToShortlist(shortlistId: number, candidateId: string) {
    setShortlists((arr) =>
      arr.map((s) =>
        s.id === shortlistId
          ? { ...s, candidateIds: Array.from(new Set([...s.candidateIds, candidateId])) }
          : s,
      ),
    );
  }

  function respondToReview(reviewId: number, status: ReviewStatus, reason?: string) {
    setReviewQueue((arr) =>
      arr.map((r) => (r.id === reviewId ? { ...r, status, responseReason: reason ?? null } : r)),
    );
  }

  async function submitIntroRequest(candidateId: string, reason: string) {
    setIntroSubmitting(true);
    setIntroError(null);
    const res = await createIntroRequestAction(candidateId, reason);
    setIntroSubmitting(false);
    if (res.ok) {
      setShowIntroModalId(null);
      setIntroToast("Intro request submitted. Zap will review and reach out.");
      window.setTimeout(() => setIntroToast(null), 5000);
    } else {
      setIntroError(res.error ?? "Something went wrong. Please try again.");
    }
  }

  function openTab(next: Tab) {
    setTab(next);
    setActiveCandidateId(null);
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-6">
            <button onClick={() => openTab("home")} className="flex items-center gap-2 hover:text-amber-600">
              <Zap className="text-amber-500 fill-amber-500" size={18} />
              <span className="font-display tracking-tight font-bold">Lighthouse</span>
              <span className="text-stone-500 text-xs">Hire</span>
            </button>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((it) => {
                const Icon = it.icon;
                return (
                  <button key={it.k} onClick={() => openTab(it.k)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1.5 ${tab === it.k ? "bg-stone-100 text-amber-600" : "text-stone-500 hover:text-black"}`}>
                    <Icon size={14} />{it.l}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <SignOutButton />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeCandidate ? (
          <CandidateProfile candidate={activeCandidate} onBack={() => setActiveCandidateId(null)}
            onRequestIntro={() => setShowIntroModalId(activeCandidate.id)} />
        ) : (
          <>
            {tab === "home" && (
              <HomeDashboard
                companyName={companyName}
                candidates={candidates}
                reviewQueue={reviewQueue}
                featuredItems={featuredItems}
                currentWeekStart={NOW_WEEK}
                weeklyNote={weeklyNote}
                searches={searches}
                shortlists={shortlists}
                onOpenCandidate={(id) => setActiveCandidateId(id)}
                onRespondReview={respondToReview}
                onRequestIntro={(id) => setShowIntroModalId(id)}
                onGoSearch={() => setTab("search")}
                onLoadSearch={loadSearch}
                onOpenShortlist={() => setTab("shortlists")}
              />
            )}
            {tab === "search" && (
              <CompanySearch
                filters={filters} setFilters={setFilters}
                nlQuery={nlQuery} setNlQuery={setNlQuery}
                usedAdvanced={usedAdvanced}
                searched={searched} loading={loading} results={results}
                onRunFilter={() => runFilterSearch()}
                onRunAdvanced={runAdvancedSearch}
                onOpenCandidate={(id) => setActiveCandidateId(id)}
                onRequestIntro={(id) => setShowIntroModalId(id)}
                onSaveSearch={saveCurrentSearch}
                onAddToShortlist={addToShortlist}
                shortlists={shortlists}
              />
            )}
            {tab === "searches" && <MySearchesView searches={searches} onRunSearch={loadSearch} onNewSearch={() => setTab("search")} />}
            {tab === "shortlists" && <ShortlistsView shortlists={shortlists} candidates={candidates} onOpenCandidate={(id) => setActiveCandidateId(id)} />}
            {tab === "resources" && <ResourcesView />}
          </>
        )}
      </div>
      {showIntroModalId && (
        <IntroRequestModal
          candidate={introCandidate}
          onClose={() => { setShowIntroModalId(null); setIntroError(null); }}
          onSubmit={(reason) => submitIntroRequest(showIntroModalId, reason)}
          submitting={introSubmitting}
          error={introError}
        />
      )}
      {introToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-black text-white text-sm px-4 py-3 shadow-lg flex items-center gap-2">
          <Zap size={14} className="text-amber-400 fill-amber-400" /> {introToast}
        </div>
      )}
    </div>
  );
}
