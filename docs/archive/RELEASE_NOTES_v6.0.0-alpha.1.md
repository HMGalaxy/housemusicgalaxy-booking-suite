# Galaxy Cue v6.0.0-alpha.1 — Workflow Foundation

This release introduces the first functional GCOS workflow engine without redesigning the completed interface.

## Added
- One authoritative workflow state per event
- Organization/Client action ownership
- Strict transition validation (stages cannot be skipped)
- Persistent workflow state stored inside each event record
- Workflow history with actor and timestamp
- Organization workflow controls in the Event Workspace
- Client workflow controls in the Client Portal preview
- Contract-signature and deposit-payment gate: both are required before planning can begin
- Planning review may be approved or returned to the client

## Scope
This alpha proves state logic, persistence and the back-and-forth handoff model. Existing production email delivery, separate client authentication, realtime subscriptions and automatic notifications are intentionally reserved for the next release.
