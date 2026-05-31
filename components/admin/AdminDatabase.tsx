"use client";

// Talent database table — searchable, status-filtered. Read-only list; clicking a
// row drills into the admin candidate profile.
import { useMemo, useState } from "react";
import { Card, Input, Select, Tag, Avatar, VettedBadge } from "@/components/ui";
import { STATUS_LABELS, STATUS_ORDER, RELOCATION_LABELS } from "@/lib/constants";
import type { Candidate } from "@/lib/data/candidates";

export default function AdminDatabase({
  candidates,
  onOpen,
}: {
  candidates: Candidate[];
  onOpen: (id: string) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (filterStatus !== "all" && c.status !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = `${c.firstName ?? ""} ${c.lastName ?? ""} ${c.currentRole ?? ""} ${c.currentLocation ?? ""}`;
        return hay.toLowerCase().includes(s);
      }
      return true;
    });
  }, [candidates, filterStatus, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl">Talent Database</h2>
          <div className="text-xs text-stone-500">{candidates.length} candidates total</div>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-xs w-48" />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            className="text-xs w-auto"
            options={[
              { value: "all", label: "All statuses" },
              ...STATUS_ORDER.filter((s) => s !== "pre_onboard").map((s) => ({ value: s, label: STATUS_LABELS[s] })),
            ]}
          />
        </div>
      </div>
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Current role</th>
                <th className="text-left p-3">Yrs</th>
                <th className="text-left p-3">Location</th>
                <th className="text-center p-3">Tech</th>
                <th className="text-center p-3">Startup</th>
                <th className="text-left p-3">Status</th>
                <th className="text-center p-3">Intros</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((c) => (
                <tr key={c.id} onClick={() => onOpen(c.id)} className="border-b border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar candidate={c} size={28} />
                      <div className="font-bold flex items-center gap-1.5">{c.firstName} {c.lastName} <VettedBadge candidate={c} size={12} /></div>
                    </div>
                  </td>
                  <td className="p-3 text-stone-700 max-w-[200px] truncate">{c.currentRole}</td>
                  <td className="p-3">{c.yearsExperience}</td>
                  <td className="p-3 text-xs text-stone-500">
                    {c.currentLocation}{" "}
                    <span className="text-[10px] block">{c.relocationStatus ? RELOCATION_LABELS[c.relocationStatus] : ""}</span>
                  </td>
                  <td className="p-3 text-center">{c.hasTechExperience ? "✓" : "—"}</td>
                  <td className="p-3 text-center">{c.hasStartupExperience ? "✓" : "—"}</td>
                  <td className="p-3">
                    <Tag color={c.status === "active" ? "green" : c.status === "archived" ? "red" : "yellow"} size="sm">
                      {STATUS_LABELS[c.status] || c.status}
                    </Tag>
                  </td>
                  <td className="p-3 text-center tabular-nums">{c.introRequests || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="p-3 text-center text-xs text-stone-500">Showing 100 of {filtered.length}. Refine filters to see more.</div>
        )}
      </Card>
    </div>
  );
}
