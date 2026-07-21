# Alpha.10 Test Checklist

1. Run `supabase/galaxy_cue_v6_event_action_center_documents.sql`.
2. Upload all files and hard refresh. Confirm v6.0.0-alpha.10.
3. Accept a new booking request.
4. Sign into Client Portal using the exact request email.
5. Confirm a gold **Complete your Event Booking Form** action appears.
6. Save a draft, sign out, sign back in, and confirm **Continue Event Form**.
7. Submit the form. Confirm it becomes a read-only document copy and workflow changes to Quote Preparation.
8. Business side: Events → select event → **Review Client Event Form**.
9. Confirm all submitted fields appear and can be printed/saved as PDF.
