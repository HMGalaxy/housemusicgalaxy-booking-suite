import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../../shared/js/config.js';
import { weddingForm, corporateForm, privateForm } from '../../shared/js/modules.js?v=7040';

const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const app=document.querySelector('#clientApp');
const VERSION='7.1.1';
let user=null,events=[],activeTab='events';
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt=d=>d?new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(`${d}T12:00:00`)):'Date pending';
const activeKey=e=>e.event_data?.active||typeKey(e.event_type);
const activeForm=e=>e.event_data?.forms?.[activeKey(e)]||{};
const submitted=e=>e.event_data?.documents?.eventWorkbook||e.event_data?.documents?.eventForm||null;
const typeKey=t=>{t=String(t||'').toLowerCase();return t.includes('corporate')?'corporate':(t.includes('private')||t.includes('party')||t.includes('birthday'))?'private':'wedding'};
const formHtml=k=>k==='corporate'?corporateForm():k==='private'?privateForm():weddingForm();
function authScreen(msg=''){
  app.innerHTML=`
    <main class="client-auth-page">
      <div class="client-auth-ambient client-auth-ambient-one"></div>
      <div class="client-auth-ambient client-auth-ambient-two"></div>
      <section class="client-login-card" aria-labelledby="clientLoginTitle">
        <div class="client-login-brand">
          <img src="assets/galaxy-cue-mark-transparent.png" alt="Galaxy Cue">
          <strong>GALAXY <span>CUE</span></strong>
        </div>
        <div class="client-login-rule"><i></i></div>
        <div class="client-login-heading">
          <span class="client-login-kicker">CLIENT PORTAL</span>
          <h1 id="clientLoginTitle">Welcome back</h1>
          <p>Access your events, quotes, contracts and planning in one secure place.</p>
        </div>
        <form id="magic" class="client-login-form">
          <label class="client-email-field">
            <span>Email address</span>
            <div class="client-input-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 6.5h17v11h-17zM4 7l8 6 8-6"/></svg>
              <input name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
            </div>
          </label>
          <button class="client-login-button" type="submit">
            <span>Email me a sign-in link</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>
          </button>
        </form>
        <div id="portalStatus" class="client-login-status ${msg?'is-visible':''}" role="status" aria-live="polite">${esc(msg)}</div>
        <p class="client-login-help">We’ll email you a secure sign-in link. No password required.</p>
        <div class="client-login-trust">
          <span>◇ Secure login</span><span>◇ Private workspace</span><span>◇ No password</span>
        </div>
        <div class="client-powered">Powered by <b>Galaxy Cue</b> · v${VERSION}</div>
      </section>
    </main>`;
  const form=document.querySelector('#magic');
  form.onsubmit=async e=>{
    e.preventDefault();
    const button=form.querySelector('button');
    const status=document.querySelector('#portalStatus');
    const email=String(new FormData(form).get('email')||'').trim();
    button.disabled=true;
    button.classList.add('is-loading');
    button.querySelector('span').textContent='Sending secure link…';
    status.className='client-login-status is-visible';
    status.textContent='Preparing your secure sign-in link…';
    const redirect=new URL('./', location.href);
    redirect.searchParams.set('portal','1');
    const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:redirect.toString(),shouldCreateUser:true,data:{account_type:'client'}}});
    button.disabled=false;
    button.classList.remove('is-loading');
    button.querySelector('span').textContent='Email me a sign-in link';
    if(error){
      status.className='client-login-status is-visible is-error';
      status.textContent=error.message;
      return;
    }
    status.className='client-login-status is-visible is-success';
    status.innerHTML=`<strong>Check your inbox</strong><span>We sent a secure sign-in link to ${esc(email)}.</span>`;
    form.reset();
  };
}
function workflow(e){const current=e.event_data?.workflow?.currentState||'EVENT_WORKBOOK_PENDING';const steps=[['EVENT_WORKBOOK_PENDING','Event Workbook'],['QUOTE_PREPARATION','Quote'],['CONTRACT_PREPARATION','Contract'],['PLANNING_PENDING','Planning + Music'],['TIMELINE_PENDING','Timeline'],['EVENT_READY','Event Ready']];let idx=steps.findIndex(x=>x[0]===current);if(idx<0)idx=0;return steps.map((x,i)=>`<div class="progress-row ${i<idx?'done':i===idx?'current':''}"><i>${i<idx?'✓':i+1}</i><span>${x[1]}</span></div>`).join('')}
function eventCard(e){const doc=submitted(e),draft=e.event_data?.clientEventForm?.status==='draft';return `<article class="event-card"><div class="event-card-head"><div><small class="eyebrow">${esc(fmt(e.event_date))}</small><h3>${esc(e.title||e.event_type||'Event')}</h3><p>${esc(e.businesses?.name||'Entertainment Company')} · ${esc(e.venue_name||'Venue pending')}</p></div><span class="chip">${doc?'Workbook submitted':'Action required'}</span></div>${doc?`<div class="submitted-banner"><strong>✓ Full Event Workbook submitted</strong><span>Your business can now prepare the quote.</span></div>`:`<div class="action-banner primary-action"><div><small>ACTION REQUIRED</small><strong>Complete your Full Event Workbook</strong><span>This is the complete event profile used by your entertainment company.</span></div><button class="btn primary" data-open-workbook="${e.id}">${draft?'Continue Workbook':'Start Workbook'}</button></div>`}<section class="event-documents"><div class="section-title"><small>Documents</small><h4>Event documents</h4></div><div class="document-list"><button class="document-row" data-view-booking="${e.id}"><span><b>Booking Request</b><small>Original request</small></span><em>View</em></button><button class="document-row ${doc?'':'disabled'}" ${doc?`data-view-workbook="${e.id}"`:''}><span><b>Event Workbook</b><small>${doc?'Submitted copy':'Pending'}</small></span><em>${doc?'View':'Pending'}</em></button></div></section><div class="progress">${workflow(e)}</div></article>`}
async function render(){const {data,error}=await supabase.rpc('get_my_client_events');if(error){app.innerHTML=`<main class="auth-wrap"><section class="auth-card"><h1>Client Portal</h1><p class="status error">${esc(error.message)}</p></section></main>`;return}events=data||[];const business=events[0]?.businesses?.name||'Your Entertainment Company';app.innerHTML=`<div class="portal-shell"><header class="portal-topbar"><div class="portal-brand"><img src="assets/galaxy-cue-logo.png"><div><strong>GALAXY CUE</strong><span>Client Portal · v${VERSION}</span></div></div><button class="btn ghost" id="signout">Sign Out</button></header><main class="portal-main"><nav class="client-tabs"><button class="${activeTab==='events'?'active':''}" data-tab="events">My Events</button><button class="${activeTab==='new'?'active':''}" data-tab="new">＋ Book a New Event</button></nav>${activeTab==='events'?`<section class="hero"><div><div class="eyebrow">${esc(business)}</div><h1>Your Events</h1><p>Complete required actions and keep every event in one place.</p></div></section><section class="panel"><div class="event-list">${events.length?events.map(eventCard).join(''):'<div class="empty"><h3>No events yet</h3><p>Use Book a New Event to send your first request.</p></div>'}</div></section>`:newEventView(business)}</main></div>`;bind();}
function newEventView(business){return `<section class="hero"><div><div class="eyebrow">${esc(business)}</div><h1>Book a New Event</h1><p>Choose the event type, then complete the full workbook. It will be sent directly to your connected business.</p></div></section><section class="panel"><div class="new-event-type"><label class="field"><span>Event type</span><select id="newEventType"><option value="wedding">Wedding</option><option value="corporate">Corporate Event</option><option value="private">Private Event</option></select></label><button class="btn primary" id="startNewEvent">Open Full Workbook</button></div></section>`}
function fill(form,data){Object.entries(data||{}).forEach(([k,v])=>{const el=form.elements.namedItem(k);if(!el)return;if(el instanceof RadioNodeList){[...el].forEach(x=>x.checked=Array.isArray(v)?v.includes(x.value):x.value===v)}else if(el.type==='checkbox')el.checked=!!v;else el.value=Array.isArray(v)?v.join('\n'):v??''})}
function serialize(form){const out={};new FormData(form).forEach((v,k)=>{if(out[k]!==undefined)out[k]=[].concat(out[k],v);else out[k]=v});form.querySelectorAll('input[type=checkbox]').forEach(x=>{if(!x.checked&&out[x.name]===undefined)out[x.name]=false});return out}
function workbookModal(event=null,key='wedding',isNew=false){const modal=document.createElement('div');modal.className='portal-modal workbook-modal';const source=event?activeForm(event):{email:user.email,primaryClient:user.user_metadata?.full_name||''};modal.innerHTML=`<div class="portal-modal-card workbook-card"><button class="modal-close">×</button><div class="eyebrow">${esc(event?.businesses?.name||events[0]?.businesses?.name||'New Event')}</div><h2>Full Event Workbook</h2><p class="form-intro">Complete the same full event profile used by the business.</p><div class="client-workbook">${formHtml(key)}</div><div id="workbookStatus" class="status"></div></div>`;document.body.appendChild(modal);const form=modal.querySelector('form');fill(form,source);const originalSubmit=form.querySelector('button[type=submit]');if(originalSubmit){originalSubmit.textContent=isNew?'Submit New Booking Request':'Submit Event Workbook';originalSubmit.classList.add('client-submit-workbook')}const actions=originalSubmit?.parentElement;if(actions){const draft=document.createElement('button');draft.type='button';draft.className='btn';draft.textContent='Save Draft';draft.onclick=()=>saveWorkbook(event,key,form,false,isNew,modal);actions.prepend(draft)}form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;saveWorkbook(event,key,form,true,isNew,modal)};modal.querySelector('.modal-close').onclick=()=>modal.remove();}
async function saveWorkbook(event,key,form,submit,isNew,modal){const payload=serialize(form);const status=modal.querySelector('#workbookStatus');status.textContent=submit?'Submitting…':'Saving…';let result;if(isNew){result=await supabase.rpc('create_client_event_request_from_workbook',{form_key:key,form_payload:payload,submit_request:submit});}else{result=await supabase.rpc('save_client_event_workbook',{target_event_id:event.id,form_key:key,form_payload:payload,submit_workbook:submit});}if(result.error){status.className='status error';status.textContent=result.error.message;return}status.className='status success';status.textContent=submit?'Submitted successfully.':'Draft saved.';if(submit){setTimeout(()=>{modal.remove();activeTab='events';render()},500)}}
function viewDoc(event,title,payload){const modal=document.createElement('div');modal.className='portal-modal';modal.innerHTML=`<div class="portal-modal-card document-modal"><button class="modal-close">×</button><h2>${esc(title)}</h2><div class="document-copy">${Object.entries(payload||{}).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>`<div class="document-field"><small>${esc(k.replace(/([A-Z])/g,' $1'))}</small><strong>${esc(Array.isArray(v)?v.join(', '):v)}</strong></div>`).join('')}</div></div>`;document.body.appendChild(modal);modal.querySelector('.modal-close').onclick=()=>modal.remove()}
function bind(){document.querySelector('#signout').onclick=async()=>{await supabase.auth.signOut();authScreen()};document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;render()});document.querySelectorAll('[data-open-workbook]').forEach(b=>b.onclick=()=>{const e=events.find(x=>x.id===b.dataset.openWorkbook);workbookModal(e,activeKey(e),false)});document.querySelectorAll('[data-view-booking]').forEach(b=>b.onclick=()=>{const e=events.find(x=>x.id===b.dataset.viewBooking);viewDoc(e,'Booking Request',e.event_data?.documents?.bookingRequest||activeForm(e))});document.querySelectorAll('[data-view-workbook]').forEach(b=>b.onclick=()=>{const e=events.find(x=>x.id===b.dataset.viewWorkbook);viewDoc(e,'Event Workbook',submitted(e)?.payload||{})});document.querySelector('#startNewEvent')?.addEventListener('click',()=>workbookModal(null,document.querySelector('#newEventType').value,true));}
(async()=>{const {data:{session}}=await supabase.auth.getSession();user=session?.user||null;if(!user)return authScreen();render();supabase.auth.onAuthStateChange((_e,s)=>{user=s?.user||null;if(!user)authScreen()})})();
