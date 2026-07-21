# Galaxy Cue v6.0.0-alpha.4
## Lead Intake Reliability & Review

This is a real functional update built from the working alpha.2 lead-intake code.

### Added
- Four-step public Booking Request wizard
- Progress indicator and per-step validation
- Full Booking Request review modal in the Business Portal
- Accept, Need More Info, and Decline actions inside the review modal
- Organization notes displayed on pending requests
- Clipboard fallback when the browser blocks automatic copying

### Fixed
- Public cloud submission no longer silently falls back to browser-only storage. A failed Supabase submission now shows an error so requests cannot appear successful while remaining invisible to the organization.
- Lead conversion now stops and reports an error if Client or Event cloud creation fails.
- Duplicate conversion is blocked for already accepted requests.
- CSS and JavaScript cache identifiers now both use `600a4`.

### Database
No new migration is required. This release uses the existing `public.booking_requests` table.
