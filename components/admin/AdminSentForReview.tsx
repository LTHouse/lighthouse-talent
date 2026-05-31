"use client";

// Sent-for-Review activity log (#18) — LIVE Supabase data. Renders listSentForReview()
// from the server, resolving recipient company names from the live companies list.
import { useState } from "react";
import { Card, Select, Tag, Avatar, VettedBadge } from "@/components/ui";
import type { ReviewItem } from "@/lib/data/sentForReview";
import type { Company } from "@/lib/data/companies";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  interested: "Interested",
  passed: "Passed",
  discussion_requested: "Discussion",
};

export default function AdminSentForReview({
  records,
  companies,
}: {
  records: ReviewItem[];
  companies: Company[];
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const companyById = new Map(companies.map((c) => [c.id, c.name]));
  const filtered = records.filter((r) => statusFilter === "all" || r.status === statusFilter);
  const pendingCount = records.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="font-display text-3xl">Sent for Review</h2>
          <div className="text-xs text-stone-500 mt-1">
            {records.length} total · {pendingCount} pending response
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
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-stone-500">No sent-for-review records.</div>}
        {filtered.map((r) => {
          const c = r.candidate;
          if (!c) return null;
          const recipient = r.sentToCompanyId
            ? companyById.get(r.sentToCompanyId) ?? "Unknown company"
            : "Unknown company";
          const statusColor =
            r.status === "pending" ? "yellow" : r.status === "interested" ? "green" : r.status === "passed" ? "red" : "default";
          return (
            <div key={r.id} className="border-b border-stone-200 last:border-b-0 p-4 flex items-start gap-3 flex-wrap">
              <Avatar candidate={c} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold flex items-center gap-1.5">
                    {c.firstName} {c.lastName} <VettedBadge candidate={c} size={11} />
                  </div>
                  <Tag size="sm">→</Tag>
                  <div className="text-sm font-semibold">{recipient}</div>
                  <Tag color={statusColor} size="sm">{STATUS_LABELS[r.status] ?? r.status}</Tag>
                </div>
                <div className="text-xs text-stone-500 mt-0.5">
                  Sent {r.createdAt.slice(0, 10)}
                  {r.sentBy && ` by ${r.sentBy}`}
                  {r.respondedAt && ` · responded ${r.respondedAt.slice(0, 10)}`}
                </div>
                {r.zapNote && <div className="text-sm text-stone-700 mt-2 italic">&quot;{r.zapNote}&quot;</div>}
                {r.responseReason && <div className="text-xs text-stone-600 mt-1">Reason: {r.responseReason}</div>}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
