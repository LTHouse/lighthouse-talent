"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { Field, Input, Textarea, Button } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";

interface IntroRequestModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  submitting: boolean;
  error: string | null;
}

export default function IntroRequestModal({ candidate, onClose, onSubmit, submitting, error }: IntroRequestModalProps) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-lg w-full">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="font-display text-2xl">Request a warm intro</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-black"><X size={18} /></button>
        </div>
        <p className="text-sm text-stone-500 mb-4">Zap reviews every intro request personally. She&apos;ll either send the connection herself or get back to you with context.</p>
        <Field label="Recipient (read-only)"><Input value="Zap (Lighthouse)" readOnly className="bg-stone-50" /></Field>
        <div className="h-3" />
        <Field label="Candidate"><Input value={`${candidate?.firstName ?? ""} ${candidate?.lastName ?? ""}`.trim()} readOnly className="bg-stone-50" /></Field>
        <div className="h-3" />
        <Field label="Why you want this intro" required hint="One paragraph. What role, what context, why this person specifically.">
          <Textarea rows={5} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="We're hiring a Head of Operations and this profile matches everything we need..." />
        </Field>
        {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon={Send} onClick={() => reason.trim() && onSubmit(reason.trim())} disabled={!reason.trim() || submitting}>
            {submitting ? "Submitting..." : "Submit request"}
          </Button>
        </div>
      </div>
    </div>
  );
}
