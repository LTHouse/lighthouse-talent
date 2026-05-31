"use client";

// Featured Talent of the Week (#18) — LIVE Supabase data. Edits the current week
// only (the Monday passed from the server). "Add featured candidate" upserts a
// featured_candidates row; remove deletes it; the weekly note upserts the week row.
// Each write goes through a server action and the parent refreshes server data.
import { useState } from "react";
import { Plus, X, Save } from "lucide-react";
import { Button, Card, Field, Textarea, Tag, Avatar, VettedBadge } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";
import type { FeaturedWeek } from "@/lib/data/featured";
import FeaturedPickerModal from "./FeaturedPickerModal";

export default function AdminFeaturedTalent({
  candidates,
  featured,
  currentWeek,
  setFeaturedCandidate,
  upsertWeeklyNote,
}: {
  candidates: Candidate[];
  featured: FeaturedWeek | null;
  currentWeek: string;
  setFeaturedCandidate: (candidateId: string, present: boolean, curatorNote?: string) => Promise<void>;
  upsertWeeklyNote: (note: string) => Promise<void>;
}) {
  const entries = featured?.entries ?? [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [note, setNote] = useState(featured?.weeklyNote ?? "");
  const [savingNote, setSavingNote] = useState(false);

  const vetted = candidates.filter((c) => c.vettedInPerson);
  const noteDirty = note !== (featured?.weeklyNote ?? "");

  async function saveNote() {
    if (savingNote) return;
    setSavingNote(true);
    try {
      await upsertWeeklyNote(note);
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="font-display text-3xl">Featured Talent of the Week</h2>
        <div className="text-xs text-stone-500 mt-1">
          Editorial spotlight for the live week. Only vetted (⚡) candidates are eligible.
        </div>
      </div>

      <Card className="border-amber-400">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-display text-lg">Week of {currentWeek}</div>
            <Tag color="yellow" size="sm">Live now</Tag>
          </div>
          <div className="text-xs text-stone-500">{entries.length} / 5</div>
        </div>

        <Field label="Weekly note" hint="Optional — sits above the carousel as the editorial intro.">
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Three operators this week who keep coming up in conversations."
            className="text-sm"
          />
        </Field>
        <div className="flex justify-end mt-2">
          <Button size="sm" variant="secondary" icon={Save} onClick={saveNote} disabled={!noteDirty || savingNote}>
            {savingNote ? "Saving…" : "Save weekly note"}
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          {entries.map((f) => {
            const c = f.candidate;
            return (
              <div key={c.id} className="p-2 bg-stone-50 border border-stone-200 rounded-lg flex items-center gap-2">
                <Avatar candidate={c} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    {c.firstName} {c.lastName} <VettedBadge candidate={c} size={11} />
                  </div>
                  <div className="text-xs text-stone-500 truncate">{c.currentRole}</div>
                  {f.curatorNote && <div className="text-xs text-stone-600 mt-1 italic">&quot;{f.curatorNote}&quot;</div>}
                </div>
                <button
                  onClick={() => setFeaturedCandidate(c.id, false)}
                  className="text-stone-400 hover:text-rose-600 text-xs"
                  aria-label={`Remove ${c.firstName} from featured`}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
          {entries.length === 0 && (
            <div className="text-sm text-stone-500 text-center py-6">
              No candidates featured this week yet. Add a vetted candidate below.
            </div>
          )}
          {entries.length < 5 && (
            <Button size="sm" variant="secondary" icon={Plus} onClick={() => setPickerOpen(true)}>
              Add featured candidate
            </Button>
          )}
        </div>
      </Card>

      {pickerOpen && (
        <FeaturedPickerModal
          vettedCandidates={vetted}
          excludeIds={entries.map((f) => f.candidate.id)}
          onClose={() => setPickerOpen(false)}
          onPick={(id, curatorNote) => {
            setPickerOpen(false);
            void setFeaturedCandidate(id, true, curatorNote);
          }}
        />
      )}
    </div>
  );
}
