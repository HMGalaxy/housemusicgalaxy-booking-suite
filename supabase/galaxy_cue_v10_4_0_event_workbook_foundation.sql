-- Galaxy Cue v10.4.0
-- Canonical Full Event Workbook document and Consultation -> Quote handoff.

-- Preserve completed legacy Client Event Forms under the canonical document key.
update public.events
set event_data = jsonb_set(
  event_data,
  '{documents,eventWorkbook}',
  coalesce(event_data#>'{documents,eventWorkbook}', event_data#>'{documents,eventForm}'),
  true
)
where event_data#>'{documents,eventWorkbook}' is null
  and event_data#>'{documents,eventForm}' is not null;

create or replace function public.save_client_event_workbook(
  target_event_id uuid,
  form_key text,
  form_payload jsonb,
  submit_workbook boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_data jsonb;
  safe_payload jsonb;
  verified_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  now_text text := to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  current_state text;
begin
  if auth.uid() is null or verified_email = '' then
    raise exception 'Authentication required';
  end if;

  select e.event_data
  into current_data
  from public.events e
  join public.client_portal_access access
    on access.event_id = e.id
   and access.enabled = true
  where e.id = target_event_id
    and lower(trim(access.client_email)) = verified_email
  for update;

  if current_data is null then
    raise exception 'Event not found for this client account';
  end if;

  -- Client submissions may never persist business/internal-only fields.
  select coalesce(jsonb_object_agg(entry.key, entry.value), '{}'::jsonb)
  into safe_payload
  from jsonb_each(coalesce(form_payload, '{}'::jsonb)) entry
  where entry.key !~ '^(business_|internal_)';

  current_data := jsonb_set(
    current_data,
    array['forms', coalesce(nullif(form_key,''),'wedding')],
    safe_payload,
    true
  );
  current_data := jsonb_set(
    current_data,
    '{clientEventForm}',
    jsonb_build_object(
      'status', case when submit_workbook then 'submitted' else 'draft' end,
      'savedAt', now_text,
      'submittedAt', case when submit_workbook then now_text else null end
    ),
    true
  );

  if submit_workbook then
    current_data := jsonb_set(
      current_data,
      '{documents,eventWorkbook}',
      jsonb_build_object(
        'type','event_workbook',
        'status','submitted',
        'submittedAt',now_text,
        'submittedBy',verified_email,
        'payload',safe_payload
      ),
      true
    );

    current_state := coalesce(current_data#>>'{workflow,currentState}','EVENT_FORM_PENDING');
    if current_state in ('BOOKING_REQUEST_RECEIVED','EVENT_FORM_PENDING','EVENT_WORKBOOK_PENDING') then
      current_data := jsonb_set(current_data,'{workflow,currentState}','"QUOTE_PREPARATION"'::jsonb,true);
      current_data := jsonb_set(current_data,'{workflow,owner}','"organization"'::jsonb,true);
      current_data := jsonb_set(current_data,'{workflow,enteredAt}',to_jsonb(now_text),true);
      current_data := jsonb_set(current_data,'{workflow,updatedAt}',to_jsonb(now_text),true);
      current_data := jsonb_set(
        current_data,
        '{workflow,history}',
        coalesce(current_data#>'{workflow,history}','[]'::jsonb) ||
          jsonb_build_array(jsonb_build_object(
            'id',gen_random_uuid(),
            'from',current_state,
            'to','QUOTE_PREPARATION',
            'action','submit_event_workbook',
            'actor','client',
            'at',now_text
          )),
        true
      );
    end if;
  end if;

  update public.events
  set
    event_data = current_data,
    event_date = coalesce(nullif(safe_payload->>'eventDate','')::date,event_date),
    start_time = coalesce(nullif(safe_payload->>'startTime','')::time,start_time),
    end_time = coalesce(nullif(safe_payload->>'endTime','')::time,end_time),
    venue_name = coalesce(nullif(safe_payload->>'venueName',''),venue_name),
    venue_address = coalesce(
      nullif(safe_payload->>'venueAddress',''),
      nullif(safe_payload->>'venueCity',''),
      venue_address
    ),
    status = case when submit_workbook then 'quote_preparation' else status end,
    updated_at = now()
  where id = target_event_id;

  return jsonb_build_object(
    'event_id',target_event_id,
    'status',case when submit_workbook then 'submitted' else 'draft' end,
    'workflow_state',case when submit_workbook then 'QUOTE_PREPARATION' else current_state end
  );
end;
$$;

-- SECURITY DEFINER functions are executable by PUBLIC unless explicitly revoked.
revoke all on function public.save_client_event_workbook(uuid,text,jsonb,boolean) from public;
revoke all on function public.save_client_event_workbook(uuid,text,jsonb,boolean) from anon;
grant execute on function public.save_client_event_workbook(uuid,text,jsonb,boolean) to authenticated;
grant execute on function public.save_client_event_workbook(uuid,text,jsonb,boolean) to service_role;
