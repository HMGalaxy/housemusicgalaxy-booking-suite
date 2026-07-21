// apps/client/app.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// shared/js/config.js
var SUPABASE_URL = "https://dgpaiggcgiasqqpeclsz.supabase.co";
var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gYe9tFt9SbBgKkKghES5kw_KFIHK5RL";

// shared/js/modules.js?v=7030
var commonClient = `<div class="card"><h2>Client Information</h2><p class="card-intro">Tell us who we will be working with.</p><div class="grid"><div class="field"><label>Primary Client Name <span class="req">*</span></label><input name="primaryClient" required placeholder="Full name"></div><div class="field"><label>Second Client / Company</label><input name="secondClient" placeholder="Optional"></div><div class="field"><label>Email <span class="req">*</span></label><input type="email" name="email" required placeholder="name@example.com"></div><div class="field"><label>Phone</label><input type="tel" name="phone" placeholder="(555) 555-5555"></div><div class="field full"><label>Preferred Contact Method</label><select name="contactMethod"><option>Email</option><option>Phone</option><option>Text message</option></select></div></div></div>`;
var production = `<div class="card"><h2>Production Requirements</h2><p class="card-intro">Select everything you may need. We will make a final recommendation.</p><div class="field full"><label>Audio & DJ Services</label><div class="checkgrid">${["DJ Performance Only", "Essential Sound System", "Premium Sound System", "Additional Speakers", "Subwoofers", "Multiple Audio Zones", "Wireless Microphone", "Not Sure \u2014 Please Recommend"].map((x) => `<label class="check"><input type="checkbox" name="services" value="${x}"><span>${x}</span></label>`).join("")}</div></div><div class="field full" style="margin-top:16px"><label>Lighting & Effects</label><div class="checkgrid">${["No Lighting Required", "Dance Floor Lighting", "Intelligent Moving Lights", "Ambient Uplighting", "Monogram / Gobo Projection", "Haze / Atmosphere Effects", "Dancing on the Clouds", "Not Sure \u2014 Please Recommend"].map((x) => `<label class="check"><input type="checkbox" name="lighting" value="${x}"><span>${x}</span></label>`).join("")}</div></div></div>`;
var confirmation = `<div class="card"><h2>Notes & Confirmation</h2><p class="card-intro">Add anything important before submitting the consultation.</p><div class="field"><label>Additional Notes</label><textarea name="notes" placeholder="Special requests, venue restrictions, ideas, or questions..."></textarea></div><div class="check" style="margin-top:16px"><input type="checkbox" name="confirmAccurate" required><span>I confirm the information is accurate and understand that a signed agreement and deposit are required to reserve the event date.</span></div><div class="section-actions"><button class="btn" type="button" data-action="save">Save Progress</button><button class="btn primary" type="submit">Complete Consultation</button></div></div>`;
function weddingForm() {
  return `<form data-form="wedding">${commonClient}<div class="card"><h2>Wedding Details</h2><p class="card-intro">The core details of your wedding day.</p><div class="grid three"><div class="field"><label>Wedding Date <span class="req">*</span></label><input type="date" name="eventDate" required></div><div class="field"><label>Guest Count</label><input type="number" min="1" name="guestCount" placeholder="150"></div><div class="field"><label>Requested Package</label><select name="requestedPackage"><option value="">Select package</option><option>Essential</option><option>Sunset Sessions</option><option>Club Experience</option><option>Galaxy Experience</option><option>Vinyl Session</option></select></div><div class="field"><label>Venue Name</label><input name="venueName"></div><div class="field"><label>City / State</label><input name="venueCity"></div><div class="field"><label>Indoor / Outdoor</label><select name="setting"><option>Indoor</option><option>Outdoor</option><option>Both</option></select></div><div class="field"><label>Setup Start <span class="req">*</span></label><input type="time" step="900" name="setupStartTime" required></div><div class="field"><label>Event Start <span class="req">*</span></label><input type="time" step="900" name="startTime" required></div><div class="field"><label>Event End <span class="req">*</span></label><input type="time" step="900" name="endTime" required></div><div class="field"><label>Breakdown End <span class="req">*</span></label><input type="time" step="900" name="breakdownEndTime" required></div><div class="field"><label>Ceremony Start</label><input type="time" step="900" name="ceremonyTime"></div><div class="field"><label>Cocktail Hour</label><input type="time" step="900" name="cocktailTime"></div></div></div>${production}<div class="card"><h2>Music Direction</h2><p class="card-intro">Give us a first sense of the atmosphere you want.</p><div class="grid"><div class="field"><label>Preferred Styles</label><input name="musicStyles" placeholder="House, disco, classics, open format..."></div><div class="field"><label>Do-Not-Play Styles</label><input name="doNotPlay"></div><div class="field full"><label>Special Moments</label><textarea name="specialMoments" placeholder="Grand entrance, first dance, parent dances, cake cutting..."></textarea></div></div></div>${confirmation}</form>`;
}
function corporateForm() {
  return `<form data-form="corporate">${commonClient}<div class="card"><h2>Corporate Event Details</h2><p class="card-intro">Program, venue and audience information.</p><div class="grid three"><div class="field"><label>Event Date <span class="req">*</span></label><input type="date" name="eventDate" required></div><div class="field"><label>Event Type</label><select name="eventType"><option>Company Party</option><option>Conference</option><option>Product Launch</option><option>Networking Event</option><option>Awards Dinner</option><option>Holiday Party</option><option>Other</option></select></div><div class="field"><label>Expected Attendance</label><input type="number" name="guestCount"></div><div class="field"><label>Company / Organization</label><input name="company"></div><div class="field"><label>Venue Name</label><input name="venueName"></div><div class="field"><label>City / State</label><input name="venueCity"></div><div class="field"><label>Setup Start <span class="req">*</span></label><input type="time" step="900" name="setupStartTime" required></div><div class="field"><label>Event Start <span class="req">*</span></label><input type="time" step="900" name="startTime" required></div><div class="field"><label>Event End <span class="req">*</span></label><input type="time" step="900" name="endTime" required></div><div class="field"><label>Breakdown End <span class="req">*</span></label><input type="time" step="900" name="breakdownEndTime" required></div><div class="field"><label>Dress Code</label><select name="dressCode"><option>Business Casual</option><option>Formal</option><option>Black Tie</option><option>Branded / Themed</option></select></div></div></div><div class="card"><h2>Program & Presentation</h2><p class="card-intro">Help us plan around speakers, awards and branded content.</p><div class="grid"><div class="field"><label>Master of Ceremonies Needed?</label><select name="mcNeeded"><option>No</option><option>Yes</option><option>Not sure</option></select></div><div class="field"><label>Presentations / Speeches</label><select name="presentations"><option>No</option><option>Yes</option></select></div><div class="field full"><label>Program Timeline</label><textarea name="timeline" placeholder="Welcome, dinner, presentations, awards, entertainment..."></textarea></div><div class="field full"><label>Brand Guidelines / Content Notes</label><textarea name="brandNotes"></textarea></div></div></div>${production}${confirmation}</form>`;
}
function privateForm() {
  return `<form data-form="private">${commonClient}<div class="card"><h2>Private Event Details</h2><p class="card-intro">Tell us what you are celebrating.</p><div class="grid three"><div class="field"><label>Event Date <span class="req">*</span></label><input type="date" name="eventDate" required></div><div class="field"><label>Celebration Type</label><select name="eventType"><option>Birthday</option><option>Anniversary</option><option>Graduation</option><option>Engagement Party</option><option>Family Celebration</option><option>Pool Party</option><option>Other</option></select></div><div class="field"><label>Guest Count</label><input type="number" name="guestCount"></div><div class="field"><label>Venue Name / Residence</label><input name="venueName"></div><div class="field"><label>City / State</label><input name="venueCity"></div><div class="field"><label>Indoor / Outdoor</label><select name="setting"><option>Indoor</option><option>Outdoor</option><option>Both</option></select></div><div class="field"><label>Setup Start <span class="req">*</span></label><input type="time" step="900" name="setupStartTime" required></div><div class="field"><label>Event Start <span class="req">*</span></label><input type="time" step="900" name="startTime" required></div><div class="field"><label>Event End <span class="req">*</span></label><input type="time" step="900" name="endTime" required></div><div class="field"><label>Breakdown End <span class="req">*</span></label><input type="time" step="900" name="breakdownEndTime" required></div><div class="field"><label>Age Range</label><input name="ageRange" placeholder="Example: Mostly 30\u201350"></div></div></div><div class="card"><h2>Style & Atmosphere</h2><p class="card-intro">Describe the energy you want for the celebration.</p><div class="grid"><div class="field"><label>Desired Energy</label><select name="energy"><option>Relaxed background music</option><option>Build gradually</option><option>High-energy dance party</option><option>Mixed atmosphere</option></select></div><div class="field"><label>Theme / Dress Code</label><input name="theme"></div><div class="field full"><label>Music Preferences</label><textarea name="musicStyles" placeholder="Favorite genres, artists, decades and must-play songs..."></textarea></div></div></div>${production}${confirmation}</form>`;
}

// apps/client/app.js
var supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
var app = document.querySelector("#clientApp");
var VERSION = "7.0.2";
var user = null;
var events = [];
var activeTab = "events";
var esc = (v) => String(v ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]);
var fmt = (d) => d ? new Intl.DateTimeFormat(void 0, { month: "short", day: "numeric", year: "numeric" }).format(/* @__PURE__ */ new Date(`${d}T12:00:00`)) : "Date pending";
var activeKey = (e) => e.event_data?.active || typeKey(e.event_type);
var activeForm = (e) => e.event_data?.forms?.[activeKey(e)] || {};
var submitted = (e) => e.event_data?.documents?.eventWorkbook || e.event_data?.documents?.eventForm || null;
var typeKey = (t) => {
  t = String(t || "").toLowerCase();
  return t.includes("corporate") ? "corporate" : t.includes("private") || t.includes("party") || t.includes("birthday") ? "private" : "wedding";
};
var formHtml = (k) => k === "corporate" ? corporateForm() : k === "private" ? privateForm() : weddingForm();
function authScreen(msg = "") {
  app.innerHTML = `
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
        <div id="portalStatus" class="client-login-status ${msg ? "is-visible" : ""}" role="status" aria-live="polite">${esc(msg)}</div>
        <p class="client-login-help">We\u2019ll email you a secure sign-in link. No password required.</p>
        <div class="client-login-trust">
          <span>\u25C7 Secure login</span><span>\u25C7 Private workspace</span><span>\u25C7 No password</span>
        </div>
        <div class="client-powered">Powered by <b>Galaxy Cue</b> \xB7 v${VERSION}</div>
      </section>
    </main>`;
  const form = document.querySelector("#magic");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const button = form.querySelector("button");
    const status = document.querySelector("#portalStatus");
    const email = String(new FormData(form).get("email") || "").trim();
    button.disabled = true;
    button.classList.add("is-loading");
    button.querySelector("span").textContent = "Sending secure link\u2026";
    status.className = "client-login-status is-visible";
    status.textContent = "Preparing your secure sign-in link\u2026";
    const redirect = new URL("client-portal.html", location.href);
    redirect.searchParams.set("portal", "1");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect.toString(), shouldCreateUser: true, data: { account_type: "client" } } });
    button.disabled = false;
    button.classList.remove("is-loading");
    button.querySelector("span").textContent = "Email me a sign-in link";
    if (error) {
      status.className = "client-login-status is-visible is-error";
      status.textContent = error.message;
      return;
    }
    status.className = "client-login-status is-visible is-success";
    status.innerHTML = `<strong>Check your inbox</strong><span>We sent a secure sign-in link to ${esc(email)}.</span>`;
    form.reset();
  };
}
function workflow(e) {
  const current = e.event_data?.workflow?.currentState || "EVENT_WORKBOOK_PENDING";
  const steps = [["EVENT_WORKBOOK_PENDING", "Event Workbook"], ["QUOTE_PREPARATION", "Quote"], ["CONTRACT_PREPARATION", "Contract"], ["PLANNING_PENDING", "Planning + Music"], ["TIMELINE_PENDING", "Timeline"], ["EVENT_READY", "Event Ready"]];
  let idx = steps.findIndex((x) => x[0] === current);
  if (idx < 0) idx = 0;
  return steps.map((x, i) => `<div class="progress-row ${i < idx ? "done" : i === idx ? "current" : ""}"><i>${i < idx ? "\u2713" : i + 1}</i><span>${x[1]}</span></div>`).join("");
}
function eventCard(e) {
  const doc = submitted(e), draft = e.event_data?.clientEventForm?.status === "draft";
  return `<article class="event-card"><div class="event-card-head"><div><small class="eyebrow">${esc(fmt(e.event_date))}</small><h3>${esc(e.title || e.event_type || "Event")}</h3><p>${esc(e.businesses?.name || "Entertainment Company")} \xB7 ${esc(e.venue_name || "Venue pending")}</p></div><span class="chip">${doc ? "Workbook submitted" : "Action required"}</span></div>${doc ? `<div class="submitted-banner"><strong>\u2713 Full Event Workbook submitted</strong><span>Your business can now prepare the quote.</span></div>` : `<div class="action-banner primary-action"><div><small>ACTION REQUIRED</small><strong>Complete your Full Event Workbook</strong><span>This is the complete event profile used by your entertainment company.</span></div><button class="btn primary" data-open-workbook="${e.id}">${draft ? "Continue Workbook" : "Start Workbook"}</button></div>`}<section class="event-documents"><div class="section-title"><small>Documents</small><h4>Event documents</h4></div><div class="document-list"><button class="document-row" data-view-booking="${e.id}"><span><b>Booking Request</b><small>Original request</small></span><em>View</em></button><button class="document-row ${doc ? "" : "disabled"}" ${doc ? `data-view-workbook="${e.id}"` : ""}><span><b>Event Workbook</b><small>${doc ? "Submitted copy" : "Pending"}</small></span><em>${doc ? "View" : "Pending"}</em></button></div></section><div class="progress">${workflow(e)}</div></article>`;
}
async function render() {
  const { data, error } = await supabase.rpc("get_my_client_events");
  if (error) {
    app.innerHTML = `<main class="auth-wrap"><section class="auth-card"><h1>Client Portal</h1><p class="status error">${esc(error.message)}</p></section></main>`;
    return;
  }
  events = data || [];
  const business = events[0]?.businesses?.name || "Your Entertainment Company";
  app.innerHTML = `<div class="portal-shell"><header class="portal-topbar"><div class="portal-brand"><img src="assets/galaxy-cue-logo.png"><div><strong>GALAXY CUE</strong><span>Client Portal \xB7 v${VERSION}</span></div></div><button class="btn ghost" id="signout">Sign Out</button></header><main class="portal-main"><nav class="client-tabs"><button class="${activeTab === "events" ? "active" : ""}" data-tab="events">My Events</button><button class="${activeTab === "new" ? "active" : ""}" data-tab="new">\uFF0B Book a New Event</button></nav>${activeTab === "events" ? `<section class="hero"><div><div class="eyebrow">${esc(business)}</div><h1>Your Events</h1><p>Complete required actions and keep every event in one place.</p></div></section><section class="panel"><div class="event-list">${events.length ? events.map(eventCard).join("") : '<div class="empty"><h3>No events yet</h3><p>Use Book a New Event to send your first request.</p></div>'}</div></section>` : newEventView(business)}</main></div>`;
  bind();
}
function newEventView(business) {
  return `<section class="hero"><div><div class="eyebrow">${esc(business)}</div><h1>Book a New Event</h1><p>Choose the event type, then complete the full workbook. It will be sent directly to your connected business.</p></div></section><section class="panel"><div class="new-event-type"><label class="field"><span>Event type</span><select id="newEventType"><option value="wedding">Wedding</option><option value="corporate">Corporate Event</option><option value="private">Private Event</option></select></label><button class="btn primary" id="startNewEvent">Open Full Workbook</button></div></section>`;
}
function fill(form, data) {
  Object.entries(data || {}).forEach(([k, v]) => {
    const el = form.elements.namedItem(k);
    if (!el) return;
    if (el instanceof RadioNodeList) {
      [...el].forEach((x) => x.checked = Array.isArray(v) ? v.includes(x.value) : x.value === v);
    } else if (el.type === "checkbox") el.checked = !!v;
    else el.value = Array.isArray(v) ? v.join("\n") : v ?? "";
  });
}
function serialize(form) {
  const out = {};
  new FormData(form).forEach((v, k) => {
    if (out[k] !== void 0) out[k] = [].concat(out[k], v);
    else out[k] = v;
  });
  form.querySelectorAll("input[type=checkbox]").forEach((x) => {
    if (!x.checked && out[x.name] === void 0) out[x.name] = false;
  });
  return out;
}
function workbookModal(event = null, key = "wedding", isNew = false) {
  const modal = document.createElement("div");
  modal.className = "portal-modal workbook-modal";
  const source = event ? activeForm(event) : { email: user.email, primaryClient: user.user_metadata?.full_name || "" };
  modal.innerHTML = `<div class="portal-modal-card workbook-card"><button class="modal-close">\xD7</button><div class="eyebrow">${esc(event?.businesses?.name || events[0]?.businesses?.name || "New Event")}</div><h2>Full Event Workbook</h2><p class="form-intro">Complete the same full event profile used by the business.</p><div class="client-workbook">${formHtml(key)}</div><div id="workbookStatus" class="status"></div></div>`;
  document.body.appendChild(modal);
  const form = modal.querySelector("form");
  fill(form, source);
  const originalSubmit = form.querySelector("button[type=submit]");
  if (originalSubmit) {
    originalSubmit.textContent = isNew ? "Submit New Booking Request" : "Submit Event Workbook";
    originalSubmit.classList.add("client-submit-workbook");
  }
  const actions = originalSubmit?.parentElement;
  if (actions) {
    const draft = document.createElement("button");
    draft.type = "button";
    draft.className = "btn";
    draft.textContent = "Save Draft";
    draft.onclick = () => saveWorkbook(event, key, form, false, isNew, modal);
    actions.prepend(draft);
  }
  form.onsubmit = (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    saveWorkbook(event, key, form, true, isNew, modal);
  };
  modal.querySelector(".modal-close").onclick = () => modal.remove();
}
async function saveWorkbook(event, key, form, submit, isNew, modal) {
  const payload = serialize(form);
  const status = modal.querySelector("#workbookStatus");
  status.textContent = submit ? "Submitting\u2026" : "Saving\u2026";
  let result;
  if (isNew) {
    result = await supabase.rpc("create_client_event_request_from_workbook", { form_key: key, form_payload: payload, submit_request: submit });
  } else {
    result = await supabase.rpc("save_client_event_workbook", { target_event_id: event.id, form_key: key, form_payload: payload, submit_workbook: submit });
  }
  if (result.error) {
    status.className = "status error";
    status.textContent = result.error.message;
    return;
  }
  status.className = "status success";
  status.textContent = submit ? "Submitted successfully." : "Draft saved.";
  if (submit) {
    setTimeout(() => {
      modal.remove();
      activeTab = "events";
      render();
    }, 500);
  }
}
function viewDoc(event, title, payload) {
  const modal = document.createElement("div");
  modal.className = "portal-modal";
  modal.innerHTML = `<div class="portal-modal-card document-modal"><button class="modal-close">\xD7</button><h2>${esc(title)}</h2><div class="document-copy">${Object.entries(payload || {}).filter(([, v]) => v !== "" && v != null).map(([k, v]) => `<div class="document-field"><small>${esc(k.replace(/([A-Z])/g, " $1"))}</small><strong>${esc(Array.isArray(v) ? v.join(", ") : v)}</strong></div>`).join("")}</div></div>`;
  document.body.appendChild(modal);
  modal.querySelector(".modal-close").onclick = () => modal.remove();
}
function bind() {
  document.querySelector("#signout").onclick = async () => {
    await supabase.auth.signOut();
    authScreen();
  };
  document.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => {
    activeTab = b.dataset.tab;
    render();
  });
  document.querySelectorAll("[data-open-workbook]").forEach((b) => b.onclick = () => {
    const e = events.find((x) => x.id === b.dataset.openWorkbook);
    workbookModal(e, activeKey(e), false);
  });
  document.querySelectorAll("[data-view-booking]").forEach((b) => b.onclick = () => {
    const e = events.find((x) => x.id === b.dataset.viewBooking);
    viewDoc(e, "Booking Request", e.event_data?.documents?.bookingRequest || activeForm(e));
  });
  document.querySelectorAll("[data-view-workbook]").forEach((b) => b.onclick = () => {
    const e = events.find((x) => x.id === b.dataset.viewWorkbook);
    viewDoc(e, "Event Workbook", submitted(e)?.payload || {});
  });
  document.querySelector("#startNewEvent")?.addEventListener("click", () => workbookModal(null, document.querySelector("#newEventType").value, true));
}
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  user = session?.user || null;
  if (!user) return authScreen();
  render();
  supabase.auth.onAuthStateChange((_e, s) => {
    user = s?.user || null;
    if (!user) authScreen();
  });
})();
