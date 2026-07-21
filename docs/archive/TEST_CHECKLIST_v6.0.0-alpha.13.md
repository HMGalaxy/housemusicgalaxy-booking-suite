# Alpha.13 test checklist

1. Run `supabase/galaxy_cue_v6_alpha13_platform_separation.sql`.
2. Add your Supabase auth user UUID to `platform_admins` as `owner`.
3. Upload all files.
4. Open `admin.html`, request a magic link and confirm Admin OS loads.
5. Confirm Admin Dashboard counts and Businesses list load.
6. Confirm `index.html` still opens Business OS.
7. Confirm `client-portal.html` still opens Client App.
8. Confirm a non-admin account is denied access to Admin OS.
