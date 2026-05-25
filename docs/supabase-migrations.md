# Supabase Migrations — pending wiring

When real persistence is wired up (Lorenzo lands Proxycurl successor + LinkedIn OAuth credentials), apply these migrations in order. They mirror the in-memory data model already shipped to main so the front-end will work against Supabase without further code changes.

## 1. Investor schema stays dormant

The investor role is removed from MVP per `cowork_handoff_strip_investor.md`. UI parked in `feature/investor-portal-v1`. Do **not** drop these database surfaces — keep them empty until re-enablement:

- `investors` table (firm name, contacts, etc.)
- `investor_portcos` table
- `saved_searches.investor_portco` column
- `users.role` enum keeps the `investor` value

Re-enabling is then a UI-only PR.

## 2. Candidate model alignment (in-memory shape is canonical)

```sql
-- Status enum rename — display strings → snake_case
alter type candidate_status rename value 'New' to 'applied';
alter type candidate_status rename value 'Reviewing' to 'reviewing';
alter type candidate_status rename value 'Vetting Call Scheduled' to 'vetting_scheduled';
alter type candidate_status rename value 'Active' to 'active';
alter type candidate_status rename value 'Hidden' to 'hidden';
alter type candidate_status rename value 'Declined' to 'archived';
alter type candidate_status add value 'pre_onboard';

-- Column renames + additions
alter table candidates rename column vettingStatus to status;
alter table candidates rename column linkedin to linkedin_url;
alter table candidates add column linkedin_id text;             -- from OAuth, for dedup
alter table candidates add column linkedin_verified boolean default false;
alter table candidates add column linkedin_data jsonb;          -- reserved for future enrichment
alter table candidates add column linkedin_data_last_updated timestamptz;
alter table candidates add column linkedin_data_source text;
alter table candidates add column linkedin_refresh_priority text default 'normal';
alter table candidates add column admin_internal_status text;   -- replaces legacy Airtable `roles` field
alter table candidates add column batch_id text;                -- from Bulk Import (deferred feature)
alter table candidates add column is_demo boolean default false;
alter table candidates add column intake_source text default 'imported';  -- 'linkedin_oauth' | 'manual_entry' | 'imported'
alter table candidates add column vetted_in_person boolean default false;
alter table candidates add column vetted_at date;
alter table candidates add column vetted_by text;
```

## 3. Featured Talent + Sent for Review tables

```sql
create table if not exists featured_talent_weeks (
  week_starting date primary key,
  weekly_note text,
  created_at timestamptz default now()
);

create table if not exists featured_candidates (
  week_starting date references featured_talent_weeks(week_starting) on delete cascade,
  candidate_id uuid references candidates(id) on delete cascade,
  curator_note text,
  primary key (week_starting, candidate_id)
);

create table if not exists sent_for_review (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidates(id),
  sent_to_company_id uuid references companies(id),
  -- sent_to_investor_id stays dormant — uncomment when investor portal re-enables
  -- sent_to_investor_id uuid references investors(id),
  sent_by text,
  sent_at date default current_date,
  zap_note text,
  status text default 'pending',  -- 'pending' | 'interested' | 'passed' | 'discussion_requested'
  response_at date,
  response_reason text
);
```

## 4. Profile-view audit log (anti-poaching)

```sql
create table if not exists profile_views (
  id bigserial primary key,
  candidate_id uuid references candidates(id),
  viewer_company_id uuid references companies(id),
  viewed_at timestamptz default now()
);
```

Front-end already logs to `window.__lt_profile_views` — swap to a Supabase insert at the same call site once persistence is live.

## 5. Outbound emails — master toggle gate

Add a settings row + a `canSendEmail()` server-side guard. Every email trigger (intro approval, onboarding, etc.) must call this before sending. The toggle ships DISABLED in the admin Settings page; flip when Lorenzo's ready.

```sql
create table if not exists platform_settings (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

insert into platform_settings (key, value) values
  ('outbound_emails', '{"enabled": false}'::jsonb)
on conflict (key) do nothing;
```

## 6. LinkedIn OAuth (production)

When Lorenzo registers the LinkedIn Developer App:
- Store `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` as Supabase secrets
- Deploy an `/oauth/linkedin/callback` Edge Function that exchanges the code → identity → populates `linkedin_id` + `linkedin_url` + `linkedin_verified=true` + `intake_source='linkedin_oauth'`
- No Proxycurl. Enrichment shape stays for whatever vendor lands next; `linkedin_data` stays null in the meantime.
