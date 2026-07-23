# Galaxy Cue v10.3.3 — Form Input Regression Fix

The Smart Form/workflow bridge introduced background workflow reconciliation from the form input path. This release restores the original stable behavior for consultation and planning forms:

- Typing only updates the active form draft and local storage.
- The active form DOM is not replaced or reconciled while typing.
- Workflow propagation runs on explicit Save Now or form completion.
- Cloud synchronization remains available through Save Now / Sync Now.

Affected forms include Wedding, Corporate, Private Event, Quote, Contract, all planning forms, and Timeline.
