"use client";

// Step 2 — the essentials. Faithful port of the Vite TalentBasics step.
import { useState } from "react";
import { ChevronLeft, Zap } from "lucide-react";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { RELOCATION_OPTIONS, WORK_MODES } from "@/lib/constants";
import type { IntakeProfile, ProfilePatch } from "./types";

const TN_CITIES = ["Nashville, TN", "Memphis, TN", "Knoxville, TN", "Chattanooga, TN"];

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  const base = "flex-1 p-3 border rounded-lg text-sm font-bold transition";
  const on = "bg-yellow-400 border-yellow-400";
  const off = "bg-white border-stone-300 hover:border-stone-400";
  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange(true)} className={`${base} ${value === true ? on : off}`}>Yes</button>
      <button type="button" onClick={() => onChange(false)} className={`${base} ${value === false ? on : off}`}>No</button>
    </div>
  );
}

export default function TalentBasics({
  profile,
  update,
  onSubmit,
  onBack,
  submitting,
  error,
}: {
  profile: IntakeProfile;
  update: (patch: ProfilePatch) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [showRemoteWarning, setShowRemoteWarning] = useState(profile.relocationStatus === "remote_only");

  function setRelocation(v: string) {
    update({ relocationStatus: v });
    setShowRemoteWarning(v === "remote_only");
  }

  const canContinue = Boolean(
    profile.firstName && profile.lastName && profile.email && profile.phone &&
    profile.currentLocation && profile.relocationStatus && profile.yearsExperience >= 0 &&
    profile.hasStartupExperience !== null && profile.hasTechExperience !== null,
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Step 2 · The essentials</div>
        <h2 className="text-3xl font-display">Just the essentials.</h2>
      </div>
      <Card className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First name" required><Input value={profile.firstName} onChange={(e) => update({ firstName: e.target.value })} /></Field>
          <Field label="Last name" required><Input value={profile.lastName} onChange={(e) => update({ lastName: e.target.value })} /></Field>
          <Field label="Email" required><Input type="email" value={profile.email} onChange={(e) => update({ email: e.target.value })} /></Field>
          <Field label="Phone" required><Input value={profile.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="(615) 555-0123" /></Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Years of experience" required hint="Just a number.">
            <Input type="number" min={0} max={50} value={profile.yearsExperience} onChange={(e) => update({ yearsExperience: Number(e.target.value) })} />
          </Field>
          <Field label="Ideal work mode" required>
            <Select value={profile.workMode} onChange={(v) => update({ workMode: v })} options={[...WORK_MODES]} />
          </Field>
        </div>
        <Field label="Have you worked at a startup before?" required>
          <YesNo value={profile.hasStartupExperience} onChange={(v) => update({ hasStartupExperience: v })} />
        </Field>
        <Field label="Have you worked at a tech company before?" required>
          <YesNo value={profile.hasTechExperience} onChange={(v) => update({ hasTechExperience: v })} />
        </Field>
        <div className="border-t border-stone-200 pt-4">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Location</div>
          <Field label="Where are you right now?" required hint="City + state (US) or city + country.">
            <Input value={profile.currentLocation} onChange={(e) => update({ currentLocation: e.target.value })} placeholder="Nashville, TN" />
            <div className="flex flex-wrap gap-2 mt-2">
              {TN_CITIES.map((c) => (
                <button key={c} type="button" onClick={() => update({ currentLocation: c })}
                  className="px-3 py-1 text-xs rounded-full border border-stone-300 bg-white text-stone-700 hover:bg-stone-50">{c}</button>
              ))}
            </div>
          </Field>
          <div className="h-3" />
          <Field label="Are you willing to relocate to Nashville for the right role?" required>
            <div className="space-y-2">
              {RELOCATION_OPTIONS.map((o) => (
                <label key={o.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${profile.relocationStatus === o.value ? "border-yellow-400 bg-yellow-50" : "border-stone-200 hover:border-stone-300"}`}>
                  <input type="radio" name="reloc" value={o.value} checked={profile.relocationStatus === o.value} onChange={() => setRelocation(o.value)} className="accent-yellow-400" />
                  <span className="text-sm">{o.label}</span>
                </label>
              ))}
            </div>
            {showRemoteWarning && (
              <div className="mt-3 text-xs text-stone-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Heads up: most Lighthouse companies are Nashville-based and many roles are in-person or hybrid. You&apos;ll see fewer matches than candidates open to relocation.
              </div>
            )}
          </Field>
        </div>
      </Card>
      {error && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" icon={ChevronLeft} onClick={onBack}>Back</Button>
        <Button onClick={onSubmit} icon={Zap} disabled={!canContinue || submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
      </div>
    </div>
  );
}
