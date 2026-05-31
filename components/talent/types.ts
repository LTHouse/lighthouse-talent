// Shared form shape for the public talent intake flow. The fields map to the
// `IntakeForm` accepted by `submitIntakeAction`, plus a couple of UI-only flags
// (tri-state experience questions) that don't get persisted in this MVP.
import type { IntakeForm } from "@/app/actions";

export interface IntakeProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin: string;
  // UI-only: a "verified" flag set once a (mock) LinkedIn URL is accepted.
  linkedinConnected: boolean;
  currentRole: string;
  currentCompany: string;
  yearsExperience: number;
  currentLocation: string;
  relocationStatus: string;
  workMode: string;
  // UI-only yes/no questions; not part of IntakeForm today.
  hasStartupExperience: boolean | null;
  hasTechExperience: boolean | null;
  // Anti-spam honeypot — bots fill it; humans never see it.
  honeypot: string;
}

export type ProfilePatch = Partial<IntakeProfile>;

export function profileToForm(p: IntakeProfile): IntakeForm {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phone: p.phone || undefined,
    linkedin: p.linkedin || undefined,
    currentRole: p.currentRole || undefined,
    currentCompany: p.currentCompany || undefined,
    yearsExperience: p.yearsExperience,
    currentLocation: p.currentLocation || undefined,
    relocationStatus: p.relocationStatus || undefined,
    workMode: p.workMode || undefined,
    honeypot: p.honeypot || undefined,
  };
}
