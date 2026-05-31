"use client";

// Admin candidate profile drill-in. Edits (notes, vetting status, vetted-in-person
// toggle, LinkedIn refresh priority) write optimistically via updateCandidate.
// The "Send for review" modal is local-state (#18). The LinkedIn "enrich now"
// feature from the Vite app is intentionally omitted (TODO: port enrichment).
import { useState } from "react";
import { ArrowLeft, Send, Save, Shield, Zap, Mail, Phone, Link2 as Linkedin } from "lucide-react";
import { Button, Card, Textarea, Select } from "@/components/ui";
import { Avatar, VettedBadge } from "@/components/ui";
import { STATUS_LABELS, STATUS_ORDER, RELOCATION_LABELS } from "@/lib/constants";
import type { Candidate, CandidateStatus } from "@/lib/data/candidates";
import type { Company } from "@/lib/data/companies";
import type { CandidatePatch } from "@/app/actions";
import SendForReviewModal from "./SendForReviewModal";

export default function AdminCandidateProfile({
  candidate,
  companies,
  updateCandidate,
  onBack,
  sendForReview,
  adminName,
}: {
  candidate: Candidate;
  companies: Company[];
  updateCandidate: (id: string, patch: CandidatePatch) => void;
  onBack: () => void;
  sendForReview: (input: { candidateId: string; companyId: string; zapNote: string }) => void;
  adminName: string;
}) {
  const [notes, setNotes] = useState(candidate.adminNotes || "");
  const [status, setStatus] = useState<CandidateStatus>(candidate.status);
  const [showSendModal, setShowSendModal] = useState(false);

  function save() {
    updateCandidate(candidate.id, { adminNotes: notes, status });
  }
  function setRefreshPriority(p: string) {
    updateCandidate(candidate.id, { linkedinRefreshPriority: p });
  }
  function toggleVetted() {
    if (candidate.vettedInPerson) {
      updateCandidate(candidate.id, { vettedInPerson: false, vettedAt: null, vettedBy: null });
    } else {
      updateCandidate(candidate.id, {
        vettedInPerson: true,
        vettedAt: new Date().toISOString().slice(0, 10),
        vettedBy: adminName || "Zap",
      });
    }
  }

  const reloc = candidate.relocationStatus ? RELOCATION_LABELS[candidate.relocationStatus] ?? candidate.relocationStatus : "";
  const locDisplay = `${candidate.currentLocation ?? "—"}${reloc ? ` (${reloc})` : ""}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={onBack}>Back</Button>
        <Button icon={Send} onClick={() => setShowSendModal(true)}>Send for review</Button>
      </div>
      <Card>
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar candidate={candidate} size={64} />
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-display flex items-center gap-2 flex-wrap">{candidate.firstName} {candidate.lastName} <VettedBadge candidate={candidate} size={18} /></div>
            <div className="text-stone-500 text-sm">{candidate.currentRole} · {candidate.currentCompany}</div>
            <div className="text-xs text-stone-500 mt-1 flex flex-wrap gap-3">
              <span><Mail size={11} className="inline mr-0.5" /> {candidate.email}</span>
              <span><Phone size={11} className="inline mr-0.5" /> {candidate.phone}</span>
              {candidate.linkedin ? (
                <a
                  href={candidate.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  title={candidate.linkedin}
                  className="inline-flex items-center gap-1 text-[#0a66c2] hover:underline max-w-[260px] truncate"
                >
                  <Linkedin size={11} className="flex-shrink-0" />
                  <span className="truncate">{candidate.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
                </a>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5">
                  <Linkedin size={11} /> LinkedIn URL missing — verify during re-onboarding
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
      {showSendModal && (
        <SendForReviewModal
          candidate={candidate}
          companies={companies}
          onClose={() => setShowSendModal(false)}
          onSend={(payload) => {
            sendForReview({ candidateId: candidate.id, companyId: payload.companyId, zapNote: payload.zapNote });
            setShowSendModal(false);
          }}
        />
      )}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Submission</div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-stone-500">Location</div><div>{locDisplay}</div></div>
              <div><div className="text-xs text-stone-500">Work mode</div><div>{candidate.workMode}</div></div>
              <div><div className="text-xs text-stone-500">Years of experience</div><div>{candidate.yearsExperience}</div></div>
              <div><div className="text-xs text-stone-500">Has tech experience</div><div>{candidate.hasTechExperience ? "Yes" : "No"}</div></div>
              <div><div className="text-xs text-stone-500">Has startup experience</div><div>{candidate.hasStartupExperience ? "Yes" : "No"}</div></div>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="border-violet-300">
            <div className="text-xs uppercase tracking-wider text-violet-700 font-bold mb-2"><Shield size={12} className="inline mr-1" /> Zap&apos;s private notes</div>
            <Textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} className="text-xs" placeholder="Vetting notes, growth areas, red flags..." />
            <div className="text-[10px] text-stone-500 mt-1">Admin-only. Never shown to companies.</div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">Vetting status</div>
            <Select
              value={status}
              onChange={(v) => setStatus(v as CandidateStatus)}
              options={STATUS_ORDER.filter((s) => s !== "pre_onboard").map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
            />
          </Card>
          <Card className={candidate.vettedInPerson ? "border-amber-400 bg-amber-50/60" : ""}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-1 flex items-center gap-1"><Zap size={12} className="text-amber-500 fill-amber-500" /> Vetted in person by Zap</div>
                <div className="text-[11px] text-stone-500">{candidate.vettedInPerson ? `Marked vetted${candidate.vettedAt ? " · " + candidate.vettedAt : ""}` : "Toggle on after meeting in person."}</div>
              </div>
              <button
                onClick={toggleVetted}
                className={`relative inline-flex h-6 w-11 rounded-full transition flex-shrink-0 ${candidate.vettedInPerson ? "bg-amber-500" : "bg-stone-300"}`}
                aria-label="Toggle vetted in person"
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${candidate.vettedInPerson ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-2 flex items-center gap-1"><Linkedin size={12} /> LinkedIn data</div>
            {/* TODO: port the Vite "enrich now" LinkedIn enrichment (linkedinEnrich) — omitted for now. */}
            <div className="text-[11px] text-stone-500 mb-2 italic">Enrichment is queued by refresh priority. Manual enrich is a follow-up.</div>
            <Select
              value={candidate.linkedinRefreshPriority || "normal"}
              onChange={setRefreshPriority}
              options={[
                { value: "normal", label: "Refresh priority: Normal (60d)" },
                { value: "high", label: "Refresh priority: High (7d)" },
                { value: "frozen", label: "Refresh priority: Frozen (never)" },
              ]}
              className="text-xs"
            />
          </Card>
          <Button className="w-full" onClick={save} icon={Save}>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
