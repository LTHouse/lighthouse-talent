"use client";

import { Filter, Zap, RefreshCw } from "lucide-react";
import { Card, Field, Input, MultiSelectChips, Button } from "@/components/ui";
import { WORK_MODES } from "@/lib/constants";
import type { CandidateFilters } from "@/lib/constants";

interface FilterSidebarProps {
  filters: CandidateFilters;
  setFilters: (f: CandidateFilters) => void;
  onApply: () => void;
}

const LOC_OPTIONS: ReadonlyArray<readonly [string, string]> = [
  ["in_tn", "In Tennessee"],
  ["willing_to_relocate", "Willing to relocate"],
  ["remote_only", "Remote only"],
];

export default function FilterSidebar({ filters, setFilters, onApply }: FilterSidebarProps) {
  return (
    <div className="space-y-3 lg:sticky lg:top-20 self-start">
      <Card className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold flex items-center gap-2"><Filter size={12} /> Filters</div>
        <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${filters.vettedOnly ? "border-amber-400 bg-amber-50" : "border-stone-200 hover:border-stone-300"}`}>
          <input type="checkbox" checked={filters.vettedOnly}
            onChange={(e) => setFilters({ ...filters, vettedOnly: e.target.checked })}
            className="accent-yellow-400" />
          <Zap size={14} className="text-amber-500 fill-amber-500" />
          <span className="text-sm font-semibold">Only ⚡ vetted candidates</span>
        </label>
        <Field label="Location availability" hint="Default: all three">
          <div className="space-y-1.5">
            {LOC_OPTIONS.map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={filters.locAvailability.includes(v)}
                  onChange={(e) => setFilters({ ...filters, locAvailability: e.target.checked ? [...filters.locAvailability, v] : filters.locAvailability.filter((x) => x !== v) })}
                  className="accent-yellow-400" />
                {l}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Current location (free text)">
          <Input placeholder="e.g. Nashville, Austin" value={filters.currentLocationFilter} onChange={(e) => setFilters({ ...filters, currentLocationFilter: e.target.value })} />
        </Field>
        <Field label="Work mode">
          <MultiSelectChips options={WORK_MODES} selected={filters.workModes} onChange={(v) => setFilters({ ...filters, workModes: v })} />
        </Field>
        <Button size="sm" className="w-full" onClick={onApply} icon={RefreshCw}>Apply filters</Button>
      </Card>
    </div>
  );
}
