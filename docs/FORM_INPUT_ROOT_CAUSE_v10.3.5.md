# Galaxy Cue v10.3.5 — Form Input Root Cause Fix

The global delegated click router used `closest('[data-module]')`. The form host (`#module`) itself has a `data-module` attribute, so clicking any input, textarea, select, or checkbox matched the host and called `navigateToModule()`. That rebuilt the workspace and scrolled to the top.

The router now responds only to explicit navigation controls: buttons, links, and role=button elements carrying `data-module`. Form controls no longer trigger navigation or DOM replacement.

The client connection UI is event-bound and compact. A linked client is shown as a summary with Open Client and Change Client actions; the full client card is not embedded in forms.
