-- Galaxy Cue v6.0.0-alpha.9 — Event Activation + Universal Client Portal
-- Safe to run again. Replaces the alpha.8 RPCs with an atomic activation workflow.
begin;

-- A business member accepts one booking request. The database atomically:
-- 1. finds/creates the client, 2. creates the event, 3. assigns the Event Form,
-- 4. enables portal access, and 5. marks the request accepted.
create or replace function public.accept_booking_request_for_current_business(
  target_request_id uuid,
  expected_business_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  req public.booking_requests%rowtype;
  matched_client_id uuid;
  new_event_id uuid;
  new_booking_ref text;
  form_key text;
  now_text text := to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  initial_form jsonb;
  event_payload jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.is_business_member(expected_business_id) then raise exception 'You do not have access to this organization'; end if;

  select * into req
  from public.booking_requests
  where id=target_request_id and business_id=expected_business_id
  for update;

  if req.id is null then raise exception 'Booking request not found'; end if;

  if req.status='accepted' and req.converted_event_ref is not null then
    select e.id,e.client_id into new_event_id,matched_client_id
    from public.events e
    where e.business_id=req.business_id and e.booking_ref=req.converted_event_ref limit 1;
    if new_event_id is not null then
      update public.events set
        status='planning',
        event_data=jsonb_set(
          jsonb_set(
            jsonb_set(event_data,'{clientEventForm}',coalesce(event_data->'clientEventForm',jsonb_build_object('status','pending','assignedAt',now_text,'savedAt',null,'submittedAt',null)),true),
            '{workflow,currentState}','"EVENT_FORM_PENDING"'::jsonb,true
          ),
          '{workflow,owner}','"client"'::jsonb,true
        ),
        updated_at=now()
      where id=new_event_id;
      insert into public.client_portal_access(business_id,event_id,client_id,client_email,enabled)
      values(req.business_id,new_event_id,matched_client_id,lower(trim(req.client_email)),true)
      on conflict(event_id,client_email) do update set client_id=excluded.client_id,enabled=true,updated_at=now();
      return jsonb_build_object(
        'request_id',req.id,'client_id',matched_client_id,
        'event_id',new_event_id,'booking_ref',req.converted_event_ref,
        'workflow_state','EVENT_FORM_PENDING','already_accepted',true,'repaired_portal_access',true
      );
    end if;
  end if;

  select id into matched_client_id
  from public.clients
  where business_id=req.business_id
    and lower(trim(coalesce(email,'')))=lower(trim(req.client_email))
  order by created_at asc limit 1;

  if matched_client_id is null then
    insert into public.clients(business_id,name,email,phone,notes,created_by)
    values(req.business_id,req.client_name,lower(trim(req.client_email)),req.client_phone,
      'Created automatically from booking request '||req.id::text,auth.uid())
    returning id into matched_client_id;
  else
    update public.clients set
      name=coalesce(nullif(trim(req.client_name),''),name),
      phone=coalesce(nullif(trim(req.client_phone),''),phone),
      updated_at=now()
    where id=matched_client_id;
  end if;

  new_booking_ref := 'GC-'||upper(substr(replace(req.id::text,'-',''),1,10));
  form_key := case
    when lower(req.event_type) like '%corporate%' then 'corporate'
    when lower(req.event_type) like '%private%' or lower(req.event_type) like '%party%' then 'private'
    else 'wedding'
  end;

  initial_form := jsonb_build_object(
    'primaryClient',req.client_name,
    'company',case when form_key='corporate' then req.client_name else '' end,
    'email',lower(trim(req.client_email)),
    'phone',coalesce(req.client_phone,''),
    'eventDate',req.event_date,
    'eventType',req.event_type,
    'venueName',coalesce(req.venue_name,''),
    'venueAddress',coalesce(req.venue_city,''),
    'guestCount',req.guest_count,
    'requestedServices',coalesce(req.services,'[]'::jsonb),
    'additionalNotes',coalesce(req.message,'')
  );

  event_payload := jsonb_build_object(
    'active',form_key,
    'bookingId',new_booking_ref,
    'forms',jsonb_build_object(form_key,initial_form),
    'completed','[]'::jsonb,
    'updated',now_text,
    'clientEventForm',jsonb_build_object(
      'status','pending','assignedAt',now_text,'savedAt',null,'submittedAt',null
    ),
    'workflow',jsonb_build_object(
      'version',1,'currentState','EVENT_FORM_PENDING','owner','client',
      'enteredAt',now_text,'updatedAt',now_text,'contractSigned',false,'depositPaid',false,
      'history',jsonb_build_array(
        jsonb_build_object('id',gen_random_uuid(),'from',null,'to','BOOKING_REQUEST_RECEIVED','action','booking_request_received','actor','system','at',now_text),
        jsonb_build_object('id',gen_random_uuid(),'from','BOOKING_REQUEST_RECEIVED','to','EVENT_FORM_PENDING','action','send_event_form','actor','organization','at',now_text)
      )
    )
  );

  insert into public.events(
    business_id,client_id,booking_ref,title,event_type,event_date,venue_name,venue_address,status,event_data,created_by
  ) values(
    req.business_id,matched_client_id,new_booking_ref,
    req.client_name||' — '||req.event_type,req.event_type,req.event_date,
    req.venue_name,req.venue_city,'planning',event_payload,auth.uid()
  )
  on conflict(business_id,booking_ref) do update set
    client_id=excluded.client_id,event_data=excluded.event_data,status='planning',updated_at=now()
  returning id into new_event_id;

  insert into public.client_portal_access(business_id,event_id,client_id,client_email,enabled)
  values(req.business_id,new_event_id,matched_client_id,lower(trim(req.client_email)),true)
  on conflict(event_id,client_email) do update set
    client_id=excluded.client_id,enabled=true,updated_at=now();

  update public.booking_requests set
    status='accepted',converted_event_ref=new_booking_ref,
    converted_client_id=matched_client_id,updated_at=now()
  where id=req.id;

  return jsonb_build_object(
    'request_id',req.id,'client_id',matched_client_id,'event_id',new_event_id,
    'booking_ref',new_booking_ref,'client_email',lower(trim(req.client_email)),
    'workflow_state','EVENT_FORM_PENDING','already_accepted',false
  );
end;
$$;
grant execute on function public.accept_booking_request_for_current_business(uuid,uuid) to authenticated;

-- The universal portal receives only events tied to the authenticated email.
create or replace function public.get_my_client_events()
returns table(
  id uuid,business_id uuid,title text,event_type text,event_date date,
  venue_name text,status text,event_data jsonb,businesses jsonb
)
language sql
security definer
stable
set search_path=public
as $$
  select e.id,e.business_id,e.title,e.event_type,e.event_date,e.venue_name,e.status,e.event_data,
    jsonb_build_object('name',b.name) as businesses
  from public.events e
  join public.clients c on c.id=e.client_id
  join public.businesses b on b.id=e.business_id
  left join public.client_portal_access a on a.event_id=e.id
    and lower(trim(a.client_email))=lower(trim(coalesce(auth.jwt()->>'email','')))
  where auth.uid() is not null
    and lower(trim(coalesce(c.email,'')))=lower(trim(coalesce(auth.jwt()->>'email','')))
    and coalesce(a.enabled,true)=true
  order by e.event_date asc nulls last,e.created_at asc;
$$;
grant execute on function public.get_my_client_events() to authenticated;

-- Client form save/submit. A client can update only events tied to the verified email.
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
  verified_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
begin
  if auth.uid() is null or verified_email='' then raise exception 'Authentication required'; end if;

  select e.event_data into current_data
  from public.events e
  join public.clients c on c.id=e.client_id
  where e.id=target_event_id and lower(trim(coalesce(c.email,'')))=verified_email
  for update;
  if current_data is null then raise exception 'Event not found for this client email'; end if;

  active_key := coalesce(nullif(current_data->>'active',''),'wedding');
  current_data := jsonb_set(current_data,array['forms',active_key],
    coalesce(current_data#>array['forms',active_key],'{}'::jsonb)||coalesce(form_payload,'{}'::jsonb),true);
  current_data := jsonb_set(current_data,'{clientEventForm}',jsonb_build_object(
    'status',case when submit_form then 'submitted' else 'draft' end,
    'assignedAt',coalesce(current_data#>>'{clientEventForm,assignedAt}',now_text),
    'savedAt',now_text,
    'submittedAt',case when submit_form then now_text else current_data#>>'{clientEventForm,submittedAt}' end
  ),true);

  if submit_form then
    current_data := jsonb_set(current_data,'{workflow,currentState}','"QUOTE_PREPARATION"'::jsonb,true);
    current_data := jsonb_set(current_data,'{workflow,owner}','"organization"'::jsonb,true);
    current_data := jsonb_set(current_data,'{workflow,updatedAt}',to_jsonb(now_text),true);
    current_data := jsonb_set(current_data,'{workflow,enteredAt}',to_jsonb(now_text),true);
    current_data := jsonb_set(current_data,'{workflow,history}',
      coalesce(current_data#>'{workflow,history}','[]'::jsonb)||jsonb_build_array(
        jsonb_build_object('id',gen_random_uuid(),'from','EVENT_FORM_PENDING','to','QUOTE_PREPARATION','action','submit_event_form','actor','client','at',now_text)
      ),true);
  end if;

  update public.events set
    event_data=current_data,
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
