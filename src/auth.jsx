// Lightweight auth layer for the v2 prototype.
// Mock credentials hardcoded; useAuth is the single seam to swap in Supabase Auth later.
// Uses React context only — no localStorage / sessionStorage per spec.
import React, { createContext, useContext, useState, useEffect } from "react";
import { Zap, ArrowRight, ChevronLeft, Sparkles } from "lucide-react";

const MOCK_USERS = [
  { email: "talent@lt.house", password: "password", role: "talent", name: "Demo Talent" },
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
const ROLE_TABS = [
  { k: "talent", l: "Talent", desc: "Apply or track your application" },
  { k: "company", l: "Company", desc: "Search and hire from the network" },
  { k: "investor", l: "Investor", desc: "Manage portfolio company hiring" },
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
  const [role, setRole] = useState("talent");
  const [email, setEmail] = useState(PRESET_FOR_TAB.talent);
  const [password, setPassword] = useState("password");
  const [err, setErr] = useState(null);

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
        <div className="text-center text-xs text-stone-500 mt-4">
          ⚡ The Lighthouse · Talent · v2
        </div>
      </div>
    </div>
  );
}
