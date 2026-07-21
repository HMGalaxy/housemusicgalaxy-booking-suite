begin;

-- Client users can securely read records that match their verified auth email.
-- Business-member policies remain unchanged and continue to grant full tenant access.

drop policy if exists "client reads own client record" on public.clients;
create policy "client reads own client record" on public.clients
for select to authenticated
using (lower(coalesce(email,'')) = lower(coalesce(auth.jwt()->>'email','')));

drop policy if exists "client reads own events" on public.events;
create policy "client reads own events" on public.events
for select to authenticated
using (
  exists (
    select 1 from public.clients c
    where c.id = events.client_id
      and lower(coalesce(c.email,'')) = lower(coalesce(auth.jwt()->>'email',''))
  )
);

drop policy if exists "client reads own booking requests" on public.booking_requests;
create policy "client reads own booking requests" on public.booking_requests
for select to authenticated
using (lower(client_email) = lower(coalesce(auth.jwt()->>'email','')));

-- A signed-in client may update only a request belonging to the same verified email.
drop policy if exists "client updates own booking requests" on public.booking_requests;
create policy "client updates own booking requests" on public.booking_requests
for update to authenticated
using (lower(client_email) = lower(coalesce(auth.jwt()->>'email','')))
with check (lower(client_email) = lower(coalesce(auth.jwt()->>'email','')));

commit;
