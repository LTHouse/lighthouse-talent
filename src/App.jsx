// Lighthouse Talent — MVP (strip-down from v1)
// Core loop: company logs in → filter search → finds candidates → requests warm intro through Zap.
// All mock data in src/data.js; ready to swap to Supabase later via src/lib/supabase.js.
import React, { useState, useMemo, useEffect } from "react";
import {
  Zap, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Search, Filter, Linkedin,
  CheckCircle2, Sparkles, X, ArrowRight, ArrowLeft, MapPin, Briefcase, GraduationCap,
  Mail, Phone, Star, Users, Clock, Building2, Calendar, Shield, Settings, BookOpenCheck,
  FileText, MessageSquare, Send, Plus, Eye, LogOut, Home, Database, KanbanSquare,
  AlertCircle, Coffee, Save, Edit3, ChevronsUpDown, GripVertical, RefreshCw, Globe,
} from "lucide-react";
import { CANDIDATES, COMPANIES, INVESTORS, SAVED_SEARCHES, SHORTLISTS, RESOURCES, INITIAL_INTRO_REQUESTS, DEMO_TALENT_CANDIDATE_ID } from "./data.js";
import { AuthProvider, useAuth, LoginScreen } from "./auth.jsx";

// ============================================================
// CONSTANTS
// ============================================================
const ROLE_TYPES = ["Engineering", "Product", "Design", "Operations", "Marketing", "Sales", "Customer Success", "Data", "Finance", "Founding Team", "Other"];

const MOTIVATIONS = [
  "I want to own something — equity, decisions, outcomes.",
  "I want to learn faster than I would anywhere else.",
  "I want to find a startup where I care deeply about the specific problem being solved.",
  "I want to build something from scratch, not maintain what already exists.",
  "I'm bored at big company life and I'm finally doing something about it.",
  "I want the financial upside if the company wins big.",
  "I just need a job.",
];

const MOTIVATION_SHORT = {
  "I want to own something — equity, decisions, outcomes.": "Wants ownership",
  "I want to learn faster than I would anywhere else.": "Wants to learn faster",
  "I want to find a startup where I care deeply about the specific problem being solved.": "Mission-driven",
  "I want to build something from scratch, not maintain what already exists.": "Wants to build 0→1",
  "I'm bored at big company life and I'm finally doing something about it.": "Escaping big-co",
  "I want the financial upside if the company wins big.": "Upside-driven",
  "I just need a job.": "Just needs a job",
};

const RELOCATION_LABELS = {
  in_tn: "In Tennessee",
  willing_to_relocate: "Willing to relocate to Nashville",
  remote_only: "Remote only",
};

const RELOCATION_OPTIONS = [
  { value: "in_tn", label: "I'm already in Tennessee" },
  { value: "willing_to_relocate", label: "I'm willing to relocate to Nashville for the right role" },
  { value: "remote_only", label: "I'm only interested in remote roles" },
];

const WORK_MODES = ["In-person Nashville", "Hybrid", "Remote", "Open"];
const STARTUP_STAGES = ["Pre-seed", "Seed", "Series A", "Series B+", "Multiple stages"];
const STARTUP_SIZES = ["1-10", "11-50", "51-200", "200+", "Multiple sizes"];

// ============================================================
// UI PRIMITIVES (lt.house brand)
// ============================================================
function Button({ children, onClick, variant = "primary", size = "md", disabled, className = "", icon: Icon, type = "button" }) {
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  const variants = {
    primary: "bg-yellow-400 text-black hover:bg-yellow-300 font-bold",
    secondary: "bg-stone-100 text-black hover:bg-stone-200 border border-stone-300 font-semibold",
    ghost: "bg-transparent text-stone-700 hover:bg-stone-100 font-semibold",
    outline: "bg-transparent text-black border border-stone-400 hover:bg-stone-100 font-semibold",
    danger: "bg-rose-600 text-white hover:bg-rose-500 font-semibold",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} transition-colors ${className}`}>
      {Icon && <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} />}
      {children}
    </button>
  );
}
function Card({ children, className = "", padded = true, onClick }) {
  return (
    <div onClick={onClick}
      className={`bg-white border border-stone-200 rounded-xl ${padded ? "p-5" : ""} ${onClick ? "cursor-pointer hover:border-stone-400 transition" : ""} ${className}`}>
      {children}
    </div>
  );
}
function Tag({ children, color = "default", size = "sm" }) {
  const palette = {
    default: "bg-stone-100 text-stone-700 border-stone-200",
    yellow: "bg-yellow-100 text-amber-800 border-yellow-300",
    blue: "bg-sky-100 text-sky-800 border-sky-300",
    purple: "bg-violet-100 text-violet-800 border-violet-300",
    green: "bg-emerald-100 text-emerald-800 border-emerald-300",
    red: "bg-rose-100 text-rose-800 border-rose-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
  };
  const sz = size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return <span className={`inline-flex items-center gap-1 rounded-full border ${palette[color] || palette.default} ${sz} font-medium whitespace-nowrap`}>{children}</span>;
}
function Input(props) { return <input {...props} className={`w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder:text-stone-400 focus:outline-none focus:border-black ${props.className || ""}`} />; }
function Textarea(props) { return <textarea {...props} className={`w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder:text-stone-400 focus:outline-none focus:border-black resize-y ${props.className || ""}`} />; }
function Select({ value, onChange, options, className = "" }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black ${className}`}>
      {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
    </select>
  );
}
function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-amber-500">*</span>}
      </label>
      {children}
      {hint && <div className="text-xs text-stone-500 mt-1">{hint}</div>}
    </div>
  );
}
function MultiSelectChips({ options, selected, onChange }) {
  function toggle(o) { if (selected.includes(o)) onChange(selected.filter(s => s !== o)); else onChange([...selected, o]); }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} onClick={() => toggle(o)} type="button"
          className={`px-3 py-1.5 text-xs rounded-full border transition ${selected.includes(o)
            ? "bg-yellow-400 border-yellow-400 text-black font-bold"
            : "bg-white border-stone-300 text-stone-700 hover:border-stone-400"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
function RangeSlider({ min, max, value, onChange, step = 1, format = v => v }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-stone-500"><span>{format(value[0])}</span><span>{format(value[1])}</span></div>
      <div className="relative h-1.5 bg-stone-200 rounded-full">
        <div className="absolute h-full bg-yellow-400 rounded-full"
          style={{ left: `${((value[0] - min) / (max - min)) * 100}%`, right: `${100 - ((value[1] - min) / (max - min)) * 100}%` }} />
      </div>
      <div className="flex gap-2">
        <input type="range" min={min} max={max} step={step} value={value[0]} onChange={e => onChange([Math.min(+e.target.value, value[1]), value[1]])} className="w-full accent-yellow-400" />
        <input type="range" min={min} max={max} step={step} value={value[1]} onChange={e => onChange([value[0], Math.max(+e.target.value, value[0])])} className="w-full accent-yellow-400" />
      </div>
    </div>
  );
}
function ProgressBar({ value, max = 100, color = "bg-yellow-400" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden"><div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} /></div>;
}

// Avatar — deterministic colored initials
const AVATAR_COLORS = [["#FACC15", "#0A0A0A"], ["#FB923C", "#0A0A0A"], ["#38BDF8", "#0A0A0A"], ["#A78BFA", "#fff"], ["#F87171", "#fff"], ["#34D399", "#0A0A0A"], ["#FBBF24", "#0A0A0A"], ["#F472B6", "#fff"]];
function Avatar({ candidate, size = 40 }) {
  const initials = ((candidate.firstName?.[0] || "") + (candidate.lastName?.[0] || "")).toUpperCase();
  const [bg, fg] = AVATAR_COLORS[(candidate.photoSeed || 0) % AVATAR_COLORS.length];
  return <div style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.38 }} className="rounded-full flex items-center justify-center font-bold flex-shrink-0">{initials}</div>;
}

// ============================================================
// FILTER LOGIC (filter-first; NL search via Advanced is best-effort)
// ============================================================
function filterCandidates(filters, candidates) {
  return candidates.filter(c => {
    if (c.vettingStatus !== "Active" || c.declined) return false;
    // role
    if (filters.roles && filters.roles.length > 0) {
      const match = filters.roles.includes(c.primaryRole) || c.roleTypes?.some(r => filters.roles.includes(r));
      if (!match) return false;
    }
    // yoe
    if (filters.yoeMin !== undefined && c.yearsExperience < filters.yoeMin) return false;
    if (filters.yoeMax !== undefined && c.yearsExperience > filters.yoeMax) return false;
    // has tech
    if (filters.hasTech === "yes" && !c.hasTechExperience) return false;
    if (filters.hasTech === "no" && c.hasTechExperience) return false;
    // has startup
    if (filters.hasStartup === "yes" && !c.hasStartupExperience) return false;
    if (filters.hasStartup === "no" && c.hasStartupExperience) return false;
    // startup stage (if filter set and candidate has experience)
    if (filters.startupStages && filters.startupStages.length > 0) {
      if (!c.startupStage || !filters.startupStages.includes(c.startupStage)) return false;
    }
    // location availability — defaults to all three; only filter if subset selected
    if (filters.locAvailability && filters.locAvailability.length > 0 && filters.locAvailability.length < 3) {
      if (!filters.locAvailability.includes(c.relocationStatus)) return false;
    }
    // current location free-text
    if (filters.currentLocationFilter) {
      if (!c.currentLocation.toLowerCase().includes(filters.currentLocationFilter.toLowerCase())) return false;
    }
    // work mode
    if (filters.workModes && filters.workModes.length > 0) {
      if (!filters.workModes.includes(c.workMode)) return false;
    }
    // motivation
    if (filters.motivations && filters.motivations.length > 0) {
      if (!filters.motivations.includes(c.topMotivation)) return false;
    }
    return true;
  });
}

// NL → MVP filter dimensions (role / yoe / hasTech / hasStartup). Nothing else.
function interpretNL(query) {
  const q = (query || "").toLowerCase();
  const roleMap = {
    "engineer": "Engineering", "developer": "Engineering", "swe": "Engineering", "engineering": "Engineering",
    "product manager": "Product", "pm": "Product", "product": "Product",
    "design": "Design", "ux": "Design", "ui": "Design",
    "ops": "Operations", "operations": "Operations", "chief of staff": "Operations",
    "marketing": "Marketing", "growth": "Marketing",
    "sales": "Sales", "ae ": "Sales", "bd": "Sales",
    "customer success": "Customer Success", "cs ": "Customer Success",
    "data": "Data", "analytics": "Data",
    "finance": "Finance", "cfo": "Finance",
    "founder": "Founding Team", "co-founder": "Founding Team",
  };
  let role = null;
  for (const [k, v] of Object.entries(roleMap)) { if (q.includes(k)) { role = v; break; } }
  let yoeMin = 0, yoeMax = 25;
  if (/senior|principal|head of|vp|chief|director|staff|lead/i.test(query)) { yoeMin = 7; }
  if (/junior|entry|associate/i.test(query)) { yoeMax = 4; }
  const hasTech = /(tech|software|saas|engineering|product|ml|ai|infrastructure)/i.test(query) ? "yes" : "either";
  const hasStartup = /(startup|founding|early[\s-]stage|pre[\s-]seed|seed|series\s+a)/i.test(query) ? "yes" : "either";
  return { role, yoeMin, yoeMax, hasTech, hasStartup };
}

// ============================================================
// TOP-LEVEL APP
// ============================================================
export default function App() {
  return <AuthProvider><AuthedApp /></AuthProvider>;
}

function AuthedApp() {
  const { user, logout } = useAuth();
  if (!user) return <LoginScreen />;
  return <SignedInShell key={user.email} user={user} logout={logout} />;
}

// Demo-mode synthetic users so the ModeSwitcher can impersonate any role
// without making the user log out and back in.
const DEMO_USERS = {
  talent: { email: "talent@lt.house", role: "talent", name: "Eliana Eskinazi", candidateId: DEMO_TALENT_CANDIDATE_ID },
  company: { email: "company@lt.house", role: "company", name: "SoundHealth", companyId: 5 },
  investor: { email: "investor@lt.house", role: "investor", name: "Overline VC", investorId: 1 },
  admin: { email: "zap@lt.house", role: "admin", name: "Zap" },
};

function SignedInShell({ user, logout }) {
  const [mode, setMode] = useState(user.role);
  const effectiveUser = mode === user.role ? user : (DEMO_USERS[mode] || user);
  const role = effectiveUser.role;
  return (
    <>
      <div key={role}>
        {role === "talent" && <TalentIntakeFlow user={effectiveUser} logout={logout} />}
        {(role === "company" || role === "investor") && <CompanyPortal user={effectiveUser} logout={logout} />}
        {role === "admin" && <AdminPortal user={effectiveUser} logout={logout} />}
      </div>
      <ModeSwitcher mode={mode} setMode={setMode} signedInEmail={user.email} logout={logout} />
    </>
  );
}

// Persistent floating mode-switcher pill — always visible bottom-right.
function ModeSwitcher({ mode, setMode, signedInEmail, logout }) {
  const [open, setOpen] = useState(false);
  const modes = [
    { k: "talent", label: "Talent", desc: "Candidate intake flow" },
    { k: "company", label: "Company", desc: "Hire from the network" },
    { k: "investor", label: "Investor", desc: "Company portal + portco tag" },
    { k: "admin", label: "Admin", desc: "Database, vetting, intro queue" },
  ];
  const current = modes.find(m => m.k === mode);
  return (
    <>
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 bg-black text-yellow-300 hover:bg-stone-800 rounded-full pl-3 pr-4 py-2.5 shadow-2xl flex items-center gap-2 font-bold text-sm transition-all border border-stone-800">
        <span className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center"><Zap size={14} className="text-black fill-black" /></span>
        <span>Demo · {current?.label || "—"}</span>
        <ChevronUp size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed bottom-20 right-5 z-50 w-80 bg-black border border-stone-800 rounded-2xl shadow-2xl p-2 text-stone-100">
            <div className="p-3 pb-2">
              <div className="text-xs uppercase tracking-wider text-yellow-300 font-bold mb-1">Demo navigator</div>
              <div className="text-xs text-stone-400">Flip between the four sides of the platform without signing out. Demo/MVP only.</div>
            </div>
            {modes.map(m => (
              <button key={m.k} onClick={() => { setMode(m.k); setOpen(false); }}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition ${mode === m.k ? "bg-yellow-400 text-black" : "hover:bg-stone-900 text-stone-100"}`}>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{m.label}</div>
                  <div className={`text-xs mt-0.5 ${mode === m.k ? "text-stone-700" : "text-stone-400"}`}>{m.desc}</div>
                </div>
              </button>
            ))}
            <div className="p-3 pt-2 mt-1 border-t border-stone-800 flex items-center justify-between">
              <div className="text-[10px] text-stone-500 truncate">Signed in: <span className="font-mono">{signedInEmail}</span></div>
              <button onClick={logout} className="text-xs text-yellow-300 hover:underline">Sign out</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ============================================================
// TALENT INTAKE FLOW (MVP — slim)
// Steps: Landing → LinkedIn → Basics → Motivations (drag-rank) → Startup/tech yes/no → Confirm
// ============================================================
function TalentIntakeFlow({ user, logout }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    firstName: "", lastName: "", email: user.email, phone: "",
    linkedin: "", linkedinConnected: false,
    currentLocation: "", relocationStatus: "",
    yearsExperience: 5, workMode: "Open",
    rankedMotivations: [...MOTIVATIONS],
    hasStartupExperience: null, startupStage: "", startupSize: "",
    hasTechExperience: null,
    currentRole: "", currentCompany: "", skills: [],
  });
  function update(patch) { setProfile(p => ({ ...p, ...patch })); }
  function next() { setStep(s => s + 1); }
  function back() { setStep(s => Math.max(0, s - 1)); }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={18} />
            <span className="font-display tracking-tight font-bold">Lighthouse</span>
            <span className="text-stone-500 text-xs">Talent</span>
          </div>
          {step > 0 && step < 5 && <div className="text-xs text-stone-500 tabular-nums">Step {step} of 4</div>}
          <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>Exit</Button>
        </div>
        {step > 0 && step < 5 && (
          <div className="max-w-3xl mx-auto px-6 pb-3"><ProgressBar value={step} max={4} /></div>
        )}
      </div>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {step === 0 && <TalentLanding onStart={next} />}
        {step === 1 && <TalentLinkedIn profile={profile} update={update} onNext={next} onBack={back} />}
        {step === 2 && <TalentBasics profile={profile} update={update} onNext={next} onBack={back} />}
        {step === 3 && <TalentMotivations profile={profile} update={update} onNext={next} onBack={back} />}
        {step === 4 && <TalentYesNo profile={profile} update={update} onNext={next} onBack={back} />}
        {step === 5 && <TalentConfirmation profile={profile} onExit={logout} />}
      </div>
    </div>
  );
}

function TalentLanding({ onStart }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight font-display leading-[1.05]">
          Get on <span className="text-amber-500">Zap's list.</span>
        </h1>
        <p className="text-stone-500 text-lg mt-4 max-w-2xl mx-auto">
          The Lighthouse Talent Network is a curated database of operators, builders, and creatives for Nashville's best startups. Every member is personally vetted by Zap.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {[
          { i: "01", t: "Connect LinkedIn", d: "We pull your profile so you don't type twice." },
          { i: "02", t: "Tell us what you want", d: "Location, role, motivation. A few minutes." },
          { i: "03", t: "Submit", d: "Zap reviews every application personally." },
        ].map(s => (
          <Card key={s.i} className="bg-white">
            <div className="text-amber-500 font-bold text-xs tracking-widest">{s.i}</div>
            <div className="text-xl font-bold mt-1">{s.t}</div>
            <div className="text-sm text-stone-500 mt-1">{s.d}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">What happens next</div>
        <div className="space-y-1.5 text-sm text-stone-700">
          <div>1. Zap reviews your application personally.</div>
          <div>2. If approved, we'll set up coffee or a Zoom to get to know you.</div>
          <div>3. Once vetted, you're added to the live database for startups to find.</div>
          <div>4. We make warm intros directly — founders come to you.</div>
        </div>
      </Card>
      <div className="text-center">
        <Button size="lg" icon={Zap} onClick={onStart}>Start your application</Button>
      </div>
    </div>
  );
}

function TalentLinkedIn({ profile, update, onNext, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function isValidUrl(u) {
    return /^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-_.%/]+\/?$/i.test(u || "");
  }
  function connect() {
    setError(null);
    if (!profile.linkedin || !isValidUrl(profile.linkedin)) {
      setError("Paste a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/your-handle/).");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      // Mock-parse: derive name from URL slug
      const slug = (profile.linkedin.match(/linkedin\.com\/in\/([^/]+)/i) || [, "demo-user"])[1].replace(/[-_]/g, " ");
      const [first, ...rest] = slug.split(/\s+/).map(p => p.charAt(0).toUpperCase() + p.slice(1));
      update({
        linkedinConnected: true,
        firstName: profile.firstName || first || "Demo",
        lastName: profile.lastName || rest.join(" ") || "Candidate",
        currentRole: profile.currentRole || "Senior Product Manager",
        currentCompany: profile.currentCompany || "Highnote",
        skills: profile.skills.length ? profile.skills : ["product strategy", "roadmapping", "user research"],
      });
      setLoading(false);
    }, 1100);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Step 1 · Connect LinkedIn</div>
        <h2 className="text-3xl font-display">LinkedIn is how we know you.</h2>
        <p className="text-stone-500 mt-1">Paste your LinkedIn URL or use the OAuth flow. Required — there's no upload or manual path here.</p>
      </div>
      <Card>
        <Field label="LinkedIn URL" required hint="Format: https://www.linkedin.com/in/your-handle/">
          <Input value={profile.linkedin} onChange={e => update({ linkedin: e.target.value })} placeholder="https://www.linkedin.com/in/your-handle/" />
        </Field>
        {error && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-3">{error}</div>}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={connect} icon={Linkedin} disabled={loading || !profile.linkedin}>{loading ? "Connecting..." : "Verify & continue"}</Button>
          <Button variant="secondary" icon={Linkedin} onClick={() => { update({ linkedin: "https://www.linkedin.com/in/demo-user/" }); setTimeout(connect, 50); }}>Connect with LinkedIn (mock)</Button>
        </div>
      </Card>
      {profile.linkedinConnected && (
        <Card className="border-emerald-300 bg-emerald-50/40">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm"><CheckCircle2 size={16} /> Connected</div>
          <div className="mt-2 text-sm">Found <b>{profile.firstName} {profile.lastName}</b> · {profile.currentRole} {profile.currentCompany && `at ${profile.currentCompany}`}.</div>
          <div className="mt-2 text-xs text-stone-500">You can correct the auto-filled fields on the next step.</div>
        </Card>
      )}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" icon={ChevronLeft} onClick={onBack}>Back</Button>
        <Button onClick={onNext} icon={ArrowRight} disabled={!profile.linkedinConnected}>Continue</Button>
      </div>
    </div>
  );
}

function TalentBasics({ profile, update, onNext, onBack }) {
  const [showRemoteWarning, setShowRemoteWarning] = useState(profile.relocationStatus === "remote_only");
  function setRelocation(v) {
    update({ relocationStatus: v });
    setShowRemoteWarning(v === "remote_only");
  }
  const canContinue = profile.firstName && profile.lastName && profile.email && profile.phone && profile.currentLocation && profile.relocationStatus && profile.yearsExperience >= 0;
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Step 2 · The basics</div>
        <h2 className="text-3xl font-display">Just the essentials.</h2>
      </div>
      <Card className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First name" required><Input value={profile.firstName} onChange={e => update({ firstName: e.target.value })} /></Field>
          <Field label="Last name" required><Input value={profile.lastName} onChange={e => update({ lastName: e.target.value })} /></Field>
          <Field label="Email" required><Input type="email" value={profile.email} onChange={e => update({ email: e.target.value })} /></Field>
          <Field label="Phone" required><Input value={profile.phone} onChange={e => update({ phone: e.target.value })} placeholder="(615) 555-0123" /></Field>
        </div>
        <Field label="Where are you right now?" required hint="City + state (US) or city + country.">
          <Input value={profile.currentLocation} onChange={e => update({ currentLocation: e.target.value })} placeholder="Nashville, TN" />
          <div className="flex flex-wrap gap-2 mt-2">
            {["Nashville, TN", "Memphis, TN", "Knoxville, TN", "Chattanooga, TN"].map(c => (
              <button key={c} type="button" onClick={() => update({ currentLocation: c })}
                className="px-3 py-1 text-xs rounded-full border border-stone-300 bg-white text-stone-700 hover:bg-stone-50">{c}</button>
            ))}
          </div>
        </Field>
        <Field label="Are you willing to relocate to Nashville for the right role?" required>
          <div className="space-y-2">
            {RELOCATION_OPTIONS.map(o => (
              <label key={o.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${profile.relocationStatus === o.value ? "border-yellow-400 bg-yellow-50" : "border-stone-200 hover:border-stone-300"}`}>
                <input type="radio" name="reloc" value={o.value} checked={profile.relocationStatus === o.value} onChange={() => setRelocation(o.value)} className="accent-yellow-400" />
                <span className="text-sm">{o.label}</span>
              </label>
            ))}
          </div>
          {showRemoteWarning && (
            <div className="mt-3 text-xs text-stone-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Heads up: most Lighthouse companies are Nashville-based and many roles are in-person or hybrid. You'll see fewer matches than candidates open to relocation.
            </div>
          )}
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Ideal work mode" required>
            <Select value={profile.workMode} onChange={v => update({ workMode: v })} options={WORK_MODES} />
          </Field>
          <Field label="Years of experience" required>
            <Input type="number" min={0} max={40} value={profile.yearsExperience} onChange={e => update({ yearsExperience: +e.target.value })} />
          </Field>
        </div>
      </Card>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" icon={ChevronLeft} onClick={onBack}>Back</Button>
        <Button onClick={onNext} icon={ArrowRight} disabled={!canContinue}>Continue</Button>
      </div>
    </div>
  );
}

// Drag-to-rank UI for motivations
function TalentMotivations({ profile, update, onNext, onBack }) {
  const items = profile.rankedMotivations;
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  function reorder(from, to) {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update({ rankedMotivations: next });
  }
  function moveUp(i) { if (i > 0) reorder(i, i - 1); }
  function moveDown(i) { if (i < items.length - 1) reorder(i, i + 1); }
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Step 3 · Why startups?</div>
        <h2 className="text-3xl font-display">Rank from most → least true.</h2>
        <p className="text-stone-500 mt-1">Drag to reorder. Top = most true. Honest signal is the point.</p>
      </div>
      <div className="space-y-2">
        {items.map((m, i) => (
          <div key={m}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={e => { e.preventDefault(); setOverIdx(i); }}
            onDragLeave={() => setOverIdx(null)}
            onDrop={() => { if (dragIdx !== null) reorder(dragIdx, i); setDragIdx(null); setOverIdx(null); }}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            className={`flex items-center gap-3 p-3 bg-white border rounded-xl transition select-none ${overIdx === i ? "border-amber-500 shadow-lg" : "border-stone-200"} ${dragIdx === i ? "opacity-50" : ""}`}>
            <span className="text-stone-400 cursor-grab"><GripVertical size={16} /></span>
            <span className="w-6 h-6 rounded-full bg-yellow-100 text-amber-800 flex items-center justify-center font-bold text-xs">{i + 1}</span>
            <div className="flex-1 text-sm">{m}</div>
            <div className="flex gap-1">
              <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1 text-stone-400 hover:text-black disabled:opacity-30"><ChevronUp size={16} /></button>
              <button onClick={() => moveDown(i)} disabled={i === items.length - 1} className="p-1 text-stone-400 hover:text-black disabled:opacity-30"><ChevronDown size={16} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" icon={ChevronLeft} onClick={onBack}>Back</Button>
        <Button onClick={onNext} icon={ArrowRight}>Continue</Button>
      </div>
    </div>
  );
}

function TalentYesNo({ profile, update, onNext, onBack }) {
  const canContinue = profile.hasStartupExperience !== null && profile.hasTechExperience !== null
    && (profile.hasStartupExperience === false || (profile.startupStage && profile.startupSize));
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Step 4 · Experience</div>
        <h2 className="text-3xl font-display">Two quick questions.</h2>
      </div>
      <Card className="space-y-5">
        <Field label="Have you worked at a startup before?" required>
          <div className="flex gap-2">
            <button onClick={() => update({ hasStartupExperience: true })}
              className={`flex-1 p-3 border rounded-lg text-sm font-bold transition ${profile.hasStartupExperience === true ? "bg-yellow-400 border-yellow-400" : "bg-white border-stone-300 hover:border-stone-400"}`}>Yes</button>
            <button onClick={() => update({ hasStartupExperience: false, startupStage: "", startupSize: "" })}
              className={`flex-1 p-3 border rounded-lg text-sm font-bold transition ${profile.hasStartupExperience === false ? "bg-yellow-400 border-yellow-400" : "bg-white border-stone-300 hover:border-stone-400"}`}>No</button>
          </div>
        </Field>
        {profile.hasStartupExperience === true && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="What stage?" required>
              <Select value={profile.startupStage} onChange={v => update({ startupStage: v })}
                options={[{ value: "", label: "Pick one..." }, ...STARTUP_STAGES.map(s => ({ value: s, label: s }))]} />
            </Field>
            <Field label="What size?" required>
              <Select value={profile.startupSize} onChange={v => update({ startupSize: v })}
                options={[{ value: "", label: "Pick one..." }, ...STARTUP_SIZES.map(s => ({ value: s, label: s }))]} />
            </Field>
          </div>
        )}
        <Field label="Have you worked at a tech company before?" required>
          <div className="flex gap-2">
            <button onClick={() => update({ hasTechExperience: true })}
              className={`flex-1 p-3 border rounded-lg text-sm font-bold transition ${profile.hasTechExperience === true ? "bg-yellow-400 border-yellow-400" : "bg-white border-stone-300 hover:border-stone-400"}`}>Yes</button>
            <button onClick={() => update({ hasTechExperience: false })}
              className={`flex-1 p-3 border rounded-lg text-sm font-bold transition ${profile.hasTechExperience === false ? "bg-yellow-400 border-yellow-400" : "bg-white border-stone-300 hover:border-stone-400"}`}>No</button>
          </div>
        </Field>
      </Card>
      <div className="flex justify-between pt-2">
        <Button variant="ghost" icon={ChevronLeft} onClick={onBack}>Back</Button>
        <Button onClick={onNext} icon={Zap} disabled={!canContinue}>Submit application</Button>
      </div>
    </div>
  );
}

function TalentConfirmation({ profile, onExit }) {
  return (
    <div className="space-y-6 text-center">
      <CheckCircle2 size={64} className="text-amber-500 mx-auto" />
      <h2 className="text-5xl font-display">You're on the list <Zap className="inline text-amber-500 fill-amber-500" /></h2>
      <p className="text-stone-700 text-lg max-w-xl mx-auto">
        Zap reviews every application personally. We'll be in touch.
      </p>
      <Card className="text-left max-w-md mx-auto">
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">What's next</div>
        <div className="space-y-2 text-sm">
          {[
            ["Application Review", "Personally reviewed by Zap"],
            ["Vetting Conversation", "Coffee or Zoom"],
            ["Database Live", "We start matching you to roles"],
            ["Warm Intros", "Founders come to you"],
          ].map(([t, d], i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-400 text-black font-bold text-xs flex items-center justify-center flex-shrink-0">{i + 1}</div>
              <div><div className="font-bold">{t}</div><div className="text-xs text-stone-500">{d}</div></div>
            </div>
          ))}
        </div>
      </Card>
      <div className="pt-4">
        <Button variant="secondary" icon={Mail} onClick={() => alert("Mock: subscribed to Zap's Wrap.")}>Subscribe to Zap's Wrap</Button>
      </div>
      <button onClick={onExit} className="text-sm text-stone-500 hover:text-amber-600">Sign out</button>
    </div>
  );
}

// ============================================================
// COMPANY PORTAL (filter-first, NL hidden in Advanced disclosure)
// ============================================================
const DEFAULT_FILTERS = {
  roles: [],
  yoeMin: 0, yoeMax: 25,
  hasTech: "either",
  hasStartup: "either",
  startupStages: [],
  locAvailability: ["in_tn", "willing_to_relocate", "remote_only"],
  currentLocationFilter: "",
  workModes: [],
  motivations: [],
};

function CompanyPortal({ user, logout }) {
  const investor = user.role === "investor" ? INVESTORS.find(i => i.email === user.email) || INVESTORS[0] : null;
  const [tab, setTab] = useState("search");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [nlQuery, setNlQuery] = useState("");
  const [usedAdvanced, setUsedAdvanced] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [activeCandidateId, setActiveCandidateId] = useState(null);
  const [showIntroModal, setShowIntroModal] = useState(null); // candidate id
  const [searches, setSearches] = useState(SAVED_SEARCHES.filter(s => investor ? s.companyId === -investor.id : s.companyId === (user.companyId || 5)));
  const [shortlists, setShortlists] = useState(SHORTLISTS.filter(s => investor ? s.companyId === -investor.id : s.companyId === (user.companyId || 5)));
  const [portcoTag, setPortcoTag] = useState(null); // for investor users
  const [introRequests, setIntroRequests] = useState(() => {
    if (typeof window !== "undefined") {
      const w = window.__lt_intro_requests; if (w) return w;
    }
    return [...INITIAL_INTRO_REQUESTS];
  });
  // Persist intro requests across role switches via window global (no localStorage per spec)
  useEffect(() => { if (typeof window !== "undefined") window.__lt_intro_requests = introRequests; }, [introRequests]);

  function runFilterSearch(currentFilters = filters) {
    setLoading(true); setUsedAdvanced(false);
    setTimeout(() => {
      setResults(filterCandidates(currentFilters, CANDIDATES));
      setSearched(true); setLoading(false);
    }, 600);
  }
  function runAdvancedSearch() {
    setLoading(true); setUsedAdvanced(true);
    setTimeout(() => {
      const interp = interpretNL(nlQuery);
      const merged = {
        ...filters,
        roles: interp.role ? [interp.role] : filters.roles,
        yoeMin: interp.yoeMin, yoeMax: interp.yoeMax,
        hasTech: interp.hasTech, hasStartup: interp.hasStartup,
      };
      setFilters(merged);
      setResults(filterCandidates(merged, CANDIDATES));
      setSearched(true); setLoading(false);
    }, 1200);
  }

  function saveCurrentSearch() {
    const name = prompt("Name this saved search:", "");
    if (!name) return;
    const record = {
      id: Date.now(),
      companyId: investor ? -investor.id : (user.companyId || 5),
      investorPortco: portcoTag,
      name,
      kind: usedAdvanced ? "advanced" : "filter",
      query: usedAdvanced ? nlQuery : undefined,
      filters: usedAdvanced ? undefined : filters,
      createdAt: new Date().toISOString().slice(0, 10),
      results: results.length,
    };
    setSearches([...searches, record]);
    alert(`Saved "${name}".`);
  }

  function submitIntroRequest(candidateId, reason) {
    const req = {
      id: Date.now(),
      candidateId,
      requesterEmail: user.email,
      requesterName: investor ? investor.name : "Company User",
      portcoTag: investor ? portcoTag : null,
      reason,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    setIntroRequests([...introRequests, req]);
    setShowIntroModal(null);
    alert("Intro request submitted. Zap will review and reach out.");
  }

  function loadSearch(s) {
    if (s.kind === "filter") { setFilters({ ...DEFAULT_FILTERS, ...s.filters }); setNlQuery(""); setUsedAdvanced(false); }
    else { setNlQuery(s.query || ""); setUsedAdvanced(true); }
    setTab("search"); setTimeout(() => s.kind === "filter" ? runFilterSearch({ ...DEFAULT_FILTERS, ...s.filters }) : runAdvancedSearch(), 50);
  }

  const activeCandidate = activeCandidateId ? CANDIDATES.find(c => c.id === activeCandidateId) : null;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-6">
            <button onClick={() => setTab("search")} className="flex items-center gap-2 hover:text-amber-600">
              <Zap className="text-amber-500 fill-amber-500" size={18} />
              <span className="font-display tracking-tight font-bold">Lighthouse</span>
              <span className="text-stone-500 text-xs">{investor ? "Investor" : "Hire"}</span>
            </button>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { k: "search", l: "Search", icon: Search },
                { k: "searches", l: "My Searches", icon: BookOpenCheck },
                { k: "shortlists", l: "Shortlists", icon: Star },
                { k: "resources", l: "Resources", icon: FileText },
              ].map(it => (
                <button key={it.k} onClick={() => { setTab(it.k); setActiveCandidateId(null); }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1.5 ${tab === it.k ? "bg-stone-100 text-amber-600" : "text-stone-500 hover:text-black"}`}>
                  <it.icon size={14} />{it.l}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {investor && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-300 rounded-full pl-3 pr-1 py-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800">Searching for</span>
                <select value={portcoTag || ""} onChange={e => setPortcoTag(e.target.value || null)}
                  className="bg-transparent text-xs font-bold focus:outline-none pr-2 py-1">
                  <option value="">Direct</option>
                  {investor.portcos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>Exit</Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeCandidate ? (
          <CandidateProfile candidate={activeCandidate} onBack={() => setActiveCandidateId(null)}
            onRequestIntro={() => setShowIntroModal(activeCandidate.id)} />
        ) : (
          <>
            {tab === "search" && (
              <CompanySearch
                filters={filters} setFilters={setFilters}
                nlQuery={nlQuery} setNlQuery={setNlQuery}
                usedAdvanced={usedAdvanced}
                searched={searched} loading={loading} results={results}
                onRunFilter={() => runFilterSearch()}
                onRunAdvanced={runAdvancedSearch}
                onOpenCandidate={(id) => setActiveCandidateId(id)}
                onRequestIntro={(id) => setShowIntroModal(id)}
                onSaveSearch={saveCurrentSearch}
                onAddToShortlist={(slId, cid) => setShortlists(arr => arr.map(s => s.id === slId ? { ...s, candidateIds: [...new Set([...s.candidateIds, cid])] } : s))}
                shortlists={shortlists}
              />
            )}
            {tab === "searches" && <MySearchesView searches={searches} setSearches={setSearches} onRunSearch={loadSearch} onNewSearch={() => setTab("search")} />}
            {tab === "shortlists" && <ShortlistsView shortlists={shortlists} setShortlists={setShortlists} onOpenCandidate={(id) => setActiveCandidateId(id)} investorAware={!!investor} />}
            {tab === "resources" && <ResourcesView />}
          </>
        )}
      </div>
      {showIntroModal && (
        <IntroRequestModal
          candidate={CANDIDATES.find(c => c.id === showIntroModal)}
          requesterName={investor ? investor.name : "Company"}
          onClose={() => setShowIntroModal(null)}
          onSubmit={(reason) => submitIntroRequest(showIntroModal, reason)}
        />
      )}
    </div>
  );
}

function CompanySearch({ filters, setFilters, nlQuery, setNlQuery, usedAdvanced, searched, loading, results,
  onRunFilter, onRunAdvanced, onOpenCandidate, onRequestIntro, onSaveSearch, onAddToShortlist, shortlists }) {
  const [advOpen, setAdvOpen] = useState(false); // collapsed by default per spec
  const [sortBy, setSortBy] = useState("yoe"); // yoe | recent | name

  const sorted = useMemo(() => {
    const arr = [...results];
    if (sortBy === "yoe") arr.sort((a, b) => b.yearsExperience - a.yearsExperience);
    else if (sortBy === "recent") arr.sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));
    else arr.sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));
    return arr;
  }, [results, sortBy]);

  return (
    <div className="space-y-4">
      {!searched && (
        <div className="text-center pt-6 pb-2">
          <h1 className="text-5xl md:text-6xl font-display tracking-tight">Find your next hire <Zap className="inline text-amber-500 fill-amber-500" /></h1>
          <p className="text-stone-500 text-lg mt-3">Search the Lighthouse Talent Network by what you need.</p>
        </div>
      )}

      {/* Always-visible four-filter row */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Field label="Role type">
            <MultiSelectChips options={ROLE_TYPES} selected={filters.roles} onChange={v => setFilters({ ...filters, roles: v })} />
          </Field>
          <Field label="Years of experience" hint={`${filters.yoeMin}–${filters.yoeMax} yrs`}>
            <RangeSlider min={0} max={25} value={[filters.yoeMin, filters.yoeMax]} onChange={v => setFilters({ ...filters, yoeMin: v[0], yoeMax: v[1] })} format={v => `${v}y`} />
          </Field>
          <Field label="Has worked at a tech company?">
            <div className="flex gap-2">
              {[["yes", "Yes"], ["no", "No"], ["either", "Either"]].map(([v, l]) => (
                <button key={v} onClick={() => setFilters({ ...filters, hasTech: v })}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border transition ${filters.hasTech === v ? "bg-yellow-400 border-yellow-400 text-black font-bold" : "bg-white border-stone-300 text-stone-700 hover:border-stone-400"}`}>{l}</button>
              ))}
            </div>
          </Field>
          <Field label="Has worked at a startup?">
            <div className="flex gap-2">
              {[["yes", "Yes"], ["no", "No"], ["either", "Either"]].map(([v, l]) => (
                <button key={v} onClick={() => setFilters({ ...filters, hasStartup: v })}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border transition ${filters.hasStartup === v ? "bg-yellow-400 border-yellow-400 text-black font-bold" : "bg-white border-stone-300 text-stone-700 hover:border-stone-400"}`}>{l}</button>
              ))}
            </div>
            {filters.hasStartup === "yes" && (
              <div className="mt-2">
                <MultiSelectChips options={STARTUP_STAGES} selected={filters.startupStages} onChange={v => setFilters({ ...filters, startupStages: v })} />
              </div>
            )}
          </Field>
        </div>
        <div className="flex justify-end">
          <Button size="lg" icon={Search} onClick={onRunFilter} disabled={loading}>{loading && !usedAdvanced ? "Searching..." : "Search ⚡"}</Button>
        </div>
      </Card>

      {/* Advanced Search disclosure, collapsed by default */}
      <Card>
        <button onClick={() => setAdvOpen(!advOpen)} className="w-full text-left flex items-center justify-between">
          <div className="flex items-center gap-2">
            {advOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="font-bold text-sm">Advanced Search · Natural Language</span>
            <Tag color="purple" size="sm">Power user</Tag>
          </div>
          <div className="text-xs text-stone-500">Optional — describe what you're looking for in plain English</div>
        </button>
        {advOpen && (
          <div className="mt-4 space-y-3">
            <Textarea rows={4} value={nlQuery} onChange={e => setNlQuery(e.target.value)}
              placeholder="We're looking for an early-stage operator who can run our day-to-day, set up vendor relationships, manage our 12-person team..." />
            <div className="flex justify-between items-center">
              <div className="text-xs text-stone-500">{nlQuery.trim().split(/\s+/).filter(Boolean).length} words · recommended 25–50</div>
              <Button onClick={onRunAdvanced} icon={Sparkles} disabled={!nlQuery.trim() || loading}>Search with description ⚡</Button>
            </div>
          </div>
        )}
      </Card>

      {/* AI interpretation card (advanced only) */}
      {searched && usedAdvanced && (
        <Card className="border-yellow-300 bg-yellow-50/40">
          <div className="text-xs uppercase tracking-wider text-amber-700 font-bold mb-2 flex items-center gap-2"><Sparkles size={12} /> Here's what we heard</div>
          <div className="grid sm:grid-cols-4 gap-2 text-sm">
            <div><span className="text-stone-500 text-xs">Role type</span><div><Tag color="yellow">{filters.roles[0] || "Any"}</Tag></div></div>
            <div><span className="text-stone-500 text-xs">Years</span><div><Tag color="blue">{filters.yoeMin}–{filters.yoeMax}</Tag></div></div>
            <div><span className="text-stone-500 text-xs">Tech experience</span><div><Tag>{filters.hasTech}</Tag></div></div>
            <div><span className="text-stone-500 text-xs">Startup experience</span><div><Tag>{filters.hasStartup}</Tag></div></div>
          </div>
          <div className="text-xs text-stone-500 mt-2">We only map natural language to these four filter dimensions. Skill specifics, archetypes, and seniority levels aren't part of the MVP filter set.</div>
        </Card>
      )}

      {/* Side filters + results */}
      {searched && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-4">
          <FilterSidebar filters={filters} setFilters={setFilters} onApply={onRunFilter} />
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-stone-500"><span className="font-bold text-amber-600">{sorted.length}</span> candidates</div>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" icon={Save} onClick={onSaveSearch}>Save this search ⚡</Button>
                <Select value={sortBy} onChange={setSortBy} className="text-xs py-1 w-auto"
                  options={[{ value: "yoe", label: "Sort: Experience" }, { value: "recent", label: "Sort: Recently joined" }, { value: "name", label: "Sort: A–Z" }]} />
              </div>
            </div>
            {sorted.length === 0 && <Card className="text-center py-10 text-sm text-stone-500">No matches. Try loosening filters.</Card>}
            {sorted.map(c => (
              <CandidateCardMVP key={c.id} candidate={c} onOpen={() => onOpenCandidate(c.id)}
                onRequestIntro={() => onRequestIntro(c.id)}
                onAddToShortlist={(slId) => onAddToShortlist(slId, c.id)}
                shortlists={shortlists} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSidebar({ filters, setFilters, onApply }) {
  return (
    <div className="space-y-3 lg:sticky lg:top-20 self-start">
      <Card className="space-y-3">
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold flex items-center gap-2"><Filter size={12} /> Filters</div>
        <Field label="Location availability" hint="Default: all three">
          <div className="space-y-1.5">
            {[["in_tn", "In Tennessee"], ["willing_to_relocate", "Willing to relocate"], ["remote_only", "Remote only"]].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={filters.locAvailability.includes(v)}
                  onChange={e => setFilters({ ...filters, locAvailability: e.target.checked ? [...filters.locAvailability, v] : filters.locAvailability.filter(x => x !== v) })}
                  className="accent-yellow-400" />
                {l}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Current location (free text)">
          <Input placeholder="e.g. Nashville, Austin" value={filters.currentLocationFilter} onChange={e => setFilters({ ...filters, currentLocationFilter: e.target.value })} />
        </Field>
        <Field label="Work mode">
          <MultiSelectChips options={WORK_MODES} selected={filters.workModes} onChange={v => setFilters({ ...filters, workModes: v })} />
        </Field>
        <Field label="Specific motivation">
          <div className="space-y-1">
            {MOTIVATIONS.map(m => (
              <label key={m} className="flex items-start gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={filters.motivations.includes(m)}
                  onChange={e => setFilters({ ...filters, motivations: e.target.checked ? [...filters.motivations, m] : filters.motivations.filter(x => x !== m) })}
                  className="accent-yellow-400 mt-0.5" />
                <span>{MOTIVATION_SHORT[m] || m.slice(0, 30)}</span>
              </label>
            ))}
          </div>
        </Field>
        <Button size="sm" className="w-full" onClick={onApply} icon={RefreshCw}>Apply filters</Button>
      </Card>
    </div>
  );
}

function CandidateCardMVP({ candidate, onOpen, onRequestIntro, onAddToShortlist, shortlists }) {
  const [showShort, setShowShort] = useState(false);
  const locDisplay = candidate.relocationStatus === "in_tn" ? candidate.currentLocation
    : candidate.relocationStatus === "willing_to_relocate" ? `${candidate.currentLocation} — willing to relocate`
    : `${candidate.currentLocation} — remote only`;
  return (
    <Card className="hover:border-amber-400 transition">
      <div className="flex gap-4">
        <Avatar candidate={candidate} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between flex-wrap gap-1">
            <div className="min-w-0">
              <div className="font-bold text-lg truncate">{candidate.firstName} {candidate.lastName}</div>
              <div className="text-sm text-stone-500 truncate">{candidate.currentRole}{candidate.currentCompany && ` · ${candidate.currentCompany}`}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {candidate.hasTechExperience && <Tag color="blue" size="sm">Tech ✓</Tag>}
              {candidate.hasStartupExperience && <Tag color="yellow" size="sm">Startup ✓{candidate.startupStage ? ` · ${candidate.startupStage}` : ""}</Tag>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-500">
            <span><Clock size={11} className="inline mr-0.5" /> {candidate.yearsExperience} yrs</span>
            <span><MapPin size={11} className="inline mr-0.5" /> {locDisplay}</span>
            <span><Briefcase size={11} className="inline mr-0.5" /> {candidate.workMode}</span>
          </div>
          {candidate.topMotivation && (
            <div className="text-xs text-stone-700 mt-2 italic">Top motivation: <span className="font-bold">{MOTIVATION_SHORT[candidate.topMotivation]}</span></div>
          )}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Button size="sm" icon={Coffee} onClick={onRequestIntro}>Request Intro</Button>
            <div className="relative">
              <Button size="sm" variant="secondary" icon={Star} onClick={() => setShowShort(!showShort)}>Save</Button>
              {showShort && (
                <div className="absolute top-9 left-0 w-56 bg-white border border-stone-300 rounded-lg p-2 z-30 shadow-xl">
                  {shortlists.length === 0 && <div className="text-xs text-stone-500 p-2">No shortlists yet.</div>}
                  {shortlists.map(s => (
                    <button key={s.id} onClick={() => { onAddToShortlist(s.id); setShowShort(false); }}
                      className="w-full text-left text-xs p-2 hover:bg-stone-50 rounded">
                      {s.name} <span className="text-stone-500">({s.candidateIds.length})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button size="sm" variant="ghost" icon={Eye} onClick={onOpen}>View profile</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CandidateProfile({ candidate, onBack, onRequestIntro }) {
  const locDisplay = candidate.relocationStatus === "in_tn" ? candidate.currentLocation
    : candidate.relocationStatus === "willing_to_relocate" ? `${candidate.currentLocation} — willing to relocate to Nashville`
    : `${candidate.currentLocation} — remote only`;
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={onBack}>Back to results</Button>
      <Card className="!p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar candidate={candidate} size={80} />
          <div className="flex-1 min-w-0">
            <div className="text-3xl font-display">{candidate.firstName} {candidate.lastName}</div>
            <div className="text-stone-500">{candidate.currentRole}{candidate.currentCompany && ` · ${candidate.currentCompany}`}</div>
            <div className="flex gap-3 mt-2 text-xs text-stone-500 flex-wrap">
              <span><Clock size={11} className="inline mr-0.5" /> {candidate.yearsExperience} yrs</span>
              <span><MapPin size={11} className="inline mr-0.5" /> {locDisplay}</span>
              <span><Briefcase size={11} className="inline mr-0.5" /> {candidate.workMode}</span>
            </div>
            {candidate.linkedin && <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="text-xs text-amber-600 hover:underline mt-2 inline-flex items-center gap-1"><Linkedin size={11} /> LinkedIn profile</a>}
          </div>
          <Button icon={Coffee} onClick={onRequestIntro}>Request warm intro through Zap</Button>
        </div>
      </Card>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Background</div>
            <div className="font-bold mb-2 text-sm">Work history</div>
            <div className="space-y-2 mb-4">
              {candidate.workHistory.map((w, i) => (
                <div key={i} className="border-l-2 border-stone-200 pl-3">
                  <div className="font-semibold text-sm">{w.title}</div>
                  <div className="text-stone-500 text-xs">{w.company} · {w.startYear}–{w.endYear}</div>
                </div>
              ))}
            </div>
            <div className="font-bold mb-2 text-sm">Education</div>
            <div className="space-y-1">
              {candidate.education.map((e, i) => (
                <div key={i} className="text-stone-700 text-sm"><span className="font-semibold">{e.school}</span> · {e.degree} · {e.year}</div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Why startups — full ranking</div>
            <div className="space-y-2">
              {candidate.rankedMotivations.map((m, i) => (
                <div key={m} className="flex items-center gap-3 p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm">
                  <span className="w-6 h-6 rounded-full bg-yellow-100 text-amber-800 flex items-center justify-center font-bold text-xs flex-shrink-0">{i + 1}</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Experience</div>
            <div className="space-y-2 text-sm">
              <div><span className="text-stone-500 text-xs">Has worked at a startup?</span> <span className="font-bold">{candidate.hasStartupExperience ? "Yes" : "No"}</span>{candidate.hasStartupExperience && candidate.startupStage && ` · ${candidate.startupStage}, ${candidate.startupSize}`}</div>
              <div><span className="text-stone-500 text-xs">Has worked at a tech company?</span> <span className="font-bold">{candidate.hasTechExperience ? "Yes" : "No"}</span></div>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">What they're looking for</div>
            <div className="space-y-2 text-sm">
              <div><span className="text-stone-500 text-xs">Work mode</span><div><Tag>{candidate.workMode}</Tag></div></div>
              <div><span className="text-stone-500 text-xs">Years of exp</span><div className="font-bold">{candidate.yearsExperience}</div></div>
              <div><span className="text-stone-500 text-xs">Location</span><div className="text-stone-700">{locDisplay}</div></div>
            </div>
          </Card>
          <Card className="border-amber-300">
            <div className="text-xs uppercase tracking-wider text-amber-700 font-bold mb-2 flex items-center gap-1"><Shield size={12} /> Zap's notes</div>
            <div className="text-sm text-stone-700">Zap met {candidate.firstName} in person on {candidate.dateApplied}. Vetting notes available on request.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function IntroRequestModal({ candidate, requesterName, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-lg w-full">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="font-display text-2xl">Request a warm intro</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-black"><X size={18} /></button>
        </div>
        <p className="text-sm text-stone-500 mb-4">Zap reviews every intro request personally. She'll either send the connection herself or get back to you with context.</p>
        <Field label="Recipient (read-only)"><Input value="Zap (Lighthouse)" readOnly className="bg-stone-50" /></Field>
        <div className="h-3" />
        <Field label="Candidate"><Input value={`${candidate?.firstName} ${candidate?.lastName}`} readOnly className="bg-stone-50" /></Field>
        <div className="h-3" />
        <Field label="Why you want this intro" required hint="One paragraph. What role, what context, why this person specifically.">
          <Textarea rows={5} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="We're hiring a Head of Operations and Maya's profile matches everything we need..." />
        </Field>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon={Send} onClick={() => reason.trim() && onSubmit(reason.trim())} disabled={!reason.trim()}>Submit request</Button>
        </div>
      </div>
    </div>
  );
}

function MySearchesView({ searches, setSearches, onRunSearch, onNewSearch }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-3xl">My Searches</h2>
          <div className="text-xs text-stone-500 mt-1">{searches.length} saved · re-runs fresh on open</div>
        </div>
        <Button icon={Search} onClick={onNewSearch}>Run a new search</Button>
      </div>
      <Card padded={false}>
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3 hidden sm:table-cell">For</th>
              <th className="text-left p-3 hidden md:table-cell">Saved</th>
              <th className="text-left p-3">Results</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {searches.map(s => (
              <tr key={s.id} className="border-b border-stone-200 hover:bg-stone-50 cursor-pointer" onClick={() => onRunSearch(s)}>
                <td className="p-3 font-bold">{s.name}</td>
                <td className="p-3"><Tag size="sm" color={s.kind === "advanced" ? "purple" : "yellow"}>{s.kind === "advanced" ? "Advanced" : "Filter"}</Tag></td>
                <td className="p-3 text-xs text-stone-500 hidden sm:table-cell">{s.investorPortco || "Direct"}</td>
                <td className="p-3 text-xs text-stone-500 hidden md:table-cell">{s.createdAt}</td>
                <td className="p-3 text-sm tabular-nums">{s.results || "—"}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" icon={Search} onClick={(e) => { e.stopPropagation(); onRunSearch(s); }}>Run</Button>
                </td>
              </tr>
            ))}
            {searches.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-stone-500 text-sm">No saved searches yet. Run a search and click "Save this search ⚡" to start.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ShortlistsView({ shortlists, setShortlists, onOpenCandidate, investorAware }) {
  const [active, setActive] = useState(null);
  if (active) {
    const sl = shortlists.find(s => s.id === active);
    if (!sl) return null;
    return (
      <div className="space-y-4">
        <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={() => setActive(null)}>Back to shortlists</Button>
        <h2 className="font-display text-3xl">{sl.name}</h2>
        <div className="space-y-2">
          {sl.candidateIds.map(id => {
            const c = CANDIDATES.find(c => c.id === id);
            if (!c) return null;
            return (
              <Card key={id} onClick={() => onOpenCandidate(id)}>
                <div className="flex items-center gap-3">
                  <Avatar candidate={c} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{c.firstName} {c.lastName}</div>
                    <div className="text-xs text-stone-500 truncate">{c.currentRole} · {c.currentLocation}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl">My Shortlists</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shortlists.map(s => (
          <Card key={s.id} onClick={() => setActive(s.id)}>
            <div className="font-bold text-lg">{s.name}</div>
            {investorAware && s.investorPortco && <div className="text-xs text-amber-600 font-bold mt-0.5">For {s.investorPortco}</div>}
            <div className="text-xs text-stone-500 mt-1">{s.candidateIds.length} candidates · {s.createdAt}</div>
          </Card>
        ))}
        {shortlists.length === 0 && <Card className="text-center py-8"><Star className="text-stone-400 mx-auto mb-2" /><div className="text-sm">No shortlists yet</div></Card>}
      </div>
    </div>
  );
}

// ============================================================
// RESOURCES (categorized landing → category grid → detail)
// ============================================================
function ResourcesView() {
  const [category, setCategory] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const categories = useMemo(() => {
    const grouped = {};
    RESOURCES.forEach(r => { if (!grouped[r.category]) grouped[r.category] = []; grouped[r.category].push(r); });
    return Object.entries(grouped).map(([name, items]) => ({ name, items }));
  }, []);
  const CATEGORY_META = {
    "Hiring Playbooks": { icon: "📋", desc: "How to hire well." },
    "Role Profiles": { icon: "🎯", desc: "Per-role deep dives." },
    "Market Data": { icon: "📊", desc: "Nashville comp benchmarks." },
    "Templates": { icon: "📁", desc: "JDs, offer letters, rubrics." },
    "Lighthouse Insights": { icon: "⚡", desc: "Zap's perspective." },
  };
  const active = activeId ? RESOURCES.find(r => r.id === activeId) : null;

  if (active) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <button onClick={() => setActiveId(null)} className="text-sm text-stone-500 hover:text-black">← Back to {active.category}</button>
        <Card className="!p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">
            <Tag color="yellow">{active.category}</Tag>
            <span>·</span>
            <span>Updated {active.updatedAt}</span>
            <span>·</span>
            <span>{active.views} views</span>
          </div>
          <h1 className="font-display text-4xl mb-3">{active.title}</h1>
          <p className="text-lg text-stone-700 mb-6">{active.desc}</p>
          {active.type === "download" ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center">
              <FileText size={36} className="text-amber-500 mx-auto mb-3" />
              <div className="font-bold mb-1">{active.title}</div>
              <div className="text-sm text-stone-500 mb-4">{active.fileType}</div>
              <Button icon={Save} onClick={() => alert(`Downloaded ${active.title} (mock)`)}>Download</Button>
            </div>
          ) : (
            <div className="prose prose-stone max-w-none text-stone-700 space-y-4 text-base leading-relaxed">
              <p>This is placeholder body content for "{active.title}". Real content will be uploaded by Lighthouse staff — likely from existing Founders Only podcast transcripts, Zap's Wrap archives, and talks.</p>
              <h3 className="font-display text-2xl text-black mt-6">Key takeaways</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>The framing matters more than the framework.</li>
                <li>Sequencing the first 10 hires is the single highest-leverage decision a founder makes.</li>
                <li>Most "culture fit" problems are actually role-clarity problems.</li>
              </ul>
              <p>For v2, the structure, taxonomy, and surface area are the deliverables. The content layer fills in over time, possibly as a Capstone project deliverable.</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (category) {
    const items = categories.find(c => c.name === category)?.items || [];
    return (
      <div className="space-y-4">
        <button onClick={() => setCategory(null)} className="text-sm text-stone-500 hover:text-black">← All categories</button>
        <h2 className="font-display text-3xl">{category}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(r => (
            <Card key={r.id} onClick={() => setActiveId(r.id)} className="hover:border-amber-400">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${r.type === "download" ? "bg-violet-100 text-violet-700" : "bg-yellow-100 text-amber-700"}`}>
                  {r.type === "download" ? <FileText size={18} /> : <BookOpenCheck size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm leading-snug">{r.title}</div>
                  <div className="text-xs text-stone-500 mt-1 line-clamp-2">{r.desc}</div>
                  <div className="text-[10px] text-stone-500 mt-2">{r.views} views · {r.updatedAt}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl">Resources <Zap className="inline text-amber-500 fill-amber-500" size={24} /></h2>
        <p className="text-sm text-stone-500 mt-1">Hiring playbooks, role profiles, market data, and templates from the Lighthouse network.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map(c => (
          <Card key={c.name} onClick={() => setCategory(c.name)} className="hover:border-amber-400 !p-6">
            <div className="text-4xl mb-3 font-display">{CATEGORY_META[c.name]?.icon || "📚"}</div>
            <div className="font-display text-xl">{c.name}</div>
            <div className="text-sm text-stone-500 mt-1">{CATEGORY_META[c.name]?.desc}</div>
            <div className="text-xs text-stone-700 mt-3 font-bold">{c.items.length} {c.items[0]?.type === "download" ? "downloads" : "articles"}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN PORTAL — simplified per MVP spec
// ============================================================
function AdminPortal({ user, logout }) {
  const [view, setView] = useState("database");
  const [activeCandidateId, setActiveCandidateId] = useState(null);
  const [activeIntroId, setActiveIntroId] = useState(null);
  const [candidates, setCandidates] = useState(CANDIDATES);
  const [introRequests, setIntroRequests] = useState(() => (typeof window !== "undefined" && window.__lt_intro_requests) || []);
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined" && window.__lt_intro_requests) setIntroRequests([...window.__lt_intro_requests]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  function updateCandidate(id, patch) { setCandidates(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c)); }
  function updateIntro(id, patch) {
    const next = introRequests.map(r => r.id === id ? { ...r, ...patch } : r);
    setIntroRequests(next);
    if (typeof window !== "undefined") window.__lt_intro_requests = next;
  }

  return (
    <div className="min-h-screen bg-white text-black flex">
      <aside className="w-60 border-r border-stone-200 p-4 space-y-1 hidden md:block">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="text-amber-500 fill-amber-500" size={18} />
          <span className="font-black">Lighthouse</span>
          <span className="text-stone-500 text-xs">Admin</span>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-amber-600 font-bold pt-2 pb-1 px-2">Talent</div>
        {[
          { k: "database", l: "Database", icon: Database },
          { k: "pending", l: "Pending Applications", icon: KanbanSquare },
          { k: "intros", l: "Intro Requests", icon: Coffee, count: introRequests.filter(r => r.status === "pending").length },
          { k: "settings", l: "Settings", icon: Settings },
        ].map(it => (
          <button key={it.k} onClick={() => { setView(it.k); setActiveCandidateId(null); setActiveIntroId(null); }}
            className={`w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition ${view === it.k ? "bg-yellow-100 text-amber-700 font-bold" : "text-stone-700 hover:bg-stone-100"}`}>
            <it.icon size={14} /> {it.l}
            {typeof it.count === "number" && it.count > 0 && <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500 text-white">{it.count}</span>}
          </button>
        ))}
      </aside>
      <main className="flex-1 min-w-0">
        <div className="border-b border-stone-200 px-6 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-amber-600 font-bold">🎯 Talent</span>
            <span className="text-stone-500 mx-2">/</span>
            <span className="font-semibold">{{ database: "Database", pending: "Pending Applications", intros: "Intro Requests", settings: "Settings", profile: "Candidate", intro: "Intro Request" }[view]}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-stone-500">{user.name || "Admin"}</div>
            <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>Exit</Button>
          </div>
        </div>
        <div className="p-6">
          {view === "database" && !activeCandidateId && <AdminDatabase candidates={candidates} onOpen={(id) => { setActiveCandidateId(id); setView("profile"); }} />}
          {view === "pending" && !activeCandidateId && <AdminPending candidates={candidates} onOpen={(id) => { setActiveCandidateId(id); setView("profile"); }} updateCandidate={updateCandidate} />}
          {view === "intros" && !activeIntroId && <AdminIntroRequests requests={introRequests} onOpen={(id) => { setActiveIntroId(id); setView("intro"); }} user={user} />}
          {view === "intro" && activeIntroId && (
            <AdminIntroDetail intro={introRequests.find(r => r.id === activeIntroId)} onBack={() => { setActiveIntroId(null); setView("intros"); }}
              onApprove={() => updateIntro(activeIntroId, { status: "introd", actionedAt: new Date().toISOString() })}
              onDecline={(note) => updateIntro(activeIntroId, { status: "declined", declineNote: note, actionedAt: new Date().toISOString() })}
              user={user} />
          )}
          {view === "profile" && activeCandidateId && (
            <AdminCandidateProfile candidate={candidates.find(c => c.id === activeCandidateId)} updateCandidate={updateCandidate} onBack={() => { setActiveCandidateId(null); setView("database"); }} />
          )}
          {view === "settings" && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}

function AdminDatabase({ candidates, onOpen }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    return candidates.filter(c => {
      if (filterStatus !== "all" && c.vettingStatus !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        return (c.firstName + " " + c.lastName + " " + c.currentRole + " " + c.currentLocation).toLowerCase().includes(s);
      }
      return true;
    });
  }, [candidates, filterStatus, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl">Talent Database</h2>
          <div className="text-xs text-stone-500">{candidates.length} candidates total</div>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="text-xs w-48" />
          <Select value={filterStatus} onChange={setFilterStatus} className="text-xs w-auto"
            options={[{ value: "all", label: "All statuses" }, { value: "Active", label: "Active" }, { value: "New", label: "New" }, { value: "Reviewing", label: "Reviewing" }, { value: "Vetting Call Scheduled", label: "Vetting" }, { value: "Hidden", label: "Hidden" }, { value: "Declined", label: "Declined" }]} />
        </div>
      </div>
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Current role</th>
                <th className="text-left p-3">Yrs</th>
                <th className="text-left p-3">Location</th>
                <th className="text-left p-3">Top motivation</th>
                <th className="text-center p-3">Tech</th>
                <th className="text-center p-3">Startup</th>
                <th className="text-left p-3">Status</th>
                <th className="text-center p-3">Intros</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(c => (
                <tr key={c.id} onClick={() => onOpen(c.id)} className="border-b border-stone-200 hover:bg-stone-50 cursor-pointer">
                  <td className="p-3"><div className="flex items-center gap-2"><Avatar candidate={c} size={28} /><div className="font-bold">{c.firstName} {c.lastName}</div></div></td>
                  <td className="p-3 text-stone-700 max-w-[200px] truncate">{c.currentRole}</td>
                  <td className="p-3">{c.yearsExperience}</td>
                  <td className="p-3 text-xs text-stone-500">{c.currentLocation} <span className="text-[10px] block">{RELOCATION_LABELS[c.relocationStatus]}</span></td>
                  <td className="p-3 text-xs text-stone-700">{MOTIVATION_SHORT[c.topMotivation] || "—"}</td>
                  <td className="p-3 text-center">{c.hasTechExperience ? "✓" : "—"}</td>
                  <td className="p-3 text-center">{c.hasStartupExperience ? "✓" : "—"}</td>
                  <td className="p-3"><Tag color={c.vettingStatus === "Active" ? "green" : c.vettingStatus === "Declined" ? "red" : "yellow"} size="sm">{c.vettingStatus}</Tag></td>
                  <td className="p-3 text-center tabular-nums">{c.introRequests || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && <div className="p-3 text-center text-xs text-stone-500">Showing 100 of {filtered.length}. Refine filters to see more.</div>}
      </Card>
    </div>
  );
}

function AdminPending({ candidates, onOpen, updateCandidate }) {
  const cols = ["New", "Reviewing", "Vetting Call Scheduled", "Active", "Declined"];
  const labels = { "New": "New", "Reviewing": "Reviewing", "Vetting Call Scheduled": "Vetting Call", "Active": "Approved", "Declined": "Declined" };
  const [drag, setDrag] = useState(null);
  return (
    <div>
      <h2 className="font-display text-3xl mb-3">Pending Applications</h2>
      <div className="text-xs text-stone-500 mb-4">Drag candidates through the pipeline. Click a card for the full admin profile.</div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {cols.map(col => {
          const list = candidates.filter(c => c.vettingStatus === col);
          return (
            <div key={col}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (drag) { updateCandidate(drag, { vettingStatus: col }); setDrag(null); } }}
              className="bg-stone-50 border border-stone-200 rounded-xl p-3 min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-wider font-bold">{labels[col]}</div>
                <Tag>{list.length}</Tag>
              </div>
              <div className="space-y-2">
                {list.slice(0, 20).map(c => (
                  <div key={c.id} draggable onDragStart={() => setDrag(c.id)} onClick={() => onOpen(c.id)}
                    className="bg-white border border-stone-200 rounded-lg p-2 cursor-pointer hover:border-amber-400">
                    <div className="flex items-center gap-2"><Avatar candidate={c} size={26} />
                      <div className="min-w-0 flex-1"><div className="font-bold text-xs truncate">{c.firstName} {c.lastName}</div><div className="text-[10px] text-stone-500 truncate">{c.currentRole}</div></div>
                    </div>
                  </div>
                ))}
                {list.length > 20 && <div className="text-center text-[10px] text-stone-500">+{list.length - 20} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminCandidateProfile({ candidate, updateCandidate, onBack }) {
  if (!candidate) return null;
  const [notes, setNotes] = useState(candidate.adminNotes || "");
  const [vetting, setVetting] = useState(candidate.vettingStatus);
  function save() { updateCandidate(candidate.id, { adminNotes: notes, vettingStatus: vetting }); alert("Saved."); }
  const locDisplay = `${candidate.currentLocation} (${RELOCATION_LABELS[candidate.relocationStatus]})`;
  return (
    <div className="space-y-4">
      <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={onBack}>Back</Button>
      <Card>
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar candidate={candidate} size={64} />
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-display">{candidate.firstName} {candidate.lastName}</div>
            <div className="text-stone-500 text-sm">{candidate.currentRole} · {candidate.currentCompany}</div>
            <div className="text-xs text-stone-500 mt-1 flex flex-wrap gap-3">
              <span><Mail size={11} className="inline mr-0.5" /> {candidate.email}</span>
              <span><Phone size={11} className="inline mr-0.5" /> {candidate.phone}</span>
              <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="hover:text-amber-600"><Linkedin size={11} className="inline mr-0.5" /> LinkedIn</a>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Submission</div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-stone-500">Location</div><div>{locDisplay}</div></div>
              <div><div className="text-xs text-stone-500">Work mode</div><div>{candidate.workMode}</div></div>
              <div><div className="text-xs text-stone-500">Years of experience</div><div>{candidate.yearsExperience}</div></div>
              <div><div className="text-xs text-stone-500">Has tech experience</div><div>{candidate.hasTechExperience ? "Yes" : "No"}</div></div>
              <div><div className="text-xs text-stone-500">Has startup experience</div><div>{candidate.hasStartupExperience ? `Yes · ${candidate.startupStage}, ${candidate.startupSize}` : "No"}</div></div>
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Ranked motivations</div>
            <div className="space-y-1.5">
              {candidate.rankedMotivations.map((m, i) => (
                <div key={m} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-yellow-100 text-amber-800 flex items-center justify-center font-bold text-xs">{i + 1}</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="border-violet-300">
            <div className="text-xs uppercase tracking-wider text-violet-700 font-bold mb-2"><Shield size={12} className="inline mr-1" /> Zap's private notes</div>
            <Textarea rows={5} value={notes} onChange={e => setNotes(e.target.value)} className="text-xs" placeholder="Vetting notes, growth areas, red flags..." />
            <div className="text-[10px] text-stone-500 mt-1">Admin-only. Never shown to companies.</div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Vetting status</div>
            <Select value={vetting} onChange={setVetting} options={["New", "Reviewing", "Vetting Call Scheduled", "Active", "Hidden", "Declined"]} />
          </Card>
          <Button className="w-full" onClick={save} icon={Save}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

function AdminIntroRequests({ requests, onOpen, user }) {
  const [filterStatus, setFilterStatus] = useState("pending");
  const filtered = requests.filter(r => filterStatus === "all" ? true : r.status === filterStatus);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl">Intro Requests</h2>
          <div className="text-xs text-stone-500">{requests.filter(r => r.status === "pending").length} pending</div>
        </div>
        <Select value={filterStatus} onChange={setFilterStatus} className="text-xs w-auto"
          options={[{ value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "introd", label: "Intro'd" }, { value: "declined", label: "Declined" }]} />
      </div>
      {filtered.length === 0 && <Card className="text-center py-12 text-sm text-stone-500">No intro requests {filterStatus !== "all" && `with status: ${filterStatus}`}.</Card>}
      <Card padded={false}>
        {filtered.map(r => {
          const c = CANDIDATES.find(cn => cn.id === r.candidateId);
          if (!c) return null;
          return (
            <div key={r.id} onClick={() => onOpen(r.id)}
              className="border-b border-stone-200 hover:bg-stone-50 cursor-pointer p-4 flex items-start gap-3">
              <Avatar candidate={c} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold">{c.firstName} {c.lastName}</div>
                  <Tag size="sm">←</Tag>
                  <div className="text-sm">{r.requesterName}{r.portcoTag && <span className="text-amber-600"> · {r.portcoTag}</span>}</div>
                  <Tag color={r.status === "pending" ? "yellow" : r.status === "introd" ? "green" : "default"}>{r.status}</Tag>
                </div>
                <div className="text-xs text-stone-500 mt-0.5">{new Date(r.submittedAt).toLocaleString()}</div>
                <div className="text-sm text-stone-700 mt-2 line-clamp-2 italic">"{r.reason}"</div>
              </div>
              <ChevronRight size={16} className="text-stone-400 flex-shrink-0 mt-2" />
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function AdminIntroDetail({ intro, onBack, onApprove, onDecline, user }) {
  const c = CANDIDATES.find(cn => cn.id === intro.candidateId);
  const [emailBody, setEmailBody] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [showDecline, setShowDecline] = useState(false);
  // Approver gating — for MVP, only zap@lt.house can approve. (Settings flag to expand later.)
  const approverFlag = (typeof window !== "undefined" && window.__lt_approver_role) || "zap_only";
  const isApprover = user.email === "zap@lt.house" || (approverFlag === "zap_and_mike" && user.email === "mike@lt.house");

  function openEmailDraft() {
    const draft =
`Hi {Company Contact} and ${c.firstName},

I'd love to connect you two.

${intro.requesterName}${intro.portcoTag ? ` (looking on behalf of ${intro.portcoTag})` : ""} is looking for someone with this profile. Here's the context they shared:

"${intro.reason}"

${c.firstName}, I think you'd be a great fit because [Zap fills this in].

I'll let you both take it from here — let me know how it goes!

— Zap`;
    setEmailBody(draft);
    setShowEmail(true);
  }
  function sendIntro() {
    onApprove();
    setShowEmail(false);
    alert("Intro email queued (mock-send).");
  }
  function confirmDecline() {
    onDecline(declineNote);
    setShowDecline(false);
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={onBack}>Back to intro requests</Button>
      <Card>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Tag color={intro.status === "pending" ? "yellow" : intro.status === "introd" ? "green" : "default"}>{intro.status}</Tag>
          <span className="text-xs text-stone-500">Submitted {new Date(intro.submittedAt).toLocaleString()}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-1">Candidate</div>
            <div className="flex items-center gap-2">
              <Avatar candidate={c} size={40} />
              <div><div className="font-bold">{c.firstName} {c.lastName}</div><div className="text-xs text-stone-500">{c.currentRole}</div></div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-1">Requester</div>
            <div className="font-bold">{intro.requesterName}</div>
            {intro.portcoTag && <div className="text-xs text-amber-600">Searching for {intro.portcoTag}</div>}
            <div className="text-xs text-stone-500">{intro.requesterEmail}</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-stone-200">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Why they want this intro</div>
          <div className="bg-yellow-50 border-l-2 border-amber-500 rounded-r p-3 text-sm italic">"{intro.reason}"</div>
        </div>
        {intro.status === "pending" && (
          <div className="mt-4 pt-4 border-t border-stone-200 flex flex-wrap gap-2 items-center">
            {isApprover ? (
              <>
                <Button icon={Send} onClick={openEmailDraft}>Approve & Send Intro</Button>
                <Button variant="ghost" icon={X} onClick={() => setShowDecline(true)}>Decline</Button>
              </>
            ) : (
              <div className="text-sm text-stone-500 italic">Approver permission required (Zap only by default — toggle in Settings).</div>
            )}
          </div>
        )}
        {intro.status === "declined" && intro.declineNote && (
          <div className="mt-4 pt-4 border-t border-stone-200 text-sm">
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-1">Decline note (internal)</div>
            <div className="bg-stone-50 border border-stone-200 rounded p-2">{intro.declineNote}</div>
          </div>
        )}
      </Card>

      {showEmail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowEmail(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <h2 className="font-display text-2xl mb-3">Send intro email</h2>
            <Field label="From" hint="Editable in production. For MVP, all sent from this address.">
              <Input value="zap@lt.house" readOnly className="bg-stone-50" />
            </Field>
            <div className="h-3" />
            <Field label="Email body" required>
              <Textarea rows={14} value={emailBody} onChange={e => setEmailBody(e.target.value)} className="font-mono text-xs" />
            </Field>
            <div className="text-xs text-stone-500 mt-2">Replace bracketed sections before sending. Mock-send only in MVP — no real email will fire.</div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowEmail(false)}>Cancel</Button>
              <Button icon={Send} onClick={sendIntro}>Send (mock)</Button>
            </div>
          </div>
        </div>
      )}

      {showDecline && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDecline(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <h2 className="font-display text-2xl mb-3">Decline intro request</h2>
            <Field label="Internal reason (optional, admin-only)" hint="Not shared with the requester.">
              <Textarea rows={4} value={declineNote} onChange={e => setDeclineNote(e.target.value)} placeholder="Wrong stage fit; candidate's not actively looking; etc." />
            </Field>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowDecline(false)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDecline}>Confirm decline</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminSettings() {
  const [outboundEmailMode, setOutboundEmailMode] = useState("disabled");
  const [approverRole, setApproverRole] = useState("zap_only");
  useEffect(() => { if (typeof window !== "undefined") window.__lt_approver_role = approverRole; }, [approverRole]);
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="font-display text-3xl">Settings</h2>
      <Card className={outboundEmailMode === "enabled" ? "border-emerald-300 bg-emerald-50/40" : "border-rose-300 bg-rose-50/40"}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-2"
              style={{ color: outboundEmailMode === "enabled" ? "#047857" : "#be123c" }}>
              <Mail size={12} /> Outbound emails master toggle
            </div>
            <div className="text-sm text-stone-700">
              {outboundEmailMode === "disabled"
                ? "All outbound emails DISABLED. MVP launches in this state. Intro emails queue but don't fire."
                : "All outbound emails ENABLED. Every queued and going-forward send will fire."}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            {["disabled", "enabled"].map(m => (
              <button key={m} onClick={() => setOutboundEmailMode(m)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${outboundEmailMode === m ? "bg-black text-yellow-300 border-black" : "bg-white border-stone-300 hover:border-stone-400"}`}>
                {m === "disabled" ? "DISABLED" : "ENABLED"}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Intro request approver role</div>
        <Select value={approverRole} onChange={setApproverRole}
          options={[{ value: "zap_only", label: "Zap only (MVP default)" }, { value: "zap_and_mike", label: "Zap + Mike" }]} />
        <div className="text-xs text-stone-500 mt-1.5">Default is Zap only. Expand to add Mike when ready.</div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">User management</div>
        <div className="space-y-1.5 text-sm">
          {[{ email: "zap@lt.house", role: "Admin (approver)" }, { email: "mike@lt.house", role: "Admin" }].map(u => (
            <div key={u.email} className="flex items-center justify-between p-2 bg-stone-50 border border-stone-200 rounded-lg">
              <span className="font-mono text-xs">{u.email}</span>
              <Tag size="sm">{u.role}</Tag>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
