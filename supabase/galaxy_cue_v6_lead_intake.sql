begin;
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_name text not null,
  client_email text not null,
  client_phone text,
  event_date date not null,
  event_type text not null,
  guest_count integer,
  venue_name text,
  venue_city text,
  services jsonb not null default '[]'::jsonb,
  message text,
  status text not null default 'new' check(status in ('new','needs_info','accepted','declined')),
  decision_note text,
  converted_event_ref text,
  converted_client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists booking_requests_business_status_idx on public.booking_requests(business_id,status,created_at desc);
drop trigger if exists booking_requests_set_updated_at on public.booking_requests;
create trigger booking_requests_set_updated_at before update on public.booking_requests for each row execute function public.set_updated_at();
alter table public.booking_requests enable row level security;
drop policy if exists "public submit booking requests" on public.booking_requests;
create policy "public submit booking requests" on public.booking_requests for insert to anon, authenticated with check (business_id is not null);
drop policy if exists "tenant select booking requests" on public.booking_requests;
create policy "tenant select booking requests" on public.booking_requests for select to authenticated using (public.is_business_member(business_id));
drop policy if exists "tenant update booking requests" on public.booking_requests;
create policy "tenant update booking requests" on public.booking_requests for update to authenticated using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
commit;
