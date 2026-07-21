# Galaxy Cue application architecture

## Admin OS
Entry: `admin.html`
Purpose: Galaxy Cue platform/developer operations. It must not manage individual event workflows.

## Business OS
Entry: `index.html` or `business.html`
Purpose: Entertainment-company operations: leads, clients, events, quotes, contracts, planning and timelines.

## Client App
Entry: `client-portal.html`
Purpose: Client event collaboration, new-event requests, documents and workflow actions.

All three applications share Supabase but have separate navigation, authentication context and responsibility boundaries.
