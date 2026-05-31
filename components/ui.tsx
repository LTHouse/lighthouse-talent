"use client";

// Shared UI primitives, ported 1:1 from the Vite app (same Tailwind classes), typed.
import { useState, type ReactNode } from "react";
import { MapPin, Zap } from "lucide-react";
import { AVATAR_COLORS } from "@/lib/constants";
import type { Candidate } from "@/lib/data/candidates";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

export function Button({
  children, onClick, variant = "primary", size = "md", disabled, className = "", icon: Icon, type = "button",
}: {
  children?: ReactNode; onClick?: () => void; variant?: Variant; size?: Size;
  disabled?: boolean; className?: string; icon?: LucideIcon; type?: "button" | "submit" | "reset";
}) {
  const sizes: Record<Size, string> = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  const variants: Record<Variant, string> = {
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

export function Card({ children, className = "", padded = true, onClick }: {
  children?: ReactNode; className?: string; padded?: boolean; onClick?: () => void;
}) {
  return (
    <div onClick={onClick}
      className={`bg-white border border-stone-200 rounded-xl ${padded ? "p-5" : ""} ${onClick ? "cursor-pointer hover:border-stone-400 transition" : ""} ${className}`}>
      {children}
    </div>
  );
}

type TagColor = "default" | "yellow" | "blue" | "purple" | "green" | "red" | "orange";
export function Tag({ children, color = "default", size = "sm" }: { children?: ReactNode; color?: TagColor; size?: "sm" | "lg" }) {
  const palette: Record<TagColor, string> = {
    default: "bg-stone-100 text-stone-700 border-stone-200",
    yellow: "bg-yellow-100 text-amber-800 border-yellow-300",
    blue: "bg-sky-100 text-sky-800 border-sky-300",
    purple: "bg-violet-100 text-violet-800 border-violet-300",
    green: "bg-emerald-100 text-emerald-800 border-emerald-300",
    red: "bg-rose-100 text-rose-800 border-rose-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
  };
  const sz = size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return <span className={`inline-flex items-center gap-1 rounded-full border ${palette[color]} ${sz} font-medium whitespace-nowrap`}>{children}</span>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder:text-stone-400 focus:outline-none focus:border-black ${className}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea {...rest} className={`w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-black placeholder:text-stone-400 focus:outline-none focus:border-black resize-y ${className}`} />;
}

export type SelectOption = string | { value: string; label: string };
export function Select({ value, onChange, options, className = "" }: {
  value: string; onChange: (v: string) => void; options: SelectOption[]; className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black ${className}`}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

export function Field({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: string }) {
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

export function MultiSelectChips({ options, selected, onChange }: { options: readonly string[]; selected: string[]; onChange: (v: string[]) => void }) {
  function toggle(o: string) {
    if (selected.includes(o)) onChange(selected.filter((s) => s !== o));
    else onChange([...selected, o]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => toggle(o)} type="button"
          className={`px-3 py-1.5 text-xs rounded-full border transition ${selected.includes(o) ? "bg-yellow-400 border-yellow-400 text-black font-bold" : "bg-white border-stone-300 text-stone-700 hover:border-stone-400"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function RangeSlider({ min, max, value, onChange, step = 1, format = (v: number) => String(v) }: {
  min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void; step?: number; format?: (v: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-stone-500"><span>{format(value[0])}</span><span>{format(value[1])}</span></div>
      <div className="relative h-1.5 bg-stone-200 rounded-full">
        <div className="absolute h-full bg-yellow-400 rounded-full"
          style={{ left: `${((value[0] - min) / (max - min)) * 100}%`, right: `${100 - ((value[1] - min) / (max - min)) * 100}%` }} />
      </div>
      <div className="flex gap-2">
        <input type="range" min={min} max={max} step={step} value={value[0]} onChange={(e) => onChange([Math.min(+e.target.value, value[1]), value[1]])} className="w-full accent-yellow-400" />
        <input type="range" min={min} max={max} step={step} value={value[1]} onChange={(e) => onChange([value[0], Math.max(+e.target.value, value[0])])} className="w-full accent-yellow-400" />
      </div>
    </div>
  );
}

export function ProgressBar({ value, max = 100, color = "bg-yellow-400" }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden"><div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} /></div>;
}

type CandidateLike = Pick<Candidate, "firstName" | "lastName" | "photoSeed" | "relocationStatus" | "vettedInPerson" | "vettedBy" | "vettedAt" | "linkedinVerified">;

export function Avatar({ candidate, size = 40 }: { candidate: CandidateLike; size?: number }) {
  const initials = ((candidate.firstName?.[0] ?? "") + (candidate.lastName?.[0] ?? "")).toUpperCase();
  const pair = AVATAR_COLORS[(candidate.photoSeed ?? 0) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
  const [bg, fg] = pair;
  return <div style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.38 }} className="rounded-full flex items-center justify-center font-bold flex-shrink-0">{initials}</div>;
}

export function RelocateBadge({ candidate }: { candidate: CandidateLike }) {
  if (candidate.relocationStatus !== "willing_to_relocate") return null;
  return (
    <span className="inline-flex items-center gap-1 bg-amber-50/60 border border-amber-200/60 text-amber-800 rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap align-middle">
      <MapPin size={10} className="flex-shrink-0" /> Open to relocate
    </span>
  );
}

export function VettedBadge({ candidate, size = 14 }: { candidate: CandidateLike; size?: number }) {
  const [open, setOpen] = useState(false);
  if (!candidate.vettedInPerson) return null;
  const title = `Met in person by ${candidate.vettedBy || "Zap"}${candidate.vettedAt ? " on " + candidate.vettedAt : ""}.`;
  return (
    <>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(true); }} title={title} aria-label={title}
        className="inline-flex items-center justify-center hover:scale-110 transition cursor-pointer align-middle">
        <Zap size={size} className="text-amber-500 fill-amber-500" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={20} className="text-amber-500 fill-amber-500" />
              <h3 className="font-display text-xl font-bold">Vetted by Lighthouse</h3>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed">
              The ⚡ bolt means Zap has personally met {candidate.firstName} — coffee, Zoom, or in-person. Every member of the Lighthouse Talent Network is vetted by Zap.
            </p>
            <div className="text-xs text-stone-500 mt-3">{title}</div>
            <div className="flex justify-end mt-4"><Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Got it</Button></div>
          </div>
        </div>
      )}
    </>
  );
}

export function LinkedInVerifiedBadge({ candidate, size = 12 }: { candidate: CandidateLike; size?: number }) {
  if (!candidate.linkedinVerified) return null;
  return (
    <span title="Identity verified via LinkedIn" aria-label="Identity verified via LinkedIn"
      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#0a66c2] text-white align-middle">
      <svg width={size - 2} height={size - 2} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
      </svg>
    </span>
  );
}
