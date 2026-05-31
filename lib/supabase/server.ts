// Server-side Supabase client (@supabase/ssr). Reads/writes the auth cookies via
// Next 16's async `cookies()`. Use this in Server Components, Route Handlers, and
// Server Actions. The browser client lives in ./client.ts.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In a Server Component this can throw (read-only). It's safe to ignore
          // there because the proxy refreshes the session; setAll only needs to
          // succeed in Route Handlers / Server Actions.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* called from a Server Component — handled by proxy.ts */
          }
        },
      },
    }
  );
}
