# Test Checklist

1. Run `supabase/galaxy_cue_v6_lead_intake.sql`.
2. Sign into the Business Portal.
3. On Dashboard click **Copy Public Booking Link**.
4. Open the link in an incognito window.
5. Submit a booking request.
6. Refresh the Business Portal Dashboard; verify the request appears.
7. Test **Need More Info** and confirm status changes.
8. Submit a second request and choose **Decline**.
9. Submit a third request and choose **Accept & Create Event**.
10. Verify exactly one Client and one Event are created and the event workspace opens.
