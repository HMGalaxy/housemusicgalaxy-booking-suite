# Test Checklist — v6.0.0-alpha.8

1. Run `supabase/galaxy_cue_v6_event_activation_client_form.sql`.
2. Upload all build files, replacing old files.
3. Hard refresh; business badge must show `6.0.0-alpha.8`.
4. Submit a public booking request using a client email.
5. Business: accept the request.
6. Open `client-portal.html`; verify only the magic-link email box appears.
7. Sign in with the exact booking-request email.
8. Confirm the accepted event appears and the Event Booking Form opens.
9. Save a draft, reload, and confirm the saved information remains.
10. Submit the form.
11. Confirm the client portal says submitted.
12. Business: reload the event and verify the entered details are present and workflow is Quote Preparation.
