-- 0003_sent_for_review.sql — admin-initiated "sent for review" (Zap pushes a
-- candidate to a company). Distinct from intro_requests (company-initiated).
create table public.sent_for_review (
  id                 uuid primary key default gen_random_uuid(),
  candidate_id       uuid references public.candidates(id) on delete cascade,
  sent_to_company_id uuid references public.companies(id) on delete cascade,
  sent_by            text,
  zap_note           text,
  status             text not null default 'pending',  -- pending | interested | passed
  response_reason    text,
  created_at         timestamptz not null default now(),
  responded_at       timestamptz
);
create index sent_for_review_company_idx on public.sent_for_review (sent_to_company_id);
create index sent_for_review_candidate_idx on public.sent_for_review (candidate_id);

alter table public.sent_for_review enable row level security;

create policy sfr_admin_select on public.sent_for_review for select to authenticated using (public.is_admin());
create policy sfr_admin_insert on public.sent_for_review for insert to authenticated with check (public.is_admin());
create policy sfr_admin_update on public.sent_for_review for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy sfr_admin_delete on public.sent_for_review for delete to authenticated using (public.is_admin());
create policy sfr_company_select on public.sent_for_review for select to authenticated
  using (sent_to_company_id = public.current_user_company_id());
create policy sfr_company_update on public.sent_for_review for update to authenticated
  using (sent_to_company_id = public.current_user_company_id())
  with check (sent_to_company_id = public.current_user_company_id());
