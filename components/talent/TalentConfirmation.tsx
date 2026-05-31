"use client";

// Step 3 — confirmation. Shown after submitIntakeAction returns { ok: true }.
import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function TalentConfirmation({ email }: { email: string }) {
  const [newsletterEmail, setNewsletterEmail] = useState(email);
  const [subscribed, setSubscribed] = useState(false);

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    // TODO: wire newsletter subscription to a real list when available.
    setSubscribed(true);
  }

  return (
    <div className="space-y-8 text-center py-12">
      <div className="space-y-6">
        <CheckCircle2 size={56} className="text-amber-500 mx-auto" />
        <h2 className="text-3xl font-display">Application received.</h2>
        <p className="text-stone-700 text-lg max-w-md mx-auto leading-relaxed">
          You&apos;re now part of the exclusive founder talent community. We&apos;ll get back to you if we find a match.
        </p>
      </div>

      <div className="max-w-sm mx-auto border-t border-stone-200 pt-6">
        {subscribed ? (
          <div className="text-sm text-emerald-700 inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Subscribed to the newsletter
          </div>
        ) : (
          <form onSubmit={subscribe} className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold">Newsletter</div>
            <div className="flex gap-2">
              <Input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="you@email.com" className="text-sm" />
              <Button type="submit" size="sm" icon={Mail}>Subscribe</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
