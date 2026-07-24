# Galaxy Cue v10.4.0 — Event Workbook Workflow Foundation

This release stabilizes the first Business ↔ Client workflow boundary.

- Business and Client use the same Full Event Workbook source.
- Client submissions are recognized by Business under the canonical `eventWorkbook` document.
- Existing legacy `eventForm` submissions remain readable.
- After workbook submission, the primary Business action is Create Quote.
- Business-only and internal form fields are excluded from Client submissions.
- Quotes created from an Event can persist to the existing Supabase `quotes` table.
- The form-host navigation collision responsible for focus loss and scroll resets is removed.
- The workbook RPC explicitly denies `PUBLIC` and anonymous execution and grants
  access only to authenticated users and the service role.

Run `supabase/galaxy_cue_v10_4_0_event_workbook_foundation.sql` before testing cloud workbook submission.
