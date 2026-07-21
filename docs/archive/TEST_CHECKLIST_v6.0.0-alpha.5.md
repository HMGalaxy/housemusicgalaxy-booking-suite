# Test Checklist — v6.0.0-alpha.5 Revised

## Supabase
- [ ] `galaxy_cue_v6_client_portal.sql` has been run successfully.
- [ ] The deployed `client-portal.html` URL is listed under Auth Redirect URLs.
- [ ] Email authentication is enabled in Supabase.

## Public booking request
- [ ] Open Client Portal from the Business Portal.
- [ ] Choose **Request a Booking**.
- [ ] Submit a request without signing in.
- [ ] Verify the request appears in the Business Portal.

## Magic-link authentication
- [ ] Choose **Continue Planning**.
- [ ] Enter the same email used for the booking request.
- [ ] Confirm the page says the secure link was sent.
- [ ] Open the email and click the magic link.
- [ ] Confirm the Client Portal opens without asking for a password.
- [ ] Confirm refresh preserves the signed-in session.
- [ ] Sign out and confirm the portal returns to **Send Secure Link**.

## Client data isolation
- [ ] The client sees only booking requests matching their verified email.
- [ ] Accepted events linked to that client email appear.
- [ ] A different client email cannot see those records.

## Regression
- [ ] No password field is displayed.
- [ ] No Create Account tab is displayed.
- [ ] No Forgot Password action is displayed.
- [ ] Public Booking Request remains available without authentication.
