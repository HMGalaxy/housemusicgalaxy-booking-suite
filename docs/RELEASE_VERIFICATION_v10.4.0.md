# Galaxy Cue v10.4.0 Release Verification

## Scope

This release establishes the Full Event Workbook as the canonical
Consultation document and implements the first verified workflow handoff:

```text
Client submits Full Event Workbook
→ Business receives the completed document
→ Event advances to Quote Preparation
→ Create Quote becomes the primary Business action
```

The remaining Quote/Contract, Deposit, Planning, Day-of-Event, Financials,
and Completed interactions remain subsequent implementation milestones.

## Automated checks

- Business `app.js` syntax: passed.
- Business `app.bundle.js` syntax: passed.
- Client `app.js` syntax: passed.
- Shared Supabase service syntax: passed.
- Business source/bundle byte comparison: passed.
- Git whitespace/error check: passed.
- Release version and cache reference audit: passed.

## Browser checks

- Business Portal startup: passed.
- Client Portal startup: passed.
- Visible Business version: `v10.4.0`.
- Visible Client version: `v10.4.0`.
- Manual Business event creation: passed.
- Existing large Wedding Workbook opens from the Event Workspace: passed.
- Text input accepts typing: passed.
- Focus remains in the field after autosave: passed.
- Scroll position remains stable after autosave: passed.
- Save Now persists the workbook draft: passed.
- Full page reload restores the saved workbook value: passed.

## Supabase verification required after deployment

Run `supabase/galaxy_cue_v10_4_0_event_workbook_foundation.sql` before
testing the cloud Business ↔ Client handoff. Then verify with one test event:

1. Business accepts or creates the Event.
2. Client opens and submits the Full Event Workbook.
3. Business sees the submitted workbook under Documents.
4. Event status is Quote Preparation.
5. Create Quote is the primary Event action.

## Connected project verification

- Project: `dgpaiggcgiasqqpeclsz`
- PostgreSQL: 17
- Migration application: passed on July 24, 2026.
- Existing Event rows preserved: 6.
- Workbook RPC search path: `public, pg_temp`.
- Anonymous RPC execution: denied.
- Authenticated RPC execution: granted.
- Row Level Security remains enabled on all Galaxy Cue application tables.
