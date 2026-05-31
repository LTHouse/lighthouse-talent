"use client";

// The talent's entire signed-in experience: view + edit their own profile.
// By design talent see nothing else (no status pipeline, no company activity).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2 } from "lucide-react";
import { Button, Field, Input, Select, MultiSelectChips } from "@/components/ui";
import { ROLE_TYPES, WORK_MODES, RELOCATION_OPTIONS } from "@/lib/constants";
import type { Candidate } from "@/lib/data/candidates";
import { updateTalentProfileAction, type TalentProfilePatch } from "@/app/actions";

export default function TalentProfileEditor({ candidate }: { candidate: Candidate }) {
  const router = useRouter();
  const [form, setForm] = useState<TalentProfilePatch>({
    firstName: candidate.firstName ?? "",
    lastName: candidate.lastName ?? "",
    phone: candidate.phone ?? "",
    linkedin: candidate.linkedin ?? "",
    currentRole: candidate.currentRole ?? "",
    currentCompany: candidate.currentCompany ?? "",
    yearsExperience: candidate.yearsExperience ?? 0,
    currentLocation: candidate.currentLocation ?? "",
    relocationStatus: candidate.relocationStatus ?? "in_tn",
    workMode: candidate.workMode ?? "Open",
    primaryRole: candidate.primaryRole ?? ROLE_TYPES[0],
    roleTypes: candidate.roleTypes ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof TalentProfilePatch>(k: K, v: TalentProfilePatch[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const res = await updateTalentProfileAction(form);
    setSaving(false);
    if (res.ok) { setSaved(true); router.refresh(); }
    else setErr(res.error ?? "Couldn't save.");
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="First name"><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></Field>
        <Field label="Last name"><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(615) 555-0123" /></Field>
        <Field label="LinkedIn"><Input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://www.linkedin.com/in/you" /></Field>
        <Field label="Current role"><Input value={form.currentRole} onChange={(e) => set("currentRole", e.target.value)} /></Field>
        <Field label="Current company"><Input value={form.currentCompany} onChange={(e) => set("currentCompany", e.target.value)} /></Field>
        <Field label="Years of experience">
          <Input type="number" min={0} value={String(form.yearsExperience ?? 0)} onChange={(e) => set("yearsExperience", Math.max(0, Number(e.target.value) || 0))} />
        </Field>
        <Field label="Where are you now?"><Input value={form.currentLocation} onChange={(e) => set("currentLocation", e.target.value)} placeholder="Nashville, TN" /></Field>
        <Field label="Ideal work mode">
          <Select value={form.workMode ?? "Open"} onChange={(v) => set("workMode", v)} options={[...WORK_MODES]} />
        </Field>
        <Field label="Primary role">
          <Select value={form.primaryRole ?? ROLE_TYPES[0]} onChange={(v) => set("primaryRole", v)} options={[...ROLE_TYPES]} />
        </Field>
      </div>

      <Field label="Relocation">
        <Select
          value={form.relocationStatus ?? "in_tn"}
          onChange={(v) => set("relocationStatus", v)}
          options={RELOCATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </Field>

      <Field label="Role types you're open to">
        <MultiSelectChips options={ROLE_TYPES} selected={form.roleTypes ?? []} onChange={(v) => set("roleTypes", v)} />
      </Field>

      {err && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</div>}

      <div className="flex items-center gap-3">
        <Button type="submit" icon={Save} disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
        {saved && <span className="text-emerald-700 text-sm inline-flex items-center gap-1.5"><CheckCircle2 size={15} /> Saved</span>}
      </div>
    </form>
  );
}
