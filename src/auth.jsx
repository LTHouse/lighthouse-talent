// Auth layer — real Supabase Auth.
//   * PRIMARY  : Sign in with LinkedIn (OIDC).
//   * FALLBACK : email magic link.
// Role is resolved from public.users (never defaulted). A missing public.users
// row means "not set up yet" — we sign the user out with a clear message rather
// than silently granting a role. useAuth() keeps the same `{ user, ... }` shape
// App.jsx already consumes (user.email / role / name / candidateId / companyId).
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Zap, Linkedin, Mail, Sparkles } from "lucide-react";
import { supabase } from "./lib/supabase.js";

const AuthContext = createContext(null);

// Build the app-facing user object from a Supabase session + the public.users row.
function buildUser(session, profile) {
  const meta = session.user.user_metadata || {};
  return {
    id: session.user.id,
    email: session.user.email || meta.email || "",
    name: meta.full_name || meta.name || (session.user.email || "").split("@")[0],
    role: profile.role,
    candidateId: profile.candidate_id || null,
    companyId: profile.company_id || null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);      // resolving the initial session
  const [notProvisioned, setNotProvisioned] = useState(false);

  // Resolve role from public.users for an authenticated session.
  const resolveSession = useCallback(async (session) => {
    if (!session) { setUser(null); setNotProvisioned(false); setLoading(false); return; }
    const { data: profile, error } = await supabase
      .from("users")
      .select("role, candidate_id, company_id")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error || !profile) {
      // Authenticated but no role row → not set up. Never default a role.
      setUser(null);
      setNotProvisioned(true);
      await supabase.auth.signOut();
    } else {
      setUser(buildUser(session, profile));
      setNotProvisioned(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => resolveSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      resolveSession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, [resolveSession]);

  const signInWithLinkedIn = useCallback(async () => {
    return supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signInWithMagicLink = useCallback(async (email) => {
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotProvisioned(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, role: user?.role || null, loading, notProvisioned,
      signInWithLinkedIn, signInWithMagicLink, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// ============================================================
// LOGIN SCREEN — landing → sign-in (LinkedIn primary, magic link fallback)
// ============================================================
export function LoginScreen({ notProvisioned }) {
  const { signInWithLinkedIn, signInWithMagicLink } = useAuth();
  const [view, setView] = useState(notProvisioned ? "login" : "landing"); // landing | login
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  // Browser back from the sign-in view returns to the landing page.
  useEffect(() => {
    if (view === "landing") return;
    window.history.pushState({ lt: 1 }, "");
    const handler = () => setView("landing");
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [view]);

  async function linkedIn() {
    setErr(null); setBusy(true);
    const { error } = await signInWithLinkedIn();
    if (error) { setErr(error.message); setBusy(false); }
    // success → browser redirects to LinkedIn
  }
  async function magicLink(e) {
    e.preventDefault();
    setErr(null); setBusy(true);
    const { error } = await signInWithMagicLink(email);
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  if (view === "landing") {
    return <PublicLanding onSignIn={() => setView("login")} />;
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-yellow-100/60 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-50 blur-3xl pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="text-amber-500 fill-amber-500" size={28} />
            <div className="font-display text-3xl">Lighthouse</div>
            <span className="text-stone-500 text-sm">Talent</span>
          </div>
          <div className="text-stone-500 text-sm">Sign in to continue.</div>
        </div>

        {notProvisioned && (
          <div className="mb-5 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-3 text-amber-800">
            Your account isn't set up yet — contact Lighthouse and we'll get you access.
          </div>
        )}

        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">
          {/* PRIMARY — LinkedIn */}
          <button onClick={linkedIn} disabled={busy}
            className={`w-full flex items-center justify-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold rounded-lg py-3 text-sm transition ${busy ? "opacity-60 cursor-not-allowed" : ""}`}>
            <Linkedin size={18} /> Sign in with LinkedIn
          </button>

          <div className="flex items-center gap-3 text-xs text-stone-400">
            <div className="flex-1 h-px bg-stone-200" /> or <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* FALLBACK — magic link */}
          {sent ? (
            <div className="text-center text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-4">
              <Mail className="inline mb-1 text-amber-500" size={18} />
              <div className="font-semibold mt-1">Check your inbox</div>
              <div className="text-stone-500 text-xs mt-1">We sent a sign-in link to {email}.</div>
            </div>
          ) : (
            <form onSubmit={magicLink} className="space-y-3">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">Email a sign-in link</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@company.com"
                className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-black" />
              <button type="submit" disabled={busy}
                className={`w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold rounded-lg py-2.5 text-sm transition ${busy ? "opacity-60 cursor-not-allowed" : ""}`}>
                {busy ? "Sending..." : "Send magic link"}
              </button>
            </form>
          )}

          {err && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</div>}
        </div>

        <div className="text-center text-xs text-stone-500 mt-4 space-x-3">
          <button onClick={() => setView("landing")} className="hover:text-amber-600 underline underline-offset-4">← Back to home</button>
          <span>·</span>
          <span>⚡ The Lighthouse · Talent</span>
        </div>
      </div>
    </div>
  );
}

// Public landing page — two CTAs. Both lead to sign-in for now; the public
// (no-account) talent intake form is wired separately (#15).
function PublicLanding({ onSignIn }) {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={18} />
            <span className="font-display tracking-tight font-bold">The Lighthouse</span>
            <span className="text-stone-400 text-xs">/ Talent</span>
          </div>
          <button onClick={onSignIn} className="text-sm text-stone-500 hover:text-amber-600">Sign in →</button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-3xl py-20 text-center">
          <div className="text-5xl mb-8">⚡</div>
          <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[1.1] mb-4">
            Nashville's curated startup talent network.
          </h1>

          <div className="grid sm:grid-cols-2 gap-3 mt-12 max-w-2xl mx-auto">
            <button onClick={onSignIn}
              className="group text-left border border-stone-200 rounded-2xl px-6 py-7 hover:border-amber-400 hover:bg-amber-50/40 transition">
              <div className="text-2xl mb-2">👋</div>
              <div className="font-display text-xl font-bold mb-1">I want to work at a startup</div>
              <div className="text-sm text-stone-500 group-hover:text-amber-700">Apply to the network →</div>
            </button>
            <button onClick={onSignIn}
              className="group text-left border border-stone-200 rounded-2xl px-6 py-7 hover:border-amber-400 hover:bg-amber-50/40 transition">
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-display text-xl font-bold mb-1">I'm a startup hiring</div>
              <div className="text-sm text-stone-500 group-hover:text-amber-700">Sign in to hire →</div>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200">
        <div className="max-w-4xl mx-auto px-8 py-5 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={14} />
            <span>The Lighthouse · Talent</span>
          </div>
          <button onClick={onSignIn} className="hover:text-amber-600">Sign in</button>
        </div>
      </div>
    </div>
  );
}
