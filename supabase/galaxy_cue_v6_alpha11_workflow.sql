begin;

create or replace function public.save_client_event_workbook(target_event_id uuid, form_key text, form_payload jsonb, submit_workbook boolean default false)
returns jsonb language plpgsql security definer set search_path=public as $$
declare d jsonb; mail text:=lower(coalesce(auth.jwt()->>'email','')); now_text text:=to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
 if auth.uid() is null or mail='' then raise exception 'Authentication required'; end if;
 select e.event_data into d from public.events e join public.client_portal_access a on a.event_id=e.id and a.enabled=true where e.id=target_event_id and lower(a.client_email)=mail for update;
 if d is null then raise exception 'Event not found'; end if;
 d:=jsonb_set(d,array['active'],to_jsonb(form_key),true);
 d:=jsonb_set(d,array['forms',form_key],coalesce(form_payload,'{}'::jsonb),true);
 d:=jsonb_set(d,'{clientEventForm}',jsonb_build_object('status',case when submit_workbook then 'submitted' else 'draft' end,'savedAt',now_text,'submittedAt',case when submit_workbook then now_text else null end),true);
 if submit_workbook then
   d:=jsonb_set(d,'{documents,eventWorkbook}',jsonb_build_object('type','event_workbook','status','submitted','submittedAt',now_text,'submittedBy',mail,'payload',form_payload),true);
   d:=jsonb_set(d,'{workflow,currentState}','"QUOTE_PREPARATION"'::jsonb,true);
   d:=jsonb_set(d,'{workflow,owner}','"organization"'::jsonb,true);
 end if;
 update public.events set event_data=d,event_date=coalesce(nullif(form_payload->>'eventDate','')::date,event_date),start_time=coalesce(nullif(form_payload->>'startTime','')::time,start_time),end_time=coalesce(nullif(form_payload->>'endTime','')::time,end_time),venue_name=coalesce(nullif(form_payload->>'venueName',''),venue_name),venue_address=coalesce(nullif(form_payload->>'venueAddress',''),nullif(form_payload->>'venueCity',''),venue_address),updated_at=now() where id=target_event_id;
 return d;
end $$;
grant execute on function public.save_client_event_workbook(uuid,text,jsonb,boolean) to authenticated;

create or replace function public.create_client_event_request_from_workbook(form_key text, form_payload jsonb, submit_request boolean default true)
returns jsonb language plpgsql security definer set search_path=public as $$
declare mail text:=lower(coalesce(auth.jwt()->>'email','')); bid uuid; cname text; rid uuid; etype text; now_text text:=to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
 if auth.uid() is null or mail='' then raise exception 'Authentication required'; end if;
 select c.business_id,c.name into bid,cname from public.clients c where lower(c.email)=mail order by c.created_at asc limit 1;
 if bid is null then select a.business_id into bid from public.client_portal_access a where lower(a.client_email)=mail and a.enabled=true order by a.created_at asc limit 1; end if;
 if bid is null then raise exception 'No connected entertainment company found'; end if;
 etype:=case when form_key='corporate' then 'Corporate Event' when form_key='private' then coalesce(nullif(form_payload->>'eventType',''),'Private Event') else 'Wedding' end;
 insert into public.booking_requests(business_id,client_name,client_email,client_phone,event_type,event_date,venue_name,venue_city,guest_count,services,message,status,source,request_data)
 values(bid,coalesce(nullif(form_payload->>'primaryClient',''),nullif(form_payload->>'company',''),cname,mail),mail,form_payload->>'phone',etype,nullif(form_payload->>'eventDate','')::date,form_payload->>'venueName',coalesce(form_payload->>'venueCity',form_payload->>'venueAddress'),nullif(form_payload->>'guestCount','')::int,'[]'::jsonb,form_payload->>'additionalNotes',case when submit_request then 'new' else 'draft' end,'client_portal',jsonb_build_object('active',form_key,'forms',jsonb_build_object(form_key,form_payload),'submittedAt',case when submit_request then now_text else null end)) returning id into rid;
 return jsonb_build_object('request_id',rid,'business_id',bid,'status',case when submit_request then 'new' else 'draft' end);
end $$;
grant execute on function public.create_client_event_request_from_workbook(text,jsonb,boolean) to authenticated;

commit;