"use client";

import { Zap } from "lucide-react";
import { Avatar, VettedBadge, LinkedInVerifiedBadge, RelocateBadge } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";
import { MOTIVATION_SHORT } from "./resources";

export interface FeaturedBadge {
  label: string;
  className: string;
}

interface FeaturedPreviewCardProps {
  candidate: Candidate;
  note?: string;
  badge: FeaturedBadge;
  onOpen: () => void;
}

// Truncate role labels at the first "/" so long slash-separated role lists don't
// blow out the carousel cards.
function truncateOnSlash(s: string | null): string {
  if (!s) return "";
  const i = s.indexOf("/");
  return i > 0 ? s.slice(0, i).trim() : s;
}

export default function FeaturedPreviewCard({ candidate, note, badge, onOpen }: FeaturedPreviewCardProps) {
  const motivationShort = candidate.topMotivation ? MOTIVATION_SHORT[candidate.topMotivation] : null;
  return (
    <button onClick={onOpen}
      className="snap-start flex-shrink-0 w-[280px] text-left p-4 rounded-xl border border-stone-200 bg-white hover:border-amber-400 hover:shadow-sm transition flex flex-col">
      <div className="flex items-start gap-2 min-w-0">
        <Avatar candidate={candidate} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-sm truncate flex-1 min-w-0">{candidate.firstName} {candidate.lastName}</span>
            <VettedBadge candidate={candidate} size={11} />
            <LinkedInVerifiedBadge candidate={candidate} />
          </div>
          <div className="text-xs text-stone-500 truncate">{truncateOnSlash(candidate.currentRole)}{candidate.currentCompany && ` · ${candidate.currentCompany}`}</div>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wider rounded-full px-1.5 py-0.5 flex-shrink-0 ${badge.className}`}>{badge.label}</span>
      </div>
      <div className="text-[11px] text-stone-500 mt-2 flex items-center flex-wrap gap-1.5">
        <span>{candidate.yearsExperience} yrs</span>
        <span>·</span>
        <span className="truncate">{candidate.currentLocation}</span>
        <RelocateBadge candidate={candidate} />
      </div>
      {motivationShort && (
        <div className="mt-2">
          <span className="inline-block bg-yellow-50/60 border border-yellow-200/60 text-amber-800 rounded-full px-2 py-0.5 text-[10px]">{motivationShort}</span>
        </div>
      )}
      {note && (
        <blockquote className="mt-2 text-[11px] text-stone-700 italic flex gap-1.5 flex-1">
          <Zap size={10} className="text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-3">{note}</span>
        </blockquote>
      )}
      <div className="mt-auto pt-3 border-t border-stone-100 text-[11px] font-bold text-amber-600">View profile →</div>
    </button>
  );
}
