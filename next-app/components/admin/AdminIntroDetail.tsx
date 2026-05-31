"use client";

// Intro-request detail (LIVE Supabase). Approve → respondIntroAction("approved");
// decline → respondIntroAction("declined"). The templated intro email is a mock
// draft: outbound emails ship DISABLED (platform_settings), so "send" records the
// approval but no real email fires (TODO(#17): wire the outbound edge function).
// The Vite window-global approver gating + ModeSwitcher are intentionally dropped.
import { useState } from "react";
import { ArrowLeft, Send, X, Mail } from "lucide-react";
import { Button, Card, Input, Textarea, Field, Tag, Avatar, VettedBadge } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";
import type { IntroRequest } from "@/lib/data/intros";

export default function AdminIntroDetail({
  intro,
  candidates,
  adminEmail,
  onBack,
  onApprove,
  onDecline,
}: {
  intro: IntroRequest;
  candidates: Candidate[];
  adminEmail: string;
  onBack: () => void;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const c = candidates.find((cn) => cn.id === intro.candidateId);
  const [emailBody, setEmailBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  // Outbound emails ship DISABLED (platform_settings). Mock-send until #17.
  const outboundEnabled = false;

  if (!c) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={onBack}>Back to intro requests</Button>
        <Card className="text-center py-12 text-sm text-stone-500">Candidate for this intro request was not found.</Card>
      </div>
    );
  }

  const requesterLabel = intro.companyId ? `Company ${intro.companyId.slice(0, 8)}` : "Unknown company";

  function openEmailDraft() {
    if (!c) return;
    // Templated intro email — the candidate LinkedIn URL is injected here, the only
    // place company-side users ever receive it (anti-poaching gating).
    const linkedin = c.linkedin || "(LinkedIn URL missing — verify before sending)";
    setEmailSubject(`Intro: ${requesterLabel} ↔ ${c.firstName} ${c.lastName}`);
    setRecipientContact("{company contact email}");
    setEmailBody(
`Hi {Company Contact} and ${c.firstName},

I'd love to connect you two.

The hiring team is looking for someone with this profile. Here's the context they shared:

"${intro.message ?? ""}"

${c.firstName}, I think you'd be a great fit because [Zap fills this in].

For quick reference:
  • ${c.firstName} ${c.lastName}
  • ${c.currentRole ?? ""}${c.currentCompany ? ` · ${c.currentCompany}` : ""}
  • LinkedIn: ${linkedin}

I'll let you both take it from here — let me know how it goes!

— ${adminEmail || "Zap"}`,
    );
    setShowEmail(true);
  }

  function sendIntro() {
    onApprove();
    setShowEmail(false);
  }

  function confirmDecline() {
    onDecline();
    setShowDecline(false);
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={onBack}>Back to intro requests</Button>
      <Card>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Tag color={intro.status === "pending" ? "yellow" : intro.status === "approved" ? "green" : "default"}>{intro.status}</Tag>
          <span className="text-xs text-stone-500">Submitted {new Date(intro.createdAt).toLocaleString()}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-1">Candidate</div>
            <div className="flex items-center gap-2">
              <Avatar candidate={c} size={40} />
              <div><div className="font-bold flex items-center gap-1.5">{c.firstName} {c.lastName} <VettedBadge candidate={c} size={12} /></div><div className="text-xs text-stone-500">{c.currentRole}</div></div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-1">Requester</div>
            <div className="font-bold">{requesterLabel}</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-stone-200">
          <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Why they want this intro</div>
          <div className="bg-yellow-50 border-l-2 border-amber-500 rounded-r p-3 text-sm italic">&quot;{intro.message ?? "No message provided."}&quot;</div>
        </div>
        {intro.status === "pending" && (
          <div className="mt-4 pt-4 border-t border-stone-200 flex flex-wrap gap-2 items-center">
            <Button icon={Send} onClick={openEmailDraft}>Approve &amp; Send Intro</Button>
            <Button variant="ghost" icon={X} onClick={() => setShowDecline(true)}>Decline</Button>
          </div>
        )}
      </Card>

      {showEmail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowEmail(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-display text-2xl">Send intro email</h2>
              <button onClick={() => setShowEmail(false)} className="text-stone-500 hover:text-black"><X size={18} /></button>
            </div>
            {!outboundEnabled && (
              <div className="mb-4 text-xs text-stone-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                <Mail size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Outbound emails DISABLED.</strong> This send will be recorded as Approved, but no real email fires. The master toggle lives in Settings / platform_settings.
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="From">
                <Input value="zap@lt.house" readOnly className="bg-stone-50" />
              </Field>
              <Field label="To (company contact)" required>
                <Input value={recipientContact} onChange={(e) => setRecipientContact(e.target.value)} />
              </Field>
            </div>
            <div className="h-3" />
            <Field label="Subject" required>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </Field>
            <div className="h-3" />
            <Field label="Email body" required hint="Replace bracketed sections before sending. Candidate's LinkedIn URL is included automatically — this is the only place companies receive it.">
              <Textarea rows={14} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="font-mono text-xs" />
            </Field>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowEmail(false)}>Cancel</Button>
              <Button icon={Send} onClick={sendIntro} disabled={!emailBody.trim() || !recipientContact.trim()}>
                {outboundEnabled ? "Send intro" : "Approve (mock send)"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDecline && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowDecline(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <h2 className="font-display text-2xl mb-3">Decline intro request</h2>
            <Field label="Internal reason (optional, admin-only)" hint="Not shared with the requester.">
              <Textarea rows={4} value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} placeholder="Wrong stage fit; candidate's not actively looking; etc." />
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
