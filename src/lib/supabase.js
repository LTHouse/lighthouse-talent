// Supabase client — the ONLY module that creates the client. UI never imports
// this directly; it goes through the data layer (src/lib/data.js) and auth
// (src/auth.jsx). See .claude/CLAUDE.md (data-layer non-negotiable).
//
// Public env (inlined into the browser bundle by Vite — public by design):
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || "https://rdnfckhtheescralfkwn.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

export const supabase = SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Real auth (#12): keep the session across reloads, refresh it
        // automatically, and pick up the magic-link / OAuth code from the URL.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const SUPABASE_READY = !!supabase;
