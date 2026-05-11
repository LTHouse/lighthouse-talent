// Lightweight auth layer for the v2 prototype.
// Mock credentials hardcoded; useAuth is the single seam to swap in Supabase Auth later.
// Uses React context only — no localStorage / sessionStorage per spec.
import React, { createContext, useContext, useState, useEffect } from "react";
import { Zap, ArrowRight, ChevronLeft, Sparkles } from "lucide-react";

const MOCK_USERS = [
  // Demo talent user is pinned to candidate id 2 (Eliana Eskinazi) so messages and interested companies have real data
  { email: "talent@lt.house", password: "password", role: "talent", name: "Eliana Eskinazi", candidateId: 2 },
  { email: "company@lt.house", password: "password", role: "company", name: "Demo Company", companyId: 5 },
  { email: "investor@lt.house", password: "password", role: "investor", name: "Demo Investor", investorId: 1 },
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
// Four login tabs for demo/simulation. Investor accounts get the portfolio dropdown
// automatically in the company portal once signed in.
const ROLE_TABS = [
  { k: "talent", l: "Talent", desc: "Apply to the network" },
  { k: "company", l: "Company", desc: "Search and hire from the network" },
  { k: "investor", l: "Investor", desc: "Search across your portfolio companies" },
  { k: "admin", l: "Admin", desc: "Lighthouse internal tools" },
];

const PRESET_FOR_TAB = {
  talent: "talent@lt.house",
  company: "company@lt.house",
  investor: "investor@lt.house",
  admin: "zap@lt.house",
};

export function LoginScreen() {
  const { login, loading } = useAuth();
  const [view, setView] = useState("landing"); // landing | login
  const [role, setRole] = useState("talent");
  const [email, setEmail] = useState(PRESET_FOR_TAB.talent);
  const [password, setPassword] = useState("password");
  const [err, setErr] = useState(null);

  if (view === "landing") {
    return <PublicLanding onSignIn={(preset) => {
      if (preset) { setRole(preset); setEmail(PRESET_FOR_TAB[preset]); }
      setView("login");
    }} />;
  }

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
          <div className="text-stone-500 text-sm">Sign in to continue.</div>
        </div>
        {/* Role tabs */}
        <div className="grid grid-cols-4 mb-6 border border-stone-200 rounded-xl overflow-hidden text-xs">
          {ROLE_TABS.map(t => (
            <button key={t.k} type="button" onClick={() => pickRole(t.k)}
              className={`py-3 font-bold transition ${role === t.k ? "bg-yellow-400 text-black" : "bg-white text-stone-500 hover:bg-stone-50"}`}>
              {t.l}
            </button>
          ))}
        </div>
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

// Public landing page — mirrors lt.house exactly: ⚡ icon, Syne headline, descriptive paragraph,
// hr dividers, two-column emoji-led list sections, "Sign in" CTAs targeted to each role.
function PublicLanding({ onSignIn }) {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Top bar */}
      <div className="border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={18} />
            <span className="font-display tracking-tight font-bold">The Lighthouse</span>
            <span className="text-stone-400 text-xs">/ Talent</span>
          </div>
          <button onClick={() => onSignIn()} className="text-sm font-bold hover:text-amber-600">Sign in →</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-16 space-y-12">
        {/* Hero */}
        <div>
          <div className="text-6xl mb-6">⚡</div>
          <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[1.1]">
            We back the Nashville startup hire.
          </h1>
          <p className="text-stone-700 text-lg mt-6 max-w-2xl leading-relaxed">
            Lighthouse Talent is a curated, semantically-searchable database of operators, builders, and creatives for Nashville's best startups. Every member is personally vetted by Zap.
          </p>
        </div>

        <hr className="border-stone-200" />

        {/* What it is + Who it's for */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          <div>
            <h3 className="text-lg font-display font-bold mb-3">What we are</h3>
            <div className="space-y-2.5 text-base">
              <div className="flex items-start gap-3"><span className="text-xl">🎯</span><span>A curated talent network for Nashville</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">🚀</span><span>Hand-picked operators, builders, creatives</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">⚡</span><span>Every intro made personally by Zap</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">🌟</span><span>Free for talent. Always.</span></div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-display font-bold mb-3">Who it's for</h3>
            <div className="space-y-2.5 text-base">
              <div className="flex items-start gap-3"><span className="text-xl">🦄</span><span>Founders ready to hire</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">💼</span><span>Investors hiring across the portfolio</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">⚙️</span><span>Operators looking for the right room</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">🎨</span><span>Builders + creatives ready for v1</span></div>
            </div>
          </div>
        </div>

        <hr className="border-stone-200" />

        {/* How it works */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          <div>
            <h3 className="text-lg font-display font-bold mb-3">If you're a candidate</h3>
            <div className="space-y-2.5 text-base">
              <div className="flex items-start gap-3"><span className="text-xl">🔗</span><span>Connect your LinkedIn</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">📝</span><span>Share the essentials</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">☕</span><span>Vetting call with Zap</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">🤝</span><span>Founders come to you</span></div>
            </div>
            <button onClick={() => onSignIn("talent")} className="mt-5 inline-flex items-center gap-2 font-bold text-amber-600 hover:text-amber-700">Apply to the network →</button>
          </div>
          <div>
            <h3 className="text-lg font-display font-bold mb-3">If you're hiring</h3>
            <div className="space-y-2.5 text-base">
              <div className="flex items-start gap-3"><span className="text-xl">🔍</span><span>Search by role, experience, motivation</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">⭐</span><span>Save searches and shortlist candidates</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">☕</span><span>Request a warm intro through Zap</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">📚</span><span>Access hiring playbooks + market data</span></div>
            </div>
            <button onClick={() => onSignIn("company")} className="mt-5 inline-flex items-center gap-2 font-bold text-amber-600 hover:text-amber-700">Sign in to hire →</button>
          </div>
        </div>

        <hr className="border-stone-200" />

        {/* For investors */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          <div>
            <h3 className="text-lg font-display font-bold mb-3">For investors</h3>
            <div className="space-y-2.5 text-base">
              <div className="flex items-start gap-3"><span className="text-xl">📁</span><span>Search on behalf of any portco</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">🏷️</span><span>Tag every search by portfolio company</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">💼</span><span>Manage shortlists across your portfolio</span></div>
              <div className="flex items-start gap-3"><span className="text-xl">🤝</span><span>Same warm-intro flow through Zap</span></div>
            </div>
            <button onClick={() => onSignIn("investor")} className="mt-5 inline-flex items-center gap-2 font-bold text-amber-600 hover:text-amber-700">Investor sign in →</button>
          </div>
          <div>
            <h3 className="text-lg font-display font-bold mb-3">Lighthouse, beyond Talent</h3>
            <div className="space-y-2.5 text-base">
              <div className="flex items-start gap-3"><span className="text-xl">📋</span><a href="https://lt.house" target="_blank" rel="noreferrer" className="hover:text-amber-600">The Lighthouse Process</a></div>
              <div className="flex items-start gap-3"><span className="text-xl">⭐</span><a href="https://lt.house" target="_blank" rel="noreferrer" className="hover:text-amber-600">Founder community</a></div>
              <div className="flex items-start gap-3"><span className="text-xl">💰</span><a href="https://lt.house" target="_blank" rel="noreferrer" className="hover:text-amber-600">Raising capital</a></div>
              <div className="flex items-start gap-3"><span className="text-xl">⚡</span><a href="https://lt.house" target="_blank" rel="noreferrer" className="hover:text-amber-600">Who is Zap</a></div>
            </div>
          </div>
        </div>

        <hr className="border-stone-200" />

        {/* CTA strip */}
        <div className="text-center py-6">
          <h3 className="text-2xl font-display font-bold mb-3">Ready to get on the list?</h3>
          <p className="text-stone-700 mb-5 max-w-lg mx-auto">Zap reviews every application personally. Whether you're hiring or being hired, you're in good hands.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onSignIn("talent")} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 text-black hover:bg-yellow-300 rounded-lg font-bold text-sm">
              <Zap size={16} /> Apply as talent
            </button>
            <button onClick={() => onSignIn("company")} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-stone-300 text-black hover:bg-stone-50 rounded-lg font-bold text-sm">
              Sign in to hire →
            </button>
          </div>
        </div>

        {/* Footer */}
        <hr className="border-stone-200" />
        <div className="flex items-center justify-between text-xs text-stone-500 pt-2 pb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={14} />
            <span>The Lighthouse · Talent</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://lt.house" target="_blank" rel="noreferrer" className="hover:text-amber-600">lt.house →</a>
            <button onClick={() => onSignIn()} className="hover:text-amber-600">Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}
