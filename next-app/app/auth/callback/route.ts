// Auth callback (#12). Both LinkedIn OIDC and the magic link redirect here with a
// PKCE `code`; exchange it for a session cookie, then send the user home.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  // No code or exchange failed → back to the login screen with a flag.
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
