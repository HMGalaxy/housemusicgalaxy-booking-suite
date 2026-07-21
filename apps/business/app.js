import {bootstrapGalaxyCue} from '../../shared/js/core/bootstrap.js?v=7030';
import {ensureWorkflow,getWorkflowState,allowedActions,transitionWorkflow,workflowProgress,ACTION_LABELS,WORKFLOW_STATES} from '../../shared/js/core/workflow.js?v=7030';
const galaxyCueRuntime=bootstrapGalaxyCue();
import {modules,weddingForm,corporateForm,privateForm,quoteForm,contractForm,weddingPlannerForm,corporatePlannerForm,privatePlannerForm,timelineForm,uploadsView,messagesView} from '../../shared/js/modules.js?v=7030';
let supabase=null;
let getCurrentUser=async()=>null;
let restoreAuthSession=async()=>({user:null,error:null,handled:false});
let sendMagicLink=async()=>({error:new Error('Cloud connection is not ready.')});
let signOut=async()=>({error:null});
let upsertBooking=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let loadBooking=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let listBookings=async()=>({data:[],error:null});
let uploadBookingFile=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let listBookingFiles=async()=>({data:[],error:null});
let removeBookingFile=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let createSignedFileUrl=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let ensureBusinessWorkspace=async()=>({data:null,error:null});
let getCloudHealth=async()=>({ok:false,message:'Cloud connection is not ready.'});
let listCloudClients=async()=>({data:[],error:new Error('Cloud connection is not ready.')});
let saveCloudClient=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let removeCloudClient=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let saveCloudEvent=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let listCloudEvents=async()=>({data:[],error:new Error('Cloud connection is not ready.')});
let loadCloudEvent=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let removeCloudEvent=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let loadCloudBusinessSettings=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let saveCloudBusinessSettings=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let submitBookingRequest=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let listBookingRequests=async()=>({data:[],error:new Error('Cloud connection is not ready.')});
let updateBookingRequest=async()=>({data:null,error:new Error('Cloud connection is not ready.')});
let acceptBookingRequest=async()=>({data:null,error:new Error('Cloud connection is not ready.')});

let activeBusiness=null;
let cloudModuleLoaded=false;

async function loadCloudModule(){
  try{
    const api=await import('../../shared/js/supabase.js');
    supabase=api.supabase;
    getCurrentUser=api.getCurrentUser;
    restoreAuthSession=api.restoreAuthSession;
    sendMagicLink=api.sendMagicLink;
    signOut=api.signOut;
    upsertBooking=api.upsertBooking;
    loadBooking=api.loadBooking;
    listBookings=api.listBookings;
    uploadBookingFile=api.uploadBookingFile;
    listBookingFiles=api.listBookingFiles;
    removeBookingFile=api.removeBookingFile;
    createSignedFileUrl=api.createSignedFileUrl;
    ensureBusinessWorkspace=api.ensureBusinessWorkspace;
    getCloudHealth=api.getCloudHealth;
    listCloudClients=api.listCloudClients;
    saveCloudClient=api.saveCloudClient;
    removeCloudClient=api.removeCloudClient;
    saveCloudEvent=api.saveCloudEvent;
    listCloudEvents=api.listCloudEvents;
    loadCloudEvent=api.loadCloudEvent;
    removeCloudEvent=api.removeCloudEvent;
    loadCloudBusinessSettings=api.loadCloudBusinessSettings;
    saveCloudBusinessSettings=api.saveCloudBusinessSettings;
    submitBookingRequest=api.submitBookingRequest;
    listBookingRequests=api.listBookingRequests;
    updateBookingRequest=api.updateBookingRequest;
    acceptBookingRequest=api.acceptBookingRequest;
    cloudModuleLoaded=true;
    return true;
  }catch(error){
    console.error('Cloud module failed to load:',error);
    cloudModuleLoaded=false;
    return false;
  }
}
const KEY='hmg_booking_suite_v09';
const OLD_KEYS=['hmg_booking_suite_v08','hmg_booking_suite_v07','hmg_booking_suite_v06','hmg_booking_suite_v05','hmg_booking_suite_v04'];
let currentUser=null;
let cloudBusy=false;
let appView='dashboard';
const LOCAL_EVENTS_KEY='galaxy_cue_events_local_v424';

function loadLocalEvents(){
  try{
    const rows=JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY)||'[]');
    return Array.isArray(rows)?rows:[];
  }catch(error){
    console.error('Could not read local events:',error);
    return [];
  }
}

function saveLocalEvents(rows){
  localStorage.setItem(LOCAL_EVENTS_KEY,JSON.stringify(Array.isArray(rows)?rows:[]));
}

function localEventFromState(eventState,linkedClient=null){
  const forms=eventState?.forms||{};
  const consultation=forms.wedding||forms.corporate||forms.private||{};
  const quote=forms.quote||{};
  const eventType=forms.wedding?'Wedding':forms.corporate?'Corporate':forms.private?'Private Party':'Event';
  const clientName=consultation.primaryClient||consultation.company||quote.clientName||linkedClient?.name||linkedClient?.company||'';
  const clientEmail=consultation.email||quote.clientEmail||linkedClient?.email||'';

  return {
    id:eventState.bookingId,
    business_id:null,
    client_id:linkedClient?.id||null,
    booking_ref:eventState.bookingId,
    title:clientName?`${clientName} — ${eventType}`:eventType,
    event_type:eventType,
    event_date:consultation.eventDate||quote.eventDate||null,
    start_time:consultation.startTime||consultation.ceremonyTime||quote.startTime||null,
    end_time:consultation.endTime||quote.endTime||null,
    setup_start_time:consultation.setupStartTime||null,
    breakdown_end_time:consultation.breakdownEndTime||null,
    venue_name:consultation.venueName||quote.venueName||null,
    venue_address:consultation.venueAddress||quote.venueAddress||null,
    status:String(quote.quoteStatus||'draft').toLowerCase(),
    client_name:clientName,
    client_email:clientEmail,
    booking_data:JSON.parse(JSON.stringify(eventState)),
    event_data:JSON.parse(JSON.stringify(eventState)),
    updated_at:eventState.updated||new Date().toISOString(),
    local_only:true
  };
}

function upsertLocalEvent(eventState,linkedClient=null){
  if(!eventState?.bookingId)return null;
  const rows=loadLocalEvents();
  const existing=rows.find(row=>row.booking_ref===eventState.bookingId);
  const resolvedClient=linkedClient||
    (existing?.client_id?crmClients.find(client=>client.id===existing.client_id):null)||
    findMatchingClient({
      email:(eventState.forms?.wedding||eventState.forms?.corporate||eventState.forms?.private||eventState.forms?.quote||{}).email||
            eventState.forms?.quote?.clientEmail||'',
      name:(eventState.forms?.wedding||eventState.forms?.corporate||eventState.forms?.private||{}).primaryClient||
           (eventState.forms?.corporate||{}).company||
           eventState.forms?.quote?.clientName||''
    });

  const row=localEventFromState(eventState,resolvedClient);
  const next=existing
    ? rows.map(item=>item.booking_ref===eventState.bookingId?{...item,...row}:item)
    : [row,...rows];

  saveLocalEvents(next);
  cloudBookings=next;
  eventCloudStatus='Local';
  return row;
}

let cloudBookings=loadLocalEvents();
let bookingFilter='all';
let bookingSearch='';
let bookingSort='date-asc';
let selectedBookingRef=null;
let calendarCursor=new Date();
let calendarViewMode='month';
let calendarSelectedDate=new Date();
const CLIENTS_KEY='galaxy_cue_clients_v17';
let clientSearch='';
let selectedClientId=null;
let clientCloudStatus='Local';
let eventCloudStatus='Local';
const CLOUD_MIGRATION_KEY='galaxy_cue_v41_clients_events_migrated';
function loadClients(){try{return JSON.parse(localStorage.getItem(CLIENTS_KEY)||'[]')}catch(e){return[]}}
function saveClients(rows){localStorage.setItem(CLIENTS_KEY,JSON.stringify(rows))}

let crmClients=loadClients();

function activeBusinessId(){return activeBusiness?.business_id||activeBusiness?.businesses?.id||null}
function normalizeCloudClient(row){
  return {
    id:row.id,
    name:row.name||'',
    company:row.company||'',
    email:row.email||'',
    phone:row.phone||'',
    address:row.address||'',
    notes:row.notes||'',
    createdAt:row.created_at||new Date().toISOString(),
    updatedAt:row.updated_at||new Date().toISOString(),
    cloud:true
  };
}
async function refreshClientsFromCloud(){
  if(!currentUser||!activeBusinessId())return;
  clientCloudStatus='Syncing…';
  const {data,error}=await listCloudClients(activeBusinessId());
  if(error){clientCloudStatus='Sync failed';console.error(error);return}
  crmClients=(data||[]).map(normalizeCloudClient);
  saveClients(crmClients);
  clientCloudStatus='Synced';
}
async function refreshEventsFromCloud(){
  if(!currentUser||!activeBusinessId()){
    cloudBookings=loadLocalEvents();
    eventCloudStatus='Local';
    return;
  }
  eventCloudStatus='Syncing…';
  const {data,error}=await listCloudEvents(activeBusinessId());
  if(error){eventCloudStatus='Sync failed';console.error(error);return}
  cloudBookings=data||[];
  eventCloudStatus='Synced';
}
async function refreshCoreCloudData(){
  if(!currentUser||!activeBusinessId())return;
  await Promise.all([refreshClientsFromCloud(),refreshEventsFromCloud()]);
}
function findClientForState(){
  const d=activeConsultation(),q=state.forms?.quote||{};
  const email=String(d.email||q.clientEmail||'').trim().toLowerCase();
  const name=String(d.primaryClient||d.company||q.clientName||'').trim().toLowerCase();
  return crmClients.find(c=>(email&&String(c.email||'').toLowerCase()===email)||(name&&String(c.name||c.company||'').toLowerCase()===name))||null;
}
async function migrateLocalClientsAndEvent(){
  if(!currentUser||!activeBusinessId())return toast('Sign in before importing local data');
  if(localStorage.getItem(CLOUD_MIGRATION_KEY)==='1'&&!confirm('Local data was already imported once. Run the import again?'))return;
  const localClients=loadClients();
  let importedClients=0;
  for(const client of localClients){
    const {data,error}=await saveCloudClient(client,activeBusinessId());
    if(!error&&data)importedClients++;
  }
  await refreshClientsFromCloud();
  const hasEvent=state?.bookingId&&state?.forms&&Object.keys(state.forms).length>0;
  let importedEvents=0;
  if(hasEvent){
    const linked=findClientForState();
    const result=await saveCloudEvent(state,activeBusinessId(),linked?.id||null);
    if(!result.error)importedEvents=1;
  }
  await refreshEventsFromCloud();
  localStorage.setItem(CLOUD_MIGRATION_KEY,'1');
  shell();
  toast(`Imported ${importedClients} client${importedClients===1?'':'s'} and ${importedEvents} event${importedEvents===1?'':'s'} to cloud`);
}


const QUOTES_KEY='galaxy_cue_quotes_v18';
const CONTRACTS_KEY='galaxy_cue_contracts_v18';
let quoteSearch='';
let selectedQuoteId=null;
let contractSearch='';
let selectedContractId=null;
function loadLocalRows(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return[]}}
function saveLocalRows(key,rows){localStorage.setItem(key,JSON.stringify(rows))}
let crmQuotes=loadLocalRows(QUOTES_KEY);
let crmContracts=loadLocalRows(CONTRACTS_KEY);

const INVOICES_KEY='galaxy_cue_invoices_v19';
const PAYMENTS_KEY='galaxy_cue_payments_v19';
let invoiceSearch='';
let selectedInvoiceId=null;
let paymentSearch='';
let selectedPaymentId=null;
let crmInvoices=loadLocalRows(INVOICES_KEY);
let crmPayments=loadLocalRows(PAYMENTS_KEY);

async function hydrateCloudPreferences(){
  if(!currentUser||!activeBusinessId())return;
  const {data,error}=await loadCloudBusinessSettings(activeBusinessId());
  if(error){console.warn('Could not load cloud preferences:',error);return;}
  if(data?.settings){
    const {appearance,...settings}=data.settings;
    businessSettings={...businessSettings,...settings};
    saveBusinessSettings(businessSettings);
  }
}

const BUSINESS_SETTINGS_KEY='galaxy_cue_business_settings_v20';
const CLIENT_PORTAL_KEY='galaxy_cue_client_portals_v20';
function loadBusinessSettings(){
  try{return JSON.parse(localStorage.getItem(BUSINESS_SETTINGS_KEY)||'null')||{
    businessName:'House Music Galaxy',
    contactEmail:'',
    contactPhone:'',
    website:'',
    venmoHandle:'',
    cardPaymentUrl:'',
    paymentInstructions:''
  }}catch(e){return{businessName:'House Music Galaxy',contactEmail:'',contactPhone:'',website:'',venmoHandle:'',cardPaymentUrl:'',paymentInstructions:''}}
}
function saveBusinessSettings(settings){localStorage.setItem(BUSINESS_SETTINGS_KEY,JSON.stringify(settings))}
let businessSettings=loadBusinessSettings();
function loadClientPortals(){try{return JSON.parse(localStorage.getItem(CLIENT_PORTAL_KEY)||'{}')}catch(e){return{}}}
function saveClientPortals(rows){localStorage.setItem(CLIENT_PORTAL_KEY,JSON.stringify(rows))}
let clientPortals=loadClientPortals();
let portalPreviewMode=false;
function loadInitialState(){
  const fallback={active:'wedding',bookingId:makeId(),forms:{},completed:[],updated:new Date().toISOString()};
  const raw=localStorage.getItem(KEY)||OLD_KEYS.map(k=>localStorage.getItem(k)).find(Boolean)||null;
  if(!raw)return fallback;
  try{
    const parsed=JSON.parse(raw);
    return parsed&&typeof parsed==='object'?parsed:fallback;
  }catch(error){
    console.warn('Stored Galaxy Cue state was invalid and has been reset.',error);
    try{localStorage.removeItem(KEY)}catch(_error){}
    return fallback;
  }
}
let state=loadInitialState();
ensureWorkflow(state);
function makeId(){return `HMG-${new Date().getFullYear()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`}
let autoCloudSyncTimer=null;
let autoCloudSyncRunning=false;
let autoCloudSyncPending=false;
let lastAutoCloudSignature='';

function queueAutoCloudSync({immediate=false,notify=false}={}){
  if(!currentUser||!activeBusinessId())return;
  clearTimeout(autoCloudSyncTimer);
  autoCloudSyncTimer=setTimeout(()=>runAutoCloudSync({notify}),immediate?0:900);
}

async function runAutoCloudSync({notify=false}={}){
  if(!currentUser||!activeBusinessId())return;
  const signature=JSON.stringify(state);
  if(signature===lastAutoCloudSignature)return;
  if(autoCloudSyncRunning){autoCloudSyncPending=true;return;}

  autoCloudSyncRunning=true;
  eventCloudStatus='Saving…';
  const linked=findClientForState();
  const snapshot=JSON.parse(signature);
  const {data,error}=await saveCloudEvent(snapshot,activeBusinessId(),linked?.id||null);

  if(error){
    eventCloudStatus='Sync failed';
    console.error('Automatic cloud sync failed:',error);
    if(notify)toast(`Cloud sync failed: ${error.message}`);
  }else{
    lastAutoCloudSignature=signature;
    eventCloudStatus='Synced';
    if(data){
      const normalized={...data,booking_data:data.event_data||snapshot,client_name:linked?.name||linked?.company||'',client_email:linked?.email||''};
      const found=cloudBookings.some(row=>row.booking_ref===normalized.booking_ref);
      cloudBookings=found?cloudBookings.map(row=>row.booking_ref===normalized.booking_ref?{...row,...normalized}:row):[normalized,...cloudBookings];
    }
    if(notify)toast('Saved and synced to Galaxy Cue Cloud');
  }

  autoCloudSyncRunning=false;
  if(autoCloudSyncPending){
    autoCloudSyncPending=false;
    queueAutoCloudSync({immediate:true,notify:false});
  }
}

function save(show=true){
  state.updated=new Date().toISOString();
  localStorage.setItem(KEY,JSON.stringify(state));

  if(currentUser&&activeBusinessId()){
    queueAutoCloudSync({immediate:show,notify:show});
  }else{
    upsertLocalEvent(state);
    if(show)toast('Event progress saved locally');
  }
}

function normalizeCheckboxState(form,values){
  if(!form||!values)return values||{};
  const normalized={...values};

  form.querySelectorAll('input[type="checkbox"][name]').forEach(checkbox=>{
    const name=checkbox.name;
    const group=form.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(name)}"]`);
    const saved=normalized[name];

    if(group.length>1&&!Array.isArray(saved)){
      if(saved===undefined||saved===null||saved===false||saved===''){
        normalized[name]=[];
      }else{
        normalized[name]=[String(saved)];
      }
    }
  });

  return normalized;
}

function applySavedFormValues(form,values={}){
  const normalized=normalizeCheckboxState(form,values);

  form.querySelectorAll('[name]').forEach(field=>{
    const saved=normalized[field.name];

    if(field.type==='checkbox'){
      field.checked=Array.isArray(saved)
        ? saved.map(String).includes(String(field.value))
        : saved===true||String(saved)===String(field.value);
      return;
    }

    if(field.type==='radio'){
      field.checked=String(saved)===String(field.value);
      return;
    }

    if(saved!==undefined&&saved!==null){
      field.value=saved;
    }
  });
}

function dataFrom(form){
  const output={};
  const formData=new FormData(form);

  for(const [key,value] of formData.entries()){
    const field=form.elements.namedItem(key);
    const isCheckboxGroup=
      (typeof RadioNodeList!=='undefined'&&field instanceof RadioNodeList)||
      (field&&typeof field.length==='number'&&field.length>1&&Array.from(field).every(item=>item.type==='checkbox'));

    if(isCheckboxGroup){
      if(!Array.isArray(output[key]))output[key]=[];
      output[key].push(value);
    }else{
      output[key]=value;
    }
  }

  form.querySelectorAll('input[type="checkbox"][name]').forEach(checkbox=>{
    const name=checkbox.name;
    const group=form.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(name)}"]`);

    if(group.length===1){
      output[name]=checkbox.checked;
    }else if(!(name in output)){
      output[name]=[];
    }
  });

  return output;
}

function fill(form,data={}){Object.entries(data).forEach(([k,v])=>{const els=form.querySelectorAll(`[name="${CSS.escape(k)}"]`);els.forEach(el=>{if(el.type==='checkbox')el.checked=Array.isArray(v)?v.includes(el.value):!!v;else el.value=v??''})})}
function pct(form){if(!form)return 0;const req=[...form.querySelectorAll('[required]')],ok=req.filter(x=>x.type==='checkbox'?x.checked:x.value.trim()).length;return req.length?Math.round(ok/req.length*100):0}
function activeConsultation(){for(const id of ['wedding','corporate','private'])if(state.forms[id]&&Object.keys(state.forms[id]).length)return state.forms[id];return {}}
function money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n)||0)}
function quoteTotals(q=state.forms.quote||{}){const subtotal=[1,2,3,4,5].reduce((s,i)=>s+(Number(q[`item${i}Amount`])||0),0);const discount=Math.min(Number(q.discount)||0,subtotal);const taxable=Math.max(0,subtotal-discount);const tax=taxable*((Number(q.taxRate)||0)/100);const total=taxable+tax;const deposit=total*((Number(q.depositRate)||0)/100);return{subtotal,discount,tax,total,deposit,balance:Math.max(0,total-deposit)}}

function effectiveNavigationView(){
  if(appView!=='workspace')return appView;
  if(state.active==='wedding-planner'||state.active==='corporate-planner'||state.active==='private-planner')return'music';
  if(state.active==='uploads')return'files';
  if(state.active==='messages')return'messages';
  return'workspace';
}

function navigateToView(view){
  if(!view)return;
  setMobileMenu(false);

  if(view==='music'){
    state.active=plannerForBooking()||'wedding-planner';
    appView='workspace';
  }else if(view==='files'){
    state.active='uploads';
    appView='workspace';
  }else if(view==='messages'){
    state.active='messages';
    appView='workspace';
  }else{
    appView=view;
  }

  shell();
  requestAnimationFrame(()=>{
    const main=document.querySelector('#main');
    if(main){
      main.setAttribute('tabindex','-1');
      main.focus({preventScroll:true});
    }
    window.scrollTo({top:0,behavior:'auto'});
  });
}

function navigateToModule(moduleId){
  if(!moduleId)return;
  setMobileMenu(false);
  state.active=moduleId;
  appView='workspace';
  shell();
  requestAnimationFrame(()=>{
    const main=document.querySelector('#main');
    if(main){
      main.setAttribute('tabindex','-1');
      main.focus({preventScroll:true});
    }
    window.scrollTo({top:0,behavior:'auto'});
  });
}


const BOOKING_REQUESTS_KEY='galaxy_cue_booking_requests_v600a1';
let bookingRequests=[];
function loadLocalBookingRequests(){try{return JSON.parse(localStorage.getItem(BOOKING_REQUESTS_KEY)||'[]')}catch(e){return[]}}
function saveLocalBookingRequests(rows){localStorage.setItem(BOOKING_REQUESTS_KEY,JSON.stringify(rows||[]))}
function publicBookingBusinessId(){const u=new URL(location.href);return u.searchParams.get('book')||u.searchParams.get('booking-request')||''}
function isPublicBookingRequestRoute(){const u=new URL(location.href);return u.searchParams.has('book')||u.searchParams.has('booking-request')||location.hash==='#booking-request'}
function bookingRequestShareUrl(){const u=new URL(location.href);u.hash='';u.search='';u.searchParams.set('book',activeBusinessId()||'demo');return u.toString()}
function requestStatusLabel(status='new'){return ({new:'New Request',needs_info:'Waiting for Client',accepted:'Converted',declined:'Declined'})[status]||status}
async function refreshBookingRequests(){
  if(currentUser&&activeBusinessId()){
    const {data,error}=await listBookingRequests(activeBusinessId());
    if(!error){bookingRequests=data||[];return}
    console.warn('Cloud booking requests unavailable; using local requests.',error)
  }
  bookingRequests=loadLocalBookingRequests();
}
function publicBookingRequestScreen(){
  const root=document.querySelector('#app');
  root.innerHTML=`<main class="public-booking-shell"><section class="public-booking-card"><div class="public-booking-brand"><img src="assets/galaxy-cue-logo.png" alt="Galaxy Cue"><div><small>Booking Request</small><h1>Tell us about your event</h1><p>Four short steps. No account is required.</p></div></div><div class="booking-progress" aria-label="Booking request progress">${['Contact','Event','Services','Details'].map((label,index)=>`<div class="booking-progress-step ${index===0?'active':''}" data-booking-progress="${index}"><span>${index+1}</span><small>${label}</small></div>`).join('')}</div><form id="publicBookingRequestForm" class="public-booking-form"><section class="booking-step active" data-booking-step="0"><div class="step-heading"><small>Step 1 of 4</small><h2>Contact information</h2></div><div class="public-form-grid"><label><span>Your name *</span><input name="client_name" required autocomplete="name"></label><label><span>Email *</span><input name="client_email" type="email" required autocomplete="email"></label><label><span>Phone</span><input name="client_phone" autocomplete="tel"></label></div></section><section class="booking-step" data-booking-step="1"><div class="step-heading"><small>Step 2 of 4</small><h2>Event basics</h2></div><div class="public-form-grid"><label><span>Event date *</span><input name="event_date" type="date" required></label><label><span>Event type *</span><select name="event_type" required><option value="">Select one</option><option>Wedding</option><option>Corporate</option><option>Private Party</option><option>Other</option></select></label><label><span>Estimated guests</span><input name="guest_count" type="number" min="1" inputmode="numeric"></label><label><span>Venue</span><input name="venue_name"></label><label><span>City</span><input name="venue_city"></label></div></section><section class="booking-step" data-booking-step="2"><div class="step-heading"><small>Step 3 of 4</small><h2>Services requested</h2></div><fieldset><legend>Select everything you may need</legend><div class="service-pills">${['DJ','MC','Ceremony','Lighting','Photo Booth','Other'].map(x=>`<label><input type="checkbox" name="services" value="${x}"><span>${x}</span></label>`).join('')}</div></fieldset></section><section class="booking-step" data-booking-step="3"><div class="step-heading"><small>Step 4 of 4</small><h2>Additional details</h2></div><label><span>Tell us more</span><textarea name="message" rows="6" placeholder="Event style, timing, special requests or anything else we should know"></textarea></label><div class="booking-review-note">By submitting, you are sending a booking inquiry. Your date is not reserved until the organization confirms it.</div></section><div class="booking-step-actions"><button class="btn" type="button" data-booking-back hidden>Back</button><span></span><button class="btn primary" type="button" data-booking-next>Continue</button><button class="btn primary" type="submit" data-booking-submit hidden>Submit Booking Request</button></div><div id="publicBookingStatus" class="auth-status" role="status"></div></form></section></main>`;
  const form=document.querySelector('#publicBookingRequestForm');
  const steps=[...form.querySelectorAll('[data-booking-step]')];
  const progress=[...document.querySelectorAll('[data-booking-progress]')];
  const back=form.querySelector('[data-booking-back]');
  const next=form.querySelector('[data-booking-next]');
  const submit=form.querySelector('[data-booking-submit]');
  let step=0;
  function showStep(index){step=Math.max(0,Math.min(steps.length-1,index));steps.forEach((el,i)=>el.classList.toggle('active',i===step));progress.forEach((el,i)=>{el.classList.toggle('active',i===step);el.classList.toggle('complete',i<step)});back.hidden=step===0;next.hidden=step===steps.length-1;submit.hidden=step!==steps.length-1;steps[step].querySelector('input,select,textarea')?.focus({preventScroll:true});}
  function stepValid(){const required=[...steps[step].querySelectorAll('[required]')];for(const input of required){if(!input.checkValidity()){input.reportValidity();return false}}return true}
  next.addEventListener('click',()=>{if(stepValid())showStep(step+1)});back.addEventListener('click',()=>showStep(step-1));
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(!form.reportValidity())return;
    const fd=new FormData(form),status=document.querySelector('#publicBookingStatus');
    const businessId=publicBookingBusinessId();
    const payload={id:crypto.randomUUID(),business_id:businessId==='demo'?null:businessId,client_name:String(fd.get('client_name')||'').trim(),client_email:String(fd.get('client_email')||'').trim().toLowerCase(),client_phone:String(fd.get('client_phone')||'').trim(),event_date:fd.get('event_date'),event_type:fd.get('event_type'),guest_count:Number(fd.get('guest_count'))||null,venue_name:String(fd.get('venue_name')||'').trim(),venue_city:String(fd.get('venue_city')||'').trim(),services:fd.getAll('services'),message:String(fd.get('message')||'').trim(),status:'new',created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    status.textContent='Submitting…';submit.disabled=true;back.disabled=true;
    if(!payload.business_id){
      const rows=loadLocalBookingRequests();rows.unshift(payload);saveLocalBookingRequests(rows);
    }else{
      const result=await submitBookingRequest(payload);
      if(result.error){console.error(result.error);status.textContent='We could not send your request. Please try again or contact the organization directly.';submit.disabled=false;back.disabled=false;return}
    }
    form.innerHTML=`<div class="public-success"><div>✓</div><h2>Request submitted</h2><p>Thank you, ${escapeHtml(payload.client_name)}. Your request has been sent and is awaiting review.</p><small>Reference ${escapeHtml(payload.id.slice(0,8).toUpperCase())}</small></div>`;
  });
}
function bookingRequestCard(r){return `<article class="lead-request-card"><div class="lead-request-head"><div><small>${escapeHtml(formatEventDate(r.event_date))}</small><h3>${escapeHtml(r.client_name||'Unnamed request')}</h3><p>${escapeHtml(r.event_type||'Event')} · ${escapeHtml(r.venue_name||r.venue_city||'Venue not set')}</p></div><span class="status-chip ${statusTone(r.status)}">${escapeHtml(requestStatusLabel(r.status))}</span></div><div class="lead-request-meta"><span>${escapeHtml(r.client_email||'No email')}</span><span>${r.guest_count?`${r.guest_count} guests`:'Guest count not set'}</span><span>${escapeHtml((r.services||[]).join(', ')||'Services not selected')}</span></div>${r.decision_note?`<p class="lead-decision-note"><strong>Latest note:</strong> ${escapeHtml(r.decision_note)}</p>`:''}<div class="lead-actions"><button class="btn" data-lead-action="review" data-lead-id="${r.id}">Review Request</button>${r.status==='new'?`<button class="btn primary" data-lead-action="accept" data-lead-id="${r.id}">Accept & Create Event</button>`:''}</div></article>`}
async function setLeadStatus(id,status,extra={}){const r=bookingRequests.find(x=>x.id===id);if(!r)return;Object.assign(r,{status,updated_at:new Date().toISOString(),...extra});if(currentUser&&activeBusinessId()){const result=await updateBookingRequest(id,activeBusinessId(),{status,...extra});if(result.error){console.error(result.error);toast('Cloud update failed');return false}}else saveLocalBookingRequests(bookingRequests);return true}
async function convertLeadToEvent(id){
  const request=bookingRequests.find(row=>row.id===id);
  if(!request||request.status==='accepted')return;
  if(!currentUser||!activeBusinessId()){
    toast('Sign in to accept a booking request.');
    return;
  }
  const buttons=[...document.querySelectorAll(`[data-lead-id="${CSS.escape(id)}"], [data-modal-lead-action="accept"]`)];
  buttons.forEach(button=>{
    button.disabled=true;
    button.dataset.originalText=button.textContent;
    button.textContent='Creating event…';
  });
  try{
    const {data,error}=await acceptBookingRequest(id,activeBusinessId());
    if(error)throw error;
    const result=Array.isArray(data)?data[0]:data;
    request.status='accepted';
    request.converted_event_ref=result?.booking_ref||request.converted_event_ref;
    request.converted_client_id=result?.client_id||request.converted_client_id;
    request.updated_at=new Date().toISOString();
    await Promise.all([refreshBookingRequests(),refreshClientsFromCloud(),refreshEventsFromCloud()]);
    appView='dashboard';
    shell();
    toast(`Event activated for ${request.client_name}. The Full Event Workbook is now available in the Client Portal.`);
  }catch(error){
    console.error('Booking request activation failed:',error);
    toast(error?.message||'The booking request could not be activated.');
    buttons.forEach(button=>{
      button.disabled=false;
      button.textContent=button.dataset.originalText||'Accept & Create Event';
    });
  }
}
function closeLeadReview(){document.querySelector('#leadReviewModal')?.remove()}
function openLeadReview(id){const r=bookingRequests.find(x=>x.id===id);if(!r)return;closeLeadReview();const modal=document.createElement('div');modal.id='leadReviewModal';modal.className='modal';modal.innerHTML=`<div class="modal-panel lead-review-panel"><button class="modal-close" data-close-lead aria-label="Close">×</button><div class="eyebrow">Booking Request</div><h2>${escapeHtml(r.client_name||'Unnamed request')}</h2><div class="lead-review-grid"><div><small>Contact</small><strong>${escapeHtml(r.client_email||'—')}</strong><span>${escapeHtml(r.client_phone||'No phone')}</span></div><div><small>Event</small><strong>${escapeHtml(r.event_type||'—')}</strong><span>${escapeHtml(formatEventDate(r.event_date))}</span></div><div><small>Venue</small><strong>${escapeHtml(r.venue_name||'Not provided')}</strong><span>${escapeHtml(r.venue_city||'')}</span></div><div><small>Guests</small><strong>${escapeHtml(String(r.guest_count||'Not provided'))}</strong><span>${escapeHtml((r.services||[]).join(', ')||'No services selected')}</span></div></div><section class="lead-review-message"><small>Client message</small><p>${escapeHtml(r.message||'No additional message.')}</p></section>${r.decision_note?`<section class="lead-review-message"><small>Organization note</small><p>${escapeHtml(r.decision_note)}</p></section>`:''}<div class="lead-actions modal-lead-actions">${r.status!=='accepted'&&r.status!=='declined'?`<button class="btn primary" data-modal-lead-action="accept">Accept & Create Event</button><button class="btn" data-modal-lead-action="info">Need More Info</button><button class="btn danger" data-modal-lead-action="decline">Decline</button>`:`<span class="status-chip ${statusTone(r.status)}">${escapeHtml(requestStatusLabel(r.status))}</span>`}</div></div>`;document.body.appendChild(modal);modal.querySelector('[data-close-lead]').addEventListener('click',closeLeadReview);modal.addEventListener('click',e=>{if(e.target===modal)closeLeadReview()});modal.querySelectorAll('[data-modal-lead-action]').forEach(button=>button.addEventListener('click',async()=>{const action=button.dataset.modalLeadAction;if(action==='accept'){closeLeadReview();return convertLeadToEvent(id)}if(action==='decline'){const reason=prompt('Optional decline reason:')||'';if(await setLeadStatus(id,'declined',{decision_note:reason})){closeLeadReview();shell()}}if(action==='info'){const note=prompt('What additional information is needed?')||'';if(!note)return;if(await setLeadStatus(id,'needs_info',{decision_note:note})){closeLeadReview();shell()}}}));}
function bindLeadActions(){document.querySelectorAll('[data-lead-action]').forEach(b=>b.addEventListener('click',async()=>{const {leadAction,leadId}=b.dataset;if(leadAction==='review')return openLeadReview(leadId);if(leadAction==='accept')return convertLeadToEvent(leadId)}));document.querySelector('[data-copy-booking-link]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(bookingRequestShareUrl());toast('Booking request link copied')}catch{prompt('Copy this booking link:',bookingRequestShareUrl())}})}

function shell(){document.querySelector('#app').innerHTML=`<div class="crm-shell">
<header class="topbar crm-topbar">
  <button class="mobile-menu-toggle" type="button" data-action="toggle-mobile-menu" aria-label="Open navigation" aria-expanded="false"><span></span><span></span><span></span></button>
  <div class="brand galaxy-cue-brand">
    <img class="galaxy-cue-logo" src="assets/galaxy-cue-logo.png" alt="Galaxy Cue">
    <span class="brand-divider" aria-hidden="true"></span>
    <div class="brand-tagline">Operating system for DJs<br>and entertainment companies</div>
  </div>
  <div class="topbar-tools">
    <button class="command-trigger" data-action="command">⌘K <span>Quick actions</span></button>
    <div class="cloud-status ${currentUser?'online':'offline'}"><span></span>${currentUser?escapeHtml(currentUser.email||'Signed in'):'Local mode'}</div>
    <button class="btn compact" data-action="client-login">Client Login</button>
    <button class="btn compact account-button" data-action="${currentUser?'logout':'login'}">${currentUser?'Sign Out':'Business Login'}</button>
    <button class="status-pill version-indicator" type="button" data-action="force-refresh" title="Build ${escapeHtml(galaxyCueRuntime.build)} · Click to clear cache and reload">GALAXY CUE · v${escapeHtml(galaxyCueRuntime.version)}</button>
  </div>
</header>
<div class="mobile-nav-backdrop" data-action="close-mobile-menu"></div>
<div class="crm-layout">
  <aside class="crm-sidebar" id="crmSidebar" aria-label="Main navigation">
    <div class="mobile-sidebar-head">
      <div><small>Galaxy Cue</small><strong>Navigation</strong></div>
      <button class="mobile-menu-close" type="button" data-action="close-mobile-menu" aria-label="Close navigation">×</button>
    </div>
    <div class="workspace-label">Business</div>
    ${[
      ['dashboard','⌂','Dashboard'],
      ['bookings','▣','Events'],
      ['quotes','▥','Quotes'],
      ['contracts','▤','Contracts'],
      ['invoices','▦','Invoices'],
      ['payments','$','Payments'],
      ['clients','♙','Clients'],
      ['calendar','□','Calendar'],
      ['music','♫','Music Planner'],
      ['files','▱','Files'],
      ['messages','○','Messages'],
      ['client-portal','◇','Client Portal'],
      ['analytics','⌁','Analytics'],
      ['settings','⚙','Settings']
    ].map(([id,icon,label])=>`<button class="crm-nav ${effectiveNavigationView()===id?'active':''}" data-view="${id}" ${effectiveNavigationView()===id?'aria-current="page"':''}><span>${icon}</span>${label}</button>`).join('')}
    <div class="sidebar-footer"><small>Current event</small><strong>${state.bookingId}</strong></div>
  </aside>
  <main class="crm-main" id="main"></main>
</div>
</div>
<div id="authModal" class="auth-modal hidden"><div class="auth-card gc-login-card"><button class="auth-close" data-action="close-auth">×</button><div class="login-brand-lockup"><img src="assets/galaxy-cue-mark-transparent.png" class="login-mark" alt="Galaxy Cue"><strong>GALAXY <span>CUE</span></strong></div><div class="login-gold-rule"><i></i></div><h2>Welcome back</h2><p>Enter your email and we’ll send you a secure sign-in link.</p><input id="authEmail" type="email" placeholder="you@example.com"><button type="button" class="btn primary full" data-action="send-link">Continue with Email</button><div id="authStatus" class="auth-status" role="status" aria-live="polite"></div><small>No password required.</small><div class="login-security">◇&nbsp; Secure. Private. Always.</div></div></div>
<div id="commandModal" class="auth-modal hidden"><div class="command-card"><div class="command-head"><input id="commandInput" placeholder="Search actions or events…"><button class="auth-close" data-action="close-command">×</button></div><div id="commandResults"></div></div></div>
<div id="eventModal" class="auth-modal hidden"><form class="auth-card event-create-card" id="eventCreateForm"><input type="hidden" name="bookingRef"><button type="button" class="auth-close" data-action="close-event-modal">×</button><div class="eyebrow" id="eventModalEyebrow" data-event-eyebrow>New Event</div><h2 id="eventModalTitle" data-event-title>Create an event</h2><p id="eventModalIntro" data-event-intro>Start with the essential details. You can complete the full consultation afterward.</p>
<div class="event-create-grid">
<label><span>Client name *</span><input name="clientName" required placeholder="Client or company"></label>
<label><span>Client email</span><input name="clientEmail" type="email" placeholder="client@example.com"></label>
<label><span>Event type *</span><select name="eventType" required><option value="Wedding">Wedding</option><option value="Corporate">Corporate</option><option value="Private Party">Private Party</option><option value="Other">Other</option></select></label>
<label><span>Event date *</span><input name="eventDate" type="date" required></label>
<label><span>Setup start *</span><input name="setupStartTime" type="time" step="900" required></label>
<label><span>Event start *</span><input name="startTime" type="time" step="900" required></label>
<label><span>Event end *</span><input name="endTime" type="time" step="900" required></label>
<label><span>Breakdown end *</span><input name="breakdownEndTime" type="time" step="900" required></label>
<label class="span-2"><span>Venue</span><input name="venueName" placeholder="Venue name or location"></label>
</div><button class="btn primary full" id="eventModalSubmit" type="submit">Create Event Workspace</button></form></div>`;
renderAppView();bindNav();bindGlobalActions();installResponsiveNavigationGuards();setMobileMenu(false);}

function renderAppView(){
  if(appView==='dashboard')renderDashboard();
  else if(appView==='bookings')renderBookingManager();
  else if(appView==='calendar')renderCalendarView();
  else if(appView==='quotes')renderQuotes();
  else if(appView==='contracts')renderContracts();
  else if(appView==='invoices')renderInvoices();
  else if(appView==='payments')renderPayments();
  else if(appView==='clients')renderClients();
  else if(appView==='client-portal')renderClientPortal();
  else if(appView==='analytics')renderSectionView('Analytics','Understand bookings, revenue and business performance.','⌁');
  else if(appView==='settings')renderSettings();
  else if(appView==='music'||appView==='files'||appView==='messages'){
    console.warn('Legacy route reached; normalizing navigation route.');
    navigateToView(appView);
  }
  else renderMain();
}
async function refreshCloudBookings(){
  if(!currentUser){
    cloudBookings=loadLocalEvents();
    eventCloudStatus='Local';
    return;
  }

  const businessId=activeBusinessId();
  if(!businessId){
    cloudBookings=[];
    eventCloudStatus='Sync failed';
    console.error('No active business workspace while loading events.');
    return;
  }

  eventCloudStatus='Syncing…';
  const {data,error}=await listCloudEvents(businessId);

  if(error){
    eventCloudStatus='Sync failed';
    console.error('Business event load failed:',error);
    toast(`Could not load business events: ${error.message}`);
    return;
  }

  cloudBookings=data||[];
  eventCloudStatus='Synced';
}

function normalizedEmail(value=''){return String(value||'').trim().toLowerCase()}
function normalizedName(value=''){
  return String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
}
function findMatchingClient({email='',name='',company=''}={}){
  const emailKey=normalizedEmail(email);
  const nameKeys=[normalizedName(name),normalizedName(company)].filter(Boolean);
  return crmClients.find(client=>{
    if(emailKey&&normalizedEmail(client.email)===emailKey)return true;
    const clientKeys=[normalizedName(client.name),normalizedName(client.company)].filter(Boolean);
    return nameKeys.some(key=>clientKeys.includes(key));
  })||null;
}
function eventsForClient(client){
  const email=normalizedEmail(client.email);
  const names=[normalizedName(client.name),normalizedName(client.company)].filter(Boolean);
  return cloudBookings.filter(event=>{
    if(client.id&&event.client_id===client.id)return true;
    if(email&&normalizedEmail(event.client_email)===email)return true;
    return names.includes(normalizedName(event.client_name));
  });
}
function eventDateValue(event){
  if(!event?.event_date)return null;
  const date=new Date(`${event.event_date}T12:00:00`);
  return Number.isNaN(date.getTime())?null:date;
}
function isSameCalendarDay(dateA,dateB){
  return dateA&&dateB&&
    dateA.getFullYear()===dateB.getFullYear()&&
    dateA.getMonth()===dateB.getMonth()&&
    dateA.getDate()===dateB.getDate();
}
function clientTimelineStats(client){
  const now=new Date();
  const events=eventsForClient(client).sort((a,b)=>String(a.event_date||'9999').localeCompare(String(b.event_date||'9999')));
  const past=events.filter(event=>eventDateValue(event)&&eventDateValue(event)<now);
  const upcoming=events.filter(event=>eventDateValue(event)&&eventDateValue(event)>=new Date(now.getFullYear(),now.getMonth(),now.getDate()));
  return {
    events,
    last:past[past.length-1]||null,
    next:upcoming[0]||null
  };
}

function greeting(){
  const h=new Date().getHours();
  return h<12?'Good morning':h<18?'Good afternoon':'Good evening';
}
function eventTypeLabel(v=''){return v||'Event'}
function statusTone(s=''){
  const x=s.toLowerCase();
  if(x.includes('accept')||x.includes('paid')||x.includes('confirm'))return'green';
  if(x.includes('declin')||x.includes('cancel'))return'red';
  return'gold';
}
function dashboardStats(){
  const now=new Date(),month=now.getMonth(),year=now.getFullYear();
  const upcoming=cloudBookings.filter(b=>b.event_date&&new Date(b.event_date+'T23:59:59')>=now);
  const thisMonth=cloudBookings.filter(b=>{if(!b.event_date)return false;const d=new Date(b.event_date+'T12:00:00');return d.getMonth()===month&&d.getFullYear()===year});
  const pending=cloudBookings.filter(b=>!String(b.status||'').toLowerCase().match(/accepted|confirmed|paid|complete/));
  return {upcoming,thisMonth,pending};
}
async function renderDashboard(){
  const main=document.querySelector('#main');
  main.innerHTML=`<div class="dashboard-loading">Loading your command center…</div>`;

  if(currentUser&&activeBusinessId()){
    await refreshCoreCloudData();
  }
  await refreshBookingRequests();

  const now=new Date();
  const today=cloudBookings.filter(event=>isSameCalendarDay(eventDateValue(event),now));
  const upcoming=cloudBookings
    .filter(event=>eventDateValue(event)&&eventDateValue(event)>=new Date(now.getFullYear(),now.getMonth(),now.getDate()))
    .sort((a,b)=>String(a.event_date).localeCompare(String(b.event_date)));
  const recentClients=[...crmClients]
    .sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')))
    .slice(0,5);
  const pending=cloudBookings.filter(event=>!String(event.status||'').toLowerCase().match(/accepted|confirmed|paid|complete|cancel/));
  const next=upcoming[0]||null;

  main.innerHTML=`<section class="dash-hero">
    <div><div class="eyebrow">Galaxy Cue CRM</div><h1>${greeting()}.</h1><p>${currentUser?`${upcoming.length} upcoming event${upcoming.length===1?'':'s'} and ${crmClients.length} client${crmClients.length===1?'':'s'} are connected to this workspace.`:'Sign in to load your business workspace.'}</p></div>
    <div class="hero-actions"><button class="btn primary" data-action="new-booking">＋ New Event</button><button class="btn" data-action="new-dashboard-client">＋ New Client</button></div>
  </section>

  <section class="lead-intake-panel"><div class="section-title"><div><small>Lead Intake</small><h2>New Booking Requests</h2></div><button class="btn compact" data-copy-booking-link>Copy Public Booking Link</button></div><div class="lead-request-list">${bookingRequests.filter(r=>r.status==='new'||r.status==='needs_info').length?bookingRequests.filter(r=>r.status==='new'||r.status==='needs_info').map(bookingRequestCard).join(''):`<div class="empty-state">No pending booking requests. Share your public booking link to receive one.</div>`}</div></section>

  <section class="kpi-grid">
    ${kpi('Today',today.length,today.length?'Events scheduled':'No events today','calendar')}
    ${kpi('Upcoming Events',upcoming.length,'Cloud event records','month')}
    ${kpi('Clients',crmClients.length,'Connected profiles','cloud')}
    ${kpi('Need Attention',pending.length,'Draft or pending','quote')}
  </section>

  <section class="dashboard-grid crm-dashboard-v42">
    <div class="lux-card wide">
      <div class="section-title"><div><small>Schedule</small><h2>${today.length?'Today’s Events':'Upcoming Events'}</h2></div><button class="text-button" data-view="bookings">View all →</button></div>
      <div class="event-list">${(today.length?today:upcoming).length?(today.length?today:upcoming).slice(0,6).map(bookingRow).join(''):`<div class="empty-state">No scheduled events yet.</div>`}</div>
    </div>

    <div class="lux-card next-event">
      <small>Next Event</small>
      ${next?`<div class="next-date">${formatEventDate(next.event_date)}</div><h2>${escapeHtml(next.client_name||'Unnamed Client')}</h2><p>${escapeHtml(eventTypeLabel(next.event_type))}</p><div class="next-meta"><span>${escapeHtml(next.venue_name||'Venue not set')}</span><span class="status-chip ${statusTone(next.status)}">${escapeHtml(next.status||'Draft')}</span></div><button class="btn primary full" data-open-booking="${next.booking_ref}">Open Event</button>`:`<div class="empty-state">Your next event will appear here.</div>`}
    </div>

    <div class="lux-card">
      <div class="section-title"><div><small>Relationships</small><h2>Recent Clients</h2></div><button class="text-button" data-view="clients">View all →</button></div>
      <div class="recent-client-list">${recentClients.length?recentClients.map(client=>{
        const stats=clientTimelineStats(client);
        return `<button data-dashboard-client="${client.id}"><span class="client-initial">${escapeHtml((client.name||client.company||'?').trim().charAt(0).toUpperCase())}</span><span><strong>${escapeHtml(client.name||client.company||'Unnamed Client')}</strong><small>${stats.events.length} event${stats.events.length===1?'':'s'}${stats.next?` · Next ${formatEventDate(stats.next.event_date)}`:''}</small></span><span>→</span></button>`;
      }).join(''):'<div class="empty-state compact">No clients yet.</div>'}</div>
    </div>

    <div class="lux-card">
      <div class="section-title"><div><small>Quick Actions</small><h2>Start Work</h2></div></div>
      <div class="dashboard-action-grid">
        <button data-action="new-booking"><strong>＋ Event</strong><small>Create and link a new event</small></button>
        <button data-action="new-dashboard-client"><strong>＋ Client</strong><small>Add a CRM profile</small></button>
        <button data-view="calendar"><strong>◫ Calendar</strong><small>Review the schedule</small></button>
        <button data-view="bookings"><strong>⌕ Search</strong><small>Find any event</small></button>
      </div>
    </div>
  </section>`;

  bindDashboardActions();
  bindLeadActions();
  document.querySelectorAll('[data-action="new-dashboard-client"]').forEach(button=>button.addEventListener('click',()=>{
    selectedClientId=null;
    appView='clients';
    shell();
    requestAnimationFrame(()=>{
      const panel=document.querySelector('.booking-preview-panel');
      if(panel){
        panel.innerHTML=clientEditor();
        bindClientEditor();
      }
    });
  }));
  document.querySelectorAll('[data-dashboard-client]').forEach(button=>button.addEventListener('click',()=>{
    selectedClientId=button.dataset.dashboardClient;
    appView='clients';
    shell();
  }));
}
function kpi(label,value,caption,kind){return `<div class="kpi-card ${kind}"><div class="kpi-icon">${kind==='calendar'?'◷':kind==='quote'?'$':kind==='month'?'◫':'☁'}</div><small>${label}</small><strong>${value}</strong><span>${caption}</span></div>`}
function bookingRow(b){return `<button class="event-row" data-open-booking="${b.booking_ref}"><div class="event-date"><strong>${shortDay(b.event_date)}</strong><span>${shortMonth(b.event_date)}</span></div><div class="event-copy"><strong>${escapeHtml(b.client_name||'Unnamed Client')}</strong><span>${escapeHtml(eventTypeLabel(b.event_type))} · ${escapeHtml(b.venue_name||'Venue not set')}</span></div><span class="status-chip ${statusTone(b.status)}">${escapeHtml(b.status||'Draft')}</span><span class="row-arrow">→</span></button>`}
function formatEventDate(d){if(!d)return'Date not set';return new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}
function shortDay(d){return d?new Date(d+'T12:00:00').getDate():'—'}
function shortMonth(d){return d?new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short'}):'TBD'}
function currentBookingSummary(){const d=activeConsultation(),q=state.forms.quote||{};return `<div><small>Client</small><strong>${escapeHtml(d.primaryClient||d.company||q.clientName||'Not entered')}</strong></div><div><small>Event</small><strong>${escapeHtml(d.eventDate||q.eventDate||'Date not entered')}</strong></div><div><small>Status</small><strong>${escapeHtml(q.quoteStatus||'Draft')}</strong></div>`}


async function renderClients(){
  const main=document.querySelector('#main');
  main.innerHTML='<div class="dashboard-loading">Loading client relationships…</div>';
  if(currentUser&&activeBusinessId())await refreshCoreCloudData();

  const filtered=crmClients.filter(client=>
    [client.name,client.company,client.email,client.phone,client.notes]
      .join(' ').toLowerCase().includes(clientSearch.toLowerCase())
  );
  const selected=filtered.find(client=>client.id===selectedClientId)||filtered[0]||null;
  selectedClientId=selected?selected.id:null;

  main.innerHTML=`<section class="dash-hero compact-hero"><div><div class="eyebrow">Relationship Management</div><h1>Clients</h1><p>Every client profile includes its event history, last event and next scheduled event.</p></div><div class="hero-actions"><span class="sync-chip">${currentUser?clientCloudStatus:'Local only'}</span><button class="btn primary" data-action="new-client">＋ New Client</button></div></section>
  <div class="crm-controls"><div class="search-box">⌕<input id="clientSearch" value="${escapeHtml(clientSearch)}" placeholder="Search name, company, email or phone"></div><div class="calendar-count">${filtered.length} client${filtered.length===1?'':'s'}</div></div>
  <div class="crm-split clients-split">
    <section class="booking-list-panel"><div class="list-panel-head"><strong>Client Directory</strong><small>${currentUser?'Supabase cloud records':'Saved in this browser'}</small></div>
      <div class="booking-card-list">${filtered.length?filtered.map(client=>clientCard(client,selectedClientId)).join(''):'<div class="empty-state"><strong>No clients found.</strong><br>Create a client or adjust your search.</div>'}</div>
    </section>
    <aside class="booking-preview-panel">${selected?clientPreview(selected):clientEditor()}</aside>
  </div>`;

  const search=document.querySelector('#clientSearch');
  if(search)search.addEventListener('input',event=>{
    clientSearch=event.target.value;
    renderClients();
  });
  document.querySelectorAll('[data-select-client]').forEach(button=>button.addEventListener('click',()=>{
    selectedClientId=button.dataset.selectClient;
    renderClients();
  }));
  document.querySelectorAll('[data-action="new-client"]').forEach(button=>button.addEventListener('click',()=>{
    selectedClientId=null;
    document.querySelector('.booking-preview-panel').innerHTML=clientEditor();
    bindClientEditor();
  }));
  bindClientEditor();
  bindDashboardActions();
}
function clientCard(client,selectedId){
  const stats=clientTimelineStats(client);
  return `<button class="booking-card client-card-v42 ${client.id===selectedId?'selected':''}" data-select-client="${client.id}">
    <div class="booking-card-top"><div><strong>${escapeHtml(client.name||client.company||'Unnamed Client')}</strong><small>${escapeHtml(client.company||client.email||'Private client')}</small></div><span class="client-initial">${escapeHtml((client.name||client.company||'?').trim().charAt(0).toUpperCase())}</span></div>
    <div class="client-card-stats"><span><strong>${stats.events.length}</strong><small>Events</small></span><span><strong>${stats.next?shortMonth(stats.next.event_date)+' '+shortDay(stats.next.event_date):'—'}</strong><small>Next</small></span></div>
    <div class="booking-card-meta"><span>${escapeHtml(client.email||'No email')}</span><span>${escapeHtml(client.phone||'No phone')}</span></div>
  </button>`;
}
function clientPreview(client){
  const stats=clientTimelineStats(client);
  return `<div class="preview-eyebrow">Client Profile</div><h2>${escapeHtml(client.name||client.company||'Unnamed Client')}</h2><p>${escapeHtml(client.company||'Private client')}</p>
  <div class="preview-grid">
    <div><small>Email</small><strong>${escapeHtml(client.email||'Not set')}</strong></div>
    <div><small>Phone</small><strong>${escapeHtml(client.phone||'Not set')}</strong></div>
    <div><small>Total events</small><strong>${stats.events.length}</strong></div>
    <div><small>Next event</small><strong>${stats.next?formatEventDate(stats.next.event_date):'None scheduled'}</strong></div>
    <div><small>Last event</small><strong>${stats.last?formatEventDate(stats.last.event_date):'No past events'}</strong></div>
    <div><small>Updated</small><strong>${new Date(client.updatedAt||client.createdAt).toLocaleDateString()}</strong></div>
  </div>
  ${client.notes?`<div class="client-notes"><small>Notes</small><p>${escapeHtml(client.notes)}</p></div>`:''}
  <div class="client-event-timeline">
    <div class="section-title"><div><small>Timeline</small><h3>Linked Events</h3></div></div>
    ${stats.events.length?stats.events.slice(0,8).map(event=>`<button data-open-booking="${event.booking_ref}"><span><strong>${escapeHtml(event.event_type||'Event')}</strong><small>${escapeHtml(event.venue_name||'Venue not set')}</small></span><span>${formatEventDate(event.event_date)} →</span></button>`).join(''):'<div class="empty-state compact">No linked events yet.</div>'}
  </div>
  <button class="btn primary full" data-edit-client="${client.id}">Edit Client</button>
  <button class="btn full preview-secondary" data-client-event="${client.id}">Create Event for Client</button>
  <button class="text-button danger-text" data-delete-client="${client.id}">Delete client</button>`;
}
function clientEditor(c={id:'',name:'',company:'',email:'',phone:'',notes:''}){
  return `<form id="clientEditor" class="client-editor"><div class="preview-eyebrow">${c.id?'Edit Client':'New Client'}</div><h2>${c.id?'Update profile':'Create client'}</h2>
  <label><span>Client name *</span><input name="name" required value="${escapeHtml(c.name)}" placeholder="Full name"></label>
  <label><span>Company / organization</span><input name="company" value="${escapeHtml(c.company)}" placeholder="Optional"></label>
  <div class="editor-grid"><label><span>Email</span><input type="email" name="email" value="${escapeHtml(c.email)}"></label><label><span>Phone</span><input name="phone" value="${escapeHtml(c.phone)}"></label></div>
  <label><span>Internal notes</span><textarea name="notes" rows="5">${escapeHtml(c.notes)}</textarea></label>
  <input type="hidden" name="id" value="${escapeHtml(c.id)}"><button class="btn primary full" type="submit">${c.id?'Save Changes':'Create Client'}</button></form>`;
}
function bindClientEditor(){
  document.querySelectorAll('[data-edit-client]').forEach(b=>b.addEventListener('click',()=>{
    const c=crmClients.find(x=>x.id===b.dataset.editClient);
    document.querySelector('.booking-preview-panel').innerHTML=clientEditor(c);
    bindClientEditor();
  }));
  document.querySelectorAll('[data-delete-client]').forEach(b=>b.addEventListener('click',async()=>{
    if(!confirm('Delete this client record?'))return;
    const id=b.dataset.deleteClient;
    if(currentUser&&activeBusinessId()){
      clientCloudStatus='Saving…';
      const {error}=await removeCloudClient(id,activeBusinessId());
      if(error){clientCloudStatus='Sync failed';return toast(error.message)}
      await refreshClientsFromCloud();
    }else{
      crmClients=crmClients.filter(x=>x.id!==id);
      saveClients(crmClients);
    }
    selectedClientId=null;renderClients();toast('Client deleted');
  }));
  document.querySelectorAll('[data-client-event]').forEach(b=>b.addEventListener('click',()=>{
    const c=crmClients.find(x=>x.id===b.dataset.clientEvent);openEventModal(c);
  }));
  const form=document.querySelector('#clientEditor');
  if(form)form.addEventListener('submit',async e=>{
    e.preventDefault();
    const fd=new FormData(form),id=String(fd.get('id')||'');
    const existing=crmClients.find(x=>x.id===id)||{};
    const row={
      id:id||crypto.randomUUID(),
      name:String(fd.get('name')||'').trim(),
      company:String(fd.get('company')||'').trim(),
      email:String(fd.get('email')||'').trim(),
      phone:String(fd.get('phone')||'').trim(),
      notes:String(fd.get('notes')||'').trim(),
      createdAt:existing.createdAt||new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    const duplicate=findMatchingClient(row);
    if(!id&&duplicate){
      selectedClientId=duplicate.id;
      toast('Existing client found. Opening the current profile instead.');
      renderClients();
      return;
    }
    if(currentUser&&activeBusinessId()){
      clientCloudStatus='Saving…';
      const {data,error}=await saveCloudClient(row,activeBusinessId());
      if(error){clientCloudStatus='Sync failed';toast(error.message);return}
      selectedClientId=data.id;
      await refreshClientsFromCloud();
      renderClients();
      toast(id?'Client updated in cloud':'Client created in cloud');
    }else{
      crmClients=id?crmClients.map(x=>x.id===id?row:x):[row,...crmClients];
      saveClients(crmClients);selectedClientId=row.id;renderClients();
      toast(id?'Client updated locally':'Client created locally');
    }
  });
  document.querySelectorAll('[data-action="import-local-cloud"]').forEach(b=>b.addEventListener('click',migrateLocalClientsAndEvent));
}
function populateQuickEventForm(form,client=null,event=null){
  if(!form)return;
  form.reset();
  const isEdit=Boolean(event?.booking_ref);
  form.elements.bookingRef.value=event?.booking_ref||'';
  if(isEdit){
    form.elements.clientName.value=event.client_name||'';
    form.elements.clientEmail.value=event.client_email||'';
    form.elements.eventType.value=event.event_type||'Wedding';
    form.elements.eventDate.value=event.event_date||'';
    const details=(event.booking_data||event.event_data)?.forms?.[event.event_type==='Corporate'?'corporate':event.event_type==='Private Party'?'private':'wedding']||{};
    form.elements.setupStartTime.value=details.setupStartTime||'';
    form.elements.breakdownEndTime.value=details.breakdownEndTime||event.breakdown_end_time||'';
    form.elements.startTime.value=event.start_time||details.startTime||details.ceremonyTime||'';
    form.elements.endTime.value=event.end_time||details.endTime||'';
    form.elements.venueName.value=event.venue_name||'';
  }else if(client){
    form.elements.clientName.value=client.name||client.company||'';
    form.elements.clientEmail.value=client.email||'';
  }
  form.querySelector('[data-event-eyebrow]')?.replaceChildren(document.createTextNode(isEdit?'Edit Event':'New Event'));
  form.querySelector('[data-event-title]')?.replaceChildren(document.createTextNode(isEdit?'Edit event details':'Create an event'));
  form.querySelector('[data-event-intro]')?.replaceChildren(document.createTextNode(isEdit?'Update the client, event date, type or venue.':'Start with the essential details. You can complete the full consultation afterward.'));
  const submit=form.querySelector('button[type="submit"]');
  if(submit)submit.textContent=isEdit?'Save Event Changes':'Create Event Workspace';
}
function bindQuickEventForm(form){
  if(!form||form.dataset.bound)return;
  form.dataset.bound='1';
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const submitButton=form.querySelector('button[type="submit"]');
    const originalText=submitButton?.textContent||'Create Event';
    if(submitButton){submitButton.disabled=true;submitButton.textContent='Saving event…'}
    try{await createEventFromQuickForm(form)}
    catch(error){console.error('Event creation failed:',error);eventCloudStatus='Sync failed';toast(error?.message||'The event could not be saved')}
    finally{if(submitButton){submitButton.disabled=false;submitButton.textContent=originalText}}
  });
}
function openEventModal(client=null,event=null){
  // Event creation and editing use the same inline detail-panel pattern as New Client
  // on every screen size. This keeps the app workflow consistent and avoids modals.
  navigateToView('bookings');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const panel=document.querySelector('.booking-preview-panel');
    const source=document.querySelector('#eventCreateForm');
    if(!panel||!source)return;
    const form=source.cloneNode(true);
    form.id='eventInlineForm';
    form.className='client-editor event-inline-editor';
    form.removeAttribute('data-bound');
    form.querySelector('[data-action="close-event-modal"]')?.remove();
    panel.innerHTML='';
    panel.appendChild(form);
    populateQuickEventForm(form,client,event);
    bindQuickEventForm(form);
    // Keep the page at the top, matching every other inline creation flow.
    // preventScroll avoids the browser jumping down when the first field receives focus.
    requestAnimationFrame(()=>{
      form.elements.clientName?.focus({preventScroll:true});
      window.scrollTo({top:0,behavior:'auto'});
    });
  }));
}
function closeEventModal(){const modal=document.querySelector('#eventModal');if(modal)modal.classList.add('hidden');document.body.classList.remove('event-modal-open')}
async function createEventFromQuickForm(form){
  const fd=new FormData(form);
  const bookingRef=String(fd.get('bookingRef')||'').trim();
  const isEdit=Boolean(bookingRef);
  const type=String(fd.get('eventType')||'Wedding');
  const moduleId=type==='Corporate'?'corporate':type==='Private Party'?'private':'wedding';

  if(isEdit){
    const source=currentUser
      ? cloudBookings.find(event=>event.booking_ref===bookingRef)
      : loadLocalEvents().find(event=>event.booking_ref===bookingRef);
    const existingState=source?.booking_data||source?.event_data;
    if(existingState)state=JSON.parse(JSON.stringify(existingState));
    state.bookingId=bookingRef;
    state.forms=state.forms||{};
    state.completed=state.completed||[];
    state.active=moduleId;
  }else{
    state={
      active:moduleId,
      bookingId:makeId(),
      forms:{},
      completed:[],
      updated:new Date().toISOString()
    };
  }

  const previousDetails=state.forms[moduleId]||{};
  state.forms[moduleId]={
    ...previousDetails,
    primaryClient:String(fd.get('clientName')||''),
    company:String(fd.get('clientName')||''),
    email:String(fd.get('clientEmail')||''),
    eventDate:String(fd.get('eventDate')||''),
    setupStartTime:String(fd.get('setupStartTime')||''),
    breakdownEndTime:String(fd.get('breakdownEndTime')||''),
    startTime:String(fd.get('startTime')||''),
    endTime:String(fd.get('endTime')||''),
    venueName:String(fd.get('venueName')||'')
  };

  localStorage.setItem(KEY,JSON.stringify(state));

  const email=String(fd.get('clientEmail')||'').trim();
  const name=String(fd.get('clientName')||'').trim();

  let linkedClient=findMatchingClient({email,name})||null;

  if(name&&!linkedClient){
    const localClient={
      id:crypto.randomUUID(),
      name,
      company:'',
      email,
      phone:'',
      notes:'',
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };

    if(currentUser&&activeBusinessId()){
      const savedClient=await saveCloudClient(localClient,activeBusinessId());
      if(savedClient.error){
        throw new Error(`Client save failed: ${savedClient.error.message}`);
      }
      linkedClient=normalizeCloudClient(savedClient.data);
      await refreshClientsFromCloud();
    }else{
      crmClients.unshift(localClient);
      saveClients(crmClients);
      linkedClient=localClient;
    }
  }

  if(currentUser&&activeBusinessId()){
    eventCloudStatus='Saving…';
    const savedEvent=await saveCloudEvent(state,activeBusinessId(),linkedClient?.id||null);

    if(savedEvent.error){
      eventCloudStatus='Sync failed';
      throw new Error(`Event save failed: ${savedEvent.error.message}`);
    }

    eventCloudStatus='Synced';
    await refreshEventsFromCloud();
    selectedBookingRef=state.bookingId;
    toast(isEdit?'Event changes saved to cloud':'Event saved to cloud');
  }else{
    upsertLocalEvent(state,linkedClient);
    eventCloudStatus='Local';
    selectedBookingRef=state.bookingId;
    toast(isEdit?'Event changes saved locally':linkedClient?'Event saved locally and linked to client':'Event saved locally');
  }

  closeEventModal();
  appView='bookings';
  shell();
}


function moneyCents(cents){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format((Number(cents)||0)/100)}
function makeRecordNumber(prefix){return `${prefix}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`}
function quoteTotal(q){return (q.items||[]).reduce((sum,item)=>sum+(Number(item.quantity)||0)*(Number(item.unitPriceCents)||0),0)}
function renderQuotes(){
  const main=document.querySelector('#main');
  const filtered=crmQuotes.filter(q=>[q.number,q.clientName,q.eventName,q.status].join(' ').toLowerCase().includes(quoteSearch.toLowerCase()));
  const selected=filtered.find(q=>q.id===selectedQuoteId)||filtered[0]||null;
  selectedQuoteId=selected?selected.id:null;
  main.innerHTML=`<section class="dash-hero compact-hero"><div><div class="eyebrow">Sales Documents</div><h1>Quotes</h1><p>Create clear pricing proposals and convert accepted quotes into contracts.</p></div><div class="hero-actions"><button class="btn primary" data-action="new-quote">＋ New Quote</button></div></section>
  <div class="crm-controls"><div class="search-box">⌕<input id="quoteSearch" value="${escapeHtml(quoteSearch)}" placeholder="Search quote, client, event or status"></div><div class="calendar-count">${filtered.length} quote${filtered.length===1?'':'s'}</div></div>
  <div class="crm-split">
    <section class="booking-list-panel"><div class="list-panel-head"><strong>Quote Library</strong><small>Local draft records</small></div>
      <div class="booking-card-list">${filtered.length?filtered.map(q=>quoteCard(q,selectedQuoteId)).join(''):'<div class="empty-state"><strong>No quotes yet.</strong><br>Create your first pricing proposal.</div>'}</div>
    </section>
    <aside class="booking-preview-panel">${selected?quotePreview(selected):quoteEditor()}</aside>
  </div>`;
  const search=document.querySelector('#quoteSearch');
  if(search)search.addEventListener('input',e=>{quoteSearch=e.target.value;renderQuotes();const n=document.querySelector('#quoteSearch');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}});
  document.querySelectorAll('[data-select-quote]').forEach(b=>b.addEventListener('click',()=>{selectedQuoteId=b.dataset.selectQuote;renderQuotes()}));
  document.querySelectorAll('[data-action="new-quote"]').forEach(b=>b.addEventListener('click',()=>{selectedQuoteId=null;document.querySelector('.booking-preview-panel').innerHTML=quoteEditor();bindQuoteEditor()}));
  bindQuoteEditor();
  bindDashboardActions();
}
function quoteCard(q,selectedId){
  return `<button class="booking-card ${q.id===selectedId?'selected':''}" data-select-quote="${q.id}">
    <div class="booking-card-top"><div><strong>${escapeHtml(q.clientName||'Unnamed Client')}</strong><small>${escapeHtml(q.number)}</small></div><span class="status-chip ${statusTone(q.status)}">${escapeHtml(q.status||'Draft')}</span></div>
    <div class="booking-card-meta"><span>${escapeHtml(q.eventName||'Event')}</span><span>${moneyCents(quoteTotal(q))}</span></div>
  </button>`;
}
function quotePreview(q){
  const total=quoteTotal(q),deposit=Math.round(total*(Number(q.depositPercent)||0)/100);
  return `<div class="preview-eyebrow">Quote</div><h2>${escapeHtml(q.number)}</h2><p>${escapeHtml(q.clientName||'Unnamed Client')}</p>
  <div class="preview-grid"><div><small>Event</small><strong>${escapeHtml(q.eventName||'Not set')}</strong></div><div><small>Status</small><strong>${escapeHtml(q.status||'Draft')}</strong></div><div><small>Total</small><strong>${moneyCents(total)}</strong></div><div><small>Deposit</small><strong>${moneyCents(deposit)}</strong></div></div>
  <div class="document-lines">${(q.items||[]).map(i=>`<div><span>${escapeHtml(i.description)} × ${Number(i.quantity)||0}</span><strong>${moneyCents((Number(i.quantity)||0)*(Number(i.unitPriceCents)||0))}</strong></div>`).join('')}</div>
  <button class="btn primary full" data-edit-quote="${q.id}">Edit Quote</button>
  <button class="btn full preview-secondary" data-accept-quote="${q.id}">${q.status==='Accepted'?'Accepted':'Mark as Accepted'}</button>
  <button class="btn full preview-secondary" data-contract-from-quote="${q.id}">Create Contract</button><button class="btn full preview-secondary" data-invoice-from-quote="${q.id}">Create Invoice</button>
  <button class="text-button danger-text" data-delete-quote="${q.id}">Delete quote</button>`;
}
function quoteEditor(q={id:'',number:makeRecordNumber('Q'),clientName:'',eventName:'',status:'Draft',depositPercent:30,validUntil:'',notes:'',items:[{description:'DJ Service Package',quantity:1,unitPriceCents:0}]}){
  return `<form id="quoteEditor" class="client-editor quote-editor"><div class="preview-eyebrow">${q.id?'Edit Quote':'New Quote'}</div><h2>${escapeHtml(q.number)}</h2>
  <div class="editor-grid"><label><span>Client name *</span><input name="clientName" required value="${escapeHtml(q.clientName)}"></label><label><span>Event name</span><input name="eventName" value="${escapeHtml(q.eventName)}" placeholder="Smith Wedding"></label></div>
  <div class="editor-grid"><label><span>Status</span><select name="status">${['Draft','Sent','Viewed','Accepted','Declined','Expired'].map(s=>`<option ${q.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label><span>Deposit %</span><input name="depositPercent" type="number" min="0" max="100" value="${Number(q.depositPercent)||0}"></label></div>
  <label><span>Valid until</span><input name="validUntil" type="date" value="${escapeHtml(q.validUntil||'')}"></label>
  <div class="quote-items" id="quoteItems">${(q.items||[]).map((i,idx)=>quoteItemRow(i,idx)).join('')}</div>
  <button type="button" class="btn compact" data-add-quote-item>＋ Add line item</button>
  <label><span>Notes</span><textarea name="notes" rows="4">${escapeHtml(q.notes||'')}</textarea></label>
  <input type="hidden" name="id" value="${escapeHtml(q.id)}"><input type="hidden" name="number" value="${escapeHtml(q.number)}">
  <button class="btn primary full" type="submit">${q.id?'Save Quote':'Create Quote'}</button></form>`;
}
function quoteItemRow(item,idx){
  return `<div class="quote-item-row"><input name="itemDescription_${idx}" value="${escapeHtml(item.description||'')}" placeholder="Service or add-on"><input name="itemQuantity_${idx}" type="number" min="0" step="0.5" value="${Number(item.quantity)||1}"><input name="itemPrice_${idx}" type="number" min="0" step="0.01" value="${((Number(item.unitPriceCents)||0)/100).toFixed(2)}"><button type="button" data-remove-quote-item="${idx}">×</button></div>`;
}
function bindQuoteEditor(){
  document.querySelectorAll('[data-edit-quote]').forEach(b=>b.addEventListener('click',()=>{const q=crmQuotes.find(x=>x.id===b.dataset.editQuote);document.querySelector('.booking-preview-panel').innerHTML=quoteEditor(q);bindQuoteEditor()}));
  document.querySelectorAll('[data-delete-quote]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Delete this quote?'))return;crmQuotes=crmQuotes.filter(x=>x.id!==b.dataset.deleteQuote);saveLocalRows(QUOTES_KEY,crmQuotes);selectedQuoteId=null;renderQuotes();toast('Quote deleted')}));
  document.querySelectorAll('[data-accept-quote]').forEach(b=>b.addEventListener('click',()=>{crmQuotes=crmQuotes.map(q=>q.id===b.dataset.acceptQuote?{...q,status:'Accepted',updatedAt:new Date().toISOString()}:q);saveLocalRows(QUOTES_KEY,crmQuotes);renderQuotes();toast('Quote accepted')}));
  document.querySelectorAll('[data-contract-from-quote]').forEach(b=>b.addEventListener('click',()=>createContractFromQuote(b.dataset.contractFromQuote)));
  document.querySelectorAll('[data-invoice-from-quote]').forEach(b=>b.addEventListener('click',()=>createInvoiceFromQuote(b.dataset.invoiceFromQuote)));
  const form=document.querySelector('#quoteEditor');
  if(!form)return;
  const add=form.querySelector('[data-add-quote-item]');
  if(add)add.addEventListener('click',()=>{const q=formToQuote(form);q.items.push({description:'',quantity:1,unitPriceCents:0});document.querySelector('.booking-preview-panel').innerHTML=quoteEditor(q);bindQuoteEditor()});
  form.querySelectorAll('[data-remove-quote-item]').forEach(b=>b.addEventListener('click',()=>{const q=formToQuote(form);q.items.splice(Number(b.dataset.removeQuoteItem),1);document.querySelector('.booking-preview-panel').innerHTML=quoteEditor(q);bindQuoteEditor()}));
  form.addEventListener('submit',e=>{e.preventDefault();const q=formToQuote(form);q.id=q.id||crypto.randomUUID();q.createdAt=q.createdAt||new Date().toISOString();q.updatedAt=new Date().toISOString();crmQuotes=crmQuotes.some(x=>x.id===q.id)?crmQuotes.map(x=>x.id===q.id?q:x):[q,...crmQuotes];saveLocalRows(QUOTES_KEY,crmQuotes);selectedQuoteId=q.id;renderQuotes();toast('Quote saved')});
}
function formToQuote(form){
  const fd=new FormData(form),items=[];
  form.querySelectorAll('.quote-item-row').forEach((row,idx)=>items.push({description:String(fd.get(`itemDescription_${idx}`)||''),quantity:Number(fd.get(`itemQuantity_${idx}`)||0),unitPriceCents:Math.round(Number(fd.get(`itemPrice_${idx}`)||0)*100)}));
  const id=String(fd.get('id')||'');
  const existing=crmQuotes.find(x=>x.id===id)||{};
  return {...existing,id,number:String(fd.get('number')||makeRecordNumber('Q')),clientName:String(fd.get('clientName')||''),eventName:String(fd.get('eventName')||''),status:String(fd.get('status')||'Draft'),depositPercent:Number(fd.get('depositPercent')||0),validUntil:String(fd.get('validUntil')||''),notes:String(fd.get('notes')||''),items};
}
function createContractFromQuote(id){
  const q=crmQuotes.find(x=>x.id===id);if(!q)return;
  const row={id:crypto.randomUUID(),number:makeRecordNumber('C'),quoteId:q.id,clientName:q.clientName,eventName:q.eventName,status:'Draft',title:'DJ Services Agreement',terms:`Services and pricing accepted from ${q.number}.`,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  crmContracts.unshift(row);saveLocalRows(CONTRACTS_KEY,crmContracts);selectedContractId=row.id;appView='contracts';shell();toast('Contract created from quote');
}


function invoiceTotal(i){return Number(i.totalCents)||0}
function invoicePaid(i){return crmPayments.filter(p=>p.invoiceId===i.id&&p.status==='Verified').reduce((s,p)=>s+(Number(p.amountCents)||0),0)}
function invoiceBalance(i){return Math.max(0,invoiceTotal(i)-invoicePaid(i))}
function invoiceStatus(i){
  const balance=invoiceBalance(i),paid=invoicePaid(i);
  if(i.status==='Void')return'Void';
  if(balance<=0&&invoiceTotal(i)>0)return'Paid';
  if(paid>0)return'Partial';
  if(i.dueDate&&new Date(i.dueDate+'T23:59:59')<new Date())return'Overdue';
  return i.status||'Draft';
}
function createInvoiceFromQuote(id){
  const q=crmQuotes.find(x=>x.id===id);if(!q)return;
  const total=quoteTotal(q);
  const row={id:crypto.randomUUID(),number:makeRecordNumber('INV'),quoteId:q.id,clientName:q.clientName,eventName:q.eventName,status:'Draft',totalCents:total,dueDate:'',notes:q.notes||'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  crmInvoices.unshift(row);saveLocalRows(INVOICES_KEY,crmInvoices);selectedInvoiceId=row.id;appView='invoices';shell();toast('Invoice created from quote');
}
function renderInvoices(){
  const main=document.querySelector('#main');
  const filtered=crmInvoices.filter(i=>[i.number,i.clientName,i.eventName,invoiceStatus(i)].join(' ').toLowerCase().includes(invoiceSearch.toLowerCase()));
  const selected=filtered.find(i=>i.id===selectedInvoiceId)||filtered[0]||null;
  selectedInvoiceId=selected?selected.id:null;
  const outstanding=filtered.reduce((s,i)=>s+invoiceBalance(i),0);
  main.innerHTML=`<section class="dash-hero compact-hero"><div><div class="eyebrow">Billing</div><h1>Invoices</h1><p>Track deposits, balances, due dates and payment progress.</p></div><div class="hero-actions"><button class="btn primary" data-action="new-invoice">＋ New Invoice</button></div></section>
  <section class="mini-kpi-row"><div><small>Invoices</small><strong>${filtered.length}</strong></div><div><small>Outstanding</small><strong>${moneyCents(outstanding)}</strong></div><div><small>Verified payments</small><strong>${crmPayments.filter(p=>p.status==='Verified').length}</strong></div></section>
  <div class="crm-controls"><div class="search-box">⌕<input id="invoiceSearch" value="${escapeHtml(invoiceSearch)}" placeholder="Search invoice, client, event or status"></div></div>
  <div class="crm-split">
    <section class="booking-list-panel"><div class="list-panel-head"><strong>Invoice Library</strong><small>Local billing records</small></div><div class="booking-card-list">${filtered.length?filtered.map(i=>invoiceCard(i,selectedInvoiceId)).join(''):'<div class="empty-state"><strong>No invoices yet.</strong><br>Create one or convert a quote.</div>'}</div></section>
    <aside class="booking-preview-panel">${selected?invoicePreview(selected):invoiceEditor()}</aside>
  </div>`;
  const search=document.querySelector('#invoiceSearch');if(search)search.addEventListener('input',e=>{invoiceSearch=e.target.value;renderInvoices();const n=document.querySelector('#invoiceSearch');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}});
  document.querySelectorAll('[data-select-invoice]').forEach(b=>b.addEventListener('click',()=>{selectedInvoiceId=b.dataset.selectInvoice;renderInvoices()}));
  document.querySelectorAll('[data-action="new-invoice"]').forEach(b=>b.addEventListener('click',()=>{selectedInvoiceId=null;document.querySelector('.booking-preview-panel').innerHTML=invoiceEditor();bindInvoiceEditor()}));
  bindInvoiceEditor();bindDashboardActions();
}
function invoiceCard(i,selectedId){
  return `<button class="booking-card ${i.id===selectedId?'selected':''}" data-select-invoice="${i.id}"><div class="booking-card-top"><div><strong>${escapeHtml(i.clientName||'Unnamed Client')}</strong><small>${escapeHtml(i.number)}</small></div><span class="status-chip ${statusTone(invoiceStatus(i))}">${escapeHtml(invoiceStatus(i))}</span></div><div class="booking-card-meta"><span>${escapeHtml(i.eventName||'Event')}</span><span>${moneyCents(invoiceBalance(i))} due</span></div></button>`;
}
function invoicePreview(i){
  const paid=invoicePaid(i),balance=invoiceBalance(i),status=invoiceStatus(i);
  return `<div class="preview-eyebrow">Invoice</div><h2>${escapeHtml(i.number)}</h2><p>${escapeHtml(i.clientName||'Unnamed Client')}</p>
  <div class="preview-grid"><div><small>Event</small><strong>${escapeHtml(i.eventName||'Not set')}</strong></div><div><small>Status</small><strong>${escapeHtml(status)}</strong></div><div><small>Total</small><strong>${moneyCents(invoiceTotal(i))}</strong></div><div><small>Balance</small><strong>${moneyCents(balance)}</strong></div><div><small>Paid</small><strong>${moneyCents(paid)}</strong></div><div><small>Due date</small><strong>${escapeHtml(i.dueDate||'Not set')}</strong></div></div>
  <div class="invoice-progress"><div><span>Payment progress</span><strong>${invoiceTotal(i)?Math.min(100,Math.round(paid/invoiceTotal(i)*100)):0}%</strong></div><div class="mini-progress"><span style="width:${invoiceTotal(i)?Math.min(100,paid/invoiceTotal(i)*100):0}%"></span></div></div>
  <button class="btn primary full" data-record-payment="${i.id}">Record Payment</button><button class="btn full preview-secondary" data-edit-invoice="${i.id}">Edit Invoice</button><button class="text-button danger-text" data-delete-invoice="${i.id}">Delete invoice</button>`;
}
function invoiceEditor(i={id:'',number:makeRecordNumber('INV'),clientName:'',eventName:'',status:'Draft',totalCents:0,dueDate:'',notes:''}){
  return `<form id="invoiceEditor" class="client-editor"><div class="preview-eyebrow">${i.id?'Edit Invoice':'New Invoice'}</div><h2>${escapeHtml(i.number)}</h2>
  <div class="editor-grid"><label><span>Client name *</span><input name="clientName" required value="${escapeHtml(i.clientName)}"></label><label><span>Event name</span><input name="eventName" value="${escapeHtml(i.eventName)}"></label></div>
  <div class="editor-grid"><label><span>Total amount</span><input name="total" type="number" min="0" step="0.01" value="${(invoiceTotal(i)/100).toFixed(2)}"></label><label><span>Due date</span><input name="dueDate" type="date" value="${escapeHtml(i.dueDate||'')}"></label></div>
  <label><span>Status</span><select name="status">${['Draft','Sent','Void'].map(s=>`<option ${i.status===s?'selected':''}>${s}</option>`).join('')}</select></label>
  <label><span>Notes</span><textarea name="notes" rows="6">${escapeHtml(i.notes||'')}</textarea></label><input type="hidden" name="id" value="${escapeHtml(i.id)}"><input type="hidden" name="number" value="${escapeHtml(i.number)}"><button class="btn primary full" type="submit">${i.id?'Save Invoice':'Create Invoice'}</button></form>`;
}
function bindInvoiceEditor(){
  document.querySelectorAll('[data-edit-invoice]').forEach(b=>b.addEventListener('click',()=>{const i=crmInvoices.find(x=>x.id===b.dataset.editInvoice);document.querySelector('.booking-preview-panel').innerHTML=invoiceEditor(i);bindInvoiceEditor()}));
  document.querySelectorAll('[data-delete-invoice]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Delete this invoice?'))return;crmInvoices=crmInvoices.filter(x=>x.id!==b.dataset.deleteInvoice);crmPayments=crmPayments.filter(p=>p.invoiceId!==b.dataset.deleteInvoice);saveLocalRows(INVOICES_KEY,crmInvoices);saveLocalRows(PAYMENTS_KEY,crmPayments);selectedInvoiceId=null;renderInvoices();toast('Invoice deleted')}));
  document.querySelectorAll('[data-record-payment]').forEach(b=>b.addEventListener('click',()=>openPaymentEditor(b.dataset.recordPayment)));
  const form=document.querySelector('#invoiceEditor');if(!form)return;
  form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form),id=String(fd.get('id')||''),existing=crmInvoices.find(x=>x.id===id)||{};const row={...existing,id:id||crypto.randomUUID(),number:String(fd.get('number')||makeRecordNumber('INV')),clientName:String(fd.get('clientName')||''),eventName:String(fd.get('eventName')||''),status:String(fd.get('status')||'Draft'),totalCents:Math.round(Number(fd.get('total')||0)*100),dueDate:String(fd.get('dueDate')||''),notes:String(fd.get('notes')||''),createdAt:existing.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};crmInvoices=id?crmInvoices.map(x=>x.id===id?row:x):[row,...crmInvoices];saveLocalRows(INVOICES_KEY,crmInvoices);selectedInvoiceId=row.id;renderInvoices();toast('Invoice saved')});
}
function openPaymentEditor(invoiceId=''){
  appView='payments';selectedPaymentId=null;shell();
  const panel=document.querySelector('.booking-preview-panel');if(panel){panel.innerHTML=paymentEditor({invoiceId});bindPaymentEditor()}
}

function renderPayments(){
  const main=document.querySelector('#main');
  const filtered=crmPayments.filter(p=>{const inv=crmInvoices.find(i=>i.id===p.invoiceId)||{};return [p.reference,p.method,p.status,inv.clientName,inv.number].join(' ').toLowerCase().includes(paymentSearch.toLowerCase())});
  const selected=filtered.find(p=>p.id===selectedPaymentId)||filtered[0]||null;
  selectedPaymentId=selected?selected.id:null;
  const verified=filtered.filter(p=>p.status==='Verified').reduce((s,p)=>s+(Number(p.amountCents)||0),0);
  main.innerHTML=`<section class="dash-hero compact-hero"><div><div class="eyebrow">Payment Tracking</div><h1>Payments</h1><p>Record Venmo, card, cash and bank payments without storing sensitive card data.</p></div><div class="hero-actions"><button class="btn primary" data-action="new-payment">＋ Record Payment</button></div></section>
  <section class="mini-kpi-row"><div><small>Payments</small><strong>${filtered.length}</strong></div><div><small>Verified total</small><strong>${moneyCents(verified)}</strong></div><div><small>Awaiting verification</small><strong>${filtered.filter(p=>p.status==='Submitted').length}</strong></div></section>
  <div class="crm-controls"><div class="search-box">⌕<input id="paymentSearch" value="${escapeHtml(paymentSearch)}" placeholder="Search payment, invoice, client, method or status"></div></div>
  <div class="crm-split"><section class="booking-list-panel"><div class="list-panel-head"><strong>Payment Activity</strong><small>Manual verification workflow</small></div><div class="booking-card-list">${filtered.length?filtered.map(p=>paymentCard(p,selectedPaymentId)).join(''):'<div class="empty-state"><strong>No payments yet.</strong><br>Record a Venmo, card or offline payment.</div>'}</div></section><aside class="booking-preview-panel">${selected?paymentPreview(selected):paymentEditor()}</aside></div>`;
  const search=document.querySelector('#paymentSearch');if(search)search.addEventListener('input',e=>{paymentSearch=e.target.value;renderPayments();const n=document.querySelector('#paymentSearch');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}});
  document.querySelectorAll('[data-select-payment]').forEach(b=>b.addEventListener('click',()=>{selectedPaymentId=b.dataset.selectPayment;renderPayments()}));
  document.querySelectorAll('[data-action="new-payment"]').forEach(b=>b.addEventListener('click',()=>{selectedPaymentId=null;document.querySelector('.booking-preview-panel').innerHTML=paymentEditor();bindPaymentEditor()}));
  bindPaymentEditor();bindDashboardActions();
}
function paymentCard(p,selectedId){
  const i=crmInvoices.find(x=>x.id===p.invoiceId)||{};
  return `<button class="booking-card ${p.id===selectedId?'selected':''}" data-select-payment="${p.id}"><div class="booking-card-top"><div><strong>${moneyCents(p.amountCents)}</strong><small>${escapeHtml(i.clientName||i.number||'Unassigned payment')}</small></div><span class="status-chip ${statusTone(p.status)}">${escapeHtml(p.status)}</span></div><div class="booking-card-meta"><span>${escapeHtml(p.method)}</span><span>${new Date(p.createdAt).toLocaleDateString()}</span></div></button>`;
}
function paymentPreview(p){
  const i=crmInvoices.find(x=>x.id===p.invoiceId)||{};
  return `<div class="preview-eyebrow">Payment</div><h2>${moneyCents(p.amountCents)}</h2><p>${escapeHtml(i.clientName||i.number||'Unassigned')}</p><div class="preview-grid"><div><small>Method</small><strong>${escapeHtml(p.method)}</strong></div><div><small>Status</small><strong>${escapeHtml(p.status)}</strong></div><div><small>Invoice</small><strong>${escapeHtml(i.number||'Not assigned')}</strong></div><div><small>Reference</small><strong>${escapeHtml(p.reference||'Not entered')}</strong></div></div>${p.note?`<div class="client-notes"><small>Note</small><p>${escapeHtml(p.note)}</p></div>`:''}<button class="btn primary full" data-edit-payment="${p.id}">Edit Payment</button>${p.status!=='Verified'?`<button class="btn full preview-secondary" data-verify-payment="${p.id}">Mark as Verified</button>`:''}<button class="text-button danger-text" data-delete-payment="${p.id}">Delete payment</button>`;
}
function paymentEditor(p={id:'',invoiceId:'',amountCents:0,method:'Venmo',status:'Submitted',reference:'',note:''}){
  return `<form id="paymentEditor" class="client-editor"><div class="preview-eyebrow">${p.id?'Edit Payment':'Record Payment'}</div><h2>${p.id?'Payment record':'New payment'}</h2><label><span>Invoice</span><select name="invoiceId"><option value="">Unassigned</option>${crmInvoices.map(i=>`<option value="${i.id}" ${p.invoiceId===i.id?'selected':''}>${escapeHtml(i.number)} · ${escapeHtml(i.clientName||'Client')} · ${moneyCents(invoiceBalance(i))} due</option>`).join('')}</select></label><div class="editor-grid"><label><span>Amount</span><input name="amount" type="number" min="0.01" step="0.01" required value="${((Number(p.amountCents)||0)/100).toFixed(2)}"></label><label><span>Method</span><select name="method">${['Venmo','Card','PayPal','Cash','Bank Transfer','Check','Other'].map(m=>`<option ${p.method===m?'selected':''}>${m}</option>`).join('')}</select></label></div><div class="editor-grid"><label><span>Status</span><select name="status">${['Pending','Submitted','Verified','Failed','Refunded','Cancelled'].map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label><span>Reference</span><input name="reference" value="${escapeHtml(p.reference||'')}" placeholder="Venmo note or processor ID"></label></div><label><span>Internal note</span><textarea name="note" rows="5">${escapeHtml(p.note||'')}</textarea></label><input type="hidden" name="id" value="${escapeHtml(p.id)}"><button class="btn primary full" type="submit">${p.id?'Save Payment':'Record Payment'}</button></form>`;
}
function bindPaymentEditor(){
  document.querySelectorAll('[data-edit-payment]').forEach(b=>b.addEventListener('click',()=>{const p=crmPayments.find(x=>x.id===b.dataset.editPayment);document.querySelector('.booking-preview-panel').innerHTML=paymentEditor(p);bindPaymentEditor()}));
  document.querySelectorAll('[data-verify-payment]').forEach(b=>b.addEventListener('click',()=>{crmPayments=crmPayments.map(p=>p.id===b.dataset.verifyPayment?{...p,status:'Verified',verifiedAt:new Date().toISOString(),updatedAt:new Date().toISOString()}:p);saveLocalRows(PAYMENTS_KEY,crmPayments);renderPayments();toast('Payment verified')}));
  document.querySelectorAll('[data-delete-payment]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Delete this payment?'))return;crmPayments=crmPayments.filter(x=>x.id!==b.dataset.deletePayment);saveLocalRows(PAYMENTS_KEY,crmPayments);selectedPaymentId=null;renderPayments();toast('Payment deleted')}));
  const form=document.querySelector('#paymentEditor');if(!form)return;
  form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form),id=String(fd.get('id')||''),existing=crmPayments.find(x=>x.id===id)||{};const row={...existing,id:id||crypto.randomUUID(),invoiceId:String(fd.get('invoiceId')||''),amountCents:Math.round(Number(fd.get('amount')||0)*100),method:String(fd.get('method')||'Other'),status:String(fd.get('status')||'Submitted'),reference:String(fd.get('reference')||''),note:String(fd.get('note')||''),createdAt:existing.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};crmPayments=id?crmPayments.map(x=>x.id===id?row:x):[row,...crmPayments];saveLocalRows(PAYMENTS_KEY,crmPayments);selectedPaymentId=row.id;renderPayments();toast('Payment saved')});
}

function renderContracts(){
  const main=document.querySelector('#main');
  const filtered=crmContracts.filter(c=>[c.number,c.clientName,c.eventName,c.status,c.title].join(' ').toLowerCase().includes(contractSearch.toLowerCase()));
  const selected=filtered.find(c=>c.id===selectedContractId)||filtered[0]||null;
  selectedContractId=selected?selected.id:null;
  main.innerHTML=`<section class="dash-hero compact-hero"><div><div class="eyebrow">Agreements</div><h1>Contracts</h1><p>Create agreements, track signatures and keep every event legally organized.</p></div><div class="hero-actions"><button class="btn primary" data-action="new-contract">＋ New Contract</button></div></section>
  <div class="crm-controls"><div class="search-box">⌕<input id="contractSearch" value="${escapeHtml(contractSearch)}" placeholder="Search contract, client, event or status"></div><div class="calendar-count">${filtered.length} contract${filtered.length===1?'':'s'}</div></div>
  <div class="crm-split">
    <section class="booking-list-panel"><div class="list-panel-head"><strong>Contract Library</strong><small>Local draft records</small></div><div class="booking-card-list">${filtered.length?filtered.map(c=>contractCard(c,selectedContractId)).join(''):'<div class="empty-state"><strong>No contracts yet.</strong><br>Create one or convert an accepted quote.</div>'}</div></section>
    <aside class="booking-preview-panel">${selected?contractPreview(selected):contractEditor()}</aside>
  </div>`;
  const search=document.querySelector('#contractSearch');if(search)search.addEventListener('input',e=>{contractSearch=e.target.value;renderContracts();const n=document.querySelector('#contractSearch');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}});
  document.querySelectorAll('[data-select-contract]').forEach(b=>b.addEventListener('click',()=>{selectedContractId=b.dataset.selectContract;renderContracts()}));
  document.querySelectorAll('[data-action="new-contract"]').forEach(b=>b.addEventListener('click',()=>{selectedContractId=null;document.querySelector('.booking-preview-panel').innerHTML=contractEditor();bindContractEditor()}));
  bindContractEditor();bindDashboardActions();
}
function contractCard(c,selectedId){
  return `<button class="booking-card ${c.id===selectedId?'selected':''}" data-select-contract="${c.id}"><div class="booking-card-top"><div><strong>${escapeHtml(c.clientName||'Unnamed Client')}</strong><small>${escapeHtml(c.number)}</small></div><span class="status-chip ${statusTone(c.status)}">${escapeHtml(c.status||'Draft')}</span></div><div class="booking-card-meta"><span>${escapeHtml(c.eventName||'Event')}</span><span>${escapeHtml(c.title||'Agreement')}</span></div></button>`;
}
function contractPreview(c){
  return `<div class="preview-eyebrow">Contract</div><h2>${escapeHtml(c.number)}</h2><p>${escapeHtml(c.clientName||'Unnamed Client')}</p>
  <div class="preview-grid"><div><small>Event</small><strong>${escapeHtml(c.eventName||'Not set')}</strong></div><div><small>Status</small><strong>${escapeHtml(c.status||'Draft')}</strong></div><div><small>Title</small><strong>${escapeHtml(c.title||'Agreement')}</strong></div><div><small>Updated</small><strong>${new Date(c.updatedAt||c.createdAt).toLocaleDateString()}</strong></div></div>
  <div class="contract-terms-preview">${escapeHtml(c.terms||'No contract terms entered.')}</div>
  <button class="btn primary full" data-edit-contract="${c.id}">Edit Contract</button><button class="btn full preview-secondary" data-sign-contract="${c.id}">${c.status==='Signed'?'Signed':'Mark as Signed'}</button><button class="text-button danger-text" data-delete-contract="${c.id}">Delete contract</button>`;
}
function contractEditor(c={id:'',number:makeRecordNumber('C'),clientName:'',eventName:'',status:'Draft',title:'DJ Services Agreement',terms:''}){
  return `<form id="contractEditor" class="client-editor"><div class="preview-eyebrow">${c.id?'Edit Contract':'New Contract'}</div><h2>${escapeHtml(c.number)}</h2>
  <label><span>Contract title</span><input name="title" value="${escapeHtml(c.title)}"></label>
  <div class="editor-grid"><label><span>Client name *</span><input name="clientName" required value="${escapeHtml(c.clientName)}"></label><label><span>Event name</span><input name="eventName" value="${escapeHtml(c.eventName)}"></label></div>
  <label><span>Status</span><select name="status">${['Draft','Sent','Viewed','Signed','Void'].map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}</select></label>
  <label><span>Agreement terms</span><textarea name="terms" rows="12" placeholder="Enter service terms, cancellation policy and payment requirements.">${escapeHtml(c.terms||'')}</textarea></label>
  <input type="hidden" name="id" value="${escapeHtml(c.id)}"><input type="hidden" name="number" value="${escapeHtml(c.number)}"><button class="btn primary full" type="submit">${c.id?'Save Contract':'Create Contract'}</button></form>`;
}
function bindContractEditor(){
  document.querySelectorAll('[data-edit-contract]').forEach(b=>b.addEventListener('click',()=>{const c=crmContracts.find(x=>x.id===b.dataset.editContract);document.querySelector('.booking-preview-panel').innerHTML=contractEditor(c);bindContractEditor()}));
  document.querySelectorAll('[data-delete-contract]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Delete this contract?'))return;crmContracts=crmContracts.filter(x=>x.id!==b.dataset.deleteContract);saveLocalRows(CONTRACTS_KEY,crmContracts);selectedContractId=null;renderContracts();toast('Contract deleted')}));
  document.querySelectorAll('[data-sign-contract]').forEach(b=>b.addEventListener('click',()=>{crmContracts=crmContracts.map(c=>c.id===b.dataset.signContract?{...c,status:'Signed',signedAt:new Date().toISOString(),updatedAt:new Date().toISOString()}:c);saveLocalRows(CONTRACTS_KEY,crmContracts);renderContracts();toast('Contract marked signed')}));
  const form=document.querySelector('#contractEditor');if(!form)return;
  form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form),id=String(fd.get('id')||''),existing=crmContracts.find(x=>x.id===id)||{};const row={...existing,id:id||crypto.randomUUID(),number:String(fd.get('number')||makeRecordNumber('C')),clientName:String(fd.get('clientName')||''),eventName:String(fd.get('eventName')||''),status:String(fd.get('status')||'Draft'),title:String(fd.get('title')||'DJ Services Agreement'),terms:String(fd.get('terms')||''),createdAt:existing.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};crmContracts=id?crmContracts.map(x=>x.id===id?row:x):[row,...crmContracts];saveLocalRows(CONTRACTS_KEY,crmContracts);selectedContractId=row.id;renderContracts();toast('Contract saved')});
}


function currentEventDetails(){
  const d=activeConsultation(),q=state.forms.quote||{};
  const type=state.forms.wedding?'Wedding':state.forms.corporate?'Corporate Event':state.forms.private?'Private Party':'Event';
  return {
    bookingRef:state.bookingId,
    clientName:d.primaryClient||d.company||q.clientName||'Client',
    email:d.email||q.clientEmail||'',
    eventType:type,
    eventDate:d.eventDate||q.eventDate||'',
    venueName:d.venueName||q.venueName||'Venue not entered'
  };
}
function portalProgress(){
  const completed=state.completed||[];
  const required=['wedding','quote','contract','wedding-planner','timeline'];
  const done=required.filter(id=>completed.includes(id)||Object.keys(state.forms[id]||{}).length>0).length;
  return Math.round(done/required.length*100);
}
function portalInvoice(){
  const e=currentEventDetails();
  return crmInvoices.find(i=>
    (i.eventName&&e.eventType&&i.eventName.toLowerCase().includes(e.eventType.toLowerCase()))||
    (i.clientName&&e.clientName&&i.clientName.toLowerCase()===e.clientName.toLowerCase())
  )||null;
}
function portalContract(){
  const e=currentEventDetails();
  return crmContracts.find(c=>c.clientName&&e.clientName&&c.clientName.toLowerCase()===e.clientName.toLowerCase())||null;
}
function portalQuote(){
  const e=currentEventDetails();
  return crmQuotes.find(q=>q.clientName&&e.clientName&&q.clientName.toLowerCase()===e.clientName.toLowerCase())||null;
}
function portalRecord(){
  if(!clientPortals[state.bookingId]){
    clientPortals[state.bookingId]={
      accessCode:Math.random().toString(36).slice(2,8).toUpperCase(),
      enabled:true,
      createdAt:new Date().toISOString()
    };
    saveClientPortals(clientPortals);
  }
  return clientPortals[state.bookingId];
}
function portalDaysUntil(dateString){
  if(!dateString)return null;
  const event=new Date(dateString+'T12:00:00'),today=new Date();
  event.setHours(0,0,0,0);today.setHours(0,0,0,0);
  return Math.ceil((event-today)/86400000);
}
function workflowActionButtons(actor){
  return allowedActions(state,actor).map(action=>`<button class="btn ${action.includes('decline')||action.includes('return')?'':'primary'}" data-workflow-action="${action}" data-workflow-actor="${actor}">${escapeHtml(ACTION_LABELS[action]||action)}</button>`).join('');
}
function workflowStatusCard(actor='organization'){
  const current=getWorkflowState(state),progress=workflowProgress(state),message=actor==='client'?current.client:current.ec;
  const history=(current.workflow.history||[]).slice(-5).reverse();
  return `<section class="workflow-engine-card" data-workflow-state="${current.id}">
    <div class="workflow-engine-head"><div><small>GCOS Workflow · v${current.workflow.version}</small><h2>${escapeHtml(current.label)}</h2><p>${escapeHtml(message)}</p></div><span class="workflow-owner ${current.owner}">${current.owner==='organization'?'Organization':current.owner==='client'?'Client':current.owner==='both'?'Both':'Closed'}</span></div>
    <div class="workflow-engine-progress"><span style="width:${progress}%"></span></div>
    <div class="workflow-engine-meta"><div><small>Progress</small><strong>${progress}%</strong></div><div><small>Next required action</small><strong>${escapeHtml(current.nextAction)}</strong></div><div><small>Last updated</small><strong>${new Date(current.workflow.updatedAt||current.workflow.enteredAt).toLocaleString()}</strong></div></div>
    <div class="workflow-engine-actions">${workflowActionButtons(actor)||'<span class="workflow-waiting">No action required from you right now.</span>'}</div>
    <details class="workflow-history"><summary>Recent workflow history</summary>${history.map(item=>`<div><span>${escapeHtml(ACTION_LABELS[item.action]||item.action.replaceAll('_',' '))}</span><small>${escapeHtml(item.actor)} · ${new Date(item.at).toLocaleString()}</small></div>`).join('')}</details>
  </section>`;
}
function bindWorkflowActions(){
  document.querySelectorAll('[data-workflow-action]').forEach(button=>button.addEventListener('click',()=>{
    const result=transitionWorkflow(state,button.dataset.workflowAction,button.dataset.workflowActor);
    if(!result.ok)return toast(result.error);
    save(false);
    toast(`Workflow updated: ${getWorkflowState(state).label}`);
    if(appView==='client-portal')renderClientPortal();else renderMain();
  }));
}
function renderClientPortal(){
  const main=document.querySelector('#main'),e=currentEventDetails(),portal=portalRecord(),progress=portalProgress();
  const invoice=portalInvoice(),contract=portalContract(),quote=portalQuote(),days=portalDaysUntil(e.eventDate);
  const paid=invoice?invoicePaid(invoice):0,balance=invoice?invoiceBalance(invoice):0;
  const planner=state.forms['wedding-planner']||state.forms['corporate-planner']||state.forms['private-planner']||{};
  main.innerHTML=`<section class="portal-preview-banner"><div><strong>Client Portal Preview</strong><span>This is what ${escapeHtml(e.clientName)} will see.</span></div><div><span>Access code: <b>${portal.accessCode}</b></span><button class="btn compact" data-copy-portal>Copy access details</button></div></section>
  <section class="client-portal-shell">
    <header class="client-portal-header">
      <div><div class="portal-business">${escapeHtml(businessSettings.businessName||'Your Entertainment Company')}</div><small>Powered by Galaxy Cue</small></div>
      <div class="portal-reference">${escapeHtml(e.bookingRef)}</div>
    </header>
    <section class="portal-hero">
      <div><div class="eyebrow">${escapeHtml(e.eventType)}</div><h1>Welcome, ${escapeHtml((e.clientName||'Client').split(' ')[0])}.</h1><p>Everything for your event is organized in one place.</p></div>
      <div class="portal-countdown">${days===null?'<strong>—</strong><span>Event date pending</span>':days<0?'<strong>Complete</strong><span>Thank you for celebrating with us</span>':days===0?'<strong>Today</strong><span>Your event is here</span>':`<strong>${days}</strong><span>day${days===1?'':'s'} remaining</span>`}</div>
    </section>
    <section class="portal-event-card">
      <div><small>Event date</small><strong>${e.eventDate?new Date(e.eventDate+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}):'Not entered'}</strong></div>
      <div><small>Venue</small><strong>${escapeHtml(e.venueName)}</strong></div>
      <div><small>Progress</small><strong>${progress}% complete</strong></div>
    </section>
    ${workflowStatusCard('client')}
    <section class="portal-main-grid">
      <div class="portal-column">
        <article class="portal-card">
          <div class="portal-card-head"><div><small>Your progress</small><h2>Event Journey</h2></div><strong>${progress}%</strong></div>
          <div class="mini-progress portal-progress"><span style="width:${progress}%"></span></div>
          <div class="portal-steps">
            ${portalStep('Consultation',Object.keys(activeConsultation()).length>0,'Tell us about your event')}
            ${portalStep('Quote',!!quote&&quote.status==='Accepted',quote?quote.status:'Waiting')}
            ${portalStep('Contract',!!contract&&contract.status==='Signed',contract?contract.status:'Waiting')}
            ${portalStep('Music Planner',Object.keys(planner).length>0,Object.keys(planner).length?'In progress':'Not started')}
            ${portalStep('Final Timeline',Object.keys(state.forms.timeline||{}).length>0,Object.keys(state.forms.timeline||{}).length?'In progress':'Not started')}
          </div>
        </article>
        <article class="portal-card">
          <div class="portal-card-head"><div><small>Next step</small><h2>${nextPortalStep()}</h2></div><span class="portal-spark">✦</span></div>
          <p>${nextPortalMessage()}</p>
          <button class="btn primary" data-portal-action>${nextPortalButton()}</button>
        </article>
      </div>
      <div class="portal-column">
        <article class="portal-card">
          <div class="portal-card-head"><div><small>Payments</small><h2>Balance</h2></div><span class="status-chip ${balance<=0&&invoice?'green':'gold'}">${invoice?(balance<=0?'Paid':'Due'):'Pending'}</span></div>
          ${invoice?`<div class="portal-money"><div><small>Invoice total</small><strong>${moneyCents(invoiceTotal(invoice))}</strong></div><div><small>Paid</small><strong>${moneyCents(paid)}</strong></div><div><small>Balance</small><strong>${moneyCents(balance)}</strong></div></div>`:'<div class="portal-empty">Your invoice will appear here when it is ready.</div>'}
          ${invoice&&balance>0?portalPaymentButtons(invoice):''}
        </article>
        <article class="portal-card">
          <div class="portal-card-head"><div><small>Documents</small><h2>Your Files</h2></div></div>
          <div class="portal-documents">
            ${portalDocument('Quote',quote?quote.number:'Not available',!!quote)}
            ${portalDocument('Contract',contract?contract.number:'Not available',!!contract)}
            ${portalDocument('Invoice',invoice?invoice.number:'Not available',!!invoice)}
            ${portalDocument('Event Timeline',Object.keys(state.forms.timeline||{}).length?'Available':'Not available',Object.keys(state.forms.timeline||{}).length>0)}
          </div>
        </article>
        <article class="portal-card portal-contact">
          <small>Need help?</small><h2>Contact ${escapeHtml(businessSettings.businessName||'your event company')}</h2>
          <p>${escapeHtml(businessSettings.contactEmail||businessSettings.contactPhone||'Contact information will appear here.')}</p>
        </article>
      </div>
    </section>
  </section>`;
  const copy=document.querySelector('[data-copy-portal]');
  if(copy)copy.addEventListener('click',async()=>{const text=`${businessSettings.businessName||'Event Portal'} — ${e.bookingRef} — Access code ${portal.accessCode}`;try{await navigator.clipboard.writeText(text);toast('Portal access details copied')}catch(err){toast('Could not copy access details')}});
  const action=document.querySelector('[data-portal-action]');
  if(action)action.addEventListener('click',()=>{const target=nextPortalModule();if(target){state.active=target;appView='workspace';shell()}});
  bindWorkflowActions();
  bindPortalPaymentButtons();
}
function portalStep(label,done,status){
  return `<div class="portal-step ${done?'done':''}"><span>${done?'✓':'○'}</span><div><strong>${label}</strong><small>${escapeHtml(status)}</small></div></div>`;
}
function nextPortalModule(){
  if(!Object.keys(activeConsultation()).length)return state.forms.corporate?'corporate':state.forms.private?'private':'wedding';
  if(!portalQuote())return'quote';
  if(!portalContract())return'contract';
  if(!Object.keys(state.forms['wedding-planner']||{}).length)return'wedding-planner';
  if(!Object.keys(state.forms.timeline||{}).length)return'timeline';
  return null;
}
function nextPortalStep(){
  const module=nextPortalModule();
  const labels={wedding:'Complete your consultation',corporate:'Complete your consultation',private:'Complete your consultation',quote:'Review your quote',contract:'Review your contract','wedding-planner':'Complete your music planner',timeline:'Review your timeline'};
  return labels[module]||'You’re all caught up';
}
function nextPortalMessage(){
  const module=nextPortalModule();
  if(module==='wedding'||module==='corporate'||module==='private')return'Tell us the essential details so your entertainment company can prepare an accurate plan.';
  if(module==='quote')return'Your pricing proposal will be available here once it is prepared.';
  if(module==='contract')return'Review your agreement and confirm the details for your event.';
  if(module==='wedding-planner')return'Add your special songs, must-play requests and do-not-play selections.';
  if(module==='timeline')return'Check the event flow and confirm the timing of important moments.';
  return'Your event information is up to date.';
}
function nextPortalButton(){return nextPortalModule()?'Continue':'View Event Details'}
function portalDocument(label,value,available){
  return `<div class="${available?'available':''}"><span>${available?'▤':'○'}</span><div><strong>${label}</strong><small>${escapeHtml(value)}</small></div><em>${available?'Ready':'Pending'}</em></div>`;
}
function portalPaymentButtons(invoice){
  return `<div class="portal-payments">
    ${businessSettings.venmoHandle?`<button class="btn primary full" data-pay-venmo>Pay with Venmo</button>`:''}
    ${businessSettings.cardPaymentUrl?`<button class="btn full" data-pay-card>Pay with Card</button>`:''}
    ${!businessSettings.venmoHandle&&!businessSettings.cardPaymentUrl?'<small>Payment options will appear after the business adds them in Settings.</small>':''}
    <button class="text-button" data-payment-submitted="${invoice.id}">I completed a payment</button>
  </div>`;
}
function bindPortalPaymentButtons(){
  const venmo=document.querySelector('[data-pay-venmo]');
  if(venmo)venmo.addEventListener('click',()=>toast(`Pay ${businessSettings.venmoHandle} and include event reference ${state.bookingId}`));
  const card=document.querySelector('[data-pay-card]');
  if(card)card.addEventListener('click',()=>window.open(businessSettings.cardPaymentUrl,'_blank','noopener'));
  document.querySelectorAll('[data-payment-submitted]').forEach(b=>b.addEventListener('click',()=>{const invoice=crmInvoices.find(i=>i.id===b.dataset.paymentSubmitted);if(!invoice)return;crmPayments.unshift({id:crypto.randomUUID(),invoiceId:invoice.id,amountCents:invoiceBalance(invoice),method:businessSettings.venmoHandle?'Venmo':'Other',status:'Submitted',reference:state.bookingId,note:'Client reported payment through portal.',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});saveLocalRows(PAYMENTS_KEY,crmPayments);renderClientPortal();toast('Payment submitted for verification')}));
}
function renderSettings(){
  const main=document.querySelector('#main');
  main.innerHTML=`<section class="dash-hero compact-hero"><div><div class="eyebrow">Business Setup</div><h1>Settings</h1><p>Your business name appears on client-facing portals and documents. Galaxy Cue branding stays consistent.</p></div></section>
  <form id="businessSettingsForm" class="settings-layout">
    <section class="settings-card"><div class="section-title"><div><small>Identity</small><h2>Business Information</h2></div></div>
      <label><span>Business / DJ / entertainment name *</span><input name="businessName" required value="${escapeHtml(businessSettings.businessName||'')}"></label>
      <div class="editor-grid"><label><span>Contact email</span><input type="email" name="contactEmail" value="${escapeHtml(businessSettings.contactEmail||'')}"></label><label><span>Phone</span><input name="contactPhone" value="${escapeHtml(businessSettings.contactPhone||'')}"></label></div>
      <label><span>Website</span><input name="website" value="${escapeHtml(businessSettings.website||'')}" placeholder="https://example.com"></label>
    </section>
    <section class="settings-card"><div class="section-title"><div><small>Client payments</small><h2>Payment Methods</h2></div></div>
      <label><span>Venmo Business handle</span><input name="venmoHandle" value="${escapeHtml(businessSettings.venmoHandle||'')}" placeholder="@yourbusiness"></label>
      <label><span>Hosted card-payment URL</span><input name="cardPaymentUrl" value="${escapeHtml(businessSettings.cardPaymentUrl||'')}" placeholder="https://secure-payment-page.example"></label>
      <label><span>Payment instructions</span><textarea name="paymentInstructions" rows="5">${escapeHtml(businessSettings.paymentInstructions||'')}</textarea></label>
      <p class="settings-note">Galaxy Cue never collects or stores card numbers. Credit-card payments should open a secure hosted checkout page.</p>
    </section>
    <section class="settings-card settings-preview"><div class="section-title"><div><small>Preview</small><h2>Client-facing identity</h2></div></div>
      <div class="business-preview"><span>${escapeHtml((businessSettings.businessName||'G').charAt(0).toUpperCase())}</span><div><strong>${escapeHtml(businessSettings.businessName||'Your Entertainment Company')}</strong><small>Powered by Galaxy Cue</small></div></div>
      <button class="btn full" type="button" data-preview-portal>Preview Client Portal</button>
    </section>
    <section class="settings-card build-card"><div class="section-title"><div><small>About this deployment</small><h2>Build Information</h2></div></div>
      <div class="build-grid"><div><span>Version</span><strong>${escapeHtml(galaxyCueRuntime.version)}</strong></div><div><span>Build</span><strong>${escapeHtml(galaxyCueRuntime.build)}</strong></div><div><span>Release</span><strong>${escapeHtml(galaxyCueRuntime.release)}</strong></div><div><span>Mode</span><strong>${currentUser?'Cloud':'Local'}</strong></div></div>
      <button class="btn full" type="button" data-action="force-refresh">Clear Cache & Reload Latest Build</button>
      <p class="settings-note">The version button in the top-right always shows the JavaScript build currently running in this browser.</p>
    </section>
    <button class="btn primary settings-save" type="submit">Save Business Settings</button>
  </form>`;
  const form=document.querySelector('#businessSettingsForm');
  if(form)form.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(form);businessSettings={businessName:String(fd.get('businessName')||''),contactEmail:String(fd.get('contactEmail')||''),contactPhone:String(fd.get('contactPhone')||''),website:String(fd.get('website')||''),venmoHandle:String(fd.get('venmoHandle')||''),cardPaymentUrl:String(fd.get('cardPaymentUrl')||''),paymentInstructions:String(fd.get('paymentInstructions')||'')};saveBusinessSettings(businessSettings);if(currentUser&&activeBusinessId()){const {error}=await saveCloudBusinessSettings(businessSettings,activeBusinessId());if(error)return toast(`Saved locally — cloud sync failed: ${error.message}`)}renderSettings();toast(currentUser?'Business settings saved and synced':'Business settings saved locally')});
  const preview=document.querySelector('[data-preview-portal]');if(preview)preview.addEventListener('click',()=>{appView='client-portal';portalPreviewMode=true;shell()});
}

function renderSectionView(title,description,icon){
  const main=document.querySelector('#main');
  main.innerHTML=`<section class="dash-hero compact-hero">
    <div><div class="eyebrow">Galaxy Cue</div><h1>${title}</h1><p>${description}</p></div>
    <div class="hero-actions"><button class="btn primary" data-action="new-booking">＋ New Event</button></div>
  </section>
  <section class="section-placeholder">
    <div class="placeholder-icon">${icon}</div>
    <h2>${title} is ready for the next backend sprint.</h2>
    <p>The navigation and design system are now in place. This module will connect to the permanent Galaxy Cue database without changing the interface again.</p>
    <button class="btn" data-view="dashboard">Return to Dashboard</button>
  </section>`;
  bindDashboardActions();
}

async function renderCalendarView(){
  const main=document.querySelector('#main');
  main.innerHTML='<div class="dashboard-loading">Loading calendar…</div>';
  await refreshCloudBookings();
  drawCalendarView();
}
function calendarIso(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function calendarStartOfWeek(date){
  const copy=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  copy.setDate(copy.getDate()-((copy.getDay()+6)%7));
  return copy;
}
function calendarEventClass(event){
  const type=String(event?.event_type||'').toLowerCase();
  if(type.includes('wedding'))return'wedding';
  if(type.includes('corporate'))return'corporate';
  if(type.includes('private')||type.includes('party'))return'private';
  if(type.includes('club'))return'club';
  return'general';
}
function calendarRawTimes(event){
  const data=event?.event_data||event?.booking_data||{};
  const forms=data?.forms||{};
  const consultation=forms.wedding||forms.corporate||forms.private||{};
  const details=data?.eventDetails||data?.event_details||{};
  const start=event?.start_time||event?.event_time||event?.startTime||details.startTime||consultation.startTime||consultation.ceremonyTime||'';
  const finish=event?.end_time||event?.endTime||details.endTime||consultation.endTime||'';
  const setupStart=event?.setup_start_time||event?.setupStartTime||details.setupStartTime||consultation.setupStartTime||'';
  const breakdownEnd=event?.breakdown_end_time||event?.breakdownEndTime||details.breakdownEndTime||consultation.breakdownEndTime||'';
  return {
    start:String(start||'').slice(0,5),
    end:String(finish||'').slice(0,5),
    setupStart:String(setupStart||'').slice(0,5),
    breakdownEnd:String(breakdownEnd||'').slice(0,5)
  };
}
function calendarTimeMinutes(raw){
  const match=String(raw||'').match(/^(\d{1,2}):(\d{2})/);
  if(!match)return null;
  return Math.max(0,Math.min(1440,Number(match[1])*60+Number(match[2])));
}
function calendarFormatTime(raw){
  const mins=calendarTimeMinutes(raw);
  if(mins===null)return'';
  const hour=Math.floor(mins/60),minute=String(mins%60).padStart(2,'0');
  return `${hour%12||12}:${minute} ${hour>=12?'PM':'AM'}`;
}
function calendarEventTime(event){
  const {start,end}=calendarRawTimes(event);
  if(!start)return'';
  return end?`${calendarFormatTime(start)} – ${calendarFormatTime(end)}`:calendarFormatTime(start);
}
function calendarEventButton(event,compact=false){
  const ref=escapeHtml(event.booking_ref||'');
  const client=escapeHtml(event.client_name||'Unnamed Event');
  const type=escapeHtml(event.event_type||'Event');
  const venue=escapeHtml(event.venue_name||'Venue not set');
  const time=escapeHtml(calendarEventTime(event));
  return `<button class="calendar-event ${calendarEventClass(event)} ${compact?'compact-event':''}" data-open-booking="${ref}" title="${client} · ${type}">
    <strong>${time?`<i>${time}</i> `:''}${client}</strong><span>${type}${compact?'':` · ${venue}`}</span>
  </button>`;
}
function calendarRangeEvents(start,end){
  const startIso=calendarIso(start),endIso=calendarIso(end);
  return cloudBookings.filter(event=>event.event_date&&event.event_date>=startIso&&event.event_date<=endIso)
    .sort((a,b)=>`${a.event_date||''} ${calendarRawTimes(a).start}`.localeCompare(`${b.event_date||''} ${calendarRawTimes(b).start}`));
}
function drawCalendarMonth(){
  const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth();
  const first=new Date(year,month,1),last=new Date(year,month+1,0);
  const gridStart=calendarStartOfWeek(first);
  const monthEvents=calendarRangeEvents(first,last);
  const todayIso=calendarIso(new Date());
  let cells='';
  for(let index=0;index<42;index++){
    const date=new Date(gridStart);date.setDate(gridStart.getDate()+index);
    const iso=calendarIso(date);
    const inMonth=date.getMonth()===month;
    const dayEvents=cloudBookings.filter(event=>event.event_date===iso).sort((a,b)=>calendarRawTimes(a).start.localeCompare(calendarRawTimes(b).start));
    cells+=`<div class="calendar-cell ${inMonth?'':'outside'} ${iso===todayIso?'today':''}" data-calendar-date="${iso}">
      <button class="calendar-day-head" data-day-view="${iso}" aria-label="Open ${date.toLocaleDateString('en-US',{month:'long',day:'numeric'})}"><span>${date.getDate()}</span>${iso===todayIso?'<em>Today</em>':''}</button>
      <div class="calendar-events">${dayEvents.slice(0,3).map(event=>calendarEventButton(event,true)).join('')}${dayEvents.length>3?`<button class="more-events" data-day-view="${iso}">+${dayEvents.length-3} more</button>`:''}</div>
    </div>`;
  }
  const upcoming=monthEvents.slice(0,8);
  return `<div class="calendar-layout"><section class="calendar-card"><div class="calendar-weekdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>`<span>${day}</span>`).join('')}</div><div class="calendar-grid">${cells}</div></section>
  <aside class="calendar-agenda"><div class="section-title"><div><small>This month</small><h2>Agenda</h2></div></div><div class="agenda-list">${upcoming.length?upcoming.map(event=>{
    const date=eventDateValue(event);return `<button class="agenda-item" data-open-booking="${escapeHtml(event.booking_ref||'')}"><span class="agenda-date"><strong>${date?.getDate()||'—'}</strong><span>${date?.toLocaleDateString('en-US',{month:'short'})||''}</span></span><span><strong>${escapeHtml(event.client_name||'Unnamed Event')}</strong><small>${escapeHtml(event.event_type||'Event')} · ${escapeHtml(event.venue_name||'Venue not set')}</small></span><span>→</span></button>`;
  }).join(''):'<div class="empty-state compact">No events this month.</div>'}</div></aside></div>`;
}
const CALENDAR_START_HOUR=0;
const CALENDAR_END_HOUR=30;
const CALENDAR_HOUR_HEIGHT=64;
function calendarTimelineHours(){
  return Array.from({length:CALENDAR_END_HOUR-CALENDAR_START_HOUR+1},(_,i)=>CALENDAR_START_HOUR+i);
}
function calendarTimelineLabel(hour){
  const normalized=hour%24;
  const label=`${normalized%12||12} ${normalized>=12?'PM':'AM'}`;
  return hour>=24?`${label} (+1)`:label;
}
function calendarNormalizeOvernight(start,end){
  if(start===null||end===null)return {start,end};
  return {start,end:end<=start?end+1440:end};
}
function calendarTimedLayout(events){
  const dayStart=CALENDAR_START_HOUR*60,dayEnd=CALENDAR_END_HOUR*60;
  const jobs=[];
  events.forEach((event,index)=>{
    const times=calendarRawTimes(event);
    const eventStart=calendarTimeMinutes(times.start);
    const eventEnd=calendarTimeMinutes(times.end);
    const setupStart=calendarTimeMinutes(times.setupStart);
    const breakdownEnd=calendarTimeMinutes(times.breakdownEnd);
    if(eventStart===null)return;

    const normalizedEvent=calendarNormalizeOvernight(eventStart,eventEnd===null?eventStart+120:eventEnd);
    let normalizedSetup=setupStart===null?normalizedEvent.start:setupStart;
    while(normalizedSetup>normalizedEvent.start)normalizedSetup-=1440;
    let normalizedBreakdown=breakdownEnd===null?normalizedEvent.end:breakdownEnd;
    while(normalizedBreakdown<=normalizedEvent.end)normalizedBreakdown+=1440;

    const jobStart=Math.min(normalizedSetup,normalizedEvent.start);
    const jobEnd=Math.max(normalizedBreakdown,normalizedEvent.end);
    jobs.push({
      event,index,
      start:jobStart,end:jobEnd,
      setupStart:jobStart,setupEnd:normalizedEvent.start,
      eventStart:normalizedEvent.start,eventEnd:normalizedEvent.end,
      breakdownStart:normalizedEvent.end,breakdownEnd:jobEnd
    });
  });

  const clipped=jobs.map(item=>({
    ...item,
    start:Math.max(dayStart,Math.min(dayEnd-15,item.start)),
    end:Math.max(item.start+15,Math.min(dayEnd,item.end))
  })).filter(item=>item.end>dayStart&&item.start<dayEnd);

  // Allocate lanes using the complete working window so each job remains one block.
  const sorted=[...clipped].sort((a,b)=>a.start-b.start||a.end-b.end);
  const laneEnds=[];
  sorted.forEach(item=>{
    let lane=laneEnds.findIndex(end=>end<=item.start);
    if(lane<0){lane=laneEnds.length;laneEnds.push(item.end)}else laneEnds[lane]=item.end;
    item.lane=lane;
  });
  const laneCount=Math.max(1,laneEnds.length);
  sorted.forEach(item=>item.laneCount=laneCount);
  return sorted;
}
function calendarTimelineEvent(item){
  const {event,start,end}=item;
  const dayStart=CALENDAR_START_HOUR*60;
  const top=((start-dayStart)/60)*CALENDAR_HOUR_HEIGHT;
  const height=Math.max(20,((end-start)/60)*CALENDAR_HOUR_HEIGHT);
  const laneWidth=100/(item.laneCount||1);
  const laneLeft=(item.lane||0)*laneWidth;
  const total=Math.max(15,end-start);
  const segment=(from,to,phase,label)=>{
    const clippedStart=Math.max(start,from);
    const clippedEnd=Math.min(end,to);
    if(clippedEnd<=clippedStart)return '';
    const segmentTop=((clippedStart-start)/total)*100;
    const segmentHeight=((clippedEnd-clippedStart)/total)*100;
    const range=`${calendarFormatExtendedMinutes(from)} – ${calendarFormatExtendedMinutes(to)}`;
    return `<span class="timeline-job-phase ${phase}" style="top:${segmentTop}%;height:${segmentHeight}%"><strong>${label}</strong><small>${escapeHtml(range)}</small></span>`;
  };
  const workingRange=`${calendarFormatExtendedMinutes(item.setupStart)} – ${calendarFormatExtendedMinutes(item.breakdownEnd)}`;
  const clientName=event.client_name||'Unnamed Client';
  const eventType=event.event_type||'Event';
  const location=event.venue_name||event.location||event.venue||'Location not set';
  return `<button class="timeline-job ${calendarEventClass(event)}" style="top:${top}px;height:${height}px;left:calc(${laneLeft}% + 4px);right:auto;width:calc(${laneWidth}% - 8px)" data-open-booking="${escapeHtml(event.booking_ref||'')}" title="${escapeHtml(`${workingRange} · ${clientName} · ${eventType} · ${location}`)}">
    ${segment(item.setupStart,item.setupEnd,'setup','Setup')}
    ${segment(item.eventStart,item.eventEnd,'event','Event')}
    ${segment(item.breakdownStart,item.breakdownEnd,'breakdown','Breakdown')}
    <span class="timeline-job-label">
      <strong class="timeline-job-range">${escapeHtml(workingRange)}</strong>
      <span class="timeline-job-client">${escapeHtml(clientName)}</span>
      <small class="timeline-job-meta">${escapeHtml(eventType)} · ${escapeHtml(location)}</small>
    </span>
  </button>`;
}
function calendarFormatExtendedMinutes(minutes){
  const nextDay=minutes>=1440;
  const normalized=((minutes%1440)+1440)%1440;
  const hour=Math.floor(normalized/60),minute=String(normalized%60).padStart(2,'0');
  return `${hour%12||12}:${minute} ${hour>=12?'PM':'AM'}${nextDay?' (+1)':''}`;
}
function drawCalendarWeek(){
  const start=calendarStartOfWeek(calendarCursor);
  const todayIso=calendarIso(new Date());
  const hours=calendarTimelineHours();
  const headers=[];
  const dayColumns=[];
  for(let i=0;i<7;i++){
    const date=new Date(start);date.setDate(start.getDate()+i);
    const iso=calendarIso(date);
    const events=cloudBookings.filter(event=>event.event_date===iso).sort((a,b)=>calendarRawTimes(a).start.localeCompare(calendarRawTimes(b).start));
    const timed=calendarTimedLayout(events);
    const untimed=events.filter(event=>calendarTimeMinutes(calendarRawTimes(event).start)===null);
    headers.push(`<button class="timeline-day-heading ${iso===todayIso?'today':''}" data-day-view="${iso}"><small>${date.toLocaleDateString('en-US',{weekday:'short'})}</small><strong>${date.getDate()}</strong></button>`);
    dayColumns.push(`<div class="timeline-day-column ${iso===todayIso?'today':''}">${hours.slice(0,-1).map(()=>'<div class="timeline-hour-line"></div>').join('')}${timed.map(calendarTimelineEvent).join('')}${untimed.length?`<div class="timeline-untimed">${untimed.map(event=>calendarEventButton(event,true)).join('')}</div>`:''}</div>`);
  }
  return `<section class="calendar-card timeline-calendar"><div class="timeline-scroll"><div class="timeline-header"><span class="timeline-header-corner"></span>${headers.join('')}</div><div class="timeline-grid"><div class="timeline-labels">${hours.map(hour=>`<span>${calendarTimelineLabel(hour)}</span>`).join('')}</div>${dayColumns.join('')}</div></div></section>`;
}
function drawCalendarDay(){
  const iso=calendarIso(calendarSelectedDate||calendarCursor);
  const events=cloudBookings.filter(event=>event.event_date===iso).sort((a,b)=>calendarRawTimes(a).start.localeCompare(calendarRawTimes(b).start));
  const timed=calendarTimedLayout(events);
  const untimed=events.filter(event=>calendarTimeMinutes(calendarRawTimes(event).start)===null);
  const hours=calendarTimelineHours();
  return `<section class="calendar-day-view timeline-day-layout"><div class="day-date-card"><small>${calendarSelectedDate.toLocaleDateString('en-US',{weekday:'long'})}</small><strong>${calendarSelectedDate.getDate()}</strong><span>${calendarSelectedDate.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span></div><div class="calendar-card timeline-calendar day-timeline"><div class="timeline-scroll"><div class="timeline-grid single-day"><div class="timeline-labels">${hours.map(hour=>`<span>${calendarTimelineLabel(hour)}</span>`).join('')}</div><div class="timeline-day-column">${hours.slice(0,-1).map(()=>'<div class="timeline-hour-line"></div>').join('')}${timed.map(calendarTimelineEvent).join('')}${untimed.length?`<div class="timeline-untimed">${untimed.map(event=>calendarEventButton(event,true)).join('')}</div>`:''}</div></div></div></div></section>`;
}
function calendarHeaderLabel(){
  if(calendarViewMode==='month')return calendarCursor.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  if(calendarViewMode==='week'){
    const start=calendarStartOfWeek(calendarCursor),end=new Date(start);end.setDate(start.getDate()+6);
    return `${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
  }
  return calendarSelectedDate.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
}
function drawCalendarView(){
  const main=document.querySelector('#main');
  if(!main)return;
  const displayed=calendarViewMode==='month'?cloudBookings.filter(event=>event.event_date?.startsWith(`${calendarCursor.getFullYear()}-${String(calendarCursor.getMonth()+1).padStart(2,'0')}`)):calendarViewMode==='week'?calendarRangeEvents(calendarStartOfWeek(calendarCursor),new Date(calendarStartOfWeek(calendarCursor).getTime()+6*86400000)):cloudBookings.filter(event=>event.event_date===calendarIso(calendarSelectedDate));
  const body=calendarViewMode==='month'?drawCalendarMonth():calendarViewMode==='week'?drawCalendarWeek():drawCalendarDay();
  main.innerHTML=`<section class="dash-hero compact-hero"><div><div class="eyebrow">Schedule</div><h1>Calendar</h1><p>Review every event by month, week, or day and open its workspace instantly.</p></div><div class="hero-actions"><button class="btn primary" data-action="new-booking">＋ New Event</button></div></section>
  <div class="calendar-toolbar"><div class="calendar-nav-buttons"><button class="btn compact" data-calendar-step="-1">←</button><button class="btn compact" data-calendar-today>Today</button><button class="btn compact" data-calendar-step="1">→</button></div><h2>${escapeHtml(calendarHeaderLabel())}</h2><div class="calendar-toolbar-right"><div class="calendar-view-switch" role="group" aria-label="Calendar view">${['month','week','day'].map(mode=>`<button class="${calendarViewMode===mode?'active':''}" data-calendar-mode="${mode}">${mode[0].toUpperCase()+mode.slice(1)}</button>`).join('')}</div><div class="calendar-count">${displayed.length} event${displayed.length===1?'':'s'}</div></div></div>${body}`;
  document.querySelectorAll('[data-calendar-step]').forEach(button=>button.addEventListener('click',()=>{
    const direction=Number(button.dataset.calendarStep);
    if(calendarViewMode==='month')calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+direction,1);
    else if(calendarViewMode==='week'){calendarCursor=new Date(calendarCursor);calendarCursor.setDate(calendarCursor.getDate()+direction*7);calendarSelectedDate=new Date(calendarCursor);}
    else{calendarSelectedDate=new Date(calendarSelectedDate);calendarSelectedDate.setDate(calendarSelectedDate.getDate()+direction);calendarCursor=new Date(calendarSelectedDate);}
    drawCalendarView();
  }));
  document.querySelector('[data-calendar-today]')?.addEventListener('click',()=>{calendarCursor=new Date();calendarSelectedDate=new Date();drawCalendarView()});
  document.querySelectorAll('[data-calendar-mode]').forEach(button=>button.addEventListener('click',()=>{calendarViewMode=button.dataset.calendarMode;if(calendarViewMode==='day')calendarSelectedDate=new Date(calendarCursor);drawCalendarView()}));
  document.querySelectorAll('[data-day-view]').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();const [year,month,day]=button.dataset.dayView.split('-').map(Number);calendarSelectedDate=new Date(year,month-1,day);calendarCursor=new Date(calendarSelectedDate);calendarViewMode='day';drawCalendarView()}));
  document.querySelectorAll('[data-open-booking]').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();openCloudBooking(button.dataset.openBooking)}));
  bindDashboardActions();
}

async function renderBookingManager(){
  const main=document.querySelector('#main');
  main.innerHTML='<div class="dashboard-loading">Loading business events…</div>';
  await refreshEventsFromCloud();
  drawBookingManager();
}
function drawBookingManager(){
  const main=document.querySelector('#main');
  const query=bookingSearch.trim().toLowerCase();

  let filtered=cloudBookings.filter(event=>{
    const eventType=String(event.event_type||'').toLowerCase();
    const status=String(event.status||'').toLowerCase();
    const matchFilter=
      bookingFilter==='all'||
      eventType.includes(bookingFilter)||
      status.includes(bookingFilter);
    const haystack=[
      event.client_name,event.client_email,event.booking_ref,event.venue_name,
      event.event_type,event.status,event.event_date
    ].join(' ').toLowerCase();
    return matchFilter&&haystack.includes(query);
  });

  filtered.sort((a,b)=>{
    if(bookingSort==='date-desc')return String(b.event_date||'').localeCompare(String(a.event_date||''));
    if(bookingSort==='name')return String(a.client_name||'').localeCompare(String(b.client_name||''));
    if(bookingSort==='updated')return String(b.updated_at||'').localeCompare(String(a.updated_at||''));
    return String(a.event_date||'9999').localeCompare(String(b.event_date||'9999'));
  });

  const selected=filtered.find(event=>event.booking_ref===selectedBookingRef)||filtered[0]||null;
  selectedBookingRef=selected?selected.booking_ref:null;

  main.innerHTML=`<section class="dash-hero compact-hero"><div><div class="eyebrow">Event Management</div><h1>Events</h1><p>Search by client, venue, date, status or event reference and reopen any consultation.</p></div><div class="hero-actions"><span class="sync-chip">${currentUser?eventCloudStatus:'Local only'}</span><button class="btn primary" data-action="new-booking">＋ New Event</button></div></section>
  <div class="crm-controls event-controls-v42">
    <div class="search-box">⌕<input id="bookingSearch" value="${escapeHtml(bookingSearch)}" placeholder="Search client, venue, date or reference"></div>
    <select id="bookingSort" class="crm-sort">
      <option value="date-asc" ${bookingSort==='date-asc'?'selected':''}>Event date ↑</option>
      <option value="date-desc" ${bookingSort==='date-desc'?'selected':''}>Event date ↓</option>
      <option value="updated" ${bookingSort==='updated'?'selected':''}>Recently updated</option>
      <option value="name" ${bookingSort==='name'?'selected':''}>Client name</option>
    </select>
  </div>
  <div class="filter-row crm-filter-row">${[
    ['all','All'],['wedding','Weddings'],['corporate','Corporate'],['private','Private'],
    ['draft','Draft'],['confirmed','Confirmed'],['accepted','Accepted'],['complete','Complete'],['cancel','Cancelled']
  ].map(([id,label])=>`<button class="${bookingFilter===id?'active':''}" data-filter="${id}">${label}</button>`).join('')}</div>
  <div class="crm-split">
    <div class="booking-list-panel">
      <div class="list-panel-head"><strong>${filtered.length} Event${filtered.length===1?'':'s'}</strong><small>${query||bookingFilter!=='all'?'Filtered results':currentUser?'All cloud events':'All local events'}</small></div>
      <div class="booking-card-list">${filtered.length?filtered.map(event=>bookingCard(event,selectedBookingRef)).join(''):'<div class="empty-state table-empty"><strong>No matching events.</strong><br>Try another search or status filter.</div>'}</div>
    </div>
    <aside class="booking-preview-panel">${selected?bookingPreview(selected):`<div class="empty-state">Select an event to see its details.</div>`}</aside>
  </div>`;

  const search=document.querySelector('#bookingSearch');
  if(search)search.addEventListener('input',event=>{
    bookingSearch=event.target.value;
    drawBookingManager();
    requestAnimationFrame(()=>{
      const input=document.querySelector('#bookingSearch');
      if(input){
        input.focus();
        input.setSelectionRange(input.value.length,input.value.length);
      }
    });
  });
  document.querySelector('#bookingSort')?.addEventListener('change',event=>{
    bookingSort=event.target.value;
    drawBookingManager();
  });
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    bookingFilter=button.dataset.filter;
    drawBookingManager();
  }));
  document.querySelectorAll('[data-select-booking]').forEach(button=>button.addEventListener('click',()=>{
    selectedBookingRef=button.dataset.selectBooking;
    drawBookingManager();
  }));
  bindDashboardActions();
}
function bookingCard(b,selectedRef){
  return `<button class="booking-card ${b.booking_ref===selectedRef?'selected':''}" data-select-booking="${b.booking_ref}">
    <div class="booking-card-top"><div><strong>${escapeHtml(b.client_name||'Unnamed Client')}</strong><small>${escapeHtml(b.booking_ref)}</small></div><span class="status-chip ${statusTone(b.status)}">${escapeHtml(b.status||'Draft')}</span></div>
    <div class="booking-card-meta"><span>${escapeHtml(eventTypeLabel(b.event_type))}</span><span>${formatEventDate(b.event_date)}</span></div>
    <div class="booking-card-venue">${escapeHtml(b.venue_name||'Venue not set')}</div>
  </button>`;
}
function eventClientSubmission(event){return event?.event_data?.documents?.eventForm||event?.booking_data?.documents?.eventForm||null}
function eventBookingRequestCopy(event){
  const data=event?.event_data||event?.booking_data||{};
  return data?.documents?.bookingRequest||data?.forms?.[data.active||'wedding']||{};
}
function businessDocumentRows(payload={}){
  const labels={primaryClient:'Primary contact',company:'Company',email:'Email',phone:'Phone',eventDate:'Event date',eventType:'Event type',guestCount:'Guest count',venueName:'Venue name',venueAddress:'Venue address',startTime:'Start time',endTime:'End time',requestedServices:'Requested services',additionalNotes:'Notes'};
  return Object.entries(payload).filter(([,value])=>value!==''&&value!==null&&value!==undefined).map(([key,value])=>`<div class="lead-review-grid"><div><small>${escapeHtml(labels[key]||key.replace(/([A-Z])/g,' $1'))}</small><strong>${escapeHtml(Array.isArray(value)?value.join(', '):String(value))}</strong></div></div>`).join('')||'<p>No saved information is available.</p>';
}
function openBusinessEventDocument(ref,type='event'){
  const event=cloudBookings.find(row=>row.booking_ref===ref)||loadLocalEvents().find(row=>row.booking_ref===ref);
  if(!event)return toast('Event could not be found');
  const submission=eventClientSubmission(event);
  const title=type==='booking'?'Booking Request':'Full Event Workbook';
  const payload=type==='booking'?eventBookingRequestCopy(event):submission?.payload;
  if(type==='event'&&!submission)return toast('The client has not submitted the Event Booking Form yet.');
  const modal=document.createElement('div');modal.className='modal';modal.innerHTML=`<div class="modal-panel lead-review-panel"><button class="modal-close" data-close-event-document aria-label="Close">×</button><div class="eyebrow">Event Document</div><h2>${escapeHtml(title)}</h2><p>${type==='event'&&submission?.submittedAt?`Submitted ${new Date(submission.submittedAt).toLocaleString()}`:'Read-only event copy'}</p><div class="business-document-copy">${businessDocumentRows(payload||{})}</div><div class="lead-actions"><button class="btn" data-print-event-document>Print / Save PDF</button><button class="btn primary" data-close-event-document>Done</button></div></div>`;
  document.body.appendChild(modal);const close=()=>modal.remove();modal.querySelectorAll('[data-close-event-document]').forEach(b=>b.onclick=close);modal.querySelector('[data-print-event-document]').onclick=()=>window.print();modal.addEventListener('click',e=>{if(e.target===modal)close()});
}
function bookingPreview(event){
  const linkedClient=(event.client_id?crmClients.find(client=>client.id===event.client_id):null)||findMatchingClient({email:event.client_email,name:event.client_name});
  return `<div class="preview-eyebrow">Event Preview</div>
    <h2>${escapeHtml(event.client_name||'Unnamed Client')}</h2>
    <p>${escapeHtml(eventTypeLabel(event.event_type))}</p>
    <div class="preview-date">${formatEventDate(event.event_date)}</div>
    <div class="preview-grid">
      <div><small>Venue</small><strong>${escapeHtml(event.venue_name||'Not set')}</strong></div>
      <div><small>Status</small><strong>${escapeHtml(event.status||'Draft')}</strong></div>
      <div><small>Email</small><strong>${escapeHtml(event.client_email||'Not set')}</strong></div>
      <div><small>CRM client</small><strong>${linkedClient?'Linked':'Not linked'}</strong></div>
      <div><small>Updated</small><strong>${event.updated_at?new Date(event.updated_at).toLocaleDateString():'—'}</strong></div>
      <div><small>Reference</small><strong>${escapeHtml(event.booking_ref)}</strong></div>
    </div>
    <div class="preview-progress"><div><span>Event readiness</span><strong>${bookingReadiness(event)}%</strong></div><div class="mini-progress"><span style="width:${bookingReadiness(event)}%"></span></div></div>
    <button class="btn primary full" data-create-event-quote="${event.booking_ref}">Create / Send Quote</button>
    <button class="btn full preview-secondary" data-view-event-document="${event.booking_ref}" ${eventClientSubmission(event)?'':'disabled'}>${eventClientSubmission(event)?'Review Full Event Workbook':'Event Workbook Pending'}</button>
    <button class="btn full preview-secondary" data-view-booking-document="${event.booking_ref}">View Booking Request Copy</button>
    <button class="btn full preview-secondary" data-open-booking="${event.booking_ref}">Open Event Workspace</button><button class="btn full preview-secondary" data-edit-booking="${event.booking_ref}">Edit Schedule / Client</button>
    ${linkedClient?`<button class="btn full preview-secondary" data-open-client="${linkedClient.id}">Open Client Profile</button>`:''}
    <button class="btn full preview-secondary" data-action="copy-reference" data-reference="${event.booking_ref}">Copy Event Reference</button>
    <button class="btn full danger-button" data-delete-booking="${event.booking_ref}">Delete Event</button>`;
}
function bookingReadiness(b){
  const data=b.booking_data||{},forms=data.forms||{};
  let score=0,total=6;
  if(b.client_name)score++;
  if(b.event_date)score++;
  if(b.venue_name)score++;
  if(forms.quote&&Object.keys(forms.quote).length)score++;
  if(forms.contract&&Object.keys(forms.contract).length)score++;
  if((data.completed||[]).length>=3)score++;
  return Math.round(score/total*100);
}
async function openCloudBooking(ref){
  if(!currentUser){
    const localEvent=loadLocalEvents().find(event=>event.booking_ref===ref);
    if(!localEvent?.booking_data)return toast('Local event data is empty');
    state=localEvent.booking_data;
    localStorage.setItem(KEY,JSON.stringify(state));
    selectedBookingRef=ref;
    appView='workspace';
    shell();
    toast(`Opened local event ${ref}`);
    return;
  }

  const {data,error}=await loadCloudEvent(ref,activeBusinessId());
  if(error)return toast(error.message);
  if(!data || !data.booking_data)return toast('Event data is empty');
  state=data.booking_data;
  localStorage.setItem(KEY,JSON.stringify(state));
  appView='workspace';
  shell();
  toast(`Opened event ${ref}`);
}
async function deleteEvent(ref){
  const event=cloudBookings.find(row=>row.booking_ref===ref)||loadLocalEvents().find(row=>row.booking_ref===ref);
  const label=event?.client_name?` for ${event.client_name}`:'';
  if(!confirm(`Delete this event${label}? This cannot be undone.`))return;

  if(currentUser){
    const {error}=await removeCloudEvent(ref,activeBusinessId());
    if(error)return toast(`Could not delete event: ${error.message}`);
    await refreshEventsFromCloud();
  }else{
    saveLocalEvents(loadLocalEvents().filter(row=>row.booking_ref!==ref));
    cloudBookings=loadLocalEvents();
  }

  if(state?.bookingId===ref){
    state={active:'wedding',bookingId:makeId(),forms:{},completed:[],updated:new Date().toISOString()};
    localStorage.setItem(KEY,JSON.stringify(state));
  }
  selectedBookingRef=null;
  drawBookingManager();
  toast('Event deleted');
}
function newBooking(){openEventModal()}
function createQuoteForEvent(ref){
  const event=cloudBookings.find(row=>row.booking_ref===ref)||loadLocalEvents().find(row=>row.booking_ref===ref);
  if(!event)return toast('Event could not be found');
  const existing=crmQuotes.find(q=>q.eventRef===ref);
  const quote=existing||{id:'',number:makeRecordNumber('Q'),eventRef:ref,clientName:event.client_name||'',eventName:event.event_type||'Event',status:'Draft',depositPercent:30,validUntil:'',notes:'',items:[{description:'DJ Service Package',quantity:1,unitPriceCents:0}]};
  appView='quotes';shell();
  requestAnimationFrame(()=>{selectedQuoteId=existing?.id||null;const panel=document.querySelector('.booking-preview-panel');if(panel){panel.innerHTML=quoteEditor(quote);bindQuoteEditor()}});
}
function bindDashboardActions(){
  document.querySelectorAll('[data-open-booking]').forEach(b=>b.addEventListener('click',()=>openCloudBooking(b.dataset.openBooking)));
  document.querySelectorAll('[data-view-event-document]').forEach(button=>button.addEventListener('click',()=>openBusinessEventDocument(button.dataset.viewEventDocument,'event')));
  document.querySelectorAll('[data-create-event-quote]').forEach(button=>button.addEventListener('click',()=>createQuoteForEvent(button.dataset.createEventQuote)));
  document.querySelectorAll('[data-view-booking-document]').forEach(button=>button.addEventListener('click',()=>openBusinessEventDocument(button.dataset.viewBookingDocument,'booking')));
  document.querySelectorAll('[data-edit-booking]').forEach(button=>button.addEventListener('click',()=>{
    const event=cloudBookings.find(row=>row.booking_ref===button.dataset.editBooking)||loadLocalEvents().find(row=>row.booking_ref===button.dataset.editBooking);
    if(!event)return toast('Event could not be found');
    openEventModal(null,event);
  }));
  document.querySelectorAll('[data-delete-booking]').forEach(button=>button.addEventListener('click',()=>deleteEvent(button.dataset.deleteBooking)));
  document.querySelectorAll('[data-action="new-booking"]').forEach(b=>b.addEventListener('click',newBooking));
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{appView=b.dataset.view;shell()}));
  document.querySelectorAll('[data-action="copy-reference"]').forEach(b=>b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(b.dataset.reference);toast('Event reference copied')}catch(e){toast('Could not copy reference')}}));
  document.querySelectorAll('[data-open-client]').forEach(button=>button.addEventListener('click',()=>{
    selectedClientId=button.dataset.openClient;
    appView='clients';
    shell();
  }));
  document.querySelectorAll('[data-action="import-local-cloud"]').forEach(b=>b.addEventListener('click',migrateLocalClientsAndEvent));
}

function workspaceOverview(){
  const d=activeConsultation(),q=state.forms.quote||{},c=state.forms.contract||{},eventDate=d.eventDate||q.eventDate||'';
  const complete=state.completed||[];
  return `<div class="workspace-overview">
    <div><small>Client</small><strong>${escapeHtml(d.primaryClient||d.company||q.clientName||'Not entered')}</strong></div>
    <div><small>Event date</small><strong>${escapeHtml(eventDate||'Not entered')}</strong></div>
    <div><small>Venue</small><strong>${escapeHtml(d.venueName||q.venueName||'Not entered')}</strong></div>
    <div><small>Progress</small><strong>${Math.min(100,Math.round(complete.length/Math.max(1,modules.length)*100))}%</strong></div>
    <div><small>Quote</small><strong>${escapeHtml(q.quoteStatus||'Draft')}</strong></div>
    <div><small>Contract</small><strong>${escapeHtml(c.contractStatus||'Draft')}</strong></div>
  </div>`;
}
function renderMain(){const m=modules.find(x=>x.id===state.active);const main=document.querySelector('#main');main.className=`crm-main workspace-module workspace-module-${state.active}`;main.dataset.workspaceModule=state.active;const overview=workspaceOverview();const workflowTabs=`<nav class="workspace-tabs" aria-label="Booking workflow"><div class="workspace-tabs-track">${modules.map((item,i)=>`<button class="workspace-tab ${state.active===item.id?'active':''}" type="button" data-module="${item.id}" ${state.active===item.id?'aria-current="page"':''}><span class="workspace-tab-number">${i+1}</span><span>${item.label}</span></button>`).join('')}</div></nav>`;main.innerHTML=`<section class="hero workspace-hero"><div><button class="text-button back-dashboard" data-view="dashboard">← Dashboard</button><div class="eyebrow">Current Event · ${state.bookingId}</div><h1>${m.label}</h1><p>${m.description} ${currentUser?'Changes save and sync automatically while you are signed in.':'Your information is currently stored only in this browser.'}</p></div></section>${workflowTabs}${workflowStatusCard('organization')}${overview}<div class="booking-strip"><div class="ref"><small>Event Reference</small><br><strong>${state.bookingId}</strong></div><div class="actions"><button class="btn" data-action="save">${currentUser?'Save & Sync Now':'Save Local'}</button><button class="btn primary" data-action="cloud-sync">${currentUser?'Sync Now':'Sign in to Sync'}</button><button class="btn" data-action="cloud-load">Load Cloud</button><button class="btn" data-action="export">Export JSON</button><button class="btn danger" data-action="reset">New Event</button></div></div><div class="progress-wrap"><div class="progress-head"><span>Module completion</span><span id="progressText">0%</span></div><div class="progress"><span id="progressBar"></span></div></div><div id="module"></div><div class="footer-note">Galaxy Cue · Operating system for DJs and entertainment companies</div>`;
const host=document.querySelector('#module'),source=activeConsultation();host.className=`module-host module-${state.active}`;host.dataset.module=state.active;if(state.active==='wedding')host.innerHTML=weddingForm();else if(state.active==='corporate')host.innerHTML=corporateForm();else if(state.active==='private')host.innerHTML=privateForm();else if(state.active==='quote')host.innerHTML=quoteForm(source);else if(state.active==='contract')host.innerHTML=contractForm(state.forms.quote||{},source);else if(state.active==='wedding-planner')host.innerHTML=weddingPlannerForm(state.forms.wedding||source);else if(state.active==='corporate-planner')host.innerHTML=corporatePlannerForm(state.forms.corporate||source);else if(state.active==='private-planner')host.innerHTML=privatePlannerForm(state.forms.private||source);else if(state.active==='timeline')host.innerHTML=timelineForm();else if(state.active==='uploads')host.innerHTML=uploadsView();else if(state.active==='messages')host.innerHTML=messagesView();else if(state.active==='portal')host.innerHTML=portal();else if(state.active==='admin')host.innerHTML=admin();else host.innerHTML=comingSoon(m);
if(state.active==='timeline')renderTimelineRows();if(state.active==='uploads')renderUploads();if(state.active==='messages')renderMessages();const form=host.querySelector('form');if(form){fill(form,state.forms[state.active]);form.addEventListener('input',()=>{state.forms[state.active]=dataFrom(form);save(false);updateProgress(form);if(state.active==='quote')updateQuoteTotals();if(state.active==='contract')updateContractTotals()});form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;state.forms[state.active]=dataFrom(form);if(!state.completed.includes(state.active))state.completed.push(state.active);save();toast(state.active==='contract'?'Contract acceptance recorded':'Module completed');renderMain()});updateProgress(form);if(state.active==='quote')updateQuoteTotals();if(state.active==='contract')updateContractTotals()}bindActions();bindWorkflowActions()}
function updateQuoteTotals(){const form=document.querySelector('form[data-form="quote"]');if(!form)return;const q=dataFrom(form),t=quoteTotals(q);[['subtotalValue',t.subtotal],['discountValue',-t.discount],['taxValue',t.tax],['totalValue',t.total],['depositValue',t.deposit],['balanceValue',t.balance]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=money(v)})}
function updateContractTotals(){const t=quoteTotals();document.querySelectorAll('[data-contract-total]').forEach(el=>el.textContent=money(t.total));document.querySelectorAll('[data-contract-deposit]').forEach(el=>el.textContent=money(t.deposit))}
function daysUntil(date){if(!date)return null;const target=new Date(date+'T12:00:00'),today=new Date();today.setHours(0,0,0,0);return Math.ceil((target-today)/86400000)}
function plannerForBooking(){if(state.forms.wedding&&Object.keys(state.forms.wedding).length)return 'wedding-planner';if(state.forms.corporate&&Object.keys(state.forms.corporate).length)return 'corporate-planner';if(state.forms.private&&Object.keys(state.forms.private).length)return 'private-planner';return null}
function portal(){const d=activeConsultation(),q=state.forms.quote||{},c=state.forms.contract||{},t=quoteTotals(q),plannerId=plannerForBooking(),eventDate=d.eventDate||q.eventDate||'',days=daysUntil(eventDate),planner=plannerId?state.forms[plannerId]||{}:{},plannerLabel=plannerId?modules.find(x=>x.id===plannerId).label:'Music Planner';return `<div class="card portal-hero"><div><div class="eyebrow">Client Booking Overview</div><h2>${d.primaryClient||q.clientName||'Your Event'}</h2><p class="card-intro">Everything currently saved for booking <strong>${state.bookingId}</strong>.</p></div><div class="countdown"><small>Event Countdown</small><strong>${days===null?'—':days<0?'Past event':days===0?'Today':days+' days'}</strong><span>${eventDate||'Date not set'}</span></div></div><div class="card"><h2>Booking Snapshot</h2><div class="summary-grid"><div class="stat"><small>Event Date</small><strong style="font-size:17px">${eventDate||'—'}</strong></div><div class="stat"><small>Venue</small><strong style="font-size:17px">${d.venueName||q.venueName||'—'}</strong></div><div class="stat"><small>Planner</small><strong style="font-size:17px">${plannerId?(state.completed.includes(plannerId)?'Completed':'In progress'):'Not selected'}</strong></div></div></div><div class="card"><h2>Quote & Payment</h2><div class="summary-grid"><div class="stat"><small>Quote Status</small><strong>${q.quoteStatus||'Not created'}</strong></div><div class="stat"><small>Total</small><strong>${money(t.total)}</strong></div><div class="stat"><small>Deposit Due</small><strong>${money(t.deposit)}</strong></div><div class="stat"><small>Contract Status</small><strong style="font-size:17px">${c.contractStatus||'Draft'}</strong></div><div class="stat"><small>Deposit Received</small><strong>${money(c.depositPaid)}</strong></div><div class="stat"><small>Balance Remaining</small><strong>${money(Math.max(0,t.total-(Number(c.depositPaid)||0)))}</strong></div></div></div><div class="card"><h2>Workflow Progress</h2><div class="workflow-list">${['wedding','corporate','private','quote','contract','wedding-planner','corporate-planner','private-planner'].filter(id=>!id.includes('planner')||id===plannerId).map(id=>{const m=modules.find(x=>x.id===id);return `<button class="workflow-item" data-nav="${id}"><span>${m.label}</span><strong class="${state.completed.includes(id)?'done':''}">${state.completed.includes(id)?'Completed':state.forms[id]?'In progress':'Not started'}</strong></button>`}).join('')}</div><div class="section-actions"><button class="btn" data-action="print-summary">Print Event Summary</button>${plannerId?`<button class="btn primary" data-nav="${plannerId}">Open ${plannerLabel}</button>`:''}</div></div><div class="card"><h2>Music Planner Preview</h2>${plannerId&&Object.keys(planner).length?`<div class="admin-list"><div><span>Must-play songs</span><strong>${planner.mustPlay?'Added':'Not added'}</strong></div><div><span>Do-not-play list</span><strong>${planner.doNotPlay?'Added':'Not added'}</strong></div><div><span>Timeline / run of show</span><strong>${planner.timeline||planner.receptionTimeline||planner.runOfShow?'Added':'Not added'}</strong></div><div><span>Announcements / cues</span><strong>${planner.announcements||planner.ceremonyNotes||planner.avNotes?'Added':'Not added'}</strong></div></div>`:'<p class="card-intro">No music-planner information has been entered yet.</p>'}</div>`}
function admin(){const d=activeConsultation(),q=state.forms.quote||{},c=state.forms.contract||{},t=quoteTotals(q);return `<div class="card"><h2>Admin Dashboard</h2><p class="card-intro">Local demonstration dashboard for the active browser.</p><div class="summary-grid"><div class="stat"><small>Client</small><strong>${d.primaryClient||q.clientName||'—'}</strong></div><div class="stat"><small>Quote Total</small><strong>${money(t.total)}</strong></div><div class="stat"><small>Deposit Received</small><strong>${money(c.depositPaid)}</strong></div><div class="stat"><small>Quote Status</small><strong style="font-size:17px">${q.quoteStatus||'Draft'}</strong></div><div class="stat"><small>Contract Status</small><strong style="font-size:17px">${c.contractStatus||'Draft'}</strong></div><div class="stat"><small>Last Updated</small><strong style="font-size:14px">${new Date(state.updated).toLocaleString()}</strong></div></div></div><div class="card"><h2>Event Summary</h2><div class="admin-list"><div><span>Event date</span><strong>${d.eventDate||q.eventDate||'—'}</strong></div><div><span>Venue</span><strong>${d.venueName||q.venueName||'—'}</strong></div><div><span>Deposit status</span><strong>${c.depositStatus||'Not requested'}</strong></div><div><span>Remaining balance</span><strong>${money(Math.max(0,t.total-(Number(c.depositPaid)||0)))}</strong></div></div></div>`}
function comingSoon(m){return `<div class="card empty"><div class="icon">${m.icon}</div><h2>${m.label}</h2><p class="card-intro">The navigation and data structure are prepared. This module is scheduled for the next build.</p><button class="btn primary" data-nav="wedding">Return to Consultation</button></div>`}
function updateProgress(form){const n=pct(form);document.querySelector('#progressBar').style.width=n+'%';document.querySelector('#progressText').textContent=n+'%'}
function bindNav(){
  document.querySelectorAll('[data-view]').forEach(button=>{
    button.addEventListener('click',event=>{
      event.preventDefault();
      navigateToView(button.dataset.view);
    });
  });

  document.querySelectorAll('[data-module]').forEach(button=>{
    button.addEventListener('click',event=>{
      event.preventDefault();
      navigateToModule(button.dataset.module);
    });
  });
}
function bindActions(){document.querySelectorAll('[data-action="save"]').forEach(b=>b.addEventListener('click',()=>{const f=document.querySelector('form');
  if(f)applySavedFormValues(f,state.forms?.[state.active]||{});if(f)state.forms[state.active]=dataFrom(f);save()}));document.querySelectorAll('[data-action="cloud-sync"]').forEach(b=>b.addEventListener('click',cloudSync));document.querySelectorAll('[data-action="cloud-load"]').forEach(b=>b.addEventListener('click',cloudLoad));document.querySelectorAll('[data-action="export"]').forEach(b=>b.addEventListener('click',exportJSON));document.querySelectorAll('[data-action="reset"]').forEach(b=>b.addEventListener('click',()=>{if(confirm('Start a new booking and clear this browser’s saved data?'))newBooking()}));document.querySelectorAll('#module [data-nav]').forEach(button=>button.addEventListener('click',()=>navigateToModule(button.dataset.nav)));document.querySelectorAll('[data-action="add-timeline"]').forEach(b=>b.addEventListener('click',()=>addTimelineItem()));document.querySelectorAll('[data-action="send-message"]').forEach(b=>b.addEventListener('click',addMessage));document.querySelectorAll('[data-action="print-quote"],[data-action="print-contract"],[data-action="print-planner"],[data-action="print-summary"]').forEach(b=>b.addEventListener('click',()=>window.print()))}

function timelineItems(){state.timelineItems=state.timelineItems||[];return state.timelineItems}
function addTimelineItem(item={time:'',title:'',details:''}){timelineItems().push(item);save(false);renderTimelineRows()}
function renderTimelineRows(){const wrap=document.querySelector('#timelineRows');if(!wrap)return;if(!timelineItems().length)[['2:00 PM','Setup','DJ and production setup'],['4:00 PM','Guest Arrival','Background music begins'],['6:00 PM','Main Program','Dinner / reception / event program'],['11:00 PM','Final Song','Event conclusion']].forEach(x=>timelineItems().push({time:x[0],title:x[1],details:x[2]}));wrap.innerHTML=timelineItems().map((x,i)=>`<div class="timeline-row"><input value="${escapeHtml(x.time)}" data-ti="${i}" data-k="time" placeholder="Time"><input value="${escapeHtml(x.title)}" data-ti="${i}" data-k="title" placeholder="Moment"><input value="${escapeHtml(x.details)}" data-ti="${i}" data-k="details" placeholder="Music, announcement or notes"><div class="row-actions"><button type="button" data-move="${i}" data-dir="-1">↑</button><button type="button" data-move="${i}" data-dir="1">↓</button><button type="button" data-remove="${i}">×</button></div></div>`).join('');wrap.querySelectorAll('[data-ti]').forEach(el=>el.addEventListener('input',()=>{timelineItems()[+el.dataset.ti][el.dataset.k]=el.value;save(false)}));wrap.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{timelineItems().splice(+b.dataset.remove,1);save(false);renderTimelineRows()}));wrap.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.move,j=i+(+b.dataset.dir);if(j<0||j>=timelineItems().length)return;[timelineItems()[i],timelineItems()[j]]=[timelineItems()[j],timelineItems()[i]];save(false);renderTimelineRows()}))}
async function renderUploads(){state.uploads=state.uploads||[];const input=document.querySelector('#uploadInput'),list=document.querySelector('#uploadList');if(!input||!list)return;const drawLocal=()=>{list.innerHTML=state.uploads.length?state.uploads.map((f,i)=>`<div class="file-item"><div><strong>${escapeHtml(f.name)}</strong><small>${escapeHtml(f.type||'File')} · ${formatBytes(f.size)} · Local only</small></div><button class="btn" data-delete-file="${i}">Remove</button></div>`).join(''):'<p class="card-intro">No files added yet.</p>';list.querySelectorAll('[data-delete-file]').forEach(b=>b.addEventListener('click',()=>{state.uploads.splice(+b.dataset.deleteFile,1);save(false);drawLocal()}))};const drawCloud=async()=>{list.innerHTML='<p class="card-intro">Loading cloud files…</p>';const {data,error}=await listBookingFiles(state.bookingId,currentUser);if(error){list.innerHTML=`<p class="card-intro">Could not load cloud files: ${escapeHtml(error.message)}</p>`;return}list.innerHTML=data.length?data.map(row=>`<div class="file-item"><div><strong>${escapeHtml(row.file_name)}</strong><small>${escapeHtml(row.mime_type||'File')} · ${formatBytes(row.file_size)} · Cloud</small></div><div class="file-actions"><button class="btn" data-open-file="${row.id}">Open</button><button class="btn" data-remove-cloud="${row.id}">Remove</button></div></div>`).join(''):'<p class="card-intro">No cloud files uploaded yet.</p>';list.querySelectorAll('[data-open-file]').forEach(b=>b.addEventListener('click',async()=>{const row=data.find(x=>x.id===b.dataset.openFile);const {data:signed,error:e}=await createSignedFileUrl(row.file_path);if(e)return toast(e.message);window.open(signed.signedUrl,'_blank','noopener')}));list.querySelectorAll('[data-remove-cloud]').forEach(b=>b.addEventListener('click',async()=>{const row=data.find(x=>x.id===b.dataset.removeCloud);const {error:e}=await removeBookingFile(row,currentUser);if(e)return toast(e.message);toast('Cloud file removed');drawCloud()}))};input.addEventListener('change',async()=>{const files=[...input.files];if(currentUser){for(const f of files){toast(`Uploading ${f.name}…`);const {error}=await uploadBookingFile(f,state.bookingId,currentUser);if(error){toast(`Upload failed: ${error.message}`);break}}await drawCloud()}else{files.forEach(f=>state.uploads.push({name:f.name,type:f.type,size:f.size,added:new Date().toISOString()}));save();drawLocal()}input.value=''});currentUser?await drawCloud():drawLocal()}
function renderMessages(){state.messages=state.messages||[];const thread=document.querySelector('#messageThread');thread.innerHTML=state.messages.length?state.messages.map(m=>`<div class="message ${m.role==='Internal Note'?'internal':''}"><div><strong>${escapeHtml(m.role)}</strong><small>${new Date(m.date).toLocaleString()}</small></div><p>${escapeHtml(m.text)}</p></div>`).join(''):'<p class="card-intro">No messages yet.</p>';thread.scrollTop=thread.scrollHeight}
function addMessage(){const role=document.querySelector('#messageRole').value,text=document.querySelector('#messageText').value.trim();if(!text)return;state.messages=state.messages||[];state.messages.push({role,text,date:new Date().toISOString()});document.querySelector('#messageText').value='';save();renderMessages()}
function formatBytes(n){if(!n)return'0 B';const u=['B','KB','MB','GB'],i=Math.floor(Math.log(n)/Math.log(1024));return`${(n/Math.pow(1024,i)).toFixed(i?1:0)} ${u[i]}`}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}



function withTimeout(promise, milliseconds, message){
  let timeoutId;
  const timeout=new Promise((_,reject)=>{
    timeoutId=setTimeout(()=>reject(new Error(message)),milliseconds);
  });
  return Promise.race([promise,timeout]).finally(()=>clearTimeout(timeoutId));
}

async function bindGlobalActions(){
  document.querySelectorAll('[data-action="login"]').forEach(b=>b.addEventListener('click',()=>(()=>{const el=document.querySelector('#authModal');if(el)el.classList.remove('hidden')})()));
  document.querySelectorAll('[data-action="close-auth"]').forEach(b=>b.addEventListener('click',()=>(()=>{const el=document.querySelector('#authModal');if(el)el.classList.add('hidden')})()));
  document.querySelectorAll('[data-action="send-link"]').forEach(button=>button.addEventListener('click',async(event)=>{
    event.preventDefault();
    event.stopPropagation();

    const emailInput=document.querySelector('#authEmail');
    const email=String(emailInput?.value||'').trim().toLowerCase();
    const status=document.querySelector('#authStatus');

    if(!email){
      toast('Enter your email address');
      if(status)status.textContent='Enter your email address.';
      emailInput?.focus();
      return;
    }

    if(button.disabled)return;

    const originalText=button.textContent;
    button.disabled=true;
    button.textContent='Sending magic link…';
    if(status){
      status.textContent='Requesting a secure sign-in email…';
      status.classList.remove('auth-error','auth-success');
    }

    try{
      const result=await withTimeout(
        sendMagicLink(email),
        15000,
        'The sign-in request timed out. Please check your internet connection and try again.'
      );

      if(result?.error){
        throw result.error;
      }

      if(status){
        status.textContent='Magic link sent. Check your inbox and spam folder.';
        status.classList.add('auth-success');
      }
      toast('Magic login link sent — check your email');
      button.textContent='Email sent';
      setTimeout(()=>{
        button.disabled=false;
        button.textContent=originalText;
      },2500);
    }catch(error){
      console.error('Magic link send failed:',error);
      const message=error?.message||'Could not send the magic link';
      if(status){
        status.textContent=message;
        status.classList.add('auth-error');
      }
      toast(message);
      button.disabled=false;
      button.textContent=originalText;
    }
  }));
  document.querySelectorAll('[data-action="logout"]').forEach(b=>b.addEventListener('click',async()=>{await signOut();currentUser=null;cloudBookings=loadLocalEvents();eventCloudStatus='Local';shell();toast('Signed out')}));
  document.querySelectorAll('[data-action="command"]').forEach(b=>b.addEventListener('click',openCommand));
  document.querySelectorAll('[data-action="client-login"]').forEach(button=>button.addEventListener('click',()=>{
    const url=new URL('client-portal.html',window.location.href);
    if(activeBusinessId())url.searchParams.set('business',activeBusinessId());
    window.open(url.toString(),'_blank','noopener');
  }));
  document.querySelectorAll('[data-action="client-portal"]').forEach(button=>button.addEventListener('click',()=>{
    portalPreviewMode=true;
    navigateToView('client-portal');
  }));
  document.querySelectorAll('[data-action="toggle-mobile-menu"]').forEach(b=>b.addEventListener('click',()=>setMobileMenu(!document.body.classList.contains('mobile-nav-open'))));
  document.querySelectorAll('[data-action="close-mobile-menu"]').forEach(b=>b.addEventListener('click',()=>setMobileMenu(false)));
  document.querySelectorAll('[data-action="close-command"]').forEach(b=>b.addEventListener('click',()=>(()=>{const el=document.querySelector('#commandModal');if(el)el.classList.add('hidden')})()));
  document.querySelectorAll('[data-action="force-refresh"]').forEach(button=>button.addEventListener('click',async()=>{
    button.disabled=true;
    button.textContent='Refreshing…';
    try{
      if('serviceWorker' in navigator){
        const registrations=await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration=>registration.unregister()));
      }
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.map(key=>caches.delete(key)));
      }
    }catch(error){console.warn('Cache cleanup was incomplete:',error)}
    const url=new URL(window.location.href);
    url.searchParams.set('gc-refresh',Date.now().toString());
    window.location.replace(url.toString());
  }));

  document.querySelectorAll('[data-action="close-event-modal"]').forEach(button=>button.addEventListener('click',closeEventModal));

  const eventCreateForm=document.querySelector('#eventCreateForm');
  bindQuickEventForm(eventCreateForm);
}
function setMobileMenu(open){
  const isMobile=window.matchMedia('(max-width:760px)').matches;
  const shouldOpen=Boolean(open&&isMobile);

  document.body.classList.toggle('mobile-nav-open',shouldOpen);
  document.body.classList.toggle('mobile-nav-scroll-lock',shouldOpen);

  const toggle=document.querySelector('[data-action="toggle-mobile-menu"]');
  const sidebar=document.querySelector('#crmSidebar');

  if(toggle){
    toggle.setAttribute('aria-expanded',String(shouldOpen));
    toggle.setAttribute('aria-label',shouldOpen?'Close navigation':'Open navigation');
  }

  if(sidebar)sidebar.setAttribute('aria-hidden',String(isMobile&&!shouldOpen));

  if(shouldOpen){
    requestAnimationFrame(()=>document.querySelector('.mobile-menu-close')?.focus());
  }else if(open===false&&document.activeElement?.closest?.('#crmSidebar')){
    toggle?.focus();
  }
}

function installResponsiveNavigationGuards(){
  if(window.__gcResponsiveNavigationInstalled)return;
  window.__gcResponsiveNavigationInstalled=true;

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&document.body.classList.contains('mobile-nav-open')){
      setMobileMenu(false);
    }
  });

  window.addEventListener('resize',()=>{
    if(!window.matchMedia('(max-width:760px)').matches)setMobileMenu(false);
  });

  window.addEventListener('popstate',()=>setMobileMenu(false));
}


function runConnectionAudit(){
  const issues=[];
  const knownViews=new Set(['dashboard','bookings','quotes','contracts','invoices','payments','clients','calendar','music','files','messages','client-portal','analytics','settings','workspace']);
  const knownModules=new Set(modules.map(module=>module.id));

  document.querySelectorAll('[data-view]').forEach(element=>{
    if(!knownViews.has(element.dataset.view))issues.push(`Unknown view route: ${element.dataset.view}`);
  });

  document.querySelectorAll('[data-module],[data-nav]').forEach(element=>{
    const target=element.dataset.module||element.dataset.nav;
    if(target&&!knownModules.has(target))issues.push(`Unknown module route: ${target}`);
  });

  ['#main','#crmSidebar','[data-action="toggle-mobile-menu"]'].forEach(selector=>{
    if(!document.querySelector(selector))issues.push(`Missing interface element: ${selector}`);
  });

  const ids=[...document.querySelectorAll('[id]')].map(element=>element.id);
  [...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))]
    .forEach(id=>issues.push(`Duplicate element id: ${id}`));

  const result={
    passed:issues.length===0,
    checkedAt:new Date().toISOString(),
    view:appView,
    activeModule:state.active,
    issues
  };

  console.group('Galaxy Cue connection audit');
  console.table(result);
  if(issues.length)console.warn(issues);
  else console.info('Navigation routes, module targets and shell connections passed.');
  console.groupEnd();

  toast(issues.length?`${issues.length} connection issue${issues.length===1?'':'s'} found`:'System connection check passed');
  return result;
}

function openCommand(){
  const modal=document.querySelector('#commandModal'),input=document.querySelector('#commandInput');
  if(modal)modal.classList.remove('hidden'); if(input){input.value='';setTimeout(()=>input.focus(),50);drawCommands('');input.oninput=()=>drawCommands(input.value)}
}
function drawCommands(q=''){
  const box=document.querySelector('#commandResults');if(!box)return;
  const actions=[
    {label:'Go to Dashboard',hint:'Business overview',run:()=>navigateToView('dashboard')},
    {label:'Open Events',hint:'Search the CRM',run:()=>navigateToView('bookings')},
    {label:'Create New Event',hint:'Start a fresh workflow',run:newBooking},
    {label:'Open Current Event',hint:state.bookingId,run:()=>navigateToView('workspace')},
    {label:'Preview Client Portal',hint:state.bookingId,run:()=>{portalPreviewMode=true;navigateToView('client-portal')}},
    {label:'Business Settings',hint:'Company name and payment methods',run:()=>navigateToView('settings')},
    {label:'Run System Check',hint:'Audit navigation and interface connections',run:runConnectionAudit},
  ];
  const bookingActions=cloudBookings.map(b=>({label:b.client_name||b.booking_ref,hint:`${b.booking_ref} · ${b.event_type||'Event'}`,run:()=>openCloudBooking(b.booking_ref)}));
  const items=[...actions,...bookingActions].filter(x=>(x.label+' '+x.hint).toLowerCase().includes(q.toLowerCase())).slice(0,10);
  box.innerHTML=items.map((x,i)=>`<button data-command-index="${i}"><strong>${escapeHtml(x.label)}</strong><small>${escapeHtml(x.hint)}</small><span>↵</span></button>`).join('')||'<div class="empty-state compact">No result found.</div>';
  box.querySelectorAll('[data-command-index]').forEach(b=>b.addEventListener('click',()=>items[+b.dataset.commandIndex].run()));
}
async function cloudSync(){
  if(!currentUser)return document.querySelector('#authModal')?.classList.remove('hidden');
  const f=document.querySelector('form');
  if(f)state.forms[state.active]=dataFrom(f);
  state.updated=new Date().toISOString();
  localStorage.setItem(KEY,JSON.stringify(state));
  lastAutoCloudSignature='';
  await runAutoCloudSync({notify:true});
  if(eventCloudStatus==='Synced')await refreshEventsFromCloud();
}
async function cloudLoad(){
  if(!currentUser)return document.querySelector('#authModal')?.classList.remove('hidden');
  if(!activeBusinessId())return toast('No active business workspace');
  const {data,error}=await loadCloudEvent(state.bookingId,activeBusinessId());
  if(error)return toast(error.code==='PGRST116'?'No cloud copy found for this event':error.message);
  if(!data||!data.booking_data)return toast('Cloud event has no saved data');
  state=data.booking_data;localStorage.setItem(KEY,JSON.stringify(state));shell();toast('Cloud event loaded');
}
async function initializeAuth(){
  if(isPublicBookingRequestRoute()){await loadCloudModule();publicBookingRequestScreen();return;}
  shell();
  const loaded=await loadCloudModule();
  if(!loaded){
    currentUser=null;
    shell();
    toast('Local mode active — cloud module could not load');
    return;
  }

  try{
    const callback=await restoreAuthSession();

    if(callback?.error){
      console.error('Magic-link callback failed:',callback.error);
      toast(callback.error.message||'The magic login link could not be verified');
    }

    currentUser=callback?.user||await getCurrentUser();

    if(currentUser){
      appView='dashboard';
      const workspace=await ensureBusinessWorkspace(currentUser);
      if(workspace?.error){
        console.error('Business workspace initialization failed:',workspace.error);
        toast('Signed in, but the cloud workspace could not be opened');
      }else{
        activeBusiness=workspace?.data||null;
        await hydrateCloudPreferences();
        await refreshCoreCloudData();
      }
    }

    shell();

    if(callback?.handled&&currentUser){
      toast('Magic link verified — signed in');
    }

    supabase.auth.onAuthStateChange((event,session)=>{
      const next=session?.user||null;
      const userChanged=((next&&next.id)||null)!==((currentUser&&currentUser.id)||null);

      if(!userChanged&&event!=='SIGNED_IN'&&event!=='SIGNED_OUT')return;

      currentUser=next;

      if(currentUser){
        appView='dashboard';
        ensureBusinessWorkspace(currentUser).then(async workspace=>{
          if(workspace?.error){
            console.error('Business workspace initialization failed:',workspace.error);
            toast('Signed in, but the cloud workspace could not be opened');
          }else{
            activeBusiness=workspace?.data||null;
            await hydrateCloudPreferences();
            await refreshCoreCloudData();
          }
          shell();
        });
      }else{
        activeBusiness=null;
        clientCloudStatus='Local';
        eventCloudStatus='Local';
        crmClients=loadClients();
        cloudBookings=[];
        shell();
      }
    });
  }catch(error){
    console.error('Supabase initialization failed:',error);
    currentUser=null;
    shell();
    toast(error?.message||'Cloud connection unavailable — local mode is active');
  }
}

function exportJSON(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${state.bookingId}.json`;a.click();URL.revokeObjectURL(a.href)}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)}
window.addEventListener('error',event=>{
  console.error(event.error||event.message);
  const root=document.querySelector('#app');
  if(root && !root.innerHTML.trim()){
    root.innerHTML=`<main style="min-height:100vh;background:#090909;color:white;display:grid;place-items:center;padding:24px;font-family:Arial,sans-serif">
      <section style="max-width:620px;border:1px solid #3a332d;background:#12100f;border-radius:18px;padding:28px">
        <h1 style="margin-top:0">Galaxy Cue</h1>
        <p>The application could not finish loading. Please refresh once. If this message remains, upload the hotfix files again and make sure the <strong>js</strong> and <strong>css</strong> folders are in the same directory as <strong>index.html</strong>.</p>
        <p style="color:#c9986a;font-size:13px">${escapeHtml(event.message||'Unknown loading error')}</p>
      </section>
    </main>`;
  }
});
window.addEventListener('unhandledrejection',event=>console.error('Unhandled promise rejection:',event.reason));
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCommand()}if(e.key==='Escape'){(()=>{const el=document.querySelector('#commandModal');if(el)el.classList.add('hidden')})();(()=>{const el=document.querySelector('#authModal');if(el)el.classList.add('hidden')})();closeEventModal()}});
initializeAuth();
function enforceQuarterHourTimeInputs(root=document){
  root.querySelectorAll('input[type="time"]').forEach(input=>{
    input.step='900';
    if(input.dataset.quarterHourBound)return;
    input.dataset.quarterHourBound='1';
    input.addEventListener('change',()=>{
      if(!input.value)return;
      const [hour,minute]=input.value.split(':').map(Number);
      let total=hour*60+minute;
      total=Math.round(total/15)*15;
      if(total>=1440)total=1425;
      input.value=`${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
    });
  });
}
document.addEventListener('focusin',event=>{if(event.target?.matches?.('input[type="time"]'))enforceQuarterHourTimeInputs(document)});

