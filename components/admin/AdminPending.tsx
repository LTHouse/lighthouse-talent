"use client";

// Pending-applications pipeline (kanban). Drag a card to a new column to advance
// its status (optimistic write via updateCandidate). Click a card for the full
// admin profile. Display label for "active" is "Approved" in this view (per spec).
import { useState } from "react";
import { Tag, Avatar, VettedBadge } from "@/components/ui";
import type { Candidate, CandidateStatus } from "@/lib/data/candidates";
import type { CandidatePatch } from "@/app/actions";

const COLS: CandidateStatus[] = ["applied", "reviewing", "vetting_scheduled", "active", "archived"];
const LABELS: Record<string, string> = {
  applied: "New",
  reviewing: "Reviewing",
  vetting_scheduled: "Vetting Call",
  active: "Approved",
  archived: "Declined",
};

export default function AdminPending({
  candidates,
  onOpen,
  updateCandidate,
}: {
  candidates: Candidate[];
  onOpen: (id: string) => void;
  updateCandidate: (id: string, patch: CandidatePatch) => void;
}) {
  const [drag, setDrag] = useState<string | null>(null);

  return (
    <div>
      <h2 className="font-display text-3xl mb-3">Pending Applications</h2>
      <div className="text-xs text-stone-500 mb-4">Drag candidates through the pipeline. Click a card for the full admin profile.</div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {COLS.map((col) => {
          const list = candidates.filter((c) => c.status === col);
          return (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag) {
                  updateCandidate(drag, { status: col });
                  setDrag(null);
                }
              }}
              className="bg-stone-50 border border-stone-200 rounded-xl p-3 min-h-[300px]"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-wider font-bold">{LABELS[col]}</div>
                <Tag>{list.length}</Tag>
              </div>
              <div className="space-y-2">
                {list.slice(0, 20).map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDrag(c.id)}
                    onClick={() => onOpen(c.id)}
                    className="bg-white border border-stone-200 rounded-lg p-2 cursor-pointer hover:border-amber-400"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar candidate={c} size={26} />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate flex items-center gap-1">{c.firstName} {c.lastName} <VettedBadge candidate={c} size={10} /></div>
                        <div className="text-[10px] text-stone-500 truncate">{c.currentRole}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {list.length > 20 && <div className="text-center text-[10px] text-stone-500">+{list.length - 20} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
