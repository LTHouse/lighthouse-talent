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
// DATA IMPORTS — 154 candidates, 18 companies, 93 intros
// ============================================================
import { DATA_BUNDLE, INTROS } from './data.js';

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
  ["#FFD60A", "#0A1628"], ["#FF8E3C", "#fff"], ["#7DD3FC", "#0A1628"], ["#A78BFA", "#fff"],
  ["#FCA5A5", "#0A1628"], ["#86EFAC", "#0A1628"], ["#FCD34D", "#0A1628"], ["#F472B6", "#fff"],
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
    default: "bg-slate-700/60 text-slate-200 border-slate-600",
    yellow: "bg-yellow-400/15 text-yellow-300 border-yellow-400/40",
    blue: "bg-sky-400/15 text-sky-300 border-sky-400/40",
    purple: "bg-violet-400/15 text-violet-300 border-violet-400/40",
    green: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
    red: "bg-rose-400/15 text-rose-300 border-rose-400/40",
    orange: "bg-orange-400/15 text-orange-300 border-orange-400/40",
    light: "bg-slate-800 text-slate-300 border-slate-700",
  };
  const sz = size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return <span className={`inline-flex items-center gap-1 rounded-full border ${palette[color] || palette.default} ${sz} font-medium whitespace-nowrap`}>{children}</span>;
}

function Button({ children, onClick, variant = "primary", size = "md", disabled, className = "", icon: Icon, type = "button" }) {
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  const variants = {
    primary: "bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-bold",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 font-semibold",
    ghost: "bg-transparent text-slate-300 hover:bg-slate-800/50 font-semibold",
    outline: "bg-transparent text-slate-100 border border-slate-600 hover:bg-slate-800 font-semibold",
    danger: "bg-rose-600 text-white hover:bg-rose-500 font-semibold",
    skip: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-600 font-semibold",
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
         className={`bg-slate-900/70 border border-slate-800 rounded-xl ${padded ? "p-5" : ""} ${onClick ? "cursor-pointer hover:border-slate-700 transition" : ""} ${className}`}>
      {children}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = "bg-yellow-400" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center gap-1 mb-1">
      {steps.map((s, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-yellow-400" : i === current ? "bg-yellow-400/60" : "bg-slate-800"}`} />
      ))}
    </div>
  );
}

function Slider({ value, onChange, min = 0, max = 10, step = 1 }) {
  return (
    <div className="space-y-2">
      <div className="text-center">
        <div className="text-7xl font-black text-yellow-400 tabular-nums">{value}</div>
        <div className="text-xs text-slate-500 mt-1">
          {value === 0 ? "Strongly Disagree" : value === 5 ? "Neutral" : value === 10 ? "Strongly Agree" : value < 5 ? "Disagree" : "Agree"}
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-full accent-yellow-400 cursor-pointer h-2" />
      <div className="flex justify-between text-[10px] text-slate-600 px-1">
        <span>0</span><span>2</span><span>4</span><span>5</span><span>6</span><span>8</span><span>10</span>
      </div>
    </div>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-yellow-400">*</span>}
      </label>
      {children}
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

function Input(props) {
  return <input {...props}
    className={`w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-yellow-400/60 ${props.className || ""}`} />;
}

function Textarea(props) {
  return <textarea {...props}
    className={`w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-yellow-400/60 resize-y ${props.className || ""}`} />;
}

function Select({ value, onChange, options, className = "" }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-yellow-400/60 ${className}`}>
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
            ? "bg-yellow-400 border-yellow-400 text-slate-900 font-bold"
            : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

function RangeSlider({ min, max, value, onChange, step = 1, format = (v) => v }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{format(value[0])}</span><span>{format(value[1])}</span>
      </div>
      <div className="relative h-1.5 bg-slate-800 rounded-full">
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
        <div className="flex items-start justify-start p-2 text-yellow-400/90">{"⚡ Pioneer"}</div>
        <div className="flex items-start justify-end p-2 text-orange-400/90">{"🚀 Founder"}</div>
        <div className="flex items-end justify-start p-2 text-sky-400/90">{"🔬 Craftsperson"}</div>
        <div className="flex items-end justify-end p-2 text-violet-400/90">{"🎯 Athlete"}</div>
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
            return <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs shadow-xl">
              <div className="font-bold text-slate-100">{p.name}</div>
              {p.archetype && <div className="text-slate-400 mt-0.5">{ARCHETYPES[p.archetype]?.icon} {p.archetype}</div>}
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
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-yellow-500/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative z-10 max-w-5xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="text-yellow-400 fill-yellow-400" size={36} />
            <div className="text-3xl font-black tracking-tight">Lighthouse</div>
            <span className="text-slate-500 text-sm">Talent</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-4">
            A curated network of <span className="text-yellow-400">startup talent</span> for Nashville's best companies.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Vetted by Zap. Searched in plain English. Hired without the noise.
          </p>
          <div className="text-slate-500 text-xs mt-3">Prototype · Pick a side to explore.</div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { key: "candidate", label: "I'm a candidate", desc: "Apply to be in Zap's database.", icon: UserPlus, hint: "~7 min, optional 5-min deep dive" },
            { key: "company", label: "I'm hiring", desc: "Search vetted talent in plain English.", icon: Search, hint: "Login as acme@lt.house" },
            { key: "admin", label: "Admin (Zap)", desc: "Manage the database, vetting, & insights.", icon: Shield, hint: "Internal tool" },
          ].map(opt => (
            <button key={opt.key} onClick={() => onPick(opt.key)}
                    className="group bg-slate-900/70 border border-slate-800 rounded-2xl p-6 text-left hover:border-yellow-400/40 hover:bg-slate-900 transition-all">
              <opt.icon size={28} className="text-yellow-400 mb-3" />
              <div className="text-xl font-bold text-slate-100 mb-1">{opt.label}</div>
              <div className="text-sm text-slate-400 mb-3">{opt.desc}</div>
              <div className="text-xs text-slate-600">{opt.hint}</div>
              <div className="mt-4 inline-flex items-center gap-1 text-yellow-400 text-sm font-bold group-hover:gap-2 transition-all">
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

function CandidateIntakeFlow({ onExit }) {
  const [step, setStep] = useState(0);
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
  function next() { setStep(s => Math.min(CANDIDATE_STEPS.length - 1, s + 1)); }
  function back() { setStep(s => Math.max(0, s - 1)); }
  function update(patch) { setProfile(p => ({ ...p, ...patch })); }
  function updateVibe(patch) { setProfile(p => ({ ...p, vibe: { ...p.vibe, ...patch } })); }

  const showProgress = step > 0 && step < CANDIDATE_STEPS.length - 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={onExit} className="flex items-center gap-2 text-slate-400 hover:text-yellow-400">
            <Zap className="text-yellow-400 fill-yellow-400" size={18} />
            <span className="font-black tracking-tight text-slate-100">Lighthouse</span>
            <span className="text-slate-500 text-xs">Talent</span>
          </button>
          {showProgress && <div className="text-xs text-slate-500 tabular-nums">Step {step}/{5}</div>}
        </div>
        {showProgress && (
          <div className="max-w-3xl mx-auto px-6 pb-3">
            <StepIndicator current={step - 1} steps={CANDIDATE_STEPS.slice(1, 6)} />
          </div>
        )}
      </div>
      <div className="max-w-3xl mx-auto px-6 py-10">
        {step === 0 && <CandidateLanding onStart={next} />}
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
        {step === 7 && <Confirmation profile={profile} onExit={onExit} onTakeAssessment={() => setStep(5)} />}
      </div>
    </div>
  );
}

function CandidateLanding({ onStart }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-2">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.05]">
          Get on <span className="text-yellow-400">Zap's list.</span>
        </h1>
        <p className="text-slate-400 text-lg mt-4 max-w-2xl mx-auto">
          The Lighthouse Talent Network is a curated database of operators, builders, and creatives for Nashville's best startups. Every member is personally vetted by Zap.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-3 my-8">
        {[
          { i: "01", t: "Tell us about you", d: "Connect LinkedIn or upload a CV." },
          { i: "02", t: "Answer a few questions", d: "Roles, ranges, and a quick vibe check." },
          { i: "03", t: "Submit", d: "Zap reviews every application personally." },
        ].map(s => (
          <Card key={s.i} className="bg-slate-900/40">
            <div className="text-yellow-400 font-bold text-xs tracking-widest">{s.i}</div>
            <div className="text-xl font-bold mt-1">{s.t}</div>
            <div className="text-sm text-slate-400 mt-1">{s.d}</div>
          </Card>
        ))}
      </div>
      <Card className="bg-slate-900/40">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">What happens next</div>
        <div className="space-y-1.5 text-sm text-slate-300">
          <div>1. Zap reviews your application within 5 business days.</div>
          <div>2. If approved, we'll set up coffee or a Zoom to get to know you in person.</div>
          <div>3. Once vetted, you're added to the live database for startups to find.</div>
          <div>4. We make warm intros directly — you don't apply to roles, founders come to you.</div>
        </div>
      </Card>
      <div className="text-center space-y-3 pt-4">
        <Button size="lg" icon={Zap} onClick={onStart}>Start your application</Button>
        <div className="text-xs text-slate-500">
          Required: ~7 minutes. Optional 5-minute archetype dive available at the end.
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
        <div className="text-sm text-slate-500 mt-1">This usually takes a few seconds.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Step 1 of 5</div>
        <h2 className="text-3xl font-black">Connect your career</h2>
        <p className="text-slate-400 mt-1">We'll auto-fill your profile so you don't have to type it twice.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Card className="hover:border-yellow-400/30 transition cursor-pointer" onClick={pickLinkedIn}>
          <Linkedin size={28} className="text-sky-400 mb-3" />
          <div className="text-lg font-bold">Import from LinkedIn</div>
          <div className="text-sm text-slate-400 mt-1">Fastest. We pull your role, history, and skills automatically.</div>
          <div className="mt-4 inline-flex items-center gap-1 text-yellow-400 text-sm font-bold">
            Connect LinkedIn <ChevronRight size={16} />
          </div>
        </Card>
        <Card className="hover:border-yellow-400/30 transition">
          <Upload size={28} className="text-yellow-400 mb-3" />
          <div className="text-lg font-bold">Upload your CV</div>
          <div className="text-sm text-slate-400 mt-1">PDF or DOCX. We'll parse it for you.</div>
          <div className="mt-4 border-2 border-dashed border-slate-700 rounded-lg p-4 text-center">
            <input type="file" id="cv-upload" accept=".pdf,.docx" className="hidden"
                   onChange={e => e.target.files[0] && pickCV(e.target.files[0])} />
            <label htmlFor="cv-upload" className="cursor-pointer">
              <div className="text-xs text-slate-500 mb-2">Drop a file here or</div>
              <Button size="sm" variant="secondary" type="button" onClick={() => document.getElementById("cv-upload")?.click()}>Choose file</Button>
            </label>
          </div>
        </Card>
      </div>
      <div className="text-center pt-4">
        <button onClick={pickManual} className="text-sm text-slate-400 hover:text-yellow-400 underline underline-offset-4">
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
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Step 1 · Review</div>
        <h2 className="text-3xl font-black">Looks good?</h2>
        <p className="text-slate-400 mt-1">We pulled the basics. Tweak anything that's off.</p>
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
            <span key={s} className="inline-flex items-center gap-1 bg-yellow-400/15 text-yellow-300 border border-yellow-400/40 px-2 py-1 rounded-full text-xs font-medium">
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
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">{w.title}</div>
                  <div className="text-slate-400 text-xs">{w.company} · {w.startYear}–{w.endYear}</div>
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
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm">
                <div className="font-bold text-slate-200">{e.school}</div>
                <div className="text-slate-400 text-xs">{e.degree} · {e.year}</div>
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
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Step 2 · The basics</div>
        <h2 className="text-3xl font-black">Tell us what you want.</h2>
        <p className="text-slate-400 mt-1">Short and direct. Not a soul-bearing exercise.</p>
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
          <Field label="Salary expectations" hint={profile.salaryOptOut ? "Hidden — will be discussed in the vetting call." : `${profile.salaryMin}K — ${profile.salaryMax}K USD`}>
            {!profile.salaryOptOut && (
              <RangeSlider min={50} max={300} value={[profile.salaryMin, profile.salaryMax]}
                onChange={v => update({ salaryMin: v[0], salaryMax: v[1] })} format={v => `$${v}K`} />
            )}
            <label className="flex items-center gap-2 text-sm text-slate-400 mt-2 cursor-pointer">
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
  const questions = [
    { key: "nerdAbout", q: "What's something you nerd out about that has nothing to do with work?", placeholder: "Photography, sourdough, marathon running..." },
    { key: "managerWords", q: "If your last manager described you in 3 words, what would they be?", placeholder: "scrappy, organized, funny" },
    { key: "futureSelfJoke", q: "If your future self could joke about you today, what would they say?", placeholder: "You used to think calendar invites were optional..." },
    { key: "karaoke", q: "What's your go-to karaoke song? 🎵", placeholder: "Wagon Wheel — Old Crow Medicine Show" },
  ];
  const cur = questions[sub];
  return (
    <div className="space-y-8 min-h-[60vh] flex flex-col">
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Step 3 · Vibe check ({sub + 1}/4)</div>
        <h2 className="text-3xl font-black">Quick warm-up.</h2>
        <p className="text-slate-400 mt-1">No wrong answers.</p>
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
        <h2 className="text-4xl md:text-5xl font-black">Want to go deeper?</h2>
        <p className="text-slate-300 text-lg max-w-2xl">
          Spend 5 more minutes telling us how you actually like to work. We'll plot you on our talent map and assign you an archetype that helps startups understand at a glance whether you're the right kind of person for what they're building.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button size="lg" icon={Zap} onClick={() => setStage("running")}>Yes, let's do it</Button>
          <Button size="lg" variant="skip" onClick={onSkip}>Skip for now</Button>
        </div>
        <p className="text-sm text-slate-500">You can always come back and finish this later.</p>
      </div>
    );
  }
  if (stage === "calculating") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="animate-spin h-12 w-12 border-4 border-yellow-400 border-t-transparent rounded-full mb-6" />
        <div className="text-xl font-bold">Calculating your archetype...</div>
        <div className="text-sm text-slate-500 mt-1">Plotting you on the talent map.</div>
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
          <div className="text-xs text-slate-500 mt-2">Page {page + 1} of 4 · Statement {start + 1}–{start + 4} of 16</div>
        </div>
        <ProgressBar value={start + 4} max={16} />
      </div>
      <div className="space-y-8 pt-2">
        {pageStatements.map((origIdx, i) => (
          <div key={origIdx} className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
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
        <h2 className="text-5xl font-black mt-2 tracking-tight">{a.label}</h2>
        <div className="text-sm text-slate-400 mt-1">{a.short}</div>
        <p className="text-slate-300 mt-4 max-w-xl mx-auto">{a.desc}</p>
      </div>
      <Card>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Where you sit on the map</div>
        <ArchetypePlot candidates={heatmap} highlight={profile} />
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Your scores breakdown</div>
        <div className="space-y-3">
          <ScoreBar leftLabel="Builder" rightLabel="Operator" leftScore={builder} rightScore={operator} />
          <ScoreBar leftLabel="Specialist" rightLabel="Generalist" leftScore={spec} rightScore={gen} />
        </div>
      </Card>
      <Card>
        <button onClick={() => setShowAll(!showAll)} className="w-full text-left flex items-center justify-between text-sm font-semibold text-slate-300">
          <span>See your individual responses</span>
          {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showAll && (
          <div className="mt-3 space-y-2">
            {ARCHETYPE_STATEMENTS.map((s, i) => (
              <div key={i} className="flex items-start gap-3 text-sm border-t border-slate-800 pt-2 first:border-0 first:pt-0">
                <div className="text-yellow-400 font-bold tabular-nums w-8 flex-shrink-0">{profile.archetypeScores[i]}/10</div>
                <div className="text-slate-300">{s}</div>
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
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span className="font-semibold">{leftLabel} <span className="text-slate-500">{leftScore}</span></span>
        <span className="font-semibold"><span className="text-slate-500">{rightScore}</span> {rightLabel}</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
        <div className="h-full bg-yellow-400" style={{ width: `${leftPct}%` }} />
        <div className="h-full bg-violet-400" style={{ width: `${100 - leftPct}%` }} />
      </div>
    </div>
  );
}

function Confirmation({ profile, onExit, onTakeAssessment }) {
  const a = profile.archetype ? ARCHETYPES[profile.archetype] : null;
  return (
    <div className="space-y-6 text-center">
      <CheckCircle2 size={64} className="text-yellow-400 mx-auto" />
      <h2 className="text-5xl font-black">You're on the list <Zap className="inline text-yellow-400 fill-yellow-400" /></h2>
      <p className="text-slate-300 text-lg max-w-xl mx-auto">
        Zap reviews every application personally. You'll hear from us within 5 business days. If approved, we'll set up coffee or a Zoom to get to know you in person — that's how every candidate gets into the live database.
      </p>
      {a && (
        <Card className="text-left max-w-md mx-auto">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Your archetype</div>
          <div className="flex items-center gap-3">
            <div className="text-5xl">{a.icon}</div>
            <div>
              <div className="text-2xl font-black">{a.label}</div>
              <div className="text-xs text-slate-400">{a.short}</div>
            </div>
          </div>
        </Card>
      )}
      {!profile.hasAssessment && (
        <Card className="max-w-md mx-auto bg-slate-900/40 border-yellow-400/20">
          <div className="text-sm">
            Want to add your archetype later? It takes 5 minutes.
            <button onClick={onTakeAssessment} className="block mt-2 text-yellow-400 font-bold hover:underline">Take the assessment →</button>
          </div>
        </Card>
      )}
      <Card className="text-left max-w-md mx-auto">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">What's next</div>
        <div className="space-y-2 text-sm">
          {[
            ["Application Review", "Within 5 business days"],
            ["Vetting Conversation", "Coffee or Zoom"],
            ["Database Live", "We start matching you to roles"],
            ["Warm Intros", "Founders come to you"],
          ].map(([t, d], i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-400 text-slate-900 font-bold text-xs flex items-center justify-center flex-shrink-0">{i + 1}</div>
              <div>
                <div className="font-bold text-slate-200">{t}</div>
                <div className="text-xs text-slate-500">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="pt-4">
        <Button variant="secondary" icon={Mail} onClick={onExit}>Subscribe to Zap's Wrap</Button>
      </div>
      <button onClick={onExit} className="text-sm text-slate-500 hover:text-yellow-400">Back to home</button>
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
            onRunSearch={runSearch} setSearches={setSavedSearches} />
        )}
        {view === "intros" && (
          <IntrosView companyId={me} onOpenCandidate={(id) => { setActiveId(id); setView("profile"); }} />
        )}
      </div>
    </div>
  );
}

function CompanyShellHeader({ company, onExit, setView, view }) {
  return (
    <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => setView("home")} className="flex items-center gap-2 hover:text-yellow-400">
            <Zap className="text-yellow-400 fill-yellow-400" size={18} />
            <span className="font-black tracking-tight">Lighthouse</span>
            <span className="text-slate-500 text-xs">Hire</span>
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {[
              { k: "home", l: "Search", icon: Search },
              { k: "intros", l: "Intros", icon: Coffee },
              { k: "searches", l: "My Searches", icon: BookOpenCheck },
              { k: "shortlists", l: "Shortlists", icon: Star },
            ].map(it => (
              <button key={it.k} onClick={() => setView(it.k)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1.5 ${view === it.k ? "bg-slate-800 text-yellow-400" : "text-slate-400 hover:text-slate-100"}`}>
                <it.icon size={14} />{it.l}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 hidden sm:block">{company?.name}</div>
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
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <Zap className="text-yellow-400 fill-yellow-400 mx-auto mb-2" size={32} />
          <div className="font-black text-2xl">Lighthouse Hire</div>
          <div className="text-sm text-slate-400 mt-1">Find your next teammate.</div>
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
          <button onClick={onExit} className="text-xs text-slate-500 hover:text-yellow-400">← Back to landing</button>
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
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">Find your next hire <Zap className="inline text-yellow-400 fill-yellow-400" /></h1>
        <p className="text-slate-400 text-lg mt-3">Describe what you need. We'll match you with vetted talent from Nashville and beyond.</p>
      </div>
      <Card padded={false} className="p-2">
        <Textarea rows={5} value={text} onChange={e => setText(e.target.value)}
          placeholder={`We're looking for an early-stage operator who can run our day-to-day, set up vendor relationships, manage our 12-person team, and act as the glue person across departments. Bonus if they have experience scaling a Series A company...`}
          className="border-0 bg-transparent text-base" />
        <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-slate-800">
          <div className={`text-xs ${inRange ? "text-emerald-400" : "text-slate-500"}`}>
            {wordCount} words {inRange ? "✓ great length" : "· recommended 25–50 words (you can write more)"}
          </div>
          <Button onClick={() => text.trim() && onSearch(text)} icon={Search} disabled={!text.trim()}>Search</Button>
        </div>
      </Card>
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Or start from a preset</div>
        <div className="flex flex-wrap justify-center gap-2">
          {presets.map(p => (
            <button key={p.t} onClick={() => setText(p.q)}
                    className="bg-slate-900 border border-slate-800 hover:border-yellow-400/40 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-yellow-400 transition">
              {p.t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-4">
        <button onClick={() => setView("searches")} className="hover:text-yellow-400">Recent searches →</button>
        <span>·</span>
        <button onClick={() => setView("shortlists")} className="hover:text-yellow-400">My shortlists →</button>
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
      <div className="text-lg font-bold text-center">Reading your description...<br/><span className="text-slate-400 text-sm">matching against vetted talent... ranking results.</span></div>
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
          <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Search</div>
          <div className="text-sm text-slate-300 max-w-3xl line-clamp-2">{query}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={Save} onClick={onSaveSearch}>Save search</Button>
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
            <div className="text-sm text-slate-400">
              <span className="font-bold text-yellow-400">{top.length}</span> candidates ranked {refinement.skillScores && <Tag color="yellow"><Sparkles size={10} /> Refined by skill spec</Tag>}
              {refinement.cultureArchetype && <span> · culture: <Tag color="purple">{CULTURE_ARCHETYPES[refinement.cultureArchetype.quad]?.icon} {refinement.cultureArchetype.quad}</Tag></span>}
            </div>
            <div className="flex items-center gap-2">
              <Select value={sort} onChange={setSort} className="text-xs py-1 w-auto"
                options={[{ value: "match", label: "Sort: Match score" }, { value: "yoe", label: "Sort: Experience" }, { value: "recent", label: "Sort: Recently joined" }]} />
              <div className="flex bg-slate-900 rounded-lg border border-slate-800 p-0.5">
                {[{ k: "list", icon: List }, { k: "grid", icon: Grid3x3 }, { k: "map", icon: Map }].map(o => (
                  <button key={o.k} onClick={() => setViewMode(o.k)}
                          className={`p-1.5 rounded ${viewMode === o.k ? "bg-yellow-400 text-slate-900" : "text-slate-400 hover:text-slate-100"}`}>
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
              <Card key={candidate.id} onClick={() => onOpenProfile(candidate.id)} className="hover:border-yellow-400/30">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar candidate={candidate} size={36} />
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{candidate.firstName} {candidate.lastName}</div>
                    <div className="text-xs text-slate-400 truncate">{candidate.currentRole}</div>
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
              <AlertCircle className="text-slate-500 mx-auto mb-2" />
              <div className="font-bold">No matches yet</div>
              <div className="text-xs text-slate-500 mt-1">Try loosening your filters or rephrasing the search.</div>
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
    <Card className="border-yellow-400/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 font-bold">
          <Sparkles size={12} className="text-yellow-400" /> Here's what we heard
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
        <div><span className="text-slate-500 text-xs">Role type</span><div><Tag color="yellow">{interp.role}</Tag></div></div>
        <div><span className="text-slate-500 text-xs">Seniority</span><div><Tag color="blue">{interp.seniority} ({interp.years[0]}–{interp.years[1]} yrs)</Tag></div></div>
        {interp.stage && <div><span className="text-slate-500 text-xs">Stage fit</span><div><Tag color="green">{interp.stage}</Tag></div></div>}
        <div><span className="text-slate-500 text-xs">Location</span><div><Tag>{interp.location}</Tag></div></div>
        <div className="sm:col-span-2"><span className="text-slate-500 text-xs">Key skills</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {interp.skills.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-yellow-400/15 text-yellow-300 border border-yellow-400/40 px-2 py-0.5 rounded-full text-xs font-medium">
                {s}
                <button onClick={() => removeSkill(s)} className="ml-1 opacity-60 hover:opacity-100"><X size={10} /></button>
              </span>
            ))}
          </div>
        </div>
        {interp.archetypeLean && (
          <div className="sm:col-span-2"><span className="text-slate-500 text-xs">Archetype lean</span>
            <div><ArchetypeBadge quad={interp.archetypeLean} size="lg" /> <span className="text-xs text-slate-500 ml-1">inferred</span></div>
          </div>
        )}
        {interp.signals.length > 0 && (
          <div className="sm:col-span-2"><span className="text-slate-500 text-xs">Other signals</span>
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
    <Card className="bg-slate-900/40">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Did we get this right? <Tag color="yellow">OPTIONAL</Tag></div>
        <button onClick={onDismiss} className="text-slate-500 hover:text-slate-200"><X size={14} /></button>
      </div>
      <div className="text-sm text-slate-300 mb-3">Here are a few similar roles in our database that might match what you're describing.</div>
      <div className="grid sm:grid-cols-3 gap-2">
        {jds.map(jd => (
          <div key={jd.id} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <div className="text-sm font-bold">{jd.title}</div>
            <div className="text-xs text-slate-400 mt-0.5">{jd.stage} · {jd.industry}</div>
            <button onClick={() => setExpanded(expanded === jd.id ? null : jd.id)} className="text-xs text-yellow-400 mt-2 hover:underline">
              {expanded === jd.id ? "Hide JD" : "View JD"}
            </button>
            {expanded === jd.id && <div className="text-xs text-slate-300 mt-2 pt-2 border-t border-slate-800">{jd.body}</div>}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800">
        <Button size="sm" onClick={onLockIn}>Yes, this is what we want</Button>
        <Button size="sm" variant="skip" onClick={onDismiss}>Not quite — let me refine</Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>Skip this step</Button>
      </div>
    </Card>
  );
}

function RefineCard({ onStart, onDismiss }) {
  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-violet-900/20 border-violet-500/20">
      <div className="flex items-start gap-3">
        <Sparkles className="text-violet-400 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-violet-400/90 font-bold flex items-center gap-2">Power user mode <Tag color="purple">OPTIONAL</Tag></div>
          <div className="text-sm font-bold mt-0.5">Not quite finding the right fit?</div>
          <div className="text-sm text-slate-400">Spend 5 minutes telling us exactly what you need and what your company culture is like. We'll re-rank candidates based on the perfect match.</div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={onStart}>Start refining</Button>
            <Button size="sm" variant="skip" onClick={onDismiss}>Skip</Button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-slate-500 hover:text-slate-200"><X size={14} /></button>
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
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
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
                      className={`px-2 py-0.5 text-[10px] rounded-full border transition ${filters.skills.includes(s) ? "bg-yellow-400 border-yellow-400 text-slate-900 font-bold" : "bg-slate-900 border-slate-700 text-slate-300"}`}>
                {s}
              </button>
            ))}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={filters.vettedOnly} onChange={e => setFilters({ ...filters, vettedOnly: e.target.checked })} className="accent-yellow-400" />
          <span className="text-slate-300">Only Zap-vetted candidates</span>
        </label>
      </Card>
      <Card>
        <button onClick={() => setArchetypeOpen(!archetypeOpen)} className="w-full text-left flex items-center justify-between text-xs uppercase tracking-wider text-slate-500 font-bold">
          <span>Archetype filter <Tag color="purple">OPTIONAL</Tag></span>
          {archetypeOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {archetypeOpen && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(ARCHETYPES).filter(([k]) => k !== "Balanced").map(([k, a]) => (
                <button key={k} onClick={() => setFilters({ ...filters, archetypes: toggle(filters.archetypes, k) })}
                        className={`p-2 rounded-lg text-xs text-left border transition ${filters.archetypes.includes(k) ? "border-yellow-400 bg-yellow-400/10" : "border-slate-800 hover:border-slate-700"}`}>
                  <div className="text-base">{a.icon}</div>
                  <div className="font-bold">{k}</div>
                  <div className="text-slate-500 text-[10px]">{a.short}</div>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={filters.assessmentOnly} onChange={e => setFilters({ ...filters, assessmentOnly: e.target.checked })} className="accent-yellow-400" />
              <span className="text-slate-300">Only candidates who completed assessment</span>
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
    <Card className="hover:border-yellow-400/30 transition">
      <div className="flex gap-4">
        <Avatar candidate={candidate} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold text-lg truncate">{candidate.firstName} {candidate.lastName}</div>
                {candidate.archetype && <ArchetypeBadge quad={candidate.archetype} />}
              </div>
              <div className="text-sm text-slate-400 truncate">{candidate.currentRole} {candidate.currentCompany && `· ${candidate.currentCompany}`}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                <span><Clock size={10} className="inline mr-0.5" /> {candidate.yearsExperience} yrs</span>
                <span><MapPin size={10} className="inline mr-0.5" /> {candidate.location}</span>
                {candidate.salary && !candidate.salary.optOut && <span><DollarSign size={10} className="inline" />{candidate.salary.min}–{candidate.salary.max}K</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-yellow-400 tabular-nums leading-none">{score}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-0.5 group relative">
                match
                <div className="absolute right-0 top-5 w-56 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-left text-slate-300 hidden group-hover:block z-20 shadow-xl">
                  <div className="font-bold text-yellow-400 mb-1">Score breakdown</div>
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
            {candidate.skills.length > 4 && <span className="text-xs text-slate-500">+{candidate.skills.length - 4}</span>}
          </div>
          <div className="text-sm text-slate-300 mt-2 italic line-clamp-2">{explainMatch(candidate, interp)}</div>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" icon={Coffee} onClick={() => alert("Mock: drafting an intro for Zap...")}>Request intro</Button>
            <div className="relative">
              <Button size="sm" variant="secondary" icon={Star} onClick={() => setShowShort(!showShort)}>Save</Button>
              {showShort && (
                <div className="absolute top-9 right-0 w-56 bg-slate-900 border border-slate-700 rounded-lg p-2 z-30 shadow-xl">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Save to shortlist</div>
                  {shortlists.length === 0 && <div className="text-xs text-slate-400 p-2">No shortlists yet.</div>}
                  {shortlists.map(s => (
                    <button key={s.id} onClick={() => { onShortlist(s.id); setShowShort(false); }}
                            className="w-full text-left text-xs p-2 hover:bg-slate-800 rounded">
                      {s.name} <span className="text-slate-500">({s.candidateIds.length})</span>
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
              <div className="text-3xl font-black">{candidate.firstName} {candidate.lastName}</div>
              {candidate.archetype && <ArchetypeBadge quad={candidate.archetype} size="lg" />}
            </div>
            <div className="text-slate-400">{candidate.currentRole} · {candidate.currentCompany}</div>
            <div className="flex gap-3 mt-2 text-xs text-slate-500">
              <span><Clock size={11} className="inline mr-0.5" /> {candidate.yearsExperience} yrs</span>
              <span><MapPin size={11} className="inline mr-0.5" /> {candidate.location}</span>
              {candidate.salary && !candidate.salary.optOut && <span><DollarSign size={11} className="inline" />{candidate.salary.min}–{candidate.salary.max}K</span>}
            </div>
          </div>
          <div className="text-right">
            <Button icon={Coffee}>Request intro</Button>
            <div className="text-xs text-slate-500 mt-1">via Zap, with context</div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Background</div>
            <div className="text-sm">
              <div className="font-bold mb-2">Work history</div>
              <div className="space-y-2">
                {candidate.workHistory.map((w, i) => (
                  <div key={i} className="border-l-2 border-slate-800 pl-3">
                    <div className="font-semibold text-slate-100">{w.title}</div>
                    <div className="text-slate-400 text-xs">{w.company} · {w.startYear}–{w.endYear}</div>
                  </div>
                ))}
              </div>
              <div className="font-bold mt-4 mb-2">Education</div>
              <div className="space-y-1">
                {candidate.education.map((e, i) => (
                  <div key={i} className="text-slate-300 text-sm">
                    <span className="font-semibold">{e.school}</span> · {e.degree} · {e.year}
                  </div>
                ))}
              </div>
              <div className="font-bold mt-4 mb-2">Skills</div>
              <div className="flex flex-wrap gap-1">{candidate.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Their story</div>
            <div className="space-y-3 text-sm">
              <div><div className="font-bold text-slate-200">Why startup?</div><div className="text-slate-300 mt-0.5">{candidate.whyStartup || "—"}</div></div>
              <div><div className="font-bold text-slate-200">What roles they want</div><div className="text-slate-300 mt-0.5">{candidate.roleSummary || "—"}</div></div>
              {candidate.biggestStrength && <div><div className="font-bold text-slate-200">Biggest strength</div><div className="text-slate-300 mt-0.5">{candidate.biggestStrength}</div></div>}
              {candidate.superpower && <div><div className="font-bold text-slate-200">Superpower outside work</div><div className="text-slate-300 mt-0.5 italic">"{candidate.superpower}"</div></div>}
              {candidate.proudShipped && candidate.proudShipped.length > 0 && (
                <div><div className="font-bold text-slate-200">Most proud of shipping</div>
                  <ul className="text-slate-300 mt-0.5 list-disc pl-4 space-y-0.5">{candidate.proudShipped.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
              )}
            </div>
          </Card>
          {candidate.vibe && (
            <Card>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Vibe check</div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><div className="text-slate-500 text-xs">Nerds out about</div><div className="text-slate-200">{candidate.vibe.nerdAbout || "—"}</div></div>
                <div><div className="text-slate-500 text-xs">Manager's 3 words</div><div className="text-slate-200">{Array.isArray(candidate.vibe.managerWords) ? candidate.vibe.managerWords.join(", ") : (candidate.vibe.managerWords || "—")}</div></div>
                <div><div className="text-slate-500 text-xs">Future-self joke</div><div className="text-slate-200 italic">"{candidate.vibe.futureSelfJoke || "—"}"</div></div>
                <div><div className="text-slate-500 text-xs">Karaoke song</div><div className="text-slate-200">🎵 {candidate.vibe.karaoke || "—"}</div></div>
              </div>
            </Card>
          )}
          {candidate.archetype && candidate.archetypeXY && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Archetype profile <Tag color="purple">OPTIONAL</Tag></div>
                <ArchetypeBadge quad={candidate.archetype} size="lg" />
              </div>
              <ArchetypePlot candidates={DATA_BUNDLE.candidates.filter(c => c.hasAssessment)} highlight={candidate} height={280} />
              {candidate.archetypeScores && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {ARCHETYPE_STATEMENTS.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 border-l-2 border-yellow-400/30 pl-2">
                      <span className="font-bold text-yellow-400 tabular-nums">{candidate.archetypeScores[i]}</span>
                      <span className="text-slate-400 line-clamp-1">{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">What they're looking for</div>
            <div className="space-y-2 text-sm">
              <div><span className="text-slate-500 text-xs">Stage</span><div className="flex flex-wrap gap-1 mt-1">{candidate.stagePreference.map(s => <Tag key={s} color="green">{s}</Tag>)}</div></div>
              <div><span className="text-slate-500 text-xs">Role types</span><div className="flex flex-wrap gap-1 mt-1">{candidate.roleTypes.map(s => <Tag key={s}>{s}</Tag>)}</div></div>
              <div><span className="text-slate-500 text-xs">Work mode</span><div><Tag>{candidate.workMode}</Tag></div></div>
              <div><span className="text-slate-500 text-xs">Timing</span><div><Tag color="orange">{candidate.timing}</Tag></div></div>
              <div><span className="text-slate-500 text-xs">Salary</span><div className="text-slate-200">{candidate.salary?.optOut ? "Prefers to discuss" : `$${candidate.salary?.min}–${candidate.salary?.max}K`}</div></div>
            </div>
          </Card>
          <Card className="border-violet-400/20">
            <div className="text-xs uppercase tracking-wider text-violet-400 font-bold mb-2">Zap's notes</div>
            <div className="text-sm text-slate-300">Zap met {candidate.firstName} in person on {candidate.dateApplied}. Vetting notes available on request.</div>
          </Card>
          <div className="space-y-2">
            <div className="relative">
              <Button className="w-full" icon={Star} variant="secondary" onClick={() => setShowShort(!showShort)}>Save to shortlist</Button>
              {showShort && (
                <div className="absolute top-12 left-0 right-0 bg-slate-900 border border-slate-700 rounded-lg p-2 z-30 shadow-xl">
                  {shortlists.length === 0 && <div className="text-xs text-slate-400 p-2">No shortlists yet.</div>}
                  {shortlists.map(s => (
                    <button key={s.id} onClick={() => { onShortlist(s.id); setShowShort(false); }}
                            className="w-full text-left text-xs p-2 hover:bg-slate-800 rounded">
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
        <h2 className="text-4xl font-black">Make it perfect.</h2>
        <p className="text-slate-300 text-lg">Two short assessments — one about what you really need in this role, one about your culture. Either is optional.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Card className="hover:border-yellow-400/40 cursor-pointer" onClick={() => setStage("skill")}>
            <BarChart3 className="text-yellow-400 mb-3" />
            <div className="font-bold text-lg">A: Skill Spec</div>
            <div className="text-sm text-slate-400 mt-1">12 statements about what you're really hiring for. Re-weights match scores.</div>
          </Card>
          <Card className="hover:border-violet-400/40 cursor-pointer" onClick={() => setStage("culture")}>
            <Users className="text-violet-400 mb-3" />
            <div className="font-bold text-lg">B: Culture</div>
            <div className="text-sm text-slate-400 mt-1">12 statements about how you work. Adds a culture-fit subscore.</div>
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
            <button onClick={() => { setSkipSkill(true); setStage("culture"); setPage(0); }} className="text-slate-400 hover:text-yellow-400 underline underline-offset-4">
              Skip this assessment
            </button>
          </div>
        )}
        {isCulture && page === totalPages - 1 && (
          <div className="text-center text-sm">
            <button onClick={() => onComplete(skipSkill ? null : skillScores, null)} className="text-slate-400 hover:text-yellow-400 underline underline-offset-4">
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
                    <div className="text-xs text-slate-400 truncate">{c.currentRole} · {c.location}</div>
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
        <h2 className="text-3xl font-black">My Shortlists</h2>
        <Button icon={Plus} onClick={() => setCreating(true)}>New shortlist</Button>
      </div>
      {creating && (
        <Card className="border-yellow-400/40">
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
            <div className="text-xs text-slate-400 mt-1">{s.candidateIds.length} candidates · {s.createdAt}</div>
            {s.notes && <div className="text-xs text-slate-500 mt-2 italic">"{s.notes}"</div>}
            <div className="flex -space-x-2 mt-3">
              {s.candidateIds.slice(0, 5).map(id => {
                const c = DATA_BUNDLE.candidates.find(c => c.id === id);
                if (!c) return null;
                return <div key={id} className="ring-2 ring-slate-900 rounded-full"><Avatar candidate={c} size={28} /></div>;
              })}
            </div>
          </Card>
        ))}
        {shortlists.length === 0 && <Card className="text-center py-8"><Star className="text-slate-500 mx-auto mb-2" /><div className="text-sm">No shortlists yet</div></Card>}
      </div>
    </div>
  );
}

function SavedSearchesView({ searches, onRunSearch, setSearches }) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-black">My Searches</h2>
      <Card padded={false}>
        <table className="w-full">
          <thead className="bg-slate-900/60 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="text-left p-3">Name</th><th className="text-left p-3 hidden sm:table-cell">Query</th><th className="text-left p-3 hidden md:table-cell">Saved</th><th className="text-left p-3">Results</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {searches.map(s => (
              <tr key={s.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                <td className="p-3 font-bold">{s.name}</td>
                <td className="p-3 text-xs text-slate-400 line-clamp-2 hidden sm:table-cell max-w-md">{s.query}</td>
                <td className="p-3 text-xs text-slate-500 hidden md:table-cell">{s.createdAt}</td>
                <td className="p-3 text-sm tabular-nums">{s.results || "—"}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" icon={Search} onClick={() => onRunSearch(s.query)}>Run</Button>
                </td>
              </tr>
            ))}
            {searches.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-sm">No saved searches yet.</td></tr>}
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-slate-800 p-4 flex-shrink-0 space-y-1 hidden md:block">
        <button onClick={onExit} className="flex items-center gap-2 mb-6 hover:text-yellow-400">
          <Zap className="text-yellow-400 fill-yellow-400" size={18} />
          <span className="font-black">Lighthouse</span>
          <span className="text-slate-500 text-xs">Admin</span>
        </button>
        <div className="text-[10px] uppercase tracking-wider text-slate-600 font-bold pt-2 pb-1 px-2">Existing</div>
        {[
          ["💬", "Applications"], ["👥", "Founders"], ["💼", "Companies"], ["💰", "Investors"],
        ].map(([i, l]) => (
          <div key={l} className="px-2 py-1.5 text-sm text-slate-500 cursor-default">{i}  {l}</div>
        ))}
        <div className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold pt-3 pb-1 px-2">Talent</div>
        {[
          { k: "database", l: "Database", icon: Database },
          { k: "applications", l: "Pending", icon: KanbanSquare },
          { k: "archetypeMap", l: "Archetype Map", icon: Map },
          { k: "hiringRequests", l: "Hiring Requests", icon: Briefcase },
          { k: "settings", l: "Settings", icon: Settings },
        ].map(it => (
          <button key={it.k} onClick={() => setView(it.k)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition ${view === it.k ? "bg-yellow-400/10 text-yellow-400" : "text-slate-300 hover:bg-slate-900"}`}>
            <it.icon size={14} /> {it.l}
            {it.k === "archetypeMap" && <Tag color="purple" size="sm">opt</Tag>}
          </button>
        ))}
        <div className="text-[10px] uppercase tracking-wider text-slate-600 font-bold pt-3 pb-1 px-2">Other</div>
        {[
          ["📨", "Emails"], ["⚙️", "Settings"]
        ].map(([i, l]) => (
          <div key={l} className="px-2 py-1.5 text-sm text-slate-500 cursor-default">{i}  {l}</div>
        ))}
      </aside>
      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-yellow-400 font-bold">🎯 Talent</span>
            <span className="text-slate-500 mx-2">/</span>
            <span className="font-semibold">{
              { database: "Database", applications: "Pending Applications", archetypeMap: "Archetype Map", hiringRequests: "Hiring Requests", settings: "Settings", profile: "Candidate" }[view]
            }</span>
          </div>
          <div className="flex items-center gap-3">
            <Bell size={16} className="text-slate-400" />
            <div className="text-xs text-slate-400">Zap</div>
            <Button variant="ghost" size="sm" icon={LogOut} onClick={onExit}>Exit</Button>
          </div>
        </div>
        <div className="p-6">
          {view === "database" && <AdminDatabase candidates={candidates} onOpen={(id) => { setActiveId(id); setView("profile"); }} />}
          {view === "applications" && <AdminPending candidates={candidates} onOpen={(id) => { setActiveId(id); setView("profile"); }} updateCandidate={updateCandidate} />}
          {view === "archetypeMap" && <AdminArchetypeMap candidates={candidates} onOpen={(id) => { setActiveId(id); setView("profile"); }} />}
          {view === "hiringRequests" && <AdminHiring />}
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
          <div className="text-xs text-slate-500">{candidates.length} candidates total</div>
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
          <thead className="bg-slate-900/60 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
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
              <tr key={c.id} onClick={() => onOpen(c.id)} className="border-b border-slate-800/60 hover:bg-slate-900/40 cursor-pointer">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Avatar candidate={c} size={28} />
                    <div className="font-bold">{c.firstName} {c.lastName}</div>
                  </div>
                </td>
                <td className="p-3 text-slate-300 max-w-xs truncate">{c.currentRole}</td>
                <td className="p-3">{c.archetype ? <ArchetypeBadge quad={c.archetype} /> : <span className="text-slate-600">—</span>}</td>
                <td className="p-3 text-xs text-slate-400">{c.dateApplied}</td>
                <td className="p-3"><StatusPill status={c.vettingStatus} /></td>
                <td className="p-3 text-xs text-slate-400">{c.lastActivity}</td>
                <td className="p-3 text-center text-sm tabular-nums">{c.introRequests}</td>
                <td className="p-3 text-center">{c.placements > 0 && <span className="text-emerald-400 text-lg">✓</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length > 100 && <div className="p-3 text-center text-xs text-slate-500">Showing 100 of {filtered.length} candidates. Refine filters to see more.</div>}
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
      <div className="text-xs text-slate-500 mb-4">Drag candidates through the pipeline. Click a card for the full admin profile.</div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {cols.map(col => {
          const list = candidates.filter(c => c.vettingStatus === col);
          return (
            <div key={col}
                 onDragOver={e => e.preventDefault()}
                 onDrop={() => { if (drag) { moveStatus(drag, col); setDrag(null); } }}
                 className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-wider font-bold text-slate-300">{labels[col]}</div>
                <Tag>{list.length}</Tag>
              </div>
              <div className="space-y-2">
                {list.slice(0, 25).map(c => (
                  <div key={c.id} draggable onDragStart={() => setDrag(c.id)} onClick={() => onOpen(c.id)}
                       className="bg-slate-950 border border-slate-800 rounded-lg p-2 cursor-pointer hover:border-yellow-400/40">
                    <div className="flex items-center gap-2">
                      <Avatar candidate={c} size={26} />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate">{c.firstName} {c.lastName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{c.currentRole}</div>
                      </div>
                    </div>
                    {c.archetype && <div className="mt-1.5"><ArchetypeBadge quad={c.archetype} /></div>}
                  </div>
                ))}
                {list.length > 25 && <div className="text-center text-[10px] text-slate-500 pt-2">+{list.length - 25} more</div>}
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
            <div className="text-slate-400 text-sm">{candidate.currentRole} · {candidate.currentCompany}</div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
              <span><Mail size={11} className="inline mr-0.5" /> {candidate.email}</span>
              <span><Phone size={11} className="inline mr-0.5" /> {candidate.phone}</span>
              <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="hover:text-yellow-400"><Linkedin size={11} className="inline mr-0.5" /> LinkedIn</a>
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
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Their submission</div>
            <div className="space-y-3 text-sm">
              <div><div className="font-bold">Why startup?</div><div className="text-slate-300">{candidate.whyStartup}</div></div>
              <div><div className="font-bold">Roles wanted</div><div className="text-slate-300">{candidate.roleSummary}</div></div>
              <div><div className="font-bold">Has prior startup exp?</div><div className="text-slate-300">{candidate.startupExperience ? "Yes" : "No"}</div></div>
              {candidate.vibe && <div><div className="font-bold">Karaoke</div><div className="text-slate-300">🎵 {candidate.vibe.karaoke}</div></div>}
            </div>
          </Card>
          {candidate.archetype && candidate.archetypeXY && (
            <Card>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Archetype profile</div>
              <ArchetypePlot candidates={DATA_BUNDLE.candidates.filter(c => c.hasAssessment)} highlight={candidate} height={260} />
            </Card>
          )}
          <Card>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Skills & history</div>
            <div className="flex flex-wrap gap-1 mb-3">{candidate.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
            <div className="space-y-1.5 text-xs">
              {candidate.workHistory.map((w, i) => <div key={i} className="text-slate-300"><b>{w.title}</b> @ {w.company} <span className="text-slate-500">({w.startYear}–{w.endYear})</span></div>)}
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="border-violet-400/30">
            <div className="text-xs uppercase tracking-wider text-violet-400 font-bold mb-2 flex items-center gap-1"><Shield size={12} /> Zap's private notes</div>
            <Textarea rows={6} value={notes} onChange={e => setNotes(e.target.value)} className="text-xs" placeholder="Vetting notes, growth areas, red flags..." />
            <div className="text-[10px] text-slate-500 mt-1">Visible to Zap and Mike only. Never shown to companies.</div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Vetting status</div>
            <Select value={vetting} onChange={setVetting} options={["New", "Reviewing", "Vetting Call Scheduled", "Active", "Hidden", "Declined"]} />
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Activity</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Intro requests</span><span className="font-bold">{candidate.introRequests}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Placements</span><span className="font-bold">{candidate.placements}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Last activity</span><span>{candidate.lastActivity}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Date applied</span><span>{candidate.dateApplied}</span></div>
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
          <div className="text-xs text-slate-500">{filtered.length} of {candidates.length} candidates have completed the assessment.</div>
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
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Distribution</div>
            <div className="space-y-2">
              {Object.entries(ARCHETYPES).filter(([k]) => k !== "Balanced").map(([k, a]) => {
                const v = distribution[k] || 0;
                const pct = filtered.length ? Math.round((v / filtered.length) * 100) : 0;
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs"><span>{a.icon} {k}</span><span className="font-bold">{v}</span></div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1"><div className="h-full" style={{ width: pct + "%", background: a.color }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="border-yellow-400/30">
            <div className="text-xs uppercase tracking-wider text-yellow-400 font-bold mb-2 flex items-center gap-1"><Sparkles size={12} /> Insights</div>
            <ul className="space-y-1 text-xs text-slate-300">
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
          <thead className="bg-slate-900/60 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500">
            <tr><th className="text-left p-3">Company</th><th className="text-left p-3">Search</th><th className="text-left p-3">Stage</th><th className="text-left p-3">Last update</th><th className="text-center p-3">Results</th></tr>
          </thead>
          <tbody>
            {reqs.map(r => (
              <tr key={r.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                <td className="p-3 font-bold">{r.company.name}</td>
                <td className="p-3 text-slate-300">{r.name}</td>
                <td className="p-3"><Tag color="green">{r.company.stage}</Tag></td>
                <td className="p-3 text-xs text-slate-500">{r.createdAt}</td>
                <td className="p-3 text-center font-bold">{r.results}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <h3 className="text-lg font-bold mt-6">Intro requests pending review</h3>
      <Card><div className="text-sm text-slate-400">3 intros pending Zap's review. Each gets a personal warm intro — no auto-pings.</div></Card>
    </div>
  );
}

function AdminSettings() {
  const [autoPublish, setAutoPublish] = useState(false);
  const [requiredFields, setRequiredFields] = useState(["firstName", "email", "currentRole", "skills"]);
  const allFields = ["firstName", "lastName", "email", "phone", "linkedin", "currentRole", "currentCompany", "yearsExperience", "location", "skills", "salary", "stagePreference"];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black">Talent Settings</h2>
      <Card>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Defaults</div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={autoPublish} onChange={e => setAutoPublish(e.target.checked)} className="accent-yellow-400" />
          <span>Auto-publish candidates upon vetting completion (default: hidden until vetted)</span>
        </label>
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Required intake fields</div>
        <MultiSelectChips options={allFields} selected={requiredFields} onChange={setRequiredFields} />
      </Card>
      <Card>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">JD Templates ({DATA_BUNDLE.jdTemplates.length})</div>
        <div className="space-y-2">
          {DATA_BUNDLE.jdTemplates.map(jd => (
            <div key={jd.id} className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs flex items-center justify-between">
              <div><b>{jd.title}</b> <span className="text-slate-500">· {jd.stage} · {jd.industry}</span></div>
              <Button size="sm" variant="ghost" icon={Edit3}>Edit</Button>
            </div>
          ))}
        </div>
        <Button size="sm" variant="secondary" icon={Plus} className="mt-3">Add JD template</Button>
      </Card>
      <Card className="border-violet-400/20">
        <div className="text-xs uppercase tracking-wider text-violet-400 font-bold mb-2 flex items-center gap-1">
          <Tag color="purple">OPTIONAL</Tag> Assessment settings
        </div>
        <div className="text-sm text-slate-400 mb-3">Edit the 16 candidate archetype statements and the 12+12 company assessment statements. Changes affect future assessments only.</div>
        <Button size="sm" variant="secondary" icon={Edit3}>Edit archetype statements</Button>
      </Card>
    </div>
  );
}

// ============================================================
// MODE SWITCHER — floating bottom-right toggle to flip between roles
// ============================================================
function ModeSwitcher({ mode, setMode, companyId, setCompanyId }) {
  const [open, setOpen] = useState(false);
  const modes = [
    { k: "candidate", label: "Talent", icon: UserPlus, desc: "Apply & explore the candidate flow" },
    { k: "company", label: "Company", icon: Search, desc: "Search talent & see your intros" },
    { k: "admin", label: "Admin", icon: Shield, desc: "Zap's database & vetting tools" },
  ];
  const current = modes.find(m => m.k === mode);
  return (
    <>
      {/* Trigger pill — bottom right */}
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 bg-yellow-400 text-slate-900 hover:bg-yellow-300 rounded-full pl-3 pr-4 py-2.5 shadow-2xl flex items-center gap-2 font-bold text-sm transition-all">
        <span className="w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center"><Zap size={14} className="text-yellow-400 fill-yellow-400" /></span>
        <span>Viewing: {current?.label || "—"}</span>
        <ChevronUp size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-20 right-5 z-50 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2">
            <div className="p-3 pb-2">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Switch view</div>
              <div className="text-xs text-slate-400">Demo navigator — flip between the three sides of the platform.</div>
            </div>
            {modes.map(m => (
              <button key={m.k} onClick={() => { setMode(m.k); setOpen(false); }}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition ${mode === m.k ? "bg-yellow-400/15 border border-yellow-400/30" : "hover:bg-slate-800/60 border border-transparent"}`}>
                <m.icon size={20} className={mode === m.k ? "text-yellow-400" : "text-slate-400"} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm flex items-center gap-2">
                    {m.label}
                    {mode === m.k && <Tag color="yellow" size="sm">current</Tag>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{m.desc}</div>
                </div>
              </button>
            ))}
            <div className="p-3 pt-2 mt-1 border-t border-slate-800">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Acting as company</div>
              <Select value={companyId} onChange={v => setCompanyId(+v)} className="text-xs"
                options={DATA_BUNDLE.companies.map(c => ({ value: c.id, label: `${c.name} · ${c.stage}` }))} />
              <div className="text-[10px] text-slate-500 mt-1.5">Affects which company's intros & shortlists you see in Company view.</div>
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
          <h2 className="text-3xl font-black">Intros from Zap</h2>
          <Tag color="yellow"><Sparkles size={10} /> Hand-picked</Tag>
        </div>
        <div className="text-sm text-slate-400 mt-1">
          Candidates Zap personally introduced to you, with her notes. Every intro is a warm one — there are no algorithmic auto-pings here.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs rounded-full border ${filter === "all" ? "bg-yellow-400 border-yellow-400 text-slate-900 font-bold" : "bg-slate-900 border-slate-700 text-slate-300"}`}>
          All <span className="opacity-60">{myIntros.length}</span>
        </button>
        {Object.entries(INTRO_STATUS_META).map(([k, m]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 text-xs rounded-full border flex items-center gap-1.5 ${filter === k ? "bg-yellow-400 border-yellow-400 text-slate-900 font-bold" : "bg-slate-900 border-slate-700 text-slate-300"}`}>
            {m.label} <span className="opacity-60">{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="text-center py-10">
          <Coffee className="text-slate-500 mx-auto mb-2" size={28} />
          <div className="font-bold">No intros in this state yet.</div>
          <div className="text-xs text-slate-500 mt-1">Zap sends every intro personally — they appear here as soon as they're made.</div>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map(intro => {
          const c = DATA_BUNDLE.candidates.find(cn => cn.id === intro.candidateId);
          if (!c) return null;
          const meta = INTRO_STATUS_META[intro.status];
          return (
            <Card key={intro.id} className="hover:border-yellow-400/30 transition">
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
                      <div className="text-sm text-slate-400 truncate">{c.currentRole} · {c.currentCompany}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span><Clock size={10} className="inline mr-0.5" /> {c.yearsExperience} yrs</span>
                        <span><MapPin size={10} className="inline mr-0.5" /> {c.location}</span>
                        <span><Calendar size={10} className="inline mr-0.5" /> Introduced {intro.introducedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-yellow-400/5 border-l-2 border-yellow-400 rounded-r-md p-3 text-sm italic text-slate-200">
                    <div className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold mb-1 not-italic">Zap's note</div>
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
  // No more "landing" page — the user starts in a real view and toggles via the floating switcher.
  const [mode, setMode] = useState("candidate");
  const [companyId, setCompanyId] = useState(5); // SoundHealth default
  return (
    <>
      {mode === "candidate" && <CandidateIntakeFlow onExit={() => setMode("candidate")} />}
      {mode === "company" && <CompanyPortal preselectedCompanyId={companyId} onExit={() => setMode("candidate")} />}
      {mode === "admin" && <AdminPortal onExit={() => setMode("candidate")} />}
      <ModeSwitcher mode={mode} setMode={setMode} companyId={companyId} setCompanyId={setCompanyId} />
    </>
  );
}
