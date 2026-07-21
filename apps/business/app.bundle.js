var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/js/config.js
var SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY;
var init_config = __esm({
  "shared/js/config.js"() {
    SUPABASE_URL = "https://dgpaiggcgiasqqpeclsz.supabase.co";
    SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gYe9tFt9SbBgKkKghES5kw_KFIHK5RL";
  }
});

// shared/js/supabase.js
var supabase_exports = {};
__export(supabase_exports, {
  acceptBookingRequest: () => acceptBookingRequest,
  createSignedFileUrl: () => createSignedFileUrl,
  deleteBusinessRow: () => deleteBusinessRow,
  ensureBusinessWorkspace: () => ensureBusinessWorkspace,
  getCloudHealth: () => getCloudHealth,
  getCurrentUser: () => getCurrentUser,
  listBookingFiles: () => listBookingFiles,
  listBookingRequests: () => listBookingRequests,
  listBookings: () => listBookings,
  listBusinessRows: () => listBusinessRows,
  listCloudClients: () => listCloudClients,
  listCloudEvents: () => listCloudEvents,
  loadBooking: () => loadBooking,
  loadCloudBusinessSettings: () => loadCloudBusinessSettings,
  loadCloudEvent: () => loadCloudEvent,
  removeBookingFile: () => removeBookingFile,
  removeCloudClient: () => removeCloudClient,
  removeCloudEvent: () => removeCloudEvent,
  restoreAuthSession: () => restoreAuthSession,
  saveCloudBusinessSettings: () => saveCloudBusinessSettings,
  saveCloudClient: () => saveCloudClient,
  saveCloudEvent: () => saveCloudEvent,
  sendMagicLink: () => sendMagicLink,
  signOut: () => signOut,
  submitBookingRequest: () => submitBookingRequest,
  supabase: () => supabase,
  updateBookingRequest: () => updateBookingRequest,
  uploadBookingFile: () => uploadBookingFile,
  upsertBooking: () => upsertBooking,
  upsertBusinessRow: () => upsertBusinessRow
});
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
async function getCurrentUser() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData?.session?.user) return sessionData.session.user;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user || null;
}
function cleanAuthCallbackUrl() {
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
}
async function restoreAuthSession() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const errorDescription = url.searchParams.get("error_description") || new URLSearchParams(window.location.hash.replace(/^#/, "")).get("error_description");
  if (errorDescription) {
    cleanAuthCallbackUrl();
    return { user: null, error: new Error(errorDescription), handled: true };
  }
  let { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return { user: null, error: sessionError, handled: false };
  }
  if (sessionData?.session?.user) {
    const hadCallback = Boolean(code || window.location.hash.includes("access_token="));
    if (hadCallback) cleanAuthCallbackUrl();
    return { user: sessionData.session.user, error: null, handled: hadCallback };
  }
  if (code) {
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    if (exchanged.error) {
      cleanAuthCallbackUrl();
      return { user: null, error: exchanged.error, handled: true };
    }
    cleanAuthCallbackUrl();
    return {
      user: exchanged.data?.session?.user || exchanged.data?.user || null,
      error: null,
      handled: true
    };
  }
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const restored = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    cleanAuthCallbackUrl();
    if (restored.error) {
      return { user: null, error: restored.error, handled: true };
    }
    return {
      user: restored.data?.session?.user || restored.data?.user || null,
      error: null,
      handled: true
    };
  }
  return { user: null, error: null, handled: false };
}
async function sendMagicLink(email) {
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  return supabase.auth.signInWithOtp({
    email: String(email || "").trim().toLowerCase(),
    options: { emailRedirectTo: redirectTo }
  });
}
async function signOut() {
  return supabase.auth.signOut();
}
async function upsertBooking(state2, user) {
  if (!user) throw new Error("Sign in before syncing.");
  const forms = state2.forms || {};
  const consultation = forms.wedding || forms.corporate || forms.private || {};
  const quote = forms.quote || {};
  const payload = {
    owner_id: user.id,
    booking_ref: state2.bookingId,
    client_name: consultation.primaryClient || consultation.company || quote.clientName || "",
    client_email: consultation.email || quote.clientEmail || user.email || "",
    event_type: forms.wedding ? "Wedding" : forms.corporate ? "Corporate" : forms.private ? "Private Party" : "",
    event_date: consultation.eventDate || quote.eventDate || null,
    start_time: consultation.startTime || consultation.ceremonyTime || quote.startTime || null,
    end_time: consultation.endTime || quote.endTime || null,
    venue_name: consultation.venueName || quote.venueName || "",
    status: quote.quoteStatus || "Draft",
    booking_data: state2,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  return supabase.from("bookings").upsert(payload, { onConflict: "booking_ref" }).select().single();
}
async function loadBooking(bookingRef, user) {
  if (!user) throw new Error("Sign in before loading cloud data.");
  return supabase.from("bookings").select("*").eq("booking_ref", bookingRef).single();
}
async function listBookings(user) {
  if (!user) return { data: [], error: null };
  return supabase.from("bookings").select("id,booking_ref,client_name,event_type,event_date,venue_name,status,updated_at").order("updated_at", { ascending: false });
}
async function uploadBookingFile(file, bookingRef, user) {
  if (!user) throw new Error("Sign in before uploading files.");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${bookingRef}/${Date.now()}-${safeName}`;
  const uploaded = await supabase.storage.from("booking-files").upload(path, file, { upsert: false });
  if (uploaded.error) return uploaded;
  const record = await supabase.from("booking_files").insert({
    owner_id: user.id,
    booking_ref: bookingRef,
    file_name: file.name,
    file_path: path,
    mime_type: file.type || null,
    file_size: file.size || null
  }).select().single();
  return record;
}
async function listBookingFiles(bookingRef, user) {
  if (!user) return { data: [], error: null };
  return supabase.from("booking_files").select("*").eq("booking_ref", bookingRef).order("created_at", { ascending: false });
}
async function removeBookingFile(row, user) {
  if (!user) throw new Error("Sign in before removing files.");
  const storageResult = await supabase.storage.from("booking-files").remove([row.file_path]);
  if (storageResult.error) return storageResult;
  return supabase.from("booking_files").delete().eq("id", row.id);
}
async function createSignedFileUrl(path) {
  return supabase.storage.from("booking-files").createSignedUrl(path, 3600);
}
async function ensureBusinessWorkspace(user) {
  if (!user) return { data: null, error: new Error("Sign in first.") };
  const membership = await supabase.from("business_members").select("business_id, role, businesses(id,name,slug,created_at)").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (membership.error) return membership;
  if (membership.data) return { data: membership.data, error: null };
  const businessName = user.user_metadata?.business_name || user.user_metadata?.full_name || (user.email ? `${user.email.split("@")[0]}'s Business` : "My Entertainment Business");
  const created = await supabase.rpc("create_business_for_current_user", {
    requested_name: businessName
  });
  if (created.error) return created;
  return supabase.from("business_members").select("business_id, role, businesses(id,name,slug,created_at)").eq("user_id", user.id).eq("business_id", created.data).single();
}
async function getCloudHealth() {
  const { data: authData } = await supabase.auth.getSession();
  if (!authData.session) return { ok: true, authenticated: false, message: "Cloud connected; user is signed out." };
  const result = await supabase.from("business_members").select("business_id").limit(1);
  if (result.error) return { ok: false, authenticated: true, message: result.error.message, error: result.error };
  return { ok: true, authenticated: true, message: "Cloud foundation is available." };
}
async function listBusinessRows(table, businessId, columns = "*") {
  if (!businessId) return { data: [], error: new Error("No active business workspace.") };
  return supabase.from(table).select(columns).eq("business_id", businessId).order("updated_at", { ascending: false });
}
async function upsertBusinessRow(table, row, businessId) {
  if (!businessId) return { data: null, error: new Error("No active business workspace.") };
  return supabase.from(table).upsert({ ...row, business_id: businessId }).select().single();
}
async function deleteBusinessRow(table, id, businessId) {
  if (!businessId) return { data: null, error: new Error("No active business workspace.") };
  return supabase.from(table).delete().eq("id", id).eq("business_id", businessId);
}
async function loadCloudBusinessSettings(businessId) {
  if (!businessId) return { data: null, error: new Error("No active business workspace.") };
  return supabase.from("business_settings").select("settings").eq("business_id", businessId).maybeSingle();
}
async function saveCloudBusinessSettings(settings, businessId) {
  if (!businessId) return { data: null, error: new Error("No active business workspace.") };
  return supabase.from("business_settings").upsert({
    business_id: businessId,
    settings,
    updated_by: (await supabase.auth.getUser()).data.user?.id || null,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, { onConflict: "business_id" }).select("settings").single();
}
async function listCloudClients(businessId) {
  if (!businessId) return { data: [], error: new Error("No active business workspace.") };
  return supabase.from("clients").select("*").eq("business_id", businessId).order("updated_at", { ascending: false });
}
async function saveCloudClient(client, businessId) {
  if (!businessId) return { data: null, error: new Error("No active business workspace.") };
  const payload = {
    business_id: businessId,
    name: client.name || "Unnamed Client",
    company: client.company || null,
    email: client.email || null,
    phone: client.phone || null,
    address: client.address || null,
    notes: client.notes || null
  };
  if (client.id && /^[0-9a-f-]{36}$/i.test(client.id)) payload.id = client.id;
  return supabase.from("clients").upsert(payload).select().single();
}
async function removeCloudClient(id, businessId) {
  if (!businessId) return { data: null, error: new Error("No active business workspace.") };
  return supabase.from("clients").delete().eq("id", id).eq("business_id", businessId);
}
function eventPayloadFromState(state2, businessId, clientId = null) {
  const forms = state2.forms || {};
  const consultation = forms.wedding || forms.corporate || forms.private || {};
  const quote = forms.quote || {};
  const eventType = forms.wedding ? "Wedding" : forms.corporate ? "Corporate" : forms.private ? "Private Party" : "Event";
  const clientName = consultation.primaryClient || consultation.company || quote.clientName || "";
  return {
    business_id: businessId,
    client_id: clientId || null,
    booking_ref: state2.bookingId,
    title: clientName ? `${clientName} \u2014 ${eventType}` : eventType,
    event_type: eventType,
    event_date: consultation.eventDate || quote.eventDate || null,
    start_time: consultation.startTime || consultation.ceremonyTime || quote.startTime || null,
    end_time: consultation.endTime || quote.endTime || null,
    venue_name: consultation.venueName || quote.venueName || null,
    venue_address: consultation.venueAddress || quote.venueAddress || null,
    status: String(quote.quoteStatus || "draft").toLowerCase(),
    event_data: state2
  };
}
async function saveCloudEvent(state2, businessId, clientId = null) {
  if (!businessId) return { data: null, error: new Error("No active business workspace.") };
  return supabase.from("events").upsert(eventPayloadFromState(state2, businessId, clientId), { onConflict: "business_id,booking_ref" }).select("*").single();
}
async function listCloudEvents(businessId) {
  if (!businessId) return { data: [], error: new Error("No active business workspace.") };
  const result = await supabase.from("events").select("*, clients(id,name,company,email,phone)").eq("business_id", businessId).order("event_date", { ascending: true });
  if (result.error) return result;
  return {
    data: (result.data || []).map((row) => ({
      ...row,
      client_name: row.clients?.name || row.clients?.company || row.event_data?.forms?.wedding?.primaryClient || row.event_data?.forms?.corporate?.company || row.event_data?.forms?.private?.primaryClient || "",
      client_email: row.clients?.email || row.event_data?.forms?.wedding?.email || row.event_data?.forms?.corporate?.email || row.event_data?.forms?.private?.email || "",
      booking_data: row.event_data,
      updated_at: row.updated_at
    })),
    error: null
  };
}
async function loadCloudEvent(bookingRef, businessId) {
  if (!businessId) return { data: null, error: new Error("No active business workspace.") };
  const result = await supabase.from("events").select("*, clients(id,name,company,email,phone)").eq("business_id", businessId).eq("booking_ref", bookingRef).single();
  if (result.error) return result;
  return { data: { ...result.data, booking_data: result.data.event_data }, error: null };
}
async function removeCloudEvent(bookingRef, businessId) {
  if (!businessId) return { data: null, error: new Error("No active business workspace.") };
  return supabase.from("events").delete().eq("booking_ref", bookingRef).eq("business_id", businessId);
}
async function submitBookingRequest(request) {
  const { error } = await supabase.from("booking_requests").insert(request);
  return { data: error ? null : request, error };
}
async function listBookingRequests(businessId) {
  if (!businessId) return { data: [], error: new Error("No active business workspace.") };
  return supabase.from("booking_requests").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
}
async function updateBookingRequest(id, businessId, changes) {
  if (!businessId) return { data: null, error: new Error("No active business workspace.") };
  return supabase.from("booking_requests").update(changes).eq("id", id).eq("business_id", businessId).select("*").single();
}
async function acceptBookingRequest(requestId, businessId) {
  if (!requestId) return { data: null, error: new Error("Booking request ID is required.") };
  if (!businessId) return { data: null, error: new Error("No active business workspace.") };
  return supabase.rpc("accept_booking_request_for_current_business", {
    target_request_id: requestId,
    expected_business_id: businessId
  });
}
var supabase;
var init_supabase = __esm({
  "shared/js/supabase.js"() {
    init_config();
    supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
});

// shared/js/core/event-bus.js
function createEventBus() {
  const listeners = /* @__PURE__ */ new Map();
  return Object.freeze({
    on(type, handler) {
      if (typeof handler !== "function") throw new TypeError("Event handler must be a function");
      const bucket = listeners.get(type) || /* @__PURE__ */ new Set();
      bucket.add(handler);
      listeners.set(type, bucket);
      return () => bucket.delete(handler);
    },
    emit(type, payload) {
      (listeners.get(type) || []).forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[Galaxy Cue] ${type} listener failed`, error);
        }
      });
    },
    clear(type) {
      type ? listeners.delete(type) : listeners.clear();
    }
  });
}

// shared/js/core/state.js
function createStore(initialState = {}) {
  let state2 = { ...initialState };
  const subscribers = /* @__PURE__ */ new Set();
  const notify = () => subscribers.forEach((fn) => {
    try {
      fn(state2);
    } catch (error) {
      console.error("[Galaxy Cue] store subscriber failed", error);
    }
  });
  return Object.freeze({
    getState: () => state2,
    setState(patch) {
      state2 = { ...state2, ...typeof patch === "function" ? patch(state2) : patch };
      notify();
      return state2;
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    }
  });
}

// shared/js/core/storage.js
var storage = {
  read(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      console.warn(`[Galaxy Cue] Could not read ${key}`, error);
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Galaxy Cue] Could not write ${key}`, error);
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[Galaxy Cue] Could not remove ${key}`, error);
      return false;
    }
  }
};

// shared/js/core/bootstrap.js?v=7040
var VERSION = "7.0.2";
var RELEASE = "Event Activation \u2014 Client Form Connected";
var BUILD = "2026-07-21T03:45:00Z";
function bootstrapGalaxyCue() {
  const bus = createEventBus();
  const store = createStore({ version: VERSION, release: RELEASE, build: BUILD, startedAt: (/* @__PURE__ */ new Date()).toISOString() });
  const runtime = Object.freeze({ version: VERSION, release: RELEASE, build: BUILD, bus, store, storage });
  window.GalaxyCue = runtime;
  document.documentElement.dataset.gcVersion = VERSION;
  console.info(`%cGalaxy Cue ${VERSION}%c \u2014 ${RELEASE} | Build ${BUILD}`, "font-weight:800;color:#d8bb6a", "color:inherit");
  bus.emit("app:bootstrap", runtime);
  return runtime;
}

// shared/js/core/workflow.js?v=7040
var WORKFLOW_VERSION = 1;
var WORKFLOW_STATES = Object.freeze({
  BOOKING_REQUEST_RECEIVED: { order: 1, owner: "organization", label: "Booking Request Received", ec: "Review the new booking request and send the Event Form.", client: "Your booking request was received.", nextAction: "Send Event Form" },
  EVENT_FORM_PENDING: { order: 2, owner: "client", label: "Event Form Pending", ec: "Waiting for the client to complete the Event Form.", client: "Complete and submit your Event Form.", nextAction: "Submit Event Form" },
  QUOTE_PREPARATION: { order: 3, owner: "organization", label: "Quote Preparation", ec: "Prepare the detailed final quote from the Event Form.", client: "Your final quote is being prepared.", nextAction: "Send Final Quote" },
  QUOTE_REVIEW: { order: 4, owner: "client", label: "Quote Review", ec: "Waiting for the client to review the final quote.", client: "Review and accept or decline the final quote.", nextAction: "Review Final Quote" },
  CONTRACT_PREPARATION: { order: 5, owner: "organization", label: "Contract Preparation", ec: "Prepare and send the contract and deposit request.", client: "Your contract and deposit request are being prepared.", nextAction: "Send Contract & Deposit" },
  CONTRACT_DEPOSIT_PENDING: { order: 6, owner: "client", label: "Contract & Deposit Pending", ec: "Waiting for contract signature and deposit payment.", client: "Sign the contract and pay the deposit to lock in the date.", nextAction: "Sign Contract & Pay Deposit" },
  PLANNING_FORM_PREPARATION: { order: 7, owner: "organization", label: "Planning Form Preparation", ec: "Send the Event Detail Planning Form.", client: "Your detailed planning form is being prepared.", nextAction: "Send Planning Form" },
  PLANNING_FORM_PENDING: { order: 8, owner: "client", label: "Event Planning Pending", ec: "Waiting for the client to complete event details and music choices.", client: "Complete and submit your Event Detail Planning Form.", nextAction: "Submit Planning Form" },
  PLANNING_REVIEW: { order: 9, owner: "organization", label: "Planning Review", ec: "Review the submitted event details and planning information.", client: "Your event details are being reviewed.", nextAction: "Approve Planning" },
  EVENT_READY: { order: 10, owner: "both", label: "Event Ready", ec: "The contracted event is ready for final operations.", client: "Your event planning is complete and ready.", nextAction: "Event Ready" },
  DECLINED: { order: 99, owner: "none", label: "Quote Declined", ec: "The client declined the quote.", client: "The quote was declined.", nextAction: "Closed" }
});
var TRANSITIONS = Object.freeze({
  BOOKING_REQUEST_RECEIVED: { send_event_form: "EVENT_FORM_PENDING" },
  EVENT_FORM_PENDING: { submit_event_form: "QUOTE_PREPARATION" },
  QUOTE_PREPARATION: { send_quote: "QUOTE_REVIEW" },
  QUOTE_REVIEW: { accept_quote: "CONTRACT_PREPARATION", decline_quote: "DECLINED" },
  CONTRACT_PREPARATION: { send_contract_deposit: "CONTRACT_DEPOSIT_PENDING" },
  PLANNING_FORM_PREPARATION: { send_planning_form: "PLANNING_FORM_PENDING" },
  PLANNING_FORM_PENDING: { submit_planning_form: "PLANNING_REVIEW" },
  PLANNING_REVIEW: { approve_planning: "EVENT_READY", return_planning: "PLANNING_FORM_PENDING" }
});
function createWorkflow(actor = "organization") {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return { version: WORKFLOW_VERSION, currentState: "BOOKING_REQUEST_RECEIVED", owner: "organization", enteredAt: now, updatedAt: now, contractSigned: false, depositPaid: false, history: [{ id: crypto.randomUUID(), from: null, to: "BOOKING_REQUEST_RECEIVED", action: "booking_request_received", actor, at: now }] };
}
function ensureWorkflow(eventState) {
  if (!eventState.workflow || !WORKFLOW_STATES[eventState.workflow.currentState]) eventState.workflow = createWorkflow();
  eventState.workflow.version = WORKFLOW_VERSION;
  eventState.workflow.history = Array.isArray(eventState.workflow.history) ? eventState.workflow.history : [];
  syncOwner(eventState.workflow);
  return eventState.workflow;
}
function syncOwner(workflow) {
  workflow.owner = WORKFLOW_STATES[workflow.currentState]?.owner || "none";
}
function getWorkflowState(eventState) {
  const workflow = ensureWorkflow(eventState);
  return { ...WORKFLOW_STATES[workflow.currentState], id: workflow.currentState, workflow };
}
function allowedActions(eventState, actor) {
  const workflow = ensureWorkflow(eventState);
  if (workflow.currentState === "CONTRACT_DEPOSIT_PENDING") {
    const actions = [];
    if (actor === "client" && !workflow.contractSigned) actions.push("sign_contract");
    if (actor === "client" && !workflow.depositPaid) actions.push("pay_deposit");
    return actions;
  }
  const state2 = WORKFLOW_STATES[workflow.currentState];
  if (!state2 || !(state2.owner === actor || state2.owner === "both")) return [];
  return Object.keys(TRANSITIONS[workflow.currentState] || {});
}
function transitionWorkflow(eventState, action, actor) {
  const workflow = ensureWorkflow(eventState);
  const allowed = allowedActions(eventState, actor);
  if (!allowed.includes(action)) return { ok: false, error: `Action ${action} is not allowed for ${actor} during ${workflow.currentState}.` };
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const from = workflow.currentState;
  if (from === "CONTRACT_DEPOSIT_PENDING") {
    if (action === "sign_contract") workflow.contractSigned = true;
    if (action === "pay_deposit") workflow.depositPaid = true;
    workflow.history.push({ id: crypto.randomUUID(), from, to: from, action, actor, at: now });
    if (workflow.contractSigned && workflow.depositPaid) {
      workflow.currentState = "PLANNING_FORM_PREPARATION";
      workflow.enteredAt = now;
      workflow.history.push({ id: crypto.randomUUID(), from, to: "PLANNING_FORM_PREPARATION", action: "contract_and_deposit_complete", actor: "system", at: now });
    }
  } else {
    const to = TRANSITIONS[from]?.[action];
    if (!to) return { ok: false, error: "No valid workflow transition was found." };
    workflow.currentState = to;
    workflow.enteredAt = now;
    workflow.history.push({ id: crypto.randomUUID(), from, to, action, actor, at: now });
  }
  workflow.updatedAt = now;
  syncOwner(workflow);
  return { ok: true, workflow };
}
function workflowProgress(eventState) {
  const state2 = getWorkflowState(eventState);
  if (state2.id === "DECLINED") return 0;
  return Math.round((state2.order - 1) / (10 - 1) * 100);
}
var ACTION_LABELS = Object.freeze({
  send_event_form: "Send Event Form",
  submit_event_form: "Submit Event Form",
  send_quote: "Send Final Quote",
  accept_quote: "Accept Quote",
  decline_quote: "Decline Quote",
  send_contract_deposit: "Send Contract & Deposit",
  sign_contract: "Sign Contract",
  pay_deposit: "Record Deposit Paid",
  send_planning_form: "Send Planning Form",
  submit_planning_form: "Submit Planning Form",
  approve_planning: "Approve Planning",
  return_planning: "Return for Changes"
});

// shared/js/modules.js?v=7040
var modules = [
  { id: "wedding", label: "Wedding Consultation", description: "Venue, schedule and production details.", icon: "\u2665", status: "ready" },
  { id: "corporate", label: "Corporate Consultation", description: "Business-event requirements.", icon: "\u25A3", status: "ready" },
  { id: "private", label: "Private Party Consultation", description: "Celebrations and custom events.", icon: "\u2726", status: "ready" },
  { id: "quote", label: "Final Quote", description: "Pricing, deposit and balance schedule.", icon: "$", status: "ready" },
  { id: "contract", label: "Contract & Deposit", description: "Agreement, acceptance and payment tracking.", icon: "\u2713", status: "ready" },
  { id: "wedding-planner", label: "Wedding Music Planner", description: "Timeline, music and announcements.", icon: "\u266B", status: "ready" },
  { id: "corporate-planner", label: "Corporate Music Planner", description: "Program and presentation support.", icon: "\u266B", status: "ready" },
  { id: "private-planner", label: "Private Music Planner", description: "Music direction and moments.", icon: "\u266B", status: "ready" },
  { id: "timeline", label: "Event Timeline", description: "Build the complete event schedule.", icon: "\u2195", status: "ready" },
  { id: "uploads", label: "Upload Center", description: "Keep event files with the booking.", icon: "\u2191", status: "ready" },
  { id: "messages", label: "Messages", description: "Client and DJ conversation notes.", icon: "\u2709", status: "ready" },
  { id: "portal", label: "Client Portal", description: "Booking progress and documents.", icon: "\u25C9", status: "ready" },
  { id: "admin", label: "Admin", description: "Local booking dashboard.", icon: "\u2699", status: "ready" }
];
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
function quoteForm(source = {}) {
  return `<form data-form="quote"><div class="card"><h2>Quote Details</h2><p class="card-intro">Create a clear, itemized proposal for this event.</p><div class="grid three"><div class="field"><label>Client</label><input name="clientName" value="${source.primaryClient || ""}" placeholder="Client name"></div><div class="field"><label>Event Date</label><input type="date" name="eventDate" value="${source.eventDate || ""}"></div><div class="field"><label>Quote Status</label><select name="quoteStatus"><option>Draft</option><option>Sent</option><option>Accepted</option><option>Declined</option></select></div><div class="field"><label>Venue</label><input name="venueName" value="${source.venueName || ""}"></div><div class="field"><label>Quote Validity</label><select name="validityDays"><option value="7">7 days</option><option value="14" selected>14 days</option><option value="30">30 days</option></select></div><div class="field"><label>Currency</label><select name="currency"><option value="USD">USD</option></select></div></div></div><div class="card"><h2>Pricing</h2><p class="card-intro">Enter each charge separately. Totals update automatically.</p><div class="quote-items"><div class="quote-row"><input name="item1Label" value="DJ Package" placeholder="Description"><input type="number" step="0.01" min="0" name="item1Amount" value="0" data-money></div><div class="quote-row"><input name="item2Label" value="Sound & Production" placeholder="Description"><input type="number" step="0.01" min="0" name="item2Amount" value="0" data-money></div><div class="quote-row"><input name="item3Label" value="Lighting & Effects" placeholder="Description"><input type="number" step="0.01" min="0" name="item3Amount" value="0" data-money></div><div class="quote-row"><input name="item4Label" value="Travel / Setup" placeholder="Description"><input type="number" step="0.01" min="0" name="item4Amount" value="0" data-money></div><div class="quote-row"><input name="item5Label" value="Additional Services" placeholder="Description"><input type="number" step="0.01" min="0" name="item5Amount" value="0" data-money></div></div><div class="grid three quote-settings"><div class="field"><label>Discount</label><input type="number" step="0.01" min="0" name="discount" value="0" data-money></div><div class="field"><label>Sales Tax %</label><input type="number" step="0.01" min="0" name="taxRate" value="0" data-money></div><div class="field"><label>Deposit %</label><input type="number" step="1" min="0" max="100" name="depositRate" value="30" data-money></div></div><div class="totals"><div><span>Subtotal</span><strong id="subtotalValue">$0.00</strong></div><div><span>Discount</span><strong id="discountValue">\u2212$0.00</strong></div><div><span>Tax</span><strong id="taxValue">$0.00</strong></div><div class="grand"><span>Total</span><strong id="totalValue">$0.00</strong></div><div><span>Deposit Due</span><strong id="depositValue">$0.00</strong></div><div><span>Remaining Balance</span><strong id="balanceValue">$0.00</strong></div></div></div><div class="card"><h2>Payment Terms</h2><div class="grid"><div class="field"><label>Balance Due</label><select name="balanceDue"><option>7 days before event</option><option>14 days before event</option><option>30 days before event</option><option>On event date</option></select></div><div class="field"><label>Accepted Payment Methods</label><input name="paymentMethods" value="PayPal, bank transfer, cash, card"></div><div class="field full"><label>Quote Notes</label><textarea name="quoteNotes" placeholder="Package inclusions, overtime rate, venue requirements or other terms..."></textarea></div></div><div class="section-actions"><button class="btn" type="button" data-action="print-quote">Print Quote</button><button class="btn" type="button" data-action="save">Save Draft</button><button class="btn primary" type="submit">Finalize Quote</button></div></div></form>`;
}
function contractForm(quote = {}, source = {}) {
  return `<form data-form="contract"><div class="card"><h2>Service Agreement</h2><p class="card-intro">Review and record the client\u2019s acceptance of the booking terms.</p><div class="agreement"><h3>Event Services</h3><p>House Music Galaxy will provide professional DJ and event-production services for <strong>${source.primaryClient || quote.clientName || "the client"}</strong> on <strong>${source.eventDate || quote.eventDate || "the agreed event date"}</strong> at <strong>${source.venueName || quote.venueName || "the agreed venue"}</strong>.</p><h3>Reservation & Payment</h3><p>The event date is not reserved until this agreement is accepted and the required deposit is received. The current quoted total is <strong data-contract-total>$0.00</strong>, with a deposit of <strong data-contract-deposit>$0.00</strong>. The remaining balance is due ${quote.balanceDue || "7 days before event"}.</p><h3>Changes & Cancellation</h3><p>Material changes to timing, location, equipment or scope may change the final price. Deposits are applied to the booking and are non-refundable once the date is reserved, except where otherwise agreed in writing.</p><h3>Venue & Safety</h3><p>The client is responsible for venue access, safe electrical power, weather protection for outdoor events, and any permits or permissions required by the venue.</p><h3>Independent Artists</h3><p>House Music Galaxy is a professional DJ collective. The selected DJ may perform as an independent service provider while following the agreed event plan.</p></div></div><div class="card"><h2>Acceptance</h2><div class="grid"><div class="field"><label>Contract Status</label><select name="contractStatus"><option>Draft</option><option>Sent</option><option>Accepted</option><option>Cancelled</option></select></div><div class="field"><label>Accepted By <span class="req">*</span></label><input name="acceptedBy" required placeholder="Type full legal name"></div><div class="field"><label>Acceptance Date <span class="req">*</span></label><input type="date" name="acceptedDate" required></div><div class="field"><label>Deposit Status</label><select name="depositStatus"><option>Not requested</option><option>Requested</option><option>Partially paid</option><option>Paid</option><option>Refunded</option></select></div><div class="field"><label>Deposit Amount Received</label><input type="number" step="0.01" min="0" name="depositPaid" value="0"></div><div class="field"><label>Payment Method</label><select name="paymentMethod"><option>Not recorded</option><option>PayPal</option><option>Bank transfer</option><option>Cash</option><option>Card</option><option>Other</option></select></div><div class="field full"><label>Internal Payment Notes</label><textarea name="paymentNotes"></textarea></div></div><label class="check" style="margin-top:16px"><input type="checkbox" name="acceptTerms" required><span>I have reviewed and accept the service agreement and payment terms shown above.</span></label><div class="section-actions"><button class="btn" type="button" data-action="print-contract">Print Contract</button><button class="btn" type="button" data-action="save">Save Draft</button><button class="btn primary" type="submit">Record Acceptance</button></div></div></form>`;
}
var plannerActions = `<div class="section-actions"><button class="btn" type="button" data-action="save">Save Progress</button><button class="btn" type="button" data-action="print-planner">Print Planner</button><button class="btn primary" type="submit">Complete Planner</button></div>`;
var songField = (label, name, placeholder = "Song title \u2014 artist") => `<div class="field"><label>${label}</label><input name="${name}" placeholder="${placeholder}"></div>`;
function weddingPlannerForm(source = {}) {
  return `<form data-form="wedding-planner"><div class="card"><h2>Wedding Overview</h2><p class="card-intro">Build the music and announcement plan for every part of the celebration.</p><div class="grid three"><div class="field"><label>Couple / Client <span class="req">*</span></label><input name="clientName" required value="${source.primaryClient || ""}"></div><div class="field"><label>Wedding Date <span class="req">*</span></label><input type="date" name="eventDate" required value="${source.eventDate || ""}"></div><div class="field"><label>Venue</label><input name="venueName" value="${source.venueName || ""}"></div><div class="field"><label>Setup Start <span class="req">*</span></label><input type="time" step="900" name="setupStartTime" required value="${source.setupStartTime || ""}"></div><div class="field"><label>Event Start <span class="req">*</span></label><input type="time" step="900" name="startTime" required value="${source.startTime || source.ceremonyTime || ""}"></div><div class="field"><label>Event End <span class="req">*</span></label><input type="time" step="900" name="endTime" required value="${source.endTime || ""}"></div><div class="field"><label>Breakdown End <span class="req">*</span></label><input type="time" step="900" name="breakdownEndTime" required value="${source.breakdownEndTime || ""}"></div><div class="field"><label>Ceremony Start</label><input type="time" step="900" name="ceremonyStart" value="${source.ceremonyTime || ""}"></div></div></div><div class="card"><h2>Ceremony Music</h2><div class="grid">${songField("Prelude / Guest Arrival", "prelude")}${songField("Wedding Party Processional", "partyProcessional")}${songField("Main Processional", "mainProcessional")}${songField("Unity / Special Moment", "unitySong")}${songField("Recessional", "recessional")}${songField("Post-Ceremony Music", "postCeremony")}</div><div class="field full" style="margin-top:16px"><label>Ceremony Cues & Notes</label><textarea name="ceremonyNotes" placeholder="Order of entrances, microphone cues, officiant instructions, exact song versions..."></textarea></div></div><div class="card"><h2>Reception Timeline & Key Songs</h2><div class="grid">${songField("Wedding Party Introduction", "partyIntro")}${songField("Couple Introduction", "coupleIntro")}${songField("First Dance", "firstDance")}${songField("Parent Dance 1", "parentDance1")}${songField("Parent Dance 2", "parentDance2")}${songField("Cake Cutting", "cakeSong")}${songField("Bouquet / Special Tradition", "bouquetSong")}${songField("Last Dance", "lastDance")}</div><div class="field full" style="margin-top:16px"><label>Reception Timeline</label><textarea name="receptionTimeline" placeholder="Example: 6:00 introductions, 6:10 first dance, 6:20 dinner, 7:30 open dancing..."></textarea></div></div><div class="card"><h2>Dance Floor Direction</h2><div class="grid"><div class="field full"><label>Must-Play Songs</label><textarea name="mustPlay" placeholder="One song per line: title \u2014 artist"></textarea></div><div class="field full"><label>Do-Not-Play Songs</label><textarea name="doNotPlay" placeholder="Songs, artists or genres to avoid"></textarea></div><div class="field"><label>Preferred Genres / Eras</label><textarea name="preferredGenres"></textarea></div><div class="field"><label>Guest Requests</label><select name="guestRequests"><option>Use DJ discretion</option><option>Yes, encourage requests</option><option>Limited requests only</option><option>No guest requests</option></select></div><div class="field full"><label>Announcements, Names & Pronunciations</label><textarea name="announcements" placeholder="Names, phonetic pronunciations, special announcements and people authorized to request changes..."></textarea></div></div>${plannerActions}</div></form>`;
}
function corporatePlannerForm(source = {}) {
  return `<form data-form="corporate-planner"><div class="card"><h2>Corporate Program Overview</h2><p class="card-intro">Coordinate music, microphones and cues around the official event program.</p><div class="grid three"><div class="field"><label>Company / Client <span class="req">*</span></label><input name="clientName" required value="${source.company || source.primaryClient || ""}"></div><div class="field"><label>Event Date <span class="req">*</span></label><input type="date" name="eventDate" required value="${source.eventDate || ""}"></div><div class="field"><label>Venue</label><input name="venueName" value="${source.venueName || ""}"></div><div class="field"><label>Setup Start <span class="req">*</span></label><input type="time" step="900" name="setupStartTime" required value="${source.setupStartTime || ""}"></div><div class="field"><label>Event Start <span class="req">*</span></label><input type="time" step="900" name="startTime" required value="${source.startTime || ""}"></div><div class="field"><label>Event End <span class="req">*</span></label><input type="time" step="900" name="endTime" required value="${source.endTime || ""}"></div><div class="field"><label>Breakdown End <span class="req">*</span></label><input type="time" step="900" name="breakdownEndTime" required value="${source.breakdownEndTime || ""}"></div><div class="field"><label>Doors Open</label><input type="time" step="900" name="doorsOpen" value="${source.startTime || ""}"></div><div class="field"><label>Program Start</label><input type="time" step="900" name="programStart"></div></div></div><div class="card"><h2>Program Cues</h2><div class="grid"><div class="field"><label>Guest Arrival Music</label><input name="arrivalMusic" placeholder="Style, playlist or artist direction"></div><div class="field"><label>Opening / Welcome Track</label><input name="openingTrack"></div><div class="field"><label>Speaker Walk-On Music</label><textarea name="walkOnMusic" placeholder="Speaker name \u2014 track \u2014 cue"></textarea></div><div class="field"><label>Break / Intermission Music</label><textarea name="breakMusic"></textarea></div><div class="field"><label>Awards / Recognition Cues</label><textarea name="awardCues" placeholder="Award category, winner walk-up music, stingers..."></textarea></div><div class="field"><label>Closing / Exit Music</label><textarea name="closingMusic"></textarea></div><div class="field full"><label>Detailed Run of Show</label><textarea name="runOfShow" placeholder="Time \u2014 program item \u2014 speaker \u2014 microphone \u2014 music cue"></textarea></div></div></div><div class="card"><h2>Brand & Production Notes</h2><div class="grid"><div class="field"><label>Brand Tone</label><select name="brandTone"><option>Professional and polished</option><option>Modern and energetic</option><option>Luxury and refined</option><option>Casual and social</option><option>Custom</option></select></div><div class="field"><label>Dance / Social Portion</label><select name="dancePortion"><option>No dance portion</option><option>Optional background-to-dance transition</option><option>Planned dance party</option></select></div><div class="field full"><label>Approved / Required Music</label><textarea name="approvedMusic"></textarea></div><div class="field full"><label>Restricted Content / Do-Not-Play</label><textarea name="restrictedMusic"></textarea></div><div class="field full"><label>Presentation, Microphone & AV Notes</label><textarea name="avNotes" placeholder="Number of speakers, handheld/lavalier microphones, video playback, house AV contact..."></textarea></div></div>${plannerActions}</div></form>`;
}
function privatePlannerForm(source = {}) {
  return `<form data-form="private-planner"><div class="card"><h2>Party Overview</h2><p class="card-intro">Shape the soundtrack, pacing and special moments for the celebration.</p><div class="grid three"><div class="field"><label>Client / Honoree <span class="req">*</span></label><input name="clientName" required value="${source.primaryClient || ""}"></div><div class="field"><label>Event Date <span class="req">*</span></label><input type="date" name="eventDate" required value="${source.eventDate || ""}"></div><div class="field"><label>Venue</label><input name="venueName" value="${source.venueName || ""}"></div><div class="field"><label>Setup Start <span class="req">*</span></label><input type="time" step="900" name="setupStartTime" required value="${source.setupStartTime || ""}"></div><div class="field"><label>Event Start <span class="req">*</span></label><input type="time" step="900" name="startTime" required value="${source.startTime || ""}"></div><div class="field"><label>Event End <span class="req">*</span></label><input type="time" step="900" name="endTime" required value="${source.endTime || ""}"></div><div class="field"><label>Breakdown End <span class="req">*</span></label><input type="time" step="900" name="breakdownEndTime" required value="${source.breakdownEndTime || ""}"></div><div class="field"><label>Celebration Type</label><input name="eventType" value="${source.eventType || ""}"></div></div></div><div class="card"><h2>Music Profile</h2><div class="grid"><div class="field"><label>Preferred Genres</label><textarea name="genres" placeholder="House, disco, 80s, 90s, hip-hop, Latin, pop..."></textarea></div><div class="field"><label>Favorite Artists</label><textarea name="artists"></textarea></div><div class="field full"><label>Must-Play Songs</label><textarea name="mustPlay" placeholder="One song per line: title \u2014 artist"></textarea></div><div class="field full"><label>Do-Not-Play Songs / Genres</label><textarea name="doNotPlay"></textarea></div><div class="field"><label>Energy Direction</label><select name="energy"><option>Relaxed throughout</option><option>Start relaxed, build gradually</option><option>High energy from the start</option><option>Mixed by age group / moment</option></select></div><div class="field"><label>Guest Requests</label><select name="guestRequests"><option>Use DJ discretion</option><option>Encourage requests</option><option>Only from host-approved guests</option><option>No requests</option></select></div></div></div><div class="card"><h2>Special Moments & Announcements</h2><div class="grid"><div class="field"><label>Entrance / Opening Song</label><input name="openingSong"></div><div class="field"><label>Featured Dance / Moment</label><input name="featuredSong"></div><div class="field"><label>Cake / Toast / Presentation Music</label><input name="cakeSong"></div><div class="field"><label>Final Song</label><input name="finalSong"></div><div class="field full"><label>Timeline</label><textarea name="timeline" placeholder="Time \u2014 moment \u2014 song / announcement"></textarea></div><div class="field full"><label>Announcements, Names & Pronunciations</label><textarea name="announcements"></textarea></div></div>${plannerActions}</div></form>`;
}
function timelineForm() {
  return `<form data-form="timeline"><div class="card"><h2>Event Timeline Builder</h2><p class="card-intro">Add each important moment in chronological order. Use the arrow buttons to rearrange entries.</p><div id="timelineRows" class="timeline-rows"></div><div class="section-actions"><button class="btn" type="button" data-action="add-timeline">Add Timeline Item</button><button class="btn primary" type="submit">Complete Timeline</button></div></div></form>`;
}
function uploadsView() {
  return `<div class="card"><h2>Upload Center</h2><p class="card-intro">Attach timelines, venue layouts, playlists, ceremony documents and inspiration files. Signed-in users upload files securely to Supabase Storage. Guests remain in local browser mode.</p><label class="upload-drop"><input id="uploadInput" type="file" multiple><span class="upload-icon">\u2191</span><strong>Select files</strong><small>PDF, images, documents and spreadsheets</small></label><div id="uploadList" class="file-list"></div></div>`;
}
function messagesView() {
  return `<div class="card"><h2>Booking Messages</h2><p class="card-intro">Keep client questions, DJ replies and internal follow-up notes together.</p><div id="messageThread" class="message-thread"></div><div class="message-compose"><select id="messageRole"><option value="Client">Client</option><option value="House Music Galaxy">House Music Galaxy</option><option value="Internal Note">Internal Note</option></select><textarea id="messageText" placeholder="Write a message or note..."></textarea><button class="btn primary" type="button" data-action="send-message">Add Message</button></div></div>`;
}

// apps/business/app.js
var galaxyCueRuntime = bootstrapGalaxyCue();
var supabase2 = null;
var getCurrentUser2 = async () => null;
var restoreAuthSession2 = async () => ({ user: null, error: null, handled: false });
var sendMagicLink2 = async () => ({ error: new Error("Cloud connection is not ready.") });
var signOut2 = async () => ({ error: null });
var upsertBooking2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var loadBooking2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var listBookings2 = async () => ({ data: [], error: null });
var uploadBookingFile2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var listBookingFiles2 = async () => ({ data: [], error: null });
var removeBookingFile2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var createSignedFileUrl2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var ensureBusinessWorkspace2 = async () => ({ data: null, error: null });
var getCloudHealth2 = async () => ({ ok: false, message: "Cloud connection is not ready." });
var listCloudClients2 = async () => ({ data: [], error: new Error("Cloud connection is not ready.") });
var saveCloudClient2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var removeCloudClient2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var saveCloudEvent2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var listCloudEvents2 = async () => ({ data: [], error: new Error("Cloud connection is not ready.") });
var loadCloudEvent2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var removeCloudEvent2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var loadCloudBusinessSettings2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var saveCloudBusinessSettings2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var submitBookingRequest2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var listBookingRequests2 = async () => ({ data: [], error: new Error("Cloud connection is not ready.") });
var updateBookingRequest2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var acceptBookingRequest2 = async () => ({ data: null, error: new Error("Cloud connection is not ready.") });
var activeBusiness = null;
var cloudModuleLoaded = false;
async function loadCloudModule() {
  try {
    const api = await Promise.resolve().then(() => (init_supabase(), supabase_exports));
    supabase2 = api.supabase;
    getCurrentUser2 = api.getCurrentUser;
    restoreAuthSession2 = api.restoreAuthSession;
    sendMagicLink2 = api.sendMagicLink;
    signOut2 = api.signOut;
    upsertBooking2 = api.upsertBooking;
    loadBooking2 = api.loadBooking;
    listBookings2 = api.listBookings;
    uploadBookingFile2 = api.uploadBookingFile;
    listBookingFiles2 = api.listBookingFiles;
    removeBookingFile2 = api.removeBookingFile;
    createSignedFileUrl2 = api.createSignedFileUrl;
    ensureBusinessWorkspace2 = api.ensureBusinessWorkspace;
    getCloudHealth2 = api.getCloudHealth;
    listCloudClients2 = api.listCloudClients;
    saveCloudClient2 = api.saveCloudClient;
    removeCloudClient2 = api.removeCloudClient;
    saveCloudEvent2 = api.saveCloudEvent;
    listCloudEvents2 = api.listCloudEvents;
    loadCloudEvent2 = api.loadCloudEvent;
    removeCloudEvent2 = api.removeCloudEvent;
    loadCloudBusinessSettings2 = api.loadCloudBusinessSettings;
    saveCloudBusinessSettings2 = api.saveCloudBusinessSettings;
    submitBookingRequest2 = api.submitBookingRequest;
    listBookingRequests2 = api.listBookingRequests;
    updateBookingRequest2 = api.updateBookingRequest;
    acceptBookingRequest2 = api.acceptBookingRequest;
    cloudModuleLoaded = true;
    return true;
  } catch (error) {
    console.error("Cloud module failed to load:", error);
    cloudModuleLoaded = false;
    return false;
  }
}
var KEY = "hmg_booking_suite_v09";
var OLD_KEYS = ["hmg_booking_suite_v08", "hmg_booking_suite_v07", "hmg_booking_suite_v06", "hmg_booking_suite_v05", "hmg_booking_suite_v04"];
var currentUser = null;
var appView = "dashboard";
var LOCAL_EVENTS_KEY = "galaxy_cue_events_local_v424";
function loadLocalEvents() {
  try {
    const rows = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error("Could not read local events:", error);
    return [];
  }
}
function saveLocalEvents(rows) {
  localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
}
function localEventFromState(eventState, linkedClient = null) {
  const forms = eventState?.forms || {};
  const consultation = forms.wedding || forms.corporate || forms.private || {};
  const quote = forms.quote || {};
  const eventType = forms.wedding ? "Wedding" : forms.corporate ? "Corporate" : forms.private ? "Private Party" : "Event";
  const clientName = consultation.primaryClient || consultation.company || quote.clientName || linkedClient?.name || linkedClient?.company || "";
  const clientEmail = consultation.email || quote.clientEmail || linkedClient?.email || "";
  return {
    id: eventState.bookingId,
    business_id: null,
    client_id: linkedClient?.id || null,
    booking_ref: eventState.bookingId,
    title: clientName ? `${clientName} \u2014 ${eventType}` : eventType,
    event_type: eventType,
    event_date: consultation.eventDate || quote.eventDate || null,
    start_time: consultation.startTime || consultation.ceremonyTime || quote.startTime || null,
    end_time: consultation.endTime || quote.endTime || null,
    setup_start_time: consultation.setupStartTime || null,
    breakdown_end_time: consultation.breakdownEndTime || null,
    venue_name: consultation.venueName || quote.venueName || null,
    venue_address: consultation.venueAddress || quote.venueAddress || null,
    status: String(quote.quoteStatus || "draft").toLowerCase(),
    client_name: clientName,
    client_email: clientEmail,
    booking_data: JSON.parse(JSON.stringify(eventState)),
    event_data: JSON.parse(JSON.stringify(eventState)),
    updated_at: eventState.updated || (/* @__PURE__ */ new Date()).toISOString(),
    local_only: true
  };
}
function upsertLocalEvent(eventState, linkedClient = null) {
  if (!eventState?.bookingId) return null;
  const rows = loadLocalEvents();
  const existing = rows.find((row2) => row2.booking_ref === eventState.bookingId);
  const resolvedClient = linkedClient || (existing?.client_id ? crmClients.find((client) => client.id === existing.client_id) : null) || findMatchingClient({
    email: (eventState.forms?.wedding || eventState.forms?.corporate || eventState.forms?.private || eventState.forms?.quote || {}).email || eventState.forms?.quote?.clientEmail || "",
    name: (eventState.forms?.wedding || eventState.forms?.corporate || eventState.forms?.private || {}).primaryClient || (eventState.forms?.corporate || {}).company || eventState.forms?.quote?.clientName || ""
  });
  const row = localEventFromState(eventState, resolvedClient);
  const next = existing ? rows.map((item) => item.booking_ref === eventState.bookingId ? { ...item, ...row } : item) : [row, ...rows];
  saveLocalEvents(next);
  cloudBookings = next;
  eventCloudStatus = "Local";
  return row;
}
var cloudBookings = loadLocalEvents();
var bookingFilter = "all";
var bookingSearch = "";
var bookingSort = "date-asc";
var selectedBookingRef = null;
var calendarCursor = /* @__PURE__ */ new Date();
var calendarViewMode = "month";
var calendarSelectedDate = /* @__PURE__ */ new Date();
var CLIENTS_KEY = "galaxy_cue_clients_v17";
var clientSearch = "";
var selectedClientId = null;
var clientCloudStatus = "Local";
var eventCloudStatus = "Local";
var CLOUD_MIGRATION_KEY = "galaxy_cue_v41_clients_events_migrated";
function loadClients() {
  try {
    return JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function saveClients(rows) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(rows));
}
var crmClients = loadClients();
function activeBusinessId() {
  return activeBusiness?.business_id || activeBusiness?.businesses?.id || null;
}
function normalizeCloudClient(row) {
  return {
    id: row.id,
    name: row.name || "",
    company: row.company || "",
    email: row.email || "",
    phone: row.phone || "",
    address: row.address || "",
    notes: row.notes || "",
    createdAt: row.created_at || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: row.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
    cloud: true
  };
}
async function refreshClientsFromCloud() {
  if (!currentUser || !activeBusinessId()) return;
  clientCloudStatus = "Syncing\u2026";
  const { data, error } = await listCloudClients2(activeBusinessId());
  if (error) {
    clientCloudStatus = "Sync failed";
    console.error(error);
    return;
  }
  crmClients = (data || []).map(normalizeCloudClient);
  saveClients(crmClients);
  clientCloudStatus = "Synced";
}
async function refreshEventsFromCloud() {
  if (!currentUser || !activeBusinessId()) {
    cloudBookings = loadLocalEvents();
    eventCloudStatus = "Local";
    return;
  }
  eventCloudStatus = "Syncing\u2026";
  const { data, error } = await listCloudEvents2(activeBusinessId());
  if (error) {
    eventCloudStatus = "Sync failed";
    console.error(error);
    return;
  }
  cloudBookings = data || [];
  eventCloudStatus = "Synced";
}
async function refreshCoreCloudData() {
  if (!currentUser || !activeBusinessId()) return;
  await Promise.all([refreshClientsFromCloud(), refreshEventsFromCloud()]);
}
function findClientForState() {
  const d = activeConsultation(), q = state.forms?.quote || {};
  const email = String(d.email || q.clientEmail || "").trim().toLowerCase();
  const name = String(d.primaryClient || d.company || q.clientName || "").trim().toLowerCase();
  return crmClients.find((c) => email && String(c.email || "").toLowerCase() === email || name && String(c.name || c.company || "").toLowerCase() === name) || null;
}
async function migrateLocalClientsAndEvent() {
  if (!currentUser || !activeBusinessId()) return toast("Sign in before importing local data");
  if (localStorage.getItem(CLOUD_MIGRATION_KEY) === "1" && !confirm("Local data was already imported once. Run the import again?")) return;
  const localClients = loadClients();
  let importedClients = 0;
  for (const client of localClients) {
    const { data, error } = await saveCloudClient2(client, activeBusinessId());
    if (!error && data) importedClients++;
  }
  await refreshClientsFromCloud();
  const hasEvent = state?.bookingId && state?.forms && Object.keys(state.forms).length > 0;
  let importedEvents = 0;
  if (hasEvent) {
    const linked = findClientForState();
    const result = await saveCloudEvent2(state, activeBusinessId(), linked?.id || null);
    if (!result.error) importedEvents = 1;
  }
  await refreshEventsFromCloud();
  localStorage.setItem(CLOUD_MIGRATION_KEY, "1");
  shell();
  toast(`Imported ${importedClients} client${importedClients === 1 ? "" : "s"} and ${importedEvents} event${importedEvents === 1 ? "" : "s"} to cloud`);
}
var QUOTES_KEY = "galaxy_cue_quotes_v18";
var CONTRACTS_KEY = "galaxy_cue_contracts_v18";
var quoteSearch = "";
var selectedQuoteId = null;
var contractSearch = "";
var selectedContractId = null;
function loadLocalRows(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (e) {
    return [];
  }
}
function saveLocalRows(key, rows) {
  localStorage.setItem(key, JSON.stringify(rows));
}
var crmQuotes = loadLocalRows(QUOTES_KEY);
var crmContracts = loadLocalRows(CONTRACTS_KEY);
var INVOICES_KEY = "galaxy_cue_invoices_v19";
var PAYMENTS_KEY = "galaxy_cue_payments_v19";
var invoiceSearch = "";
var selectedInvoiceId = null;
var paymentSearch = "";
var selectedPaymentId = null;
var crmInvoices = loadLocalRows(INVOICES_KEY);
var crmPayments = loadLocalRows(PAYMENTS_KEY);
async function hydrateCloudPreferences() {
  if (!currentUser || !activeBusinessId()) return;
  const { data, error } = await loadCloudBusinessSettings2(activeBusinessId());
  if (error) {
    console.warn("Could not load cloud preferences:", error);
    return;
  }
  if (data?.settings) {
    const { appearance, ...settings } = data.settings;
    businessSettings = { ...businessSettings, ...settings };
    saveBusinessSettings(businessSettings);
  }
}
var BUSINESS_SETTINGS_KEY = "galaxy_cue_business_settings_v20";
var CLIENT_PORTAL_KEY = "galaxy_cue_client_portals_v20";
function loadBusinessSettings() {
  try {
    return JSON.parse(localStorage.getItem(BUSINESS_SETTINGS_KEY) || "null") || {
      businessName: "House Music Galaxy",
      contactEmail: "",
      contactPhone: "",
      website: "",
      venmoHandle: "",
      cardPaymentUrl: "",
      paymentInstructions: ""
    };
  } catch (e) {
    return { businessName: "House Music Galaxy", contactEmail: "", contactPhone: "", website: "", venmoHandle: "", cardPaymentUrl: "", paymentInstructions: "" };
  }
}
function saveBusinessSettings(settings) {
  localStorage.setItem(BUSINESS_SETTINGS_KEY, JSON.stringify(settings));
}
var businessSettings = loadBusinessSettings();
function loadClientPortals() {
  try {
    return JSON.parse(localStorage.getItem(CLIENT_PORTAL_KEY) || "{}");
  } catch (e) {
    return {};
  }
}
function saveClientPortals(rows) {
  localStorage.setItem(CLIENT_PORTAL_KEY, JSON.stringify(rows));
}
var clientPortals = loadClientPortals();
var portalPreviewMode = false;
function loadInitialState() {
  const fallback = { active: "wedding", bookingId: makeId(), forms: {}, completed: [], updated: (/* @__PURE__ */ new Date()).toISOString() };
  const raw = localStorage.getItem(KEY) || OLD_KEYS.map((k) => localStorage.getItem(k)).find(Boolean) || null;
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch (error) {
    console.warn("Stored Galaxy Cue state was invalid and has been reset.", error);
    try {
      localStorage.removeItem(KEY);
    } catch (_error) {
    }
    return fallback;
  }
}
var state = loadInitialState();
ensureWorkflow(state);
function makeId() {
  return `HMG-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
var autoCloudSyncTimer = null;
var autoCloudSyncRunning = false;
var autoCloudSyncPending = false;
var lastAutoCloudSignature = "";
function queueAutoCloudSync({ immediate = false, notify = false } = {}) {
  if (!currentUser || !activeBusinessId()) return;
  clearTimeout(autoCloudSyncTimer);
  autoCloudSyncTimer = setTimeout(() => runAutoCloudSync({ notify }), immediate ? 0 : 900);
}
async function runAutoCloudSync({ notify = false } = {}) {
  if (!currentUser || !activeBusinessId()) return;
  const signature = JSON.stringify(state);
  if (signature === lastAutoCloudSignature) return;
  if (autoCloudSyncRunning) {
    autoCloudSyncPending = true;
    return;
  }
  autoCloudSyncRunning = true;
  eventCloudStatus = "Saving\u2026";
  const linked = findClientForState();
  const snapshot = JSON.parse(signature);
  const { data, error } = await saveCloudEvent2(snapshot, activeBusinessId(), linked?.id || null);
  if (error) {
    eventCloudStatus = "Sync failed";
    console.error("Automatic cloud sync failed:", error);
    if (notify) toast(`Cloud sync failed: ${error.message}`);
  } else {
    lastAutoCloudSignature = signature;
    eventCloudStatus = "Synced";
    if (data) {
      const normalized = { ...data, booking_data: data.event_data || snapshot, client_name: linked?.name || linked?.company || "", client_email: linked?.email || "" };
      const found = cloudBookings.some((row) => row.booking_ref === normalized.booking_ref);
      cloudBookings = found ? cloudBookings.map((row) => row.booking_ref === normalized.booking_ref ? { ...row, ...normalized } : row) : [normalized, ...cloudBookings];
    }
    if (notify) toast("Saved and synced to Galaxy Cue Cloud");
  }
  autoCloudSyncRunning = false;
  if (autoCloudSyncPending) {
    autoCloudSyncPending = false;
    queueAutoCloudSync({ immediate: true, notify: false });
  }
}
function save(show = true) {
  state.updated = (/* @__PURE__ */ new Date()).toISOString();
  localStorage.setItem(KEY, JSON.stringify(state));
  if (currentUser && activeBusinessId()) {
    queueAutoCloudSync({ immediate: show, notify: show });
  } else {
    upsertLocalEvent(state);
    if (show) toast("Event progress saved locally");
  }
}
function normalizeCheckboxState(form, values) {
  if (!form || !values) return values || {};
  const normalized = { ...values };
  form.querySelectorAll('input[type="checkbox"][name]').forEach((checkbox) => {
    const name = checkbox.name;
    const group = form.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(name)}"]`);
    const saved = normalized[name];
    if (group.length > 1 && !Array.isArray(saved)) {
      if (saved === void 0 || saved === null || saved === false || saved === "") {
        normalized[name] = [];
      } else {
        normalized[name] = [String(saved)];
      }
    }
  });
  return normalized;
}
function applySavedFormValues(form, values = {}) {
  const normalized = normalizeCheckboxState(form, values);
  form.querySelectorAll("[name]").forEach((field) => {
    const saved = normalized[field.name];
    if (field.type === "checkbox") {
      field.checked = Array.isArray(saved) ? saved.map(String).includes(String(field.value)) : saved === true || String(saved) === String(field.value);
      return;
    }
    if (field.type === "radio") {
      field.checked = String(saved) === String(field.value);
      return;
    }
    if (saved !== void 0 && saved !== null) {
      field.value = saved;
    }
  });
}
function dataFrom(form) {
  const output = {};
  const formData = new FormData(form);
  for (const [key, value] of formData.entries()) {
    const field = form.elements.namedItem(key);
    const isCheckboxGroup = typeof RadioNodeList !== "undefined" && field instanceof RadioNodeList || field && typeof field.length === "number" && field.length > 1 && Array.from(field).every((item) => item.type === "checkbox");
    if (isCheckboxGroup) {
      if (!Array.isArray(output[key])) output[key] = [];
      output[key].push(value);
    } else {
      output[key] = value;
    }
  }
  form.querySelectorAll('input[type="checkbox"][name]').forEach((checkbox) => {
    const name = checkbox.name;
    const group = form.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(name)}"]`);
    if (group.length === 1) {
      output[name] = checkbox.checked;
    } else if (!(name in output)) {
      output[name] = [];
    }
  });
  return output;
}
function fill(form, data = {}) {
  Object.entries(data).forEach(([k, v]) => {
    const els = form.querySelectorAll(`[name="${CSS.escape(k)}"]`);
    els.forEach((el) => {
      if (el.type === "checkbox") el.checked = Array.isArray(v) ? v.includes(el.value) : !!v;
      else el.value = v ?? "";
    });
  });
}
function pct(form) {
  if (!form) return 0;
  const req = [...form.querySelectorAll("[required]")], ok = req.filter((x) => x.type === "checkbox" ? x.checked : x.value.trim()).length;
  return req.length ? Math.round(ok / req.length * 100) : 0;
}
function activeConsultation() {
  for (const id of ["wedding", "corporate", "private"]) if (state.forms[id] && Object.keys(state.forms[id]).length) return state.forms[id];
  return {};
}
function money(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n) || 0);
}
function quoteTotals(q = state.forms.quote || {}) {
  const subtotal = [1, 2, 3, 4, 5].reduce((s, i) => s + (Number(q[`item${i}Amount`]) || 0), 0);
  const discount = Math.min(Number(q.discount) || 0, subtotal);
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * ((Number(q.taxRate) || 0) / 100);
  const total = taxable + tax;
  const deposit = total * ((Number(q.depositRate) || 0) / 100);
  return { subtotal, discount, tax, total, deposit, balance: Math.max(0, total - deposit) };
}
function effectiveNavigationView() {
  if (appView !== "workspace") return appView;
  if (state.active === "wedding-planner" || state.active === "corporate-planner" || state.active === "private-planner") return "music";
  if (state.active === "uploads") return "files";
  if (state.active === "messages") return "messages";
  return "workspace";
}
function navigateToView(view) {
  if (!view) return;
  setMobileMenu(false);
  if (view === "music") {
    state.active = plannerForBooking() || "wedding-planner";
    appView = "workspace";
  } else if (view === "files") {
    state.active = "uploads";
    appView = "workspace";
  } else if (view === "messages") {
    state.active = "messages";
    appView = "workspace";
  } else {
    appView = view;
  }
  shell();
  requestAnimationFrame(() => {
    const main = document.querySelector("#main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}
function navigateToModule(moduleId) {
  if (!moduleId) return;
  setMobileMenu(false);
  state.active = moduleId;
  appView = "workspace";
  shell();
  requestAnimationFrame(() => {
    const main = document.querySelector("#main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}
var BOOKING_REQUESTS_KEY = "galaxy_cue_booking_requests_v600a1";
var bookingRequests = [];
function loadLocalBookingRequests() {
  try {
    return JSON.parse(localStorage.getItem(BOOKING_REQUESTS_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function saveLocalBookingRequests(rows) {
  localStorage.setItem(BOOKING_REQUESTS_KEY, JSON.stringify(rows || []));
}
function publicBookingBusinessId() {
  const u = new URL(location.href);
  return u.searchParams.get("book") || u.searchParams.get("booking-request") || "";
}
function isPublicBookingRequestRoute() {
  const u = new URL(location.href);
  return u.searchParams.has("book") || u.searchParams.has("booking-request") || location.hash === "#booking-request";
}
function bookingRequestShareUrl() {
  const u = new URL(location.href);
  u.hash = "";
  u.search = "";
  u.searchParams.set("book", activeBusinessId() || "demo");
  return u.toString();
}
function requestStatusLabel(status = "new") {
  return { new: "New Request", needs_info: "Waiting for Client", accepted: "Converted", declined: "Declined" }[status] || status;
}
async function refreshBookingRequests() {
  if (currentUser && activeBusinessId()) {
    const { data, error } = await listBookingRequests2(activeBusinessId());
    if (!error) {
      bookingRequests = data || [];
      return;
    }
    console.warn("Cloud booking requests unavailable; using local requests.", error);
  }
  bookingRequests = loadLocalBookingRequests();
}
function publicBookingRequestScreen() {
  const root = document.querySelector("#app");
  root.innerHTML = `<main class="public-booking-shell"><section class="public-booking-card"><div class="public-booking-brand"><img src="../../assets/galaxy-cue-logo.png" alt="Galaxy Cue"><div><small>Booking Request</small><h1>Tell us about your event</h1><p>Four short steps. No account is required.</p></div></div><div class="booking-progress" aria-label="Booking request progress">${["Contact", "Event", "Services", "Details"].map((label, index) => `<div class="booking-progress-step ${index === 0 ? "active" : ""}" data-booking-progress="${index}"><span>${index + 1}</span><small>${label}</small></div>`).join("")}</div><form id="publicBookingRequestForm" class="public-booking-form"><section class="booking-step active" data-booking-step="0"><div class="step-heading"><small>Step 1 of 4</small><h2>Contact information</h2></div><div class="public-form-grid"><label><span>Your name *</span><input name="client_name" required autocomplete="name"></label><label><span>Email *</span><input name="client_email" type="email" required autocomplete="email"></label><label><span>Phone</span><input name="client_phone" autocomplete="tel"></label></div></section><section class="booking-step" data-booking-step="1"><div class="step-heading"><small>Step 2 of 4</small><h2>Event basics</h2></div><div class="public-form-grid"><label><span>Event date *</span><input name="event_date" type="date" required></label><label><span>Event type *</span><select name="event_type" required><option value="">Select one</option><option>Wedding</option><option>Corporate</option><option>Private Party</option><option>Other</option></select></label><label><span>Estimated guests</span><input name="guest_count" type="number" min="1" inputmode="numeric"></label><label><span>Venue</span><input name="venue_name"></label><label><span>City</span><input name="venue_city"></label></div></section><section class="booking-step" data-booking-step="2"><div class="step-heading"><small>Step 3 of 4</small><h2>Services requested</h2></div><fieldset><legend>Select everything you may need</legend><div class="service-pills">${["DJ", "MC", "Ceremony", "Lighting", "Photo Booth", "Other"].map((x) => `<label><input type="checkbox" name="services" value="${x}"><span>${x}</span></label>`).join("")}</div></fieldset></section><section class="booking-step" data-booking-step="3"><div class="step-heading"><small>Step 4 of 4</small><h2>Additional details</h2></div><label><span>Tell us more</span><textarea name="message" rows="6" placeholder="Event style, timing, special requests or anything else we should know"></textarea></label><div class="booking-review-note">By submitting, you are sending a booking inquiry. Your date is not reserved until the organization confirms it.</div></section><div class="booking-step-actions"><button class="btn" type="button" data-booking-back hidden>Back</button><span></span><button class="btn primary" type="button" data-booking-next>Continue</button><button class="btn primary" type="submit" data-booking-submit hidden>Submit Booking Request</button></div><div id="publicBookingStatus" class="auth-status" role="status"></div></form></section></main>`;
  const form = document.querySelector("#publicBookingRequestForm");
  const steps = [...form.querySelectorAll("[data-booking-step]")];
  const progress = [...document.querySelectorAll("[data-booking-progress]")];
  const back = form.querySelector("[data-booking-back]");
  const next = form.querySelector("[data-booking-next]");
  const submit = form.querySelector("[data-booking-submit]");
  let step = 0;
  function showStep(index) {
    step = Math.max(0, Math.min(steps.length - 1, index));
    steps.forEach((el, i) => el.classList.toggle("active", i === step));
    progress.forEach((el, i) => {
      el.classList.toggle("active", i === step);
      el.classList.toggle("complete", i < step);
    });
    back.hidden = step === 0;
    next.hidden = step === steps.length - 1;
    submit.hidden = step !== steps.length - 1;
    steps[step].querySelector("input,select,textarea")?.focus({ preventScroll: true });
  }
  function stepValid() {
    const required = [...steps[step].querySelectorAll("[required]")];
    for (const input of required) {
      if (!input.checkValidity()) {
        input.reportValidity();
        return false;
      }
    }
    return true;
  }
  next.addEventListener("click", () => {
    if (stepValid()) showStep(step + 1);
  });
  back.addEventListener("click", () => showStep(step - 1));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const fd = new FormData(form), status = document.querySelector("#publicBookingStatus");
    const businessId = publicBookingBusinessId();
    const payload = { id: crypto.randomUUID(), business_id: businessId === "demo" ? null : businessId, client_name: String(fd.get("client_name") || "").trim(), client_email: String(fd.get("client_email") || "").trim().toLowerCase(), client_phone: String(fd.get("client_phone") || "").trim(), event_date: fd.get("event_date"), event_type: fd.get("event_type"), guest_count: Number(fd.get("guest_count")) || null, venue_name: String(fd.get("venue_name") || "").trim(), venue_city: String(fd.get("venue_city") || "").trim(), services: fd.getAll("services"), message: String(fd.get("message") || "").trim(), status: "new", created_at: (/* @__PURE__ */ new Date()).toISOString(), updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    status.textContent = "Submitting\u2026";
    submit.disabled = true;
    back.disabled = true;
    if (!payload.business_id) {
      const rows = loadLocalBookingRequests();
      rows.unshift(payload);
      saveLocalBookingRequests(rows);
    } else {
      const result = await submitBookingRequest2(payload);
      if (result.error) {
        console.error(result.error);
        status.textContent = "We could not send your request. Please try again or contact the organization directly.";
        submit.disabled = false;
        back.disabled = false;
        return;
      }
    }
    form.innerHTML = `<div class="public-success"><div>\u2713</div><h2>Request submitted</h2><p>Thank you, ${escapeHtml(payload.client_name)}. Your request has been sent and is awaiting review.</p><small>Reference ${escapeHtml(payload.id.slice(0, 8).toUpperCase())}</small></div>`;
  });
}
function bookingRequestCard(r) {
  return `<article class="lead-request-card"><div class="lead-request-head"><div><small>${escapeHtml(formatEventDate(r.event_date))}</small><h3>${escapeHtml(r.client_name || "Unnamed request")}</h3><p>${escapeHtml(r.event_type || "Event")} \xB7 ${escapeHtml(r.venue_name || r.venue_city || "Venue not set")}</p></div><span class="status-chip ${statusTone(r.status)}">${escapeHtml(requestStatusLabel(r.status))}</span></div><div class="lead-request-meta"><span>${escapeHtml(r.client_email || "No email")}</span><span>${r.guest_count ? `${r.guest_count} guests` : "Guest count not set"}</span><span>${escapeHtml((r.services || []).join(", ") || "Services not selected")}</span></div>${r.decision_note ? `<p class="lead-decision-note"><strong>Latest note:</strong> ${escapeHtml(r.decision_note)}</p>` : ""}<div class="lead-actions"><button class="btn" data-lead-action="review" data-lead-id="${r.id}">Review Request</button>${r.status === "new" ? `<button class="btn primary" data-lead-action="accept" data-lead-id="${r.id}">Accept & Create Event</button>` : ""}</div></article>`;
}
async function setLeadStatus(id, status, extra = {}) {
  const r = bookingRequests.find((x) => x.id === id);
  if (!r) return;
  Object.assign(r, { status, updated_at: (/* @__PURE__ */ new Date()).toISOString(), ...extra });
  if (currentUser && activeBusinessId()) {
    const result = await updateBookingRequest2(id, activeBusinessId(), { status, ...extra });
    if (result.error) {
      console.error(result.error);
      toast("Cloud update failed");
      return false;
    }
  } else saveLocalBookingRequests(bookingRequests);
  return true;
}
async function convertLeadToEvent(id) {
  const request = bookingRequests.find((row) => row.id === id);
  if (!request || request.status === "accepted") return;
  if (!currentUser || !activeBusinessId()) {
    toast("Sign in to accept a booking request.");
    return;
  }
  const buttons = [...document.querySelectorAll(`[data-lead-id="${CSS.escape(id)}"], [data-modal-lead-action="accept"]`)];
  buttons.forEach((button) => {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = "Creating event\u2026";
  });
  try {
    const { data, error } = await acceptBookingRequest2(id, activeBusinessId());
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    request.status = "accepted";
    request.converted_event_ref = result?.booking_ref || request.converted_event_ref;
    request.converted_client_id = result?.client_id || request.converted_client_id;
    request.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    await Promise.all([refreshBookingRequests(), refreshClientsFromCloud(), refreshEventsFromCloud()]);
    appView = "dashboard";
    shell();
    toast(`Event activated for ${request.client_name}. The Full Event Workbook is now available in the Client Portal.`);
  } catch (error) {
    console.error("Booking request activation failed:", error);
    toast(error?.message || "The booking request could not be activated.");
    buttons.forEach((button) => {
      button.disabled = false;
      button.textContent = button.dataset.originalText || "Accept & Create Event";
    });
  }
}
function closeLeadReview() {
  document.querySelector("#leadReviewModal")?.remove();
}
function openLeadReview(id) {
  const r = bookingRequests.find((x) => x.id === id);
  if (!r) return;
  closeLeadReview();
  const modal = document.createElement("div");
  modal.id = "leadReviewModal";
  modal.className = "modal";
  modal.innerHTML = `<div class="modal-panel lead-review-panel"><button class="modal-close" data-close-lead aria-label="Close">\xD7</button><div class="eyebrow">Booking Request</div><h2>${escapeHtml(r.client_name || "Unnamed request")}</h2><div class="lead-review-grid"><div><small>Contact</small><strong>${escapeHtml(r.client_email || "\u2014")}</strong><span>${escapeHtml(r.client_phone || "No phone")}</span></div><div><small>Event</small><strong>${escapeHtml(r.event_type || "\u2014")}</strong><span>${escapeHtml(formatEventDate(r.event_date))}</span></div><div><small>Venue</small><strong>${escapeHtml(r.venue_name || "Not provided")}</strong><span>${escapeHtml(r.venue_city || "")}</span></div><div><small>Guests</small><strong>${escapeHtml(String(r.guest_count || "Not provided"))}</strong><span>${escapeHtml((r.services || []).join(", ") || "No services selected")}</span></div></div><section class="lead-review-message"><small>Client message</small><p>${escapeHtml(r.message || "No additional message.")}</p></section>${r.decision_note ? `<section class="lead-review-message"><small>Organization note</small><p>${escapeHtml(r.decision_note)}</p></section>` : ""}<div class="lead-actions modal-lead-actions">${r.status !== "accepted" && r.status !== "declined" ? `<button class="btn primary" data-modal-lead-action="accept">Accept & Create Event</button><button class="btn" data-modal-lead-action="info">Need More Info</button><button class="btn danger" data-modal-lead-action="decline">Decline</button>` : `<span class="status-chip ${statusTone(r.status)}">${escapeHtml(requestStatusLabel(r.status))}</span>`}</div></div>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-lead]").addEventListener("click", closeLeadReview);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeLeadReview();
  });
  modal.querySelectorAll("[data-modal-lead-action]").forEach((button) => button.addEventListener("click", async () => {
    const action = button.dataset.modalLeadAction;
    if (action === "accept") {
      closeLeadReview();
      return convertLeadToEvent(id);
    }
    if (action === "decline") {
      const reason = prompt("Optional decline reason:") || "";
      if (await setLeadStatus(id, "declined", { decision_note: reason })) {
        closeLeadReview();
        shell();
      }
    }
    if (action === "info") {
      const note = prompt("What additional information is needed?") || "";
      if (!note) return;
      if (await setLeadStatus(id, "needs_info", { decision_note: note })) {
        closeLeadReview();
        shell();
      }
    }
  }));
}
function bindLeadActions() {
  document.querySelectorAll("[data-lead-action]").forEach((b) => b.addEventListener("click", async () => {
    const { leadAction, leadId } = b.dataset;
    if (leadAction === "review") return openLeadReview(leadId);
    if (leadAction === "accept") return convertLeadToEvent(leadId);
  }));
  document.querySelector("[data-copy-booking-link]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(bookingRequestShareUrl());
      toast("Booking request link copied");
    } catch {
      prompt("Copy this booking link:", bookingRequestShareUrl());
    }
  });
}
function shell() {
  document.querySelector("#app").innerHTML = `<div class="crm-shell">
<header class="topbar crm-topbar">
  <button class="mobile-menu-toggle" type="button" data-action="toggle-mobile-menu" aria-label="Open navigation" aria-expanded="false"><span></span><span></span><span></span></button>
  <div class="brand galaxy-cue-brand">
    <img class="galaxy-cue-logo" src="../../assets/galaxy-cue-logo.png" alt="Galaxy Cue">
    <span class="brand-divider" aria-hidden="true"></span>
    <div class="brand-tagline">Operating system for DJs<br>and entertainment companies</div>
  </div>
  <div class="topbar-tools">
    <button class="command-trigger" data-action="command">\u2318K <span>Quick actions</span></button>
    <div class="cloud-status ${currentUser ? "online" : "offline"}"><span></span>${currentUser ? escapeHtml(currentUser.email || "Signed in") : "Local mode"}</div>
    <button class="btn compact" data-action="client-login">Client Login</button>
    <button class="btn compact account-button" data-action="${currentUser ? "logout" : "login"}">${currentUser ? "Sign Out" : "Business Login"}</button>
    <button class="status-pill version-indicator" type="button" data-action="force-refresh" title="Build ${escapeHtml(galaxyCueRuntime.build)} \xB7 Click to clear cache and reload">GALAXY CUE \xB7 v${escapeHtml(galaxyCueRuntime.version)}</button>
  </div>
</header>
<div class="mobile-nav-backdrop" data-action="close-mobile-menu"></div>
<div class="crm-layout">
  <aside class="crm-sidebar" id="crmSidebar" aria-label="Main navigation">
    <div class="mobile-sidebar-head">
      <div><small>Galaxy Cue</small><strong>Navigation</strong></div>
      <button class="mobile-menu-close" type="button" data-action="close-mobile-menu" aria-label="Close navigation">\xD7</button>
    </div>
    <div class="workspace-label">Business</div>
    ${[
    ["dashboard", "\u2302", "Dashboard"],
    ["bookings", "\u25A3", "Events"],
    ["quotes", "\u25A5", "Quotes"],
    ["contracts", "\u25A4", "Contracts"],
    ["invoices", "\u25A6", "Invoices"],
    ["payments", "$", "Payments"],
    ["clients", "\u2659", "Clients"],
    ["calendar", "\u25A1", "Calendar"],
    ["music", "\u266B", "Music Planner"],
    ["files", "\u25B1", "Files"],
    ["messages", "\u25CB", "Messages"],
    ["client-portal", "\u25C7", "Client Portal"],
    ["analytics", "\u2301", "Analytics"],
    ["settings", "\u2699", "Settings"]
  ].map(([id, icon, label]) => `<button class="crm-nav ${effectiveNavigationView() === id ? "active" : ""}" data-view="${id}" ${effectiveNavigationView() === id ? 'aria-current="page"' : ""}><span>${icon}</span>${label}</button>`).join("")}
    <div class="sidebar-footer"><small>Current event</small><strong>${state.bookingId}</strong></div>
  </aside>
  <main class="crm-main" id="main"></main>
</div>
</div>
<div id="authModal" class="auth-modal hidden"><div class="auth-card gc-login-card"><button class="auth-close" data-action="close-auth">\xD7</button><div class="login-brand-lockup"><img src="../../assets/galaxy-cue-mark-transparent.png" class="login-mark" alt="Galaxy Cue"><strong>GALAXY <span>CUE</span></strong></div><div class="login-gold-rule"><i></i></div><h2>Welcome back</h2><p>Enter your email and we\u2019ll send you a secure sign-in link.</p><input id="authEmail" type="email" placeholder="you@example.com"><button type="button" class="btn primary full" data-action="send-link">Continue with Email</button><div id="authStatus" class="auth-status" role="status" aria-live="polite"></div><small>No password required.</small><div class="login-security">\u25C7&nbsp; Secure. Private. Always.</div></div></div>
<div id="commandModal" class="auth-modal hidden"><div class="command-card"><div class="command-head"><input id="commandInput" placeholder="Search actions or events\u2026"><button class="auth-close" data-action="close-command">\xD7</button></div><div id="commandResults"></div></div></div>
<div id="eventModal" class="auth-modal hidden"><form class="auth-card event-create-card" id="eventCreateForm"><input type="hidden" name="bookingRef"><button type="button" class="auth-close" data-action="close-event-modal">\xD7</button><div class="eyebrow" id="eventModalEyebrow" data-event-eyebrow>New Event</div><h2 id="eventModalTitle" data-event-title>Create an event</h2><p id="eventModalIntro" data-event-intro>Start with the essential details. You can complete the full consultation afterward.</p>
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
  renderAppView();
  bindNav();
  bindGlobalActions();
  installResponsiveNavigationGuards();
  setMobileMenu(false);
}
function renderAppView() {
  if (appView === "dashboard") renderDashboard();
  else if (appView === "bookings") renderBookingManager();
  else if (appView === "calendar") renderCalendarView();
  else if (appView === "quotes") renderQuotes();
  else if (appView === "contracts") renderContracts();
  else if (appView === "invoices") renderInvoices();
  else if (appView === "payments") renderPayments();
  else if (appView === "clients") renderClients();
  else if (appView === "client-portal") renderClientPortal();
  else if (appView === "analytics") renderSectionView("Analytics", "Understand bookings, revenue and business performance.", "\u2301");
  else if (appView === "settings") renderSettings();
  else if (appView === "music" || appView === "files" || appView === "messages") {
    console.warn("Legacy route reached; normalizing navigation route.");
    navigateToView(appView);
  } else renderMain();
}
async function refreshCloudBookings() {
  if (!currentUser) {
    cloudBookings = loadLocalEvents();
    eventCloudStatus = "Local";
    return;
  }
  const businessId = activeBusinessId();
  if (!businessId) {
    cloudBookings = [];
    eventCloudStatus = "Sync failed";
    console.error("No active business workspace while loading events.");
    return;
  }
  eventCloudStatus = "Syncing\u2026";
  const { data, error } = await listCloudEvents2(businessId);
  if (error) {
    eventCloudStatus = "Sync failed";
    console.error("Business event load failed:", error);
    toast(`Could not load business events: ${error.message}`);
    return;
  }
  cloudBookings = data || [];
  eventCloudStatus = "Synced";
}
function normalizedEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}
function normalizedName(value = "") {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}
function findMatchingClient({ email = "", name = "", company = "" } = {}) {
  const emailKey = normalizedEmail(email);
  const nameKeys = [normalizedName(name), normalizedName(company)].filter(Boolean);
  return crmClients.find((client) => {
    if (emailKey && normalizedEmail(client.email) === emailKey) return true;
    const clientKeys = [normalizedName(client.name), normalizedName(client.company)].filter(Boolean);
    return nameKeys.some((key) => clientKeys.includes(key));
  }) || null;
}
function eventsForClient(client) {
  const email = normalizedEmail(client.email);
  const names = [normalizedName(client.name), normalizedName(client.company)].filter(Boolean);
  return cloudBookings.filter((event) => {
    if (client.id && event.client_id === client.id) return true;
    if (email && normalizedEmail(event.client_email) === email) return true;
    return names.includes(normalizedName(event.client_name));
  });
}
function eventDateValue(event) {
  if (!event?.event_date) return null;
  const date = /* @__PURE__ */ new Date(`${event.event_date}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
function isSameCalendarDay(dateA, dateB) {
  return dateA && dateB && dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth() && dateA.getDate() === dateB.getDate();
}
function clientTimelineStats(client) {
  const now = /* @__PURE__ */ new Date();
  const events = eventsForClient(client).sort((a, b) => String(a.event_date || "9999").localeCompare(String(b.event_date || "9999")));
  const past = events.filter((event) => eventDateValue(event) && eventDateValue(event) < now);
  const upcoming = events.filter((event) => eventDateValue(event) && eventDateValue(event) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  return {
    events,
    last: past[past.length - 1] || null,
    next: upcoming[0] || null
  };
}
function greeting() {
  const h = (/* @__PURE__ */ new Date()).getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
function eventTypeLabel(v = "") {
  return v || "Event";
}
function statusTone(s = "") {
  const x = s.toLowerCase();
  if (x.includes("accept") || x.includes("paid") || x.includes("confirm")) return "green";
  if (x.includes("declin") || x.includes("cancel")) return "red";
  return "gold";
}
async function renderDashboard() {
  const main = document.querySelector("#main");
  main.innerHTML = `<div class="dashboard-loading">Loading your command center\u2026</div>`;
  if (currentUser && activeBusinessId()) {
    await refreshCoreCloudData();
  }
  await refreshBookingRequests();
  const now = /* @__PURE__ */ new Date();
  const today = cloudBookings.filter((event) => isSameCalendarDay(eventDateValue(event), now));
  const upcoming = cloudBookings.filter((event) => eventDateValue(event) && eventDateValue(event) >= new Date(now.getFullYear(), now.getMonth(), now.getDate())).sort((a, b) => String(a.event_date).localeCompare(String(b.event_date)));
  const recentClients = [...crmClients].sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""))).slice(0, 5);
  const pending = cloudBookings.filter((event) => !String(event.status || "").toLowerCase().match(/accepted|confirmed|paid|complete|cancel/));
  const next = upcoming[0] || null;
  main.innerHTML = `<section class="dash-hero">
    <div><div class="eyebrow">Galaxy Cue CRM</div><h1>${greeting()}.</h1><p>${currentUser ? `${upcoming.length} upcoming event${upcoming.length === 1 ? "" : "s"} and ${crmClients.length} client${crmClients.length === 1 ? "" : "s"} are connected to this workspace.` : "Sign in to load your business workspace."}</p></div>
    <div class="hero-actions"><button class="btn primary" data-action="new-booking">\uFF0B New Event</button><button class="btn" data-action="new-dashboard-client">\uFF0B New Client</button></div>
  </section>

  <section class="lead-intake-panel"><div class="section-title"><div><small>Lead Intake</small><h2>New Booking Requests</h2></div><button class="btn compact" data-copy-booking-link>Copy Public Booking Link</button></div><div class="lead-request-list">${bookingRequests.filter((r) => r.status === "new" || r.status === "needs_info").length ? bookingRequests.filter((r) => r.status === "new" || r.status === "needs_info").map(bookingRequestCard).join("") : `<div class="empty-state">No pending booking requests. Share your public booking link to receive one.</div>`}</div></section>

  <section class="kpi-grid">
    ${kpi("Today", today.length, today.length ? "Events scheduled" : "No events today", "calendar")}
    ${kpi("Upcoming Events", upcoming.length, "Cloud event records", "month")}
    ${kpi("Clients", crmClients.length, "Connected profiles", "cloud")}
    ${kpi("Need Attention", pending.length, "Draft or pending", "quote")}
  </section>

  <section class="dashboard-grid crm-dashboard-v42">
    <div class="lux-card wide">
      <div class="section-title"><div><small>Schedule</small><h2>${today.length ? "Today\u2019s Events" : "Upcoming Events"}</h2></div><button class="text-button" data-view="bookings">View all \u2192</button></div>
      <div class="event-list">${(today.length ? today : upcoming).length ? (today.length ? today : upcoming).slice(0, 6).map(bookingRow).join("") : `<div class="empty-state">No scheduled events yet.</div>`}</div>
    </div>

    <div class="lux-card next-event">
      <small>Next Event</small>
      ${next ? `<div class="next-date">${formatEventDate(next.event_date)}</div><h2>${escapeHtml(next.client_name || "Unnamed Client")}</h2><p>${escapeHtml(eventTypeLabel(next.event_type))}</p><div class="next-meta"><span>${escapeHtml(next.venue_name || "Venue not set")}</span><span class="status-chip ${statusTone(next.status)}">${escapeHtml(next.status || "Draft")}</span></div><button class="btn primary full" data-open-booking="${next.booking_ref}">Open Event</button>` : `<div class="empty-state">Your next event will appear here.</div>`}
    </div>

    <div class="lux-card">
      <div class="section-title"><div><small>Relationships</small><h2>Recent Clients</h2></div><button class="text-button" data-view="clients">View all \u2192</button></div>
      <div class="recent-client-list">${recentClients.length ? recentClients.map((client) => {
    const stats = clientTimelineStats(client);
    return `<button data-dashboard-client="${client.id}"><span class="client-initial">${escapeHtml((client.name || client.company || "?").trim().charAt(0).toUpperCase())}</span><span><strong>${escapeHtml(client.name || client.company || "Unnamed Client")}</strong><small>${stats.events.length} event${stats.events.length === 1 ? "" : "s"}${stats.next ? ` \xB7 Next ${formatEventDate(stats.next.event_date)}` : ""}</small></span><span>\u2192</span></button>`;
  }).join("") : '<div class="empty-state compact">No clients yet.</div>'}</div>
    </div>

    <div class="lux-card">
      <div class="section-title"><div><small>Quick Actions</small><h2>Start Work</h2></div></div>
      <div class="dashboard-action-grid">
        <button data-action="new-booking"><strong>\uFF0B Event</strong><small>Create and link a new event</small></button>
        <button data-action="new-dashboard-client"><strong>\uFF0B Client</strong><small>Add a CRM profile</small></button>
        <button data-view="calendar"><strong>\u25EB Calendar</strong><small>Review the schedule</small></button>
        <button data-view="bookings"><strong>\u2315 Search</strong><small>Find any event</small></button>
      </div>
    </div>
  </section>`;
  bindDashboardActions();
  bindLeadActions();
  document.querySelectorAll('[data-action="new-dashboard-client"]').forEach((button) => button.addEventListener("click", () => {
    selectedClientId = null;
    appView = "clients";
    shell();
    requestAnimationFrame(() => {
      const panel = document.querySelector(".booking-preview-panel");
      if (panel) {
        panel.innerHTML = clientEditor();
        bindClientEditor();
      }
    });
  }));
  document.querySelectorAll("[data-dashboard-client]").forEach((button) => button.addEventListener("click", () => {
    selectedClientId = button.dataset.dashboardClient;
    appView = "clients";
    shell();
  }));
}
function kpi(label, value, caption, kind) {
  return `<div class="kpi-card ${kind}"><div class="kpi-icon">${kind === "calendar" ? "\u25F7" : kind === "quote" ? "$" : kind === "month" ? "\u25EB" : "\u2601"}</div><small>${label}</small><strong>${value}</strong><span>${caption}</span></div>`;
}
function bookingRow(b) {
  return `<button class="event-row" data-open-booking="${b.booking_ref}"><div class="event-date"><strong>${shortDay(b.event_date)}</strong><span>${shortMonth(b.event_date)}</span></div><div class="event-copy"><strong>${escapeHtml(b.client_name || "Unnamed Client")}</strong><span>${escapeHtml(eventTypeLabel(b.event_type))} \xB7 ${escapeHtml(b.venue_name || "Venue not set")}</span></div><span class="status-chip ${statusTone(b.status)}">${escapeHtml(b.status || "Draft")}</span><span class="row-arrow">\u2192</span></button>`;
}
function formatEventDate(d) {
  if (!d) return "Date not set";
  return (/* @__PURE__ */ new Date(d + "T12:00:00")).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function shortDay(d) {
  return d ? (/* @__PURE__ */ new Date(d + "T12:00:00")).getDate() : "\u2014";
}
function shortMonth(d) {
  return d ? (/* @__PURE__ */ new Date(d + "T12:00:00")).toLocaleDateString("en-US", { month: "short" }) : "TBD";
}
async function renderClients() {
  const main = document.querySelector("#main");
  main.innerHTML = '<div class="dashboard-loading">Loading client relationships\u2026</div>';
  if (currentUser && activeBusinessId()) await refreshCoreCloudData();
  const filtered = crmClients.filter(
    (client) => [client.name, client.company, client.email, client.phone, client.notes].join(" ").toLowerCase().includes(clientSearch.toLowerCase())
  );
  const selected = filtered.find((client) => client.id === selectedClientId) || filtered[0] || null;
  selectedClientId = selected ? selected.id : null;
  main.innerHTML = `<section class="dash-hero compact-hero"><div><div class="eyebrow">Relationship Management</div><h1>Clients</h1><p>Every client profile includes its event history, last event and next scheduled event.</p></div><div class="hero-actions"><span class="sync-chip">${currentUser ? clientCloudStatus : "Local only"}</span><button class="btn primary" data-action="new-client">\uFF0B New Client</button></div></section>
  <div class="crm-controls"><div class="search-box">\u2315<input id="clientSearch" value="${escapeHtml(clientSearch)}" placeholder="Search name, company, email or phone"></div><div class="calendar-count">${filtered.length} client${filtered.length === 1 ? "" : "s"}</div></div>
  <div class="crm-split clients-split">
    <section class="booking-list-panel"><div class="list-panel-head"><strong>Client Directory</strong><small>${currentUser ? "Supabase cloud records" : "Saved in this browser"}</small></div>
      <div class="booking-card-list">${filtered.length ? filtered.map((client) => clientCard(client, selectedClientId)).join("") : '<div class="empty-state"><strong>No clients found.</strong><br>Create a client or adjust your search.</div>'}</div>
    </section>
    <aside class="booking-preview-panel">${selected ? clientPreview(selected) : clientEditor()}</aside>
  </div>`;
  const search = document.querySelector("#clientSearch");
  if (search) search.addEventListener("input", (event) => {
    clientSearch = event.target.value;
    renderClients();
  });
  document.querySelectorAll("[data-select-client]").forEach((button) => button.addEventListener("click", () => {
    selectedClientId = button.dataset.selectClient;
    renderClients();
  }));
  document.querySelectorAll('[data-action="new-client"]').forEach((button) => button.addEventListener("click", () => {
    selectedClientId = null;
    document.querySelector(".booking-preview-panel").innerHTML = clientEditor();
    bindClientEditor();
  }));
  bindClientEditor();
  bindDashboardActions();
}
function clientCard(client, selectedId) {
  const stats = clientTimelineStats(client);
  return `<button class="booking-card client-card-v42 ${client.id === selectedId ? "selected" : ""}" data-select-client="${client.id}">
    <div class="booking-card-top"><div><strong>${escapeHtml(client.name || client.company || "Unnamed Client")}</strong><small>${escapeHtml(client.company || client.email || "Private client")}</small></div><span class="client-initial">${escapeHtml((client.name || client.company || "?").trim().charAt(0).toUpperCase())}</span></div>
    <div class="client-card-stats"><span><strong>${stats.events.length}</strong><small>Events</small></span><span><strong>${stats.next ? shortMonth(stats.next.event_date) + " " + shortDay(stats.next.event_date) : "\u2014"}</strong><small>Next</small></span></div>
    <div class="booking-card-meta"><span>${escapeHtml(client.email || "No email")}</span><span>${escapeHtml(client.phone || "No phone")}</span></div>
  </button>`;
}
function clientPreview(client) {
  const stats = clientTimelineStats(client);
  return `<div class="preview-eyebrow">Client Profile</div><h2>${escapeHtml(client.name || client.company || "Unnamed Client")}</h2><p>${escapeHtml(client.company || "Private client")}</p>
  <div class="preview-grid">
    <div><small>Email</small><strong>${escapeHtml(client.email || "Not set")}</strong></div>
    <div><small>Phone</small><strong>${escapeHtml(client.phone || "Not set")}</strong></div>
    <div><small>Total events</small><strong>${stats.events.length}</strong></div>
    <div><small>Next event</small><strong>${stats.next ? formatEventDate(stats.next.event_date) : "None scheduled"}</strong></div>
    <div><small>Last event</small><strong>${stats.last ? formatEventDate(stats.last.event_date) : "No past events"}</strong></div>
    <div><small>Updated</small><strong>${new Date(client.updatedAt || client.createdAt).toLocaleDateString()}</strong></div>
  </div>
  ${client.notes ? `<div class="client-notes"><small>Notes</small><p>${escapeHtml(client.notes)}</p></div>` : ""}
  <div class="client-event-timeline">
    <div class="section-title"><div><small>Timeline</small><h3>Linked Events</h3></div></div>
    ${stats.events.length ? stats.events.slice(0, 8).map((event) => `<button data-open-booking="${event.booking_ref}"><span><strong>${escapeHtml(event.event_type || "Event")}</strong><small>${escapeHtml(event.venue_name || "Venue not set")}</small></span><span>${formatEventDate(event.event_date)} \u2192</span></button>`).join("") : '<div class="empty-state compact">No linked events yet.</div>'}
  </div>
  <button class="btn primary full" data-edit-client="${client.id}">Edit Client</button>
  <button class="btn full preview-secondary" data-client-event="${client.id}">Create Event for Client</button>
  <button class="text-button danger-text" data-delete-client="${client.id}">Delete client</button>`;
}
function clientEditor(c = { id: "", name: "", company: "", email: "", phone: "", notes: "" }) {
  return `<form id="clientEditor" class="client-editor"><div class="preview-eyebrow">${c.id ? "Edit Client" : "New Client"}</div><h2>${c.id ? "Update profile" : "Create client"}</h2>
  <label><span>Client name *</span><input name="name" required value="${escapeHtml(c.name)}" placeholder="Full name"></label>
  <label><span>Company / organization</span><input name="company" value="${escapeHtml(c.company)}" placeholder="Optional"></label>
  <div class="editor-grid"><label><span>Email</span><input type="email" name="email" value="${escapeHtml(c.email)}"></label><label><span>Phone</span><input name="phone" value="${escapeHtml(c.phone)}"></label></div>
  <label><span>Internal notes</span><textarea name="notes" rows="5">${escapeHtml(c.notes)}</textarea></label>
  <input type="hidden" name="id" value="${escapeHtml(c.id)}"><button class="btn primary full" type="submit">${c.id ? "Save Changes" : "Create Client"}</button></form>`;
}
function bindClientEditor() {
  document.querySelectorAll("[data-edit-client]").forEach((b) => b.addEventListener("click", () => {
    const c = crmClients.find((x) => x.id === b.dataset.editClient);
    document.querySelector(".booking-preview-panel").innerHTML = clientEditor(c);
    bindClientEditor();
  }));
  document.querySelectorAll("[data-delete-client]").forEach((b) => b.addEventListener("click", async () => {
    if (!confirm("Delete this client record?")) return;
    const id = b.dataset.deleteClient;
    if (currentUser && activeBusinessId()) {
      clientCloudStatus = "Saving\u2026";
      const { error } = await removeCloudClient2(id, activeBusinessId());
      if (error) {
        clientCloudStatus = "Sync failed";
        return toast(error.message);
      }
      await refreshClientsFromCloud();
    } else {
      crmClients = crmClients.filter((x) => x.id !== id);
      saveClients(crmClients);
    }
    selectedClientId = null;
    renderClients();
    toast("Client deleted");
  }));
  document.querySelectorAll("[data-client-event]").forEach((b) => b.addEventListener("click", () => {
    const c = crmClients.find((x) => x.id === b.dataset.clientEvent);
    openEventModal(c);
  }));
  const form = document.querySelector("#clientEditor");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form), id = String(fd.get("id") || "");
    const existing = crmClients.find((x) => x.id === id) || {};
    const row = {
      id: id || crypto.randomUUID(),
      name: String(fd.get("name") || "").trim(),
      company: String(fd.get("company") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      notes: String(fd.get("notes") || "").trim(),
      createdAt: existing.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const duplicate = findMatchingClient(row);
    if (!id && duplicate) {
      selectedClientId = duplicate.id;
      toast("Existing client found. Opening the current profile instead.");
      renderClients();
      return;
    }
    if (currentUser && activeBusinessId()) {
      clientCloudStatus = "Saving\u2026";
      const { data, error } = await saveCloudClient2(row, activeBusinessId());
      if (error) {
        clientCloudStatus = "Sync failed";
        toast(error.message);
        return;
      }
      selectedClientId = data.id;
      await refreshClientsFromCloud();
      renderClients();
      toast(id ? "Client updated in cloud" : "Client created in cloud");
    } else {
      crmClients = id ? crmClients.map((x) => x.id === id ? row : x) : [row, ...crmClients];
      saveClients(crmClients);
      selectedClientId = row.id;
      renderClients();
      toast(id ? "Client updated locally" : "Client created locally");
    }
  });
  document.querySelectorAll('[data-action="import-local-cloud"]').forEach((b) => b.addEventListener("click", migrateLocalClientsAndEvent));
}
function populateQuickEventForm(form, client = null, event = null) {
  if (!form) return;
  form.reset();
  const isEdit = Boolean(event?.booking_ref);
  form.elements.bookingRef.value = event?.booking_ref || "";
  if (isEdit) {
    form.elements.clientName.value = event.client_name || "";
    form.elements.clientEmail.value = event.client_email || "";
    form.elements.eventType.value = event.event_type || "Wedding";
    form.elements.eventDate.value = event.event_date || "";
    const details = (event.booking_data || event.event_data)?.forms?.[event.event_type === "Corporate" ? "corporate" : event.event_type === "Private Party" ? "private" : "wedding"] || {};
    form.elements.setupStartTime.value = details.setupStartTime || "";
    form.elements.breakdownEndTime.value = details.breakdownEndTime || event.breakdown_end_time || "";
    form.elements.startTime.value = event.start_time || details.startTime || details.ceremonyTime || "";
    form.elements.endTime.value = event.end_time || details.endTime || "";
    form.elements.venueName.value = event.venue_name || "";
  } else if (client) {
    form.elements.clientName.value = client.name || client.company || "";
    form.elements.clientEmail.value = client.email || "";
  }
  form.querySelector("[data-event-eyebrow]")?.replaceChildren(document.createTextNode(isEdit ? "Edit Event" : "New Event"));
  form.querySelector("[data-event-title]")?.replaceChildren(document.createTextNode(isEdit ? "Edit event details" : "Create an event"));
  form.querySelector("[data-event-intro]")?.replaceChildren(document.createTextNode(isEdit ? "Update the client, event date, type or venue." : "Start with the essential details. You can complete the full consultation afterward."));
  const submit = form.querySelector('button[type="submit"]');
  if (submit) submit.textContent = isEdit ? "Save Event Changes" : "Create Event Workspace";
}
function bindQuickEventForm(form) {
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "1";
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent || "Create Event";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Saving event\u2026";
    }
    try {
      await createEventFromQuickForm(form);
    } catch (error) {
      console.error("Event creation failed:", error);
      eventCloudStatus = "Sync failed";
      toast(error?.message || "The event could not be saved");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
}
function openEventModal(client = null, event = null) {
  navigateToView("bookings");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const panel = document.querySelector(".booking-preview-panel");
    const source = document.querySelector("#eventCreateForm");
    if (!panel || !source) return;
    const form = source.cloneNode(true);
    form.id = "eventInlineForm";
    form.className = "client-editor event-inline-editor";
    form.removeAttribute("data-bound");
    form.querySelector('[data-action="close-event-modal"]')?.remove();
    panel.innerHTML = "";
    panel.appendChild(form);
    populateQuickEventForm(form, client, event);
    bindQuickEventForm(form);
    requestAnimationFrame(() => {
      form.elements.clientName?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }));
}
function closeEventModal() {
  const modal = document.querySelector("#eventModal");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("event-modal-open");
}
async function createEventFromQuickForm(form) {
  const fd = new FormData(form);
  const bookingRef = String(fd.get("bookingRef") || "").trim();
  const isEdit = Boolean(bookingRef);
  const type = String(fd.get("eventType") || "Wedding");
  const moduleId = type === "Corporate" ? "corporate" : type === "Private Party" ? "private" : "wedding";
  if (isEdit) {
    const source = currentUser ? cloudBookings.find((event) => event.booking_ref === bookingRef) : loadLocalEvents().find((event) => event.booking_ref === bookingRef);
    const existingState = source?.booking_data || source?.event_data;
    if (existingState) state = JSON.parse(JSON.stringify(existingState));
    state.bookingId = bookingRef;
    state.forms = state.forms || {};
    state.completed = state.completed || [];
    state.active = moduleId;
  } else {
    state = {
      active: moduleId,
      bookingId: makeId(),
      forms: {},
      completed: [],
      updated: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const previousDetails = state.forms[moduleId] || {};
  state.forms[moduleId] = {
    ...previousDetails,
    primaryClient: String(fd.get("clientName") || ""),
    company: String(fd.get("clientName") || ""),
    email: String(fd.get("clientEmail") || ""),
    eventDate: String(fd.get("eventDate") || ""),
    setupStartTime: String(fd.get("setupStartTime") || ""),
    breakdownEndTime: String(fd.get("breakdownEndTime") || ""),
    startTime: String(fd.get("startTime") || ""),
    endTime: String(fd.get("endTime") || ""),
    venueName: String(fd.get("venueName") || "")
  };
  localStorage.setItem(KEY, JSON.stringify(state));
  const email = String(fd.get("clientEmail") || "").trim();
  const name = String(fd.get("clientName") || "").trim();
  let linkedClient = findMatchingClient({ email, name }) || null;
  if (name && !linkedClient) {
    const localClient = {
      id: crypto.randomUUID(),
      name,
      company: "",
      email,
      phone: "",
      notes: "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (currentUser && activeBusinessId()) {
      const savedClient = await saveCloudClient2(localClient, activeBusinessId());
      if (savedClient.error) {
        throw new Error(`Client save failed: ${savedClient.error.message}`);
      }
      linkedClient = normalizeCloudClient(savedClient.data);
      await refreshClientsFromCloud();
    } else {
      crmClients.unshift(localClient);
      saveClients(crmClients);
      linkedClient = localClient;
    }
  }
  if (currentUser && activeBusinessId()) {
    eventCloudStatus = "Saving\u2026";
    const savedEvent = await saveCloudEvent2(state, activeBusinessId(), linkedClient?.id || null);
    if (savedEvent.error) {
      eventCloudStatus = "Sync failed";
      throw new Error(`Event save failed: ${savedEvent.error.message}`);
    }
    eventCloudStatus = "Synced";
    await refreshEventsFromCloud();
    selectedBookingRef = state.bookingId;
    toast(isEdit ? "Event changes saved to cloud" : "Event saved to cloud");
  } else {
    upsertLocalEvent(state, linkedClient);
    eventCloudStatus = "Local";
    selectedBookingRef = state.bookingId;
    toast(isEdit ? "Event changes saved locally" : linkedClient ? "Event saved locally and linked to client" : "Event saved locally");
  }
  closeEventModal();
  appView = "bookings";
  shell();
}
function moneyCents(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((Number(cents) || 0) / 100);
}
function makeRecordNumber(prefix) {
  return `${prefix}-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
function quoteTotal(q) {
  return (q.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPriceCents) || 0), 0);
}
function renderQuotes() {
  const main = document.querySelector("#main");
  const filtered = crmQuotes.filter((q) => [q.number, q.clientName, q.eventName, q.status].join(" ").toLowerCase().includes(quoteSearch.toLowerCase()));
  const selected = filtered.find((q) => q.id === selectedQuoteId) || filtered[0] || null;
  selectedQuoteId = selected ? selected.id : null;
  main.innerHTML = `<section class="dash-hero compact-hero"><div><div class="eyebrow">Sales Documents</div><h1>Quotes</h1><p>Create clear pricing proposals and convert accepted quotes into contracts.</p></div><div class="hero-actions"><button class="btn primary" data-action="new-quote">\uFF0B New Quote</button></div></section>
  <div class="crm-controls"><div class="search-box">\u2315<input id="quoteSearch" value="${escapeHtml(quoteSearch)}" placeholder="Search quote, client, event or status"></div><div class="calendar-count">${filtered.length} quote${filtered.length === 1 ? "" : "s"}</div></div>
  <div class="crm-split">
    <section class="booking-list-panel"><div class="list-panel-head"><strong>Quote Library</strong><small>Local draft records</small></div>
      <div class="booking-card-list">${filtered.length ? filtered.map((q) => quoteCard(q, selectedQuoteId)).join("") : '<div class="empty-state"><strong>No quotes yet.</strong><br>Create your first pricing proposal.</div>'}</div>
    </section>
    <aside class="booking-preview-panel">${selected ? quotePreview(selected) : quoteEditor()}</aside>
  </div>`;
  const search = document.querySelector("#quoteSearch");
  if (search) search.addEventListener("input", (e) => {
    quoteSearch = e.target.value;
    renderQuotes();
    const n = document.querySelector("#quoteSearch");
    if (n) {
      n.focus();
      n.setSelectionRange(n.value.length, n.value.length);
    }
  });
  document.querySelectorAll("[data-select-quote]").forEach((b) => b.addEventListener("click", () => {
    selectedQuoteId = b.dataset.selectQuote;
    renderQuotes();
  }));
  document.querySelectorAll('[data-action="new-quote"]').forEach((b) => b.addEventListener("click", () => {
    selectedQuoteId = null;
    document.querySelector(".booking-preview-panel").innerHTML = quoteEditor();
    bindQuoteEditor();
  }));
  bindQuoteEditor();
  bindDashboardActions();
}
function quoteCard(q, selectedId) {
  return `<button class="booking-card ${q.id === selectedId ? "selected" : ""}" data-select-quote="${q.id}">
    <div class="booking-card-top"><div><strong>${escapeHtml(q.clientName || "Unnamed Client")}</strong><small>${escapeHtml(q.number)}</small></div><span class="status-chip ${statusTone(q.status)}">${escapeHtml(q.status || "Draft")}</span></div>
    <div class="booking-card-meta"><span>${escapeHtml(q.eventName || "Event")}</span><span>${moneyCents(quoteTotal(q))}</span></div>
  </button>`;
}
function quotePreview(q) {
  const total = quoteTotal(q), deposit = Math.round(total * (Number(q.depositPercent) || 0) / 100);
  return `<div class="preview-eyebrow">Quote</div><h2>${escapeHtml(q.number)}</h2><p>${escapeHtml(q.clientName || "Unnamed Client")}</p>
  <div class="preview-grid"><div><small>Event</small><strong>${escapeHtml(q.eventName || "Not set")}</strong></div><div><small>Status</small><strong>${escapeHtml(q.status || "Draft")}</strong></div><div><small>Total</small><strong>${moneyCents(total)}</strong></div><div><small>Deposit</small><strong>${moneyCents(deposit)}</strong></div></div>
  <div class="document-lines">${(q.items || []).map((i) => `<div><span>${escapeHtml(i.description)} \xD7 ${Number(i.quantity) || 0}</span><strong>${moneyCents((Number(i.quantity) || 0) * (Number(i.unitPriceCents) || 0))}</strong></div>`).join("")}</div>
  <button class="btn primary full" data-edit-quote="${q.id}">Edit Quote</button>
  <button class="btn full preview-secondary" data-accept-quote="${q.id}">${q.status === "Accepted" ? "Accepted" : "Mark as Accepted"}</button>
  <button class="btn full preview-secondary" data-contract-from-quote="${q.id}">Create Contract</button><button class="btn full preview-secondary" data-invoice-from-quote="${q.id}">Create Invoice</button>
  <button class="text-button danger-text" data-delete-quote="${q.id}">Delete quote</button>`;
}
function quoteEditor(q = { id: "", number: makeRecordNumber("Q"), clientName: "", eventName: "", status: "Draft", depositPercent: 30, validUntil: "", notes: "", items: [{ description: "DJ Service Package", quantity: 1, unitPriceCents: 0 }] }) {
  return `<form id="quoteEditor" class="client-editor quote-editor"><div class="preview-eyebrow">${q.id ? "Edit Quote" : "New Quote"}</div><h2>${escapeHtml(q.number)}</h2>
  <div class="editor-grid"><label><span>Client name *</span><input name="clientName" required value="${escapeHtml(q.clientName)}"></label><label><span>Event name</span><input name="eventName" value="${escapeHtml(q.eventName)}" placeholder="Smith Wedding"></label></div>
  <div class="editor-grid"><label><span>Status</span><select name="status">${["Draft", "Sent", "Viewed", "Accepted", "Declined", "Expired"].map((s) => `<option ${q.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label><label><span>Deposit %</span><input name="depositPercent" type="number" min="0" max="100" value="${Number(q.depositPercent) || 0}"></label></div>
  <label><span>Valid until</span><input name="validUntil" type="date" value="${escapeHtml(q.validUntil || "")}"></label>
  <div class="quote-items" id="quoteItems">${(q.items || []).map((i, idx) => quoteItemRow(i, idx)).join("")}</div>
  <button type="button" class="btn compact" data-add-quote-item>\uFF0B Add line item</button>
  <label><span>Notes</span><textarea name="notes" rows="4">${escapeHtml(q.notes || "")}</textarea></label>
  <input type="hidden" name="id" value="${escapeHtml(q.id)}"><input type="hidden" name="number" value="${escapeHtml(q.number)}">
  <button class="btn primary full" type="submit">${q.id ? "Save Quote" : "Create Quote"}</button></form>`;
}
function quoteItemRow(item, idx) {
  return `<div class="quote-item-row"><input name="itemDescription_${idx}" value="${escapeHtml(item.description || "")}" placeholder="Service or add-on"><input name="itemQuantity_${idx}" type="number" min="0" step="0.5" value="${Number(item.quantity) || 1}"><input name="itemPrice_${idx}" type="number" min="0" step="0.01" value="${((Number(item.unitPriceCents) || 0) / 100).toFixed(2)}"><button type="button" data-remove-quote-item="${idx}">\xD7</button></div>`;
}
function bindQuoteEditor() {
  document.querySelectorAll("[data-edit-quote]").forEach((b) => b.addEventListener("click", () => {
    const q = crmQuotes.find((x) => x.id === b.dataset.editQuote);
    document.querySelector(".booking-preview-panel").innerHTML = quoteEditor(q);
    bindQuoteEditor();
  }));
  document.querySelectorAll("[data-delete-quote]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Delete this quote?")) return;
    crmQuotes = crmQuotes.filter((x) => x.id !== b.dataset.deleteQuote);
    saveLocalRows(QUOTES_KEY, crmQuotes);
    selectedQuoteId = null;
    renderQuotes();
    toast("Quote deleted");
  }));
  document.querySelectorAll("[data-accept-quote]").forEach((b) => b.addEventListener("click", () => {
    crmQuotes = crmQuotes.map((q) => q.id === b.dataset.acceptQuote ? { ...q, status: "Accepted", updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : q);
    saveLocalRows(QUOTES_KEY, crmQuotes);
    renderQuotes();
    toast("Quote accepted");
  }));
  document.querySelectorAll("[data-contract-from-quote]").forEach((b) => b.addEventListener("click", () => createContractFromQuote(b.dataset.contractFromQuote)));
  document.querySelectorAll("[data-invoice-from-quote]").forEach((b) => b.addEventListener("click", () => createInvoiceFromQuote(b.dataset.invoiceFromQuote)));
  const form = document.querySelector("#quoteEditor");
  if (!form) return;
  const add = form.querySelector("[data-add-quote-item]");
  if (add) add.addEventListener("click", () => {
    const q = formToQuote(form);
    q.items.push({ description: "", quantity: 1, unitPriceCents: 0 });
    document.querySelector(".booking-preview-panel").innerHTML = quoteEditor(q);
    bindQuoteEditor();
  });
  form.querySelectorAll("[data-remove-quote-item]").forEach((b) => b.addEventListener("click", () => {
    const q = formToQuote(form);
    q.items.splice(Number(b.dataset.removeQuoteItem), 1);
    document.querySelector(".booking-preview-panel").innerHTML = quoteEditor(q);
    bindQuoteEditor();
  }));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = formToQuote(form);
    q.id = q.id || crypto.randomUUID();
    q.createdAt = q.createdAt || (/* @__PURE__ */ new Date()).toISOString();
    q.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    crmQuotes = crmQuotes.some((x) => x.id === q.id) ? crmQuotes.map((x) => x.id === q.id ? q : x) : [q, ...crmQuotes];
    saveLocalRows(QUOTES_KEY, crmQuotes);
    selectedQuoteId = q.id;
    renderQuotes();
    toast("Quote saved");
  });
}
function formToQuote(form) {
  const fd = new FormData(form), items = [];
  form.querySelectorAll(".quote-item-row").forEach((row, idx) => items.push({ description: String(fd.get(`itemDescription_${idx}`) || ""), quantity: Number(fd.get(`itemQuantity_${idx}`) || 0), unitPriceCents: Math.round(Number(fd.get(`itemPrice_${idx}`) || 0) * 100) }));
  const id = String(fd.get("id") || "");
  const existing = crmQuotes.find((x) => x.id === id) || {};
  return { ...existing, id, number: String(fd.get("number") || makeRecordNumber("Q")), clientName: String(fd.get("clientName") || ""), eventName: String(fd.get("eventName") || ""), status: String(fd.get("status") || "Draft"), depositPercent: Number(fd.get("depositPercent") || 0), validUntil: String(fd.get("validUntil") || ""), notes: String(fd.get("notes") || ""), items };
}
function createContractFromQuote(id) {
  const q = crmQuotes.find((x) => x.id === id);
  if (!q) return;
  const row = { id: crypto.randomUUID(), number: makeRecordNumber("C"), quoteId: q.id, clientName: q.clientName, eventName: q.eventName, status: "Draft", title: "DJ Services Agreement", terms: `Services and pricing accepted from ${q.number}.`, createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  crmContracts.unshift(row);
  saveLocalRows(CONTRACTS_KEY, crmContracts);
  selectedContractId = row.id;
  appView = "contracts";
  shell();
  toast("Contract created from quote");
}
function invoiceTotal(i) {
  return Number(i.totalCents) || 0;
}
function invoicePaid(i) {
  return crmPayments.filter((p) => p.invoiceId === i.id && p.status === "Verified").reduce((s, p) => s + (Number(p.amountCents) || 0), 0);
}
function invoiceBalance(i) {
  return Math.max(0, invoiceTotal(i) - invoicePaid(i));
}
function invoiceStatus(i) {
  const balance = invoiceBalance(i), paid = invoicePaid(i);
  if (i.status === "Void") return "Void";
  if (balance <= 0 && invoiceTotal(i) > 0) return "Paid";
  if (paid > 0) return "Partial";
  if (i.dueDate && /* @__PURE__ */ new Date(i.dueDate + "T23:59:59") < /* @__PURE__ */ new Date()) return "Overdue";
  return i.status || "Draft";
}
function createInvoiceFromQuote(id) {
  const q = crmQuotes.find((x) => x.id === id);
  if (!q) return;
  const total = quoteTotal(q);
  const row = { id: crypto.randomUUID(), number: makeRecordNumber("INV"), quoteId: q.id, clientName: q.clientName, eventName: q.eventName, status: "Draft", totalCents: total, dueDate: "", notes: q.notes || "", createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  crmInvoices.unshift(row);
  saveLocalRows(INVOICES_KEY, crmInvoices);
  selectedInvoiceId = row.id;
  appView = "invoices";
  shell();
  toast("Invoice created from quote");
}
function renderInvoices() {
  const main = document.querySelector("#main");
  const filtered = crmInvoices.filter((i) => [i.number, i.clientName, i.eventName, invoiceStatus(i)].join(" ").toLowerCase().includes(invoiceSearch.toLowerCase()));
  const selected = filtered.find((i) => i.id === selectedInvoiceId) || filtered[0] || null;
  selectedInvoiceId = selected ? selected.id : null;
  const outstanding = filtered.reduce((s, i) => s + invoiceBalance(i), 0);
  main.innerHTML = `<section class="dash-hero compact-hero"><div><div class="eyebrow">Billing</div><h1>Invoices</h1><p>Track deposits, balances, due dates and payment progress.</p></div><div class="hero-actions"><button class="btn primary" data-action="new-invoice">\uFF0B New Invoice</button></div></section>
  <section class="mini-kpi-row"><div><small>Invoices</small><strong>${filtered.length}</strong></div><div><small>Outstanding</small><strong>${moneyCents(outstanding)}</strong></div><div><small>Verified payments</small><strong>${crmPayments.filter((p) => p.status === "Verified").length}</strong></div></section>
  <div class="crm-controls"><div class="search-box">\u2315<input id="invoiceSearch" value="${escapeHtml(invoiceSearch)}" placeholder="Search invoice, client, event or status"></div></div>
  <div class="crm-split">
    <section class="booking-list-panel"><div class="list-panel-head"><strong>Invoice Library</strong><small>Local billing records</small></div><div class="booking-card-list">${filtered.length ? filtered.map((i) => invoiceCard(i, selectedInvoiceId)).join("") : '<div class="empty-state"><strong>No invoices yet.</strong><br>Create one or convert a quote.</div>'}</div></section>
    <aside class="booking-preview-panel">${selected ? invoicePreview(selected) : invoiceEditor()}</aside>
  </div>`;
  const search = document.querySelector("#invoiceSearch");
  if (search) search.addEventListener("input", (e) => {
    invoiceSearch = e.target.value;
    renderInvoices();
    const n = document.querySelector("#invoiceSearch");
    if (n) {
      n.focus();
      n.setSelectionRange(n.value.length, n.value.length);
    }
  });
  document.querySelectorAll("[data-select-invoice]").forEach((b) => b.addEventListener("click", () => {
    selectedInvoiceId = b.dataset.selectInvoice;
    renderInvoices();
  }));
  document.querySelectorAll('[data-action="new-invoice"]').forEach((b) => b.addEventListener("click", () => {
    selectedInvoiceId = null;
    document.querySelector(".booking-preview-panel").innerHTML = invoiceEditor();
    bindInvoiceEditor();
  }));
  bindInvoiceEditor();
  bindDashboardActions();
}
function invoiceCard(i, selectedId) {
  return `<button class="booking-card ${i.id === selectedId ? "selected" : ""}" data-select-invoice="${i.id}"><div class="booking-card-top"><div><strong>${escapeHtml(i.clientName || "Unnamed Client")}</strong><small>${escapeHtml(i.number)}</small></div><span class="status-chip ${statusTone(invoiceStatus(i))}">${escapeHtml(invoiceStatus(i))}</span></div><div class="booking-card-meta"><span>${escapeHtml(i.eventName || "Event")}</span><span>${moneyCents(invoiceBalance(i))} due</span></div></button>`;
}
function invoicePreview(i) {
  const paid = invoicePaid(i), balance = invoiceBalance(i), status = invoiceStatus(i);
  return `<div class="preview-eyebrow">Invoice</div><h2>${escapeHtml(i.number)}</h2><p>${escapeHtml(i.clientName || "Unnamed Client")}</p>
  <div class="preview-grid"><div><small>Event</small><strong>${escapeHtml(i.eventName || "Not set")}</strong></div><div><small>Status</small><strong>${escapeHtml(status)}</strong></div><div><small>Total</small><strong>${moneyCents(invoiceTotal(i))}</strong></div><div><small>Balance</small><strong>${moneyCents(balance)}</strong></div><div><small>Paid</small><strong>${moneyCents(paid)}</strong></div><div><small>Due date</small><strong>${escapeHtml(i.dueDate || "Not set")}</strong></div></div>
  <div class="invoice-progress"><div><span>Payment progress</span><strong>${invoiceTotal(i) ? Math.min(100, Math.round(paid / invoiceTotal(i) * 100)) : 0}%</strong></div><div class="mini-progress"><span style="width:${invoiceTotal(i) ? Math.min(100, paid / invoiceTotal(i) * 100) : 0}%"></span></div></div>
  <button class="btn primary full" data-record-payment="${i.id}">Record Payment</button><button class="btn full preview-secondary" data-edit-invoice="${i.id}">Edit Invoice</button><button class="text-button danger-text" data-delete-invoice="${i.id}">Delete invoice</button>`;
}
function invoiceEditor(i = { id: "", number: makeRecordNumber("INV"), clientName: "", eventName: "", status: "Draft", totalCents: 0, dueDate: "", notes: "" }) {
  return `<form id="invoiceEditor" class="client-editor"><div class="preview-eyebrow">${i.id ? "Edit Invoice" : "New Invoice"}</div><h2>${escapeHtml(i.number)}</h2>
  <div class="editor-grid"><label><span>Client name *</span><input name="clientName" required value="${escapeHtml(i.clientName)}"></label><label><span>Event name</span><input name="eventName" value="${escapeHtml(i.eventName)}"></label></div>
  <div class="editor-grid"><label><span>Total amount</span><input name="total" type="number" min="0" step="0.01" value="${(invoiceTotal(i) / 100).toFixed(2)}"></label><label><span>Due date</span><input name="dueDate" type="date" value="${escapeHtml(i.dueDate || "")}"></label></div>
  <label><span>Status</span><select name="status">${["Draft", "Sent", "Void"].map((s) => `<option ${i.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
  <label><span>Notes</span><textarea name="notes" rows="6">${escapeHtml(i.notes || "")}</textarea></label><input type="hidden" name="id" value="${escapeHtml(i.id)}"><input type="hidden" name="number" value="${escapeHtml(i.number)}"><button class="btn primary full" type="submit">${i.id ? "Save Invoice" : "Create Invoice"}</button></form>`;
}
function bindInvoiceEditor() {
  document.querySelectorAll("[data-edit-invoice]").forEach((b) => b.addEventListener("click", () => {
    const i = crmInvoices.find((x) => x.id === b.dataset.editInvoice);
    document.querySelector(".booking-preview-panel").innerHTML = invoiceEditor(i);
    bindInvoiceEditor();
  }));
  document.querySelectorAll("[data-delete-invoice]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Delete this invoice?")) return;
    crmInvoices = crmInvoices.filter((x) => x.id !== b.dataset.deleteInvoice);
    crmPayments = crmPayments.filter((p) => p.invoiceId !== b.dataset.deleteInvoice);
    saveLocalRows(INVOICES_KEY, crmInvoices);
    saveLocalRows(PAYMENTS_KEY, crmPayments);
    selectedInvoiceId = null;
    renderInvoices();
    toast("Invoice deleted");
  }));
  document.querySelectorAll("[data-record-payment]").forEach((b) => b.addEventListener("click", () => openPaymentEditor(b.dataset.recordPayment)));
  const form = document.querySelector("#invoiceEditor");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form), id = String(fd.get("id") || ""), existing = crmInvoices.find((x) => x.id === id) || {};
    const row = { ...existing, id: id || crypto.randomUUID(), number: String(fd.get("number") || makeRecordNumber("INV")), clientName: String(fd.get("clientName") || ""), eventName: String(fd.get("eventName") || ""), status: String(fd.get("status") || "Draft"), totalCents: Math.round(Number(fd.get("total") || 0) * 100), dueDate: String(fd.get("dueDate") || ""), notes: String(fd.get("notes") || ""), createdAt: existing.createdAt || (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    crmInvoices = id ? crmInvoices.map((x) => x.id === id ? row : x) : [row, ...crmInvoices];
    saveLocalRows(INVOICES_KEY, crmInvoices);
    selectedInvoiceId = row.id;
    renderInvoices();
    toast("Invoice saved");
  });
}
function openPaymentEditor(invoiceId = "") {
  appView = "payments";
  selectedPaymentId = null;
  shell();
  const panel = document.querySelector(".booking-preview-panel");
  if (panel) {
    panel.innerHTML = paymentEditor({ invoiceId });
    bindPaymentEditor();
  }
}
function renderPayments() {
  const main = document.querySelector("#main");
  const filtered = crmPayments.filter((p) => {
    const inv = crmInvoices.find((i) => i.id === p.invoiceId) || {};
    return [p.reference, p.method, p.status, inv.clientName, inv.number].join(" ").toLowerCase().includes(paymentSearch.toLowerCase());
  });
  const selected = filtered.find((p) => p.id === selectedPaymentId) || filtered[0] || null;
  selectedPaymentId = selected ? selected.id : null;
  const verified = filtered.filter((p) => p.status === "Verified").reduce((s, p) => s + (Number(p.amountCents) || 0), 0);
  main.innerHTML = `<section class="dash-hero compact-hero"><div><div class="eyebrow">Payment Tracking</div><h1>Payments</h1><p>Record Venmo, card, cash and bank payments without storing sensitive card data.</p></div><div class="hero-actions"><button class="btn primary" data-action="new-payment">\uFF0B Record Payment</button></div></section>
  <section class="mini-kpi-row"><div><small>Payments</small><strong>${filtered.length}</strong></div><div><small>Verified total</small><strong>${moneyCents(verified)}</strong></div><div><small>Awaiting verification</small><strong>${filtered.filter((p) => p.status === "Submitted").length}</strong></div></section>
  <div class="crm-controls"><div class="search-box">\u2315<input id="paymentSearch" value="${escapeHtml(paymentSearch)}" placeholder="Search payment, invoice, client, method or status"></div></div>
  <div class="crm-split"><section class="booking-list-panel"><div class="list-panel-head"><strong>Payment Activity</strong><small>Manual verification workflow</small></div><div class="booking-card-list">${filtered.length ? filtered.map((p) => paymentCard(p, selectedPaymentId)).join("") : '<div class="empty-state"><strong>No payments yet.</strong><br>Record a Venmo, card or offline payment.</div>'}</div></section><aside class="booking-preview-panel">${selected ? paymentPreview(selected) : paymentEditor()}</aside></div>`;
  const search = document.querySelector("#paymentSearch");
  if (search) search.addEventListener("input", (e) => {
    paymentSearch = e.target.value;
    renderPayments();
    const n = document.querySelector("#paymentSearch");
    if (n) {
      n.focus();
      n.setSelectionRange(n.value.length, n.value.length);
    }
  });
  document.querySelectorAll("[data-select-payment]").forEach((b) => b.addEventListener("click", () => {
    selectedPaymentId = b.dataset.selectPayment;
    renderPayments();
  }));
  document.querySelectorAll('[data-action="new-payment"]').forEach((b) => b.addEventListener("click", () => {
    selectedPaymentId = null;
    document.querySelector(".booking-preview-panel").innerHTML = paymentEditor();
    bindPaymentEditor();
  }));
  bindPaymentEditor();
  bindDashboardActions();
}
function paymentCard(p, selectedId) {
  const i = crmInvoices.find((x) => x.id === p.invoiceId) || {};
  return `<button class="booking-card ${p.id === selectedId ? "selected" : ""}" data-select-payment="${p.id}"><div class="booking-card-top"><div><strong>${moneyCents(p.amountCents)}</strong><small>${escapeHtml(i.clientName || i.number || "Unassigned payment")}</small></div><span class="status-chip ${statusTone(p.status)}">${escapeHtml(p.status)}</span></div><div class="booking-card-meta"><span>${escapeHtml(p.method)}</span><span>${new Date(p.createdAt).toLocaleDateString()}</span></div></button>`;
}
function paymentPreview(p) {
  const i = crmInvoices.find((x) => x.id === p.invoiceId) || {};
  return `<div class="preview-eyebrow">Payment</div><h2>${moneyCents(p.amountCents)}</h2><p>${escapeHtml(i.clientName || i.number || "Unassigned")}</p><div class="preview-grid"><div><small>Method</small><strong>${escapeHtml(p.method)}</strong></div><div><small>Status</small><strong>${escapeHtml(p.status)}</strong></div><div><small>Invoice</small><strong>${escapeHtml(i.number || "Not assigned")}</strong></div><div><small>Reference</small><strong>${escapeHtml(p.reference || "Not entered")}</strong></div></div>${p.note ? `<div class="client-notes"><small>Note</small><p>${escapeHtml(p.note)}</p></div>` : ""}<button class="btn primary full" data-edit-payment="${p.id}">Edit Payment</button>${p.status !== "Verified" ? `<button class="btn full preview-secondary" data-verify-payment="${p.id}">Mark as Verified</button>` : ""}<button class="text-button danger-text" data-delete-payment="${p.id}">Delete payment</button>`;
}
function paymentEditor(p = { id: "", invoiceId: "", amountCents: 0, method: "Venmo", status: "Submitted", reference: "", note: "" }) {
  return `<form id="paymentEditor" class="client-editor"><div class="preview-eyebrow">${p.id ? "Edit Payment" : "Record Payment"}</div><h2>${p.id ? "Payment record" : "New payment"}</h2><label><span>Invoice</span><select name="invoiceId"><option value="">Unassigned</option>${crmInvoices.map((i) => `<option value="${i.id}" ${p.invoiceId === i.id ? "selected" : ""}>${escapeHtml(i.number)} \xB7 ${escapeHtml(i.clientName || "Client")} \xB7 ${moneyCents(invoiceBalance(i))} due</option>`).join("")}</select></label><div class="editor-grid"><label><span>Amount</span><input name="amount" type="number" min="0.01" step="0.01" required value="${((Number(p.amountCents) || 0) / 100).toFixed(2)}"></label><label><span>Method</span><select name="method">${["Venmo", "Card", "PayPal", "Cash", "Bank Transfer", "Check", "Other"].map((m) => `<option ${p.method === m ? "selected" : ""}>${m}</option>`).join("")}</select></label></div><div class="editor-grid"><label><span>Status</span><select name="status">${["Pending", "Submitted", "Verified", "Failed", "Refunded", "Cancelled"].map((s) => `<option ${p.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label><label><span>Reference</span><input name="reference" value="${escapeHtml(p.reference || "")}" placeholder="Venmo note or processor ID"></label></div><label><span>Internal note</span><textarea name="note" rows="5">${escapeHtml(p.note || "")}</textarea></label><input type="hidden" name="id" value="${escapeHtml(p.id)}"><button class="btn primary full" type="submit">${p.id ? "Save Payment" : "Record Payment"}</button></form>`;
}
function bindPaymentEditor() {
  document.querySelectorAll("[data-edit-payment]").forEach((b) => b.addEventListener("click", () => {
    const p = crmPayments.find((x) => x.id === b.dataset.editPayment);
    document.querySelector(".booking-preview-panel").innerHTML = paymentEditor(p);
    bindPaymentEditor();
  }));
  document.querySelectorAll("[data-verify-payment]").forEach((b) => b.addEventListener("click", () => {
    crmPayments = crmPayments.map((p) => p.id === b.dataset.verifyPayment ? { ...p, status: "Verified", verifiedAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : p);
    saveLocalRows(PAYMENTS_KEY, crmPayments);
    renderPayments();
    toast("Payment verified");
  }));
  document.querySelectorAll("[data-delete-payment]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Delete this payment?")) return;
    crmPayments = crmPayments.filter((x) => x.id !== b.dataset.deletePayment);
    saveLocalRows(PAYMENTS_KEY, crmPayments);
    selectedPaymentId = null;
    renderPayments();
    toast("Payment deleted");
  }));
  const form = document.querySelector("#paymentEditor");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form), id = String(fd.get("id") || ""), existing = crmPayments.find((x) => x.id === id) || {};
    const row = { ...existing, id: id || crypto.randomUUID(), invoiceId: String(fd.get("invoiceId") || ""), amountCents: Math.round(Number(fd.get("amount") || 0) * 100), method: String(fd.get("method") || "Other"), status: String(fd.get("status") || "Submitted"), reference: String(fd.get("reference") || ""), note: String(fd.get("note") || ""), createdAt: existing.createdAt || (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    crmPayments = id ? crmPayments.map((x) => x.id === id ? row : x) : [row, ...crmPayments];
    saveLocalRows(PAYMENTS_KEY, crmPayments);
    selectedPaymentId = row.id;
    renderPayments();
    toast("Payment saved");
  });
}
function renderContracts() {
  const main = document.querySelector("#main");
  const filtered = crmContracts.filter((c) => [c.number, c.clientName, c.eventName, c.status, c.title].join(" ").toLowerCase().includes(contractSearch.toLowerCase()));
  const selected = filtered.find((c) => c.id === selectedContractId) || filtered[0] || null;
  selectedContractId = selected ? selected.id : null;
  main.innerHTML = `<section class="dash-hero compact-hero"><div><div class="eyebrow">Agreements</div><h1>Contracts</h1><p>Create agreements, track signatures and keep every event legally organized.</p></div><div class="hero-actions"><button class="btn primary" data-action="new-contract">\uFF0B New Contract</button></div></section>
  <div class="crm-controls"><div class="search-box">\u2315<input id="contractSearch" value="${escapeHtml(contractSearch)}" placeholder="Search contract, client, event or status"></div><div class="calendar-count">${filtered.length} contract${filtered.length === 1 ? "" : "s"}</div></div>
  <div class="crm-split">
    <section class="booking-list-panel"><div class="list-panel-head"><strong>Contract Library</strong><small>Local draft records</small></div><div class="booking-card-list">${filtered.length ? filtered.map((c) => contractCard(c, selectedContractId)).join("") : '<div class="empty-state"><strong>No contracts yet.</strong><br>Create one or convert an accepted quote.</div>'}</div></section>
    <aside class="booking-preview-panel">${selected ? contractPreview(selected) : contractEditor()}</aside>
  </div>`;
  const search = document.querySelector("#contractSearch");
  if (search) search.addEventListener("input", (e) => {
    contractSearch = e.target.value;
    renderContracts();
    const n = document.querySelector("#contractSearch");
    if (n) {
      n.focus();
      n.setSelectionRange(n.value.length, n.value.length);
    }
  });
  document.querySelectorAll("[data-select-contract]").forEach((b) => b.addEventListener("click", () => {
    selectedContractId = b.dataset.selectContract;
    renderContracts();
  }));
  document.querySelectorAll('[data-action="new-contract"]').forEach((b) => b.addEventListener("click", () => {
    selectedContractId = null;
    document.querySelector(".booking-preview-panel").innerHTML = contractEditor();
    bindContractEditor();
  }));
  bindContractEditor();
  bindDashboardActions();
}
function contractCard(c, selectedId) {
  return `<button class="booking-card ${c.id === selectedId ? "selected" : ""}" data-select-contract="${c.id}"><div class="booking-card-top"><div><strong>${escapeHtml(c.clientName || "Unnamed Client")}</strong><small>${escapeHtml(c.number)}</small></div><span class="status-chip ${statusTone(c.status)}">${escapeHtml(c.status || "Draft")}</span></div><div class="booking-card-meta"><span>${escapeHtml(c.eventName || "Event")}</span><span>${escapeHtml(c.title || "Agreement")}</span></div></button>`;
}
function contractPreview(c) {
  return `<div class="preview-eyebrow">Contract</div><h2>${escapeHtml(c.number)}</h2><p>${escapeHtml(c.clientName || "Unnamed Client")}</p>
  <div class="preview-grid"><div><small>Event</small><strong>${escapeHtml(c.eventName || "Not set")}</strong></div><div><small>Status</small><strong>${escapeHtml(c.status || "Draft")}</strong></div><div><small>Title</small><strong>${escapeHtml(c.title || "Agreement")}</strong></div><div><small>Updated</small><strong>${new Date(c.updatedAt || c.createdAt).toLocaleDateString()}</strong></div></div>
  <div class="contract-terms-preview">${escapeHtml(c.terms || "No contract terms entered.")}</div>
  <button class="btn primary full" data-edit-contract="${c.id}">Edit Contract</button><button class="btn full preview-secondary" data-sign-contract="${c.id}">${c.status === "Signed" ? "Signed" : "Mark as Signed"}</button><button class="text-button danger-text" data-delete-contract="${c.id}">Delete contract</button>`;
}
function contractEditor(c = { id: "", number: makeRecordNumber("C"), clientName: "", eventName: "", status: "Draft", title: "DJ Services Agreement", terms: "" }) {
  return `<form id="contractEditor" class="client-editor"><div class="preview-eyebrow">${c.id ? "Edit Contract" : "New Contract"}</div><h2>${escapeHtml(c.number)}</h2>
  <label><span>Contract title</span><input name="title" value="${escapeHtml(c.title)}"></label>
  <div class="editor-grid"><label><span>Client name *</span><input name="clientName" required value="${escapeHtml(c.clientName)}"></label><label><span>Event name</span><input name="eventName" value="${escapeHtml(c.eventName)}"></label></div>
  <label><span>Status</span><select name="status">${["Draft", "Sent", "Viewed", "Signed", "Void"].map((s) => `<option ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
  <label><span>Agreement terms</span><textarea name="terms" rows="12" placeholder="Enter service terms, cancellation policy and payment requirements.">${escapeHtml(c.terms || "")}</textarea></label>
  <input type="hidden" name="id" value="${escapeHtml(c.id)}"><input type="hidden" name="number" value="${escapeHtml(c.number)}"><button class="btn primary full" type="submit">${c.id ? "Save Contract" : "Create Contract"}</button></form>`;
}
function bindContractEditor() {
  document.querySelectorAll("[data-edit-contract]").forEach((b) => b.addEventListener("click", () => {
    const c = crmContracts.find((x) => x.id === b.dataset.editContract);
    document.querySelector(".booking-preview-panel").innerHTML = contractEditor(c);
    bindContractEditor();
  }));
  document.querySelectorAll("[data-delete-contract]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Delete this contract?")) return;
    crmContracts = crmContracts.filter((x) => x.id !== b.dataset.deleteContract);
    saveLocalRows(CONTRACTS_KEY, crmContracts);
    selectedContractId = null;
    renderContracts();
    toast("Contract deleted");
  }));
  document.querySelectorAll("[data-sign-contract]").forEach((b) => b.addEventListener("click", () => {
    crmContracts = crmContracts.map((c) => c.id === b.dataset.signContract ? { ...c, status: "Signed", signedAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : c);
    saveLocalRows(CONTRACTS_KEY, crmContracts);
    renderContracts();
    toast("Contract marked signed");
  }));
  const form = document.querySelector("#contractEditor");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form), id = String(fd.get("id") || ""), existing = crmContracts.find((x) => x.id === id) || {};
    const row = { ...existing, id: id || crypto.randomUUID(), number: String(fd.get("number") || makeRecordNumber("C")), clientName: String(fd.get("clientName") || ""), eventName: String(fd.get("eventName") || ""), status: String(fd.get("status") || "Draft"), title: String(fd.get("title") || "DJ Services Agreement"), terms: String(fd.get("terms") || ""), createdAt: existing.createdAt || (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    crmContracts = id ? crmContracts.map((x) => x.id === id ? row : x) : [row, ...crmContracts];
    saveLocalRows(CONTRACTS_KEY, crmContracts);
    selectedContractId = row.id;
    renderContracts();
    toast("Contract saved");
  });
}
function currentEventDetails() {
  const d = activeConsultation(), q = state.forms.quote || {};
  const type = state.forms.wedding ? "Wedding" : state.forms.corporate ? "Corporate Event" : state.forms.private ? "Private Party" : "Event";
  return {
    bookingRef: state.bookingId,
    clientName: d.primaryClient || d.company || q.clientName || "Client",
    email: d.email || q.clientEmail || "",
    eventType: type,
    eventDate: d.eventDate || q.eventDate || "",
    venueName: d.venueName || q.venueName || "Venue not entered"
  };
}
function portalProgress() {
  const completed = state.completed || [];
  const required = ["wedding", "quote", "contract", "wedding-planner", "timeline"];
  const done = required.filter((id) => completed.includes(id) || Object.keys(state.forms[id] || {}).length > 0).length;
  return Math.round(done / required.length * 100);
}
function portalInvoice() {
  const e = currentEventDetails();
  return crmInvoices.find(
    (i) => i.eventName && e.eventType && i.eventName.toLowerCase().includes(e.eventType.toLowerCase()) || i.clientName && e.clientName && i.clientName.toLowerCase() === e.clientName.toLowerCase()
  ) || null;
}
function portalContract() {
  const e = currentEventDetails();
  return crmContracts.find((c) => c.clientName && e.clientName && c.clientName.toLowerCase() === e.clientName.toLowerCase()) || null;
}
function portalQuote() {
  const e = currentEventDetails();
  return crmQuotes.find((q) => q.clientName && e.clientName && q.clientName.toLowerCase() === e.clientName.toLowerCase()) || null;
}
function portalRecord() {
  if (!clientPortals[state.bookingId]) {
    clientPortals[state.bookingId] = {
      accessCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
      enabled: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    saveClientPortals(clientPortals);
  }
  return clientPortals[state.bookingId];
}
function portalDaysUntil(dateString) {
  if (!dateString) return null;
  const event = /* @__PURE__ */ new Date(dateString + "T12:00:00"), today = /* @__PURE__ */ new Date();
  event.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((event - today) / 864e5);
}
function workflowActionButtons(actor) {
  return allowedActions(state, actor).map((action) => `<button class="btn ${action.includes("decline") || action.includes("return") ? "" : "primary"}" data-workflow-action="${action}" data-workflow-actor="${actor}">${escapeHtml(ACTION_LABELS[action] || action)}</button>`).join("");
}
function workflowStatusCard(actor = "organization") {
  const current = getWorkflowState(state), progress = workflowProgress(state), message = actor === "client" ? current.client : current.ec;
  const history = (current.workflow.history || []).slice(-5).reverse();
  return `<section class="workflow-engine-card" data-workflow-state="${current.id}">
    <div class="workflow-engine-head"><div><small>GCOS Workflow \xB7 v${current.workflow.version}</small><h2>${escapeHtml(current.label)}</h2><p>${escapeHtml(message)}</p></div><span class="workflow-owner ${current.owner}">${current.owner === "organization" ? "Organization" : current.owner === "client" ? "Client" : current.owner === "both" ? "Both" : "Closed"}</span></div>
    <div class="workflow-engine-progress"><span style="width:${progress}%"></span></div>
    <div class="workflow-engine-meta"><div><small>Progress</small><strong>${progress}%</strong></div><div><small>Next required action</small><strong>${escapeHtml(current.nextAction)}</strong></div><div><small>Last updated</small><strong>${new Date(current.workflow.updatedAt || current.workflow.enteredAt).toLocaleString()}</strong></div></div>
    <div class="workflow-engine-actions">${workflowActionButtons(actor) || '<span class="workflow-waiting">No action required from you right now.</span>'}</div>
    <details class="workflow-history"><summary>Recent workflow history</summary>${history.map((item) => `<div><span>${escapeHtml(ACTION_LABELS[item.action] || item.action.replaceAll("_", " "))}</span><small>${escapeHtml(item.actor)} \xB7 ${new Date(item.at).toLocaleString()}</small></div>`).join("")}</details>
  </section>`;
}
function bindWorkflowActions() {
  document.querySelectorAll("[data-workflow-action]").forEach((button) => button.addEventListener("click", () => {
    const result = transitionWorkflow(state, button.dataset.workflowAction, button.dataset.workflowActor);
    if (!result.ok) return toast(result.error);
    save(false);
    toast(`Workflow updated: ${getWorkflowState(state).label}`);
    if (appView === "client-portal") renderClientPortal();
    else renderMain();
  }));
}
function renderClientPortal() {
  const main = document.querySelector("#main"), e = currentEventDetails(), portal2 = portalRecord(), progress = portalProgress();
  const invoice = portalInvoice(), contract = portalContract(), quote = portalQuote(), days = portalDaysUntil(e.eventDate);
  const paid = invoice ? invoicePaid(invoice) : 0, balance = invoice ? invoiceBalance(invoice) : 0;
  const planner = state.forms["wedding-planner"] || state.forms["corporate-planner"] || state.forms["private-planner"] || {};
  main.innerHTML = `<section class="portal-preview-banner"><div><strong>Client Portal Preview</strong><span>This is what ${escapeHtml(e.clientName)} will see.</span></div><div><span>Access code: <b>${portal2.accessCode}</b></span><button class="btn compact" data-copy-portal>Copy access details</button></div></section>
  <section class="client-portal-shell">
    <header class="client-portal-header">
      <div><div class="portal-business">${escapeHtml(businessSettings.businessName || "Your Entertainment Company")}</div><small>Powered by Galaxy Cue</small></div>
      <div class="portal-reference">${escapeHtml(e.bookingRef)}</div>
    </header>
    <section class="portal-hero">
      <div><div class="eyebrow">${escapeHtml(e.eventType)}</div><h1>Welcome, ${escapeHtml((e.clientName || "Client").split(" ")[0])}.</h1><p>Everything for your event is organized in one place.</p></div>
      <div class="portal-countdown">${days === null ? "<strong>\u2014</strong><span>Event date pending</span>" : days < 0 ? "<strong>Complete</strong><span>Thank you for celebrating with us</span>" : days === 0 ? "<strong>Today</strong><span>Your event is here</span>" : `<strong>${days}</strong><span>day${days === 1 ? "" : "s"} remaining</span>`}</div>
    </section>
    <section class="portal-event-card">
      <div><small>Event date</small><strong>${e.eventDate ? (/* @__PURE__ */ new Date(e.eventDate + "T12:00:00")).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Not entered"}</strong></div>
      <div><small>Venue</small><strong>${escapeHtml(e.venueName)}</strong></div>
      <div><small>Progress</small><strong>${progress}% complete</strong></div>
    </section>
    ${workflowStatusCard("client")}
    <section class="portal-main-grid">
      <div class="portal-column">
        <article class="portal-card">
          <div class="portal-card-head"><div><small>Your progress</small><h2>Event Journey</h2></div><strong>${progress}%</strong></div>
          <div class="mini-progress portal-progress"><span style="width:${progress}%"></span></div>
          <div class="portal-steps">
            ${portalStep("Consultation", Object.keys(activeConsultation()).length > 0, "Tell us about your event")}
            ${portalStep("Quote", !!quote && quote.status === "Accepted", quote ? quote.status : "Waiting")}
            ${portalStep("Contract", !!contract && contract.status === "Signed", contract ? contract.status : "Waiting")}
            ${portalStep("Music Planner", Object.keys(planner).length > 0, Object.keys(planner).length ? "In progress" : "Not started")}
            ${portalStep("Final Timeline", Object.keys(state.forms.timeline || {}).length > 0, Object.keys(state.forms.timeline || {}).length ? "In progress" : "Not started")}
          </div>
        </article>
        <article class="portal-card">
          <div class="portal-card-head"><div><small>Next step</small><h2>${nextPortalStep()}</h2></div><span class="portal-spark">\u2726</span></div>
          <p>${nextPortalMessage()}</p>
          <button class="btn primary" data-portal-action>${nextPortalButton()}</button>
        </article>
      </div>
      <div class="portal-column">
        <article class="portal-card">
          <div class="portal-card-head"><div><small>Payments</small><h2>Balance</h2></div><span class="status-chip ${balance <= 0 && invoice ? "green" : "gold"}">${invoice ? balance <= 0 ? "Paid" : "Due" : "Pending"}</span></div>
          ${invoice ? `<div class="portal-money"><div><small>Invoice total</small><strong>${moneyCents(invoiceTotal(invoice))}</strong></div><div><small>Paid</small><strong>${moneyCents(paid)}</strong></div><div><small>Balance</small><strong>${moneyCents(balance)}</strong></div></div>` : '<div class="portal-empty">Your invoice will appear here when it is ready.</div>'}
          ${invoice && balance > 0 ? portalPaymentButtons(invoice) : ""}
        </article>
        <article class="portal-card">
          <div class="portal-card-head"><div><small>Documents</small><h2>Your Files</h2></div></div>
          <div class="portal-documents">
            ${portalDocument("Quote", quote ? quote.number : "Not available", !!quote)}
            ${portalDocument("Contract", contract ? contract.number : "Not available", !!contract)}
            ${portalDocument("Invoice", invoice ? invoice.number : "Not available", !!invoice)}
            ${portalDocument("Event Timeline", Object.keys(state.forms.timeline || {}).length ? "Available" : "Not available", Object.keys(state.forms.timeline || {}).length > 0)}
          </div>
        </article>
        <article class="portal-card portal-contact">
          <small>Need help?</small><h2>Contact ${escapeHtml(businessSettings.businessName || "your event company")}</h2>
          <p>${escapeHtml(businessSettings.contactEmail || businessSettings.contactPhone || "Contact information will appear here.")}</p>
        </article>
      </div>
    </section>
  </section>`;
  const copy = document.querySelector("[data-copy-portal]");
  if (copy) copy.addEventListener("click", async () => {
    const text = `${businessSettings.businessName || "Event Portal"} \u2014 ${e.bookingRef} \u2014 Access code ${portal2.accessCode}`;
    try {
      await navigator.clipboard.writeText(text);
      toast("Portal access details copied");
    } catch (err) {
      toast("Could not copy access details");
    }
  });
  const action = document.querySelector("[data-portal-action]");
  if (action) action.addEventListener("click", () => {
    const target = nextPortalModule();
    if (target) {
      state.active = target;
      appView = "workspace";
      shell();
    }
  });
  bindWorkflowActions();
  bindPortalPaymentButtons();
}
function portalStep(label, done, status) {
  return `<div class="portal-step ${done ? "done" : ""}"><span>${done ? "\u2713" : "\u25CB"}</span><div><strong>${label}</strong><small>${escapeHtml(status)}</small></div></div>`;
}
function nextPortalModule() {
  if (!Object.keys(activeConsultation()).length) return state.forms.corporate ? "corporate" : state.forms.private ? "private" : "wedding";
  if (!portalQuote()) return "quote";
  if (!portalContract()) return "contract";
  if (!Object.keys(state.forms["wedding-planner"] || {}).length) return "wedding-planner";
  if (!Object.keys(state.forms.timeline || {}).length) return "timeline";
  return null;
}
function nextPortalStep() {
  const module = nextPortalModule();
  const labels = { wedding: "Complete your consultation", corporate: "Complete your consultation", private: "Complete your consultation", quote: "Review your quote", contract: "Review your contract", "wedding-planner": "Complete your music planner", timeline: "Review your timeline" };
  return labels[module] || "You\u2019re all caught up";
}
function nextPortalMessage() {
  const module = nextPortalModule();
  if (module === "wedding" || module === "corporate" || module === "private") return "Tell us the essential details so your entertainment company can prepare an accurate plan.";
  if (module === "quote") return "Your pricing proposal will be available here once it is prepared.";
  if (module === "contract") return "Review your agreement and confirm the details for your event.";
  if (module === "wedding-planner") return "Add your special songs, must-play requests and do-not-play selections.";
  if (module === "timeline") return "Check the event flow and confirm the timing of important moments.";
  return "Your event information is up to date.";
}
function nextPortalButton() {
  return nextPortalModule() ? "Continue" : "View Event Details";
}
function portalDocument(label, value, available) {
  return `<div class="${available ? "available" : ""}"><span>${available ? "\u25A4" : "\u25CB"}</span><div><strong>${label}</strong><small>${escapeHtml(value)}</small></div><em>${available ? "Ready" : "Pending"}</em></div>`;
}
function portalPaymentButtons(invoice) {
  return `<div class="portal-payments">
    ${businessSettings.venmoHandle ? `<button class="btn primary full" data-pay-venmo>Pay with Venmo</button>` : ""}
    ${businessSettings.cardPaymentUrl ? `<button class="btn full" data-pay-card>Pay with Card</button>` : ""}
    ${!businessSettings.venmoHandle && !businessSettings.cardPaymentUrl ? "<small>Payment options will appear after the business adds them in Settings.</small>" : ""}
    <button class="text-button" data-payment-submitted="${invoice.id}">I completed a payment</button>
  </div>`;
}
function bindPortalPaymentButtons() {
  const venmo = document.querySelector("[data-pay-venmo]");
  if (venmo) venmo.addEventListener("click", () => toast(`Pay ${businessSettings.venmoHandle} and include event reference ${state.bookingId}`));
  const card = document.querySelector("[data-pay-card]");
  if (card) card.addEventListener("click", () => window.open(businessSettings.cardPaymentUrl, "_blank", "noopener"));
  document.querySelectorAll("[data-payment-submitted]").forEach((b) => b.addEventListener("click", () => {
    const invoice = crmInvoices.find((i) => i.id === b.dataset.paymentSubmitted);
    if (!invoice) return;
    crmPayments.unshift({ id: crypto.randomUUID(), invoiceId: invoice.id, amountCents: invoiceBalance(invoice), method: businessSettings.venmoHandle ? "Venmo" : "Other", status: "Submitted", reference: state.bookingId, note: "Client reported payment through portal.", createdAt: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    saveLocalRows(PAYMENTS_KEY, crmPayments);
    renderClientPortal();
    toast("Payment submitted for verification");
  }));
}
function renderSettings() {
  const main = document.querySelector("#main");
  main.innerHTML = `<section class="dash-hero compact-hero"><div><div class="eyebrow">Business Setup</div><h1>Settings</h1><p>Your business name appears on client-facing portals and documents. Galaxy Cue branding stays consistent.</p></div></section>
  <form id="businessSettingsForm" class="settings-layout">
    <section class="settings-card"><div class="section-title"><div><small>Identity</small><h2>Business Information</h2></div></div>
      <label><span>Business / DJ / entertainment name *</span><input name="businessName" required value="${escapeHtml(businessSettings.businessName || "")}"></label>
      <div class="editor-grid"><label><span>Contact email</span><input type="email" name="contactEmail" value="${escapeHtml(businessSettings.contactEmail || "")}"></label><label><span>Phone</span><input name="contactPhone" value="${escapeHtml(businessSettings.contactPhone || "")}"></label></div>
      <label><span>Website</span><input name="website" value="${escapeHtml(businessSettings.website || "")}" placeholder="https://example.com"></label>
    </section>
    <section class="settings-card"><div class="section-title"><div><small>Client payments</small><h2>Payment Methods</h2></div></div>
      <label><span>Venmo Business handle</span><input name="venmoHandle" value="${escapeHtml(businessSettings.venmoHandle || "")}" placeholder="@yourbusiness"></label>
      <label><span>Hosted card-payment URL</span><input name="cardPaymentUrl" value="${escapeHtml(businessSettings.cardPaymentUrl || "")}" placeholder="https://secure-payment-page.example"></label>
      <label><span>Payment instructions</span><textarea name="paymentInstructions" rows="5">${escapeHtml(businessSettings.paymentInstructions || "")}</textarea></label>
      <p class="settings-note">Galaxy Cue never collects or stores card numbers. Credit-card payments should open a secure hosted checkout page.</p>
    </section>
    <section class="settings-card settings-preview"><div class="section-title"><div><small>Preview</small><h2>Client-facing identity</h2></div></div>
      <div class="business-preview"><span>${escapeHtml((businessSettings.businessName || "G").charAt(0).toUpperCase())}</span><div><strong>${escapeHtml(businessSettings.businessName || "Your Entertainment Company")}</strong><small>Powered by Galaxy Cue</small></div></div>
      <button class="btn full" type="button" data-preview-portal>Preview Client Portal</button>
    </section>
    <section class="settings-card build-card"><div class="section-title"><div><small>About this deployment</small><h2>Build Information</h2></div></div>
      <div class="build-grid"><div><span>Version</span><strong>${escapeHtml(galaxyCueRuntime.version)}</strong></div><div><span>Build</span><strong>${escapeHtml(galaxyCueRuntime.build)}</strong></div><div><span>Release</span><strong>${escapeHtml(galaxyCueRuntime.release)}</strong></div><div><span>Mode</span><strong>${currentUser ? "Cloud" : "Local"}</strong></div></div>
      <button class="btn full" type="button" data-action="force-refresh">Clear Cache & Reload Latest Build</button>
      <p class="settings-note">The version button in the top-right always shows the JavaScript build currently running in this browser.</p>
    </section>
    <button class="btn primary settings-save" type="submit">Save Business Settings</button>
  </form>`;
  const form = document.querySelector("#businessSettingsForm");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    businessSettings = { businessName: String(fd.get("businessName") || ""), contactEmail: String(fd.get("contactEmail") || ""), contactPhone: String(fd.get("contactPhone") || ""), website: String(fd.get("website") || ""), venmoHandle: String(fd.get("venmoHandle") || ""), cardPaymentUrl: String(fd.get("cardPaymentUrl") || ""), paymentInstructions: String(fd.get("paymentInstructions") || "") };
    saveBusinessSettings(businessSettings);
    if (currentUser && activeBusinessId()) {
      const { error } = await saveCloudBusinessSettings2(businessSettings, activeBusinessId());
      if (error) return toast(`Saved locally \u2014 cloud sync failed: ${error.message}`);
    }
    renderSettings();
    toast(currentUser ? "Business settings saved and synced" : "Business settings saved locally");
  });
  const preview = document.querySelector("[data-preview-portal]");
  if (preview) preview.addEventListener("click", () => {
    appView = "client-portal";
    portalPreviewMode = true;
    shell();
  });
}
function renderSectionView(title, description, icon) {
  const main = document.querySelector("#main");
  main.innerHTML = `<section class="dash-hero compact-hero">
    <div><div class="eyebrow">Galaxy Cue</div><h1>${title}</h1><p>${description}</p></div>
    <div class="hero-actions"><button class="btn primary" data-action="new-booking">\uFF0B New Event</button></div>
  </section>
  <section class="section-placeholder">
    <div class="placeholder-icon">${icon}</div>
    <h2>${title} is ready for the next backend sprint.</h2>
    <p>The navigation and design system are now in place. This module will connect to the permanent Galaxy Cue database without changing the interface again.</p>
    <button class="btn" data-view="dashboard">Return to Dashboard</button>
  </section>`;
  bindDashboardActions();
}
async function renderCalendarView() {
  const main = document.querySelector("#main");
  main.innerHTML = '<div class="dashboard-loading">Loading calendar\u2026</div>';
  await refreshCloudBookings();
  drawCalendarView();
}
function calendarIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function calendarStartOfWeek(date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() - (copy.getDay() + 6) % 7);
  return copy;
}
function calendarEventClass(event) {
  const type = String(event?.event_type || "").toLowerCase();
  if (type.includes("wedding")) return "wedding";
  if (type.includes("corporate")) return "corporate";
  if (type.includes("private") || type.includes("party")) return "private";
  if (type.includes("club")) return "club";
  return "general";
}
function calendarRawTimes(event) {
  const data = event?.event_data || event?.booking_data || {};
  const forms = data?.forms || {};
  const consultation = forms.wedding || forms.corporate || forms.private || {};
  const details = data?.eventDetails || data?.event_details || {};
  const start = event?.start_time || event?.event_time || event?.startTime || details.startTime || consultation.startTime || consultation.ceremonyTime || "";
  const finish = event?.end_time || event?.endTime || details.endTime || consultation.endTime || "";
  const setupStart = event?.setup_start_time || event?.setupStartTime || details.setupStartTime || consultation.setupStartTime || "";
  const breakdownEnd = event?.breakdown_end_time || event?.breakdownEndTime || details.breakdownEndTime || consultation.breakdownEndTime || "";
  return {
    start: String(start || "").slice(0, 5),
    end: String(finish || "").slice(0, 5),
    setupStart: String(setupStart || "").slice(0, 5),
    breakdownEnd: String(breakdownEnd || "").slice(0, 5)
  };
}
function calendarTimeMinutes(raw) {
  const match = String(raw || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Math.max(0, Math.min(1440, Number(match[1]) * 60 + Number(match[2])));
}
function calendarFormatTime(raw) {
  const mins = calendarTimeMinutes(raw);
  if (mins === null) return "";
  const hour = Math.floor(mins / 60), minute = String(mins % 60).padStart(2, "0");
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}
function calendarEventTime(event) {
  const { start, end } = calendarRawTimes(event);
  if (!start) return "";
  return end ? `${calendarFormatTime(start)} \u2013 ${calendarFormatTime(end)}` : calendarFormatTime(start);
}
function calendarEventButton(event, compact = false) {
  const ref = escapeHtml(event.booking_ref || "");
  const client = escapeHtml(event.client_name || "Unnamed Event");
  const type = escapeHtml(event.event_type || "Event");
  const venue = escapeHtml(event.venue_name || "Venue not set");
  const time = escapeHtml(calendarEventTime(event));
  return `<button class="calendar-event ${calendarEventClass(event)} ${compact ? "compact-event" : ""}" data-open-booking="${ref}" title="${client} \xB7 ${type}">
    <strong>${time ? `<i>${time}</i> ` : ""}${client}</strong><span>${type}${compact ? "" : ` \xB7 ${venue}`}</span>
  </button>`;
}
function calendarRangeEvents(start, end) {
  const startIso = calendarIso(start), endIso = calendarIso(end);
  return cloudBookings.filter((event) => event.event_date && event.event_date >= startIso && event.event_date <= endIso).sort((a, b) => `${a.event_date || ""} ${calendarRawTimes(a).start}`.localeCompare(`${b.event_date || ""} ${calendarRawTimes(b).start}`));
}
function drawCalendarMonth() {
  const year = calendarCursor.getFullYear(), month = calendarCursor.getMonth();
  const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
  const gridStart = calendarStartOfWeek(first);
  const monthEvents = calendarRangeEvents(first, last);
  const todayIso = calendarIso(/* @__PURE__ */ new Date());
  let cells = "";
  for (let index = 0; index < 42; index++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const iso = calendarIso(date);
    const inMonth = date.getMonth() === month;
    const dayEvents = cloudBookings.filter((event) => event.event_date === iso).sort((a, b) => calendarRawTimes(a).start.localeCompare(calendarRawTimes(b).start));
    cells += `<div class="calendar-cell ${inMonth ? "" : "outside"} ${iso === todayIso ? "today" : ""}" data-calendar-date="${iso}">
      <button class="calendar-day-head" data-day-view="${iso}" aria-label="Open ${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}"><span>${date.getDate()}</span>${iso === todayIso ? "<em>Today</em>" : ""}</button>
      <div class="calendar-events">${dayEvents.slice(0, 3).map((event) => calendarEventButton(event, true)).join("")}${dayEvents.length > 3 ? `<button class="more-events" data-day-view="${iso}">+${dayEvents.length - 3} more</button>` : ""}</div>
    </div>`;
  }
  const upcoming = monthEvents.slice(0, 8);
  return `<div class="calendar-layout"><section class="calendar-card"><div class="calendar-weekdays">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => `<span>${day}</span>`).join("")}</div><div class="calendar-grid">${cells}</div></section>
  <aside class="calendar-agenda"><div class="section-title"><div><small>This month</small><h2>Agenda</h2></div></div><div class="agenda-list">${upcoming.length ? upcoming.map((event) => {
    const date = eventDateValue(event);
    return `<button class="agenda-item" data-open-booking="${escapeHtml(event.booking_ref || "")}"><span class="agenda-date"><strong>${date?.getDate() || "\u2014"}</strong><span>${date?.toLocaleDateString("en-US", { month: "short" }) || ""}</span></span><span><strong>${escapeHtml(event.client_name || "Unnamed Event")}</strong><small>${escapeHtml(event.event_type || "Event")} \xB7 ${escapeHtml(event.venue_name || "Venue not set")}</small></span><span>\u2192</span></button>`;
  }).join("") : '<div class="empty-state compact">No events this month.</div>'}</div></aside></div>`;
}
var CALENDAR_START_HOUR = 0;
var CALENDAR_END_HOUR = 30;
var CALENDAR_HOUR_HEIGHT = 64;
function calendarTimelineHours() {
  return Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 }, (_, i) => CALENDAR_START_HOUR + i);
}
function calendarTimelineLabel(hour) {
  const normalized = hour % 24;
  const label = `${normalized % 12 || 12} ${normalized >= 12 ? "PM" : "AM"}`;
  return hour >= 24 ? `${label} (+1)` : label;
}
function calendarNormalizeOvernight(start, end) {
  if (start === null || end === null) return { start, end };
  return { start, end: end <= start ? end + 1440 : end };
}
function calendarTimedLayout(events) {
  const dayStart = CALENDAR_START_HOUR * 60, dayEnd = CALENDAR_END_HOUR * 60;
  const jobs = [];
  events.forEach((event, index) => {
    const times = calendarRawTimes(event);
    const eventStart = calendarTimeMinutes(times.start);
    const eventEnd = calendarTimeMinutes(times.end);
    const setupStart = calendarTimeMinutes(times.setupStart);
    const breakdownEnd = calendarTimeMinutes(times.breakdownEnd);
    if (eventStart === null) return;
    const normalizedEvent = calendarNormalizeOvernight(eventStart, eventEnd === null ? eventStart + 120 : eventEnd);
    let normalizedSetup = setupStart === null ? normalizedEvent.start : setupStart;
    while (normalizedSetup > normalizedEvent.start) normalizedSetup -= 1440;
    let normalizedBreakdown = breakdownEnd === null ? normalizedEvent.end : breakdownEnd;
    while (normalizedBreakdown <= normalizedEvent.end) normalizedBreakdown += 1440;
    const jobStart = Math.min(normalizedSetup, normalizedEvent.start);
    const jobEnd = Math.max(normalizedBreakdown, normalizedEvent.end);
    jobs.push({
      event,
      index,
      start: jobStart,
      end: jobEnd,
      setupStart: jobStart,
      setupEnd: normalizedEvent.start,
      eventStart: normalizedEvent.start,
      eventEnd: normalizedEvent.end,
      breakdownStart: normalizedEvent.end,
      breakdownEnd: jobEnd
    });
  });
  const clipped = jobs.map((item) => ({
    ...item,
    start: Math.max(dayStart, Math.min(dayEnd - 15, item.start)),
    end: Math.max(item.start + 15, Math.min(dayEnd, item.end))
  })).filter((item) => item.end > dayStart && item.start < dayEnd);
  const sorted = [...clipped].sort((a, b) => a.start - b.start || a.end - b.end);
  const laneEnds = [];
  sorted.forEach((item) => {
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else laneEnds[lane] = item.end;
    item.lane = lane;
  });
  const laneCount = Math.max(1, laneEnds.length);
  sorted.forEach((item) => item.laneCount = laneCount);
  return sorted;
}
function calendarTimelineEvent(item) {
  const { event, start, end } = item;
  const dayStart = CALENDAR_START_HOUR * 60;
  const top = (start - dayStart) / 60 * CALENDAR_HOUR_HEIGHT;
  const height = Math.max(20, (end - start) / 60 * CALENDAR_HOUR_HEIGHT);
  const laneWidth = 100 / (item.laneCount || 1);
  const laneLeft = (item.lane || 0) * laneWidth;
  const total = Math.max(15, end - start);
  const segment = (from, to, phase, label) => {
    const clippedStart = Math.max(start, from);
    const clippedEnd = Math.min(end, to);
    if (clippedEnd <= clippedStart) return "";
    const segmentTop = (clippedStart - start) / total * 100;
    const segmentHeight = (clippedEnd - clippedStart) / total * 100;
    const range = `${calendarFormatExtendedMinutes(from)} \u2013 ${calendarFormatExtendedMinutes(to)}`;
    return `<span class="timeline-job-phase ${phase}" style="top:${segmentTop}%;height:${segmentHeight}%"><strong>${label}</strong><small>${escapeHtml(range)}</small></span>`;
  };
  const workingRange = `${calendarFormatExtendedMinutes(item.setupStart)} \u2013 ${calendarFormatExtendedMinutes(item.breakdownEnd)}`;
  const clientName = event.client_name || "Unnamed Client";
  const eventType = event.event_type || "Event";
  const location2 = event.venue_name || event.location || event.venue || "Location not set";
  return `<button class="timeline-job ${calendarEventClass(event)}" style="top:${top}px;height:${height}px;left:calc(${laneLeft}% + 4px);right:auto;width:calc(${laneWidth}% - 8px)" data-open-booking="${escapeHtml(event.booking_ref || "")}" title="${escapeHtml(`${workingRange} \xB7 ${clientName} \xB7 ${eventType} \xB7 ${location2}`)}">
    ${segment(item.setupStart, item.setupEnd, "setup", "Setup")}
    ${segment(item.eventStart, item.eventEnd, "event", "Event")}
    ${segment(item.breakdownStart, item.breakdownEnd, "breakdown", "Breakdown")}
    <span class="timeline-job-label">
      <strong class="timeline-job-range">${escapeHtml(workingRange)}</strong>
      <span class="timeline-job-client">${escapeHtml(clientName)}</span>
      <small class="timeline-job-meta">${escapeHtml(eventType)} \xB7 ${escapeHtml(location2)}</small>
    </span>
  </button>`;
}
function calendarFormatExtendedMinutes(minutes) {
  const nextDay = minutes >= 1440;
  const normalized = (minutes % 1440 + 1440) % 1440;
  const hour = Math.floor(normalized / 60), minute = String(normalized % 60).padStart(2, "0");
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}${nextDay ? " (+1)" : ""}`;
}
function drawCalendarWeek() {
  const start = calendarStartOfWeek(calendarCursor);
  const todayIso = calendarIso(/* @__PURE__ */ new Date());
  const hours = calendarTimelineHours();
  const headers = [];
  const dayColumns = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = calendarIso(date);
    const events = cloudBookings.filter((event) => event.event_date === iso).sort((a, b) => calendarRawTimes(a).start.localeCompare(calendarRawTimes(b).start));
    const timed = calendarTimedLayout(events);
    const untimed = events.filter((event) => calendarTimeMinutes(calendarRawTimes(event).start) === null);
    headers.push(`<button class="timeline-day-heading ${iso === todayIso ? "today" : ""}" data-day-view="${iso}"><small>${date.toLocaleDateString("en-US", { weekday: "short" })}</small><strong>${date.getDate()}</strong></button>`);
    dayColumns.push(`<div class="timeline-day-column ${iso === todayIso ? "today" : ""}">${hours.slice(0, -1).map(() => '<div class="timeline-hour-line"></div>').join("")}${timed.map(calendarTimelineEvent).join("")}${untimed.length ? `<div class="timeline-untimed">${untimed.map((event) => calendarEventButton(event, true)).join("")}</div>` : ""}</div>`);
  }
  return `<section class="calendar-card timeline-calendar"><div class="timeline-scroll"><div class="timeline-header"><span class="timeline-header-corner"></span>${headers.join("")}</div><div class="timeline-grid"><div class="timeline-labels">${hours.map((hour) => `<span>${calendarTimelineLabel(hour)}</span>`).join("")}</div>${dayColumns.join("")}</div></div></section>`;
}
function drawCalendarDay() {
  const iso = calendarIso(calendarSelectedDate || calendarCursor);
  const events = cloudBookings.filter((event) => event.event_date === iso).sort((a, b) => calendarRawTimes(a).start.localeCompare(calendarRawTimes(b).start));
  const timed = calendarTimedLayout(events);
  const untimed = events.filter((event) => calendarTimeMinutes(calendarRawTimes(event).start) === null);
  const hours = calendarTimelineHours();
  return `<section class="calendar-day-view timeline-day-layout"><div class="day-date-card"><small>${calendarSelectedDate.toLocaleDateString("en-US", { weekday: "long" })}</small><strong>${calendarSelectedDate.getDate()}</strong><span>${calendarSelectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span></div><div class="calendar-card timeline-calendar day-timeline"><div class="timeline-scroll"><div class="timeline-grid single-day"><div class="timeline-labels">${hours.map((hour) => `<span>${calendarTimelineLabel(hour)}</span>`).join("")}</div><div class="timeline-day-column">${hours.slice(0, -1).map(() => '<div class="timeline-hour-line"></div>').join("")}${timed.map(calendarTimelineEvent).join("")}${untimed.length ? `<div class="timeline-untimed">${untimed.map((event) => calendarEventButton(event, true)).join("")}</div>` : ""}</div></div></div></div></section>`;
}
function calendarHeaderLabel() {
  if (calendarViewMode === "month") return calendarCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  if (calendarViewMode === "week") {
    const start = calendarStartOfWeek(calendarCursor), end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} \u2013 ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }
  return calendarSelectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function drawCalendarView() {
  const main = document.querySelector("#main");
  if (!main) return;
  const displayed = calendarViewMode === "month" ? cloudBookings.filter((event) => event.event_date?.startsWith(`${calendarCursor.getFullYear()}-${String(calendarCursor.getMonth() + 1).padStart(2, "0")}`)) : calendarViewMode === "week" ? calendarRangeEvents(calendarStartOfWeek(calendarCursor), new Date(calendarStartOfWeek(calendarCursor).getTime() + 6 * 864e5)) : cloudBookings.filter((event) => event.event_date === calendarIso(calendarSelectedDate));
  const body = calendarViewMode === "month" ? drawCalendarMonth() : calendarViewMode === "week" ? drawCalendarWeek() : drawCalendarDay();
  main.innerHTML = `<section class="dash-hero compact-hero"><div><div class="eyebrow">Schedule</div><h1>Calendar</h1><p>Review every event by month, week, or day and open its workspace instantly.</p></div><div class="hero-actions"><button class="btn primary" data-action="new-booking">\uFF0B New Event</button></div></section>
  <div class="calendar-toolbar"><div class="calendar-nav-buttons"><button class="btn compact" data-calendar-step="-1">\u2190</button><button class="btn compact" data-calendar-today>Today</button><button class="btn compact" data-calendar-step="1">\u2192</button></div><h2>${escapeHtml(calendarHeaderLabel())}</h2><div class="calendar-toolbar-right"><div class="calendar-view-switch" role="group" aria-label="Calendar view">${["month", "week", "day"].map((mode) => `<button class="${calendarViewMode === mode ? "active" : ""}" data-calendar-mode="${mode}">${mode[0].toUpperCase() + mode.slice(1)}</button>`).join("")}</div><div class="calendar-count">${displayed.length} event${displayed.length === 1 ? "" : "s"}</div></div></div>${body}`;
  document.querySelectorAll("[data-calendar-step]").forEach((button) => button.addEventListener("click", () => {
    const direction = Number(button.dataset.calendarStep);
    if (calendarViewMode === "month") calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + direction, 1);
    else if (calendarViewMode === "week") {
      calendarCursor = new Date(calendarCursor);
      calendarCursor.setDate(calendarCursor.getDate() + direction * 7);
      calendarSelectedDate = new Date(calendarCursor);
    } else {
      calendarSelectedDate = new Date(calendarSelectedDate);
      calendarSelectedDate.setDate(calendarSelectedDate.getDate() + direction);
      calendarCursor = new Date(calendarSelectedDate);
    }
    drawCalendarView();
  }));
  document.querySelector("[data-calendar-today]")?.addEventListener("click", () => {
    calendarCursor = /* @__PURE__ */ new Date();
    calendarSelectedDate = /* @__PURE__ */ new Date();
    drawCalendarView();
  });
  document.querySelectorAll("[data-calendar-mode]").forEach((button) => button.addEventListener("click", () => {
    calendarViewMode = button.dataset.calendarMode;
    if (calendarViewMode === "day") calendarSelectedDate = new Date(calendarCursor);
    drawCalendarView();
  }));
  document.querySelectorAll("[data-day-view]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const [year, month, day] = button.dataset.dayView.split("-").map(Number);
    calendarSelectedDate = new Date(year, month - 1, day);
    calendarCursor = new Date(calendarSelectedDate);
    calendarViewMode = "day";
    drawCalendarView();
  }));
  document.querySelectorAll("[data-open-booking]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    openCloudBooking(button.dataset.openBooking);
  }));
  bindDashboardActions();
}
async function renderBookingManager() {
  const main = document.querySelector("#main");
  main.innerHTML = '<div class="dashboard-loading">Loading business events\u2026</div>';
  await refreshEventsFromCloud();
  drawBookingManager();
}
function drawBookingManager() {
  const main = document.querySelector("#main");
  const query = bookingSearch.trim().toLowerCase();
  let filtered = cloudBookings.filter((event) => {
    const eventType = String(event.event_type || "").toLowerCase();
    const status = String(event.status || "").toLowerCase();
    const matchFilter = bookingFilter === "all" || eventType.includes(bookingFilter) || status.includes(bookingFilter);
    const haystack = [
      event.client_name,
      event.client_email,
      event.booking_ref,
      event.venue_name,
      event.event_type,
      event.status,
      event.event_date
    ].join(" ").toLowerCase();
    return matchFilter && haystack.includes(query);
  });
  filtered.sort((a, b) => {
    if (bookingSort === "date-desc") return String(b.event_date || "").localeCompare(String(a.event_date || ""));
    if (bookingSort === "name") return String(a.client_name || "").localeCompare(String(b.client_name || ""));
    if (bookingSort === "updated") return String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
    return String(a.event_date || "9999").localeCompare(String(b.event_date || "9999"));
  });
  const selected = filtered.find((event) => event.booking_ref === selectedBookingRef) || filtered[0] || null;
  selectedBookingRef = selected ? selected.booking_ref : null;
  main.innerHTML = `<section class="dash-hero compact-hero"><div><div class="eyebrow">Event Management</div><h1>Events</h1><p>Search by client, venue, date, status or event reference and reopen any consultation.</p></div><div class="hero-actions"><span class="sync-chip">${currentUser ? eventCloudStatus : "Local only"}</span><button class="btn primary" data-action="new-booking">\uFF0B New Event</button></div></section>
  <div class="crm-controls event-controls-v42">
    <div class="search-box">\u2315<input id="bookingSearch" value="${escapeHtml(bookingSearch)}" placeholder="Search client, venue, date or reference"></div>
    <select id="bookingSort" class="crm-sort">
      <option value="date-asc" ${bookingSort === "date-asc" ? "selected" : ""}>Event date \u2191</option>
      <option value="date-desc" ${bookingSort === "date-desc" ? "selected" : ""}>Event date \u2193</option>
      <option value="updated" ${bookingSort === "updated" ? "selected" : ""}>Recently updated</option>
      <option value="name" ${bookingSort === "name" ? "selected" : ""}>Client name</option>
    </select>
  </div>
  <div class="filter-row crm-filter-row">${[
    ["all", "All"],
    ["wedding", "Weddings"],
    ["corporate", "Corporate"],
    ["private", "Private"],
    ["draft", "Draft"],
    ["confirmed", "Confirmed"],
    ["accepted", "Accepted"],
    ["complete", "Complete"],
    ["cancel", "Cancelled"]
  ].map(([id, label]) => `<button class="${bookingFilter === id ? "active" : ""}" data-filter="${id}">${label}</button>`).join("")}</div>
  <div class="crm-split">
    <div class="booking-list-panel">
      <div class="list-panel-head"><strong>${filtered.length} Event${filtered.length === 1 ? "" : "s"}</strong><small>${query || bookingFilter !== "all" ? "Filtered results" : currentUser ? "All cloud events" : "All local events"}</small></div>
      <div class="booking-card-list">${filtered.length ? filtered.map((event) => bookingCard(event, selectedBookingRef)).join("") : '<div class="empty-state table-empty"><strong>No matching events.</strong><br>Try another search or status filter.</div>'}</div>
    </div>
    <aside class="booking-preview-panel">${selected ? bookingPreview(selected) : `<div class="empty-state">Select an event to see its details.</div>`}</aside>
  </div>`;
  const search = document.querySelector("#bookingSearch");
  if (search) search.addEventListener("input", (event) => {
    bookingSearch = event.target.value;
    drawBookingManager();
    requestAnimationFrame(() => {
      const input = document.querySelector("#bookingSearch");
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
  });
  document.querySelector("#bookingSort")?.addEventListener("change", (event) => {
    bookingSort = event.target.value;
    drawBookingManager();
  });
  document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    bookingFilter = button.dataset.filter;
    drawBookingManager();
  }));
  document.querySelectorAll("[data-select-booking]").forEach((button) => button.addEventListener("click", () => {
    selectedBookingRef = button.dataset.selectBooking;
    drawBookingManager();
  }));
  bindDashboardActions();
}
function bookingCard(b, selectedRef) {
  return `<button class="booking-card ${b.booking_ref === selectedRef ? "selected" : ""}" data-select-booking="${b.booking_ref}">
    <div class="booking-card-top"><div><strong>${escapeHtml(b.client_name || "Unnamed Client")}</strong><small>${escapeHtml(b.booking_ref)}</small></div><span class="status-chip ${statusTone(b.status)}">${escapeHtml(b.status || "Draft")}</span></div>
    <div class="booking-card-meta"><span>${escapeHtml(eventTypeLabel(b.event_type))}</span><span>${formatEventDate(b.event_date)}</span></div>
    <div class="booking-card-venue">${escapeHtml(b.venue_name || "Venue not set")}</div>
  </button>`;
}
function eventClientSubmission(event) {
  return event?.event_data?.documents?.eventForm || event?.booking_data?.documents?.eventForm || null;
}
function eventBookingRequestCopy(event) {
  const data = event?.event_data || event?.booking_data || {};
  return data?.documents?.bookingRequest || data?.forms?.[data.active || "wedding"] || {};
}
function businessDocumentRows(payload = {}) {
  const labels = { primaryClient: "Primary contact", company: "Company", email: "Email", phone: "Phone", eventDate: "Event date", eventType: "Event type", guestCount: "Guest count", venueName: "Venue name", venueAddress: "Venue address", startTime: "Start time", endTime: "End time", requestedServices: "Requested services", additionalNotes: "Notes" };
  return Object.entries(payload).filter(([, value]) => value !== "" && value !== null && value !== void 0).map(([key, value]) => `<div class="lead-review-grid"><div><small>${escapeHtml(labels[key] || key.replace(/([A-Z])/g, " $1"))}</small><strong>${escapeHtml(Array.isArray(value) ? value.join(", ") : String(value))}</strong></div></div>`).join("") || "<p>No saved information is available.</p>";
}
function openBusinessEventDocument(ref, type = "event") {
  const event = cloudBookings.find((row) => row.booking_ref === ref) || loadLocalEvents().find((row) => row.booking_ref === ref);
  if (!event) return toast("Event could not be found");
  const submission = eventClientSubmission(event);
  const title = type === "booking" ? "Booking Request" : "Full Event Workbook";
  const payload = type === "booking" ? eventBookingRequestCopy(event) : submission?.payload;
  if (type === "event" && !submission) return toast("The client has not submitted the Event Booking Form yet.");
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `<div class="modal-panel lead-review-panel"><button class="modal-close" data-close-event-document aria-label="Close">\xD7</button><div class="eyebrow">Event Document</div><h2>${escapeHtml(title)}</h2><p>${type === "event" && submission?.submittedAt ? `Submitted ${new Date(submission.submittedAt).toLocaleString()}` : "Read-only event copy"}</p><div class="business-document-copy">${businessDocumentRows(payload || {})}</div><div class="lead-actions"><button class="btn" data-print-event-document>Print / Save PDF</button><button class="btn primary" data-close-event-document>Done</button></div></div>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelectorAll("[data-close-event-document]").forEach((b) => b.onclick = close);
  modal.querySelector("[data-print-event-document]").onclick = () => window.print();
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
}
function bookingPreview(event) {
  const linkedClient = (event.client_id ? crmClients.find((client) => client.id === event.client_id) : null) || findMatchingClient({ email: event.client_email, name: event.client_name });
  return `<div class="preview-eyebrow">Event Preview</div>
    <h2>${escapeHtml(event.client_name || "Unnamed Client")}</h2>
    <p>${escapeHtml(eventTypeLabel(event.event_type))}</p>
    <div class="preview-date">${formatEventDate(event.event_date)}</div>
    <div class="preview-grid">
      <div><small>Venue</small><strong>${escapeHtml(event.venue_name || "Not set")}</strong></div>
      <div><small>Status</small><strong>${escapeHtml(event.status || "Draft")}</strong></div>
      <div><small>Email</small><strong>${escapeHtml(event.client_email || "Not set")}</strong></div>
      <div><small>CRM client</small><strong>${linkedClient ? "Linked" : "Not linked"}</strong></div>
      <div><small>Updated</small><strong>${event.updated_at ? new Date(event.updated_at).toLocaleDateString() : "\u2014"}</strong></div>
      <div><small>Reference</small><strong>${escapeHtml(event.booking_ref)}</strong></div>
    </div>
    <div class="preview-progress"><div><span>Event readiness</span><strong>${bookingReadiness(event)}%</strong></div><div class="mini-progress"><span style="width:${bookingReadiness(event)}%"></span></div></div>
    <button class="btn primary full" data-create-event-quote="${event.booking_ref}">Create / Send Quote</button>
    <button class="btn full preview-secondary" data-view-event-document="${event.booking_ref}" ${eventClientSubmission(event) ? "" : "disabled"}>${eventClientSubmission(event) ? "Review Full Event Workbook" : "Event Workbook Pending"}</button>
    <button class="btn full preview-secondary" data-view-booking-document="${event.booking_ref}">View Booking Request Copy</button>
    <button class="btn full preview-secondary" data-open-booking="${event.booking_ref}">Open Event Workspace</button><button class="btn full preview-secondary" data-edit-booking="${event.booking_ref}">Edit Schedule / Client</button>
    ${linkedClient ? `<button class="btn full preview-secondary" data-open-client="${linkedClient.id}">Open Client Profile</button>` : ""}
    <button class="btn full preview-secondary" data-action="copy-reference" data-reference="${event.booking_ref}">Copy Event Reference</button>
    <button class="btn full danger-button" data-delete-booking="${event.booking_ref}">Delete Event</button>`;
}
function bookingReadiness(b) {
  const data = b.booking_data || {}, forms = data.forms || {};
  let score = 0, total = 6;
  if (b.client_name) score++;
  if (b.event_date) score++;
  if (b.venue_name) score++;
  if (forms.quote && Object.keys(forms.quote).length) score++;
  if (forms.contract && Object.keys(forms.contract).length) score++;
  if ((data.completed || []).length >= 3) score++;
  return Math.round(score / total * 100);
}
async function openCloudBooking(ref) {
  if (!currentUser) {
    const localEvent = loadLocalEvents().find((event) => event.booking_ref === ref);
    if (!localEvent?.booking_data) return toast("Local event data is empty");
    state = localEvent.booking_data;
    localStorage.setItem(KEY, JSON.stringify(state));
    selectedBookingRef = ref;
    appView = "workspace";
    shell();
    toast(`Opened local event ${ref}`);
    return;
  }
  const { data, error } = await loadCloudEvent2(ref, activeBusinessId());
  if (error) return toast(error.message);
  if (!data || !data.booking_data) return toast("Event data is empty");
  state = data.booking_data;
  localStorage.setItem(KEY, JSON.stringify(state));
  appView = "workspace";
  shell();
  toast(`Opened event ${ref}`);
}
async function deleteEvent(ref) {
  const event = cloudBookings.find((row) => row.booking_ref === ref) || loadLocalEvents().find((row) => row.booking_ref === ref);
  const label = event?.client_name ? ` for ${event.client_name}` : "";
  if (!confirm(`Delete this event${label}? This cannot be undone.`)) return;
  if (currentUser) {
    const { error } = await removeCloudEvent2(ref, activeBusinessId());
    if (error) return toast(`Could not delete event: ${error.message}`);
    await refreshEventsFromCloud();
  } else {
    saveLocalEvents(loadLocalEvents().filter((row) => row.booking_ref !== ref));
    cloudBookings = loadLocalEvents();
  }
  if (state?.bookingId === ref) {
    state = { active: "wedding", bookingId: makeId(), forms: {}, completed: [], updated: (/* @__PURE__ */ new Date()).toISOString() };
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  selectedBookingRef = null;
  drawBookingManager();
  toast("Event deleted");
}
function newBooking() {
  openEventModal();
}
function createQuoteForEvent(ref) {
  const event = cloudBookings.find((row) => row.booking_ref === ref) || loadLocalEvents().find((row) => row.booking_ref === ref);
  if (!event) return toast("Event could not be found");
  const existing = crmQuotes.find((q) => q.eventRef === ref);
  const quote = existing || { id: "", number: makeRecordNumber("Q"), eventRef: ref, clientName: event.client_name || "", eventName: event.event_type || "Event", status: "Draft", depositPercent: 30, validUntil: "", notes: "", items: [{ description: "DJ Service Package", quantity: 1, unitPriceCents: 0 }] };
  appView = "quotes";
  shell();
  requestAnimationFrame(() => {
    selectedQuoteId = existing?.id || null;
    const panel = document.querySelector(".booking-preview-panel");
    if (panel) {
      panel.innerHTML = quoteEditor(quote);
      bindQuoteEditor();
    }
  });
}
function bindDashboardActions() {
  document.querySelectorAll("[data-open-booking]").forEach((b) => b.addEventListener("click", () => openCloudBooking(b.dataset.openBooking)));
  document.querySelectorAll("[data-view-event-document]").forEach((button) => button.addEventListener("click", () => openBusinessEventDocument(button.dataset.viewEventDocument, "event")));
  document.querySelectorAll("[data-create-event-quote]").forEach((button) => button.addEventListener("click", () => createQuoteForEvent(button.dataset.createEventQuote)));
  document.querySelectorAll("[data-view-booking-document]").forEach((button) => button.addEventListener("click", () => openBusinessEventDocument(button.dataset.viewBookingDocument, "booking")));
  document.querySelectorAll("[data-edit-booking]").forEach((button) => button.addEventListener("click", () => {
    const event = cloudBookings.find((row) => row.booking_ref === button.dataset.editBooking) || loadLocalEvents().find((row) => row.booking_ref === button.dataset.editBooking);
    if (!event) return toast("Event could not be found");
    openEventModal(null, event);
  }));
  document.querySelectorAll("[data-delete-booking]").forEach((button) => button.addEventListener("click", () => deleteEvent(button.dataset.deleteBooking)));
  document.querySelectorAll('[data-action="new-booking"]').forEach((b) => b.addEventListener("click", newBooking));
  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
    appView = b.dataset.view;
    shell();
  }));
  document.querySelectorAll('[data-action="copy-reference"]').forEach((b) => b.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.reference);
      toast("Event reference copied");
    } catch (e) {
      toast("Could not copy reference");
    }
  }));
  document.querySelectorAll("[data-open-client]").forEach((button) => button.addEventListener("click", () => {
    selectedClientId = button.dataset.openClient;
    appView = "clients";
    shell();
  }));
  document.querySelectorAll('[data-action="import-local-cloud"]').forEach((b) => b.addEventListener("click", migrateLocalClientsAndEvent));
}
function workspaceOverview() {
  const d = activeConsultation(), q = state.forms.quote || {}, c = state.forms.contract || {}, eventDate = d.eventDate || q.eventDate || "";
  const complete = state.completed || [];
  return `<div class="workspace-overview">
    <div><small>Client</small><strong>${escapeHtml(d.primaryClient || d.company || q.clientName || "Not entered")}</strong></div>
    <div><small>Event date</small><strong>${escapeHtml(eventDate || "Not entered")}</strong></div>
    <div><small>Venue</small><strong>${escapeHtml(d.venueName || q.venueName || "Not entered")}</strong></div>
    <div><small>Progress</small><strong>${Math.min(100, Math.round(complete.length / Math.max(1, modules.length) * 100))}%</strong></div>
    <div><small>Quote</small><strong>${escapeHtml(q.quoteStatus || "Draft")}</strong></div>
    <div><small>Contract</small><strong>${escapeHtml(c.contractStatus || "Draft")}</strong></div>
  </div>`;
}
function renderMain() {
  const m = modules.find((x) => x.id === state.active);
  const main = document.querySelector("#main");
  main.className = `crm-main workspace-module workspace-module-${state.active}`;
  main.dataset.workspaceModule = state.active;
  const overview = workspaceOverview();
  const workflowTabs = `<nav class="workspace-tabs" aria-label="Booking workflow"><div class="workspace-tabs-track">${modules.map((item, i) => `<button class="workspace-tab ${state.active === item.id ? "active" : ""}" type="button" data-module="${item.id}" ${state.active === item.id ? 'aria-current="page"' : ""}><span class="workspace-tab-number">${i + 1}</span><span>${item.label}</span></button>`).join("")}</div></nav>`;
  main.innerHTML = `<section class="hero workspace-hero"><div><button class="text-button back-dashboard" data-view="dashboard">\u2190 Dashboard</button><div class="eyebrow">Current Event \xB7 ${state.bookingId}</div><h1>${m.label}</h1><p>${m.description} ${currentUser ? "Changes save and sync automatically while you are signed in." : "Your information is currently stored only in this browser."}</p></div></section>${workflowTabs}${workflowStatusCard("organization")}${overview}<div class="booking-strip"><div class="ref"><small>Event Reference</small><br><strong>${state.bookingId}</strong></div><div class="actions"><button class="btn" data-action="save">${currentUser ? "Save & Sync Now" : "Save Local"}</button><button class="btn primary" data-action="cloud-sync">${currentUser ? "Sync Now" : "Sign in to Sync"}</button><button class="btn" data-action="cloud-load">Load Cloud</button><button class="btn" data-action="export">Export JSON</button><button class="btn danger" data-action="reset">New Event</button></div></div><div class="progress-wrap"><div class="progress-head"><span>Module completion</span><span id="progressText">0%</span></div><div class="progress"><span id="progressBar"></span></div></div><div id="module"></div><div class="footer-note">Galaxy Cue \xB7 Operating system for DJs and entertainment companies</div>`;
  const host = document.querySelector("#module"), source = activeConsultation();
  host.className = `module-host module-${state.active}`;
  host.dataset.module = state.active;
  if (state.active === "wedding") host.innerHTML = weddingForm();
  else if (state.active === "corporate") host.innerHTML = corporateForm();
  else if (state.active === "private") host.innerHTML = privateForm();
  else if (state.active === "quote") host.innerHTML = quoteForm(source);
  else if (state.active === "contract") host.innerHTML = contractForm(state.forms.quote || {}, source);
  else if (state.active === "wedding-planner") host.innerHTML = weddingPlannerForm(state.forms.wedding || source);
  else if (state.active === "corporate-planner") host.innerHTML = corporatePlannerForm(state.forms.corporate || source);
  else if (state.active === "private-planner") host.innerHTML = privatePlannerForm(state.forms.private || source);
  else if (state.active === "timeline") host.innerHTML = timelineForm();
  else if (state.active === "uploads") host.innerHTML = uploadsView();
  else if (state.active === "messages") host.innerHTML = messagesView();
  else if (state.active === "portal") host.innerHTML = portal();
  else if (state.active === "admin") host.innerHTML = admin();
  else host.innerHTML = comingSoon(m);
  if (state.active === "timeline") renderTimelineRows();
  if (state.active === "uploads") renderUploads();
  if (state.active === "messages") renderMessages();
  const form = host.querySelector("form");
  if (form) {
    fill(form, state.forms[state.active]);
    form.addEventListener("input", () => {
      state.forms[state.active] = dataFrom(form);
      save(false);
      updateProgress(form);
      if (state.active === "quote") updateQuoteTotals();
      if (state.active === "contract") updateContractTotals();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      state.forms[state.active] = dataFrom(form);
      if (!state.completed.includes(state.active)) state.completed.push(state.active);
      save();
      toast(state.active === "contract" ? "Contract acceptance recorded" : "Module completed");
      renderMain();
    });
    updateProgress(form);
    if (state.active === "quote") updateQuoteTotals();
    if (state.active === "contract") updateContractTotals();
  }
  bindActions();
  bindWorkflowActions();
}
function updateQuoteTotals() {
  const form = document.querySelector('form[data-form="quote"]');
  if (!form) return;
  const q = dataFrom(form), t = quoteTotals(q);
  [["subtotalValue", t.subtotal], ["discountValue", -t.discount], ["taxValue", t.tax], ["totalValue", t.total], ["depositValue", t.deposit], ["balanceValue", t.balance]].forEach(([id, v]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = money(v);
  });
}
function updateContractTotals() {
  const t = quoteTotals();
  document.querySelectorAll("[data-contract-total]").forEach((el) => el.textContent = money(t.total));
  document.querySelectorAll("[data-contract-deposit]").forEach((el) => el.textContent = money(t.deposit));
}
function daysUntil(date) {
  if (!date) return null;
  const target = /* @__PURE__ */ new Date(date + "T12:00:00"), today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 864e5);
}
function plannerForBooking() {
  if (state.forms.wedding && Object.keys(state.forms.wedding).length) return "wedding-planner";
  if (state.forms.corporate && Object.keys(state.forms.corporate).length) return "corporate-planner";
  if (state.forms.private && Object.keys(state.forms.private).length) return "private-planner";
  return null;
}
function portal() {
  const d = activeConsultation(), q = state.forms.quote || {}, c = state.forms.contract || {}, t = quoteTotals(q), plannerId = plannerForBooking(), eventDate = d.eventDate || q.eventDate || "", days = daysUntil(eventDate), planner = plannerId ? state.forms[plannerId] || {} : {}, plannerLabel = plannerId ? modules.find((x) => x.id === plannerId).label : "Music Planner";
  return `<div class="card portal-hero"><div><div class="eyebrow">Client Booking Overview</div><h2>${d.primaryClient || q.clientName || "Your Event"}</h2><p class="card-intro">Everything currently saved for booking <strong>${state.bookingId}</strong>.</p></div><div class="countdown"><small>Event Countdown</small><strong>${days === null ? "\u2014" : days < 0 ? "Past event" : days === 0 ? "Today" : days + " days"}</strong><span>${eventDate || "Date not set"}</span></div></div><div class="card"><h2>Booking Snapshot</h2><div class="summary-grid"><div class="stat"><small>Event Date</small><strong style="font-size:17px">${eventDate || "\u2014"}</strong></div><div class="stat"><small>Venue</small><strong style="font-size:17px">${d.venueName || q.venueName || "\u2014"}</strong></div><div class="stat"><small>Planner</small><strong style="font-size:17px">${plannerId ? state.completed.includes(plannerId) ? "Completed" : "In progress" : "Not selected"}</strong></div></div></div><div class="card"><h2>Quote & Payment</h2><div class="summary-grid"><div class="stat"><small>Quote Status</small><strong>${q.quoteStatus || "Not created"}</strong></div><div class="stat"><small>Total</small><strong>${money(t.total)}</strong></div><div class="stat"><small>Deposit Due</small><strong>${money(t.deposit)}</strong></div><div class="stat"><small>Contract Status</small><strong style="font-size:17px">${c.contractStatus || "Draft"}</strong></div><div class="stat"><small>Deposit Received</small><strong>${money(c.depositPaid)}</strong></div><div class="stat"><small>Balance Remaining</small><strong>${money(Math.max(0, t.total - (Number(c.depositPaid) || 0)))}</strong></div></div></div><div class="card"><h2>Workflow Progress</h2><div class="workflow-list">${["wedding", "corporate", "private", "quote", "contract", "wedding-planner", "corporate-planner", "private-planner"].filter((id) => !id.includes("planner") || id === plannerId).map((id) => {
    const m = modules.find((x) => x.id === id);
    return `<button class="workflow-item" data-nav="${id}"><span>${m.label}</span><strong class="${state.completed.includes(id) ? "done" : ""}">${state.completed.includes(id) ? "Completed" : state.forms[id] ? "In progress" : "Not started"}</strong></button>`;
  }).join("")}</div><div class="section-actions"><button class="btn" data-action="print-summary">Print Event Summary</button>${plannerId ? `<button class="btn primary" data-nav="${plannerId}">Open ${plannerLabel}</button>` : ""}</div></div><div class="card"><h2>Music Planner Preview</h2>${plannerId && Object.keys(planner).length ? `<div class="admin-list"><div><span>Must-play songs</span><strong>${planner.mustPlay ? "Added" : "Not added"}</strong></div><div><span>Do-not-play list</span><strong>${planner.doNotPlay ? "Added" : "Not added"}</strong></div><div><span>Timeline / run of show</span><strong>${planner.timeline || planner.receptionTimeline || planner.runOfShow ? "Added" : "Not added"}</strong></div><div><span>Announcements / cues</span><strong>${planner.announcements || planner.ceremonyNotes || planner.avNotes ? "Added" : "Not added"}</strong></div></div>` : '<p class="card-intro">No music-planner information has been entered yet.</p>'}</div>`;
}
function admin() {
  const d = activeConsultation(), q = state.forms.quote || {}, c = state.forms.contract || {}, t = quoteTotals(q);
  return `<div class="card"><h2>Admin Dashboard</h2><p class="card-intro">Local demonstration dashboard for the active browser.</p><div class="summary-grid"><div class="stat"><small>Client</small><strong>${d.primaryClient || q.clientName || "\u2014"}</strong></div><div class="stat"><small>Quote Total</small><strong>${money(t.total)}</strong></div><div class="stat"><small>Deposit Received</small><strong>${money(c.depositPaid)}</strong></div><div class="stat"><small>Quote Status</small><strong style="font-size:17px">${q.quoteStatus || "Draft"}</strong></div><div class="stat"><small>Contract Status</small><strong style="font-size:17px">${c.contractStatus || "Draft"}</strong></div><div class="stat"><small>Last Updated</small><strong style="font-size:14px">${new Date(state.updated).toLocaleString()}</strong></div></div></div><div class="card"><h2>Event Summary</h2><div class="admin-list"><div><span>Event date</span><strong>${d.eventDate || q.eventDate || "\u2014"}</strong></div><div><span>Venue</span><strong>${d.venueName || q.venueName || "\u2014"}</strong></div><div><span>Deposit status</span><strong>${c.depositStatus || "Not requested"}</strong></div><div><span>Remaining balance</span><strong>${money(Math.max(0, t.total - (Number(c.depositPaid) || 0)))}</strong></div></div></div>`;
}
function comingSoon(m) {
  return `<div class="card empty"><div class="icon">${m.icon}</div><h2>${m.label}</h2><p class="card-intro">The navigation and data structure are prepared. This module is scheduled for the next build.</p><button class="btn primary" data-nav="wedding">Return to Consultation</button></div>`;
}
function updateProgress(form) {
  const n = pct(form);
  document.querySelector("#progressBar").style.width = n + "%";
  document.querySelector("#progressText").textContent = n + "%";
}
function bindNav() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      navigateToView(button.dataset.view);
    });
  });
  document.querySelectorAll("[data-module]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      navigateToModule(button.dataset.module);
    });
  });
}
function bindActions() {
  document.querySelectorAll('[data-action="save"]').forEach((b) => b.addEventListener("click", () => {
    const f = document.querySelector("form");
    if (f) applySavedFormValues(f, state.forms?.[state.active] || {});
    if (f) state.forms[state.active] = dataFrom(f);
    save();
  }));
  document.querySelectorAll('[data-action="cloud-sync"]').forEach((b) => b.addEventListener("click", cloudSync));
  document.querySelectorAll('[data-action="cloud-load"]').forEach((b) => b.addEventListener("click", cloudLoad));
  document.querySelectorAll('[data-action="export"]').forEach((b) => b.addEventListener("click", exportJSON));
  document.querySelectorAll('[data-action="reset"]').forEach((b) => b.addEventListener("click", () => {
    if (confirm("Start a new booking and clear this browser\u2019s saved data?")) newBooking();
  }));
  document.querySelectorAll("#module [data-nav]").forEach((button) => button.addEventListener("click", () => navigateToModule(button.dataset.nav)));
  document.querySelectorAll('[data-action="add-timeline"]').forEach((b) => b.addEventListener("click", () => addTimelineItem()));
  document.querySelectorAll('[data-action="send-message"]').forEach((b) => b.addEventListener("click", addMessage));
  document.querySelectorAll('[data-action="print-quote"],[data-action="print-contract"],[data-action="print-planner"],[data-action="print-summary"]').forEach((b) => b.addEventListener("click", () => window.print()));
}
function timelineItems() {
  state.timelineItems = state.timelineItems || [];
  return state.timelineItems;
}
function addTimelineItem(item = { time: "", title: "", details: "" }) {
  timelineItems().push(item);
  save(false);
  renderTimelineRows();
}
function renderTimelineRows() {
  const wrap = document.querySelector("#timelineRows");
  if (!wrap) return;
  if (!timelineItems().length) [["2:00 PM", "Setup", "DJ and production setup"], ["4:00 PM", "Guest Arrival", "Background music begins"], ["6:00 PM", "Main Program", "Dinner / reception / event program"], ["11:00 PM", "Final Song", "Event conclusion"]].forEach((x) => timelineItems().push({ time: x[0], title: x[1], details: x[2] }));
  wrap.innerHTML = timelineItems().map((x, i) => `<div class="timeline-row"><input value="${escapeHtml(x.time)}" data-ti="${i}" data-k="time" placeholder="Time"><input value="${escapeHtml(x.title)}" data-ti="${i}" data-k="title" placeholder="Moment"><input value="${escapeHtml(x.details)}" data-ti="${i}" data-k="details" placeholder="Music, announcement or notes"><div class="row-actions"><button type="button" data-move="${i}" data-dir="-1">\u2191</button><button type="button" data-move="${i}" data-dir="1">\u2193</button><button type="button" data-remove="${i}">\xD7</button></div></div>`).join("");
  wrap.querySelectorAll("[data-ti]").forEach((el) => el.addEventListener("input", () => {
    timelineItems()[+el.dataset.ti][el.dataset.k] = el.value;
    save(false);
  }));
  wrap.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => {
    timelineItems().splice(+b.dataset.remove, 1);
    save(false);
    renderTimelineRows();
  }));
  wrap.querySelectorAll("[data-move]").forEach((b) => b.addEventListener("click", () => {
    const i = +b.dataset.move, j = i + +b.dataset.dir;
    if (j < 0 || j >= timelineItems().length) return;
    [timelineItems()[i], timelineItems()[j]] = [timelineItems()[j], timelineItems()[i]];
    save(false);
    renderTimelineRows();
  }));
}
async function renderUploads() {
  state.uploads = state.uploads || [];
  const input = document.querySelector("#uploadInput"), list = document.querySelector("#uploadList");
  if (!input || !list) return;
  const drawLocal = () => {
    list.innerHTML = state.uploads.length ? state.uploads.map((f, i) => `<div class="file-item"><div><strong>${escapeHtml(f.name)}</strong><small>${escapeHtml(f.type || "File")} \xB7 ${formatBytes(f.size)} \xB7 Local only</small></div><button class="btn" data-delete-file="${i}">Remove</button></div>`).join("") : '<p class="card-intro">No files added yet.</p>';
    list.querySelectorAll("[data-delete-file]").forEach((b) => b.addEventListener("click", () => {
      state.uploads.splice(+b.dataset.deleteFile, 1);
      save(false);
      drawLocal();
    }));
  };
  const drawCloud = async () => {
    list.innerHTML = '<p class="card-intro">Loading cloud files\u2026</p>';
    const { data, error } = await listBookingFiles2(state.bookingId, currentUser);
    if (error) {
      list.innerHTML = `<p class="card-intro">Could not load cloud files: ${escapeHtml(error.message)}</p>`;
      return;
    }
    list.innerHTML = data.length ? data.map((row) => `<div class="file-item"><div><strong>${escapeHtml(row.file_name)}</strong><small>${escapeHtml(row.mime_type || "File")} \xB7 ${formatBytes(row.file_size)} \xB7 Cloud</small></div><div class="file-actions"><button class="btn" data-open-file="${row.id}">Open</button><button class="btn" data-remove-cloud="${row.id}">Remove</button></div></div>`).join("") : '<p class="card-intro">No cloud files uploaded yet.</p>';
    list.querySelectorAll("[data-open-file]").forEach((b) => b.addEventListener("click", async () => {
      const row = data.find((x) => x.id === b.dataset.openFile);
      const { data: signed, error: e } = await createSignedFileUrl2(row.file_path);
      if (e) return toast(e.message);
      window.open(signed.signedUrl, "_blank", "noopener");
    }));
    list.querySelectorAll("[data-remove-cloud]").forEach((b) => b.addEventListener("click", async () => {
      const row = data.find((x) => x.id === b.dataset.removeCloud);
      const { error: e } = await removeBookingFile2(row, currentUser);
      if (e) return toast(e.message);
      toast("Cloud file removed");
      drawCloud();
    }));
  };
  input.addEventListener("change", async () => {
    const files = [...input.files];
    if (currentUser) {
      for (const f of files) {
        toast(`Uploading ${f.name}\u2026`);
        const { error } = await uploadBookingFile2(f, state.bookingId, currentUser);
        if (error) {
          toast(`Upload failed: ${error.message}`);
          break;
        }
      }
      await drawCloud();
    } else {
      files.forEach((f) => state.uploads.push({ name: f.name, type: f.type, size: f.size, added: (/* @__PURE__ */ new Date()).toISOString() }));
      save();
      drawLocal();
    }
    input.value = "";
  });
  currentUser ? await drawCloud() : drawLocal();
}
function renderMessages() {
  state.messages = state.messages || [];
  const thread = document.querySelector("#messageThread");
  thread.innerHTML = state.messages.length ? state.messages.map((m) => `<div class="message ${m.role === "Internal Note" ? "internal" : ""}"><div><strong>${escapeHtml(m.role)}</strong><small>${new Date(m.date).toLocaleString()}</small></div><p>${escapeHtml(m.text)}</p></div>`).join("") : '<p class="card-intro">No messages yet.</p>';
  thread.scrollTop = thread.scrollHeight;
}
function addMessage() {
  const role = document.querySelector("#messageRole").value, text = document.querySelector("#messageText").value.trim();
  if (!text) return;
  state.messages = state.messages || [];
  state.messages.push({ role, text, date: (/* @__PURE__ */ new Date()).toISOString() });
  document.querySelector("#messageText").value = "";
  save();
  renderMessages();
}
function formatBytes(n) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB"], i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}
function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);
}
function withTimeout(promise, milliseconds, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}
async function bindGlobalActions() {
  document.querySelectorAll('[data-action="login"]').forEach((b) => b.addEventListener("click", () => (() => {
    const el = document.querySelector("#authModal");
    if (el) el.classList.remove("hidden");
  })()));
  document.querySelectorAll('[data-action="close-auth"]').forEach((b) => b.addEventListener("click", () => (() => {
    const el = document.querySelector("#authModal");
    if (el) el.classList.add("hidden");
  })()));
  document.querySelectorAll('[data-action="send-link"]').forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const emailInput = document.querySelector("#authEmail");
    const email = String(emailInput?.value || "").trim().toLowerCase();
    const status = document.querySelector("#authStatus");
    if (!email) {
      toast("Enter your email address");
      if (status) status.textContent = "Enter your email address.";
      emailInput?.focus();
      return;
    }
    if (button.disabled) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Sending magic link\u2026";
    if (status) {
      status.textContent = "Requesting a secure sign-in email\u2026";
      status.classList.remove("auth-error", "auth-success");
    }
    try {
      const result = await withTimeout(
        sendMagicLink2(email),
        15e3,
        "The sign-in request timed out. Please check your internet connection and try again."
      );
      if (result?.error) {
        throw result.error;
      }
      if (status) {
        status.textContent = "Magic link sent. Check your inbox and spam folder.";
        status.classList.add("auth-success");
      }
      toast("Magic login link sent \u2014 check your email");
      button.textContent = "Email sent";
      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
      }, 2500);
    } catch (error) {
      console.error("Magic link send failed:", error);
      const message = error?.message || "Could not send the magic link";
      if (status) {
        status.textContent = message;
        status.classList.add("auth-error");
      }
      toast(message);
      button.disabled = false;
      button.textContent = originalText;
    }
  }));
  document.querySelectorAll('[data-action="logout"]').forEach((b) => b.addEventListener("click", async () => {
    await signOut2();
    currentUser = null;
    cloudBookings = loadLocalEvents();
    eventCloudStatus = "Local";
    shell();
    toast("Signed out");
  }));
  document.querySelectorAll('[data-action="command"]').forEach((b) => b.addEventListener("click", openCommand));
  document.querySelectorAll('[data-action="client-login"]').forEach((button) => button.addEventListener("click", () => {
    const url = new URL("client-portal.html", window.location.href);
    if (activeBusinessId()) url.searchParams.set("business", activeBusinessId());
    window.open(url.toString(), "_blank", "noopener");
  }));
  document.querySelectorAll('[data-action="client-portal"]').forEach((button) => button.addEventListener("click", () => {
    portalPreviewMode = true;
    navigateToView("client-portal");
  }));
  document.querySelectorAll('[data-action="toggle-mobile-menu"]').forEach((b) => b.addEventListener("click", () => setMobileMenu(!document.body.classList.contains("mobile-nav-open"))));
  document.querySelectorAll('[data-action="close-mobile-menu"]').forEach((b) => b.addEventListener("click", () => setMobileMenu(false)));
  document.querySelectorAll('[data-action="close-command"]').forEach((b) => b.addEventListener("click", () => (() => {
    const el = document.querySelector("#commandModal");
    if (el) el.classList.add("hidden");
  })()));
  document.querySelectorAll('[data-action="force-refresh"]').forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Refreshing\u2026";
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.warn("Cache cleanup was incomplete:", error);
    }
    const url = new URL(window.location.href);
    url.searchParams.set("gc-refresh", Date.now().toString());
    window.location.replace(url.toString());
  }));
  document.querySelectorAll('[data-action="close-event-modal"]').forEach((button) => button.addEventListener("click", closeEventModal));
  const eventCreateForm = document.querySelector("#eventCreateForm");
  bindQuickEventForm(eventCreateForm);
}
function setMobileMenu(open) {
  const isMobile = window.matchMedia("(max-width:760px)").matches;
  const shouldOpen = Boolean(open && isMobile);
  document.body.classList.toggle("mobile-nav-open", shouldOpen);
  document.body.classList.toggle("mobile-nav-scroll-lock", shouldOpen);
  const toggle = document.querySelector('[data-action="toggle-mobile-menu"]');
  const sidebar = document.querySelector("#crmSidebar");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(shouldOpen));
    toggle.setAttribute("aria-label", shouldOpen ? "Close navigation" : "Open navigation");
  }
  if (sidebar) sidebar.setAttribute("aria-hidden", String(isMobile && !shouldOpen));
  if (shouldOpen) {
    requestAnimationFrame(() => document.querySelector(".mobile-menu-close")?.focus());
  } else if (open === false && document.activeElement?.closest?.("#crmSidebar")) {
    toggle?.focus();
  }
}
function installResponsiveNavigationGuards() {
  if (window.__gcResponsiveNavigationInstalled) return;
  window.__gcResponsiveNavigationInstalled = true;
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("mobile-nav-open")) {
      setMobileMenu(false);
    }
  });
  window.addEventListener("resize", () => {
    if (!window.matchMedia("(max-width:760px)").matches) setMobileMenu(false);
  });
  window.addEventListener("popstate", () => setMobileMenu(false));
}
function runConnectionAudit() {
  const issues = [];
  const knownViews = /* @__PURE__ */ new Set(["dashboard", "bookings", "quotes", "contracts", "invoices", "payments", "clients", "calendar", "music", "files", "messages", "client-portal", "analytics", "settings", "workspace"]);
  const knownModules = new Set(modules.map((module) => module.id));
  document.querySelectorAll("[data-view]").forEach((element) => {
    if (!knownViews.has(element.dataset.view)) issues.push(`Unknown view route: ${element.dataset.view}`);
  });
  document.querySelectorAll("[data-module],[data-nav]").forEach((element) => {
    const target = element.dataset.module || element.dataset.nav;
    if (target && !knownModules.has(target)) issues.push(`Unknown module route: ${target}`);
  });
  ["#main", "#crmSidebar", '[data-action="toggle-mobile-menu"]'].forEach((selector) => {
    if (!document.querySelector(selector)) issues.push(`Missing interface element: ${selector}`);
  });
  const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
  [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].forEach((id) => issues.push(`Duplicate element id: ${id}`));
  const result = {
    passed: issues.length === 0,
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    view: appView,
    activeModule: state.active,
    issues
  };
  console.group("Galaxy Cue connection audit");
  console.table(result);
  if (issues.length) console.warn(issues);
  else console.info("Navigation routes, module targets and shell connections passed.");
  console.groupEnd();
  toast(issues.length ? `${issues.length} connection issue${issues.length === 1 ? "" : "s"} found` : "System connection check passed");
  return result;
}
function openCommand() {
  const modal = document.querySelector("#commandModal"), input = document.querySelector("#commandInput");
  if (modal) modal.classList.remove("hidden");
  if (input) {
    input.value = "";
    setTimeout(() => input.focus(), 50);
    drawCommands("");
    input.oninput = () => drawCommands(input.value);
  }
}
function drawCommands(q = "") {
  const box = document.querySelector("#commandResults");
  if (!box) return;
  const actions = [
    { label: "Go to Dashboard", hint: "Business overview", run: () => navigateToView("dashboard") },
    { label: "Open Events", hint: "Search the CRM", run: () => navigateToView("bookings") },
    { label: "Create New Event", hint: "Start a fresh workflow", run: newBooking },
    { label: "Open Current Event", hint: state.bookingId, run: () => navigateToView("workspace") },
    { label: "Preview Client Portal", hint: state.bookingId, run: () => {
      portalPreviewMode = true;
      navigateToView("client-portal");
    } },
    { label: "Business Settings", hint: "Company name and payment methods", run: () => navigateToView("settings") },
    { label: "Run System Check", hint: "Audit navigation and interface connections", run: runConnectionAudit }
  ];
  const bookingActions = cloudBookings.map((b) => ({ label: b.client_name || b.booking_ref, hint: `${b.booking_ref} \xB7 ${b.event_type || "Event"}`, run: () => openCloudBooking(b.booking_ref) }));
  const items = [...actions, ...bookingActions].filter((x) => (x.label + " " + x.hint).toLowerCase().includes(q.toLowerCase())).slice(0, 10);
  box.innerHTML = items.map((x, i) => `<button data-command-index="${i}"><strong>${escapeHtml(x.label)}</strong><small>${escapeHtml(x.hint)}</small><span>\u21B5</span></button>`).join("") || '<div class="empty-state compact">No result found.</div>';
  box.querySelectorAll("[data-command-index]").forEach((b) => b.addEventListener("click", () => items[+b.dataset.commandIndex].run()));
}
async function cloudSync() {
  if (!currentUser) return document.querySelector("#authModal")?.classList.remove("hidden");
  const f = document.querySelector("form");
  if (f) state.forms[state.active] = dataFrom(f);
  state.updated = (/* @__PURE__ */ new Date()).toISOString();
  localStorage.setItem(KEY, JSON.stringify(state));
  lastAutoCloudSignature = "";
  await runAutoCloudSync({ notify: true });
  if (eventCloudStatus === "Synced") await refreshEventsFromCloud();
}
async function cloudLoad() {
  if (!currentUser) return document.querySelector("#authModal")?.classList.remove("hidden");
  if (!activeBusinessId()) return toast("No active business workspace");
  const { data, error } = await loadCloudEvent2(state.bookingId, activeBusinessId());
  if (error) return toast(error.code === "PGRST116" ? "No cloud copy found for this event" : error.message);
  if (!data || !data.booking_data) return toast("Cloud event has no saved data");
  state = data.booking_data;
  localStorage.setItem(KEY, JSON.stringify(state));
  shell();
  toast("Cloud event loaded");
}
async function initializeAuth() {
  if (isPublicBookingRequestRoute()) {
    await loadCloudModule();
    publicBookingRequestScreen();
    return;
  }
  shell();
  const loaded = await loadCloudModule();
  if (!loaded) {
    currentUser = null;
    shell();
    toast("Local mode active \u2014 cloud module could not load");
    return;
  }
  try {
    const callback = await restoreAuthSession2();
    if (callback?.error) {
      console.error("Magic-link callback failed:", callback.error);
      toast(callback.error.message || "The magic login link could not be verified");
    }
    currentUser = callback?.user || await getCurrentUser2();
    if (currentUser) {
      appView = "dashboard";
      const workspace = await ensureBusinessWorkspace2(currentUser);
      if (workspace?.error) {
        console.error("Business workspace initialization failed:", workspace.error);
        toast("Signed in, but the cloud workspace could not be opened");
      } else {
        activeBusiness = workspace?.data || null;
        await hydrateCloudPreferences();
        await refreshCoreCloudData();
      }
    }
    shell();
    if (callback?.handled && currentUser) {
      toast("Magic link verified \u2014 signed in");
    }
    supabase2.auth.onAuthStateChange((event, session) => {
      const next = session?.user || null;
      const userChanged = (next && next.id || null) !== (currentUser && currentUser.id || null);
      if (!userChanged && event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
      currentUser = next;
      if (currentUser) {
        appView = "dashboard";
        ensureBusinessWorkspace2(currentUser).then(async (workspace) => {
          if (workspace?.error) {
            console.error("Business workspace initialization failed:", workspace.error);
            toast("Signed in, but the cloud workspace could not be opened");
          } else {
            activeBusiness = workspace?.data || null;
            await hydrateCloudPreferences();
            await refreshCoreCloudData();
          }
          shell();
        });
      } else {
        activeBusiness = null;
        clientCloudStatus = "Local";
        eventCloudStatus = "Local";
        crmClients = loadClients();
        cloudBookings = [];
        shell();
      }
    });
  } catch (error) {
    console.error("Supabase initialization failed:", error);
    currentUser = null;
    shell();
    toast(error?.message || "Cloud connection unavailable \u2014 local mode is active");
  }
}
function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }), a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${state.bookingId}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
window.addEventListener("error", (event) => {
  console.error(event.error || event.message);
  const root = document.querySelector("#app");
  if (root && !root.innerHTML.trim()) {
    root.innerHTML = `<main style="min-height:100vh;background:#090909;color:white;display:grid;place-items:center;padding:24px;font-family:Arial,sans-serif">
      <section style="max-width:620px;border:1px solid #3a332d;background:#12100f;border-radius:18px;padding:28px">
        <h1 style="margin-top:0">Galaxy Cue</h1>
        <p>The application could not finish loading. Please refresh once. If this message remains, upload the hotfix files again and make sure the <strong>js</strong> and <strong>css</strong> folders are in the same directory as <strong>index.html</strong>.</p>
        <p style="color:#c9986a;font-size:13px">${escapeHtml(event.message || "Unknown loading error")}</p>
      </section>
    </main>`;
  }
});
window.addEventListener("unhandledrejection", (event) => console.error("Unhandled promise rejection:", event.reason));
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openCommand();
  }
  if (e.key === "Escape") {
    (() => {
      const el = document.querySelector("#commandModal");
      if (el) el.classList.add("hidden");
    })();
    (() => {
      const el = document.querySelector("#authModal");
      if (el) el.classList.add("hidden");
    })();
    closeEventModal();
  }
});
initializeAuth();
function enforceQuarterHourTimeInputs(root = document) {
  root.querySelectorAll('input[type="time"]').forEach((input) => {
    input.step = "900";
    if (input.dataset.quarterHourBound) return;
    input.dataset.quarterHourBound = "1";
    input.addEventListener("change", () => {
      if (!input.value) return;
      const [hour, minute] = input.value.split(":").map(Number);
      let total = hour * 60 + minute;
      total = Math.round(total / 15) * 15;
      if (total >= 1440) total = 1425;
      input.value = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    });
  });
}
document.addEventListener("focusin", (event) => {
  if (event.target?.matches?.('input[type="time"]')) enforceQuarterHourTimeInputs(document);
});
