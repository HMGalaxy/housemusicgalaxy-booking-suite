# Galaxy Cue v10.3.4 — Form Engine Repair

This build uses v9.0.0 only as a known-good behavioral reference while retaining the current v10 codebase.

## Repair
- Form input no longer invokes workflow reconciliation, financial record generation, event propagation, or cloud synchronization on every keystroke.
- Typing updates only the active form draft and the local state snapshot.
- Full workflow synchronization runs through explicit Save Now, Sync Now, and form completion actions.
- The embedded Client Card was removed from consultation and planning forms.
- Forms now display a compact client selector that binds an existing client to the current event/form.

## Expected behavior
- Fields keep focus while typing.
- The workspace does not rerender or scroll to the top during input.
- Values remain after navigating away and returning.
