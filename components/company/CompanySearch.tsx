"use client";

import { useMemo, useState } from "react";
import { Zap, Search, Sparkles, Save, ChevronDown, ChevronRight } from "lucide-react";
import { Card, Field, Input, Textarea, Tag, Button, MultiSelectChips, Select } from "@/components/ui";
import { ROLE_TYPES } from "@/lib/constants";
import type { CandidateFilters, TriState } from "@/lib/constants";
import type { Candidate } from "@/lib/data/candidates";
import type { Shortlist, SortBy } from "./types";
import FilterSidebar from "./FilterSidebar";
import CandidateCardMVP from "./CandidateCardMVP";

interface CompanySearchProps {
  filters: CandidateFilters;
  setFilters: (f: CandidateFilters) => void;
  nlQuery: string;
  setNlQuery: (v: string) => void;
  usedAdvanced: boolean;
  searched: boolean;
  loading: boolean;
  results: Candidate[];
  onRunFilter: () => void;
  onRunAdvanced: () => void;
  onOpenCandidate: (id: string) => void;
  onRequestIntro: (id: string) => void;
  onSaveSearch: () => void;
  onAddToShortlist: (shortlistId: string, candidateId: string) => void;
  shortlists: Shortlist[];
}

const TRI_OPTIONS: ReadonlyArray<readonly [TriState, string]> = [
  ["yes", "Yes"],
  ["no", "No"],
  ["either", "Either"],
];

export default function CompanySearch(props: CompanySearchProps) {
  const {
    filters, setFilters, nlQuery, setNlQuery, usedAdvanced, searched, loading, results,
    onRunFilter, onRunAdvanced, onOpenCandidate, onRequestIntro, onSaveSearch, onAddToShortlist, shortlists,
  } = props;
  const [advOpen, setAdvOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("yoe");

  const sorted = useMemo(() => {
    const arr = [...results];
    if (sortBy === "yoe") {
      arr.sort((a, b) => (b.yearsExperience ?? 0) - (a.yearsExperience ?? 0));
    } else if (sortBy === "recent") {
      arr.sort((a, b) => new Date(b.dateApplied ?? 0).getTime() - new Date(a.dateApplied ?? 0).getTime());
    } else {
      arr.sort((a, b) => `${a.lastName ?? ""}${a.firstName ?? ""}`.localeCompare(`${b.lastName ?? ""}${b.firstName ?? ""}`));
    }
    return arr;
  }, [results, sortBy]);

  const wordCount = nlQuery.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {!searched && (
        <div className="text-center pt-6 pb-2">
          <h1 className="text-5xl md:text-6xl font-display tracking-tight">Find your next hire <Zap className="inline text-amber-500 fill-amber-500" /></h1>
          <p className="text-stone-500 text-lg mt-3">Search the Lighthouse Talent Network by what you need.</p>
        </div>
      )}

      {/* Always-visible four-filter row */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Field label="Role type">
            <MultiSelectChips options={ROLE_TYPES} selected={filters.roles} onChange={(v) => setFilters({ ...filters, roles: v })} />
          </Field>
          <Field label="Years of experience" hint="Min / max.">
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={50} value={filters.yoeMin}
                onChange={(e) => setFilters({ ...filters, yoeMin: Math.max(0, Number(e.target.value) || 0) })} placeholder="0" />
              <span className="text-stone-400 text-sm">to</span>
              <Input type="number" min={0} max={50} value={filters.yoeMax}
                onChange={(e) => setFilters({ ...filters, yoeMax: Math.max(filters.yoeMin, Number(e.target.value) || 0) })} placeholder="25" />
            </div>
          </Field>
          <Field label="Has worked at a tech company?">
            <div className="flex gap-2">
              {TRI_OPTIONS.map(([v, l]) => (
                <button key={v} onClick={() => setFilters({ ...filters, hasTech: v })}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border transition ${filters.hasTech === v ? "bg-yellow-400 border-yellow-400 text-black font-bold" : "bg-white border-stone-300 text-stone-700 hover:border-stone-400"}`}>{l}</button>
              ))}
            </div>
          </Field>
          <Field label="Has worked at a startup?">
            <div className="flex gap-2">
              {TRI_OPTIONS.map(([v, l]) => (
                <button key={v} onClick={() => setFilters({ ...filters, hasStartup: v })}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border transition ${filters.hasStartup === v ? "bg-yellow-400 border-yellow-400 text-black font-bold" : "bg-white border-stone-300 text-stone-700 hover:border-stone-400"}`}>{l}</button>
              ))}
            </div>
          </Field>
        </div>
        <div className="flex justify-end">
          <Button size="lg" icon={Search} onClick={onRunFilter} disabled={loading}>{loading && !usedAdvanced ? "Searching..." : "Search ⚡"}</Button>
        </div>
      </Card>

      {/* Advanced Search disclosure, collapsed by default */}
      <Card>
        <button onClick={() => setAdvOpen(!advOpen)} className="w-full text-left flex items-center justify-between">
          <div className="flex items-center gap-2">
            {advOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="font-bold text-sm">Advanced Search · Natural Language</span>
            <Tag color="purple" size="sm">Power user</Tag>
          </div>
          <div className="text-xs text-stone-500">Optional — describe what you&apos;re looking for in plain English</div>
        </button>
        {advOpen && (
          <div className="mt-4 space-y-3">
            <Textarea rows={4} value={nlQuery} onChange={(e) => setNlQuery(e.target.value)}
              placeholder="We're looking for an early-stage operator who can run our day-to-day, set up vendor relationships, manage our 12-person team..." />
            <div className="flex justify-between items-center">
              <div className="text-xs text-stone-500">{wordCount} words · recommended 25–50</div>
              <Button onClick={onRunAdvanced} icon={Sparkles} disabled={!nlQuery.trim() || loading}>Search with description ⚡</Button>
            </div>
          </div>
        )}
      </Card>

      {/* AI interpretation card (advanced only) */}
      {searched && usedAdvanced && (
        <Card className="border-yellow-300 bg-yellow-50/40">
          <div className="text-xs uppercase tracking-wider text-amber-700 font-bold mb-2 flex items-center gap-2"><Sparkles size={12} /> Here&apos;s what we heard</div>
          <div className="grid sm:grid-cols-4 gap-2 text-sm">
            <div><span className="text-stone-500 text-xs">Role type</span><div><Tag color="yellow">{filters.roles[0] ?? "Any"}</Tag></div></div>
            <div><span className="text-stone-500 text-xs">Years</span><div><Tag color="blue">{filters.yoeMin}–{filters.yoeMax}</Tag></div></div>
            <div><span className="text-stone-500 text-xs">Tech experience</span><div><Tag>{filters.hasTech}</Tag></div></div>
            <div><span className="text-stone-500 text-xs">Startup experience</span><div><Tag>{filters.hasStartup}</Tag></div></div>
          </div>
          <div className="text-xs text-stone-500 mt-2">We only map natural language to these four filter dimensions. Skill specifics, archetypes, and seniority levels aren&apos;t part of the MVP filter set.</div>
        </Card>
      )}

      {/* Side filters + results */}
      {searched && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-4">
          <FilterSidebar filters={filters} setFilters={setFilters} onApply={onRunFilter} />
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-stone-500"><span className="font-bold text-amber-600">{sorted.length}</span> candidates</div>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" icon={Save} onClick={onSaveSearch}>Save this search ⚡</Button>
                <Select value={sortBy} onChange={(v) => setSortBy(v as SortBy)} className="text-xs py-1 w-auto"
                  options={[{ value: "yoe", label: "Sort: Experience" }, { value: "recent", label: "Sort: Recently joined" }, { value: "name", label: "Sort: A–Z" }]} />
              </div>
            </div>
            {sorted.length === 0 && <Card className="text-center py-10 text-sm text-stone-500">No matches. Try loosening filters.</Card>}
            {sorted.map((c) => (
              <CandidateCardMVP key={c.id} candidate={c} onOpen={() => onOpenCandidate(c.id)}
                onRequestIntro={() => onRequestIntro(c.id)}
                onAddToShortlist={(slId) => onAddToShortlist(slId, c.id)}
                shortlists={shortlists} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
