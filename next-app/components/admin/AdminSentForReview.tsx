"use client";

// Sent-for-Review activity log. LOCAL STATE ONLY (#18): the Supabase table exists
// but isn't seeded and the write path is a follow-up. Records are created in-session
// via the Send-for-review modal. Honest empty state until then.
import { useState } from "react";
import { Card, Select, Tag, Avatar, VettedBadge } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";

export interface SentForReviewRecord {
  id: string;
  candidateId: string;
  sentToCompanyId: number | null;
  sentBy: string;
  sentAt: string;
  zapNote: string;
  status: "pending" | "interested" | "passed" | "discussion_requested";
  responseAt: string | null;
  responseReason: string | null;
}

export default function AdminSentForReview({
  records,
  candidates,
}: {
  records: SentForReviewRecord[];
  candidates: Candidate[];
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filtered = records.filter((r) => statusFilter === "all" || r.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => b.sentAt.localeCompare(a.sentAt));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="font-display text-3xl">Sent for Review</h2>
          <div className="text-xs text-stone-500 mt-1">
            {records.length} total · {records.filter((r) => r.status === "pending").length} pending response
          </div>
        </div>
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="text-xs w-auto"
          options={[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "interested", label: "Interested" },
            { value: "passed", label: "Passed" },
            { value: "discussion_requested", label: "Discussion" },
          ]}
        />
      </div>
      <Card padded={false}>
        {sorted.length === 0 && <div className="p-8 text-center text-sm text-stone-500">No sent-for-review records.</div>}
        {sorted.map((r) => {
          const c = candidates.find((cand) => cand.id === r.candidateId);
          if (!c) return null;
          const recipient = r.sentToCompanyId ? `Company #${r.sentToCompanyId}` : "Unknown company";
          return (
            <div key={r.id} className="border-b border-stone-200 p-4 flex items-start gap-3 flex-wrap">
              <Avatar candidate={c} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold flex items-center gap-1.5">{c.firstName} {c.lastName} <VettedBadge candidate={c} size={11} /></div>
                  <Tag size="sm">→</Tag>
                  <div className="text-sm font-semibold">{recipient}</div>
                  <Tag color={r.status === "pending" ? "yellow" : r.status === "interested" ? "green" : r.status === "passed" ? "red" : "default"} size="sm">{r.status}</Tag>
                </div>
                <div className="text-xs text-stone-500 mt-0.5">Sent {r.sentAt} by {r.sentBy}{r.responseAt && ` · responded ${r.responseAt}`}</div>
                <div className="text-sm text-stone-700 mt-2 italic">&quot;{r.zapNote}&quot;</div>
                {r.responseReason && <div className="text-xs text-stone-600 mt-1">Reason: {r.responseReason}</div>}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
