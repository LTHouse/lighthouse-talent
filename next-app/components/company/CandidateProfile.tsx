"use client";

import { Clock, MapPin, Briefcase, Coffee, ArrowLeft, CheckCircle2, Shield } from "lucide-react";
import { Card, Avatar, VettedBadge, LinkedInVerifiedBadge, RelocateBadge, Tag, Button } from "@/components/ui";
import type { Candidate } from "@/lib/data/candidates";

// Inline LinkedIn glyph — lucide-react doesn't ship a LinkedIn icon.
function LinkedInGlyph({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

interface CandidateProfileProps {
  candidate: Candidate;
  onBack: () => void;
  onRequestIntro: () => void;
}

export default function CandidateProfile({ candidate, onBack, onRequestIntro }: CandidateProfileProps) {
  const locDisplay = candidate.relocationStatus === "remote_only"
    ? `${candidate.currentLocation} — remote only`
    : candidate.currentLocation;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Button variant="ghost" icon={ArrowLeft} size="sm" onClick={onBack}>Back to results</Button>
      <Card className="!p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar candidate={candidate} size={80} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-3xl font-display">{candidate.firstName} {candidate.lastName}</div>
              <VettedBadge candidate={candidate} size={22} />
              <LinkedInVerifiedBadge candidate={candidate} />
              <RelocateBadge candidate={candidate} />
            </div>
            <div className="text-stone-500">{candidate.currentRole}{candidate.currentCompany && ` · ${candidate.currentCompany}`}</div>
            <div className="flex gap-3 mt-2 text-xs text-stone-500 flex-wrap">
              <span><Clock size={11} className="inline mr-0.5" /> {candidate.yearsExperience} yrs</span>
              <span><MapPin size={11} className="inline mr-0.5" /> {locDisplay}</span>
              <span><Briefcase size={11} className="inline mr-0.5" /> {candidate.workMode}</span>
            </div>
            {/* LinkedIn URL intentionally hidden on company-facing surfaces (anti-poaching).
                Admin sees it. Companies see it only after Zap approves an intro. */}
          </div>
          <Button icon={Coffee} onClick={onRequestIntro}>Request warm intro through Zap</Button>
        </div>
      </Card>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Background</div>
            {/* First item: identity verification badge (company view — no clickable URL per anti-poaching) */}
            <div className="mb-4">
              {candidate.linkedinVerified ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-stone-700 bg-stone-50 border border-stone-200 rounded-full px-2.5 py-1">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#0a66c2] text-white"><LinkedInGlyph size={9} /></span>
                  LinkedIn Verified <CheckCircle2 size={11} className="text-emerald-600" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-full px-2.5 py-1">
                  <LinkedInGlyph size={11} /> LinkedIn not yet verified
                </span>
              )}
            </div>
            {/* Work history — honest empty state, no fabricated data on company-facing surfaces */}
            <div className="font-bold mb-1.5 text-sm">Work history</div>
            {candidate.workHistory.length > 0 ? (
              <div className="space-y-2 mb-4">
                {candidate.workHistory.map((w, i) => {
                  const start = w.startYear;
                  const end = w.endYear ?? (w.startYear && !w.endYear ? "Present" : null);
                  return (
                    <div key={i} className="border-l-2 border-stone-200 pl-3">
                      <div className="font-semibold text-sm">{w.title}</div>
                      <div className="text-stone-500 text-xs">{w.company}{start ? ` · ${start}${end && end !== start ? `–${end}` : ""}` : ""}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-stone-500 italic mb-4">History will populate when LinkedIn data sync is enabled.</div>
            )}
            {/* Education — same honest empty state */}
            <div className="font-bold mb-1.5 text-sm">Education</div>
            {candidate.education.length > 0 ? (
              <div className="space-y-1">
                {candidate.education.map((e, i) => (
                  <div key={i} className="text-stone-700 text-sm"><span className="font-semibold">{e.school}</span>{e.degree ? ` · ${e.degree}` : ""}{e.year ? ` · ${e.year}` : ""}</div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-stone-500 italic">Education details will populate when LinkedIn data sync is enabled.</div>
            )}
          </Card>
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">Experience</div>
            <div className="space-y-2 text-sm">
              <div><span className="text-stone-500 text-xs">Has worked at a startup?</span> <span className="font-bold">{candidate.hasStartupExperience ? "Yes" : "No"}</span></div>
              <div><span className="text-stone-500 text-xs">Has worked at a tech company?</span> <span className="font-bold">{candidate.hasTechExperience ? "Yes" : "No"}</span></div>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3">What they&apos;re looking for</div>
            <div className="space-y-2 text-sm">
              <div><span className="text-stone-500 text-xs">Work mode</span><div><Tag>{candidate.workMode}</Tag></div></div>
              <div><span className="text-stone-500 text-xs">Years of exp</span><div className="font-bold">{candidate.yearsExperience}</div></div>
              <div><span className="text-stone-500 text-xs">Location</span><div className="text-stone-700">{locDisplay}</div></div>
            </div>
          </Card>
          {candidate.vettedInPerson && (
            <Card className="border-amber-300">
              <div className="text-xs uppercase tracking-wider text-amber-700 font-bold mb-2 flex items-center gap-1"><Shield size={12} /> Zap&apos;s notes</div>
              <div className="text-sm text-stone-700">
                Zap met {candidate.firstName} in person{candidate.vettedAt ? ` on ${candidate.vettedAt}` : ""}. Vetting notes available on request.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
