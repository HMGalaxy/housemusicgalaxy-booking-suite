# Changelog

## v7.0.1

- Fixed Business OS startup when older browser storage contains invalid JSON.
- Bundled each application entry point to remove fragile nested module-path loading on GitHub Pages.
- Added startup watchdog and clearer deployment diagnostics.
- Updated cache-busting identifiers to 7010.


## 7.0.1 — Foundation Milestone

- Renamed the active release and internal root folder to v7.0.1.
- Created real `apps/admin`, `apps/business`, and `apps/client` application entries.
- Moved shared CSS, Supabase services, form definitions and workflow core into `shared/`.
- Added `modules/` domain boundaries and `config/` platform configuration.
- Preserved root compatibility URLs through redirects.
- Preserved existing Supabase migrations and working business/client functionality.
- Updated active application titles, cache keys and visible version labels to v7.0.1.
