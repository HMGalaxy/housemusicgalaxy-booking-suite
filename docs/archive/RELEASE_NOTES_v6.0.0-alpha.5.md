# Galaxy Cue v6.0.0-alpha.5
## Public Booking + Magic Link Client Portal (Revised)

### Added
- Dedicated `client-portal.html` entry point.
- Passwordless Supabase Magic Link access for clients.
- Public Booking Request form without requiring an account.
- Authenticated Client Portal dashboard showing the client’s requests and accepted events.
- Client-facing workflow progress for accepted events.
- Booking Request form available from the public portal and inside the authenticated portal.
- Business Portal button opens the organization-linked Client Portal.
- Client-safe RLS policies based on the verified Supabase Auth email.

### Revised in this build
- Removed password sign-in.
- Removed client account registration.
- Removed password-reset flow.
- Replaced all client authentication with **Send Secure Link**.
- Magic-link redirect preserves the organization booking context.

### Supabase setup
1. Run `supabase/galaxy_cue_v6_client_portal.sql` once if it has not already been applied.
2. In Supabase Auth → URL Configuration, add the deployed `client-portal.html` URL to Redirect URLs.
3. Confirm Email provider and Magic Link emails are enabled.

### Not included yet
- Automatic invitation email immediately after the organization accepts a request.
- Organization-branded portal domains.
- Client editing of the detailed Event Form.
