-- Galaxy Cue v4.0.0 Cloud Foundation
-- Run this entire file once in Supabase: SQL Editor -> New query -> Run.

begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','manager','staff')),
  status text not null default 'active' check (status in ('active','invited','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id,user_id)
);

create or replace function public.is_business_member(target_business_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.business_members bm
    where bm.business_id=target_business_id
      and bm.user_id=auth.uid()
      and bm.status='active'
  );
$$;

create or replace function public.create_business_for_current_user(requested_name text)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  uid uuid := auth.uid();
  new_id uuid;
  base_slug text;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  select business_id into new_id from public.business_members
    where user_id=uid and status='active' limit 1;
  if new_id is not null then return new_id; end if;
  base_slug := trim(both '-' from regexp_replace(lower(coalesce(nullif(trim(requested_name),''),'my-business')), '[^a-z0-9]+', '-', 'g'));
  insert into public.businesses(name,slug,owner_id)
  values(coalesce(nullif(trim(requested_name),''),'My Entertainment Business'), base_slug||'-'||substr(uid::text,1,8), uid)
  returning id into new_id;
  insert into public.business_members(business_id,user_id,role,status)
  values(new_id,uid,'owner','active');
  return new_id;
end;
$$;
grant execute on function public.create_business_for_current_user(text) to authenticated;

do $$
begin
  if not exists(select 1 from pg_type where typname='document_status') then
    create type public.document_status as enum ('draft','sent','viewed','accepted','declined','paid','void');
  end if;
end$$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, company text, email text, phone text, address text, notes text,
  created_by uuid default auth.uid() references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null, booking_ref text not null,
  title text, event_type text, event_date date, start_time time, end_time time, venue_name text, venue_address text,
  status text not null default 'draft', event_data jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid() references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(business_id,booking_ref)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade, client_id uuid references public.clients(id) on delete set null,
  quote_number text, status public.document_status not null default 'draft', subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0, tax numeric(12,2) not null default 0, total numeric(12,2) not null default 0,
  deposit_due numeric(12,2) not null default 0, content jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid() references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade, client_id uuid references public.clients(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null, contract_number text, status public.document_status not null default 'draft',
  content jsonb not null default '{}'::jsonb, accepted_at timestamptz, accepted_by_name text, accepted_by_email text,
  created_by uuid default auth.uid() references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade, client_id uuid references public.clients(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null, invoice_number text, status public.document_status not null default 'draft',
  subtotal numeric(12,2) not null default 0, tax numeric(12,2) not null default 0, total numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0, due_date date, content jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid() references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null, client_id uuid references public.clients(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null, amount numeric(12,2) not null check(amount>=0),
  payment_method text, reference text, status text not null default 'recorded', paid_at timestamptz default now(), notes text,
  created_by uuid default auth.uid() references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.business_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb, updated_by uuid default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.client_portal_access (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade, client_id uuid references public.clients(id) on delete cascade,
  client_email text not null, access_token_hash text, enabled boolean not null default true, last_accessed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(event_id,client_email)
);

create table if not exists public.activity_logs (
  id bigint generated always as identity primary key, business_id uuid not null references public.businesses(id) on delete cascade,
  actor_id uuid default auth.uid() references auth.users(id) on delete set null, action text not null, entity_type text, entity_id text,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index if not exists clients_business_idx on public.clients(business_id);
create index if not exists events_business_date_idx on public.events(business_id,event_date);
create index if not exists quotes_business_idx on public.quotes(business_id);
create index if not exists contracts_business_idx on public.contracts(business_id);
create index if not exists invoices_business_idx on public.invoices(business_id);
create index if not exists payments_business_idx on public.payments(business_id);
create index if not exists activity_logs_business_idx on public.activity_logs(business_id,created_at desc);

-- Updated-at triggers
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['businesses','business_members','clients','events','quotes','contracts','invoices','payments','business_settings','client_portal_access']
  LOOP
    execute format('drop trigger if exists %I_set_updated_at on public.%I',t,t);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t);
  END LOOP;
END$$;

-- RLS
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['businesses','business_members','clients','events','quotes','contracts','invoices','payments','business_settings','client_portal_access','activity_logs']
  LOOP execute format('alter table public.%I enable row level security',t); END LOOP;
END$$;

-- Businesses and memberships
create policy "members read businesses" on public.businesses for select to authenticated using (public.is_business_member(id));
create policy "owners update businesses" on public.businesses for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy "members read memberships" on public.business_members for select to authenticated using (public.is_business_member(business_id));
create policy "owners manage memberships" on public.business_members for all to authenticated
using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()))
with check (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));

-- Shared tenant policies
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','events','quotes','contracts','invoices','payments','business_settings','client_portal_access','activity_logs']
  LOOP
    execute format('create policy "tenant select %1$s" on public.%1$I for select to authenticated using (public.is_business_member(business_id))',t);
    execute format('create policy "tenant insert %1$s" on public.%1$I for insert to authenticated with check (public.is_business_member(business_id))',t);
    execute format('create policy "tenant update %1$s" on public.%1$I for update to authenticated using (public.is_business_member(business_id)) with check (public.is_business_member(business_id))',t);
    execute format('create policy "tenant delete %1$s" on public.%1$I for delete to authenticated using (public.is_business_member(business_id))',t);
  END LOOP;
END$$;

commit;
