# Galaxy Cue v6.0.0-alpha.9

## Event Activation — Client Form Connected

This build contains actual application changes, not only a migration.

- Business acceptance now calls an atomic Supabase RPC.
- The RPC finds or creates the client, creates the event, assigns the Event Form, creates portal access, and updates the booking request.
- The universal Client Portal loads events through a secure email-linked RPC.
- Event Form draft and submission are saved into the same event record.
- Submission advances the event to `QUOTE_PREPARATION`.
- Visible application and Client Portal versions are `6.0.0-alpha.9`.
