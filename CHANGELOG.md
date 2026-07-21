# Galaxy Cue v7.0.5

- Reliable Admin OS access check through `get_my_platform_access()`.
- Activation SQL now installs the access function and activates the signed-in user.
- Wider, better-spaced admin card and properly contained GC mark.

# Galaxy Cue v7.0.5

- Bundled each application stylesheet directly into its app entry page so GitHub Pages cannot render an unstyled interface if shared CSS paths are stale or incompletely uploaded.
- Updated cache/version identifiers.

# Changelog

## v7.0.5

- Fixed Business OS startup when older browser storage contains invalid JSON.
- Bundled each application entry point to remove fragile nested module-path loading on GitHub Pages.
- Added startup watchdog and clearer deployment diagnostics.
- Updated cache-busting identifiers to 7040.


## 7.0.2 — Foundation Milestone

- Renamed the active release and internal root folder to v7.0.5.
- Created real `apps/admin`, `apps/business`, and `apps/client` application entries.
- Moved shared CSS, Supabase services, form definitions and workflow core into `shared/`.
- Added `modules/` domain boundaries and `config/` platform configuration.
- Preserved root compatibility URLs through redirects.
- Preserved existing Supabase migrations and working business/client functionality.
- Updated active application titles, cache keys and visible version labels to v7.0.5.

## v7.0.5
- Improved Admin OS login form spacing, sizing, and mobile layout.
- Added explicit magic-link success messaging.
- Added an authorization activation screen showing the exact authenticated user ID.
- Added one-click copy for the required `platform_admins` SQL statement.
- Added access re-check and sign-out actions.

## v7.0.5 — Client Login Redirect Fix
- Fixed client magic-link redirect resolving to `/apps/client/client-portal.html` and returning GitHub Pages 404.
- Client links now return directly to `/apps/client/`.
- Corrected nested application bundle paths to use local `./app.bundle.js` references.
- Corrected nested asset paths for Admin, Business, and Client applications.
