import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export async function getCurrentUser() {
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

export async function restoreAuthSession() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const errorDescription =
    url.searchParams.get('error_description') ||
    new URLSearchParams(window.location.hash.replace(/^#/, '')).get('error_description');

  if (errorDescription) {
    cleanAuthCallbackUrl();
    return { user: null, error: new Error(errorDescription), handled: true };
  }

  let { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    return { user: null, error: sessionError, handled: false };
  }

  if (sessionData?.session?.user) {
    const hadCallback = Boolean(code || window.location.hash.includes('access_token='));
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

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');

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

export async function sendMagicLink(email) {
  const redirectTo = `${window.location.origin}${window.location.pathname}`;

  return supabase.auth.signInWithOtp({
    email: String(email || '').trim().toLowerCase(),
    options: { emailRedirectTo: redirectTo }
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function upsertBooking(state, user) {
  if (!user) throw new Error('Sign in before syncing.');
  const forms = state.forms || {}; const consultation = forms.wedding || forms.corporate || forms.private || {};
  const quote = forms.quote || {};
  const payload = {
    owner_id: user.id,
    booking_ref: state.bookingId,
    client_name: consultation.primaryClient || consultation.company || quote.clientName || '',
    client_email: consultation.email || quote.clientEmail || user.email || '',
    event_type: forms.wedding ? 'Wedding' : forms.corporate ? 'Corporate' : forms.private ? 'Private Party' : '',
    event_date: consultation.eventDate || quote.eventDate || null,
    start_time: consultation.startTime || consultation.ceremonyTime || quote.startTime || null,
    end_time: consultation.endTime || quote.endTime || null,
    venue_name: consultation.venueName || quote.venueName || '',
    status: quote.quoteStatus || 'Draft',
    booking_data: state,
    updated_at: new Date().toISOString()
  };
  return supabase.from('bookings').upsert(payload, { onConflict: 'booking_ref' }).select().single();
}

export async function loadBooking(bookingRef, user) {
  if (!user) throw new Error('Sign in before loading cloud data.');
  return supabase.from('bookings').select('*').eq('booking_ref', bookingRef).single();
}

export async function listBookings(user) {
  if (!user) return { data: [], error: null };
  return supabase.from('bookings').select('id,booking_ref,client_name,event_type,event_date,venue_name,status,updated_at').order('updated_at', { ascending: false });
}

export async function uploadBookingFile(file, bookingRef, user) {
  if (!user) throw new Error('Sign in before uploading files.');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${user.id}/${bookingRef}/${Date.now()}-${safeName}`;
  const uploaded = await supabase.storage.from('booking-files').upload(path, file, { upsert: false });
  if (uploaded.error) return uploaded;
  const record = await supabase.from('booking_files').insert({
    owner_id: user.id,
    booking_ref: bookingRef,
    file_name: file.name,
    file_path: path,
    mime_type: file.type || null,
    file_size: file.size || null
  }).select().single();
  return record;
}

export async function listBookingFiles(bookingRef, user) {
  if (!user) return { data: [], error: null };
  return supabase.from('booking_files').select('*').eq('booking_ref', bookingRef).order('created_at', { ascending: false });
}

export async function removeBookingFile(row, user) {
  if (!user) throw new Error('Sign in before removing files.');
  const storageResult = await supabase.storage.from('booking-files').remove([row.file_path]);
  if (storageResult.error) return storageResult;
  return supabase.from('booking_files').delete().eq('id', row.id);
}

export async function createSignedFileUrl(path) {
  return supabase.storage.from('booking-files').createSignedUrl(path, 3600);
}

// Galaxy Cue v4 cloud foundation ------------------------------------------------
export async function ensureBusinessWorkspace(user) {
  if (!user) return { data: null, error: new Error('Sign in first.') };

  const membership = await supabase
    .from('business_members')
    .select('business_id, role, businesses(id,name,slug,created_at)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (membership.error) return membership;
  if (membership.data) return { data: membership.data, error: null };

  const businessName = user.user_metadata?.business_name ||
    user.user_metadata?.full_name ||
    (user.email ? `${user.email.split('@')[0]}'s Business` : 'My Entertainment Business');

  const created = await supabase.rpc('create_business_for_current_user', {
    requested_name: businessName
  });
  if (created.error) return created;

  return supabase
    .from('business_members')
    .select('business_id, role, businesses(id,name,slug,created_at)')
    .eq('user_id', user.id)
    .eq('business_id', created.data)
    .single();
}

export async function getCloudHealth() {
  const { data: authData } = await supabase.auth.getSession();
  if (!authData.session) return { ok: true, authenticated: false, message: 'Cloud connected; user is signed out.' };
  const result = await supabase.from('business_members').select('business_id').limit(1);
  if (result.error) return { ok: false, authenticated: true, message: result.error.message, error: result.error };
  return { ok: true, authenticated: true, message: 'Cloud foundation is available.' };
}

export async function listBusinessRows(table, businessId, columns = '*') {
  if (!businessId) return { data: [], error: new Error('No active business workspace.') };
  return supabase.from(table).select(columns).eq('business_id', businessId).order('updated_at', { ascending: false });
}

export async function upsertBusinessRow(table, row, businessId) {
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  return supabase.from(table).upsert({ ...row, business_id: businessId }).select().single();
}

export async function deleteBusinessRow(table, id, businessId) {
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  return supabase.from(table).delete().eq('id', id).eq('business_id', businessId);
}



// Galaxy Cue v5 alpha.18 — workspace settings ----------------------------
export async function loadCloudBusinessSettings(businessId) {
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  return supabase.from('business_settings').select('settings').eq('business_id', businessId).maybeSingle();
}

export async function saveCloudBusinessSettings(settings, businessId) {
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  return supabase.from('business_settings').upsert({
    business_id: businessId,
    settings,
    updated_by: (await supabase.auth.getUser()).data.user?.id || null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'business_id' }).select('settings').single();
}

// Galaxy Cue v4.1 — Clients and Events cloud sync -----------------------------
export async function listCloudClients(businessId) {
  if (!businessId) return { data: [], error: new Error('No active business workspace.') };
  return supabase
    .from('clients')
    .select('*')
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false });
}

export async function saveCloudClient(client, businessId) {
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  const payload = {
    business_id: businessId,
    name: client.name || 'Unnamed Client',
    first_name: client.firstName || null,
    last_name: client.lastName || null,
    company: client.company || null,
    email: client.email || null,
    phone: client.phone || null,
    address: client.address || null,
    notes: client.notes || null,
    booking_for: client.bookingFor || 'self',
    third_party_name: client.thirdPartyName || null,
    third_party_role: client.thirdPartyRole || null,
    third_party_email: client.thirdPartyEmail || null,
    third_party_phone: client.thirdPartyPhone || null
  };
  if (client.id && /^[0-9a-f-]{36}$/i.test(client.id)) payload.id = client.id;
  let result = await supabase.from('clients').upsert(payload).select().single();
  if (result.error && /column|schema cache/i.test(result.error.message || '')) {
    const legacy = {business_id:businessId,name:payload.name,company:payload.company,email:payload.email,phone:payload.phone,address:payload.address,notes:payload.notes};
    if (payload.id) legacy.id=payload.id;
    result = await supabase.from('clients').upsert(legacy).select().single();
  }
  return result;
}

export async function removeCloudClient(id, businessId) {
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  return supabase.from('clients').delete().eq('id', id).eq('business_id', businessId);
}

function eventPayloadFromState(state, businessId, clientId = null) {
  const forms = state.forms || {};
  const consultation = forms.wedding || forms.corporate || forms.private || {};
  const quote = forms.quote || {};
  const eventType = forms.wedding ? 'Wedding' : forms.corporate ? 'Corporate' : forms.private ? 'Private Party' : 'Event';
  const clientName = consultation.primaryClient || consultation.company || quote.clientName || '';
  return {
    business_id: businessId,
    client_id: clientId || null,
    booking_ref: state.bookingId,
    title: clientName ? `${clientName} — ${eventType}` : eventType,
    event_type: eventType,
    event_date: consultation.eventDate || quote.eventDate || null,
    start_time: consultation.startTime || consultation.ceremonyTime || quote.startTime || null,
    end_time: consultation.endTime || quote.endTime || null,
    venue_name: consultation.venueName || quote.venueName || null,
    venue_address: consultation.venueAddress || quote.venueAddress || null,
    status: String(quote.quoteStatus || 'draft').toLowerCase(),
    event_data: state
  };
}

export async function saveCloudEvent(state, businessId, clientId = null) {
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  return supabase
    .from('events')
    .upsert(eventPayloadFromState(state, businessId, clientId), { onConflict: 'business_id,booking_ref' })
    .select('*')
    .single();
}

export async function listCloudEvents(businessId) {
  if (!businessId) return { data: [], error: new Error('No active business workspace.') };
  const result = await supabase
    .from('events')
    .select('*, clients(id,name,company,email,phone)')
    .eq('business_id', businessId)
    .order('event_date', { ascending: true });
  if (result.error) return result;
  return {
    data: (result.data || []).map(row => ({
      ...row,
      client_name: row.clients?.name || row.clients?.company || row.event_data?.forms?.wedding?.primaryClient || row.event_data?.forms?.corporate?.company || row.event_data?.forms?.private?.primaryClient || '',
      client_email: row.clients?.email || row.event_data?.forms?.wedding?.email || row.event_data?.forms?.corporate?.email || row.event_data?.forms?.private?.email || '',
      booking_data: row.event_data,
      updated_at: row.updated_at
    })),
    error: null
  };
}

export async function loadCloudEvent(bookingRef, businessId) {
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  const result = await supabase
    .from('events')
    .select('*, clients(id,name,company,email,phone)')
    .eq('business_id', businessId)
    .eq('booking_ref', bookingRef)
    .single();
  if (result.error) return result;
  return { data: { ...result.data, booking_data: result.data.event_data }, error: null };
}

export async function removeCloudEvent(bookingRef, businessId) {
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  return supabase.from('events').delete().eq('booking_ref', bookingRef).eq('business_id', businessId);
}

export async function listCloudQuotes(businessId) {
  if (!businessId) return { data: [], error: new Error('No active business workspace.') };
  const result = await supabase
    .from('quotes')
    .select('*, events(booking_ref,title), clients(name,company,email)')
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false });
  if (result.error) return result;
  return {
    data: (result.data || []).map(row => ({
      ...(row.content || {}),
      id: row.id,
      number: row.quote_number,
      bookingRef: row.events?.booking_ref || row.content?.bookingRef || '',
      eventRef: row.events?.booking_ref || row.content?.eventRef || '',
      clientName: row.clients?.name || row.clients?.company || row.content?.clientName || '',
      eventName: row.events?.title || row.content?.eventName || '',
      status: String(row.status || 'draft').replace(/(^|_)(\w)/g, (_match, space, letter) => `${space ? ' ' : ''}${letter.toUpperCase()}`),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      cloud: true
    })),
    error: null
  };
}

export async function saveCloudQuote(quote, businessId) {
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  const event = await supabase
    .from('events')
    .select('id,client_id,booking_ref,title')
    .eq('business_id', businessId)
    .eq('booking_ref', quote.eventRef || quote.bookingRef)
    .maybeSingle();
  if (event.error) return event;
  if (!event.data) return { data: null, error: new Error('The quote must be linked to an existing event.') };

  const subtotal = (quote.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPriceCents) || 0),
    0
  ) / 100;
  const depositDue = subtotal * ((Number(quote.depositPercent) || 0) / 100);
  const status = String(quote.status || 'draft').trim().toLowerCase();
  const allowedStatus = ['draft', 'sent', 'viewed', 'accepted', 'declined', 'paid', 'void'].includes(status)
    ? status
    : 'draft';
  const payload = {
    business_id: businessId,
    event_id: event.data.id,
    client_id: event.data.client_id,
    quote_number: quote.number,
    status: allowedStatus,
    subtotal,
    discount: 0,
    tax: 0,
    total: subtotal,
    deposit_due: depositDue,
    content: { ...quote, eventRef: event.data.booking_ref, bookingRef: event.data.booking_ref }
  };
  if (quote.id && /^[0-9a-f-]{36}$/i.test(quote.id)) payload.id = quote.id;
  return supabase.from('quotes').upsert(payload).select('*').single();
}


export async function submitBookingRequest(request) {
  // Public/anonymous users may insert a request but cannot select it back under RLS.
  // Avoid `select()` here so a successful public submission is not reported as an error.
  const { error } = await supabase.from('booking_requests').insert(request);
  return { data: error ? null : request, error };
}
export async function listBookingRequests(businessId) {
  if (!businessId) return { data: [], error: new Error('No active business workspace.') };
  return supabase.from('booking_requests').select('*').eq('business_id', businessId).order('created_at', { ascending: false });
}
export async function updateBookingRequest(id, businessId, changes) {
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  return supabase.from('booking_requests').update(changes).eq('id', id).eq('business_id', businessId).select('*').single();
}


// Galaxy Cue v6.0.0-alpha.9 — atomic booking activation ----------------------
export async function acceptBookingRequest(requestId, businessId) {
  if (!requestId) return { data: null, error: new Error('Booking request ID is required.') };
  if (!businessId) return { data: null, error: new Error('No active business workspace.') };
  return supabase.rpc('accept_booking_request_for_current_business', {
    target_request_id: requestId,
    expected_business_id: businessId
  });
}
