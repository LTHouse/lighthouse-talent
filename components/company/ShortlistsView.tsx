"use client";

import { useState } from "react";
import { Star, ArrowLeft, Plus, X } from "lucide-react";
import { Card, Avatar, VettedBadge, Button } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";
import type { Shortlist } from "./types";

interface ShortlistsViewProps {
  shortlists: Shortlist[];
  candidates: Candidate[];
  onOpenCandidate: (id: string) => void;
  onCreateShortlist: (name: string) => void;
  onRemoveCandidate: (shortlistId: string, candidateId: string) => void;
}

export default function ShortlistsView({
  shortlists, candidates, onOpenCandidate, onCreateShortlist, onRemoveCandidate,
}: ShortlistsViewProps) {
  const [active, setActive] = useState<string | null>(null);

  function handleCreate() {
    const name = window.prompt("Name this shortlist:", "");
    if (name?.trim()) onCreateShortlist(name.trim());
  }

  if (active != null) {
    const sl = shortlists.find((s) => s.id === active);
    // The shortlist may have vanished after a refresh — fall back to the list.
    if (!sl) {
      return (
        <div className="space-y-4">
          <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={() => setActive(null)}>Back to shortlists</Button>
          <Card className="text-center py-8 text-sm text-stone-500">This shortlist is no longer available.</Card>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={() => setActive(null)}>Back to shortlists</Button>
        <h2 className="font-display text-3xl">{sl.name ?? "Untitled shortlist"}</h2>
        <div className="space-y-2">
          {sl.candidateIds.length === 0 && (
            <Card className="text-center py-8 text-sm text-stone-500">No candidates in this shortlist yet. Add some from search.</Card>
          )}
          {sl.candidateIds.map((id) => {
            const c = candidates.find((cand) => cand.id === id);
            if (!c) return null;
            return (
              <Card key={id}>
                <div className="flex items-center gap-3">
                  <button onClick={() => onOpenCandidate(id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <Avatar candidate={c} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold truncate">{c.firstName} {c.lastName}</span>
                        <VettedBadge candidate={c} size={14} />
                      </div>
                      <div className="text-xs text-stone-500 truncate">{c.currentRole} · {c.currentLocation}</div>
                    </div>
                  </button>
                  <button onClick={() => onRemoveCandidate(sl.id, id)}
                    className="flex-shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-50"
                    aria-label="Remove from shortlist">
                    <X size={16} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-3xl">My Shortlists</h2>
        <Button icon={Plus} onClick={handleCreate}>New shortlist</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shortlists.map((s) => (
          <Card key={s.id} onClick={() => setActive(s.id)}>
            <div className="font-bold text-lg">{s.name ?? "Untitled shortlist"}</div>
            <div className="text-xs text-stone-500 mt-1">{s.candidateIds.length} candidates · {s.createdAt.slice(0, 10)}</div>
          </Card>
        ))}
        {shortlists.length === 0 && <Card className="text-center py-8"><Star className="text-stone-400 mx-auto mb-2" /><div className="text-sm">No shortlists yet</div></Card>}
      </div>
    </div>
  );
}
