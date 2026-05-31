// Browser-side Supabase client (@supabase/ssr). Use this in Client Components
// (e.g. the login screen's LinkedIn / magic-link calls).
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
