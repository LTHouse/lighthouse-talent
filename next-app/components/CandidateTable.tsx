// Presentational candidate table (decomposed component). Pure — takes typed
// candidates and renders. No data access here (that's the data layer).
import type { Candidate } from "@/lib/data/candidates";

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  archived: "bg-rose-100 text-rose-700",
};

export default function CandidateTable({ candidates }: { candidates: Candidate[] }) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">
        No candidates yet.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
          <tr>
            <th className="p-3 font-semibold">Name</th>
            <th className="p-3 font-semibold">Role</th>
            <th className="p-3 font-semibold">Current</th>
            <th className="p-3 font-semibold">YOE</th>
            <th className="p-3 font-semibold">Location</th>
            <th className="p-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {candidates.map((c) => (
            <tr key={c.id} className="hover:bg-amber-50/40">
              <td className="p-3 font-medium">
                {[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}
              </td>
              <td className="p-3 text-stone-600">{c.primaryRole ?? "—"}</td>
              <td className="p-3 text-stone-600">{c.currentCompany ?? "—"}</td>
              <td className="p-3 tabular-nums">{c.yearsExperience ?? "—"}</td>
              <td className="p-3 text-stone-600">{c.location ?? "—"}</td>
              <td className="p-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[c.status] ?? "bg-amber-100 text-amber-700"}`}
                >
                  {c.vettingStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
