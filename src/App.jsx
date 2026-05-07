// Lighthouse Talent Platform — single-file React prototype
// Three flows: Candidate Intake, Company Hiring Portal, Admin View
// Mock data: 154 real candidates from the Airtable export, 18 companies, 10 saved searches.
// All AI/scoring is mocked in pure functions for easy backend swap later.
import React, { useState, useMemo, useEffect, useReducer, useRef } from "react";
import {
  Zap, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Search, Filter, Upload, Linkedin,
  CheckCircle2, Circle, Sparkles, X, ArrowRight, ArrowLeft, MapPin, Briefcase, GraduationCap,
  Mail, Phone, Star, Heart, Users, Map, Grid3x3, List, Clock, DollarSign, Building2, Calendar,
  PenTool, Shield, Settings, BarChart3, BookOpenCheck, FileText, MessageSquare, Send, Trash2,
  Plus, Minus, Eye, EyeOff, ArrowUpDown, Bell, LogOut, Home, Database, KanbanSquare,
  AlertCircle, Coffee, Save, Edit3, Music, Compass, Award, ChevronsRight, UserPlus, RefreshCw,
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Cell,
} from "recharts";

// ============================================================
// DATA IMPORTS — 154 candidates, 18 companies, 93 intros, 24 jobs, 203 applications
// ============================================================
import { DATA_BUNDLE, INTROS, JOBS, APPLICATIONS, RESOURCES, INVESTORS, PORTFOLIOS, PROJECTS, MESSAGE_THREADS, INTERESTED_COMPANIES, DEMO_TALENT_CANDIDATE_ID } from './data.js';
import { AuthProvider, useAuth, LoginScreen } from './auth.jsx';

// ============================================================
// CONSTANTS
// ============================================================
const ARCHETYPE_STATEMENTS = [
  "I'm energized when there's no clear playbook to follow.",
  "I love taking something messy and making it run smoothly.",
  "I prefer figuring it out as I go over following established procedures.",
  "I'd rather refine and improve an existing system than invent a new one.",
  "The first 90 days of a problem is when I do my best work.",
  "I find joy in the long arc of making something gradually better.",
  "I get restless when things are too stable for too long.",
  "I'm at my best when I have a clear process to optimize.",
  "I'd rather go very deep on one skill than be decent at many.",
  "I get bored if I do the same thing for too long.",
  "I take pride in being the best in the room at one specific thing.",
  "I'm energized by switching contexts throughout my day.",
  "I'd rather have a reputation for excellence in one domain than versatility across many.",
  "The phrase “jack of all trades” is a compliment to me, not an insult.",
  "I prefer being the person people call for one specific kind of problem.",
  "My best work happens when I'm wearing several hats at once.",
];
const COMPANY_STATEMENTS_A = [
  "This person needs to be hands-on, not just managing.",
  "We need someone who can hit the ground running with no ramp-up time.",
  "This person will spend most of their time on strategy vs. execution.",
  "We need someone with experience at our specific company stage.",
  "Domain expertise matters more than general operator skills for this role.",
  "This person needs to be excellent at managing up to founders.",
  "This is a public-facing role that requires strong external communication.",
  "Cross-functional leadership matters more than depth in any one function.",
  "We need someone who can build a team under them within 12 months.",
  "The ability to operate with no manager is critical for this role.",
  "This role requires significant relationship-building externally.",
  "We need someone who has shipped/launched something at scale before.",
];
const COMPANY_STATEMENTS_B = [
  "We move fast and accept that things will break sometimes.",
  "We're highly collaborative and most decisions are made together.",
  "We prefer async communication over meetings whenever possible.",
  "We expect long hours and intensity from everyone.",
  "We're flat — there's almost no hierarchy in how decisions get made.",
  "We're highly in-person; remote isn't really our culture.",
  "Direct, blunt feedback is the norm here, not the exception.",
  "We have strong processes for almost everything.",
  "Speed of decision-making matters more than perfection.",
  "We value tenure and depth over rapid turnover and growth.",
  "Our team is very social — we hang out outside of work.",
  "Independence and self-direction is what we look for in everyone.",
];

const ROLE_TYPES = ["Engineering", "Product", "Design", "Operations", "Marketing", "Sales", "Founding Team", "Other"];
const STAGE_OPTIONS = ["Pre-seed", "Seed", "Series A", "Series B+", "Open to anything"];
const WORK_MODES = ["In-person Nashville", "Hybrid", "Remote", "Open"];
const TIMING_OPTIONS = ["Right now", "Next 3 months", "Next 6 months", "Just keeping eyes open"];

const ARCHETYPES = {
  Pioneer: { icon: "⚡", label: "The Pioneer", short: "Specialist + Builder", desc: "Deep expertise meets ambiguity tolerance. Often early technical hires, founding engineers, founding designers. Thrives where the path doesn't exist yet.", color: "#FFD60A" },
  Founder: { icon: "🚀", label: "The Founder", short: "Generalist + Builder", desc: "Comfortable in chaos, wears every hat, makes decisions with incomplete information. Classic startup CEO / first 5 employees energy.", color: "#FF8E3C" },
  Craftsperson: { icon: "🔬", label: "The Craftsperson", short: "Specialist + Operator", desc: "Masters their domain and refines it relentlessly. The person you want when scaling something already working. Senior ICs, principal engineers, lead designers.", color: "#7DD3FC" },
  Athlete: { icon: "🎯", label: "The Athlete", short: "Generalist + Operator", desc: "Chief of Staff energy. Glue person. Connects functions and gets things done across the org. Heads of Ops, BizOps, generalist seniors.", color: "#A78BFA" },
  Balanced: { icon: "⚖️", label: "Balanced", short: "Center of the map", desc: "Sits near the middle of the map. Comfortable with builder and operator modes alike, neither pure specialist nor pure generalist.", color: "#94A3B8" },
};

const CULTURE_ARCHETYPES = {
  "Hot Kitchen": { icon: "🔥", desc: "Chaos with team energy, high-intensity startup culture", color: "#FF6B6B" },
  "Solo Mission": { icon: "🏎️", desc: "Sprint independently, ship fast, async-first", color: "#FFD60A" },
  "Studio": { icon: "🏛️", desc: "Careful craft, together, design-led", color: "#A78BFA" },
  "Library": { icon: "📚", desc: "Deep work, your own pace, distributed-first", color: "#7DD3FC" },
};

// ============================================================
// SCORING / AI MOCK FUNCTIONS (pure, swappable later)
// ============================================================
function computeArchetypeFromScores(scores) {
  const builder = (scores[0] + scores[2] + scores[4] + scores[6]) / 4;
  const operator = (scores[1] + scores[3] + scores[5] + scores[7]) / 4;
  const spec = (scores[8] + scores[10] + scores[12] + scores[14]) / 4;
  const gen = (scores[9] + scores[11] + scores[13] + scores[15]) / 4;
  const y = builder - operator;
  const x = gen - spec;
  let quad;
  if (Math.abs(x) <= 1 && Math.abs(y) <= 1) quad = "Balanced";
  else if (x > 0 && y > 0) quad = "Founder";
  else if (x <= 0 && y > 0) quad = "Pioneer";
  else if (x > 0 && y <= 0) quad = "Athlete";
  else quad = "Craftsperson";
  return { quad, x: +x.toFixed(2), y: +y.toFixed(2), builder: +builder.toFixed(1), operator: +operator.toFixed(1), spec: +spec.toFixed(1), gen: +gen.toFixed(1) };
}

function computeCultureArchetype(scores) {
  // X axis (Move Fast ↔ Methodical): higher is methodical
  // Y axis (High-touch ↔ Async): higher is async
  const fast = (scores[0] + scores[3] + scores[8]) / 3;
  const methodical = (scores[7] + scores[9]) / 2;
  const highTouch = (scores[1] + scores[5] + scores[10]) / 3;
  const async_ = (scores[2] + scores[4] + scores[11]) / 3;
  const x = methodical - fast;
  const y = async_ - highTouch;
  let quad;
  if (x <= 0 && y <= 0) quad = "Hot Kitchen";
  else if (x <= 0 && y > 0) quad = "Solo Mission";
  else if (x > 0 && y <= 0) quad = "Studio";
  else quad = "Library";
  return { quad, x: +x.toFixed(2), y: +y.toFixed(2) };
}

// AI interpret: a free-text query into structured fields
const ROLE_KEYWORDS = {
  "Engineering": ["engineer", "developer", "swe", "full-stack", "fullstack", "backend", "frontend", "infra", "platform", "data engineer", "ml ", "ai ", "devops", "sre"],
  "Product": ["product manager", "pm", "product lead", "product owner", "roadmap"],
  "Design": ["designer", "design", "ux", "ui", "brand", "figma"],
  "Operations": ["ops", "operations", "chief of staff", "head of ops", "people ops", "biz ops", "bizops", "revops", "people operations", "hiring", "vendor"],
  "Marketing": ["marketing", "growth", "demand gen", "brand", "content", "seo", "comms"],
  "Sales": ["sales", "ae ", "account exec", "sdr", "bd", "business development", "partnerships"],
  "Founding Team": ["founder", "co-founder", "founding"],
};

const SENIORITY_KEYS = [
  { key: /\b(vp|head of|chief|principal|director|founding|staff|lead)\b/i, label: "Senior", years: [8, 18] },
  { key: /\b(senior|sr\.?)\b/i, label: "Senior", years: [6, 12] },
  { key: /\b(manager|mgr)\b/i, label: "Mid-Senior", years: [5, 10] },
  { key: /\b(junior|jr\.?|entry|associate)\b/i, label: "Junior", years: [0, 3] },
];

const STAGE_KEYS = [
  { key: /\bpre[\s-]?seed\b/i, stage: "Pre-seed" },
  { key: /\bseries\s+a\b/i, stage: "Series A" },
  { key: /\bseries\s+b\b/i, stage: "Series B+" },
  { key: /\bseed\b/i, stage: "Seed" },
];

function aiInterpret(query) {
  const q = (query || "").toLowerCase();
  let role = "Operations";
  let bestHits = 0;
  for (const [r, kws] of Object.entries(ROLE_KEYWORDS)) {
    const hits = kws.filter(k => q.includes(k)).length;
    if (hits > bestHits) { bestHits = hits; role = r; }
  }
  let seniority = "Mid"; let years = [3, 8];
  for (const s of SENIORITY_KEYS) {
    if (s.key.test(query)) { seniority = s.label; years = s.years; break; }
  }
  let stage = null;
  for (const s of STAGE_KEYS) {
    if (s.key.test(query)) { stage = s.stage; break; }
  }
  // Skill extraction: pluck known skill tokens
  const skillPool = ["operations", "vendor management", "team leadership", "cross-functional", "ml", "ai", "infrastructure", "scaling", "hiring", "growth", "content", "brand", "react", "node", "python", "go", "rust", "design systems", "ux", "research", "biz ops", "revops", "people ops", "GTM", "PLG", "brand design", "demand gen"];
  const skills = skillPool.filter(s => q.includes(s.toLowerCase())).slice(0, 5);
  if (skills.length === 0) {
    // Fallback default skills by role
    const fallback = {
      Engineering: ["full-stack", "APIs", "scaling"],
      Product: ["product strategy", "roadmapping", "user research"],
      Design: ["design systems", "Figma", "brand"],
      Operations: ["operations", "vendor management", "team leadership", "cross-functional"],
      Marketing: ["growth", "content", "brand"],
      Sales: ["enterprise sales", "pipeline", "closing"],
      "Founding Team": ["0-to-1", "fundraising", "GTM"],
      Other: ["leadership", "operations"],
    };
    skills.push(...(fallback[role] || ["leadership"]));
  }
  // Archetype lean
  const archetypeLean =
    /\b(chief of staff|cross-functional|glue|generalist|biz ops|revops|head of ops|chief of staff)\b/i.test(query) ? "Athlete" :
    /\b(founding|0[-\s]?to[-\s]?1|founder|co-founder|early)\b/i.test(query) ? "Founder" :
    /\b(principal|staff|senior ic|deep|specialist)\b/i.test(query) ? "Craftsperson" :
    /\b(builder|early technical|founding engineer|founding designer)\b/i.test(query) ? "Pioneer" :
    null;
  // Location
  let location = "Open";
  if (/nashville/i.test(query)) location = "Nashville";
  else if (/remote/i.test(query)) location = "Remote";
  // Other signals
  const signals = [];
  if (/scal(e|ing)/i.test(query)) signals.push("Scaling experience preferred");
  if (/team\s+of\s+\d+/i.test(query)) signals.push("Team leadership");
  if (/founder[\s-]?led/i.test(query)) signals.push("Comfortable transitioning founder-led");
  if (/series\s+[ab]/i.test(query)) signals.push("Stage-specific experience");

  return { role, seniority, years, stage, skills, archetypeLean, location, signals };
}

function suggestJDs(interp, jdTemplates) {
  // Find JDs matching role and stage
  const matches = jdTemplates
    .map(jd => {
      let score = 0;
      if (jd.title.toLowerCase().includes(interp.role.toLowerCase()) ||
          jd.tags.some(t => interp.skills.some(s => t.includes(s.toLowerCase()) || s.toLowerCase().includes(t)))) score += 3;
      if (interp.stage && jd.stage === interp.stage) score += 2;
      // Title proximity
      const roleTitle = { Engineering: "engineer", Product: "product", Design: "design", Operations: "ops", Marketing: "marketing", Sales: "sales", "Founding Team": "founding" }[interp.role] || "";
      if (jd.title.toLowerCase().includes(roleTitle)) score += 2;
      return { jd, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return matches.map(m => m.jd);
}

function tokenize(s) {
  return (s || "").toLowerCase().match(/\b[\w-]{2,}\b/g) || [];
}

function semanticMatch(candidate, queryTokens) {
  if (queryTokens.length === 0) return 0.5;
  const text = [
    candidate.currentRole, candidate.roleSummary, candidate.whyStartup,
    candidate.skills.join(" "), candidate.primaryRole,
    candidate.workHistory.map(w => w.title + " " + w.company).join(" "),
  ].join(" ").toLowerCase();
  const tokens = tokenize(text);
  const tokenSet = new Set(tokens);
  let hits = 0;
  for (const q of queryTokens) {
    if (tokenSet.has(q)) hits += 1;
    else {
      // Partial — check substring in role/skills
      if (text.includes(q)) hits += 0.5;
    }
  }
  return Math.min(1, hits / Math.max(3, queryTokens.length * 0.7));
}

function filterMatch(candidate, filters) {
  let score = 1;
  // Years experience
  if (filters.yoeMin !== undefined && candidate.yearsExperience < filters.yoeMin) score *= 0.7;
  if (filters.yoeMax !== undefined && candidate.yearsExperience > filters.yoeMax) score *= 0.85;
  // Stage
  if (filters.stages && filters.stages.length > 0) {
    const hit = candidate.stagePreference.some(s => filters.stages.includes(s)) ||
                candidate.stagePreference.includes("Open to anything");
    if (!hit) score *= 0.6;
  }
  // Location
  if (filters.locations && filters.locations.length > 0) {
    const hit = filters.locations.some(loc => candidate.location.toLowerCase().includes(loc.toLowerCase()));
    if (!hit) score *= 0.7;
  }
  // Skills
  if (filters.skills && filters.skills.length > 0) {
    const cs = candidate.skills.map(s => s.toLowerCase());
    const overlap = filters.skills.filter(s => cs.includes(s.toLowerCase())).length;
    score *= 0.5 + 0.5 * (overlap / Math.max(1, filters.skills.length));
  }
  // Vetted-only (Active)
  if (filters.vettedOnly && candidate.vettingStatus !== "Active") score *= 0.3;
  // Archetype filter
  if (filters.archetypes && filters.archetypes.length > 0) {
    if (!candidate.archetype) score *= 0.4;
    else if (!filters.archetypes.includes(candidate.archetype)) score *= 0.4;
  }
  if (filters.assessmentOnly && !candidate.hasAssessment) score *= 0.2;
  return Math.max(0, Math.min(1, score));
}

function recencyBonus(candidate) {
  const last = new Date(candidate.lastActivity);
  const now = new Date(2026, 4, 4);
  const days = (now - last) / (1000 * 60 * 60 * 24);
  if (days < 7) return 1;
  if (days < 30) return 0.7;
  return 0.3;
}

function archetypeBonus(candidate, lean) {
  if (!lean || !candidate.archetype) return 0;
  if (candidate.archetype === lean) return 10;
  // Adjacent quadrants share an axis
  const adjacent = {
    Pioneer: ["Founder", "Craftsperson"],
    Founder: ["Pioneer", "Athlete"],
    Athlete: ["Founder", "Craftsperson"],
    Craftsperson: ["Pioneer", "Athlete"],
  };
  if ((adjacent[candidate.archetype] || []).includes(lean)) return 4;
  return 0;
}

function rankCandidates(candidates, query, filters, interp) {
  const queryTokens = [...new Set([...tokenize(query), ...(interp?.skills || []).flatMap(s => tokenize(s))])];
  const lean = interp?.archetypeLean;
  return candidates
    .filter(c => !c.declined && c.vettingStatus !== "Hidden")
    .map(c => {
      const sm = semanticMatch(c, queryTokens);
      const fm = filterMatch(c, filters);
      const rb = recencyBonus(c);
      const baseScore = (sm * 60) + (fm * 30) + (rb * 10);
      const arBonus = archetypeBonus(c, lean);
      const finalScore = Math.min(100, Math.round(baseScore + arBonus));
      return { candidate: c, score: finalScore, breakdown: { semantic: Math.round(sm * 100), filter: Math.round(fm * 100), recency: Math.round(rb * 100), archetype: arBonus } };
    })
    .sort((a, b) => b.score - a.score);
}

function explainMatch(candidate, interp) {
  const bits = [];
  if (candidate.archetype && interp.archetypeLean === candidate.archetype) {
    bits.push(`${candidate.firstName}'s ${candidate.archetype} archetype aligns with the ${interp.archetypeLean.toLowerCase()} profile you described`);
  }
  const skillOverlap = candidate.skills.filter(s => interp.skills.some(is => s.toLowerCase().includes(is.toLowerCase()) || is.toLowerCase().includes(s.toLowerCase()))).slice(0, 2);
  if (skillOverlap.length > 0) bits.push(`brings ${candidate.yearsExperience} years across ${skillOverlap.join(", ")}`);
  if (candidate.startupExperience) bits.push("has prior startup experience");
  if (candidate.location.includes("Nashville") && interp.location === "Nashville") bits.push("is local in Nashville");
  if (bits.length === 0) bits.push(`${candidate.yearsExperience} years in ${candidate.primaryRole}, vetted by Zap`);
  return bits.slice(0, 2).join(". ").charAt(0).toUpperCase() + bits.slice(0, 2).join(". ").slice(1) + ".";
}

// ============================================================
// AVATAR — deterministic colored initials
// ============================================================
const AVATAR_COLORS = [
  ["#FACC15", "#0A0A0A"], ["#FB923C", "#0A0A0A"], ["#38BDF8", "#0A0A0A"], ["#A78BFA", "#fff"],
  ["#F87171", "#fff"], ["#34D399", "#0A0A0A"], ["#FBBF24", "#0A0A0A"], ["#F472B6", "#fff"],
];
function Avatar({ candidate, size = 40 }) {
  const initials = ((candidate.firstName?.[0] || "") + (candidate.lastName?.[0] || "")).toUpperCase();
  const [bg, fg] = AVATAR_COLORS[(candidate.photoSeed || 0) % AVATAR_COLORS.length];
  return (
    <div style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.38 }}
         className="rounded-full flex items-center justify-center font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

// ============================================================
// UI PRIMITIVES — Lighthouse brand
// ============================================================
function Tag({ children, color = "default", size = "sm" }) {
  const palette = {
    default: "bg-stone-100 border border-stone-200 text-stone-900 border-stone-400",
    yellow: "bg-yellow-100 text-amber-800 border-yellow-300",
    blue: "bg-sky-100 text-sky-800 border-sky-300",
    purple: "bg-violet-100 text-violet-800 border-violet-300",
    green: "bg-emerald-100 text-emerald-800 border-emerald-300",
    red: "bg-rose-100 text-rose-800 border-rose-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
    light: "bg-stone-100 text-stone-700 border-stone-300",
  };
  const sz = size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return <span className={`inline-flex items-center gap-1 rounded-full border ${palette[color] || palette.default} ${sz} font-medium whitespace-nowrap`}>{children}</span>;
}

function Button({ children, onClick, variant = "primary", size = "md", disabled, className = "", icon: Icon, type = "button" }) {
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  const variants = {
    primary: "bg-yellow-400 text-black hover:bg-yellow-300 font-bold",
    secondary: "bg-stone-100 text-black hover:bg-stone-200 border border-stone-300 font-semibold",
    ghost: "bg-transparent text-stone-700 hover:bg-stone-100 font-semibold",
    outline: "bg-transparent text-black border border-stone-400 hover:bg-stone-100 font-semibold",
    danger: "bg-rose-600 text-white hover:bg-rose-500 font-semibold",
    skip: "bg-stone-100 text-black hover:bg-stone-200 border border-stone-400 font-semibold",
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

function ProgressBar({ value, max = 100, color = "bg-yellow-400" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center gap-1 mb-1">
      {steps.map((s, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-yellow-400" : i === current ? "bg-yellow-400/60" : "bg-stone-100"}`} />
      ))}
    </div>
  );
}

function Slider({ value, onChange, min = 0, max = 10, step = 1 }) {
  return (
    <div className="space-y-2">
      <div className="text-center">
        <div className="text-7xl font-black text-amber-500 tabular-nums">{value}</div>
        <div className="text-xs text-stone-500 mt-1">
          {value === 0 ? "Strongly Disagree" : value === 5 ? "Neutral" : value === 10 ? "Strongly Agree" : value < 5 ? "Disagree" : "Agree"}
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-full accent-yellow-400 cursor-pointer h-2" />
      <div className="flex justify-between text-[10px] text-stone-400 px-1">
        <span>0</span><span>2</span><span>4</span><span>5</span><span>6</span><span>8</span><span>10</span>
      </div>
    </div>
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

function Input(props) {
  return <input {...props}
    className={`w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder:text-stone-400 focus:outline-none focus:border-black ${props.className || ""}`} />;
}

function Textarea(props) {
  return <textarea {...props}
    className={`w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder:text-stone-400 focus:outline-none focus:border-black resize-y ${props.className || ""}`} />;
}

function Select({ value, onChange, options, className = "" }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black ${className}`}>
      {options.map(o => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
    </select>
  );
}

function MultiSelectChips({ options, selected, onChange }) {
  function toggle(o) {
    if (selected.includes(o)) onChange(selected.filter(s => s !== o));
    else onChange([...selected, o]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} onClick={() => toggle(o)} type="button"
          className={`px-3 py-1.5 text-xs rounded-full border transition ${selected.includes(o)
            ? "bg-yellow-400 border-yellow-400 text-black font-bold"
            : "bg-white border border-stone-300 text-stone-700 hover:border-stone-400"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

function RangeSlider({ min, max, value, onChange, step = 1, format = (v) => v }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-stone-500">
        <span>{format(value[0])}</span><span>{format(value[1])}</span>
      </div>
      <div className="relative h-1.5 bg-stone-100 rounded-full">
        <div className="absolute h-full bg-yellow-400 rounded-full"
             style={{ left: `${((value[0] - min) / (max - min)) * 100}%`, right: `${100 - ((value[1] - min) / (max - min)) * 100}%` }} />
      </div>
      <div className="flex gap-2">
        <input type="range" min={min} max={max} step={step} value={value[0]}
               onChange={e => onChange([Math.min(+e.target.value, value[1]), value[1]])}
               className="w-full accent-yellow-400" />
        <input type="range" min={min} max={max} step={step} value={value[1]}
               onChange={e => onChange([value[0], Math.max(+e.target.value, value[0])])}
               className="w-full accent-yellow-400" />
      </div>
    </div>
  );
}

function ArchetypeIcon({ quad, size = "sm" }) {
  const a = ARCHETYPES[quad] || ARCHETYPES.Balanced;
  const sz = size === "lg" ? "text-lg" : "text-sm";
  return <span className={sz}>{a.icon}</span>;
}

function ArchetypeBadge({ quad, size = "sm" }) {
  if (!quad) return null;
  const a = ARCHETYPES[quad] || ARCHETYPES.Balanced;
  return (
    <span style={{ background: a.color + "22", borderColor: a.color + "55", color: a.color }}
          className={`inline-flex items-center gap-1 rounded-full border ${size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"} font-semibold whitespace-nowrap`}>
      <span>{a.icon}</span>
      <span>{a.label.replace("The ", "")}</span>
    </span>
  );
}

// ============================================================
// ARCHETYPE PLOT (XY scatter) using recharts
// ============================================================
function ArchetypePlot({ candidates, highlight, height = 320, showHeatmap = true, onClickPoint }) {
  // Build an aggregated heatmap-ish background by grouping into bins
  const points = candidates.filter(c => c.archetypeXY).map(c => ({
    x: c.archetypeXY.x, y: c.archetypeXY.y, name: `${c.firstName} ${c.lastName}`,
    archetype: c.archetype, id: c.id, candidate: c,
  }));
  const highlightPoint = highlight && highlight.archetypeXY ? [{ x: highlight.archetypeXY.x, y: highlight.archetypeXY.y, name: `${highlight.firstName} ${highlight.lastName}`, archetype: highlight.archetype }] : [];

  return (
    <div className="relative" style={{ height }}>
      {/* Quadrant labels overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-2 grid-rows-2 text-[10px] font-bold tracking-wider uppercase">
        <div className="flex items-start justify-start p-2 text-amber-500/90">{"⚡ Pioneer"}</div>
        <div className="flex items-start justify-end p-2 text-orange-600">{"🚀 Founder"}</div>
        <div className="flex items-end justify-start p-2 text-sky-700/90">{"🔬 Craftsperson"}</div>
        <div className="flex items-end justify-end p-2 text-violet-700">{"🎯 Athlete"}</div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 16, bottom: 24, left: 24 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" domain={[-10, 10]} tickCount={5} stroke="#475569" tick={{ fontSize: 10 }}
                 label={{ value: "Specialist ←→ Generalist", position: "bottom", style: { fill: "#94a3b8", fontSize: 11, fontWeight: 600 } }} />
          <YAxis type="number" dataKey="y" domain={[-10, 10]} tickCount={5} stroke="#475569" tick={{ fontSize: 10 }}
                 label={{ value: "Operator ←→ Builder", angle: -90, position: "insideLeft", style: { fill: "#94a3b8", fontSize: 11, fontWeight: 600 } }} />
          <ReferenceLine x={0} stroke="#334155" />
          <ReferenceLine y={0} stroke="#334155" />
          <RTooltip cursor={false} content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null;
            const p = payload[0].payload;
            return <div className="bg-white border border-stone-300 rounded-lg p-2 text-xs shadow-xl">
              <div className="font-bold text-black">{p.name}</div>
              {p.archetype && <div className="text-stone-500 mt-0.5">{ARCHETYPES[p.archetype]?.icon} {p.archetype}</div>}
            </div>;
          }} />
          <Scatter data={points} fill="#475569">
            {points.map((p, i) => (
              <Cell key={i} fill={ARCHETYPES[p.archetype]?.color || "#94a3b8"} fillOpacity={0.55} />
            ))}
          </Scatter>
          {highlightPoint.length > 0 &&
            <Scatter data={highlightPoint} fill="#FFD60A" shape="star" />
          }
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// LANDING — simple mode picker between candidate / company / admin views
// (For prototype only — in production the routes are separate URLs)
// ============================================================
function LandingPage({ onPick }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      {/* Bg ambient */}
      <div className="absolute inset-0 bg-white" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-yellow-100/60 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-50 blur-3xl" />

      <div className="relative z-10 max-w-5xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="text-amber-500 fill-yellow-400" size={36} />
            <div className="text-3xl font-black tracking-tight font-display">Lighthouse</div>
            <span className="text-stone-500 text-sm">Talent</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-4 font-display">
            A curated network of <span className="text-amber-500">startup talent</span> for Nashville's best companies.
          </h1>
          <p className="text-stone-500 text-lg max-w-2xl mx-auto">
            Vetted by Zap. Searched in plain English. Hired without the noise.
          </p>
          <div className="text-stone-500 text-xs mt-3">Prototype · Pick a side to explore.</div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { key: "candidate", label: "I'm a candidate", desc: "Apply to be in Zap's database.", icon: UserPlus, hint: "Optional deep dive at the end" },
            { key: "company", label: "I'm hiring", desc: "Search vetted talent in plain English.", icon: Search, hint: "Login as acme@lt.house" },
            { key: "admin", label: "Admin (Zap)", desc: "Manage the database, vetting, & insights.", icon: Shield, hint: "Internal tool" },
          ].map(opt => (
            <button key={opt.key} onClick={() => onPick(opt.key)}
                    className="group bg-white border border-stone-200 rounded-2xl p-6 text-left hover:border-yellow-300 hover:bg-stone-50 transition-all">
              <opt.icon size={28} className="text-amber-500 mb-3" />
              <div className="text-xl font-bold text-black mb-1">{opt.label}</div>
              <div className="text-sm text-stone-500 mb-3">{opt.desc}</div>
              <div className="text-xs text-stone-400">{opt.hint}</div>
              <div className="mt-4 inline-flex items-center gap-1 text-amber-500 text-sm font-bold group-hover:gap-2 transition-all">
                Enter <ChevronRight size={16} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CANDIDATE INTAKE FLOW
// ============================================================
const CANDIDATE_STEPS = ["Landing", "Connect", "Review", "Basics", "Vibe", "Archetype", "Result", "Confirm"];

const SAMPLE_LINKEDIN_PROFILES = [
  {
    firstName: "Avery", lastName: "Park", email: "avery.park@example.com", phone: "(615) 555-0190",
    linkedin: "https://www.linkedin.com/in/avery-park-example/",
    currentRole: "Senior Product Manager", currentCompany: "Highnote",
    yearsExperience: 7, location: "Nashville, TN",
    skills: ["product strategy", "roadmapping", "PLG", "user research", "specs", "GTM", "OKRs"],
    workHistory: [
      { title: "Senior Product Manager", company: "Highnote", startYear: 2023, endYear: 2026 },
      { title: "Product Manager", company: "Square", startYear: 2020, endYear: 2023 },
      { title: "Associate PM", company: "Eventbrite", startYear: 2018, endYear: 2020 },
    ],
    education: [{ school: "Vanderbilt University", degree: "BA", year: 2018 }],
  },
  {
    firstName: "Marcus", lastName: "Hill", email: "marcus.hill@example.com", phone: "(615) 555-0123",
    linkedin: "https://www.linkedin.com/in/marcus-hill-example/",
    currentRole: "Founding Engineer", currentCompany: "NashAI",
    yearsExperience: 5, location: "Nashville, TN",
    skills: ["Python", "ML infrastructure", "TypeScript", "Go", "AWS", "data pipelines", "distributed systems"],
    workHistory: [
      { title: "Founding Engineer", company: "NashAI", startYear: 2024, endYear: 2026 },
      { title: "Senior Software Engineer", company: "Stripe", startYear: 2021, endYear: 2024 },
    ],
    education: [{ school: "Georgia Tech", degree: "BS", year: 2021 }],
  },
];

// ============================================================
// TALENT PORTAL — top-nav shell wrapping the candidate flow + Jobs / Interested / Messages / Resources
// ============================================================
function TalentPortal({ onExit, candidateId }) {
  const [tab, setTab] = useState("apply");
  const candidate = DATA_BUNDLE.candidates.find(c => c.id === candidateId) || null;
  const myThreads = MESSAGE_THREADS.filter(t => t.candidateId === candidateId);
  const myInterested = INTERESTED_COMPANIES.filter(i => i.candidateId === candidateId);
  const unreadCount = myThreads.filter(t => t.unread).length;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => setTab("apply")} className="flex items-center gap-2 hover:text-amber-600">
              <Zap className="text-amber-500 fill-amber-500" size={18} />
              <span className="font-black tracking-tight">Lighthouse</span>
              <span className="text-stone-500 text-xs">Talent</span>
            </button>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { k: "apply", l: candidate ? "Profile" : "Apply", icon: UserPlus },
                { k: "jobs", l: "Open Jobs", icon: Briefcase },
                { k: "interested", l: "Interested Companies", icon: Star, count: myInterested.length },
                { k: "messages", l: "Messages", icon: MessageSquare, count: unreadCount, hot: unreadCount > 0 },
                { k: "resources", l: "Resources", icon: BookOpenCheck },
              ].map(it => (
                <button key={it.k} onClick={() => setTab(it.k)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1.5 ${tab === it.k ? "bg-stone-100 text-amber-600" : "text-stone-500 hover:text-black"}`}>
                  <it.icon size={14} />
                  {it.l}
                  {typeof it.count === "number" && it.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${it.hot ? "bg-amber-500 text-white" : "bg-stone-200 text-stone-700"}`}>{it.count}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {candidate && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500">
                <Avatar candidate={candidate} size={28} />
                <span>{candidate.firstName} {candidate.lastName}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" icon={LogOut} onClick={onExit}>Exit</Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {tab === "apply" && <CandidateIntakeFlow onExit={onExit} embedded />}
        {tab === "jobs" && <TalentJobBoard onExit={() => setTab("apply")} embedded />}
        {tab === "interested" && <InterestedCompaniesView interested={myInterested} candidate={candidate} onMessage={() => setTab("messages")} />}
        {tab === "messages" && <MessagesView threads={myThreads} candidate={candidate} />}
        {tab === "resources" && <ResourcesView audience="talent" onExit={onExit} />}
      </div>
    </div>
  );
}

const INTEREST_STATUS_META = {
  pending_intro: { label: "Pending intro", color: "yellow", desc: "Zap is preparing the intro." },
  intro_made: { label: "Intro made", color: "blue", desc: "Zap connected you both — they may reach out." },
  call_scheduled: { label: "Call scheduled", color: "purple", desc: "Conversation booked." },
  declined: { label: "Passed", color: "default", desc: "You passed on this one." },
  hired: { label: "Hired", color: "green", desc: "You took the offer 🎉" },
};

function InterestedCompaniesView({ interested, candidate, onMessage }) {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-3xl">Companies interested in you</h2>
        <p className="text-sm text-stone-500 mt-1">Companies that have asked Zap for an intro to you, with notes from Zap and intro status.</p>
      </div>
      {interested.length === 0 && (
        <Card className="text-center py-12">
          <Building2 className="text-stone-400 mx-auto mb-2" size={28} />
          <div className="font-bold">No interested companies yet.</div>
          <div className="text-xs text-stone-500 mt-1">When companies request intros to you through Zap, they'll appear here.</div>
        </Card>
      )}
      {interested.map(intro => {
        const company = DATA_BUNDLE.companies.find(c => c.id === intro.companyId);
        if (!company) return null;
        const meta = INTEREST_STATUS_META[intro.status] || INTEREST_STATUS_META.pending_intro;
        return (
          <Card key={intro.id} className="hover:border-amber-400 transition">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
                {company.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold text-lg">{company.name}</div>
                  <Tag color={meta.color}>{meta.label}</Tag>
                </div>
                <div className="text-sm text-stone-500">{company.stage} · {company.industry}</div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-500">
                  <span><Briefcase size={11} className="inline mr-0.5" /> {intro.role}</span>
                  <span>·</span>
                  <span><Calendar size={11} className="inline mr-0.5" /> Interested since {intro.interestedAt}</span>
                </div>
                <div className="mt-3 bg-yellow-400/5 border-l-2 border-amber-500 rounded-r-md p-3 text-sm italic text-stone-700">
                  <div className="text-[10px] uppercase tracking-wider text-amber-600 font-bold mb-1 not-italic">Zap's note to you</div>
                  "{intro.zapNote}"
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {intro.status === "pending_intro" && <>
                    <Button size="sm" icon={CheckCircle2} onClick={() => alert("Marked as interested — Zap will make the warm intro.")}>I'm interested</Button>
                    <Button size="sm" variant="ghost" icon={X}>Pass</Button>
                  </>}
                  {(intro.status === "intro_made" || intro.status === "call_scheduled") &&
                    <Button size="sm" icon={MessageSquare} onClick={onMessage}>Open messages</Button>}
                  {intro.status === "call_scheduled" && <Tag color="purple">📅 Call booked</Tag>}
                  {intro.status === "declined" && <Tag>Archived</Tag>}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function MessagesView({ threads, candidate }) {
  const [activeId, setActiveId] = useState(threads[0]?.id || null);
  const active = threads.find(t => t.id === activeId);
  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h2 className="font-display text-2xl mb-2">Messages</h2>
        {threads.map(t => (
          <button key={t.id} onClick={() => setActiveId(t.id)}
            className={`w-full text-left bg-white border rounded-xl p-3 transition ${activeId === t.id ? "border-amber-500 bg-yellow-50/40" : "border-stone-200 hover:border-stone-400"}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-sm truncate">{t.fromName}</div>
              {t.unread && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
            </div>
            <div className="text-xs text-stone-700 mt-0.5 truncate">{t.subject}</div>
            <div className="text-xs text-stone-500 mt-1 line-clamp-2">{t.snippet}</div>
            <div className="text-[10px] text-stone-500 mt-1">{t.lastUpdate}</div>
          </button>
        ))}
        {threads.length === 0 && <Card className="text-center py-8 text-sm text-stone-500">No messages yet.</Card>}
      </div>
      {active && (
        <div className="space-y-3">
          <Card>
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-stone-500 font-bold">{active.from === "zap" ? "From Zap" : "From a company"}</div>
                <div className="font-bold text-lg">{active.fromName}</div>
                <div className="text-sm text-stone-500">{active.subject}</div>
              </div>
            </div>
            <div className="space-y-3">
              {active.messages.map((m, i) => (
                <div key={i} className={`flex ${m.author === "talent" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.author === "talent" ? "bg-yellow-400 text-black" : m.author === "zap" ? "bg-stone-100 border border-stone-200" : "bg-blue-50 border border-blue-200"}`}>
                    <div className="text-xs font-bold mb-1 opacity-70">
                      {m.author === "talent" ? "You" : m.author === "zap" ? "Zap" : (active.fromName.split("·")[1] || active.fromName).trim()}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                    <div className="text-[10px] mt-1 opacity-60">{m.ts}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-stone-200">
              <Textarea rows={3} placeholder="Reply..." className="text-sm" />
              <div className="flex justify-end mt-2">
                <Button size="sm" icon={Send} onClick={() => alert("Reply sent (mock).")}>Send reply</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function CandidateIntakeFlow({ onExit, embedded }) {
  const [step, setStep] = useState(0);
  const [showJobBoard, setShowJobBoard] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "", lastName: "", email: "", phone: "", linkedin: "",
    currentRole: "", currentCompany: "", yearsExperience: 5, location: "",
    skills: [], workHistory: [], education: [],
    roleTypes: [], stagePreference: [], workMode: "Open", timing: "Right now",
    salaryMin: 100, salaryMax: 180, salaryOptOut: false,
    biggestStrength: "", superpower: "", proudShipped: ["", "", ""],
    vibe: { nerdAbout: "", managerWords: "", futureSelfJoke: "", karaoke: "" },
    archetypeScores: null, archetype: null, archetypeXY: null, hasAssessment: false,
  });
  // Early returns AFTER all hooks are called (rules of hooks)
  if (showJobBoard) {
    return <TalentJobBoard onExit={() => setShowJobBoard(false)} />;
  }
  if (showResources) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <button onClick={() => setShowResources(false)} className="flex items-center gap-2 hover:text-amber-600">
              <Zap className="text-amber-500 fill-amber-500" size={18} />
              <span className="font-black tracking-tight">Lighthouse</span>
              <span className="text-stone-500 text-xs">Talent · Resources</span>
            </button>
            <Button size="sm" variant="ghost" icon={ArrowLeft} onClick={() => setShowResources(false)}>Back</Button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <ResourcesView audience="talent" onExit={() => setShowResources(false)} />
        </div>
      </div>
    );
  }
  function next() { setStep(s => Math.min(CANDIDATE_STEPS.length - 1, s + 1)); }
  function back() { setStep(s => Math.max(0, s - 1)); }
  function update(patch) { setProfile(p => ({ ...p, ...patch })); }
  function updateVibe(patch) { setProfile(p => ({ ...p, vibe: { ...p.vibe, ...patch } })); }

  const showProgress = step > 0 && step < CANDIDATE_STEPS.length - 1;

  // When embedded inside TalentPortal we skip the duplicate header.
  const Wrapper = embedded ? "div" : "div";
  return (
    <div className={embedded ? "" : "min-h-screen bg-white text-black"}>
      {!embedded && (
        <div className="border-b border-stone-200 bg-white/90 backdrop-blur sticky top-0 z-30">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
            <button onClick={onExit} className="flex items-center gap-2 text-stone-500 hover:text-amber-500">
              <Zap className="text-amber-500 fill-yellow-400" size={18} />
              <span className="font-black tracking-tight text-black">Lighthouse</span>
              <span className="text-stone-500 text-xs">Talent</span>
            </button>
            {showProgress && <div className="text-xs text-stone-500 tabular-nums">Step {step}/{5}</div>}
          </div>
          {showProgress && (
            <div className="max-w-3xl mx-auto px-6 pb-3">
              <StepIndicator current={step - 1} steps={CANDIDATE_STEPS.slice(1, 6)} />
            </div>
          )}
        </div>
      )}
      {embedded && showProgress && (
        <div className="max-w-3xl mx-auto px-6 pt-2 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold">Apply · Step {step}/5</div>
          </div>
          <StepIndicator current={step - 1} steps={CANDIDATE_STEPS.slice(1, 6)} />
        </div>
      )}
      <div className={embedded ? "max-w-3xl mx-auto px-0" : "max-w-3xl mx-auto px-6 py-10"}>
        {step === 0 && <CandidateLanding onStart={next} onBrowseJobs={() => setShowJobBoard(true)} onBrowseResources={() => setShowResources(true)} />}
        {step === 1 && <ConnectCareer profile={profile} update={update} onNext={next} onBack={back} />}
        {step === 2 && <ReviewProfile profile={profile} update={update} onNext={next} onBack={back} />}
        {step === 3 && <BasicsForm profile={profile} update={update} onNext={next} onBack={back} />}
        {step === 4 && <VibeCheck profile={profile} updateVibe={updateVibe} onNext={next} onBack={back} />}
        {step === 5 && <ArchetypeAssessment onSkip={() => { update({ hasAssessment: false }); setStep(7); }}
                                            onComplete={(scores, computed) => {
                                              update({ archetypeScores: scores, archetype: computed.quad, archetypeXY: { x: computed.x, y: computed.y }, hasAssessment: true });
                                              setStep(6);
                                            }}
                                            onBack={back} />}
        {step === 6 && <ArchetypeResult profile={profile} onNext={next} onBack={() => setStep(5)} />}
        {step === 7 && <Confirmation profile={profile} onExit={onExit} onTakeAssessment={() => setStep(5)} onBrowseJobs={() => setShowJobBoard(true)} />}
      </div>
    </div>
  );
}

function CandidateLanding({ onStart, onBrowseJobs, onBrowseResources }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-2">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.05] font-display">
          Get on <span className="text-amber-500">Zap's list.</span>
        </h1>
        <p className="text-stone-500 text-lg mt-4 max-w-2xl mx-auto">
          The Lighthouse Talent Network is a curated database of operators, builders, and creatives for Nashville's best startups. Every member is personally vetted by Zap.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-3 my-8">
        {[
          { i: "01", t: "Tell us about you", d: "Connect LinkedIn or upload a CV." },
          { i: "02", t: "Answer a few questions", d: "Roles, ranges, and a quick vibe check." },
          { i: "03", t: "Submit", d: "Zap reviews every application personally." },
        ].map(s => (
          <Card key={s.i} className="bg-stone-50 border border-stone-200">
            <div className="text-amber-500 font-bold text-xs tracking-widest">{s.i}</div>
            <div className="text-xl font-bold mt-1">{s.t}</div>
            <div className="text-sm text-stone-500 mt-1">{s.d}</div>
          </Card>
        ))}
      </div>
      <Card className="bg-stone-50 border border-stone-200">
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">What happens next</div>
        <div className="space-y-1.5 text-sm text-stone-700">
          <div>1. Zap reviews every application personally.</div>
          <div>2. If approved, we'll set up coffee or a Zoom to get to know you in person.</div>
          <div>3. Once vetted, you're added to the live database for startups to find.</div>
          <div>4. We make warm intros directly — you don't apply to roles, founders come to you.</div>
        </div>
      </Card>
      <div className="text-center space-y-3 pt-4">
        <Button size="lg" icon={Zap} onClick={onStart}>Start your application</Button>
        <div className="text-xs text-stone-500">
          A few minutes. Optional archetype dive available at the end.
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-4 items-center justify-center">
          {onBrowseJobs && (
            <button onClick={onBrowseJobs} className="text-sm text-stone-700 hover:text-amber-600 underline underline-offset-4">
              Or browse open jobs first →
            </button>
          )}
          {onBrowseResources && (
            <button onClick={onBrowseResources} className="text-sm text-stone-700 hover:text-amber-600 underline underline-offset-4">
              Read about startup life, comp & equity →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectCareer({ profile, update, onNext, onBack }) {
  const [mode, setMode] = useState(null); // 'linkedin' | 'cv' | 'manual' | loading
  const [error, setError] = useState(null);
  function pickLinkedIn() {
    setMode("loading-linkedin");
    setTimeout(() => {
      const sample = SAMPLE_LINKEDIN_PROFILES[Math.floor(Math.random() * SAMPLE_LINKEDIN_PROFILES.length)];
      update(sample);
      onNext();
    }, 1400);
  }
  function pickCV(file) {
    setMode("loading-cv");
    setTimeout(() => {
      const sample = SAMPLE_LINKEDIN_PROFILES[(SAMPLE_LINKEDIN_PROFILES.length - 1) - Math.floor(Math.random() * SAMPLE_LINKEDIN_PROFILES.length)];
      update(sample);
      onNext();
    }, 1800);
  }
  function pickManual() { setMode("manual"); onNext(); }

  if (mode && mode.startsWith("loading")) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="animate-spin h-12 w-12 border-4 border-yellow-400 border-t-transparent rounded-full mb-6" />
        <div className="text-xl font-bold">{mode === "loading-linkedin" ? "Connecting to LinkedIn..." : "Parsing your CV..."}</div>
        <div className="text-sm text-stone-500 mt-1">This usually takes a few seconds.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Step 1 of 5</div>
        <h2 className="text-3xl font-black font-display">Connect your career</h2>
        <p className="text-stone-500 mt-1">We'll auto-fill your profile so you don't have to type it twice.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Card className="hover:border-yellow-300 transition cursor-pointer" onClick={pickLinkedIn}>
          <Linkedin size={28} className="text-sky-700 mb-3" />
          <div className="text-lg font-bold">Import from LinkedIn</div>
          <div className="text-sm text-stone-500 mt-1">Fastest. We pull your role, history, and skills automatically.</div>
          <div className="mt-4 inline-flex items-center gap-1 text-amber-500 text-sm font-bold">
            Connect LinkedIn <ChevronRight size={16} />
          </div>
        </Card>
        <Card className="hover:border-yellow-300 transition">
          <Upload size={28} className="text-amber-500 mb-3" />
          <div className="text-lg font-bold">Upload your CV</div>
          <div className="text-sm text-stone-500 mt-1">PDF or DOCX. We'll parse it for you.</div>
          <div className="mt-4 border-2 border-dashed border-stone-300 rounded-lg p-4 text-center">
            <input type="file" id="cv-upload" accept=".pdf,.docx" className="hidden"
                   onChange={e => e.target.files[0] && pickCV(e.target.files[0])} />
            <label htmlFor="cv-upload" className="cursor-pointer">
              <div className="text-xs text-stone-500 mb-2">Drop a file here or</div>
              <Button size="sm" variant="secondary" type="button" onClick={() => document.getElementById("cv-upload")?.click()}>Choose file</Button>
            </label>
          </div>
        </Card>
      </div>
      <div className="text-center pt-4">
        <button onClick={pickManual} className="text-sm text-stone-500 hover:text-amber-500 underline underline-offset-4">
          I'd rather fill it in myself →
        </button>
      </div>
    </div>
  );
}

function ReviewProfile({ profile, update, onNext, onBack }) {
  const [skills, setSkills] = useState(profile.skills.length ? profile.skills : []);
  const [newSkill, setNewSkill] = useState("");
  function addSkill() {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const s = [...skills, newSkill.trim()]; setSkills(s); update({ skills: s }); setNewSkill("");
    }
  }
  function removeSkill(s) { const next = skills.filter(x => x !== s); setSkills(next); update({ skills: next }); }
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Step 1 · Review</div>
        <h2 className="text-3xl font-black font-display">Looks good?</h2>
        <p className="text-stone-500 mt-1">We pulled the basics. Tweak anything that's off.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="First name" required><Input value={profile.firstName} onChange={e => update({ firstName: e.target.value })} /></Field>
        <Field label="Last name" required><Input value={profile.lastName} onChange={e => update({ lastName: e.target.value })} /></Field>
        <Field label="Email" required><Input type="email" value={profile.email} onChange={e => update({ email: e.target.value })} /></Field>
        <Field label="Phone"><Input value={profile.phone} onChange={e => update({ phone: e.target.value })} /></Field>
        <Field label="LinkedIn URL"><Input value={profile.linkedin} onChange={e => update({ linkedin: e.target.value })} /></Field>
        <Field label="Location" required><Input value={profile.location} onChange={e => update({ location: e.target.value })} /></Field>
        <Field label="Current role" required><Input value={profile.currentRole} onChange={e => update({ currentRole: e.target.value })} /></Field>
        <Field label="Company"><Input value={profile.currentCompany} onChange={e => update({ currentCompany: e.target.value })} /></Field>
        <Field label="Years experience" required>
          <Input type="number" min={0} max={40} value={profile.yearsExperience} onChange={e => update({ yearsExperience: +e.target.value })} />
        </Field>
      </div>
      <Field label="Top skills" hint="Edit, remove, or add. Aim for 5–9.">
        <div className="flex flex-wrap gap-2 mb-2">
          {skills.map(s => (
            <span key={s} className="inline-flex items-center gap-1 bg-yellow-100 text-amber-800 border border-yellow-300 px-2 py-1 rounded-full text-xs font-medium">
              {s} <button onClick={() => removeSkill(s)} className="ml-1 opacity-70 hover:opacity-100"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Add a skill" value={newSkill} onChange={e => setNewSkill(e.target.value)}
                 onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} />
          <Button size="sm" onClick={addSkill} variant="secondary">Add</Button>
        </div>
      </Field>
      {profile.workHistory && profile.workHistory.length > 0 && (
        <Field label="Work history">
          <div className="space-y-2">
            {profile.workHistory.map((w, i) => (
              <div key={i} className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900">{w.title}</div>
                  <div className="text-stone-500 text-xs">{w.company} · {w.startYear}–{w.endYear}</div>
                </div>
              </div>
            ))}
          </div>
        </Field>
      )}
      {profile.education && profile.education.length > 0 && (
        <Field label="Education">
          <div className="space-y-2">
            {profile.education.map((e, i) => (
              <div key={i} className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm">
                <div className="font-bold text-stone-900">{e.school}</div>
                <div className="text-stone-500 text-xs">{e.degree} · {e.year}</div>
              </div>
            ))}
          </div>
        </Field>
      )}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" icon={ChevronLeft} onClick={onBack}>Back</Button>
        <Button onClick={onNext} icon={ArrowRight}>Looks good</Button>
      </div>
    </div>
  );
}

function BasicsForm({ profile, update, onNext, onBack }) {
  function setProud(i, v) {
    const arr = [...profile.proudShipped]; arr[i] = v; update({ proudShipped: arr });
  }
  return (
    <div className="space-y-7">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Step 2 · The basics</div>
        <h2 className="text-3xl font-black font-display">Tell us what you want.</h2>
        <p className="text-stone-500 mt-1">Short and direct. Not a soul-bearing exercise.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-x-6 gap-y-5">
        <div className="space-y-5">
          <Field label="What kind of role are you open to?" hint="Pick all that apply.">
            <MultiSelectChips options={ROLE_TYPES} selected={profile.roleTypes} onChange={v => update({ roleTypes: v })} />
          </Field>
          <Field label="What stage of company excites you most?">
            <MultiSelectChips options={STAGE_OPTIONS} selected={profile.stagePreference} onChange={v => update({ stagePreference: v })} />
          </Field>
          <Field label="Ideal work mode">
            <Select value={profile.workMode} onChange={v => update({ workMode: v })} options={WORK_MODES} />
          </Field>
          <Field label="When are you actively looking?">
            <Select value={profile.timing} onChange={v => update({ timing: v })} options={TIMING_OPTIONS} />
          </Field>
          <Field label="Salary expectations" hint={profile.salaryOptOut ? "Hidden — will be discussed in the vetting call." : `$${profile.salaryMin}K – $${profile.salaryMax}K`}>
            {!profile.salaryOptOut && (() => {
              const RANGES = [50, 60, 70, 80, 90, 100, 115, 130, 145, 160, 180, 200, 225, 250, 275, 300, 350, 400];
              return (
                <div className="grid grid-cols-2 gap-2">
                  <Select value={profile.salaryMin}
                    onChange={v => {
                      const next = +v;
                      update({ salaryMin: next, salaryMax: Math.max(profile.salaryMax, next) });
                    }}
                    options={RANGES.map(n => ({ value: n, label: `$${n}K` }))} />
                  <Select value={profile.salaryMax}
                    onChange={v => {
                      const next = +v;
                      update({ salaryMax: next, salaryMin: Math.min(profile.salaryMin, next) });
                    }}
                    options={RANGES.filter(n => n >= profile.salaryMin).map(n => ({ value: n, label: `$${n}K${n === 400 ? "+" : ""}` }))} />
                </div>
              );
            })()}
            <label className="flex items-center gap-2 text-sm text-stone-500 mt-2 cursor-pointer">
              <input type="checkbox" checked={profile.salaryOptOut}
                onChange={e => update({ salaryOptOut: e.target.checked })} className="accent-yellow-400" />
              Prefer to discuss
            </label>
          </Field>
        </div>
        <div className="space-y-5">
          <Field label="Your single biggest professional strength" hint="One sentence.">
            <Input value={profile.biggestStrength} onChange={e => update({ biggestStrength: e.target.value })}
              placeholder="I take chaos and turn it into a system that runs without me." />
          </Field>
          <Field label="Your superpower outside of your day job" hint="Make us smile.">
            <Input value={profile.superpower} onChange={e => update({ superpower: e.target.value })}
              placeholder="I host the best dinner parties in East Nashville." />
          </Field>
          <Field label="3 things you've shipped, built, or led that you're most proud of">
            <div className="space-y-2">
              {[0, 1, 2].map(i => (
                <Input key={i} value={profile.proudShipped[i]} onChange={e => setProud(i, e.target.value)}
                  placeholder={`#${i + 1}`} />
              ))}
            </div>
          </Field>
        </div>
      </div>
      <div className="flex justify-between pt-4">
        <Button variant="ghost" icon={ChevronLeft} onClick={onBack}>Back</Button>
        <Button onClick={onNext} icon={ArrowRight}>Continue</Button>
      </div>
    </div>
  );
}

function VibeCheck({ profile, updateVibe, onNext, onBack }) {
  const [sub, setSub] = useState(0);
  // Trimmed to 2 per v2 spec — karaoke and future-self joke removed.
  const questions = [
    { key: "nerdAbout", q: "What's something you nerd out about that has nothing to do with work?", placeholder: "Photography, sourdough, marathon running..." },
    { key: "managerWords", q: "If your last manager described you in 3 words, what would they be?", placeholder: "scrappy, organized, funny" },
  ];
  const cur = questions[sub];
  return (
    <div className="space-y-8 min-h-[60vh] flex flex-col">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Step 3 · About you ({sub + 1}/{questions.length})</div>
        <h2 className="text-3xl font-black font-display">A couple about you.</h2>
        <p className="text-stone-500 mt-1">No wrong answers.</p>
      </div>
      <div className="flex-1 flex items-center">
        <div className="w-full">
          <div className="text-2xl font-bold mb-4">{cur.q}</div>
          <Textarea rows={3} value={profile.vibe[cur.key] || ""} onChange={e => updateVibe({ [cur.key]: e.target.value })} placeholder={cur.placeholder} className="text-lg" />
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" icon={ChevronLeft} onClick={() => sub === 0 ? onBack() : setSub(sub - 1)}>Back</Button>
        {sub < questions.length - 1
          ? <Button onClick={() => setSub(sub + 1)} icon={ArrowRight}>Next</Button>
          : <Button onClick={onNext} icon={ArrowRight}>Continue</Button>}
      </div>
    </div>
  );
}

function ArchetypeAssessment({ onSkip, onComplete, onBack }) {
  const [stage, setStage] = useState("intro"); // intro | running | calculating
  const [scores, setScores] = useState(Array(16).fill(5));
  const [order] = useState(() => {
    const idx = [...Array(16).keys()];
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });
  const [page, setPage] = useState(0);
  function setScore(orderIdx, val) {
    const real = order[orderIdx];
    setScores(s => { const n = [...s]; n[real] = val; return n; });
  }
  if (stage === "intro") {
    return (
      <div className="space-y-8 min-h-[60vh]">
        <div className="inline-block">
          <Tag color="yellow" size="lg"><Sparkles size={14} /> OPTIONAL</Tag>
        </div>
        <h2 className="text-4xl md:text-5xl font-black font-display">Want to go deeper?</h2>
        <p className="text-stone-700 text-lg max-w-2xl">
          Tell us how you actually like to work. We'll plot you on our talent map and assign you an archetype that helps startups understand at a glance whether you're the right kind of person for what they're building.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button size="lg" icon={Zap} onClick={() => setStage("running")}>Yes, let's do it</Button>
          <Button size="lg" variant="skip" onClick={onSkip}>Skip for now</Button>
        </div>
        <p className="text-sm text-stone-500">You can always come back and finish this later.</p>
      </div>
    );
  }
  if (stage === "calculating") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="animate-spin h-12 w-12 border-4 border-yellow-400 border-t-transparent rounded-full mb-6" />
        <div className="text-xl font-bold">Calculating your archetype...</div>
        <div className="text-sm text-stone-500 mt-1">Plotting you on the talent map.</div>
      </div>
    );
  }
  // Running: show 4 statements per page
  const start = page * 4;
  const pageStatements = order.slice(start, start + 4);
  return (
    <div className="space-y-6 min-h-[60vh]">
      <div className="flex items-center justify-between">
        <div>
          <Tag color="yellow"><Sparkles size={12} /> ARCHETYPE DIVE</Tag>
          <div className="text-xs text-stone-500 mt-2">Page {page + 1} of 4 · Statement {start + 1}–{start + 4} of 16</div>
        </div>
        <ProgressBar value={start + 4} max={16} />
      </div>
      <div className="space-y-8 pt-2">
        {pageStatements.map((origIdx, i) => (
          <div key={origIdx} className="bg-stone-50 border border-stone-200 rounded-xl p-6">
            <div className="text-xl font-bold mb-5 text-center">{ARCHETYPE_STATEMENTS[origIdx]}</div>
            <Slider value={scores[origIdx]} onChange={v => setScore(start + i, v)} />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" icon={ChevronLeft} onClick={() => page === 0 ? setStage("intro") : setPage(page - 1)}>Back</Button>
        {page < 3
          ? <Button onClick={() => setPage(page + 1)} icon={ArrowRight}>Continue</Button>
          : <Button icon={Sparkles} onClick={() => {
              setStage("calculating");
              setTimeout(() => onComplete(scores, computeArchetypeFromScores(scores)), 2200);
            }}>See my archetype</Button>}
      </div>
    </div>
  );
}

function ArchetypeResult({ profile, onNext, onBack }) {
  const a = ARCHETYPES[profile.archetype] || ARCHETYPES.Balanced;
  const xy = profile.archetypeXY;
  // Background candidates for the heatmap
  const heatmap = DATA_BUNDLE.candidates.filter(c => c.hasAssessment);
  const [showAll, setShowAll] = useState(false);
  const builder = ((profile.archetypeScores[0] + profile.archetypeScores[2] + profile.archetypeScores[4] + profile.archetypeScores[6]) / 4).toFixed(1);
  const operator = ((profile.archetypeScores[1] + profile.archetypeScores[3] + profile.archetypeScores[5] + profile.archetypeScores[7]) / 4).toFixed(1);
  const spec = ((profile.archetypeScores[8] + profile.archetypeScores[10] + profile.archetypeScores[12] + profile.archetypeScores[14]) / 4).toFixed(1);
  const gen = ((profile.archetypeScores[9] + profile.archetypeScores[11] + profile.archetypeScores[13] + profile.archetypeScores[15]) / 4).toFixed(1);
  return (
    <div className="space-y-6">
      <div className="text-center pt-2">
        <Tag color="yellow"><Sparkles size={12} /> YOUR ARCHETYPE</Tag>
        <div className="text-7xl mt-4">{a.icon}</div>
        <h2 className="text-5xl font-black mt-2 tracking-tight font-display">{a.label}</h2>
        <div className="text-sm text-stone-500 mt-1">{a.short}</div>
        <p className="text-stone-700 mt-4 max-w-xl mx-auto">{a.desc}</p>
      </div>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Where you sit on the map</div>
        <ArchetypePlot candidates={heatmap} highlight={profile} />
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Your scores breakdown</div>
        <div className="space-y-3">
          <ScoreBar leftLabel="Builder" rightLabel="Operator" leftScore={builder} rightScore={operator} />
          <ScoreBar leftLabel="Specialist" rightLabel="Generalist" leftScore={spec} rightScore={gen} />
        </div>
      </Card>
      <Card>
        <button onClick={() => setShowAll(!showAll)} className="w-full text-left flex items-center justify-between text-sm font-semibold text-stone-700">
          <span>See your individual responses</span>
          {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showAll && (
          <div className="mt-3 space-y-2">
            {ARCHETYPE_STATEMENTS.map((s, i) => (
              <div key={i} className="flex items-start gap-3 text-sm border-t border-stone-200 pt-2 first:border-0 first:pt-0">
                <div className="text-amber-500 font-bold tabular-nums w-8 flex-shrink-0">{profile.archetypeScores[i]}/10</div>
                <div className="text-stone-700">{s}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="flex justify-between pt-4">
        <Button variant="ghost" icon={ChevronLeft} onClick={onBack}>Retake</Button>
        <Button onClick={onNext} icon={Zap}>Submit application</Button>
      </div>
    </div>
  );
}

function ScoreBar({ leftLabel, rightLabel, leftScore, rightScore }) {
  const total = +leftScore + +rightScore;
  const leftPct = (+leftScore / total) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs text-stone-500 mb-1">
        <span className="font-semibold">{leftLabel} <span className="text-stone-500">{leftScore}</span></span>
        <span className="font-semibold"><span className="text-stone-500">{rightScore}</span> {rightLabel}</span>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden flex">
        <div className="h-full bg-yellow-400" style={{ width: `${leftPct}%` }} />
        <div className="h-full bg-violet-400" style={{ width: `${100 - leftPct}%` }} />
      </div>
    </div>
  );
}

function Confirmation({ profile, onExit, onTakeAssessment, onBrowseJobs }) {
  const a = profile.archetype ? ARCHETYPES[profile.archetype] : null;
  return (
    <div className="space-y-6 text-center">
      <CheckCircle2 size={64} className="text-amber-500 mx-auto" />
      <h2 className="text-5xl font-black font-display">You're on the list <Zap className="inline text-amber-500 fill-yellow-400" /></h2>
      <p className="text-stone-700 text-lg max-w-xl mx-auto">
        Zap reviews every application personally. We'll be in touch. If you're a fit, we'll set up coffee or a Zoom to get to know you in person — that's how every candidate gets into the live database.
      </p>
      {a && (
        <Card className="text-left max-w-md mx-auto">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Your archetype</div>
          <div className="flex items-center gap-3">
            <div className="text-5xl">{a.icon}</div>
            <div>
              <div className="text-2xl font-black">{a.label}</div>
              <div className="text-xs text-stone-500">{a.short}</div>
            </div>
          </div>
        </Card>
      )}
      {!profile.hasAssessment && (
        <Card className="max-w-md mx-auto bg-stone-50 border border-yellow-200">
          <div className="text-sm">
            Want to add your archetype later?
            <button onClick={onTakeAssessment} className="block mt-2 text-amber-500 font-bold hover:underline">Take the assessment →</button>
          </div>
        </Card>
      )}
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
              <div>
                <div className="font-bold text-stone-900">{t}</div>
                <div className="text-xs text-stone-500">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="pt-4 flex flex-col items-center gap-3">
        {onBrowseJobs && <Button size="lg" icon={Briefcase} onClick={onBrowseJobs}>Browse open jobs while you wait</Button>}
        <Button variant="secondary" icon={Mail} onClick={onExit}>Subscribe to Zap's Wrap</Button>
      </div>
      <button onClick={onExit} className="text-sm text-stone-500 hover:text-amber-500">Back to home</button>
    </div>
  );
}

// ============================================================
// COMPANY HIRING PORTAL
// ============================================================
function CompanyPortal({ onExit, preselectedCompanyId }) {
  // When the ModeSwitcher passes a preselectedCompanyId, we skip the login screen entirely
  // and start at the home view as that company. Otherwise we still show login (kept for fidelity).
  const [view, setView] = useState(preselectedCompanyId ? "home" : "login");
  const [me, setMe] = useState(preselectedCompanyId || null);
  // Sync if the user changes company via the ModeSwitcher while inside the portal
  useEffect(() => {
    if (preselectedCompanyId && preselectedCompanyId !== me) {
      setMe(preselectedCompanyId);
      setView("home");
    }
  }, [preselectedCompanyId]);
  const [query, setQuery] = useState("");
  const [interp, setInterp] = useState(null);
  const [filters, setFilters] = useState({ yoeMin: 0, yoeMax: 25, stages: [], locations: [], skills: [], vettedOnly: true, archetypes: [], assessmentOnly: false });
  const [activeId, setActiveId] = useState(null);
  const [shortlists, setShortlists] = useState(DATA_BUNDLE.shortlists.map(s => ({ ...s })));
  const [savedSearches, setSavedSearches] = useState(DATA_BUNDLE.savedSearches.map(s => ({ ...s })));
  const [refinement, setRefinement] = useState({ skillScores: null, cultureScores: null, cultureArchetype: null });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showJDCard, setShowJDCard] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // list | grid | map
  const [sort, setSort] = useState("match");

  function login(id) { setMe(id); setView("home"); }
  function runSearch(q) {
    setQuery(q);
    setSearchLoading(true);
    setShowJDCard(true);
    setTimeout(() => {
      setInterp(aiInterpret(q));
      setSearchLoading(false);
      setView("results");
    }, 1800);
  }

  if (view === "login") return <CompanyLogin onLogin={login} onExit={onExit} />;
  const company = DATA_BUNDLE.companies.find(c => c.id === me);

  return (
    <div className="min-h-screen bg-white text-black">
      <CompanyShellHeader company={company} onExit={onExit} setView={setView} view={view} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        {view === "home" && (
          <CompanyHome onSearch={runSearch} savedSearches={savedSearches.filter(s => s.companyId === me)} setView={setView} setQuery={setQuery} runSearch={runSearch} />
        )}
        {view === "results" && (
          <SearchResults
            query={query} interp={interp} setInterp={setInterp} filters={filters} setFilters={setFilters}
            onOpenProfile={(id) => { setActiveId(id); setView("profile"); }}
            onRefine={() => setView("refine")}
            shortlists={shortlists} setShortlists={setShortlists}
            companyId={me}
            searchLoading={searchLoading} setSearchLoading={setSearchLoading}
            showJDCard={showJDCard} setShowJDCard={setShowJDCard}
            viewMode={viewMode} setViewMode={setViewMode}
            sort={sort} setSort={setSort}
            refinement={refinement}
            onSaveSearch={() => {
              const name = prompt("Name this search:") || `Search ${savedSearches.length + 1}`;
              setSavedSearches([...savedSearches, {
                id: Date.now(), companyId: me, name, query, createdAt: new Date().toISOString().slice(0, 10), results: 0
              }]);
            }}
          />
        )}
        {view === "profile" && (
          <CandidateProfileView candidate={DATA_BUNDLE.candidates.find(c => c.id === activeId)}
            onBack={() => setView("results")} interp={interp}
            onShortlist={(slId) => {
              setShortlists(sls => sls.map(s => s.id === slId
                ? { ...s, candidateIds: [...new Set([...s.candidateIds, activeId])] } : s));
              alert("Added to shortlist.");
            }} shortlists={shortlists.filter(s => s.companyId === me)} />
        )}
        {view === "refine" && (
          <DeepDive onComplete={(skillScores, cultureScores) => {
            const cultureArchetype = cultureScores ? computeCultureArchetype(cultureScores) : null;
            setRefinement({ skillScores, cultureScores, cultureArchetype });
            setView("results");
          }} onSkip={() => setView("results")} />
        )}
        {view === "shortlists" && (
          <ShortlistsView shortlists={shortlists.filter(s => s.companyId === me)} setShortlists={setShortlists}
            onOpenCandidate={(id) => { setActiveId(id); setView("profile"); }} />
        )}
        {view === "searches" && (
          <SavedSearchesView searches={savedSearches.filter(s => s.companyId === me)}
            onRunSearch={runSearch} setSearches={setSavedSearches}
            onNewSearch={() => setView("home")} />
        )}
        {view === "intros" && (
          <IntrosView companyId={me} onOpenCandidate={(id) => { setActiveId(id); setView("profile"); }} />
        )}
        {view === "browse" && (
          <BrowseDatabase
            onOpenProfile={(id) => { setActiveId(id); setView("profile"); }}
            companyId={me} shortlists={shortlists} setShortlists={setShortlists}
            onSaveAsSearch={({ name, query }) => {
              setSavedSearches([...savedSearches, {
                id: Date.now(), companyId: me, name, query,
                createdAt: new Date().toISOString().slice(0, 10), results: 0
              }]);
              alert(`Saved "${name}" to your searches.`);
            }} />
        )}
        {view === "resources" && (
          <ResourcesView audience="company" onExit={onExit} />
        )}
      </div>
    </div>
  );
}

function CompanyShellHeader({ company, onExit, setView, view }) {
  return (
    <div className="border-b border-stone-200 bg-white/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => setView("home")} className="flex items-center gap-2 hover:text-amber-500">
            <Zap className="text-amber-500 fill-yellow-400" size={18} />
            <span className="font-black tracking-tight">Lighthouse</span>
            <span className="text-stone-500 text-xs">Hire</span>
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {[
              { k: "home", l: "Search", icon: Search },
              { k: "browse", l: "Browse", icon: Database },
              { k: "intros", l: "Intros", icon: Coffee },
              { k: "searches", l: "My Searches", icon: BookOpenCheck },
              { k: "shortlists", l: "Shortlists", icon: Star },
              { k: "resources", l: "Resources", icon: FileText },
            ].map(it => (
              <button key={it.k} onClick={() => setView(it.k)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1.5 ${view === it.k ? "bg-stone-100 text-amber-500" : "text-stone-500 hover:text-black"}`}>
                <it.icon size={14} />{it.l}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-stone-500 hidden sm:block">{company?.name}</div>
          <Button variant="ghost" size="sm" icon={LogOut} onClick={onExit}>Exit</Button>
        </div>
      </div>
    </div>
  );
}

function CompanyLogin({ onLogin, onExit }) {
  const [email, setEmail] = useState("acme@lt.house");
  const [password, setPassword] = useState("password");
  const [companyId, setCompanyId] = useState(5); // SoundHealth default
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-white text-black">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <Zap className="text-amber-500 fill-yellow-400 mx-auto mb-2" size={32} />
          <div className="font-black text-2xl">Lighthouse Hire</div>
          <div className="text-sm text-stone-500 mt-1">Find your next teammate.</div>
        </div>
        <Card>
          <Field label="Company login email" required><Input value={email} onChange={e => setEmail(e.target.value)} /></Field>
          <div className="h-3" />
          <Field label="Password" required><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></Field>
          <div className="h-3" />
          <Field label="Demo: choose company" hint="Each company has its own saved searches and shortlists.">
            <Select value={companyId} onChange={v => setCompanyId(+v)}
                    options={DATA_BUNDLE.companies.map(c => ({ value: c.id, label: `${c.name} · ${c.stage}` }))} />
          </Field>
          <div className="h-5" />
          <Button onClick={() => onLogin(companyId)} className="w-full" icon={ArrowRight}>Sign in</Button>
        </Card>
        <div className="text-center mt-6">
          <button onClick={onExit} className="text-xs text-stone-500 hover:text-amber-500">← Back to landing</button>
        </div>
      </div>
    </div>
  );
}

function CompanyHome({ onSearch, savedSearches, setView }) {
  const [text, setText] = useState("");
  const presets = [
    { t: "Engineering Lead", q: "Engineering lead for our Series A team. 8+ years, scaled team from 5 to 25, hands-on for the first 6 months. Bias to backend infra background." },
    { t: "First Marketing Hire", q: "First marketing hire at our seed B2B SaaS. Comfortable doing content, paid acquisition, lifecycle, and partnerships in equal measure." },
    { t: "Chief of Staff", q: "Chief of Staff for a Series A founder running across hiring, BizOps, and OKRs. Generalist + operator energy. Strong written communicator." },
    { t: "Founding Designer", q: "Founding designer for a 3-person pre-seed team. Brand and product design. Comfortable shipping, not just speccing." },
  ];
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const inRange = wordCount >= 25 && wordCount <= 50;
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center pt-6">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight font-display">Find your next hire <Zap className="inline text-amber-500 fill-yellow-400" /></h1>
        <p className="text-stone-500 text-lg mt-3">Describe what you need. We'll match you with vetted talent from Nashville and beyond.</p>
      </div>
      <Card padded={false} className="p-2">
        <Textarea rows={5} value={text} onChange={e => setText(e.target.value)}
          placeholder={`We're looking for an early-stage operator who can run our day-to-day, set up vendor relationships, manage our 12-person team, and act as the glue person across departments. Bonus if they have experience scaling a Series A company...`}
          className="border-0 bg-transparent text-base" />
        <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-stone-200">
          <div className={`text-xs ${inRange ? "text-emerald-600" : "text-stone-500"}`}>
            {wordCount} words {inRange ? "✓ great length" : "· recommended 25–50 words (you can write more)"}
          </div>
          <Button onClick={() => text.trim() && onSearch(text)} icon={Search} disabled={!text.trim()}>Search</Button>
        </div>
      </Card>
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Or start from a preset</div>
        <div className="flex flex-wrap justify-center gap-2">
          {presets.map(p => (
            <button key={p.t} onClick={() => setText(p.q)}
                    className="bg-white border border-stone-200 hover:border-yellow-300 px-3 py-1.5 rounded-full text-xs font-medium text-stone-700 hover:text-amber-500 transition">
              {p.t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-stone-500 pt-4">
        <button onClick={() => setView("searches")} className="hover:text-amber-500">Recent searches →</button>
        <span>·</span>
        <button onClick={() => setView("shortlists")} className="hover:text-amber-500">My shortlists →</button>
      </div>
    </div>
  );
}

function SearchResults({
  query, interp, setInterp, filters, setFilters, onOpenProfile, onRefine,
  shortlists, setShortlists, companyId, searchLoading, setSearchLoading,
  showJDCard, setShowJDCard, viewMode, setViewMode, sort, setSort, refinement, onSaveSearch
}) {
  const [showRefineCard, setShowRefineCard] = useState(true);

  if (searchLoading) {
    return <div className="min-h-[40vh] flex flex-col items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-yellow-400 border-t-transparent rounded-full mb-4" />
      <div className="text-lg font-bold text-center">Reading your description...<br/><span className="text-stone-500 text-sm">matching against vetted talent... ranking results.</span></div>
    </div>;
  }
  if (!interp) return <div>Run a search.</div>;

  const all = rankCandidates(DATA_BUNDLE.candidates, query, filters, interp);
  let sorted = [...all];
  if (sort === "yoe") sorted.sort((a, b) => b.candidate.yearsExperience - a.candidate.yearsExperience);
  else if (sort === "recent") sorted.sort((a, b) => new Date(b.candidate.dateApplied) - new Date(a.candidate.dateApplied));
  // Cap top 40 for prototype display
  const top = sorted.slice(0, 40);

  // Apply skill weighting if completed assessment A
  if (refinement.skillScores) {
    // re-sort by simple boost
    top.sort((a, b) => b.score - a.score);
  }

  // JD suggestions
  const jdSugs = suggestJDs(interp, DATA_BUNDLE.jdTemplates);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 font-bold">Search</div>
          <div className="text-sm text-stone-700 max-w-3xl line-clamp-2">{query}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" icon={Save} onClick={onSaveSearch}>Save this search ⚡</Button>
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => { setInterp(aiInterpret(query)); }}>Re-run</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        {/* Filter sidebar */}
        <FilterSidebar filters={filters} setFilters={setFilters} interp={interp} />
        <div className="space-y-4">
          <AIInterpretCard interp={interp} setInterp={setInterp} />
          {showJDCard && jdSugs.length > 0 && <JDSuggestionCard jds={jdSugs} onDismiss={() => setShowJDCard(false)} onLockIn={() => setShowJDCard(false)} />}
          {showRefineCard && <RefineCard onStart={onRefine} onDismiss={() => setShowRefineCard(false)} />}

          <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
            <div className="text-sm text-stone-500">
              <span className="font-bold text-amber-500">{top.length}</span> candidates ranked {refinement.skillScores && <Tag color="yellow"><Sparkles size={10} /> Refined by skill spec</Tag>}
              {refinement.cultureArchetype && <span> · culture: <Tag color="purple">{CULTURE_ARCHETYPES[refinement.cultureArchetype.quad]?.icon} {refinement.cultureArchetype.quad}</Tag></span>}
            </div>
            <div className="flex items-center gap-2">
              <Select value={sort} onChange={setSort} className="text-xs py-1 w-auto"
                options={[{ value: "match", label: "Sort: Match score" }, { value: "yoe", label: "Sort: Experience" }, { value: "recent", label: "Sort: Recently joined" }]} />
              <div className="flex bg-white border border-stone-200 rounded-lg border border-stone-200 p-0.5">
                {[{ k: "list", icon: List }, { k: "grid", icon: Grid3x3 }, { k: "map", icon: Map }].map(o => (
                  <button key={o.k} onClick={() => setViewMode(o.k)}
                          className={`p-1.5 rounded ${viewMode === o.k ? "bg-yellow-400 text-black" : "text-stone-500 hover:text-black"}`}>
                    <o.icon size={14} />
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" icon={Send} onClick={() => alert("Exporting... (mock) Sent to your inbox.")}>Export</Button>
            </div>
          </div>

          {viewMode === "map" && <Card><ArchetypePlot candidates={top.map(t => t.candidate).filter(c => c.archetypeXY)} height={420} /></Card>}
          {viewMode === "list" && <div className="space-y-2">
            {top.map(({ candidate, score, breakdown }) => (
              <CandidateCard key={candidate.id} candidate={candidate} score={score} breakdown={breakdown} interp={interp}
                             onOpenProfile={() => onOpenProfile(candidate.id)}
                             onShortlist={(slId) => setShortlists(sls => sls.map(s => s.id === slId ? { ...s, candidateIds: [...new Set([...s.candidateIds, candidate.id])] } : s))}
                             shortlists={shortlists.filter(s => s.companyId === companyId)} />
            ))}
          </div>}
          {viewMode === "grid" && <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {top.map(({ candidate, score }) => (
              <Card key={candidate.id} onClick={() => onOpenProfile(candidate.id)} className="hover:border-yellow-300">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar candidate={candidate} size={36} />
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{candidate.firstName} {candidate.lastName}</div>
                    <div className="text-xs text-stone-500 truncate">{candidate.currentRole}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Tag color="yellow">{score} match</Tag>
                  {candidate.archetype && <ArchetypeBadge quad={candidate.archetype} />}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">{candidate.skills.slice(0, 3).map(s => <Tag key={s} size="sm">{s}</Tag>)}</div>
              </Card>
            ))}
          </div>}

          {top.length === 0 && (
            <Card className="text-center py-12">
              <AlertCircle className="text-stone-500 mx-auto mb-2" />
              <div className="font-bold">No matches yet</div>
              <div className="text-xs text-stone-500 mt-1">Try loosening your filters or rephrasing the search.</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AIInterpretCard({ interp, setInterp }) {
  function removeSkill(s) { setInterp({ ...interp, skills: interp.skills.filter(x => x !== s) }); }
  return (
    <Card className="border-yellow-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500 font-bold">
          <Sparkles size={12} className="text-amber-500" /> Here's what we heard
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
        <div><span className="text-stone-500 text-xs">Role type</span><div><Tag color="yellow">{interp.role}</Tag></div></div>
        <div><span className="text-stone-500 text-xs">Seniority</span><div><Tag color="blue">{interp.seniority} ({interp.years[0]}–{interp.years[1]} yrs)</Tag></div></div>
        {interp.stage && <div><span className="text-stone-500 text-xs">Stage fit</span><div><Tag color="green">{interp.stage}</Tag></div></div>}
        <div><span className="text-stone-500 text-xs">Location</span><div><Tag>{interp.location}</Tag></div></div>
        <div className="sm:col-span-2"><span className="text-stone-500 text-xs">Key skills</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {interp.skills.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-yellow-100 text-amber-800 border border-yellow-300 px-2 py-0.5 rounded-full text-xs font-medium">
                {s}
                <button onClick={() => removeSkill(s)} className="ml-1 opacity-60 hover:opacity-100"><X size={10} /></button>
              </span>
            ))}
          </div>
        </div>
        {interp.archetypeLean && (
          <div className="sm:col-span-2"><span className="text-stone-500 text-xs">Archetype lean</span>
            <div><ArchetypeBadge quad={interp.archetypeLean} size="lg" /> <span className="text-xs text-stone-500 ml-1">inferred</span></div>
          </div>
        )}
        {interp.signals.length > 0 && (
          <div className="sm:col-span-2"><span className="text-stone-500 text-xs">Other signals</span>
            <div className="flex flex-wrap gap-1 mt-1">{interp.signals.map(s => <Tag key={s}>{s}</Tag>)}</div>
          </div>
        )}
      </div>
    </Card>
  );
}

function JDSuggestionCard({ jds, onDismiss, onLockIn }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <Card className="bg-stone-50 border border-stone-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold">Did we get this right? <Tag color="yellow">OPTIONAL</Tag></div>
        <button onClick={onDismiss} className="text-stone-500 hover:text-stone-900"><X size={14} /></button>
      </div>
      <div className="text-sm text-stone-700 mb-3">Here are a few similar roles in our database that might match what you're describing.</div>
      <div className="grid sm:grid-cols-3 gap-2">
        {jds.map(jd => (
          <div key={jd.id} className="bg-white border border-stone-200 rounded-lg p-3">
            <div className="text-sm font-bold">{jd.title}</div>
            <div className="text-xs text-stone-500 mt-0.5">{jd.stage} · {jd.industry}</div>
            <button onClick={() => setExpanded(expanded === jd.id ? null : jd.id)} className="text-xs text-amber-500 mt-2 hover:underline">
              {expanded === jd.id ? "Hide JD" : "View JD"}
            </button>
            {expanded === jd.id && <div className="text-xs text-stone-700 mt-2 pt-2 border-t border-stone-200">{jd.body}</div>}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-stone-200">
        <Button size="sm" onClick={onLockIn}>Yes, this is what we want</Button>
        <Button size="sm" variant="skip" onClick={onDismiss}>Not quite — let me refine</Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>Skip this step</Button>
      </div>
    </Card>
  );
}

function RefineCard({ onStart, onDismiss }) {
  return (
    <Card className="bg-gradient-to-br from-stone-50 to-amber-50/40 border-violet-200">
      <div className="flex items-start gap-3">
        <Sparkles className="text-violet-700 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-violet-700 font-bold flex items-center gap-2">Power user mode <Tag color="purple">OPTIONAL</Tag></div>
          <div className="text-sm font-bold mt-0.5">Not quite finding the right fit?</div>
          <div className="text-sm text-stone-500">Spend 5 minutes telling us exactly what you need and what your company culture is like. We'll re-rank candidates based on the perfect match.</div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={onStart}>Start refining</Button>
            <Button size="sm" variant="skip" onClick={onDismiss}>Skip</Button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-stone-500 hover:text-stone-900"><X size={14} /></button>
      </div>
    </Card>
  );
}

function FilterSidebar({ filters, setFilters, interp }) {
  const [archetypeOpen, setArchetypeOpen] = useState(false);
  const allSkills = useMemo(() => {
    const s = new Set();
    DATA_BUNDLE.candidates.forEach(c => c.skills.forEach(x => s.add(x)));
    return [...s].sort();
  }, []);
  const popularSkills = allSkills.slice(0, 30);
  function toggle(arr, v) { return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]; }
  return (
    <div className="space-y-4 lg:sticky lg:top-20 self-start">
      <Card className="space-y-4">
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold flex items-center gap-2">
          <Filter size={12} /> Filters
        </div>
        <Field label="Years of experience" hint={`${filters.yoeMin}–${filters.yoeMax} yrs`}>
          <RangeSlider min={0} max={25} value={[filters.yoeMin, filters.yoeMax]} onChange={v => setFilters({ ...filters, yoeMin: v[0], yoeMax: v[1] })} format={v => `${v}y`} />
        </Field>
        <Field label="Location">
          <MultiSelectChips options={["Nashville", "Remote", "Austin", "Atlanta", "New York"]} selected={filters.locations} onChange={v => setFilters({ ...filters, locations: v })} />
        </Field>
        <Field label="Stage fit">
          <MultiSelectChips options={STAGE_OPTIONS.slice(0, 4)} selected={filters.stages} onChange={v => setFilters({ ...filters, stages: v })} />
        </Field>
        <Field label="Top skills">
          <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
            {popularSkills.map(s => (
              <button key={s} onClick={() => setFilters({ ...filters, skills: toggle(filters.skills, s) })}
                      className={`px-2 py-0.5 text-[10px] rounded-full border transition ${filters.skills.includes(s) ? "bg-yellow-400 border-yellow-400 text-black font-bold" : "bg-white border border-stone-300 text-stone-700"}`}>
                {s}
              </button>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={filters.vettedOnly} onChange={e => setFilters({ ...filters, vettedOnly: e.target.checked })} className="accent-yellow-400" />
          <span className="text-stone-700">Only Zap-vetted candidates</span>
        </label>
      </Card>
      <Card>
        <button onClick={() => setArchetypeOpen(!archetypeOpen)} className="w-full text-left flex items-center justify-between text-xs uppercase tracking-wider text-stone-500 font-bold">
          <span>Archetype filter <Tag color="purple">OPTIONAL</Tag></span>
          {archetypeOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {archetypeOpen && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(ARCHETYPES).filter(([k]) => k !== "Balanced").map(([k, a]) => (
                <button key={k} onClick={() => setFilters({ ...filters, archetypes: toggle(filters.archetypes, k) })}
                        className={`p-2 rounded-lg text-xs text-left border transition ${filters.archetypes.includes(k) ? "border-yellow-400 bg-yellow-100" : "border-stone-200 hover:border-stone-300"}`}>
                  <div className="text-base">{a.icon}</div>
                  <div className="font-bold">{k}</div>
                  <div className="text-stone-500 text-[10px]">{a.short}</div>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={filters.assessmentOnly} onChange={e => setFilters({ ...filters, assessmentOnly: e.target.checked })} className="accent-yellow-400" />
              <span className="text-stone-700">Only candidates who completed assessment</span>
            </label>
          </div>
        )}
      </Card>
    </div>
  );
}

function CandidateCard({ candidate, score, breakdown, interp, onOpenProfile, onShortlist, shortlists }) {
  const [showShort, setShowShort] = useState(false);
  return (
    <Card className="hover:border-yellow-300 transition">
      <div className="flex gap-4">
        <Avatar candidate={candidate} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold text-lg truncate">{candidate.firstName} {candidate.lastName}</div>
                {candidate.archetype && <ArchetypeBadge quad={candidate.archetype} />}
              </div>
              <div className="text-sm text-stone-500 truncate">{candidate.currentRole} {candidate.currentCompany && `· ${candidate.currentCompany}`}</div>
              <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-3 flex-wrap">
                <span><Clock size={10} className="inline mr-0.5" /> {candidate.yearsExperience} yrs</span>
                <span><MapPin size={10} className="inline mr-0.5" /> {candidate.location}</span>
                {candidate.salary && !candidate.salary.optOut && <span><DollarSign size={10} className="inline" />{candidate.salary.min}–{candidate.salary.max}K</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-amber-500 tabular-nums leading-none">{score}</div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mt-0.5 group relative">
                match
                <div className="absolute right-0 top-5 w-56 bg-white border border-stone-300 rounded-lg p-2 text-xs text-left text-stone-700 hidden group-hover:block z-20 shadow-xl">
                  <div className="font-bold text-amber-500 mb-1">Score breakdown</div>
                  <div>Semantic match: {breakdown?.semantic}</div>
                  <div>Filter match: {breakdown?.filter}</div>
                  <div>Recency: {breakdown?.recency}</div>
                  {breakdown?.archetype > 0 && <div className="text-violet-300">Archetype bonus: +{breakdown.archetype}</div>}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {candidate.skills.slice(0, 4).map(s => <Tag key={s}>{s}</Tag>)}
            {candidate.skills.length > 4 && <span className="text-xs text-stone-500">+{candidate.skills.length - 4}</span>}
          </div>
          <div className="text-sm text-stone-700 mt-2 italic line-clamp-2">{explainMatch(candidate, interp)}</div>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" icon={Coffee} onClick={() => alert("Mock: drafting an intro for Zap...")}>Request intro</Button>
            <div className="relative">
              <Button size="sm" variant="secondary" icon={Star} onClick={() => setShowShort(!showShort)}>Save</Button>
              {showShort && (
                <div className="absolute top-9 right-0 w-56 bg-white border border-stone-300 rounded-lg p-2 z-30 shadow-xl">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">Save to shortlist</div>
                  {shortlists.length === 0 && <div className="text-xs text-stone-500 p-2">No shortlists yet.</div>}
                  {shortlists.map(s => (
                    <button key={s.id} onClick={() => { onShortlist(s.id); setShowShort(false); }}
                            className="w-full text-left text-xs p-2 hover:bg-stone-100 rounded">
                      {s.name} <span className="text-stone-500">({s.candidateIds.length})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button size="sm" variant="ghost" icon={Eye} onClick={onOpenProfile}>View profile</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CandidateProfileView({ candidate, onBack, interp, onShortlist, shortlists }) {
  const [showShort, setShowShort] = useState(false);
  if (!candidate) return null;
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={onBack}>Back to results</Button>
      <Card className="!p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar candidate={candidate} size={80} />
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-3xl font-black font-display">{candidate.firstName} {candidate.lastName}</div>
              {candidate.archetype && <ArchetypeBadge quad={candidate.archetype} size="lg" />}
            </div>
            <div className="text-stone-500">{candidate.currentRole} · {candidate.currentCompany}</div>
            <div className="flex gap-3 mt-2 text-xs text-stone-500">
              <span><Clock size={11} className="inline mr-0.5" /> {candidate.yearsExperience} yrs</span>
              <span><MapPin size={11} className="inline mr-0.5" /> {candidate.location}</span>
              {candidate.salary && !candidate.salary.optOut && <span><DollarSign size={11} className="inline" />{candidate.salary.min}–{candidate.salary.max}K</span>}
            </div>
          </div>
          <div className="text-right">
            <Button icon={Coffee}>Request intro</Button>
            <div className="text-xs text-stone-500 mt-1">via Zap, with context</div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Background</div>
            <div className="text-sm">
              <div className="font-bold mb-2">Work history</div>
              <div className="space-y-2">
                {candidate.workHistory.map((w, i) => (
                  <div key={i} className="border-l-2 border-stone-200 pl-3">
                    <div className="font-semibold text-black">{w.title}</div>
                    <div className="text-stone-500 text-xs">{w.company} · {w.startYear}–{w.endYear}</div>
                  </div>
                ))}
              </div>
              <div className="font-bold mt-4 mb-2">Education</div>
              <div className="space-y-1">
                {candidate.education.map((e, i) => (
                  <div key={i} className="text-stone-700 text-sm">
                    <span className="font-semibold">{e.school}</span> · {e.degree} · {e.year}
                  </div>
                ))}
              </div>
              <div className="font-bold mt-4 mb-2">Skills</div>
              <div className="flex flex-wrap gap-1">{candidate.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Their story</div>
            <div className="space-y-3 text-sm">
              <div><div className="font-bold text-stone-900">Why startup?</div><div className="text-stone-700 mt-0.5">{candidate.whyStartup || "—"}</div></div>
              <div><div className="font-bold text-stone-900">What roles they want</div><div className="text-stone-700 mt-0.5">{candidate.roleSummary || "—"}</div></div>
              {candidate.biggestStrength && <div><div className="font-bold text-stone-900">Biggest strength</div><div className="text-stone-700 mt-0.5">{candidate.biggestStrength}</div></div>}
              {candidate.superpower && <div><div className="font-bold text-stone-900">Superpower outside work</div><div className="text-stone-700 mt-0.5 italic">"{candidate.superpower}"</div></div>}
              {candidate.proudShipped && candidate.proudShipped.length > 0 && (
                <div><div className="font-bold text-stone-900">Most proud of shipping</div>
                  <ul className="text-stone-700 mt-0.5 list-disc pl-4 space-y-0.5">{candidate.proudShipped.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
              )}
            </div>
          </Card>
          {candidate.vibe && (
            <Card>
              <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Vibe check</div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><div className="text-stone-500 text-xs">Nerds out about</div><div className="text-stone-900">{candidate.vibe.nerdAbout || "—"}</div></div>
                <div><div className="text-stone-500 text-xs">Manager's 3 words</div><div className="text-stone-900">{Array.isArray(candidate.vibe.managerWords) ? candidate.vibe.managerWords.join(", ") : (candidate.vibe.managerWords || "—")}</div></div>
                <div><div className="text-stone-500 text-xs">Future-self joke</div><div className="text-stone-900 italic">"{candidate.vibe.futureSelfJoke || "—"}"</div></div>
                <div><div className="text-stone-500 text-xs">Karaoke song</div><div className="text-stone-900">🎵 {candidate.vibe.karaoke || "—"}</div></div>
              </div>
            </Card>
          )}
          {candidate.archetype && candidate.archetypeXY && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs uppercase tracking-wider text-stone-500 font-bold">Archetype profile <Tag color="purple">OPTIONAL</Tag></div>
                <ArchetypeBadge quad={candidate.archetype} size="lg" />
              </div>
              <ArchetypePlot candidates={DATA_BUNDLE.candidates.filter(c => c.hasAssessment)} highlight={candidate} height={280} />
              {candidate.archetypeScores && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {ARCHETYPE_STATEMENTS.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 border-l-2 border-yellow-300 pl-2">
                      <span className="font-bold text-amber-500 tabular-nums">{candidate.archetypeScores[i]}</span>
                      <span className="text-stone-500 line-clamp-1">{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">What they're looking for</div>
            <div className="space-y-2 text-sm">
              <div><span className="text-stone-500 text-xs">Stage</span><div className="flex flex-wrap gap-1 mt-1">{candidate.stagePreference.map(s => <Tag key={s} color="green">{s}</Tag>)}</div></div>
              <div><span className="text-stone-500 text-xs">Role types</span><div className="flex flex-wrap gap-1 mt-1">{candidate.roleTypes.map(s => <Tag key={s}>{s}</Tag>)}</div></div>
              <div><span className="text-stone-500 text-xs">Work mode</span><div><Tag>{candidate.workMode}</Tag></div></div>
              <div><span className="text-stone-500 text-xs">Timing</span><div><Tag color="orange">{candidate.timing}</Tag></div></div>
              <div><span className="text-stone-500 text-xs">Salary</span><div className="text-stone-900">{candidate.salary?.optOut ? "Prefers to discuss" : `$${candidate.salary?.min}–${candidate.salary?.max}K`}</div></div>
            </div>
          </Card>
          <Card className="border-violet-200">
            <div className="text-xs uppercase tracking-wider text-violet-700 font-bold mb-2">Zap's notes</div>
            <div className="text-sm text-stone-700">Zap met {candidate.firstName} in person on {candidate.dateApplied}. Vetting notes available on request.</div>
          </Card>
          <div className="space-y-2">
            <div className="relative">
              <Button className="w-full" icon={Star} variant="secondary" onClick={() => setShowShort(!showShort)}>Save to shortlist</Button>
              {showShort && (
                <div className="absolute top-12 left-0 right-0 bg-white border border-stone-300 rounded-lg p-2 z-30 shadow-xl">
                  {shortlists.length === 0 && <div className="text-xs text-stone-500 p-2">No shortlists yet.</div>}
                  {shortlists.map(s => (
                    <button key={s.id} onClick={() => { onShortlist(s.id); setShowShort(false); }}
                            className="w-full text-left text-xs p-2 hover:bg-stone-100 rounded">
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button className="w-full" variant="ghost" icon={X}>Pass</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeepDive({ onComplete, onSkip }) {
  const [stage, setStage] = useState("intro"); // intro | skill | culture | done
  const [skillScores, setSkillScores] = useState(Array(12).fill(5));
  const [cultureScores, setCultureScores] = useState(Array(12).fill(5));
  const [page, setPage] = useState(0);
  const [skipSkill, setSkipSkill] = useState(false);
  const [skipCulture, setSkipCulture] = useState(false);

  if (stage === "intro") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <Tag color="purple"><Sparkles size={12} /> POWER USER MODE</Tag>
        <h2 className="text-4xl font-black font-display">Make it perfect.</h2>
        <p className="text-stone-700 text-lg">Two short assessments — one about what you really need in this role, one about your culture. Either is optional.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Card className="hover:border-yellow-300 cursor-pointer" onClick={() => setStage("skill")}>
            <BarChart3 className="text-amber-500 mb-3" />
            <div className="font-bold text-lg">A: Skill Spec</div>
            <div className="text-sm text-stone-500 mt-1">12 statements about what you're really hiring for. Re-weights match scores.</div>
          </Card>
          <Card className="hover:border-violet-400/40 cursor-pointer" onClick={() => setStage("culture")}>
            <Users className="text-violet-700 mb-3" />
            <div className="font-bold text-lg">B: Culture</div>
            <div className="text-sm text-stone-500 mt-1">12 statements about how you work. Adds a culture-fit subscore.</div>
          </Card>
        </div>
        <div className="flex justify-between pt-4">
          <Button variant="skip" onClick={onSkip}>Skip both, back to results</Button>
        </div>
      </div>
    );
  }
  if (stage === "skill" || stage === "culture") {
    const isCulture = stage === "culture";
    const statements = isCulture ? COMPANY_STATEMENTS_B : COMPANY_STATEMENTS_A;
    const scores = isCulture ? cultureScores : skillScores;
    const setScores = isCulture ? setCultureScores : setSkillScores;
    const start = page * 4;
    const slice = statements.slice(start, start + 4);
    const totalPages = Math.ceil(statements.length / 4);
    function setScore(idx, val) {
      const real = start + idx;
      const next = [...scores]; next[real] = val; setScores(next);
    }
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <Tag color={isCulture ? "purple" : "yellow"}>{isCulture ? "Culture" : "Skill Spec"} · page {page + 1}/{totalPages}</Tag>
          <ProgressBar value={page + 1} max={totalPages} />
        </div>
        <div className="space-y-6">
          {slice.map((s, i) => (
            <Card key={i}>
              <div className="text-lg font-bold mb-4 text-center">{s}</div>
              <Slider value={scores[start + i]} onChange={v => setScore(i, v)} />
            </Card>
          ))}
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" icon={ChevronLeft} onClick={() => page === 0 ? setStage("intro") : setPage(page - 1)}>Back</Button>
          {page < totalPages - 1
            ? <Button onClick={() => setPage(page + 1)} icon={ArrowRight}>Continue</Button>
            : <Button onClick={() => {
                if (isCulture) {
                  onComplete(skipSkill ? null : skillScores, cultureScores);
                } else {
                  setStage("culture"); setPage(0);
                }
              }} icon={ArrowRight}>{isCulture ? "Re-rank candidates" : "Continue to culture"}</Button>}
        </div>
        {!isCulture && page === totalPages - 1 && (
          <div className="text-center text-sm">
            <button onClick={() => { setSkipSkill(true); setStage("culture"); setPage(0); }} className="text-stone-500 hover:text-amber-500 underline underline-offset-4">
              Skip this assessment
            </button>
          </div>
        )}
        {isCulture && page === totalPages - 1 && (
          <div className="text-center text-sm">
            <button onClick={() => onComplete(skipSkill ? null : skillScores, null)} className="text-stone-500 hover:text-amber-500 underline underline-offset-4">
              Skip culture, just use skill spec
            </button>
          </div>
        )}
      </div>
    );
  }
  return null;
}

function ShortlistsView({ shortlists, setShortlists, onOpenCandidate }) {
  const [active, setActive] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  function createNew() {
    if (!newName.trim()) return;
    setShortlists(sls => [...sls, { id: Date.now(), companyId: shortlists[0]?.companyId || 5, name: newName, candidateIds: [], createdAt: new Date().toISOString().slice(0, 10), notes: "" }]);
    setNewName(""); setCreating(false);
  }
  if (active) {
    const sl = shortlists.find(s => s.id === active);
    if (!sl) return null;
    return (
      <div className="space-y-4">
        <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={() => setActive(null)}>Back to shortlists</Button>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">{sl.name}</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={Send}>Share with team</Button>
            <Button size="sm" icon={Coffee}>Request intros for all</Button>
          </div>
        </div>
        <div className="space-y-2">
          {sl.candidateIds.map(id => {
            const c = DATA_BUNDLE.candidates.find(c => c.id === id);
            if (!c) return null;
            return (
              <Card key={id} onClick={() => onOpenCandidate(id)}>
                <div className="flex items-center gap-3">
                  <Avatar candidate={c} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{c.firstName} {c.lastName}</div>
                    <div className="text-xs text-stone-500 truncate">{c.currentRole} · {c.location}</div>
                  </div>
                  {c.archetype && <ArchetypeBadge quad={c.archetype} />}
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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black font-display">My Shortlists</h2>
        <Button icon={Plus} onClick={() => setCreating(true)}>New shortlist</Button>
      </div>
      {creating && (
        <Card className="border-yellow-300">
          <Field label="Shortlist name" required><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="VP Eng top 5" /></Field>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={createNew}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </Card>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shortlists.map(s => (
          <Card key={s.id} onClick={() => setActive(s.id)}>
            <div className="font-bold text-lg">{s.name}</div>
            <div className="text-xs text-stone-500 mt-1">{s.candidateIds.length} candidates · {s.createdAt}</div>
            {s.notes && <div className="text-xs text-stone-500 mt-2 italic">"{s.notes}"</div>}
            <div className="flex -space-x-2 mt-3">
              {s.candidateIds.slice(0, 5).map(id => {
                const c = DATA_BUNDLE.candidates.find(c => c.id === id);
                if (!c) return null;
                return <div key={id} className="ring-2 ring-white rounded-full"><Avatar candidate={c} size={28} /></div>;
              })}
            </div>
          </Card>
        ))}
        {shortlists.length === 0 && <Card className="text-center py-8"><Star className="text-stone-500 mx-auto mb-2" /><div className="text-sm">No shortlists yet</div></Card>}
      </div>
    </div>
  );
}

function SavedSearchesView({ searches, onRunSearch, setSearches, onNewSearch }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQuery, setNewQuery] = useState("");
  function save() {
    if (!newName.trim() || !newQuery.trim()) return;
    setSearches(arr => [...arr, {
      id: Date.now(), companyId: arr[0]?.companyId || 5,
      name: newName, query: newQuery,
      createdAt: new Date().toISOString().slice(0,10), results: 0,
    }]);
    setNewName(""); setNewQuery(""); setCreating(false);
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-3xl">My Searches</h2>
          <div className="text-xs text-stone-500 mt-1">{searches.length} saved · re-runs fresh on open</div>
        </div>
        <div className="flex gap-2">
          {onNewSearch && <Button icon={Search} onClick={onNewSearch}>Run a new search</Button>}
          <Button variant="secondary" icon={Plus} onClick={() => setCreating(!creating)}>+ New saved search</Button>
        </div>
      </div>
      {creating && (
        <Card className="border-amber-300 bg-yellow-50/40">
          <div className="text-xs uppercase tracking-wider text-amber-700 font-bold mb-2">New saved search</div>
          <div className="space-y-3">
            <Field label="Name this search" required><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Founding engineers, Series A" /></Field>
            <Field label="Search query" hint="Plain English. Same syntax as the AI search box." required>
              <Textarea rows={3} value={newQuery} onChange={e => setNewQuery(e.target.value)} placeholder="Founding engineer with ML infra background, comfortable being hands-on for 6 months..." />
            </Field>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={!newName.trim() || !newQuery.trim()}>Save search</Button>
              <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setNewName(""); setNewQuery(""); }}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}
      <Card padded={false}>
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500">
            <tr><th className="text-left p-3">Name</th><th className="text-left p-3 hidden sm:table-cell">Query</th><th className="text-left p-3 hidden md:table-cell">Saved</th><th className="text-left p-3">Results</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {searches.map(s => (
              <tr key={s.id} className="border-b border-stone-200 hover:bg-stone-50 cursor-pointer" onClick={() => onRunSearch(s.query)}>
                <td className="p-3 font-bold">{s.name}</td>
                <td className="p-3 text-xs text-stone-500 line-clamp-2 hidden sm:table-cell max-w-md">{s.query}</td>
                <td className="p-3 text-xs text-stone-500 hidden md:table-cell">{s.createdAt}</td>
                <td className="p-3 text-sm tabular-nums">{s.results || "—"}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" icon={Search} onClick={(e) => { e.stopPropagation(); onRunSearch(s.query); }}>Run</Button>
                </td>
              </tr>
            ))}
            {searches.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-stone-500 text-sm">No saved searches yet. Hit "+ New saved search" or save a query as you run it.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// ADMIN VIEW
// ============================================================
function AdminPortal({ onExit }) {
  const [view, setView] = useState("database");
  const [activeId, setActiveId] = useState(null);
  const [candidates, setCandidates] = useState(DATA_BUNDLE.candidates);
  const [showSubMenu, setShowSubMenu] = useState(false);

  function updateCandidate(id, patch) {
    setCandidates(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  return (
    <div className="min-h-screen bg-white text-black flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-stone-200 p-4 flex-shrink-0 space-y-1 hidden md:block">
        <button onClick={onExit} className="flex items-center gap-2 mb-6 hover:text-amber-500">
          <Zap className="text-amber-500 fill-yellow-400" size={18} />
          <span className="font-black">Lighthouse</span>
          <span className="text-stone-500 text-xs">Admin</span>
        </button>
        <div className="text-[10px] uppercase tracking-wider text-stone-400 font-bold pt-2 pb-1 px-2">Existing</div>
        {[
          ["💬", "Applications"], ["👥", "Founders"], ["💼", "Companies"], ["💰", "Investors"],
        ].map(([i, l]) => (
          <div key={l} className="px-2 py-1.5 text-sm text-stone-500 cursor-default">{i}  {l}</div>
        ))}
        <div className="text-[10px] uppercase tracking-wider text-amber-500 font-bold pt-3 pb-1 px-2">Talent</div>
        {[
          { k: "database", l: "Database", icon: Database },
          { k: "applications", l: "Pending", icon: KanbanSquare },
          { k: "jobBoard", l: "Job Board", icon: Briefcase },
          { k: "investors", l: "Investors", icon: Building2 },
          { k: "archetypeMap", l: "Archetype Map", icon: Map },
          { k: "resources", l: "Resources", icon: FileText },
          { k: "hiringRequests", l: "Hiring Requests", icon: BookOpenCheck },
          { k: "settings", l: "Settings", icon: Settings },
        ].map(it => (
          <button key={it.k} onClick={() => setView(it.k)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition ${view === it.k ? "bg-yellow-100 text-amber-500" : "text-stone-700 hover:bg-white border border-stone-200"}`}>
            <it.icon size={14} /> {it.l}
            {it.k === "archetypeMap" && <Tag color="purple" size="sm">opt</Tag>}
          </button>
        ))}
        <div className="text-[10px] uppercase tracking-wider text-stone-400 font-bold pt-3 pb-1 px-2">Other</div>
        {[
          ["📨", "Emails"], ["⚙️", "Settings"]
        ].map(([i, l]) => (
          <div key={l} className="px-2 py-1.5 text-sm text-stone-500 cursor-default">{i}  {l}</div>
        ))}
      </aside>
      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="border-b border-stone-200 px-6 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-amber-500 font-bold">🎯 Talent</span>
            <span className="text-stone-500 mx-2">/</span>
            <span className="font-semibold">{
              { database: "Database", applications: "Pending Applications", archetypeMap: "Archetype Map", hiringRequests: "Hiring Requests", settings: "Settings", profile: "Candidate" }[view]
            }</span>
          </div>
          <div className="flex items-center gap-3">
            <Bell size={16} className="text-stone-500" />
            <div className="text-xs text-stone-500">Zap</div>
            <Button variant="ghost" size="sm" icon={LogOut} onClick={onExit}>Exit</Button>
          </div>
        </div>
        <div className="p-6">
          {view === "database" && <AdminDatabase candidates={candidates} onOpen={(id) => { setActiveId(id); setView("profile"); }} />}
          {view === "applications" && <AdminPending candidates={candidates} onOpen={(id) => { setActiveId(id); setView("profile"); }} updateCandidate={updateCandidate} />}
          {view === "archetypeMap" && <AdminArchetypeMap candidates={candidates} onOpen={(id) => { setActiveId(id); setView("profile"); }} />}
          {view === "hiringRequests" && <AdminHiring />}
          {view === "jobBoard" && <AdminJobBoard onOpenCandidate={(id) => { setActiveId(id); setView("profile"); }} />}
          {view === "resources" && <ResourcesView audience="all" onExit={onExit} />}
          {view === "investors" && <AdminInvestorsView />}
          {view === "settings" && <AdminSettings />}
          {view === "profile" && (
            <AdminCandidateProfile
              candidate={candidates.find(c => c.id === activeId)}
              onBack={() => setView("database")}
              updateCandidate={updateCandidate}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function AdminDatabase({ candidates, onOpen }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterArch, setFilterArch] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "dateApplied", dir: "desc" });

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      if (filterStatus !== "all" && c.vettingStatus !== filterStatus) return false;
      if (filterArch !== "all" && c.archetype !== filterArch) return false;
      if (search) {
        const s = search.toLowerCase();
        return (c.firstName + " " + c.lastName + " " + c.currentRole + " " + c.skills.join(" ")).toLowerCase().includes(s);
      }
      return true;
    }).sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const av = a[sort.key] || ""; const bv = b[sort.key] || "";
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [candidates, filterStatus, filterArch, search, sort]);

  const counts = useMemo(() => {
    const o = {};
    candidates.forEach(c => { o[c.vettingStatus] = (o[c.vettingStatus] || 0) + 1; });
    return o;
  }, [candidates]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black">Talent Database</h2>
          <div className="text-xs text-stone-500">{candidates.length} candidates total</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search name, role, skills..." value={search} onChange={e => setSearch(e.target.value)} className="text-xs w-56" />
          <Select value={filterStatus} onChange={setFilterStatus} className="text-xs w-auto"
            options={[
              { value: "all", label: "All statuses" },
              { value: "Active", label: `Active (${counts.Active || 0})` },
              { value: "New", label: `New (${counts.New || 0})` },
              { value: "Reviewing", label: `Reviewing (${counts.Reviewing || 0})` },
              { value: "Vetting Call Scheduled", label: `Vetting Scheduled (${counts["Vetting Call Scheduled"] || 0})` },
              { value: "Hidden", label: `Hidden (${counts.Hidden || 0})` },
              { value: "Declined", label: `Declined (${counts.Declined || 0})` },
            ]} />
          <Select value={filterArch} onChange={setFilterArch} className="text-xs w-auto"
            options={[{ value: "all", label: "All archetypes" }, ...Object.keys(ARCHETYPES).map(k => ({ value: k, label: `${ARCHETYPES[k].icon} ${k}` }))]} />
        </div>
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
            <tr>
              <SortHeader sortKey="lastName" label="Name" sort={sort} setSort={setSort} />
              <SortHeader sortKey="currentRole" label="Role" sort={sort} setSort={setSort} />
              <th className="text-left p-3">Archetype</th>
              <SortHeader sortKey="dateApplied" label="Applied" sort={sort} setSort={setSort} />
              <SortHeader sortKey="vettingStatus" label="Status" sort={sort} setSort={setSort} />
              <th className="text-left p-3">Activity</th>
              <th className="text-center p-3">Intros</th>
              <th className="text-center p-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map(c => (
              <tr key={c.id} onClick={() => onOpen(c.id)} className="border-b border-stone-200 hover:bg-stone-50 border border-stone-200 cursor-pointer">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Avatar candidate={c} size={28} />
                    <div className="font-bold">{c.firstName} {c.lastName}</div>
                  </div>
                </td>
                <td className="p-3 text-stone-700 max-w-xs truncate">{c.currentRole}</td>
                <td className="p-3">{c.archetype ? <ArchetypeBadge quad={c.archetype} /> : <span className="text-stone-400">—</span>}</td>
                <td className="p-3 text-xs text-stone-500">{c.dateApplied}</td>
                <td className="p-3"><StatusPill status={c.vettingStatus} /></td>
                <td className="p-3 text-xs text-stone-500">{c.lastActivity}</td>
                <td className="p-3 text-center text-sm tabular-nums">{c.introRequests}</td>
                <td className="p-3 text-center">{c.placements > 0 && <span className="text-emerald-600 text-lg">✓</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length > 100 && <div className="p-3 text-center text-xs text-stone-500">Showing 100 of {filtered.length} candidates. Refine filters to see more.</div>}
      </Card>
    </div>
  );
}

function SortHeader({ sortKey, label, sort, setSort }) {
  return (
    <th className="text-left p-3 cursor-pointer select-none" onClick={() => setSort({ key: sortKey, dir: sort.key === sortKey && sort.dir === "asc" ? "desc" : "asc" })}>
      <span className="inline-flex items-center gap-1">{label} {sort.key === sortKey && (sort.dir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}</span>
    </th>
  );
}

function StatusPill({ status }) {
  const map = {
    "Active": ["green", "Live"], "New": ["yellow", "New"], "Reviewing": ["blue", "Reviewing"],
    "Vetting Call Scheduled": ["orange", "Vetting"], "Hidden": ["light", "Hidden"], "Declined": ["red", "Declined"],
  };
  const [color, label] = map[status] || ["default", status];
  return <Tag color={color}>{label}</Tag>;
}

function AdminPending({ candidates, onOpen, updateCandidate }) {
  const cols = ["New", "Reviewing", "Vetting Call Scheduled", "Active", "Declined"];
  const labels = { "New": "New", "Reviewing": "Reviewing", "Vetting Call Scheduled": "Vetting Call", "Active": "Approved", "Declined": "Declined" };
  const [drag, setDrag] = useState(null);

  function moveStatus(id, newStatus) { updateCandidate(id, { vettingStatus: newStatus }); }

  return (
    <div>
      <h2 className="text-2xl font-black mb-1">Pending Applications</h2>
      <div className="text-xs text-stone-500 mb-4">Drag candidates through the pipeline. Click a card for the full admin profile.</div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {cols.map(col => {
          const list = candidates.filter(c => c.vettingStatus === col);
          return (
            <div key={col}
                 onDragOver={e => e.preventDefault()}
                 onDrop={() => { if (drag) { moveStatus(drag, col); setDrag(null); } }}
                 className="bg-stone-50 border border-stone-200 rounded-xl p-3 min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-wider font-bold text-stone-700">{labels[col]}</div>
                <Tag>{list.length}</Tag>
              </div>
              <div className="space-y-2">
                {list.slice(0, 25).map(c => (
                  <div key={c.id} draggable onDragStart={() => setDrag(c.id)} onClick={() => onOpen(c.id)}
                       className="bg-white border border-stone-200 rounded-lg p-2 cursor-pointer hover:border-yellow-300">
                    <div className="flex items-center gap-2">
                      <Avatar candidate={c} size={26} />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate">{c.firstName} {c.lastName}</div>
                        <div className="text-[10px] text-stone-500 truncate">{c.currentRole}</div>
                      </div>
                    </div>
                    {c.archetype && <div className="mt-1.5"><ArchetypeBadge quad={c.archetype} /></div>}
                  </div>
                ))}
                {list.length > 25 && <div className="text-center text-[10px] text-stone-500 pt-2">+{list.length - 25} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminCandidateProfile({ candidate, onBack, updateCandidate }) {
  if (!candidate) return null;
  const [notes, setNotes] = useState(candidate.adminNotes || "");
  const [vetting, setVetting] = useState(candidate.vettingStatus);
  const [hidden, setHidden] = useState(candidate.vettingStatus === "Hidden");

  function save() { updateCandidate(candidate.id, { adminNotes: notes, vettingStatus: vetting }); alert("Saved."); }

  return (
    <div className="space-y-4">
      <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={onBack}>Back to database</Button>
      <Card>
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar candidate={candidate} size={64} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-2xl font-black">{candidate.firstName} {candidate.lastName}</div>
              {candidate.archetype && <ArchetypeBadge quad={candidate.archetype} />}
              <StatusPill status={candidate.vettingStatus} />
            </div>
            <div className="text-stone-500 text-sm">{candidate.currentRole} · {candidate.currentCompany}</div>
            <div className="text-xs text-stone-500 mt-1 flex flex-wrap gap-3">
              <span><Mail size={11} className="inline mr-0.5" /> {candidate.email}</span>
              <span><Phone size={11} className="inline mr-0.5" /> {candidate.phone}</span>
              <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="hover:text-amber-500"><Linkedin size={11} className="inline mr-0.5" /> LinkedIn</a>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <Button size="sm" variant="secondary" icon={Mail}>Email this candidate</Button>
            <Button size="sm" variant="ghost" icon={Edit3}>Edit fields</Button>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Their submission</div>
            <div className="space-y-3 text-sm">
              <div><div className="font-bold">Why startup?</div><div className="text-stone-700">{candidate.whyStartup}</div></div>
              <div><div className="font-bold">Roles wanted</div><div className="text-stone-700">{candidate.roleSummary}</div></div>
              <div><div className="font-bold">Has prior startup exp?</div><div className="text-stone-700">{candidate.startupExperience ? "Yes" : "No"}</div></div>
              {candidate.vibe && <div><div className="font-bold">Karaoke</div><div className="text-stone-700">🎵 {candidate.vibe.karaoke}</div></div>}
            </div>
          </Card>
          {candidate.archetype && candidate.archetypeXY && (
            <Card>
              <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Archetype profile</div>
              <ArchetypePlot candidates={DATA_BUNDLE.candidates.filter(c => c.hasAssessment)} highlight={candidate} height={260} />
            </Card>
          )}
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Skills & history</div>
            <div className="flex flex-wrap gap-1 mb-3">{candidate.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
            <div className="space-y-1.5 text-xs">
              {candidate.workHistory.map((w, i) => <div key={i} className="text-stone-700"><b>{w.title}</b> @ {w.company} <span className="text-stone-500">({w.startYear}–{w.endYear})</span></div>)}
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="border-violet-300">
            <div className="text-xs uppercase tracking-wider text-violet-700 font-bold mb-2 flex items-center gap-1"><Shield size={12} /> Zap's private notes</div>
            <Textarea rows={6} value={notes} onChange={e => setNotes(e.target.value)} className="text-xs" placeholder="Vetting notes, growth areas, red flags..." />
            <div className="text-[10px] text-stone-500 mt-1">Visible to Zap and Mike only. Never shown to companies.</div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Vetting status</div>
            <Select value={vetting} onChange={setVetting} options={["New", "Reviewing", "Vetting Call Scheduled", "Active", "Hidden", "Declined"]} />
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Activity</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-stone-500">Intro requests</span><span className="font-bold">{candidate.introRequests}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Placements</span><span className="font-bold">{candidate.placements}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Last activity</span><span>{candidate.lastActivity}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">Date applied</span><span>{candidate.dateApplied}</span></div>
            </div>
          </Card>
          <Button className="w-full" onClick={save} icon={Save}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}

function AdminArchetypeMap({ candidates, onOpen }) {
  const [filter, setFilter] = useState({ skill: "", yoeMin: 0 });
  const filtered = candidates.filter(c => c.hasAssessment && c.yearsExperience >= filter.yoeMin && (filter.skill ? c.skills.some(s => s.toLowerCase().includes(filter.skill.toLowerCase())) : true));

  // Insights
  const distribution = filtered.reduce((acc, c) => { acc[c.archetype] = (acc[c.archetype] || 0) + 1; return acc; }, {});
  const insights = [];
  const max = Math.max(...Object.values(distribution));
  const min = Math.min(...Object.values(distribution));
  for (const [k, v] of Object.entries(distribution)) {
    if (v === max) insights.push(`Lots of ${k}s (${v}). Strong supply.`);
    if (v === min) insights.push(`Few ${k}s (${v}). Consider sourcing more.`);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black">Archetype Map</h2>
          <div className="text-xs text-stone-500">{filtered.length} of {candidates.length} candidates have completed the assessment.</div>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Filter by skill..." value={filter.skill} onChange={e => setFilter({ ...filter, skill: e.target.value })} className="text-xs w-40" />
          <Select value={filter.yoeMin} onChange={v => setFilter({ ...filter, yoeMin: +v })} className="text-xs w-auto"
            options={[{ value: 0, label: "Any experience" }, { value: 3, label: "3+ years" }, { value: 7, label: "7+ years" }, { value: 12, label: "12+ years" }]} />
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_280px] gap-4 mt-4">
        <Card>
          <ArchetypePlot candidates={filtered} height={520} />
        </Card>
        <div className="space-y-3">
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Distribution</div>
            <div className="space-y-2">
              {Object.entries(ARCHETYPES).filter(([k]) => k !== "Balanced").map(([k, a]) => {
                const v = distribution[k] || 0;
                const pct = filtered.length ? Math.round((v / filtered.length) * 100) : 0;
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs"><span>{a.icon} {k}</span><span className="font-bold">{v}</span></div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mt-1"><div className="h-full" style={{ width: pct + "%", background: a.color }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="border-yellow-300">
            <div className="text-xs uppercase tracking-wider text-amber-500 font-bold mb-2 flex items-center gap-1"><Sparkles size={12} /> Insights</div>
            <ul className="space-y-1 text-xs text-stone-700">
              {insights.map((s, i) => <li key={i} className="leading-relaxed">• {s}</li>)}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AdminHiring() {
  const reqs = DATA_BUNDLE.savedSearches.map(s => {
    const c = DATA_BUNDLE.companies.find(x => x.id === s.companyId);
    return { ...s, company: c };
  });
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Hiring Requests</h2>
      <Card padded={false}>
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
            <tr><th className="text-left p-3">Company</th><th className="text-left p-3">Search</th><th className="text-left p-3">Stage</th><th className="text-left p-3">Last update</th><th className="text-center p-3">Results</th></tr>
          </thead>
          <tbody>
            {reqs.map(r => (
              <tr key={r.id} className="border-b border-stone-200 hover:bg-stone-50 border border-stone-200">
                <td className="p-3 font-bold">{r.company.name}</td>
                <td className="p-3 text-stone-700">{r.name}</td>
                <td className="p-3"><Tag color="green">{r.company.stage}</Tag></td>
                <td className="p-3 text-xs text-stone-500">{r.createdAt}</td>
                <td className="p-3 text-center font-bold">{r.results}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <h3 className="text-lg font-bold mt-6">Intro requests pending review</h3>
      <Card><div className="text-sm text-stone-500">3 intros pending Zap's review. Each gets a personal warm intro — no auto-pings.</div></Card>
    </div>
  );
}

function AdminSettings() {
  const [autoPublish, setAutoPublish] = useState(false);
  const [mockDataEnabled, setMockDataEnabled] = useState(true);
  const [outboundEmailMode, setOutboundEmailMode] = useState("disabled"); // disabled | test_mode | enabled
  const [requiredFields, setRequiredFields] = useState(["firstName", "email", "currentRole", "skills"]);
  const allFields = ["firstName", "lastName", "email", "phone", "linkedin", "currentRole", "currentCompany", "yearsExperience", "location", "skills", "salary", "stagePreference"];

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl">Talent Settings</h2>
      <Card className={mockDataEnabled ? "border-yellow-300 bg-yellow-50/40" : ""}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-700 font-bold mb-1 flex items-center gap-2">
              <Sparkles size={12} /> Demo / mock data
            </div>
            <div className="text-sm text-stone-700">
              {mockDataEnabled
                ? <>Demo mode is <span className="font-bold text-amber-700">ON</span>. Mock candidates with rich profiles populate the company and investor portals.</>
                : <>Demo mode is <span className="font-bold text-stone-700">OFF</span>. Only the real Airtable seed candidates are visible.</>}
            </div>
            <div className="text-xs text-stone-500 mt-1">Real seed candidates from the Airtable import are always visible in admin regardless.</div>
          </div>
          <button onClick={() => setMockDataEnabled(!mockDataEnabled)}
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition ${mockDataEnabled ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-stone-200 text-stone-700 hover:bg-stone-300"}`}>
            {mockDataEnabled ? "Turn OFF mock data" : "Turn ON mock data"}
          </button>
        </div>
      </Card>
      <Card className={outboundEmailMode === "enabled" ? "border-emerald-300 bg-emerald-50/40" : outboundEmailMode === "test_mode" ? "border-orange-300 bg-orange-50/40" : "border-rose-300 bg-rose-50/40"}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-2"
              style={{ color: outboundEmailMode === "enabled" ? "#047857" : outboundEmailMode === "test_mode" ? "#c2410c" : "#be123c" }}>
              <Mail size={12} /> Outbound emails master toggle
            </div>
            <div className="text-sm text-stone-700">
              {outboundEmailMode === "disabled" && "All outbound emails are DISABLED. Send actions queue but don't fire. The platform is in build/preview mode."}
              {outboundEmailMode === "test_mode" && "TEST MODE — emails only fire to the allowlist (Lorenzo, Zap, Mike). Use this to verify magic links and onboarding copy."}
              {outboundEmailMode === "enabled" && "All outbound emails are ENABLED. Every queued and going-forward send will fire. This is the live state."}
            </div>
            <div className="text-xs text-stone-500 mt-1.5">Affects Re-Onboarding Queue, saved-search notifications, candidate confirmations, and bulk import sends.</div>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            {["disabled", "test_mode", "enabled"].map(m => (
              <button key={m} onClick={() => setOutboundEmailMode(m)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${outboundEmailMode === m ? "bg-slate-900 text-yellow-300 border-slate-900" : "bg-white text-stone-700 border-stone-300 hover:border-stone-400"}`}>
                {m === "disabled" ? "DISABLED" : m === "test_mode" ? "TEST MODE" : "ENABLED"}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Defaults</div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={autoPublish} onChange={e => setAutoPublish(e.target.checked)} className="accent-yellow-400" />
          <span>Auto-publish candidates upon vetting completion (default: hidden until vetted)</span>
        </label>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Required intake fields</div>
        <MultiSelectChips options={allFields} selected={requiredFields} onChange={setRequiredFields} />
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">JD Templates ({DATA_BUNDLE.jdTemplates.length})</div>
        <div className="space-y-2">
          {DATA_BUNDLE.jdTemplates.map(jd => (
            <div key={jd.id} className="bg-white border border-stone-200 rounded-lg p-2 text-xs flex items-center justify-between">
              <div><b>{jd.title}</b> <span className="text-stone-500">· {jd.stage} · {jd.industry}</span></div>
              <Button size="sm" variant="ghost" icon={Edit3}>Edit</Button>
            </div>
          ))}
        </div>
        <Button size="sm" variant="secondary" icon={Plus} className="mt-3">Add JD template</Button>
      </Card>
      <Card className="border-violet-200">
        <div className="text-xs uppercase tracking-wider text-violet-700 font-bold mb-2 flex items-center gap-1">
          <Tag color="purple">OPTIONAL</Tag> Assessment settings
        </div>
        <div className="text-sm text-stone-500 mb-3">Edit the 16 candidate archetype statements and the 12+12 company assessment statements. Changes affect future assessments only.</div>
        <Button size="sm" variant="secondary" icon={Edit3}>Edit archetype statements</Button>
      </Card>
    </div>
  );
}

// ============================================================
// JOB CARD — reusable job posting display
// ============================================================
const JOB_STATUS_META = {
  open: { label: "Open", color: "green" },
  paused: { label: "Paused", color: "default" },
  filled: { label: "Filled", color: "default" },
};

function JobCard({ job, company, applicationCount, onApply, onView, alreadyApplied, applicationStatus, compact = false }) {
  return (
    <Card className="hover:border-stone-400 transition">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-display text-xl">{job.title}</div>
            <Tag color={JOB_STATUS_META[job.status]?.color}>{JOB_STATUS_META[job.status]?.label}</Tag>
            {alreadyApplied && <Tag color="yellow"><Sparkles size={10} /> {applicationStatus === 'hired' ? 'Hired 🎉' : applicationStatus === 'advanced' ? 'Advanced' : applicationStatus === 'review' ? 'In review' : applicationStatus === 'declined' ? 'Passed' : 'Applied'}</Tag>}
          </div>
          {company && (
            <div className="text-sm text-stone-500 mt-0.5">
              <span className="font-semibold text-stone-700">{company.name}</span> · {company.stage} · {company.industry}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-500">
            <span><MapPin size={11} className="inline mr-0.5" /> {job.location}</span>
            <span><Briefcase size={11} className="inline mr-0.5" /> {job.workMode}</span>
            <span><DollarSign size={11} className="inline" />{job.salaryMin}–{job.salaryMax}K{job.equity ? ` · ${job.equity} equity` : ""}</span>
            <span><Calendar size={11} className="inline mr-0.5" /> Posted {job.postedAt}</span>
            {applicationCount !== undefined && <span><Users size={11} className="inline mr-0.5" /> {applicationCount} applicant{applicationCount === 1 ? "" : "s"}</span>}
          </div>
          {!compact && <div className="text-sm text-stone-700 mt-3">{job.summary}</div>}
          <div className="flex flex-wrap gap-1 mt-3">{job.skills.slice(0, 6).map(s => <Tag key={s}>{s}</Tag>)}</div>
        </div>
        <div className="flex flex-col gap-2 self-start">
          {onApply && !alreadyApplied && job.status === 'open' && <Button size="sm" icon={Send} onClick={onApply}>Apply</Button>}
          {alreadyApplied && <Tag color="green">Applied</Tag>}
          {onView && <Button size="sm" variant="ghost" icon={Eye} onClick={onView}>Details</Button>}
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// COMPANY: BROWSE DATABASE — view all active talent without running a search
// ============================================================
function BrowseDatabase({ onOpenProfile, companyId, shortlists, setShortlists, onSaveAsSearch }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterArch, setFilterArch] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  function quickSave() {
    if (!onSaveAsSearch) return;
    const parts = [];
    if (filterRole !== "all") parts.push(filterRole + " role");
    if (filterArch !== "all") parts.push(filterArch + " archetype");
    if (filterStage !== "all") parts.push(filterStage + " stage");
    if (search) parts.push(`matching "${search}"`);
    const desc = parts.length ? parts.join(", ") : "all active candidates";
    const name = prompt("Name this saved search:", `Browse: ${desc.slice(0, 40)}`);
    if (!name) return;
    const queryText = `Browsed candidates · ${desc}`;
    onSaveAsSearch({ name, query: queryText });
  }

  const candidates = useMemo(() => {
    return DATA_BUNDLE.candidates.filter(c => c.vettingStatus === 'Active' && !c.declined);
  }, []);

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      if (filterRole !== "all" && c.primaryRole !== filterRole) return false;
      if (filterArch !== "all" && c.archetype !== filterArch) return false;
      if (filterStage !== "all" && !c.stagePreference.includes(filterStage) && !c.stagePreference.includes("Open to anything")) return false;
      if (search) {
        const s = search.toLowerCase();
        return (c.firstName + " " + c.lastName + " " + c.currentRole + " " + c.skills.join(" ") + " " + c.location).toLowerCase().includes(s);
      }
      return true;
    });
  }, [candidates, filterRole, filterArch, filterStage, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">Browse the database</h2>
          <p className="text-sm text-stone-500 mt-1">{candidates.length} vetted candidates currently live. Filter, sort, or jump straight to a profile.</p>
        </div>
        {onSaveAsSearch && <Button icon={Save} onClick={quickSave}>Save these filters as a search ⚡</Button>}
      </div>
      <Card className="!p-3">
        <div className="grid sm:grid-cols-4 gap-2">
          <Input placeholder="Search name, role, skill..." value={search} onChange={e => setSearch(e.target.value)} />
          <Select value={filterRole} onChange={setFilterRole}
            options={[{ value: "all", label: "All roles" }, ...ROLE_TYPES.map(r => ({ value: r, label: r }))]} />
          <Select value={filterArch} onChange={setFilterArch}
            options={[{ value: "all", label: "All archetypes" }, ...Object.keys(ARCHETYPES).map(k => ({ value: k, label: `${ARCHETYPES[k].icon} ${k}` }))]} />
          <Select value={filterStage} onChange={setFilterStage}
            options={[{ value: "all", label: "All stages" }, ...STAGE_OPTIONS.slice(0, 4).map(s => ({ value: s, label: s }))]} />
        </div>
      </Card>
      <div className="text-xs text-stone-500">{filtered.length} of {candidates.length} candidates</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 60).map(c => (
          <Card key={c.id} onClick={() => onOpenProfile(c.id)} className="hover:border-amber-400">
            <div className="flex items-center gap-3">
              <Avatar candidate={c} size={44} />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate">{c.firstName} {c.lastName}</div>
                <div className="text-xs text-stone-500 truncate">{c.currentRole}</div>
              </div>
              {c.archetype && <ArchetypeBadge quad={c.archetype} />}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-stone-500">
              <span><Clock size={10} className="inline mr-0.5" /> {c.yearsExperience} yrs</span>
              <span><MapPin size={10} className="inline mr-0.5" /> {c.location}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">{c.skills.slice(0, 4).map(s => <Tag key={s}>{s}</Tag>)}</div>
          </Card>
        ))}
      </div>
      {filtered.length > 60 && (
        <div className="text-center text-xs text-stone-500 py-3">Showing first 60. Refine filters or use the AI search to narrow down further.</div>
      )}
    </div>
  );
}

// ============================================================
// TALENT: OPEN JOBS BOARD — approved talent browses companies + jobs and applies
// ============================================================
function TalentJobBoard({ onExit, embedded }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [activeJob, setActiveJob] = useState(null);
  const [applications, setApplications] = useState([]); // session-only

  const openJobs = JOBS.filter(j => j.status === 'open');

  const filtered = openJobs.filter(j => {
    if (filterRole !== "all" && j.role !== filterRole) return false;
    if (filterStage !== "all" && j.stage !== filterStage) return false;
    if (search) {
      const s = search.toLowerCase();
      const company = DATA_BUNDLE.companies.find(c => c.id === j.companyId);
      return (j.title + " " + j.summary + " " + j.skills.join(" ") + " " + (company?.name || "") + " " + (company?.industry || "")).toLowerCase().includes(s);
    }
    return true;
  });

  function apply(jobId) {
    setApplications(arr => [...arr, { jobId, ts: Date.now() }]);
    setActiveJob(null);
    alert("Application sent. Zap will personally introduce you if it's a fit.");
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-white text-black"}>
      {!embedded && (
        <div className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <button onClick={onExit} className="flex items-center gap-2 hover:text-amber-600">
              <Zap className="text-amber-500 fill-amber-500" size={18} />
              <span className="font-black tracking-tight">Lighthouse</span>
              <span className="text-stone-500 text-xs">Talent · Job Board</span>
            </button>
            <Button size="sm" variant="ghost" icon={ArrowLeft} onClick={onExit}>Back to apply</Button>
          </div>
        </div>
      )}
      <div className={embedded ? "max-w-5xl mx-auto" : "max-w-5xl mx-auto px-6 py-8"}>
        <div className="space-y-6">
          <div>
            <Tag color="yellow"><Sparkles size={10} /> OPEN ROLES</Tag>
            <h1 className="font-display text-4xl md:text-5xl mt-3">Who's hiring on Lighthouse</h1>
            <p className="text-stone-500 text-lg mt-3 max-w-2xl">
              Every company here has signed a placement agreement with Zap. See open roles, apply directly, and we'll personally make the warm intro.
            </p>
          </div>
          <Card className="!p-3">
            <div className="grid sm:grid-cols-3 gap-2">
              <Input placeholder="Search by company, role, skill..." value={search} onChange={e => setSearch(e.target.value)} />
              <Select value={filterRole} onChange={setFilterRole}
                options={[{ value: "all", label: "All roles" }, ...ROLE_TYPES.map(r => ({ value: r, label: r }))]} />
              <Select value={filterStage} onChange={setFilterStage}
                options={[{ value: "all", label: "All stages" }, ...STAGE_OPTIONS.slice(0, 4).map(s => ({ value: s, label: s }))]} />
            </div>
          </Card>
          <div className="text-xs text-stone-500">{filtered.length} open roles across {DATA_BUNDLE.companies.length} companies</div>
          <div className="space-y-3">
            {filtered.map(j => {
              const company = DATA_BUNDLE.companies.find(c => c.id === j.companyId);
              const applied = applications.some(a => a.jobId === j.id);
              return (
                <JobCard
                  key={j.id} job={j} company={company}
                  alreadyApplied={applied} applicationStatus={applied ? "applied" : null}
                  onApply={() => apply(j.id)}
                  onView={() => setActiveJob(j)}
                />
              );
            })}
          </div>
          {activeJob && (
            <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" onClick={() => setActiveJob(null)}>
              <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-2xl">{activeJob.title}</div>
                    <div className="text-sm text-stone-500 mt-0.5">
                      {DATA_BUNDLE.companies.find(c => c.id === activeJob.companyId)?.name} · {activeJob.stage}
                    </div>
                  </div>
                  <button onClick={() => setActiveJob(null)} className="text-stone-500 hover:text-black"><X size={18} /></button>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex flex-wrap gap-3 text-xs text-stone-500">
                    <span><MapPin size={11} className="inline mr-0.5" /> {activeJob.location}</span>
                    <span><Briefcase size={11} className="inline mr-0.5" /> {activeJob.workMode}</span>
                    <span><DollarSign size={11} className="inline" />{activeJob.salaryMin}–{activeJob.salaryMax}K{activeJob.equity ? ` · ${activeJob.equity}` : ""}</span>
                  </div>
                  <p>{activeJob.summary}</p>
                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold text-stone-500 mt-3 mb-1">What we're looking for</div>
                    <div className="flex flex-wrap gap-1">{activeJob.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-5 pt-4 border-t border-stone-200">
                  {applications.some(a => a.jobId === activeJob.id)
                    ? <Tag color="green">Applied — Zap will be in touch</Tag>
                    : <Button icon={Send} onClick={() => apply(activeJob.id)}>Apply for this role</Button>}
                  <Button variant="ghost" onClick={() => setActiveJob(null)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN: JOB BOARD — all jobs and applications across companies
// ============================================================
const APP_STATUS_META = {
  applied: { label: "Applied", color: "blue" },
  review: { label: "In review", color: "yellow" },
  advanced: { label: "Advanced", color: "purple" },
  declined: { label: "Passed", color: "default" },
  hired: { label: "Hired", color: "green" },
};

function AdminJobBoard({ onOpenCandidate }) {
  const [activeTab, setActiveTab] = useState("jobs"); // jobs | applications
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [openJob, setOpenJob] = useState(null);

  const jobs = JOBS;
  const applications = APPLICATIONS;

  const counts = applications.reduce((a, x) => { a[x.status] = (a[x.status] || 0) + 1; return a; }, {});

  const filteredJobs = jobs.filter(j => {
    if (filterCompany !== "all" && j.companyId !== +filterCompany) return false;
    if (filterRole !== "all" && j.role !== filterRole) return false;
    if (filterStatus !== "all" && j.status !== filterStatus) return false;
    return true;
  });

  const filteredApps = applications.filter(a => {
    const j = jobs.find(j => j.id === a.jobId);
    if (!j) return false;
    if (filterCompany !== "all" && j.companyId !== +filterCompany) return false;
    if (filterRole !== "all" && j.role !== filterRole) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl">Job Board</h2>
        <div className="text-xs text-stone-500 mt-1">{jobs.length} jobs across {new Set(jobs.map(j => j.companyId)).size} companies · {applications.length} applications</div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-stone-200">
        {[
          { k: "jobs", l: `Jobs (${jobs.length})`, icon: Briefcase },
          { k: "applications", l: `Applications (${applications.length})`, icon: FileText },
        ].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)}
            className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 -mb-px ${activeTab === t.k ? "border-amber-500 text-black" : "border-transparent text-stone-500 hover:text-black"}`}>
            <t.icon size={14} /> {t.l}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="!p-3">
        <div className="grid sm:grid-cols-3 gap-2">
          <Select value={filterCompany} onChange={setFilterCompany}
            options={[{ value: "all", label: "All companies" }, ...DATA_BUNDLE.companies.map(c => ({ value: c.id, label: c.name }))]} />
          <Select value={filterRole} onChange={setFilterRole}
            options={[{ value: "all", label: "All roles" }, ...ROLE_TYPES.map(r => ({ value: r, label: r }))]} />
          <Select value={filterStatus} onChange={setFilterStatus}
            options={activeTab === "jobs"
              ? [{ value: "all", label: "All statuses" }, { value: "open", label: "Open" }, { value: "paused", label: "Paused" }, { value: "filled", label: "Filled" }]
              : [{ value: "all", label: `All statuses` }, ...Object.entries(APP_STATUS_META).map(([k, m]) => ({ value: k, label: `${m.label} (${counts[k] || 0})` }))]} />
        </div>
      </Card>

      {activeTab === "jobs" && (
        <div className="space-y-3">
          {filteredJobs.map(j => {
            const company = DATA_BUNDLE.companies.find(c => c.id === j.companyId);
            const apps = applications.filter(a => a.jobId === j.id);
            return (
              <JobCard key={j.id} job={j} company={company} applicationCount={apps.length}
                onView={() => setOpenJob(j)} />
            );
          })}
          {filteredJobs.length === 0 && <Card className="text-center py-8 text-sm text-stone-500">No jobs match these filters.</Card>}
        </div>
      )}

      {activeTab === "applications" && (
        <Card padded={false}>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
              <tr>
                <th className="text-left p-3">Candidate</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Company</th>
                <th className="text-left p-3">Applied</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Archetype</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.slice(0, 100).map(a => {
                const c = DATA_BUNDLE.candidates.find(x => x.id === a.candidateId);
                const j = jobs.find(x => x.id === a.jobId);
                const company = DATA_BUNDLE.companies.find(x => x.id === j?.companyId);
                if (!c || !j) return null;
                return (
                  <tr key={a.id} className="border-b border-stone-200 hover:bg-stone-50 cursor-pointer" onClick={() => onOpenCandidate(c.id)}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar candidate={c} size={28} />
                        <div className="font-bold">{c.firstName} {c.lastName}</div>
                      </div>
                    </td>
                    <td className="p-3 text-stone-700 max-w-xs truncate">{j.title}</td>
                    <td className="p-3 text-stone-700">{company?.name}</td>
                    <td className="p-3 text-xs text-stone-500">{a.appliedAt}</td>
                    <td className="p-3"><Tag color={APP_STATUS_META[a.status]?.color}>{APP_STATUS_META[a.status]?.label}</Tag></td>
                    <td className="p-3">{c.archetype ? <ArchetypeBadge quad={c.archetype} /> : <span className="text-stone-400">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          {filteredApps.length > 100 && <div className="p-3 text-center text-xs text-stone-500">Showing 100 of {filteredApps.length} applications.</div>}
        </Card>
      )}

      {/* Job detail modal */}
      {openJob && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpenJob(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="font-display text-2xl">{openJob.title}</div>
                <div className="text-sm text-stone-500">{DATA_BUNDLE.companies.find(c => c.id === openJob.companyId)?.name} · {openJob.stage}</div>
              </div>
              <button onClick={() => setOpenJob(null)} className="text-stone-500 hover:text-black"><X size={18} /></button>
            </div>
            <p className="text-sm text-stone-700 mb-3">{openJob.summary}</p>
            <div className="flex flex-wrap gap-1 mb-4">{openJob.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
            <div className="text-xs uppercase tracking-wider font-bold text-stone-500 mt-2 mb-2">Applicants ({applications.filter(a => a.jobId === openJob.id).length})</div>
            <div className="space-y-2">
              {applications.filter(a => a.jobId === openJob.id).map(a => {
                const c = DATA_BUNDLE.candidates.find(x => x.id === a.candidateId);
                if (!c) return null;
                return (
                  <div key={a.id} className="flex items-center gap-3 p-2 border border-stone-200 rounded-lg cursor-pointer hover:border-amber-400" onClick={() => { setOpenJob(null); onOpenCandidate(c.id); }}>
                    <Avatar candidate={c} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">{c.firstName} {c.lastName}</div>
                      <div className="text-xs text-stone-500 truncate">{c.currentRole}</div>
                    </div>
                    <Tag color={APP_STATUS_META[a.status]?.color}>{APP_STATUS_META[a.status]?.label}</Tag>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 12 ARCHETYPES — sub-zone names per the v2 spec.
// Same 2D quadrant model. Sub-zone resolution from primaryRole until full 24-statement assessment lands.
// ============================================================
const ARCHETYPES_12 = {
  // Specialist + Builder
  "Founding Engineer":  { quad: "Pioneer",      icon: "⚡", desc: ["Technical depth, pre-product builder", "Best fit: pre-seed to seed", "Typical roles: Founding Engineer, ML Engineer, Infra Lead"], color: "#FACC15" },
  "Founding Designer":  { quad: "Pioneer",      icon: "🎨", desc: ["Design-led specialist builder, first design hire", "Best fit: pre-seed to Series A", "Typical roles: Founding Designer, Brand Lead"], color: "#FB923C" },
  "Domain Founder":     { quad: "Pioneer",      icon: "🔭", desc: ["Specialist with founder ambition", "Best fit: pre-seed", "Typical roles: Domain Founder, Technical Co-founder"], color: "#F97316" },
  // Generalist + Builder
  "Founder/CEO Type":   { quad: "Founder",      icon: "🚀", desc: ["Comfortable in chaos, wears every hat, decides with incomplete info", "Best fit: pre-seed", "Typical roles: Founder, CEO, Co-founder"], color: "#FB923C" },
  "Founding Operator":  { quad: "Founder",      icon: "🛠️", desc: ["Generalist building the operating layer", "Best fit: seed", "Typical roles: First Ops Hire, Founding GM"], color: "#F59E0B" },
  "First Business Hire":{ quad: "Founder",      icon: "🎯", desc: ["Generalist builder for non-technical roles", "Best fit: seed to Series A", "Typical roles: First Marketing/Sales/CS hire"], color: "#FCD34D" },
  // Specialist + Operator
  "Senior IC":          { quad: "Craftsperson", icon: "🔬", desc: ["Deep specialist optimizer; principal-level individual contributor", "Best fit: Series A through B+", "Typical roles: Staff Engineer, Senior IC"], color: "#7DD3FC" },
  "Domain Lead":        { quad: "Craftsperson", icon: "🧭", desc: ["Specialist who leads a function from in front", "Best fit: Series A+", "Typical roles: Engineering Lead, Design Lead"], color: "#38BDF8" },
  "Player-Coach":       { quad: "Craftsperson", icon: "🤝", desc: ["Specialist operator who manages while doing the work", "Best fit: Series A through B", "Typical roles: Lead/Manager Eng, Lead Designer"], color: "#0EA5E9" },
  // Generalist + Operator
  "Chief of Staff":     { quad: "Athlete",      icon: "🎯", desc: ["Connects functions, runs founder priorities, cross-team execution", "Best fit: Series A through B", "Typical roles: Chief of Staff, BizOps Lead"], color: "#A78BFA" },
  "Head of Ops":        { quad: "Athlete",      icon: "⚙️", desc: ["Generalist operator focused on the operating system", "Best fit: Series A through B+", "Typical roles: Head of Ops, VP Ops, COO"], color: "#8B5CF6" },
  "Functional Lead":    { quad: "Athlete",      icon: "📐", desc: ["Generalist running a non-technical function", "Best fit: Series A through B", "Typical roles: Head of Marketing/Sales/CS"], color: "#7C3AED" },
  // Center
  "Balanced":           { quad: "Balanced",     icon: "⚖️", desc: ["Sits near the center of the map", "Versatile across modes", "Typical roles: varies"], color: "#94A3B8" },
};

// Derive a v2 sub-zone name from existing v1 quadrant + primary role.
function archetype12FromCandidate(c) {
  if (!c.archetype) return null;
  const q = c.archetype;
  const r = c.primaryRole;
  if (q === "Balanced") return "Balanced";
  if (q === "Pioneer") {
    if (r === "Engineering") return "Founding Engineer";
    if (r === "Design") return "Founding Designer";
    return "Domain Founder";
  }
  if (q === "Founder") {
    if (r === "Engineering" || r === "Founding Team") return "Founder/CEO Type";
    if (r === "Operations") return "Founding Operator";
    return "First Business Hire";
  }
  if (q === "Craftsperson") {
    if (r === "Engineering") return "Senior IC";
    if (r === "Operations" || r === "Marketing" || r === "Sales") return "Domain Lead";
    return "Player-Coach";
  }
  if (q === "Athlete") {
    if (r === "Operations") return c.yearsExperience >= 10 ? "Head of Ops" : "Chief of Staff";
    if (r === "Marketing" || r === "Sales") return "Functional Lead";
    return "Chief of Staff";
  }
  return null;
}

function Archetype12Badge({ name, size = "sm" }) {
  if (!name) return null;
  const a = ARCHETYPES_12[name];
  if (!a) return null;
  return (
    <span style={{ background: a.color + "22", borderColor: a.color + "55", color: a.color }}
          className={`inline-flex items-center gap-1 rounded-full border ${size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs"} font-semibold whitespace-nowrap`}>
      <span>{a.icon}</span>
      <span>{name}</span>
    </span>
  );
}

// ============================================================
// RESOURCES VIEW — works for talent / company / investor; filters by audience
// ============================================================
function ResourcesView({ audience, onExit }) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeId, setActiveId] = useState(null);

  const visible = useMemo(() => RESOURCES.filter(r => audience === "all" ? true : r.audience === audience), [audience]);
  const categories = useMemo(() => [...new Set(visible.map(r => r.category))], [visible]);
  const filtered = useMemo(() => {
    return visible.filter(r => {
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (search && !(r.title + " " + r.desc + " " + r.category).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [visible, filterCategory, search]);

  const active = activeId ? visible.find(r => r.id === activeId) : null;

  if (active) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={() => setActiveId(null)}>Back to resources</Button>
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
              <p>This is placeholder body content for "{active.title}". Real content will be uploaded by Lighthouse staff post-launch — drawn from existing material like Founders Only podcast transcripts, Zap's Wrap archives, and talks.</p>
              <p>The Resource Database is designed so each article gets a polished detail view like this one, with related resources surfaced in a sidebar and full-text search across the library.</p>
              <p>For v2, the structure, taxonomy, and surface area are the deliverables. The content layer fills in over time.</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-display text-3xl">Resources</h2>
          <Tag color="yellow"><Sparkles size={10} /> {audience === "talent" ? "For talent" : "For hiring teams"}</Tag>
        </div>
        <p className="text-sm text-stone-500">
          {audience === "talent"
            ? "Articles to help you understand startup life, comp, equity, and what working at a Lighthouse-network company is like."
            : "Hiring playbooks, role profiles, market data, and templates from the Lighthouse network."}
        </p>
      </div>

      <Card className="!p-3">
        <div className="grid sm:grid-cols-2 gap-2">
          <Input placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} />
          <Select value={filterCategory} onChange={setFilterCategory}
            options={[{ value: "all", label: "All categories" }, ...categories.map(c => ({ value: c, label: c }))]} />
        </div>
      </Card>

      {/* Featured (only on top-level view, no filter active) */}
      {filterCategory === "all" && !search && (
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Featured</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.filter(r => r.featured).slice(0, 6).map(r => (
              <ResourceCard key={r.id} resource={r} onClick={() => setActiveId(r.id)} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">
          {filterCategory === "all" ? "All resources" : filterCategory} <span className="text-stone-400 font-normal normal-case">· {filtered.length}</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(r => <ResourceCard key={r.id} resource={r} onClick={() => setActiveId(r.id)} />)}
        </div>
        {filtered.length === 0 && <Card className="text-center py-10 text-sm text-stone-500">No resources match.</Card>}
      </div>
    </div>
  );
}

function ResourceCard({ resource, onClick }) {
  const isDownload = resource.type === "download";
  return (
    <Card className="hover:border-amber-400 transition" onClick={onClick}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDownload ? "bg-violet-100 text-violet-700" : "bg-yellow-100 text-amber-700"}`}>
          {isDownload ? <FileText size={18} /> : <BookOpenCheck size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">{resource.category}</div>
          <div className="font-bold text-sm mt-0.5 leading-snug">{resource.title}</div>
          <div className="text-xs text-stone-500 mt-1 line-clamp-2">{resource.desc}</div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-500">
            <span>{resource.views} views</span>
            <span>·</span>
            <span>Updated {resource.updatedAt}</span>
            {isDownload && <><span>·</span><span>{resource.fileType}</span></>}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// INVESTOR PORTAL — 3-tier hierarchy (Investor → Portfolio → Projects)
// Multi-scope search (investor-wide / portco-scoped / project-scoped)
// ============================================================
function InvestorPortal({ onExit, investorId = 1 }) {
  // Tabs: dashboard / portfolio / portco / project / search (cross-scope) / browse / intros / shortlists / searches / resources / profile
  const [view, setView] = useState("dashboard");
  const [activePortcoId, setActivePortcoId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeCandidateId, setActiveCandidateId] = useState(null);
  const [searchScope, setSearchScope] = useState({ kind: "investor_wide" });
  const [searchQuery, setSearchQuery] = useState("");
  // Investors get their own shortlists + saved searches, namespaced by investor id (negative companyId so they don't collide)
  const investorAsCompanyId = -investorId; // sentinel
  const [shortlists, setShortlists] = useState(() => DATA_BUNDLE.shortlists.map(s => ({ ...s })));
  const [savedSearches, setSavedSearches] = useState(() => DATA_BUNDLE.savedSearches.map(s => ({ ...s })));

  const investor = INVESTORS.find(i => i.id === investorId);
  const myPortfolios = PORTFOLIOS.filter(p => p.investorId === investorId);
  const myCompanies = myPortfolios.map(p => DATA_BUNDLE.companies.find(c => c.id === p.companyId)).filter(Boolean);
  const myProjects = PROJECTS.filter(p => p.investorId === investorId);

  // For features shared with company portal, scope intros / shortlists / searches across the investor's whole portfolio.
  const myPortfolioCompanyIds = myCompanies.map(c => c.id);
  const portfolioIntros = INTROS.filter(i => myPortfolioCompanyIds.includes(i.companyId));
  const investorShortlists = shortlists.filter(s => s.companyId === investorAsCompanyId);
  const investorSearches = savedSearches.filter(s => s.companyId === investorAsCompanyId);

  function saveSearch({ name, query, results = 0 }) {
    setSavedSearches([...savedSearches, {
      id: Date.now(), companyId: investorAsCompanyId, name, query,
      createdAt: new Date().toISOString().slice(0, 10), results,
    }]);
    alert(`Saved "${name}" to your searches.`);
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => setView("dashboard")} className="flex items-center gap-2 hover:text-amber-600">
              <Zap className="text-amber-500 fill-amber-500" size={18} />
              <span className="font-black tracking-tight">Lighthouse</span>
              <span className="text-stone-500 text-xs">Investor</span>
            </button>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { k: "dashboard", l: "Overview", icon: Home },
                { k: "portfolio", l: "Portfolio", icon: Building2 },
                { k: "search", l: "AI Search", icon: Search },
                { k: "browse", l: "Browse", icon: Database },
                { k: "intros", l: "Intros", icon: Coffee },
                { k: "searches", l: "My Searches", icon: BookOpenCheck },
                { k: "shortlists", l: "Shortlists", icon: Star },
                { k: "resources", l: "Resources", icon: FileText },
              ].map(it => (
                <button key={it.k} onClick={() => setView(it.k)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg transition flex items-center gap-1.5 ${view === it.k ? "bg-stone-100 text-amber-600" : "text-stone-500 hover:text-black"}`}>
                  <it.icon size={13} />{it.l}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-stone-500 hidden sm:block">{investor?.name} <Tag color="purple" size="sm">{investor?.tier}</Tag></div>
            <Button variant="ghost" size="sm" icon={LogOut} onClick={onExit}>Exit</Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        {view === "dashboard" && <InvestorDashboard investor={investor} portfolios={myPortfolios} projects={myProjects} companies={myCompanies}
          onPortco={(id) => { setActivePortcoId(id); setView("portco"); }}
          onProject={(id) => { setActiveProjectId(id); setView("project"); }}
          onSearch={() => setView("search")} />}
        {view === "portfolio" && <InvestorPortfolio investor={investor} portfolios={myPortfolios} companies={myCompanies}
          onPortco={(id) => { setActivePortcoId(id); setView("portco"); }} />}
        {view === "portco" && activePortcoId && <PortcoDetail companyId={activePortcoId} investorId={investorId}
          projects={myProjects.filter(p => p.companyId === activePortcoId)}
          onBack={() => setView("portfolio")}
          onProject={(id) => { setActiveProjectId(id); setView("project"); }} />}
        {view === "project" && activeProjectId && <ProjectDetail projectId={activeProjectId} investorId={investorId}
          onBack={() => setView("dashboard")} />}
        {view === "search" && <InvestorSearch investor={investor} portfolios={myPortfolios} projects={myProjects}
          scope={searchScope} setScope={setSearchScope} query={searchQuery} setQuery={setSearchQuery}
          onAssign={() => alert("Assigned to project (mock).")}
          onSaveSearch={(q) => saveSearch({ name: prompt("Name this search:") || `Investor search ${investorSearches.length + 1}`, query: q })} />}
        {view === "browse" && (
          <BrowseDatabase
            onOpenProfile={(id) => { setActiveCandidateId(id); setView("profile"); }}
            companyId={investorAsCompanyId} shortlists={shortlists} setShortlists={setShortlists}
            onSaveAsSearch={saveSearch} />
        )}
        {view === "intros" && (
          <InvestorIntrosView portfolios={myPortfolios} companies={myCompanies} intros={portfolioIntros}
            onOpenCandidate={(id) => { setActiveCandidateId(id); setView("profile"); }} />
        )}
        {view === "shortlists" && (
          <ShortlistsView shortlists={investorShortlists} setShortlists={setShortlists}
            onOpenCandidate={(id) => { setActiveCandidateId(id); setView("profile"); }} />
        )}
        {view === "searches" && (
          <SavedSearchesView searches={investorSearches} setSearches={setSavedSearches}
            onRunSearch={(q) => { setSearchQuery(q); setView("search"); }}
            onNewSearch={() => setView("search")} />
        )}
        {view === "profile" && activeCandidateId && (
          <CandidateProfileView candidate={DATA_BUNDLE.candidates.find(c => c.id === activeCandidateId)}
            onBack={() => setView("browse")}
            interp={{ skills: [], archetypeLean: null, location: "Open" }}
            onShortlist={(slId) => {
              setShortlists(sls => sls.map(s => s.id === slId
                ? { ...s, candidateIds: [...new Set([...s.candidateIds, activeCandidateId])] } : s));
              alert("Added to shortlist.");
            }}
            shortlists={investorShortlists} />
        )}
        {view === "resources" && <ResourcesView audience="company" onExit={onExit} />}
      </div>
    </div>
  );
}

// Investor's intros view — groups by portfolio company
function InvestorIntrosView({ portfolios, companies, intros, onOpenCandidate }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl">Intros across the portfolio</h2>
        <p className="text-sm text-stone-500 mt-1">Every warm intro Zap has made into your portfolio companies — grouped by company.</p>
      </div>
      {companies.map(company => {
        const companyIntros = intros.filter(i => i.companyId === company.id);
        if (companyIntros.length === 0) return null;
        return (
          <Card key={company.id}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold">{company.name}</div>
                <div className="text-xs text-stone-500">{company.stage} · {company.industry}</div>
              </div>
              <Tag color="yellow">{companyIntros.length} intros</Tag>
            </div>
            <div className="space-y-2">
              {companyIntros.slice(0, 5).map(i => {
                const c = DATA_BUNDLE.candidates.find(cn => cn.id === i.candidateId);
                if (!c) return null;
                return (
                  <div key={i.id} onClick={() => onOpenCandidate(c.id)}
                       className="flex items-center gap-3 p-2 border border-stone-200 rounded-lg hover:border-amber-400 cursor-pointer">
                    <Avatar candidate={c} size={32} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">{c.firstName} {c.lastName}</div>
                      <div className="text-xs text-stone-500 truncate">{c.currentRole} · introduced {i.introducedAt}</div>
                    </div>
                    <Tag size="sm">{i.status}</Tag>
                  </div>
                );
              })}
              {companyIntros.length > 5 && <div className="text-xs text-stone-500 text-center pt-1">+{companyIntros.length - 5} more</div>}
            </div>
          </Card>
        );
      })}
      {intros.length === 0 && (
        <Card className="text-center py-12 text-sm text-stone-500">No intros yet across the portfolio.</Card>
      )}
    </div>
  );
}

function InvestorDashboard({ investor, portfolios, projects, companies, onPortco, onProject, onSearch }) {
  const open = projects.filter(p => p.status === "open");
  const investorWide = projects.filter(p => p.scope === "investor_wide");
  const totalApplicants = projects.reduce((s, p) => s + (p.candidatesShortlisted || 0), 0);
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-4xl">{investor?.name}</h1>
          <div className="text-sm text-stone-500 mt-1">{investor?.focus} · {investor?.aum} AUM · {investor?.fundsActive} active fund{investor?.fundsActive === 1 ? "" : "s"}</div>
        </div>
        <Button icon={Search} onClick={onSearch}>Find candidates</Button>
      </div>
      <div className="grid sm:grid-cols-4 gap-3">
        <Card><div className="text-xs uppercase tracking-wider text-stone-500 font-bold">Portfolio</div><div className="font-display text-3xl mt-1">{companies.length}</div><div className="text-xs text-stone-500 mt-0.5">companies</div></Card>
        <Card><div className="text-xs uppercase tracking-wider text-stone-500 font-bold">Open projects</div><div className="font-display text-3xl mt-1">{open.length}</div><div className="text-xs text-stone-500 mt-0.5">{investorWide.length} cross-portfolio</div></Card>
        <Card><div className="text-xs uppercase tracking-wider text-stone-500 font-bold">Candidates pipeline</div><div className="font-display text-3xl mt-1">{totalApplicants}</div><div className="text-xs text-stone-500 mt-0.5">across all projects</div></Card>
        <Card><div className="text-xs uppercase tracking-wider text-stone-500 font-bold">Plan</div><div className="font-display text-2xl mt-1 capitalize">{investor?.tier}</div><div className="text-xs text-stone-500 mt-0.5">{investor?.tier === "scale" ? "Up to 20+ portcos" : investor?.tier === "core" ? "Up to 10 portcos" : "Up to 5 portcos"}</div></Card>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Portfolio companies</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {companies.map(c => {
            const portco = portfolios.find(p => p.companyId === c.id);
            const ps = projects.filter(p => p.companyId === c.id);
            const op = ps.filter(p => p.status === "open");
            return (
              <Card key={c.id} onClick={() => onPortco(c.id)} className="hover:border-amber-400">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-stone-500">{c.stage} · {c.industry}</div>
                  </div>
                  {portco?.leadInvestor && <Tag color="yellow" size="sm">Lead</Tag>}
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-stone-500">
                  <span><Briefcase size={11} className="inline mr-0.5" /> {op.length} open</span>
                  <span>·</span>
                  <span>{ps.length} total</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-bold">Active projects</div>
          <Tag color="yellow">{open.length} open</Tag>
        </div>
        <div className="space-y-2">
          {open.slice(0, 8).map(p => {
            const company = p.companyId ? DATA_BUNDLE.companies.find(c => c.id === p.companyId) : null;
            return (
              <Card key={p.id} onClick={() => onProject(p.id)} className="hover:border-amber-400">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-bold">{p.title}</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {p.scope === "investor_wide"
                        ? <span><Tag color="yellow" size="sm">Cross-portfolio</Tag> · across all {portfolios.length} companies</span>
                        : <span>{company?.name} · {company?.stage}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-600">{p.candidatesShortlisted}</div>
                    <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">shortlisted</div>
                  </div>
                </div>
                <div className="text-xs text-stone-500 mt-2">${p.salaryMin}–${p.salaryMax}K · created {p.createdAt}</div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InvestorPortfolio({ investor, portfolios, companies, onPortco }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl">Portfolio</h1>
        <div className="text-sm text-stone-500 mt-1">{companies.length} of up to {investor?.tier === "scale" ? 20 : investor?.tier === "core" ? 10 : 5} portfolio companies on the {investor?.tier} plan</div>
      </div>
      <Card padded={false}>
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
            <tr><th className="text-left p-3">Company</th><th className="text-left p-3">Stage</th><th className="text-left p-3">Industry</th><th className="text-left p-3">Round invested</th><th className="text-left p-3">Check</th><th className="text-center p-3">Lead?</th></tr>
          </thead>
          <tbody>
            {companies.map(c => {
              const p = portfolios.find(p => p.companyId === c.id);
              return (
                <tr key={c.id} onClick={() => onPortco(c.id)} className="border-b border-stone-200 cursor-pointer hover:bg-stone-50">
                  <td className="p-3 font-bold">{c.name}</td>
                  <td className="p-3"><Tag color="green">{c.stage}</Tag></td>
                  <td className="p-3 text-stone-700">{c.industry}</td>
                  <td className="p-3 text-stone-700">{p?.round}</td>
                  <td className="p-3 text-stone-700">{p?.checkSize}</td>
                  <td className="p-3 text-center">{p?.leadInvestor && <span className="text-amber-600">⭐</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function PortcoDetail({ companyId, projects, onBack, onProject }) {
  const company = DATA_BUNDLE.companies.find(c => c.id === companyId);
  const open = projects.filter(p => p.status === "open");
  const closed = projects.filter(p => p.status !== "open");
  return (
    <div className="space-y-4">
      <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={onBack}>Back to portfolio</Button>
      <Card>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-3xl">{company?.name}</h1>
            <div className="text-sm text-stone-500 mt-1">{company?.stage} · {company?.industry} · {company?.team} on team</div>
          </div>
          <Button icon={Plus}>New hiring project</Button>
        </div>
      </Card>
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Open projects · {open.length}</div>
        <div className="space-y-2">
          {open.map(p => (
            <Card key={p.id} onClick={() => onProject(p.id)} className="hover:border-amber-400">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold">{p.title}</div>
                  <div className="text-xs text-stone-500 mt-0.5">${p.salaryMin}–${p.salaryMax}K · created {p.createdAt}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-600">{p.candidatesShortlisted}</div>
                  <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">shortlisted</div>
                </div>
              </div>
            </Card>
          ))}
          {open.length === 0 && <Card className="text-center py-8 text-sm text-stone-500">No open projects.</Card>}
        </div>
      </div>
      {closed.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Closed · {closed.length}</div>
          <div className="space-y-2">
            {closed.map(p => (
              <Card key={p.id} onClick={() => onProject(p.id)} className="opacity-70 hover:opacity-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold">{p.title}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{p.status} · {p.createdAt}</div>
                  </div>
                  <Tag>{p.status}</Tag>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectDetail({ projectId, onBack }) {
  const p = PROJECTS.find(x => x.id === projectId);
  const company = p?.companyId ? DATA_BUNDLE.companies.find(c => c.id === p.companyId) : null;
  const [pipeline, setPipeline] = useState(() => {
    // Mock pipeline stages with random shortlisted candidates
    const candidates = DATA_BUNDLE.candidates.filter(c => c.vettingStatus === "Active" && c.primaryRole === p?.role).slice(0, p?.candidatesShortlisted || 6);
    const stages = ["Sourced", "Reviewing", "Intro requested", "Interviewing", "Offer", "Closed"];
    return stages.map((s, i) => ({
      stage: s,
      candidates: candidates.filter((_, j) => j % stages.length === i).map(c => c.id)
    }));
  });

  return (
    <div className="space-y-4">
      <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={onBack}>Back</Button>
      <Card>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold">
              {p?.scope === "investor_wide" ? "Cross-portfolio search" : `${company?.name} · ${company?.stage}`}
            </div>
            <h1 className="font-display text-3xl mt-1">{p?.title}</h1>
            <div className="text-sm text-stone-500 mt-2">{p?.description}</div>
            <div className="flex items-center gap-3 mt-3 text-xs text-stone-500">
              <span>${p?.salaryMin}–${p?.salaryMax}K</span>
              <span>·</span>
              <span><Calendar size={11} className="inline" /> Created {p?.createdAt}</span>
              <span>·</span>
              <Tag color={p?.status === "open" ? "green" : "default"}>{p?.status}</Tag>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" icon={Search}>Find more candidates</Button>
            <Button size="sm" variant="secondary" icon={Send}>Share with team</Button>
          </div>
        </div>
      </Card>

      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Pipeline</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 overflow-x-auto">
          {pipeline.map((col, i) => (
            <div key={col.stage} className="bg-stone-50 border border-stone-200 rounded-lg p-2 min-h-[200px]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs uppercase tracking-wider font-bold text-stone-700">{col.stage}</div>
                <Tag size="sm">{col.candidates.length}</Tag>
              </div>
              <div className="space-y-1.5">
                {col.candidates.map(cid => {
                  const c = DATA_BUNDLE.candidates.find(x => x.id === cid);
                  if (!c) return null;
                  return (
                    <div key={cid} className="bg-white border border-stone-200 rounded p-2">
                      <div className="flex items-center gap-2">
                        <Avatar candidate={c} size={24} />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs truncate">{c.firstName} {c.lastName}</div>
                          <div className="text-[10px] text-stone-500 truncate">{c.currentRole}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InvestorSearch({ investor, portfolios, projects, scope, setScope, query, setQuery, onAssign, onSaveSearch }) {
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  function runSearch() {
    setLoading(true);
    setSearched(true);
    setTimeout(() => {
      const interp = aiInterpret(query);
      const filtered = { yoeMin: 0, yoeMax: 25, stages: [], locations: [], skills: [], vettedOnly: true, archetypes: [], assessmentOnly: false };
      const ranked = rankCandidates(DATA_BUNDLE.candidates, query, filtered, interp).slice(0, 30);
      setResults(ranked);
      setLoading(false);
    }, 1200);
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display text-3xl">Find candidates</h1>
        <div className="text-sm text-stone-500 mt-1">Search across the network, scope to a portfolio company, or search within an existing project.</div>
      </div>

      {/* Scope picker */}
      <Card className="!p-3">
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Search scope</div>
        <div className="grid sm:grid-cols-3 gap-2">
          <button onClick={() => setScope({ kind: "investor_wide" })}
            className={`p-3 rounded-lg border text-left transition ${scope.kind === "investor_wide" ? "border-amber-500 bg-yellow-50" : "border-stone-200 hover:border-stone-400"}`}>
            <div className="text-xs uppercase tracking-wider font-bold text-stone-500">Investor-wide</div>
            <div className="text-sm font-bold mt-0.5">All of {investor?.name}</div>
            <div className="text-xs text-stone-500 mt-0.5">Assign results to any portco / project</div>
          </button>
          <div className={`p-3 rounded-lg border ${scope.kind === "portco_scoped" ? "border-amber-500 bg-yellow-50" : "border-stone-200"}`}>
            <div className="text-xs uppercase tracking-wider font-bold text-stone-500">Portco-scoped</div>
            <Select value={scope.kind === "portco_scoped" ? scope.companyId : ""} onChange={v => v && setScope({ kind: "portco_scoped", companyId: +v })}
              options={[{ value: "", label: "Pick a portfolio company..." }, ...portfolios.map(p => {
                const c = DATA_BUNDLE.companies.find(c => c.id === p.companyId); return { value: p.companyId, label: c?.name };
              })]} className="text-sm mt-1" />
          </div>
          <div className={`p-3 rounded-lg border ${scope.kind === "project_scoped" ? "border-amber-500 bg-yellow-50" : "border-stone-200"}`}>
            <div className="text-xs uppercase tracking-wider font-bold text-stone-500">Project-scoped</div>
            <Select value={scope.kind === "project_scoped" ? scope.projectId : ""} onChange={v => v && setScope({ kind: "project_scoped", projectId: +v })}
              options={[{ value: "", label: "Pick a project..." }, ...projects.filter(p => p.status === "open").map(p => ({ value: p.id, label: p.title }))]} className="text-sm mt-1" />
          </div>
        </div>
      </Card>

      <Card padded={false} className="p-2">
        <Textarea rows={4} value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Describe what you're looking for. e.g. 'Founding engineer with ML infra experience for a Series A AI infrastructure company...'"
          className="border-0 bg-transparent text-base" />
        <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-stone-200">
          <div className="text-xs text-stone-500">{query.split(/\s+/).filter(Boolean).length} words</div>
          <Button onClick={runSearch} icon={Search} disabled={!query.trim() || loading}>{loading ? "Searching..." : "Search"}</Button>
        </div>
      </Card>

      {searched && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-stone-500"><span className="font-bold text-amber-600">{results.length}</span> ranked candidates</div>
            <div className="flex items-center gap-2">
              {onSaveSearch && <Button size="sm" icon={Save} onClick={() => onSaveSearch(query)}>Save this search ⚡</Button>}
              {scope.kind === "investor_wide" && <div className="text-xs text-stone-500">Each result can be assigned to any open project</div>}
            </div>
          </div>
          {results.map(({ candidate, score }) => (
            <Card key={candidate.id} className="hover:border-amber-400">
              <div className="flex items-start gap-3">
                <Avatar candidate={candidate} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold">{candidate.firstName} {candidate.lastName}</div>
                    {candidate.archetype && <Archetype12Badge name={archetype12FromCandidate(candidate)} />}
                  </div>
                  <div className="text-sm text-stone-500">{candidate.currentRole} · {candidate.currentCompany}</div>
                  <div className="flex flex-wrap gap-1 mt-2">{candidate.skills.slice(0, 4).map(s => <Tag key={s}>{s}</Tag>)}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Tag color="yellow">{score} match</Tag>
                  {scope.kind === "investor_wide"
                    ? <Select value="" onChange={v => v && onAssign()} className="text-xs"
                        options={[{ value: "", label: "Assign to project ⌄" }, ...projects.filter(p => p.status === "open").map(p => ({ value: p.id, label: p.title }))]} />
                    : <Button size="sm" variant="secondary" onClick={onAssign}>Add to project</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminInvestorsView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl">Investors</h2>
          <div className="text-xs text-stone-500">{INVESTORS.length} active firms · {PORTFOLIOS.length} portfolio companies · {PROJECTS.filter(p => p.status === "open").length} open projects</div>
        </div>
        <Button icon={Plus} variant="secondary">Add investor firm</Button>
      </div>
      <Card padded={false}>
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-500">
            <tr><th className="text-left p-3">Firm</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Focus</th><th className="text-left p-3">AUM</th><th className="text-center p-3">Portcos</th><th className="text-center p-3">Open projects</th><th className="text-left p-3">Seats</th></tr>
          </thead>
          <tbody>
            {INVESTORS.map(inv => {
              const ports = PORTFOLIOS.filter(p => p.investorId === inv.id).length;
              const openP = PROJECTS.filter(p => p.investorId === inv.id && p.status === "open").length;
              return (
                <tr key={inv.id} className="border-b border-stone-200 hover:bg-stone-50">
                  <td className="p-3"><div className="font-bold">{inv.name}</div><div className="text-xs text-stone-500">{inv.location}</div></td>
                  <td className="p-3"><Tag color="purple">{inv.tier}</Tag></td>
                  <td className="p-3 text-stone-700 max-w-xs">{inv.focus}</td>
                  <td className="p-3 text-stone-700">{inv.aum}</td>
                  <td className="p-3 text-center font-bold">{ports}</td>
                  <td className="p-3 text-center font-bold text-amber-600">{openP}</td>
                  <td className="p-3 text-xs text-stone-500">{inv.seats.length} seat{inv.seats.length === 1 ? "" : "s"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
// MODE SWITCHER — floating bottom-right toggle to flip between roles
// ============================================================
function ModeSwitcher({ mode, setMode, companyId, setCompanyId }) {
  const [open, setOpen] = useState(false);
  const { logout, user } = useAuth();
  const modes = [
    { k: "candidate", label: "Talent", icon: UserPlus, desc: "Candidate flow" },
    { k: "company", label: "Company", icon: Search, desc: "Search talent & intros" },
    { k: "investor", label: "Investor", icon: Briefcase, desc: "Portfolio & projects" },
    { k: "admin", label: "Admin", icon: Shield, desc: "Database & vetting" },
  ];
  const current = modes.find(m => m.k === mode);
  return (
    <>
      {/* Trigger pill — solid dark navy with strong contrast — always floating bottom-right */}
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 bg-slate-900 text-yellow-300 hover:bg-slate-800 rounded-full pl-3 pr-4 py-2.5 shadow-2xl flex items-center gap-2 font-bold text-sm transition-all border border-slate-800">
        <span className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center"><Zap size={14} className="text-slate-900 fill-slate-900" /></span>
        <span>Demo · {current?.label || "—"}</span>
        <ChevronUp size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed bottom-20 right-5 z-50 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 text-slate-100">
            <div className="p-3 pb-2">
              <div className="text-xs uppercase tracking-wider text-yellow-300 font-bold mb-1">Demo navigator · switch view</div>
              <div className="text-xs text-slate-400">Hop between the four sides of the platform without signing out. MVP / demo mode.</div>
            </div>
            {modes.map(m => (
              <button key={m.k} onClick={() => { setMode(m.k); setOpen(false); }}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition ${mode === m.k ? "bg-yellow-400 text-slate-900" : "hover:bg-slate-800 text-slate-100"}`}>
                <m.icon size={20} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm flex items-center gap-2">{m.label}</div>
                  <div className={`text-xs mt-0.5 ${mode === m.k ? "text-slate-700" : "text-slate-400"}`}>{m.desc}</div>
                </div>
              </button>
            ))}
            <div className="p-3 pt-2 mt-1 border-t border-slate-800">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Acting as company</div>
              <select value={companyId} onChange={e => setCompanyId(+e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-yellow-400">
                {DATA_BUNDLE.companies.map(c => <option key={c.id} value={c.id}>{c.name} · {c.stage}</option>)}
              </select>
            </div>
            <div className="p-3 pt-2 mt-1 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[10px] text-slate-500">Signed in as <span className="font-mono">{user?.email}</span></div>
              <button onClick={logout} className="text-xs text-yellow-300 hover:underline">Sign out</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ============================================================
// COMPANY INTROS VIEW — candidates Zap personally introduced to you
// ============================================================
const INTRO_STATUS_META = {
  pending: { label: "Pending review", color: "yellow", desc: "Zap just sent this — review & decide." },
  scheduled: { label: "Call scheduled", color: "blue", desc: "Conversation booked." },
  intro_sent: { label: "Intro sent", color: "purple", desc: "We've connected you both." },
  passed: { label: "Passed", color: "default", desc: "Not the right fit for this role." },
  hired: { label: "Hired", color: "green", desc: "Closed the loop. 🎉" },
};

function IntrosView({ companyId, onOpenCandidate }) {
  const [filter, setFilter] = useState("all");
  const myIntros = useMemo(() => INTROS.filter(i => i.companyId === companyId), [companyId]);
  const filtered = filter === "all" ? myIntros : myIntros.filter(i => i.status === filter);
  const counts = useMemo(() => {
    const o = {};
    myIntros.forEach(i => { o[i.status] = (o[i.status] || 0) + 1; });
    return o;
  }, [myIntros]);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-3xl font-black font-display">Intros from Zap</h2>
          <Tag color="yellow"><Sparkles size={10} /> Hand-picked</Tag>
        </div>
        <div className="text-sm text-stone-500 mt-1">
          Candidates Zap personally introduced to you, with her notes. Every intro is a warm one — there are no algorithmic auto-pings here.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs rounded-full border ${filter === "all" ? "bg-yellow-400 border-yellow-400 text-black font-bold" : "bg-white border border-stone-300 text-stone-700"}`}>
          All <span className="opacity-60">{myIntros.length}</span>
        </button>
        {Object.entries(INTRO_STATUS_META).map(([k, m]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 text-xs rounded-full border flex items-center gap-1.5 ${filter === k ? "bg-yellow-400 border-yellow-400 text-black font-bold" : "bg-white border border-stone-300 text-stone-700"}`}>
            {m.label} <span className="opacity-60">{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="text-center py-10">
          <Coffee className="text-stone-500 mx-auto mb-2" size={28} />
          <div className="font-bold">No intros in this state yet.</div>
          <div className="text-xs text-stone-500 mt-1">Zap sends every intro personally — they appear here as soon as they're made.</div>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map(intro => {
          const c = DATA_BUNDLE.candidates.find(cn => cn.id === intro.candidateId);
          if (!c) return null;
          const meta = INTRO_STATUS_META[intro.status];
          return (
            <Card key={intro.id} className="hover:border-yellow-300 transition">
              <div className="flex gap-4 items-start">
                <Avatar candidate={c} size={56} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-bold text-lg truncate">{c.firstName} {c.lastName}</div>
                        {c.archetype && <ArchetypeBadge quad={c.archetype} />}
                        <Tag color={meta.color}>{meta.label}</Tag>
                      </div>
                      <div className="text-sm text-stone-500 truncate">{c.currentRole} · {c.currentCompany}</div>
                      <div className="text-xs text-stone-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span><Clock size={10} className="inline mr-0.5" /> {c.yearsExperience} yrs</span>
                        <span><MapPin size={10} className="inline mr-0.5" /> {c.location}</span>
                        <span><Calendar size={10} className="inline mr-0.5" /> Introduced {intro.introducedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-yellow-50 border-l-2 border-yellow-400 rounded-r-md p-3 text-sm italic text-stone-900">
                    <div className="text-[10px] uppercase tracking-wider text-amber-500 font-bold mb-1 not-italic">Zap's note</div>
                    "{intro.note}"
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">{c.skills.slice(0, 5).map(s => <Tag key={s}>{s}</Tag>)}</div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Button size="sm" icon={Eye} onClick={() => onOpenCandidate(c.id)}>View profile</Button>
                    {intro.status === "pending" && <>
                      <Button size="sm" variant="secondary" icon={Calendar}>Schedule call</Button>
                      <Button size="sm" variant="ghost" icon={X}>Pass</Button>
                    </>}
                    {intro.status === "scheduled" && <Button size="sm" variant="secondary" icon={Coffee}>View call details</Button>}
                    {intro.status === "intro_sent" && <Button size="sm" variant="secondary" icon={MessageSquare}>Open thread</Button>}
                    {intro.status === "hired" && <Tag color="green">🎉 Closed</Tag>}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// TOP-LEVEL APP — ModeSwitcher-driven router
// ============================================================
export default function App() {
  return (
    <AuthProvider>
      <AuthedApp />
    </AuthProvider>
  );
}

function AuthedApp() {
  const { user, logout } = useAuth();
  if (!user) return <LoginScreen />;
  return <SignedInShell key={user.email} user={user} logout={logout} />;
}

function SignedInShell({ user, logout }) {
  // The `key={user.email}` on AuthedApp ensures this remounts when the user changes,
  // so initialMode honors the role the user signed in with.
  const initialMode = user.role === "admin" ? "candidate" : (user.role === "talent" ? "candidate" : user.role);
  const [mode, setMode] = useState(initialMode);
  const [companyId, setCompanyId] = useState(user.companyId || 5);
  return (
    <>
      {(mode === "candidate" || mode === "talent") && <TalentPortal onExit={logout} candidateId={user.candidateId || DEMO_TALENT_CANDIDATE_ID} />}
      {mode === "company" && <CompanyPortal preselectedCompanyId={companyId} onExit={logout} />}
      {mode === "investor" && <InvestorPortal onExit={logout} investorId={user.investorId || 1} />}
      {mode === "admin" && <AdminPortal onExit={logout} />}
      {/* Persistent ModeSwitcher — always visible during demo/MVP for fast cross-role testing */}
      <ModeSwitcher mode={mode} setMode={setMode} companyId={companyId} setCompanyId={setCompanyId} />
    </>
  );
}

function InvestorComingSoon({ onExit }) {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="text-6xl">💼</div>
        <h1 className="font-display text-3xl">Investor portal · coming next</h1>
        <p className="text-stone-500">The investor / portfolio company view is the next major build. For now, sign in as <span className="font-mono">company@lt.house</span> or <span className="font-mono">zap@lt.house</span> to explore the working sections.</p>
        <Button variant="secondary" onClick={onExit}>Sign out</Button>
      </div>
    </div>
  );
}
