# Galaxy Cue v5.0.0-alpha.1

## Purpose
This is the first code release of the v5 architecture. It establishes the modular foundation while keeping the proven v4.2.4 application behavior intact.

## Test priorities
1. Load the dashboard with no console errors.
2. Sign in through the Resend/Supabase magic link.
3. Create a client and confirm duplicate prevention.
4. Create a local event and confirm it remains after refresh.
5. Confirm client ↔ event linking.
6. Test dashboard, clients, events, calendar and mobile navigation.

## Developer check
Open the browser console and run:

```js
window.GalaxyCue.version
```

Expected result:

```text
5.0.0-alpha.1
```
