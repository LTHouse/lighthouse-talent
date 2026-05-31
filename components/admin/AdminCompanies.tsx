"use client";

// Companies (#16) — LIVE Supabase data. Lists every company (name/stage/industry/team)
// and offers a small "Add company" form backed by createCompanyAction. After a
// successful create the parent refreshes server data. Provisioning a company *user*
// (login) is a separate runbook/script step — we can't create auth users client-side.
import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import type { Company } from "@/lib/data/companies";

export default function AdminCompanies({
  companies,
  createCompany,
}: {
  companies: Company[];
  createCompany: (input: { name: string; stage?: string; industry?: string; team?: number }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [stage, setStage] = useState("");
  const [industry, setIndustry] = useState("");
  const [team, setTeam] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    const teamNum = team.trim() === "" ? undefined : Number(team);
    try {
      await createCompany({
        name: name.trim(),
        stage: stage.trim() || undefined,
        industry: industry.trim() || undefined,
        team: typeof teamNum === "number" && !Number.isNaN(teamNum) ? teamNum : undefined,
      });
      setName("");
      setStage("");
      setIndustry("");
      setTeam("");
    } finally {
      setSubmitting(false);
    }
  }

  const sorted = [...companies].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="font-display text-3xl">Companies</h2>
        <div className="text-xs text-stone-500 mt-1">{companies.length} connected.</div>
      </div>

      <Card>
        <div className="text-xs uppercase tracking-wider text-stone-500 font-bold mb-3 flex items-center gap-1">
          <Plus size={12} /> Add company
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Robotics" />
          </Field>
          <Field label="Stage">
            <Input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Series A" />
          </Field>
          <Field label="Industry">
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Climate hardware" />
          </Field>
          <Field label="Team size">
            <Input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="24" inputMode="numeric" />
          </Field>
        </div>
        <div className="flex justify-end mt-3">
          <Button icon={Plus} onClick={submit} disabled={!name.trim() || submitting}>
            {submitting ? "Adding…" : "Add company"}
          </Button>
        </div>
        <div className="text-[11px] text-stone-500 mt-3">
          Provisioning a company <strong>user</strong> (login) is a runbook/script step — auth users can&apos;t be
          created from the client.
        </div>
      </Card>

      <Card padded={false}>
        {sorted.length === 0 && (
          <div className="p-8 text-center text-sm text-stone-500">No companies yet. Add one above.</div>
        )}
        {sorted.map((c) => (
          <div key={c.id} className="border-b border-stone-200 last:border-b-0 p-4 flex items-center gap-3 flex-wrap">
            <div className="h-9 w-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
              <Building2 size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold">{c.name}</div>
              <div className="text-xs text-stone-500">
                {[c.stage, c.industry, c.team != null ? `${c.team} on team` : null].filter(Boolean).join(" · ") || "—"}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
