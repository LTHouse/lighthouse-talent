"use client";

import { useState } from "react";
import { Clock, MapPin, Briefcase, Coffee, Star } from "lucide-react";
import { Card, Avatar, VettedBadge, LinkedInVerifiedBadge, RelocateBadge, Button } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";
import type { Shortlist } from "./types";

interface CandidateCardMVPProps {
  candidate: Candidate;
  onOpen: () => void;
  onRequestIntro: () => void;
  onAddToShortlist: (shortlistId: string) => void;
  shortlists: Shortlist[];
}

export default function CandidateCardMVP({ candidate, onOpen, onRequestIntro, onAddToShortlist, shortlists }: CandidateCardMVPProps) {
  const [showShort, setShowShort] = useState(false);
  const loc = candidate.currentLocation ?? candidate.location;
  const locDisplay = candidate.relocationStatus === "remote_only"
    ? (loc ? `${loc} — remote only` : "Remote only")
    : (loc ?? "—");

  return (
    <Card onClick={onOpen} className="hover:border-amber-400 hover:shadow-sm transition cursor-pointer">
      <div className="flex gap-4">
        <Avatar candidate={candidate} size={48} />
        <div className="flex-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-lg truncate">{candidate.firstName} {candidate.lastName}</span>
              <VettedBadge candidate={candidate} size={16} />
              <LinkedInVerifiedBadge candidate={candidate} />
            </div>
            <div className="text-sm text-stone-500 truncate">{candidate.currentRole}{candidate.currentCompany && ` · ${candidate.currentCompany}`}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-500">
            <span><Clock size={11} className="inline mr-0.5" /> {candidate.yearsExperience} yrs</span>
            <span><MapPin size={11} className="inline mr-0.5" /> {locDisplay}</span>
            <span><Briefcase size={11} className="inline mr-0.5" /> {candidate.workMode}</span>
            <RelocateBadge candidate={candidate} />
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" icon={Coffee} onClick={onRequestIntro}>Request Intro</Button>
            <div className="relative">
              <Button size="sm" variant="secondary" icon={Star} onClick={() => setShowShort(!showShort)}>Save</Button>
              {showShort && (
                <div className="absolute top-9 left-0 w-56 bg-white border border-stone-300 rounded-lg p-2 z-30 shadow-xl">
                  {shortlists.length === 0 && <div className="text-xs text-stone-500 p-2">No shortlists yet.</div>}
                  {shortlists.map((s) => (
                    <button key={s.id} onClick={() => { onAddToShortlist(s.id); setShowShort(false); }}
                      className="w-full text-left text-xs p-2 hover:bg-stone-50 rounded">
                      {s.name} <span className="text-stone-500">({s.candidateIds.length})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
