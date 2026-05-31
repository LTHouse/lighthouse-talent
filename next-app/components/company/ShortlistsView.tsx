"use client";

import { useState } from "react";
import { Star, ArrowLeft } from "lucide-react";
import { Card, Avatar, VettedBadge, Button } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";
import type { Shortlist } from "./types";

interface ShortlistsViewProps {
  shortlists: Shortlist[];
  candidates: Candidate[];
  onOpenCandidate: (id: string) => void;
}

export default function ShortlistsView({ shortlists, candidates, onOpenCandidate }: ShortlistsViewProps) {
  const [active, setActive] = useState<number | null>(null);

  if (active != null) {
    const sl = shortlists.find((s) => s.id === active);
    if (!sl) return null;
    return (
      <div className="space-y-4">
        <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={() => setActive(null)}>Back to shortlists</Button>
        <h2 className="font-display text-3xl">{sl.name}</h2>
        <div className="space-y-2">
          {sl.candidateIds.map((id) => {
            const c = candidates.find((cand) => cand.id === id);
            if (!c) return null;
            return (
              <Card key={id} onClick={() => onOpenCandidate(id)}>
                <div className="flex items-center gap-3">
                  <Avatar candidate={c} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold truncate">{c.firstName} {c.lastName}</span>
                      <VettedBadge candidate={c} size={14} />
                    </div>
                    <div className="text-xs text-stone-500 truncate">{c.currentRole} · {c.currentLocation}</div>
                  </div>
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
      <h2 className="font-display text-3xl">My Shortlists</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shortlists.map((s) => (
          <Card key={s.id} onClick={() => setActive(s.id)}>
            <div className="font-bold text-lg">{s.name}</div>
            <div className="text-xs text-stone-500 mt-1">{s.candidateIds.length} candidates · {s.createdAt}</div>
          </Card>
        ))}
        {shortlists.length === 0 && <Card className="text-center py-8"><Star className="text-stone-400 mx-auto mb-2" /><div className="text-sm">No shortlists yet</div></Card>}
      </div>
    </div>
  );
}
