// Public Supabase connection config. These are PUBLIC values (the project URL and
// the `anon` publishable key) — they ship to every browser by design and are not
// secrets; RLS is the security boundary. We read NEXT_PUBLIC_* env when it's a
// *real* value and fall back to the committed public values otherwise.
//
// Why the guard: Next.js auto-loads the committed `.env`, whose values are
// dotenvx-ENCRYPTED (`encrypted:...`). Unless the build runs through
// `dotenvx run` (which decrypts into process.env first), Next would otherwise feed
// the ciphertext to the client → "Invalid supabaseUrl". The guard ignores any
// encrypted/blank value so the app works regardless of how the build env is set.
const PUBLIC_URL = "https://rdnfckhtheescralfkwn.supabase.co";
const PUBLIC_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbmZja2h0aGVlc2NyYWxma3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzI1MzMsImV4cCI6MjA5Mzc0ODUzM30.pZI6yOCWn2kBvVBlt0TJLTtj18BmVIm_P-UmHmCuv0w";

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_URL = envUrl && envUrl.startsWith("http") ? envUrl : PUBLIC_URL;
export const SUPABASE_ANON_KEY = envKey && envKey.startsWith("eyJ") ? envKey : PUBLIC_ANON_KEY;
