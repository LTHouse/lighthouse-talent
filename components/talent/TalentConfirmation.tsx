// Step 3 — confirmation. Shown after submitIntakeAction returns { ok: true }.
import { CheckCircle2 } from "lucide-react";

export default function TalentConfirmation() {
  return (
    <div className="space-y-8 text-center py-12">
      <div className="space-y-6">
        <CheckCircle2 size={56} className="text-amber-500 mx-auto" />
        <h2 className="text-3xl font-display">Application received.</h2>
        <p className="text-stone-700 text-lg max-w-md mx-auto leading-relaxed">
          You&apos;re now part of the exclusive founder talent community. We&apos;ll get back to you if we find a match.
        </p>
      </div>
    </div>
  );
}
