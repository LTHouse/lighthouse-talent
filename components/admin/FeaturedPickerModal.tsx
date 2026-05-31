"use client";

// Picker for adding a vetted candidate to a featured week, with an optional
// curator note. Only ⚡ vetted candidates are eligible.
import { useState } from "react";
import { ChevronRight, X, Plus } from "lucide-react";
import { Button, Input, Field, Textarea, Avatar, VettedBadge } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";

export default function FeaturedPickerModal({
  vettedCandidates,
  excludeIds,
  onClose,
  onPick,
}: {
  vettedCandidates: Candidate[];
  excludeIds: string[];
  onClose: () => void;
  onPick: (id: string, note: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [note, setNote] = useState("");

  const pool = vettedCandidates.filter((c) => !excludeIds.includes(c.id));
  const filtered = pool
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return `${c.firstName ?? ""} ${c.lastName ?? ""} ${c.currentRole ?? ""}`.toLowerCase().includes(q);
    })
    .slice(0, 50);

  function confirm() {
    if (!selected) return;
    onPick(selected.id, note.trim());
    setSelected(null);
    setNote("");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-display text-xl">{selected ? `Feature ${selected.firstName}` : "Add a featured candidate"}</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-black"><X size={18} /></button>
        </div>
        {!selected ? (
          <>
            <div className="text-xs text-stone-500 mb-3">Only vetted (⚡) candidates are listed. Mark candidates as vetted from their admin profile to add them here.</div>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or role" className="mb-3" />
            <div className="flex-1 overflow-y-auto space-y-1 -mx-2 px-2">
              {filtered.length === 0 && <div className="text-sm text-stone-500 text-center py-8">No matching vetted candidates.</div>}
              {filtered.map((c) => (
                <button key={c.id} onClick={() => setSelected(c)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 text-left">
                  <Avatar candidate={c} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm flex items-center gap-1.5">{c.firstName} {c.lastName} <VettedBadge candidate={c} size={11} /></div>
                    <div className="text-xs text-stone-500 truncate">{c.currentRole}{c.currentCompany && ` · ${c.currentCompany}`}</div>
                  </div>
                  <ChevronRight size={14} className="text-stone-400" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
              <Avatar candidate={selected} size={36} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm flex items-center gap-1.5">{selected.firstName} {selected.lastName} <VettedBadge candidate={selected} size={11} /></div>
                <div className="text-xs text-stone-500 truncate">{selected.currentRole}{selected.currentCompany && ` · ${selected.currentCompany}`}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs text-stone-500 hover:text-amber-600">Change</button>
            </div>
            <Field label={`Why are you featuring ${selected.firstName} this week?`} hint="Optional. Shows on the hero card as Zap's pull-quote. Skip to feature without a note.">
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`e.g. ${selected.firstName} just shipped a major release — perfect timing for a Series A operator role.`} className="text-sm" />
            </Field>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setSelected(null)}>Back</Button>
              <Button icon={Plus} onClick={confirm}>Add to this week</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
