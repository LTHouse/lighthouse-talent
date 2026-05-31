"use client";

// Admin tabbed shell. Owns the active view, the candidate-profile / intro drill-ins,
// and the write helpers. All sub-features are now LIVE Supabase data: candidates +
// intros use optimistic local edits; companies, featured talent, and sent-for-review
// write through server actions and then router.refresh() to pull fresh server data.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Database, KanbanSquare, Coffee, Star, Send, Settings, Building2 } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import type { Candidate } from "@/lib/data/candidates";
import type { IntroRequest } from "@/lib/data/intros";
import type { Company } from "@/lib/data/companies";
import type { FeaturedWeek } from "@/lib/data/featured";
import type { ReviewItem } from "@/lib/data/sentForReview";
import {
  updateCandidateAction,
  respondIntroAction,
  createCompanyAction,
  setFeaturedCandidateAction,
  upsertFeaturedWeekAction,
  sendForReviewAction,
  type CandidatePatch,
} from "@/app/actions";
import AdminDatabase from "./AdminDatabase";
import AdminPending from "./AdminPending";
import AdminCandidateProfile from "./AdminCandidateProfile";
import AdminIntroRequests from "./AdminIntroRequests";
import AdminIntroDetail from "./AdminIntroDetail";
import AdminFeaturedTalent from "./AdminFeaturedTalent";
import AdminSentForReview from "./AdminSentForReview";
import AdminCompanies from "./AdminCompanies";
import AdminSettings from "./AdminSettings";

export type AdminView =
  | "database" | "pending" | "intros" | "featured" | "sent" | "companies" | "settings" | "profile" | "intro";

const VIEW_TITLES: Record<AdminView, string> = {
  database: "Database",
  pending: "Pending Applications",
  intros: "Intro Requests",
  featured: "Featured Talent",
  sent: "Sent for Review",
  companies: "Companies",
  settings: "Settings",
  profile: "Candidate",
  intro: "Intro Request",
};

interface NavItem {
  k: AdminView;
  l: string;
  icon: typeof Database;
  count?: number;
}

interface AdminPortalProps {
  candidates: Candidate[];
  intros: IntroRequest[];
  companies: Company[];
  featured: FeaturedWeek | null;
  currentWeek: string;
  sentForReview: ReviewItem[];
  adminName: string;
}

// Outer wrapper: re-key the stateful shell on the server-data identity so that when
// fresh props arrive (router.refresh / revalidatePath), the optimistic local state
// resets cleanly to the new server truth (no mirror effects / cascading-render lint).
export default function AdminPortalClient(props: AdminPortalProps) {
  const sig = [
    props.candidates.map((c) => c.id).join(","),
    props.intros.map((r) => `${r.id}:${r.status}`).join(","),
    props.companies.map((c) => c.id).join(","),
    props.featured ? `${props.featured.weekStarting}:${props.featured.entries.map((e) => e.candidate.id).join(".")}` : "none",
    props.sentForReview.map((r) => `${r.id}:${r.status}`).join(","),
  ].join("|");
  return <AdminPortalShell key={sig} {...props} />;
}

function AdminPortalShell({
  candidates: initialCandidates,
  intros: initialIntros,
  companies,
  featured,
  currentWeek,
  sentForReview,
  adminName,
}: AdminPortalProps) {
  const router = useRouter();
  const [view, setView] = useState<AdminView>("database");
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [activeIntroId, setActiveIntroId] = useState<string | null>(null);

  // Live Supabase candidates, held locally for optimistic edits.
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  // Live Supabase intro requests, held locally for optimistic approve/decline.
  const [intros, setIntros] = useState<IntroRequest[]>(initialIntros);

  const [writeError, setWriteError] = useState<string | null>(null);

  // Optimistic admin write (#14): show the change instantly, persist via the server
  // action, and roll back + surface the error on failure (never silent).
  function updateCandidate(id: string, patch: CandidatePatch) {
    const prev = candidates;
    setCandidates((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setWriteError(null);
    updateCandidateAction(id, patch)
      .then((res) => {
        if (!res.ok) {
          setCandidates(prev);
          setWriteError(res.error || "Couldn't save that change.");
        }
      })
      .catch((err: unknown) => {
        setCandidates(prev);
        setWriteError(err instanceof Error ? err.message : "Couldn't save that change.");
      });
  }

  function respondIntro(id: string, status: "approved" | "declined") {
    const prev = intros;
    setIntros((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    setWriteError(null);
    respondIntroAction(id, status)
      .then((res) => {
        if (!res.ok) {
          setIntros(prev);
          setWriteError(res.error || "Couldn't update that intro.");
        }
      })
      .catch((err: unknown) => {
        setIntros(prev);
        setWriteError(err instanceof Error ? err.message : "Couldn't update that intro.");
      });
  }

  // Server-action writes for the live sub-features. On success, router.refresh()
  // pulls fresh server data (the shell re-keys to it); on failure, surface the error.
  async function createCompany(input: { name: string; stage?: string; industry?: string; team?: number }) {
    setWriteError(null);
    try {
      const res = await createCompanyAction(input);
      if (!res.ok) {
        setWriteError(res.error || "Couldn't add that company.");
        return;
      }
      router.refresh();
    } catch (err: unknown) {
      setWriteError(err instanceof Error ? err.message : "Couldn't add that company.");
    }
  }

  async function setFeaturedCandidate(candidateId: string, present: boolean, curatorNote?: string) {
    setWriteError(null);
    try {
      const res = await setFeaturedCandidateAction(currentWeek, candidateId, present, curatorNote);
      if (!res.ok) {
        setWriteError(res.error || "Couldn't update the featured list.");
        return;
      }
      router.refresh();
    } catch (err: unknown) {
      setWriteError(err instanceof Error ? err.message : "Couldn't update the featured list.");
    }
  }

  async function upsertWeeklyNote(note: string) {
    setWriteError(null);
    try {
      const res = await upsertFeaturedWeekAction(currentWeek, note);
      if (!res.ok) {
        setWriteError(res.error || "Couldn't save the weekly note.");
        return;
      }
      router.refresh();
    } catch (err: unknown) {
      setWriteError(err instanceof Error ? err.message : "Couldn't save the weekly note.");
    }
  }

  async function sendForReview(input: { candidateId: string; companyId: string; zapNote: string }) {
    setWriteError(null);
    try {
      const res = await sendForReviewAction({
        candidateId: input.candidateId,
        companyId: input.companyId,
        note: input.zapNote,
      });
      if (!res.ok) {
        setWriteError(res.error || "Couldn't send that candidate for review.");
        return;
      }
      router.refresh();
    } catch (err: unknown) {
      setWriteError(err instanceof Error ? err.message : "Couldn't send that candidate for review.");
    }
  }

  const pendingIntros = intros.filter((r) => r.status === "pending").length;
  const sentPending = sentForReview.filter((r) => r.status === "pending").length;
  const sentActioned = sentForReview.filter((r) => r.status !== "pending" && r.respondedAt).length;
  const featuredCount = featured?.entries.length ?? 0;

  const navItems: NavItem[] = [
    { k: "database", l: "Database", icon: Database },
    { k: "pending", l: "Pending Applications", icon: KanbanSquare },
    { k: "intros", l: "Intro Requests", icon: Coffee, count: pendingIntros },
    { k: "featured", l: "Featured Talent", icon: Star },
    { k: "sent", l: "Sent for Review", icon: Send, count: sentPending },
    { k: "companies", l: "Companies", icon: Building2 },
    { k: "settings", l: "Settings", icon: Settings },
  ];

  const activeCandidate = activeCandidateId ? candidates.find((c) => c.id === activeCandidateId) : undefined;
  const activeIntro = activeIntroId ? intros.find((r) => r.id === activeIntroId) : undefined;

  function selectView(k: AdminView) {
    setView(k);
    setActiveCandidateId(null);
    setActiveIntroId(null);
  }

  function openCandidate(id: string) {
    setActiveCandidateId(id);
    setView("profile");
  }

  return (
    <div className="min-h-screen bg-white text-black flex">
      <aside className="w-60 border-r border-stone-200 p-4 space-y-1 hidden md:block">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="text-amber-500 fill-amber-500" size={18} />
          <span className="font-black">Lighthouse</span>
          <span className="text-stone-500 text-xs">Admin</span>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-amber-600 font-bold pt-2 pb-1 px-2">Talent</div>
        {navItems.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.k}
              onClick={() => selectView(it.k)}
              className={`w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition ${
                view === it.k ? "bg-yellow-100 text-amber-700 font-bold" : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              <Icon size={14} /> {it.l}
              {typeof it.count === "number" && it.count > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500 text-white">{it.count}</span>
              )}
            </button>
          );
        })}
        <div className="mt-6 pt-4 border-t border-stone-200">
          <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold px-2 mb-2">At a glance</div>
          <div className="px-2 space-y-2 text-[11px] text-stone-600">
            <div><div className="font-bold text-amber-700">🌟 Featured</div><div>{featuredCount} this week · curated below</div></div>
            <div><div className="font-bold text-amber-700">📨 Sent for review</div><div>{sentPending} pending · {sentActioned} actioned</div></div>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="border-b border-stone-200 px-6 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-amber-600 font-bold">🎯 Talent</span>
            <span className="text-stone-500 mx-2">/</span>
            <span className="font-semibold">{VIEW_TITLES[view]}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-stone-500">{adminName || "Admin"}</div>
            <SignOutButton />
          </div>
        </div>
        <div className="p-6">
          {writeError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
              <span>Couldn&apos;t save: {writeError}</span>
              <button className="underline ml-3" onClick={() => setWriteError(null)}>Dismiss</button>
            </div>
          )}
          {view === "database" && <AdminDatabase candidates={candidates} onOpen={openCandidate} />}
          {view === "pending" && <AdminPending candidates={candidates} onOpen={openCandidate} updateCandidate={updateCandidate} />}
          {view === "intros" && (
            <AdminIntroRequests
              requests={intros}
              candidates={candidates}
              onOpen={(id) => { setActiveIntroId(id); setView("intro"); }}
            />
          )}
          {view === "intro" && activeIntro && (
            <AdminIntroDetail
              intro={activeIntro}
              candidates={candidates}
              adminEmail={adminName}
              onBack={() => { setActiveIntroId(null); setView("intros"); }}
              onApprove={() => respondIntro(activeIntro.id, "approved")}
              onDecline={() => respondIntro(activeIntro.id, "declined")}
            />
          )}
          {view === "featured" && (
            <AdminFeaturedTalent
              candidates={candidates}
              featured={featured}
              currentWeek={currentWeek}
              setFeaturedCandidate={setFeaturedCandidate}
              upsertWeeklyNote={upsertWeeklyNote}
            />
          )}
          {view === "sent" && <AdminSentForReview records={sentForReview} companies={companies} />}
          {view === "companies" && <AdminCompanies companies={companies} createCompany={createCompany} />}
          {view === "profile" && activeCandidate && (
            <AdminCandidateProfile
              candidate={activeCandidate}
              companies={companies}
              updateCandidate={updateCandidate}
              onBack={() => { setActiveCandidateId(null); setView("database"); }}
              sendForReview={sendForReview}
              adminName={adminName}
            />
          )}
          {view === "settings" && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}
