# Galaxy Cue v10.1.0 — Connected Workflow

This build connects the existing forms and cards around one event reference.

Workflow: Booking Request → Client/Event → Consultation → Quote → Contract + Deposit → Planning + Timeline → Event Ready → Event Completed → Final Payment → Paid & Completed → Archived.

## Synchronization rules
- Shared client, date, venue and time fields are maintained in `state.eventCore`.
- Consultation updates Quote, Contract, Planning and Timeline shared fields.
- Workspace Quote records synchronize with the Financials Quote library.
- Accepted quotes create/update the event invoice.
- Contract status and verified payments advance workflow state.
- Final verified balance advances the event to Paid & Completed.
- Every financial record carries the event booking reference.
