"use client";

// Send-for-review modal. Blocks send unless the candidate is ⚡ vetted in person.
// Companies-only (per the investor-strip handoff). There is no companies data
// layer yet, so the recipient list is empty (honest empty state) — TODO(#18):
// load real companies and persist the sent-for-review record to Supabase.
import { useState } from "react";
import { Send, X } from "lucide-react";
import { Button, Select, Textarea, Field } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";

// TODO(#18): replace with a real companies data layer. Empty until then.
const COMPANIES: { id: number; name: string }[] = [];

export default function SendForReviewModal({
  candidate,
  onClose,
  onSend,
}: {
  candidate: Candidate;
  onClose: () => void;
  onSend: (payload: { recipientId: number; zapNote: string }) => void;
}) {
  const [recipientId, setRecipientId] = useState<number | "">(COMPANIES[0]?.id ?? "");
  const [zapNote, setZapNote] = useState("");
  const isVetted = !!candidate.vettedInPerson;
  const noCompanies = COMPANIES.length === 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-lg w-full">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="font-display text-2xl">Send {candidate.firstName} for review</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-black"><X size={18} /></button>
        </div>
        {!isVetted ? (
          <div className="text-sm text-stone-700 bg-rose-50 border border-rose-200 rounded-lg p-3 my-3">
            Mark this candidate as <strong>⚡ vetted in person</strong> before sending for review. Sends are reserved for candidates Zap has personally met.
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-500 mb-4">Zap-curated push to a company. They&apos;ll see this on their home dashboard immediately.</p>
            {noCompanies ? (
              <div className="text-sm text-stone-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                No companies are connected yet. Once the companies data source is wired (#18), pick a recipient here.
              </div>
            ) : (
              <Field label="Send to company" required>
                <Select
                  value={String(recipientId)}
                  onChange={(v) => setRecipientId(Number(v))}
                  options={COMPANIES.map((r) => ({ value: String(r.id), label: r.name }))}
                />
              </Field>
            )}
            <div className="h-3" />
            <Field label="Why are you sending this candidate?" required hint="One paragraph. Specific match, what the recipient cares about.">
              <Textarea rows={4} value={zapNote} onChange={(e) => setZapNote(e.target.value)} placeholder="Met Maya at Founder Dinner last week — exact match for your Head of Ops search..." />
            </Field>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                icon={Send}
                disabled={!zapNote.trim() || noCompanies || recipientId === ""}
                onClick={() => recipientId !== "" && onSend({ recipientId, zapNote: zapNote.trim() })}
              >
                Send for review
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
