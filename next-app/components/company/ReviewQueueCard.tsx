"use client";

import { useState } from "react";
import { Coffee, MessageSquare } from "lucide-react";
import { Card, Avatar, VettedBadge, RelocateBadge, Tag, Button, Select, Textarea } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";
import type { ReviewItem, ReviewStatus } from "./types";

interface ReviewQueueCardProps {
  review: ReviewItem;
  candidate: Candidate;
  onOpen: () => void;
  onRespond: (status: ReviewStatus, reason?: string) => void;
  onRequestIntro: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  interested: "Interested",
  passed: "Passed",
  discussion_requested: "Discussion requested",
};

export default function ReviewQueueCard({ review, candidate, onOpen, onRespond, onRequestIntro }: ReviewQueueCardProps) {
  const [showPass, setShowPass] = useState(false);
  const [passReason, setPassReason] = useState("Not the right experience");
  const [passNote, setPassNote] = useState("");

  if (review.status !== "pending") {
    const statusLabel = STATUS_LABELS[review.status] ?? review.status;
    return (
      <Card padded={false} className="p-4 opacity-60 flex-shrink-0 w-[360px] snap-start">
        <div className="flex items-center gap-2.5">
          <Avatar candidate={candidate} size={32} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5"><span className="font-bold text-sm truncate">{candidate.firstName} {candidate.lastName}</span><VettedBadge candidate={candidate} size={11} /></div>
            <div className="text-xs text-stone-500 truncate">{candidate.currentRole}</div>
          </div>
          <Tag color={review.status === "interested" ? "green" : review.status === "passed" ? "red" : "default"} size="sm">{statusLabel}</Tag>
        </div>
      </Card>
    );
  }

  return (
    <Card onClick={onOpen} padded={false} className="p-4 flex-shrink-0 w-[360px] snap-start hover:border-amber-400 transition cursor-pointer flex flex-col">
      <div className="flex items-center gap-2.5">
        <Avatar candidate={candidate} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap"><span className="font-bold text-sm truncate">{candidate.firstName} {candidate.lastName}</span><VettedBadge candidate={candidate} size={11} /><RelocateBadge candidate={candidate} /></div>
          <div className="text-xs text-stone-500 truncate">{candidate.currentRole}{candidate.currentCompany && ` · ${candidate.currentCompany}`}</div>
        </div>
      </div>
      <blockquote className="border-l-2 border-amber-300 pl-2.5 mt-2.5 text-xs text-stone-700 italic line-clamp-2">&ldquo;{review.zapNote}&rdquo;</blockquote>
      <div className="flex items-center gap-2 mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" icon={Coffee} onClick={() => { onRespond("interested"); onRequestIntro(); }}>Interested</Button>
        <button onClick={() => setShowPass(true)} className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 text-stone-700 hover:border-stone-400 font-semibold">Pass</button>
        <button onClick={() => onRespond("discussion_requested", "Want to discuss with Zap")} className="text-xs text-stone-500 hover:text-amber-600 inline-flex items-center gap-1"><MessageSquare size={11} /> Discuss</button>
      </div>
      {showPass && (
        <div className="mt-2.5 p-2.5 bg-stone-50 border border-stone-200 rounded-lg" onClick={(e) => e.stopPropagation()}>
          <Select value={passReason} onChange={setPassReason} options={["Not the right experience", "Wrong fit for our stage", "We've already met", "Other"]} className="text-xs mb-2" />
          {passReason === "Other" && <Textarea rows={2} value={passNote} onChange={(e) => setPassNote(e.target.value)} placeholder="Explain..." className="text-xs mb-2" />}
          <div className="flex gap-1.5 justify-end">
            <button onClick={() => setShowPass(false)} className="text-xs text-stone-500 px-2 py-1">Cancel</button>
            <Button size="sm" onClick={() => { onRespond("passed", passReason === "Other" ? passNote : passReason); setShowPass(false); }}>Submit</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
