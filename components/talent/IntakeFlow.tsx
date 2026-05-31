"use client";

// Public talent application — multi-step flow (LinkedIn → essentials → confirm).
// Ported from the Vite TalentIntakeFlow. Anonymous: submits via
// submitIntakeAction (anon insert, status='applied', is_demo=false).
import { useState } from "react";
import { Zap } from "lucide-react";
import { ProgressBar } from "@/components/ui";
import { submitIntakeAction } from "@/app/actions";
import TalentLinkedIn from "./TalentLinkedIn";
import TalentBasics from "./TalentBasics";
import TalentConfirmation from "./TalentConfirmation";
import { profileToForm, type IntakeProfile, type ProfilePatch } from "./types";

const INITIAL: IntakeProfile = {
  firstName: "", lastName: "", email: "", phone: "",
  linkedin: "", linkedinConnected: false,
  currentRole: "", currentCompany: "",
  yearsExperience: 5, workMode: "Open",
  currentLocation: "", relocationStatus: "",
  hasStartupExperience: null, hasTechExperience: null,
  honeypot: "",
};

export default function IntakeFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profile, setProfile] = useState<IntakeProfile>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(patch: ProfilePatch) {
    setProfile((p) => ({ ...p, ...patch }));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitIntakeAction(profileToForm(profile));
      if (res.ok) {
        setStep(3);
      } else {
        setError(res.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Honeypot: visually offscreen, not keyboard-reachable, no autofill.
          Bots fill it; submitIntakeAction silently drops those submissions. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="lt-company-website">Company website</label>
        <input
          id="lt-company-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={profile.honeypot}
          onChange={(e) => update({ honeypot: e.target.value })}
        />
      </div>

      <div className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={18} />
            <span className="font-display tracking-tight font-bold">Lighthouse</span>
            <span className="text-stone-500 text-xs">Talent</span>
          </div>
          {step < 3 && <div className="text-xs text-stone-500 tabular-nums">Step {step} of 2</div>}
        </div>
        {step < 3 && (
          <div className="max-w-3xl mx-auto px-6 pb-3"><ProgressBar value={step} max={2} /></div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {step === 1 && <TalentLinkedIn profile={profile} update={update} onNext={() => setStep(2)} />}
        {step === 2 && (
          <TalentBasics
            profile={profile}
            update={update}
            onSubmit={submit}
            onBack={() => setStep(1)}
            submitting={submitting}
            error={error}
          />
        )}
        {step === 3 && <TalentConfirmation />}
      </div>
    </div>
  );
}
