// Lightweight auth layer for the v2 prototype.
// Mock credentials hardcoded; useAuth is the single seam to swap in Supabase Auth later.
// Uses React context only — no localStorage / sessionStorage per spec.
import React, { createContext, useContext, useState, useEffect } from "react";
import { Zap, ArrowRight, ChevronLeft, Sparkles } from "lucide-react";

const MOCK_USERS = [
  // Demo talent user is pinned to candidate id 2 (Eliana Eskinazi) so messages and interested companies have real data
  { email: "talent@lt.house", password: "password", role: "talent", name: "Eliana Eskinazi", candidateId: 2 },
  { email: "company@lt.house", password: "password", role: "company", name: "Demo Company", companyId: 5 },
  // Investor role removed from MVP per strip handoff. UI parked in feature/investor-portal-v1
  // branch. Schema field on user accounts (role: "investor") stays dormant — re-add a credential
  // here when reactivating.
  { email: "zap@lt.house", password: "password", role: "admin", name: "Zap" },
  { email: "mike@lt.house", password: "password", role: "admin", name: "Mike" },
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Magic-link path — /login?token=XYZ auto-authenticates the holder of a token.
  // For v2 the token is mocked: any token "tk_<role>" logs you in as that role.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token && token.startsWith("tk_")) {
      const role = token.replace("tk_", "");
      const found = MOCK_USERS.find(u => u.role === role);
      if (found) setUser(found);
    }
  }, []);

  function login({ email, password }) {
    setLoading(true);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const found = MOCK_USERS.find(u => u.email === email && u.password === password);
        setLoading(false);
        if (found) { setUser(found); resolve(found); }
        else reject(new Error("Invalid credentials"));
      }, 600);
    });
  }
  function logout() { setUser(null); }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
// LOGIN SCREEN — 4 role tabs, mock credentials, one-call to login()
// ============================================================
// Login tabs. MVP roles only: Talent / Company / Admin (investor removed per strip handoff).
const ROLE_TABS = [
  { k: "talent", l: "Talent", desc: "Apply to the network" },
  { k: "company", l: "Company", desc: "Search and hire from the network" },
  { k: "admin", l: "Admin", desc: "Lighthouse internal tools" },
];

// Tab sets shown for each entry context. The default ("all") is the catch-all
// shown when somebody clicks the small "Sign in" link in the header. Hire context
// now has a single tab — the tab strip hides itself when there's nothing to choose.
const TAB_SETS = {
  hire: ["company"],
  all: ["talent", "company", "admin"],
};

const PRESET_FOR_TAB = {
  talent: "talent@lt.house",
  company: "company@lt.house",
  admin: "zap@lt.house",
};

export function LoginScreen() {
  const { login, loading } = useAuth();
  const [view, setView] = useState("landing"); // landing | login
  const [context, setContext] = useState("all"); // hire | all — gates which tabs show
  const [role, setRole] = useState("talent");
  const [email, setEmail] = useState(PRESET_FOR_TAB.talent);
  const [password, setPassword] = useState("password");
  const [err, setErr] = useState(null);

  // When we transition off the landing page, push a history entry so the browser
  // back button (or swipe-back gesture) returns to the landing page instead of
  // leaving the site entirely.
  useEffect(() => {
    if (view === "landing") return;
    const stateId = Date.now() + Math.random();
    window.history.pushState({ ltStateId: stateId }, "");
    const handler = () => setView("landing");
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [view]);

  // Direct-apply path: log in as talent + flag the intake to skip its landing screen
  // and drop the user straight into the LinkedIn step.
  async function applyAsTalentDirect() {
    if (typeof window !== "undefined") window.__lt_skip_talent_landing = true;
    try { await login({ email: "talent@lt.house", password: "password" }); }
    catch (ex) { setErr(ex.message); }
  }

  if (view === "landing") {
    return <PublicLanding
      onSignIn={(preset, ctx) => {
        const nextContext = ctx || (preset === "company" ? "hire" : "all");
        setContext(nextContext);
        const fallback = TAB_SETS[nextContext][0];
        const chosen = preset && TAB_SETS[nextContext].includes(preset) ? preset : fallback;
        setRole(chosen);
        setEmail(PRESET_FOR_TAB[chosen]);
        setView("login");
      }}
      onApplyAsTalent={applyAsTalentDirect}
    />;
  }

  const visibleTabs = ROLE_TABS.filter(t => TAB_SETS[context].includes(t.k));
  const heading = context === "hire" ? "Sign in to hire" : "Sign in to continue";
  const gridCols = visibleTabs.length === 2 ? "grid-cols-2" : "grid-cols-3";
  const showTabs = visibleTabs.length > 1;

  function pickRole(k) {
    setRole(k);
    setEmail(PRESET_FOR_TAB[k]);
    setErr(null);
  }
  async function submit(e) {
    e.preventDefault();
    setErr(null);
    try { await login({ email, password }); }
    catch (ex) { setErr(ex.message); }
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
          <div className="text-stone-500 text-sm">{heading}.</div>
        </div>
        {/* Role tabs (hidden when there's only one tab in scope) */}
        {showTabs && (
          <div className={`grid ${gridCols} mb-6 border border-stone-200 rounded-xl overflow-hidden text-xs`}>
            {visibleTabs.map(t => (
              <button key={t.k} type="button" onClick={() => pickRole(t.k)}
                className={`py-3 font-bold transition ${role === t.k ? "bg-yellow-400 text-black" : "bg-white text-stone-500 hover:bg-stone-50"}`}>
                {t.l}
              </button>
            ))}
          </div>
        )}
        <div className="text-center text-xs text-stone-500 mb-5">{ROLE_TABS.find(t => t.k === role)?.desc}</div>

        <form onSubmit={submit} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
              className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-black" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
              className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-black" />
          </div>
          {err && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</div>}
          <button type="submit" disabled={loading}
            className={`w-full bg-yellow-400 text-black hover:bg-yellow-300 font-bold rounded-lg py-3 text-sm transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
            {loading ? "Signing in..." : "Sign in →"}
          </button>
          <div className="text-[10px] text-stone-500 text-center pt-2 leading-relaxed">
            <Sparkles size={10} className="inline mr-0.5 text-amber-500" />
            Demo · password is <span className="font-mono font-bold">password</span> for any role
          </div>
        </form>
        <div className="text-center text-xs text-stone-500 mt-4 space-x-3">
          <button onClick={() => setView("landing")} className="hover:text-amber-600 underline underline-offset-4">← Back to home</button>
          <span>·</span>
          <span>⚡ The Lighthouse · Talent</span>
        </div>
      </div>
    </div>
  );
}

// Public landing page — intentionally bare. Two CTAs that gate the next step:
// "I'm talent" goes straight to intake (no portal, no extra screens), "I'm hiring"
// goes to the login screen with company pre-selected.
function PublicLanding({ onSignIn, onApplyAsTalent }) {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={18} />
            <span className="font-display tracking-tight font-bold">The Lighthouse</span>
            <span className="text-stone-400 text-xs">/ Talent</span>
          </div>
          <button onClick={() => onSignIn()} className="text-sm text-stone-500 hover:text-amber-600">Sign in →</button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-3xl py-20 text-center">
          <div className="text-5xl mb-8">⚡</div>
          <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[1.1] mb-4">
            Nashville's curated startup talent network.
          </h1>

          <div className="grid sm:grid-cols-2 gap-3 mt-12 max-w-2xl mx-auto">
            <button
              onClick={onApplyAsTalent}
              className="group text-left border border-stone-200 rounded-2xl px-6 py-7 hover:border-amber-400 hover:bg-amber-50/40 transition"
            >
              <div className="text-2xl mb-2">👋</div>
              <div className="font-display text-xl font-bold mb-1">I want to work at a startup</div>
              <div className="text-sm text-stone-500 group-hover:text-amber-700">Apply to the network →</div>
            </button>
            <button
              onClick={() => onSignIn("company")}
              className="group text-left border border-stone-200 rounded-2xl px-6 py-7 hover:border-amber-400 hover:bg-amber-50/40 transition"
            >
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
          <button onClick={() => onSignIn()} className="hover:text-amber-600">Sign in</button>
        </div>
      </div>
    </div>
  );
}
