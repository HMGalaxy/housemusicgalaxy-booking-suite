
## v10.3.2 — Stable Form Input
- Removed full workflow persistence from every keystroke.
- Added in-memory draft capture with debounced persistence.
- Preserves focus and scroll position during background saves.
- Captures the active module ID when binding each form so data cannot be written into another form after navigation.
- Removed the workspace focus handler that could interfere with active inputs.
- Updated runtime version and cache key to 10.3.2 / 10302.
# Galaxy Cue v10.3.2

## Forms Interaction QA Hotfix

- Added delegated navigation for all Consultation and Event Planning template cards.
- Added interaction guards so dynamically rendered forms remain clickable and editable.
- Added stale mobile-backdrop protection.
- Added runtime `runFormsQaAudit()` covering Wedding, Corporate, Private, Quote, Contract, all Planning forms, and Timeline.
- Updated visible version box and cache references to v10.3.2 / 10302.

# Galaxy Cue Changelog

## v10.3.0 — Connected Workflow Runtime
- Connected all existing event forms through one persisted workflow state.
- Added record-driven workflow reconciliation for existing and new events.
- Added the workflow status card to the active event workspace.
- Event cards now store the central workflow state.
- Updated visible version box and cache references to v10.3.0 / 10300.

# Galaxy Cue v10.3.0

## Connected workflow release

- Connected existing workflow forms and CRM financial records by active event reference.
- Added bidirectional Quote and Contract synchronization.
- Added Invoice and verified Payment synchronization to event Financials.
- Prevented Consultation and Planning from advancing before form completion.
- Updated visible version box and browser cache version.

# Galaxy Cue v10.1.0

- Fixed Save Now reverting current form edits.
- Unified type-aware restoration for radio buttons and checkbox groups.
- Fixed dynamic template serialization.
- Protected linked events from accidental client deletion.
- Corrected legacy single-name client normalization.
- Synchronized source and deployed Business OS bundles.

- Unified client-card rendering across Clients, Consultation, and Planning.
- Fixed contextual client save/delete behavior.
- Added full-width component safeguards.
- Synchronized source and deployment bundle.
- Added logic audit and regression checklist.
- Preserved sidebar, workflow, and existing UI.

# Galaxy Cue Changelog

## v9.1.0 — Business Templates
- Preserved the v9 Business OS sidebar and layout as the platform standard.
- Replaced Music Planner with Event Consultations and Event Planning.
- Added template hubs for wedding, corporate, private and universal timeline workflows.
- Added Settings controls for consultation forms, planning forms, services and equipment.
- Added custom equipment entries, including optional Fog Machine support.
- Replaced the Business header Client Login shortcut with a working Business Login action.
- No database migration required; template preferences are stored locally.

# Changelog

## v9.1.0

### Business OS milestones v8.1–v9.0

- Restored Nunito Sans as the consistent Galaxy Cue application font.
- Removed the Client Portal button from Business OS navigation.
- Reorganized the sidebar into Command, Work and System groups.
- Retained the redesigned Dashboard command center, KPI cards, workflow cards, notifications, activity feed and client profiles.
- Added a consolidated Documents hub.
- Added a consolidated Financials hub for Quotes, Invoices and Payments.
- Added an Automation Center foundation with event-workflow templates.
- Improved responsive behavior, event workspace tabs, spacing and visual consistency.
- Updated visible and runtime version checks to v9.1.0 across all three applications.

No new database migration is required for this interface-focused release.