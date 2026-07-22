# Galaxy Cue Business OS v10.0.4 — Logic Stabilization

This release focuses on regression prevention rather than new screens or navigation.

## Corrected logic

1. **Manual Save no longer restores old form values before saving.**
   The previous Save Now handler reapplied the last stored state before reading the form, which could silently discard the user's newest edits.

2. **Radio buttons and checkbox groups restore correctly.**
   All form restoration now uses the same type-aware form hydrator. Radio values are selected by matching their value rather than rewriting the value of every radio input.

3. **Dynamic template selections serialize consistently.**
   Consultation and planning template controls now use the same form serializer as the rest of the OS, preserving grouped checkbox values and single checkbox booleans.

4. **Legacy single-name clients normalize safely.**
   A one-word legacy name is retained as the first name instead of being converted into an empty first name and a last name only.

5. **Client deletion protects linked events.**
   A client with linked events cannot be deleted until those events are deleted or reassigned, preventing orphaned event records and broken client histories.

6. **Source and deployed bundle remain identical.**
   `apps/business/app.js` and `apps/business/app.bundle.js` are synchronized.

## Architecture preserved

- Existing sidebar and page structure are unchanged.
- Existing consultation and planning forms are unchanged visually.
- The unified client card remains the shared renderer in Clients, Consultation and Planning.
- Template Settings remains the source of truth for configurable Production Requirements.

## Minimum regression path

1. Sign in and open Clients.
2. Create a client, edit it and save it.
3. Create an event linked to that client.
4. Open Consultation and verify the same client card appears.
5. Change radio and checkbox values, click Save Now, navigate away and return.
6. Open Planning and verify saved values and the same client card.
7. Try deleting the client while the event is linked; deletion should be blocked.
8. Disable a template item in Settings and verify it disappears from Consultation and Planning.
