-- Galaxy Cue v6.0.0-alpha.13 — platform application separation
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'developer' check (role in ('owner','developer','support','billing')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.platform_admins pa where pa.user_id=auth.uid() and pa.status='active');
$$;
drop policy if exists "platform admins read own access" on public.platform_admins;
create policy "platform admins read own access" on public.platform_admins for select using (user_id=auth.uid() or public.is_platform_admin());
-- Platform-wide read access for active admins. Existing business/client RLS remains unchanged.
do $$ begin
  if to_regclass('public.businesses') is not null then execute 'drop policy if exists "platform admins read businesses" on public.businesses'; execute 'create policy "platform admins read businesses" on public.businesses for select using (public.is_platform_admin())'; end if;
  if to_regclass('public.clients') is not null then execute 'drop policy if exists "platform admins read clients" on public.clients'; execute 'create policy "platform admins read clients" on public.clients for select using (public.is_platform_admin())'; end if;
  if to_regclass('public.events') is not null then execute 'drop policy if exists "platform admins read events" on public.events'; execute 'create policy "platform admins read events" on public.events for select using (public.is_platform_admin())'; end if;
  if to_regclass('public.booking_requests') is not null then execute 'drop policy if exists "platform admins read booking requests" on public.booking_requests'; execute 'create policy "platform admins read booking requests" on public.booking_requests for select using (public.is_platform_admin())'; end if;
end $$;
-- After running this migration, add the first admin from SQL editor:
-- insert into public.platform_admins(user_id,role) values ('YOUR_AUTH_USER_UUID','owner');


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
