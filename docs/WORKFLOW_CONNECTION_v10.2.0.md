# Galaxy Cue v10.2.0 — Connected Event Workflow

This release connects the forms that already existed. It does not add or redesign forms.

## Connected sequence

Booking Request → Client/Event → Consultation → Quote → Contract + Deposit → Event Planning (including timeline) → Event Ready → Event Completed → Final Payment → Paid & Completed → Archived.

## Connection rules

- The active booking reference is attached to quote, contract, invoice and payment records.
- Client and event details propagate from the event/consultation record into Quote, Contract and Event Planning.
- Saving or accepting a quote reconciles the workflow.
- Signing a contract reconciles the workflow.
- Verified payments update deposit and final-payment stages.
- Submitting the existing Event Planning form advances planning. Timeline remains inside the existing planning experience; no new planning or timeline form was created.
- Every workspace save persists the unified event core, workflow history and current workflow state.
- The visible Version box is updated to 10.2.0.
