## 5.0.0-alpha.13

- Pixel-aligned week/day calendar timeline.
- Shared header/body grid prevents scrollbar-related column drift.
- Sticky weekday header and sticky time rail.
- Preserves unified favicon, app icon, email avatar, and BIMI files from alpha.12.

## 5.0.0-alpha.12
- Unified favicon, app icon, and email avatar around the existing GC mark.
- Added dark charcoal background, titanium edge, optimized padding, and platform-specific sizes.
- Updated manifest and favicon declarations.

## 5.0.0-alpha.11

- Added the full working-time range to Week and Day calendar blocks.
- Added client name, event type, and venue/location to each timeline job block.
- Improved compact calendar typography for desktop and mobile.
- Updated release metadata and cache identifiers.

## 5.0.0-alpha.10

- Added automatic cloud save for every workspace change while signed in.
- Added a 900 ms debounce so typing does not create excessive network requests.
- Form submissions and explicit saves sync immediately.
- Local storage is now used as the primary event store only while signed out.
- Updated workspace labels to show automatic cloud-sync behavior.

# Changelog

## 5.0.0-alpha.1 — Foundation Alpha

- Frozen from the working v4.2.4 local events/client-link build.
- Added a versioned v5 bootstrap runtime exposed as `window.GalaxyCue`.
- Added a decoupled event bus for future feature modules.
- Added a small central store for gradual state migration.
- Added safe shared JSON storage utilities.
- Added module boundaries for CRM, dashboard, calendar, quotes, contracts, payments, documents and automation.
- Preserved the existing authentication, Supabase, local mode, client, event, calendar and mobile-menu behavior.
- Updated cache-busting assets to `5.0.0-alpha.1`.

This alpha intentionally uses staged extraction rather than a high-risk full rewrite.

## 5.0.0-alpha.2 — Event Actions Fix

- Fixed event editing from the Events screen.
- Added event deletion with confirmation.
- Preserved existing event workspace data while changing core event details.
- Added local and cloud deletion support.

## 5.0.0-alpha.3
- Fixed the stale header version indicator.
- Added build timestamp and release metadata.
- Added Settings > Build Information.
- Added one-click cache clearing and hard reload.


## 5.0.0-alpha.4
- Functional month, week, and day calendar.
- Calendar navigation and event workspace linking.
- Responsive agenda and daily schedule views.

## 5.0.0-alpha.5
- Added hour-by-hour timeline layouts to Week and Day calendar views.
- Event blocks now span their scheduled start/end duration.
- All time inputs use 15-minute increments and snap typed values to the nearest quarter hour.
- Event start and end times now persist in local and Supabase event records.

## 5.0.0-alpha.7
- Made setup start, setup end, event start, and event end mandatory in the quick event form.
- Added the same four required scheduling fields to wedding, corporate, and private consultation forms.
- Added the same four required scheduling fields to all event planner forms.
- Preserved 15-minute increments across every scheduling field.
- Quick event editing now loads and saves all four scheduling values.

## 5.0.0-alpha.7
- Added continuous 00:00–06:00 next-day calendar timelines.
- Added overnight event-duration handling.
- Added separate Setup and Event blocks in Week and Day views.
- Added next-day `(+1)` time labels.

## 5.0.0-alpha.8
- Fixed timeline scale and weekday alignment.
- Locked Week/Day calendars to vertical scrolling only.
- Corrected timed block geometry and overlap lanes.
- Replaced Setup End with required Breakdown End.
- Added Setup, Event, and Breakdown calendar phases.

## 5.0.0-alpha.9
- Calendar Week and Day views now render each booking as one continuous working-time block.
- Setup and breakdown phases use red fills.
- Live event phase retains the event-type color.
- One outer outline spans Setup Start through Breakdown End.
- Overlap lane calculations now use the complete job window.


## v5.0.0-alpha.14
- Smart Auto / Light / Dark themes
- Local preference fallback and signed-in cloud preference sync
- Dynamic browser and PWA theme color
- Smooth theme transitions


## v5.0.0-alpha.17
- Finalized the application styling around one optimized dark theme.
- Removed automatic day/night switching and the Appearance selector.
- Removed light-theme CSS and theme preference syncing.
- Retained approved favicon/app/email icon assets.

## v5.0.0-alpha.17
- Added lightweight BIMI-ready vector logo for supported email inbox branding.
- Added deployment and GoDaddy DNS instructions.

## v5.0.0-alpha.17
- Fixed mobile New Event modal viewport overflow and stuck positioning.
- Added mobile-safe vertical scrolling, one-column fields, safe-area padding, and background scroll lock.


## v5.0.0-alpha.18
- Replaced the mobile full-screen New Event modal with the same inline detail-panel behavior used by New Client.


## v5.0.0-alpha.20
- Replaced the desktop New Event modal with the same inline detail-panel workflow used on mobile and by New Client.
- Event editing also uses the consistent inline Events panel.


## v5.0.0-alpha.21
- Normalized Music Planner and Files / Upload Center typography.
- Added shared font variables and explicit inheritance for native form controls.

## v5.0.0-alpha.22
- Corrected the previous typography fix by targeting the active workspace modules directly.
- Music Planner and Files / Upload Center now match the CRM typography across headings and controls.

## v5.0.0-alpha.23
- Unified all primary page titles under one global CRM typography rule.
- Fixed inconsistent Music Planner, Files and Messages title appearance.
- Restored complete desktop and mobile sidebar scrolling.

## 6.0.0-alpha.1 — Workflow Foundation
- Added centralized event workflow state machine.
- Added Organization/Client ownership and validated transitions.
- Added persistent workflow history and contract/deposit completion gate.
- Added workflow controls to Event Workspace and Client Portal preview.

## 6.0.0-alpha.5 — Public Booking + Magic Link Client Portal
- Added passwordless client access through Supabase Magic Links.
- Added public and authenticated client Booking Request form.
- Added client-safe RLS policies and event/request visibility by verified email.
- Added Business Portal link to the organization-specific Client Portal.
- Removed client passwords, registration, and password-reset flows.
