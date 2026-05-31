-- 0001_init.sql — baseline schema for Lighthouse Talent (Case B: built fresh).
--
-- Prod (rdnfckhtheescralfkwn) responded but had zero public tables, so this is
-- the from-scratch target state implied by src/data.js + the deltas that used to
-- live in docs/supabase-migrations.md (now deleted; supabase/migrations/ is the
-- source of truth).
--
-- Conventions:
--   * snake_case columns. The thin data layer (src/lib/data.*) maps rows to the
--     camelCase shape App.jsx expects, so the UI doesn't change.
--   * RLS enabled on EVERY table. No `FOR ALL` policies — one policy per command.
--   * Role checks go through SECURITY DEFINER helpers so policies never recurse
--     on public.users.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ============================================================
-- Enums
-- ============================================================
-- Keep the 'investor' value even though there's no UI (dormant per product).
create type public.user_role as enum ('talent', 'company', 'admin', 'investor');

-- Snake_case status values (renamed from the legacy display strings).
create type public.candidate_status as enum (
  'applied', 'reviewing', 'vetting_scheduled', 'active', 'pre_onboard', 'hidden', 'archived'
);

-- ============================================================
-- Shared helpers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- companies  (minimum columns for users.company_id to be valid; fleshed in #16)
-- ============================================================
create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  stage       text,
  industry    text,
  team        integer,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- candidates  (full target shape: src/data.js + the linkedin_*/vetted_*/etc additions)
-- ============================================================
create table public.candidates (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references auth.users(id) on delete set null,
  first_name                  text,
  last_name                   text,
  email                       text unique,
  phone                       text,
  -- LinkedIn (from OAuth + reserved enrichment surface)
  linkedin_url                text,
  linkedin_id                 text,                       -- from OAuth, for dedup
  linkedin_verified           boolean not null default false,
  linkedin_data               jsonb,                      -- reserved for future enrichment
  linkedin_data_last_updated  timestamptz,
  linkedin_data_source        text,
  linkedin_refresh_priority   text not null default 'normal',
  -- Profile
  photo_seed                  integer,
  current_role_title          text,                       -- in-memory `currentRole` (avoids the reserved word current_role)
  current_company             text,
  years_experience            integer,
  current_location            text,
  location                    text,
  relocation_status           text,                       -- willing_to_relocate | in_tn | remote_only
  work_mode                   text,                       -- Remote | Hybrid | Open | In-person Nashville
  primary_role                text,
  role_types                  text[] not null default '{}',
  work_history                jsonb not null default '[]',  -- [{title,company,startYear,endYear}]
  education                   jsonb not null default '[]',  -- [{school,degree,year}]
  has_startup_experience      boolean,
  startup_stage               text,
  startup_size                text,
  has_tech_experience         boolean,
  ranked_motivations          text[] not null default '{}',
  top_motivation              text,
  -- Pipeline / curation
  status                      public.candidate_status not null default 'applied',
  declined                    boolean not null default false,
  date_applied                date,
  intro_requests              integer not null default 0,
  last_activity               date,
  admin_notes                 text,
  tag                         text,
  admin_internal_status       text,                       -- replaces legacy Airtable `roles` field
  batch_id                    text,                       -- from Bulk Import (deferred)
  is_demo                     boolean not null default false,
  intake_source               text not null default 'imported',  -- linkedin_oauth | manual_entry | imported
  vetted_in_person            boolean not null default false,
  vetted_at                   date,
  vetted_by                   text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index candidates_status_idx       on public.candidates (status);
create index candidates_is_demo_idx       on public.candidates (is_demo);
create index candidates_user_id_idx       on public.candidates (user_id);
create index candidates_primary_role_idx  on public.candidates (primary_role);
create trigger candidates_set_updated_at before update on public.candidates
  for each row execute function public.set_updated_at();

-- ============================================================
-- users  (joins auth.users → role + optional FK). Never auto-created: a missing
-- row means "not set up yet" (see auth role-resolution in #12).
-- ============================================================
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          public.user_role not null,
  candidate_id  uuid references public.candidates(id) on delete set null,
  company_id    uuid references public.companies(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- SECURITY DEFINER helpers — read public.users bypassing RLS so table policies
-- that need the caller's role/FK don't recurse.
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role::text from public.users where id = auth.uid()
$$;

create or replace function public.current_user_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.users where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.users where id = auth.uid()), false)
$$;

-- ============================================================
-- intro_requests  (basic shape; fleshed out in #17)
-- ============================================================
create table public.intro_requests (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid references public.candidates(id) on delete cascade,
  company_id    uuid references public.companies(id) on delete set null,
  status        text not null default 'pending',  -- pending | approved | declined | sent
  message       text,
  created_at    timestamptz not null default now()
);
create index intro_requests_candidate_idx on public.intro_requests (candidate_id);
create index intro_requests_company_idx   on public.intro_requests (company_id);

-- ============================================================
-- Featured Talent of the Week  (#18)
-- ============================================================
create table public.featured_talent_weeks (
  week_starting  date primary key,
  weekly_note    text,
  created_at     timestamptz not null default now()
);

create table public.featured_candidates (
  week_starting  date references public.featured_talent_weeks(week_starting) on delete cascade,
  candidate_id   uuid references public.candidates(id) on delete cascade,
  curator_note   text,
  primary key (week_starting, candidate_id)
);

-- ============================================================
-- platform_settings  (holds the outbound_emails master toggle; ships DISABLED)
-- ============================================================
create table public.platform_settings (
  key         text primary key,
  value       jsonb,
  updated_at  timestamptz not null default now()
);
insert into public.platform_settings (key, value) values
  ('outbound_emails', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- Company workspace surfaces (saved searches + shortlists)
-- investor_portco column stays dormant per product (investor portal parked).
-- ============================================================
create table public.saved_searches (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid references public.companies(id) on delete cascade,
  investor_portco  text,                       -- dormant
  name             text,
  kind             text,
  filters          jsonb not null default '{}',
  results          integer,
  created_at       timestamptz not null default now()
);

create table public.shortlists (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid references public.companies(id) on delete cascade,
  investor_portco  text,                       -- dormant
  name             text,
  candidate_ids    uuid[] not null default '{}',
  created_at       timestamptz not null default now()
);

-- ============================================================
-- Dormant investor surfaces — created but unused. Do NOT drop (re-enabling the
-- investor portal is then a UI-only change).
-- ============================================================
create table public.investors (
  id          uuid primary key default gen_random_uuid(),
  firm_name   text not null,
  email       text,
  created_at  timestamptz not null default now()
);

create table public.investor_portcos (
  id            uuid primary key default gen_random_uuid(),
  investor_id   uuid references public.investors(id) on delete cascade,
  company_name  text not null
);

-- ============================================================
-- profile_views  (anti-poaching audit log — front-end logs to window.__lt_profile_views today)
-- ============================================================
create table public.profile_views (
  id                 bigserial primary key,
  candidate_id       uuid references public.candidates(id) on delete cascade,
  viewer_company_id  uuid references public.companies(id) on delete set null,
  viewed_at          timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Enabled on EVERY table. One policy per command (no FOR ALL). Admin gets full
-- access everywhere via is_admin(); other roles get the narrow grants from #10.
-- ============================================================================
alter table public.companies            enable row level security;
alter table public.candidates           enable row level security;
alter table public.users                enable row level security;
alter table public.intro_requests       enable row level security;
alter table public.featured_talent_weeks enable row level security;
alter table public.featured_candidates  enable row level security;
alter table public.platform_settings    enable row level security;
alter table public.saved_searches       enable row level security;
alter table public.shortlists           enable row level security;
alter table public.investors            enable row level security;
alter table public.investor_portcos     enable row level security;
alter table public.profile_views        enable row level security;

-- ---------- helper macro note ----------
-- "admin full access" = 4 explicit policies (select/insert/update/delete), each
-- gated on public.is_admin(). Written out per table below.

-- ===== candidates =====
-- Admin: full access
create policy candidates_admin_select on public.candidates for select to authenticated using (public.is_admin());
create policy candidates_admin_insert on public.candidates for insert to authenticated with check (public.is_admin());
create policy candidates_admin_update on public.candidates for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy candidates_admin_delete on public.candidates for delete to authenticated using (public.is_admin());
-- Talent: read + update ONLY their own row
create policy candidates_talent_select on public.candidates for select to authenticated
  using (user_id = auth.uid());
create policy candidates_talent_update on public.candidates for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Company: read only real, listable candidates
create policy candidates_company_select on public.candidates for select to authenticated
  using (
    public.current_user_role() = 'company'
    and is_demo = false
    and status in ('active', 'pre_onboard')
  );
-- Anonymous: insert ONLY a fresh public application (the intake form, #15)
create policy candidates_anon_insert on public.candidates for insert to anon
  with check (status = 'applied' and is_demo = false);

-- ===== users =====
create policy users_admin_select on public.users for select to authenticated using (public.is_admin());
create policy users_admin_insert on public.users for insert to authenticated with check (public.is_admin());
create policy users_admin_update on public.users for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy users_admin_delete on public.users for delete to authenticated using (public.is_admin());
-- Everyone authenticated may read their OWN row (needed for role resolution in #12)
create policy users_self_select on public.users for select to authenticated
  using (id = auth.uid());

-- ===== companies =====
create policy companies_admin_select on public.companies for select to authenticated using (public.is_admin());
create policy companies_admin_insert on public.companies for insert to authenticated with check (public.is_admin());
create policy companies_admin_update on public.companies for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy companies_admin_delete on public.companies for delete to authenticated using (public.is_admin());
-- Company: read ONLY their own company row
create policy companies_self_select on public.companies for select to authenticated
  using (id = public.current_user_company_id());

-- ===== intro_requests =====
create policy intro_admin_select on public.intro_requests for select to authenticated using (public.is_admin());
create policy intro_admin_insert on public.intro_requests for insert to authenticated with check (public.is_admin());
create policy intro_admin_update on public.intro_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy intro_admin_delete on public.intro_requests for delete to authenticated using (public.is_admin());
-- Company: create an intro request for itself, and read its own requests
create policy intro_company_insert on public.intro_requests for insert to authenticated
  with check (public.current_user_role() = 'company' and company_id = public.current_user_company_id());
create policy intro_company_select on public.intro_requests for select to authenticated
  using (company_id = public.current_user_company_id());

-- ===== featured_talent_weeks =====
create policy ftw_admin_select on public.featured_talent_weeks for select to authenticated using (public.is_admin());
create policy ftw_admin_insert on public.featured_talent_weeks for insert to authenticated with check (public.is_admin());
create policy ftw_admin_update on public.featured_talent_weeks for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy ftw_admin_delete on public.featured_talent_weeks for delete to authenticated using (public.is_admin());
-- Companies may read which weeks are featured
create policy ftw_company_select on public.featured_talent_weeks for select to authenticated
  using (public.current_user_role() = 'company');

-- ===== featured_candidates =====
create policy fc_admin_select on public.featured_candidates for select to authenticated using (public.is_admin());
create policy fc_admin_insert on public.featured_candidates for insert to authenticated with check (public.is_admin());
create policy fc_admin_update on public.featured_candidates for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy fc_admin_delete on public.featured_candidates for delete to authenticated using (public.is_admin());
-- Companies may read the featured list
create policy fc_company_select on public.featured_candidates for select to authenticated
  using (public.current_user_role() = 'company');

-- ===== platform_settings =====
create policy settings_admin_select on public.platform_settings for select to authenticated using (public.is_admin());
create policy settings_admin_insert on public.platform_settings for insert to authenticated with check (public.is_admin());
create policy settings_admin_update on public.platform_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy settings_admin_delete on public.platform_settings for delete to authenticated using (public.is_admin());

-- ===== saved_searches =====
create policy ss_admin_select on public.saved_searches for select to authenticated using (public.is_admin());
create policy ss_admin_insert on public.saved_searches for insert to authenticated with check (public.is_admin());
create policy ss_admin_update on public.saved_searches for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy ss_admin_delete on public.saved_searches for delete to authenticated using (public.is_admin());
create policy ss_company_select on public.saved_searches for select to authenticated
  using (company_id = public.current_user_company_id());
create policy ss_company_insert on public.saved_searches for insert to authenticated
  with check (company_id = public.current_user_company_id());
create policy ss_company_update on public.saved_searches for update to authenticated
  using (company_id = public.current_user_company_id()) with check (company_id = public.current_user_company_id());
create policy ss_company_delete on public.saved_searches for delete to authenticated
  using (company_id = public.current_user_company_id());

-- ===== shortlists =====
create policy sl_admin_select on public.shortlists for select to authenticated using (public.is_admin());
create policy sl_admin_insert on public.shortlists for insert to authenticated with check (public.is_admin());
create policy sl_admin_update on public.shortlists for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy sl_admin_delete on public.shortlists for delete to authenticated using (public.is_admin());
create policy sl_company_select on public.shortlists for select to authenticated
  using (company_id = public.current_user_company_id());
create policy sl_company_insert on public.shortlists for insert to authenticated
  with check (company_id = public.current_user_company_id());
create policy sl_company_update on public.shortlists for update to authenticated
  using (company_id = public.current_user_company_id()) with check (company_id = public.current_user_company_id());
create policy sl_company_delete on public.shortlists for delete to authenticated
  using (company_id = public.current_user_company_id());

-- ===== investors / investor_portcos (dormant — admin-only) =====
create policy investors_admin_select on public.investors for select to authenticated using (public.is_admin());
create policy investors_admin_insert on public.investors for insert to authenticated with check (public.is_admin());
create policy investors_admin_update on public.investors for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy investors_admin_delete on public.investors for delete to authenticated using (public.is_admin());
create policy ip_admin_select on public.investor_portcos for select to authenticated using (public.is_admin());
create policy ip_admin_insert on public.investor_portcos for insert to authenticated with check (public.is_admin());
create policy ip_admin_update on public.investor_portcos for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy ip_admin_delete on public.investor_portcos for delete to authenticated using (public.is_admin());

-- ===== profile_views (audit log) =====
create policy pv_admin_select on public.profile_views for select to authenticated using (public.is_admin());
create policy pv_admin_delete on public.profile_views for delete to authenticated using (public.is_admin());
-- A company may log a view (insert) and read its own view history
create policy pv_company_insert on public.profile_views for insert to authenticated
  with check (viewer_company_id = public.current_user_company_id());
create policy pv_company_select on public.profile_views for select to authenticated
  using (viewer_company_id = public.current_user_company_id());
