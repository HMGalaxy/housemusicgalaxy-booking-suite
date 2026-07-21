# Test Checklist — v6.0.0-alpha.9

1. Run `supabase/galaxy_cue_v6_event_activation_client_form.sql`.
2. Upload every file in this build, replacing existing files.
3. Hard-refresh. Confirm the business top-right badge shows `v6.0.0-alpha.9`.
4. Submit a new public booking request using a client email.
5. In the business portal, click **Accept & Create Event**.
6. Open `client-portal.html`, enter the exact same client email, and use the magic link.
7. Confirm the accepted event appears and the Event Booking Form opens.
8. Save a draft, reopen, and verify values remain.
9. Submit the form.
10. Return to the business portal and confirm workflow state is **Quote Preparation**.
