"use client";

// Featured Talent of the Week — editorial spotlight, 3–5 vetted candidates per
// week with a curator note. LOCAL STATE ONLY (#17): the Supabase table exists but
// isn't seeded and the write path is a follow-up. Starts with no weeks (honest
// empty state); "Schedule next week" seeds the first/next week.
import { useMemo, useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { Button, Card, Field, Textarea, Tag, Avatar, VettedBadge } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";
import FeaturedPickerModal from "./FeaturedPickerModal";

interface CandidateFeature {
  candidateId: string;
  curatorNote: string;
}
interface FeaturedWeek {
  weekStarting: string; // YYYY-MM-DD (Monday)
  features: CandidateFeature[];
  weeklyNote: string;
}

// Monday of the week containing `d`, as YYYY-MM-DD.
function mondayOf(d: Date): string {
  const copy = new Date(d);
  const day = copy.getDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day;
  copy.setDate(copy.getDate() + diff);
  return copy.toISOString().slice(0, 10);
}
function shiftWeek(weekStart: string, weeks: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export default function AdminFeaturedTalent({ candidates }: { candidates: Candidate[] }) {
  const [weeks, setWeeks] = useState<FeaturedWeek[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [pickerOpenFor, setPickerOpenFor] = useState<string | null>(null);

  const currentWeekStart = useMemo(() => mondayOf(new Date()), []);
  const vetted = candidates.filter((c) => c.vettedInPerson);

  const sorted = [...weeks].sort((a, b) => b.weekStarting.localeCompare(a.weekStarting));
  const upcoming = sorted.filter((w) => w.weekStarting >= currentWeekStart);
  const past = sorted.filter((w) => w.weekStarting < currentWeekStart);

  function updateWeek(weekStart: string, patch: Partial<FeaturedWeek>) {
    setWeeks((ws) => ws.map((w) => (w.weekStarting === weekStart ? { ...w, ...patch } : w)));
  }
  function addCandidateToWeek(weekStart: string, candidateId: string, curatorNote: string) {
    setWeeks((ws) =>
      ws.map((w) => {
        if (w.weekStarting !== weekStart) return w;
        if (w.features.some((f) => f.candidateId === candidateId)) return w;
        if (w.features.length >= 5) return w;
        return { ...w, features: [...w.features, { candidateId, curatorNote }] };
      }),
    );
    setPickerOpenFor(null);
  }
  function removeCandidateFromWeek(weekStart: string, candidateId: string) {
    setWeeks((ws) =>
      ws.map((w) => (w.weekStarting === weekStart ? { ...w, features: w.features.filter((f) => f.candidateId !== candidateId) } : w)),
    );
  }
  function updateFeatureNote(weekStart: string, candidateId: string, note: string) {
    setWeeks((ws) =>
      ws.map((w) =>
        w.weekStarting === weekStart
          ? { ...w, features: w.features.map((f) => (f.candidateId === candidateId ? { ...f, curatorNote: note } : f)) }
          : w,
      ),
    );
  }
  function scheduleNextWeek() {
    const firstUpcoming = upcoming[0];
    const next = firstUpcoming ? shiftWeek(firstUpcoming.weekStarting, 1) : currentWeekStart;
    if (weeks.some((w) => w.weekStarting === next)) return;
    setWeeks((ws) => [...ws, { weekStarting: next, features: [], weeklyNote: "" }]);
  }

  function renderWeekCard(week: FeaturedWeek) {
    const isCurrent = week.weekStarting === currentWeekStart;
    return (
      <Card key={week.weekStarting} className={isCurrent ? "border-amber-400" : ""}>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-display text-lg">Week of {week.weekStarting}</div>
            {isCurrent && <Tag color="yellow" size="sm">Live now</Tag>}
            {week.weekStarting > currentWeekStart && <Tag size="sm">Scheduled</Tag>}
            {week.weekStarting < currentWeekStart && <Tag size="sm">Archived</Tag>}
          </div>
          <div className="text-xs text-stone-500">{week.features.length} / 5</div>
        </div>
        <Field label="Weekly note" hint="Optional — sits above the carousel as the editorial intro.">
          <Textarea
            rows={2}
            value={week.weeklyNote}
            onChange={(e) => updateWeek(week.weekStarting, { weeklyNote: e.target.value })}
            placeholder="e.g. Three operators this week who keep coming up in conversations."
            className="text-sm"
          />
        </Field>
        <div className="mt-3 space-y-2">
          {week.features.map((f) => {
            const c = candidates.find((cand) => cand.id === f.candidateId);
            if (!c) return null;
            return (
              <div key={f.candidateId} className="p-2 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar candidate={c} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm flex items-center gap-1.5">{c.firstName} {c.lastName} <VettedBadge candidate={c} size={11} /></div>
                    <div className="text-xs text-stone-500 truncate">{c.currentRole}</div>
                  </div>
                  <button onClick={() => removeCandidateFromWeek(week.weekStarting, f.candidateId)} className="text-stone-400 hover:text-rose-600 text-xs"><X size={14} /></button>
                </div>
                <Textarea
                  rows={2}
                  value={f.curatorNote}
                  onChange={(e) => updateFeatureNote(week.weekStarting, f.candidateId, e.target.value)}
                  placeholder={`Why are you featuring ${c.firstName} this week? (optional)`}
                  className="text-xs"
                />
              </div>
            );
          })}
          {week.features.length < 5 && (
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => setPickerOpenFor(week.weekStarting)}>Add featured candidate</Button>
          )}
        </div>
      </Card>
    );
  }

  const pickerWeek = pickerOpenFor ? weeks.find((w) => w.weekStarting === pickerOpenFor) : undefined;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="font-display text-3xl">Featured Talent of the Week</h2>
          <div className="text-xs text-stone-500 mt-1">Editorial spotlight. Only vetted (⚡) candidates are eligible.</div>
        </div>
        <Button icon={Plus} onClick={scheduleNextWeek}>Schedule next week</Button>
      </div>
      {upcoming.length === 0 && (
        <Card className="text-center py-12 text-sm text-stone-500">
          No featured weeks scheduled yet. Click &quot;Schedule next week&quot; to start curating.
        </Card>
      )}
      {upcoming.map(renderWeekCard)}
      {past.length > 0 && (
        <div>
          <button onClick={() => setShowHistory(!showHistory)} className="text-sm text-stone-500 hover:text-amber-600 flex items-center gap-1">
            <ChevronDown size={14} className={`transition-transform ${showHistory ? "rotate-180" : ""}`} />
            {showHistory ? "Hide" : "Show"} past weeks ({past.length})
          </button>
          {showHistory && <div className="space-y-4 mt-3">{past.map(renderWeekCard)}</div>}
        </div>
      )}
      {pickerOpenFor && pickerWeek && (
        <FeaturedPickerModal
          vettedCandidates={vetted}
          excludeIds={pickerWeek.features.map((f) => f.candidateId)}
          onClose={() => setPickerOpenFor(null)}
          onPick={(id, note) => addCandidateToWeek(pickerOpenFor, id, note)}
        />
      )}
    </div>
  );
}
