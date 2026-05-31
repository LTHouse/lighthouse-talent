// candidateMapping — the single place that translates between the Supabase
// `candidates` row shape (snake_case) and the in-memory shape App.jsx renders
// (camelCase, the legacy src/data.js shape). Both the data layer (reads/writes)
// and the seed script reuse these so the mapping never drifts.

// status enum (DB) <-> the display strings the UI has always used.
export const STATUS_DB_TO_DISPLAY = {
  applied: "New",
  reviewing: "Reviewing",
  vetting_scheduled: "Vetting Call Scheduled",
  active: "Active",
  pre_onboard: "Pre-Onboarding",
  hidden: "Hidden",
  archived: "Declined",
};
export const STATUS_DISPLAY_TO_DB = Object.fromEntries(
  Object.entries(STATUS_DB_TO_DISPLAY).map(([db, disp]) => [disp, db])
);

// DB row -> the camelCase object App.jsx expects (incl. legacy `vettingStatus`).
export function candidateFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    linkedin: row.linkedin_url,
    linkedinVerified: row.linkedin_verified,
    photoSeed: row.photo_seed,
    currentRole: row.current_role_title,
    currentCompany: row.current_company,
    yearsExperience: row.years_experience,
    currentLocation: row.current_location,
    location: row.location,
    relocationStatus: row.relocation_status,
    workMode: row.work_mode,
    primaryRole: row.primary_role,
    roleTypes: row.role_types ?? [],
    workHistory: row.work_history ?? [],
    education: row.education ?? [],
    hasStartupExperience: row.has_startup_experience,
    startupStage: row.startup_stage,
    startupSize: row.startup_size,
    hasTechExperience: row.has_tech_experience,
    rankedMotivations: row.ranked_motivations ?? [],
    topMotivation: row.top_motivation,
    vettingStatus: STATUS_DB_TO_DISPLAY[row.status] ?? row.status,
    status: row.status, // raw enum, for code that prefers it
    declined: row.declined,
    dateApplied: row.date_applied,
    introRequests: row.intro_requests,
    lastActivity: row.last_activity,
    adminNotes: row.admin_notes,
    tag: row.tag,
    is_demo: row.is_demo,
    intakeSource: row.intake_source,
  };
}

// camelCase object (mock or form) -> snake_case DB columns. Only includes
// columns we set from the app/seed; DB defaults fill the rest. Drops undefined.
export function candidateToRow(c) {
  const row = {
    first_name: c.firstName,
    last_name: c.lastName,
    email: c.email,
    phone: c.phone,
    linkedin_url: c.linkedin ?? c.linkedinUrl,
    photo_seed: c.photoSeed,
    current_role_title: c.currentRole,
    current_company: c.currentCompany,
    years_experience: c.yearsExperience,
    current_location: c.currentLocation,
    location: c.location,
    relocation_status: c.relocationStatus,
    work_mode: c.workMode,
    primary_role: c.primaryRole,
    role_types: c.roleTypes,
    work_history: c.workHistory,
    education: c.education,
    has_startup_experience: c.hasStartupExperience,
    startup_stage: c.startupStage,
    startup_size: c.startupSize,
    has_tech_experience: c.hasTechExperience,
    ranked_motivations: c.rankedMotivations,
    top_motivation: c.topMotivation,
    // accept either a raw enum (`status`) or a display string (`vettingStatus`)
    status: c.status ?? STATUS_DISPLAY_TO_DB[c.vettingStatus],
    declined: c.declined,
    date_applied: c.dateApplied,
    intro_requests: c.introRequests,
    last_activity: c.lastActivity,
    admin_notes: c.adminNotes,
    tag: c.tag,
    is_demo: c.is_demo,
    intake_source: c.intakeSource,
  };
  for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
  return row;
}
