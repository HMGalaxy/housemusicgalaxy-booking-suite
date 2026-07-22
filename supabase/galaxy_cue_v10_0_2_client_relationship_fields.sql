-- Galaxy Cue v10.0.2 — client identity and booking relationship
alter table public.clients add column if not exists first_name text;
alter table public.clients add column if not exists last_name text;
alter table public.clients add column if not exists booking_for text not null default 'self' check (booking_for in ('self','third-party'));
alter table public.clients add column if not exists third_party_name text;
alter table public.clients add column if not exists third_party_role text;
alter table public.clients add column if not exists third_party_email text;
alter table public.clients add column if not exists third_party_phone text;
