"use client";

// Intro-requests list (LIVE Supabase). Companies request warm intros; admins
// approve/decline from the detail view. The real IntroRequest row carries
// candidateId, companyId, message, status, createdAt (no denormalized requester
// name on the row), so we resolve the candidate and show the company id + message.
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card, Select, Tag, Avatar, VettedBadge } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";
import type { IntroRequest } from "@/lib/data/intros";

export default function AdminIntroRequests({
  requests,
  candidates,
  onOpen,
}: {
  requests: IntroRequest[];
  candidates: Candidate[];
  onOpen: (id: string) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const filtered = requests.filter((r) => (filterStatus === "all" ? true : r.status === filterStatus));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl">Intro Requests</h2>
          <div className="text-xs text-stone-500">{requests.filter((r) => r.status === "pending").length} pending</div>
        </div>
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          className="text-xs w-auto"
          options={[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "declined", label: "Declined" },
          ]}
        />
      </div>
      {filtered.length === 0 && (
        <Card className="text-center py-12 text-sm text-stone-500">
          No intro requests {filterStatus !== "all" && `with status: ${filterStatus}`}.
        </Card>
      )}
      <Card padded={false}>
        {filtered.map((r) => {
          const c = candidates.find((cn) => cn.id === r.candidateId);
          if (!c) return null;
          return (
            <div
              key={r.id}
              onClick={() => onOpen(r.id)}
              className="border-b border-stone-200 hover:bg-stone-50 cursor-pointer p-4 flex items-start gap-3"
            >
              <Avatar candidate={c} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold flex items-center gap-1.5">{c.firstName} {c.lastName} <VettedBadge candidate={c} size={12} /></div>
                  <Tag size="sm">←</Tag>
                  <div className="text-sm">{r.companyId ? `Company ${r.companyId.slice(0, 8)}` : "Unknown company"}</div>
                  <Tag color={r.status === "pending" ? "yellow" : r.status === "approved" ? "green" : "default"}>{r.status}</Tag>
                </div>
                <div className="text-xs text-stone-500 mt-0.5">{new Date(r.createdAt).toLocaleString()}</div>
                {r.message && <div className="text-sm text-stone-700 mt-2 line-clamp-2 italic">&quot;{r.message}&quot;</div>}
              </div>
              <ChevronRight size={16} className="text-stone-400 flex-shrink-0 mt-2" />
            </div>
          );
        })}
      </Card>
    </div>
  );
}
