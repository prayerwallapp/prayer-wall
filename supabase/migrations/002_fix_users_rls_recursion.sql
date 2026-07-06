-- Fixes infinite recursion in RLS policies (Postgres error 42P17).
--
-- Every policy from 001 that scopes by tenant does
--   church_id = (SELECT church_id FROM users WHERE id = auth.uid())
-- Resolving that subquery requires Postgres to apply RLS to `users` again,
-- which requires resolving the same subquery again, recursing forever.
-- Confirmed live: GET /rest/v1/users (and /submissions, /churches, ...)
-- with the anon key returns:
--   {"code":"42P17","message":"infinite recursion detected in policy for
--   relation \"users\""}
-- for every tenant-scoped table, not just `users` — any policy whose
-- subquery touches `users` inherits the recursion.
--
-- Fix: move the lookup into a SECURITY DEFINER function. Functions run as
-- their owner, and table owners aren't subject to their own table's RLS
-- (no FORCE ROW LEVEL SECURITY was set), so the lookup inside the function
-- bypasses RLS instead of re-triggering it.

create or replace function public.auth_user_church_id()
returns uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select church_id from public.users where id = auth.uid()
$$;

grant execute on function public.auth_user_church_id() to anon, authenticated;

drop policy if exists "church_isolation_submissions" on submissions;
create policy "church_isolation_submissions" on submissions
  for all using (church_id = public.auth_user_church_id());

drop policy if exists "church_isolation_keyword_rules" on keyword_rules;
create policy "church_isolation_keyword_rules" on keyword_rules
  for all using (church_id = public.auth_user_church_id());

drop policy if exists "church_isolation_escalation_contacts" on escalation_contacts;
create policy "church_isolation_escalation_contacts" on escalation_contacts
  for all using (church_id = public.auth_user_church_id());

drop policy if exists "users_own_church" on users;
create policy "users_own_church" on users
  for all using (church_id = public.auth_user_church_id());

drop policy if exists "churches_own_record" on churches;
create policy "churches_own_record" on churches
  for all using (id = public.auth_user_church_id());
