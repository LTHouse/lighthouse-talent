// Supabase client — wired but not yet used. The platform runs on mock data in v2;
// this is the seam for swapping in real persistence later.
//
// Vercel env vars expected:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
//
// To use: import { supabase } from './lib/supabase.js'
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || "https://rdnfckhtheescralfkwn.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

export const supabase = SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;

export const SUPABASE_READY = !!supabase;
