# Galaxy Cue v9.0.0 architecture

## Application entry points

- `apps/admin/` — platform administration
- `apps/business/` — entertainment company workspace
- `apps/client/` — client event portal

Each app loads its own local entry file using an absolute URL derived from `window.location.href`. This avoids `<base>` path conflicts on GitHub Pages while preserving root-relative assets.

## Shared platform

- `config/app.config.js` is the canonical public runtime configuration.
- `shared/js/` contains shared Supabase, state, storage, workflow and module code.
- Root HTML files are compatibility redirects only.

## Authentication redirects

Magic links return to the exact current application path. Supabase should allow:

`https://hmgalaxy.github.io/housemusicgalaxy-booking-suite/**`
