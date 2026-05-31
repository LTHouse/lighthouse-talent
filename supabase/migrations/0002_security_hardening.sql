-- 0002_security_hardening.sql — clear the security-advisor WARNs from 0001.
--
-- 1. Pin set_updated_at()'s search_path (mutable search_path lint).
-- 2. The RLS helpers (is_admin / current_user_role / current_user_company_id) are
--    SECURITY DEFINER and PostgREST exposes them as /rpc endpoints. They only ever
--    reveal the *caller's own* role/company, so it's benign — but anon never needs
--    them (no anon policy calls them), so revoke EXECUTE from PUBLIC and grant only
--    to authenticated. This silences the anon-executable lint and is least-privilege.

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Supabase grants EXECUTE to anon + authenticated by default on new public
-- functions, so revoke from both PUBLIC and anon explicitly, then grant only to
-- authenticated. (The remaining "authenticated can execute" advisor WARN is
-- expected and benign: these return only the *caller's own* role/company.)
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.current_user_role() from public, anon;
revoke execute on function public.current_user_company_id() from public, anon;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_company_id() to authenticated;

-- rls_auto_enable() is a pre-existing event-trigger function (owner: postgres)
-- that auto-enables RLS on any new public table — a useful safety net for the
-- vibecoder box, so we KEEP it. It's only ever invoked by the event trigger, not
-- via the API, so revoke its needless RPC exposure to clear the advisor lint.
-- (revoke is a no-op if the function is absent in a fresh environment.)
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;
