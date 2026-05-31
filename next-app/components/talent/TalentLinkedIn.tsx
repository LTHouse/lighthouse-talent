"use client";

// Step 1 — LinkedIn. The Vite app ran a live "Sign in with LinkedIn" OAuth
// enrichment here; we deliberately SKIP that and keep a plain "paste your URL"
// field that flows into form.linkedin.
// TODO: wire real LinkedIn OAuth enrichment (name/photo/role) when available.
import { useState } from "react";
import { ArrowRight, CheckCircle2, Link2 } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import type { IntakeProfile, ProfilePatch } from "./types";

const LINKEDIN_RE = /^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-_.%/]+\/?$/i;

export default function TalentLinkedIn({
  profile,
  update,
  onNext,
}: {
  profile: IntakeProfile;
  update: (patch: ProfilePatch) => void;
  onNext: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  function verify() {
    setError(null);
    if (!LINKEDIN_RE.test(profile.linkedin)) {
      setError("Paste a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/your-handle/).");
      return;
    }
    update({ linkedinConnected: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Step 1 · Connect LinkedIn</div>
        <h2 className="text-3xl font-display">LinkedIn is how we know you.</h2>
        <p className="text-stone-500 mt-1">Paste your LinkedIn URL. Required — there&apos;s no upload or manual path here.</p>
      </div>
      <Card>
        <Field label="LinkedIn URL" required hint="Format: https://www.linkedin.com/in/your-handle/">
          <Input
            value={profile.linkedin}
            onChange={(e) => update({ linkedin: e.target.value, linkedinConnected: false })}
            placeholder="https://www.linkedin.com/in/your-handle/"
          />
        </Field>
        {error && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-3">{error}</div>}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={verify} icon={Link2} disabled={!profile.linkedin}>Verify &amp; continue</Button>
        </div>
      </Card>
      {profile.linkedinConnected && (
        <Card className="border-emerald-300 bg-emerald-50/40">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm"><CheckCircle2 size={16} /> LinkedIn URL saved</div>
          <div className="mt-2 text-sm">We&apos;ll grab your role + company on the next step.</div>
        </Card>
      )}
      <div className="flex justify-end pt-2">
        <Button onClick={onNext} icon={ArrowRight} disabled={!profile.linkedinConnected}>Continue</Button>
      </div>
    </div>
  );
}
