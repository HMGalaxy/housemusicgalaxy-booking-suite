-- Galaxy Cue v7.0.4 — Admin OS access reliability


-- v7.0.4 reliable self-access lookup for authenticated platform admins
create or replace function public.get_my_platform_access()
returns table (user_id uuid, role text, status text)
language sql
stable
security definer
set search_path = public
as $$
  select pa.user_id, pa.role, pa.status
  from public.platform_admins pa
  where pa.user_id = auth.uid();
$$;
revoke all on function public.get_my_platform_access() from public;
grant execute on function public.get_my_platform_access() to authenticated;
