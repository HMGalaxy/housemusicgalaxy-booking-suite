# Galaxy Cue v10.3.2 Forms QA Fix

Symptoms addressed:
- Form opens but typing does not remain visible.
- Input loses focus.
- Page jumps to the top while typing.

Root behavior corrected:
- The prior input listener ran the full workflow synchronization and persistence path on every keystroke.
- Form drafts now update in memory immediately and persist through a 700 ms debounce without rebuilding the workspace.
- Scroll and focus are preserved during background persistence.
- Full workflow reconciliation still runs on debounced persistence and explicit form submission.
