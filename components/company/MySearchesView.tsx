"use client";

import { Search, Trash2 } from "lucide-react";
import { Card, Tag, Button } from "@/components/ui";
import type { SavedSearch } from "./types";

interface MySearchesViewProps {
  searches: SavedSearch[];
  onRunSearch: (s: SavedSearch) => void;
  onDeleteSearch: (id: string) => void;
  onNewSearch: () => void;
}

export default function MySearchesView({ searches, onRunSearch, onDeleteSearch, onNewSearch }: MySearchesViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-3xl">My Searches</h2>
          <div className="text-xs text-stone-500 mt-1">{searches.length} saved · re-runs fresh on open</div>
        </div>
        <Button icon={Search} onClick={onNewSearch}>Run a new search</Button>
      </div>
      <Card padded={false}>
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3 hidden sm:table-cell">For</th>
              <th className="text-left p-3 hidden md:table-cell">Saved</th>
              <th className="text-left p-3">Results</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {searches.map((s) => (
              <tr key={s.id} className="border-b border-stone-200 hover:bg-stone-50 cursor-pointer" onClick={() => onRunSearch(s)}>
                <td className="p-3 font-bold">{s.name ?? "Untitled search"}</td>
                <td className="p-3"><Tag size="sm" color={s.kind === "advanced" ? "purple" : "yellow"}>{s.kind === "advanced" ? "Advanced" : "Filter"}</Tag></td>
                <td className="p-3 text-xs text-stone-500 hidden sm:table-cell">Direct</td>
                <td className="p-3 text-xs text-stone-500 hidden md:table-cell">{s.createdAt.slice(0, 10)}</td>
                <td className="p-3 text-sm tabular-nums">{s.results ?? "—"}</td>
                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" icon={Search} onClick={() => onRunSearch(s)}>Run</Button>
                    <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onDeleteSearch(s.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {searches.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-stone-500 text-sm">No saved searches yet. Run a search and click &ldquo;Save this search ⚡&rdquo; to start.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
