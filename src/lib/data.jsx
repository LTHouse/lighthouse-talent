// Data layer — the ONLY place (besides auth) that talks to Supabase for app data.
// UI components consume these hooks; they never import the Supabase client directly.
// See .claude/CLAUDE.md (data-layer non-negotiable).
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";
import { candidateFromRow, candidatePatchToRow } from "./candidateMapping.js";

// The single candidate mutation helper (#14). ALL admin writes route through here
// — no scattered supabase.from('candidates').update(...) calls. Maps the camelCase
// patch to columns, updates, returns the updated row. Throws on error (no swallow).
export async function updateCandidate(id, patch) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("candidates")
    .update(candidatePatchToRow(patch))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return candidateFromRow(data);
}

// Fetch candidates for the current viewer. The role/user filter here is UX-only —
// RLS (#10) is the real security boundary. Returns the camelCase shape App.jsx
// already renders.
export function useCandidatesQuery({ role, userId }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!supabase) { setError("Supabase is not configured."); setLoading(false); return; }
    setLoading(true);
    setError(null);
    let q = supabase.from("candidates").select("*");
    if (role === "company") {
      q = q.eq("is_demo", false).eq("status", "active");
    } else if (role === "talent" && userId) {
      q = q.eq("user_id", userId);
    } // admin → no filter (RLS still scopes to admin)
    const { data, error: err } = await q;
    if (err) {
      setError(err.message);
      setCandidates([]);
    } else {
      setCandidates((data || []).map(candidateFromRow));
    }
    setLoading(false);
  }, [role, userId]);

  useEffect(() => { load(); }, [load]);

  return { candidates, loading, error, reload: load };
}

// Context so deeply-nested components read the same fetched set without prop drilling.
const CandidatesContext = createContext(null);

export function CandidatesProvider({ role, userId, children }) {
  const value = useCandidatesQuery({ role, userId });
  return <CandidatesContext.Provider value={value}>{children}</CandidatesContext.Provider>;
}

// Returns { candidates, loading, error, reload }. Safe outside a provider too
// (returns empty/idle) so isolated sub-components don't crash.
export function useCandidates() {
  return useContext(CandidatesContext) || { candidates: [], loading: false, error: null, reload: () => {} };
}
