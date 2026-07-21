-- Galaxy Cue v6.0.0-alpha.10 — Event Action Center + Permanent Document Copies
-- Safe to run after alpha.9. Replaces the client form RPC and repairs false submitted states.
begin;

-- Prefilled booking-request data is a source document, not a client submission.
update public.events
set event_data = jsonb_set(
  jsonb_set(
    event_data,
    '{documents,bookingRequest}',
    coalesce(event_data#>array['documents','bookingRequest'], event_data#>array['forms',coalesce(nullif(event_data->>'active',''),'wedding')], '{}'::jsonb),
    true
  ),
  '{clientEventForm,status}',
  '"pending"'::jsonb,
  true
), updated_at=now()
where event_data ? 'clientEventForm'
  and coalesce(event_data#>>'{clientEventForm,status}','pending')='submitted'
  and event_data#>'{documents,eventForm}' is null;

create or replace function public.save_client_event_form(
  target_event_id uuid,
  form_payload jsonb,
  submit_form boolean default false
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  current_data jsonb;
  active_key text;
  now_text text := to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  verified_email text := lower(coalesce(auth.jwt()->>'email',''));
begin
  if auth.uid() is null or verified_email='' then raise exception 'Authentication required'; end if;
  select e.event_data into current_data
  from public.events e
  join public.client_portal_access a on a.event_id=e.id and a.enabled=true
  where e.id=target_event_id and lower(a.client_email)=verified_email
  for update;
  if current_data is null then raise exception 'Event not found for this client email'; end if;

  active_key := coalesce(nullif(current_data->>'active',''),'wedding');
  current_data := jsonb_set(current_data, array['documents','bookingRequest'], coalesce(current_data#>array['documents','bookingRequest'],current_data#>array['forms',active_key],'{}'::jsonb), true);
  current_data := jsonb_set(current_data, array['forms',active_key], coalesce(current_data#>array['forms',active_key],'{}'::jsonb) || coalesce(form_payload,'{}'::jsonb), true);
  current_data := jsonb_set(current_data,'{clientEventForm}',jsonb_build_object(
    'status',case when submit_form then 'submitted' else 'draft' end,
    'assignedAt',coalesce(current_data#>>'{clientEventForm,assignedAt}',now_text),
    'savedAt',now_text,
    'submittedAt',case when submit_form then now_text else current_data#>>'{clientEventForm,submittedAt}' end
  ),true);

  if submit_form then
    current_data := jsonb_set(current_data,'{documents,eventForm}',jsonb_build_object(
      'type','event_form','status','submitted','submittedAt',now_text,
      'submittedBy',verified_email,'payload',coalesce(form_payload,'{}'::jsonb)
    ),true);
    current_data := jsonb_set(current_data,'{workflow,currentState}','"QUOTE_PREPARATION"'::jsonb,true);
    current_data := jsonb_set(current_data,'{workflow,owner}','"organization"'::jsonb,true);
    current_data := jsonb_set(current_data,'{workflow,updatedAt}',to_jsonb(now_text),true);
    current_data := jsonb_set(current_data,'{workflow,enteredAt}',to_jsonb(now_text),true);
    current_data := jsonb_set(current_data,'{workflow,history}',coalesce(current_data#>'{workflow,history}','[]'::jsonb) || jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'from','EVENT_FORM_PENDING','to','QUOTE_PREPARATION','action','submit_event_form','actor','client','at',now_text)),true);
  end if;

  update public.events set event_data=current_data,
    event_date=coalesce(nullif(form_payload->>'eventDate','')::date,event_date),
    start_time=coalesce(nullif(form_payload->>'startTime','')::time,start_time),
    end_time=coalesce(nullif(form_payload->>'endTime','')::time,end_time),
    venue_name=coalesce(nullif(form_payload->>'venueName',''),venue_name),
    venue_address=coalesce(nullif(form_payload->>'venueAddress',''),venue_address),
    status=case when submit_form then 'planning' else status end,
    updated_at=now()
  where id=target_event_id;
  return current_data;
end;
$$;
grant execute on function public.save_client_event_form(uuid,jsonb,boolean) to authenticated;

commit;
