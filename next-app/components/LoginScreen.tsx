"use client";

// Login screen — LinkedIn OIDC (primary) + email magic link (fallback). Ported
// from the Vite app's auth.jsx; uses the browser Supabase client + /auth/callback.
import { useState } from "react";
import { Zap, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// lucide-react v1 dropped brand icons, so the LinkedIn mark is an inline SVG.
function LinkedinMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export default function LoginScreen({ authError }: { authError?: boolean }) {
  const supabase = createClient();
  const [view, setView] = useState<"landing" | "login">("landing");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(authError ? "Sign-in failed — please try again." : null);
  const [busy, setBusy] = useState(false);

  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

  async function linkedIn() {
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: { redirectTo },
    });
    if (error) {
      setErr(error.message);
      setBusy(false);
    }
  }

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  if (view === "landing") {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">
        <div className="border-b border-stone-200">
          <div className="max-w-4xl mx-auto px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="text-amber-500 fill-amber-500" size={18} />
              <span className="font-display tracking-tight font-bold">The Lighthouse</span>
              <span className="text-stone-400 text-xs">/ Talent</span>
            </div>
            <button onClick={() => setView("login")} className="text-sm text-stone-500 hover:text-amber-600">
              Sign in →
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-3xl py-20 text-center">
            <div className="text-5xl mb-8">⚡</div>
            <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[1.1] mb-4">
              Nashville&apos;s curated startup talent network.
            </h1>
            <div className="grid sm:grid-cols-2 gap-3 mt-12 max-w-2xl mx-auto">
              <button
                onClick={() => setView("login")}
                className="group text-left border border-stone-200 rounded-2xl px-6 py-7 hover:border-amber-400 hover:bg-amber-50/40 transition"
              >
                <div className="text-2xl mb-2">👋</div>
                <div className="font-display text-xl font-bold mb-1">I want to work at a startup</div>
                <div className="text-sm text-stone-500 group-hover:text-amber-700">Apply to the network →</div>
              </button>
              <button
                onClick={() => setView("login")}
                className="group text-left border border-stone-200 rounded-2xl px-6 py-7 hover:border-amber-400 hover:bg-amber-50/40 transition"
              >
                <div className="text-2xl mb-2">🚀</div>
                <div className="font-display text-xl font-bold mb-1">I&apos;m a startup hiring</div>
                <div className="text-sm text-stone-500 group-hover:text-amber-700">Sign in to hire →</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="text-amber-500 fill-amber-500" size={28} />
            <div className="font-display text-3xl">Lighthouse</div>
            <span className="text-stone-500 text-sm">Talent</span>
          </div>
          <div className="text-stone-500 text-sm">Sign in to continue.</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
          <button
            onClick={linkedIn}
            disabled={busy}
            className={`w-full flex items-center justify-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold rounded-lg py-3 text-sm transition ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <LinkedinMark size={18} /> Sign in with LinkedIn
          </button>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <div className="flex-1 h-px bg-stone-200" /> or <div className="flex-1 h-px bg-stone-200" />
          </div>
          {sent ? (
            <div className="text-center text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-4">
              <Mail className="inline mb-1 text-amber-500" size={18} />
              <div className="font-semibold mt-1">Check your inbox</div>
              <div className="text-stone-500 text-xs mt-1">We sent a sign-in link to {email}.</div>
            </div>
          ) : (
            <form onSubmit={magicLink} className="space-y-3">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Email a sign-in link
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="you@company.com"
                className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                disabled={busy}
                className={`w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold rounded-lg py-2.5 text-sm transition ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {busy ? "Sending..." : "Send magic link"}
              </button>
            </form>
          )}
          {err && (
            <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</div>
          )}
        </div>
        <div className="text-center text-xs text-stone-500 mt-4">
          <button onClick={() => setView("landing")} className="hover:text-amber-600 underline underline-offset-4">
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
