# Galaxy Cue — Step 1 Foundation

This repository is the clean foundation for the Galaxy Cue platform.

## Applications

- `apps/admin/` — Galaxy Cue Admin OS
- `apps/business/` — Galaxy Cue Business OS
- `apps/client/` — Galaxy Cue Client App

## Shared platform code

- `shared/css/` — design tokens and global styles
- `shared/js/` — shared browser utilities
- `shared/components/` — reusable UI components
- `shared/assets/` — shared images and icons

## Feature modules

Modules are separated by domain under `modules/`:

- events
- clients
- quotes
- contracts
- planning
- timeline
- calendar
- workflow

## GitHub Pages

Set GitHub Pages to deploy from:

- Branch: `main`
- Folder: `/ (root)`

The root `index.html` redirects to the Business OS.
