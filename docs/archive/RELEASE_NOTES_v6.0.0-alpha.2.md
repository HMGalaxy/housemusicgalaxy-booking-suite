# Galaxy Cue v6.0.0-alpha.2 — Lead Intake & Workflow Entry

## Included
- Public booking request page via `?book=BUSINESS_ID`
- Dashboard New Booking Requests panel
- Accept and convert to Client + Event
- Need More Info and Decline states
- Local fallback and Supabase persistence
- SQL migration: `supabase/galaxy_cue_v6_lead_intake.sql`

## Install
1. Upload this build.
2. Run the new SQL migration in Supabase SQL Editor.
3. Sign into the Business Portal.
4. Copy the public booking link from the Dashboard.

- RLS-safe anonymous submission: public requests insert without requiring anonymous SELECT permission.
