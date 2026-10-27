# MR RICH CONNECT admin update

## Included files
- `app/page.tsx` — updated Messages screen (balanced message-edge spacing, clickable 16:9 advert, admin shortcut).
- `app/admin/page.tsx` — restricted admin dashboard with live-as-you-type user/group search, private-profile visibility, Premium/block/delete controls, group settings, and image advert upload.
- `app/api/admin/**` — server-side API routes. These validate the signed-in user and the existing `is_admin()` RPC before using the service-role key.
- `lib/admin-server.ts` — server-only admin authorization helper.
- `supabase_admin_migration.sql` — small schema/storage setup migration.

## Before deploying
1. Back up the repository and Supabase database.
2. Copy the included `app/page.tsx` over your existing `app/page.tsx`.
3. Add the other included files at the exact paths shown in the package.
4. Run `supabase_admin_migration.sql` in Supabase SQL Editor.
5. In Render environment variables, confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` exist. The service-role key must only be used by server routes and must never be prefixed with `NEXT_PUBLIC_`.
6. Add `ADMIN_PROTECTED_USER_ID` with the owner's exact Supabase Auth user UUID. This is required for the API to prevent the owner account from being blocked or deleted. Do not guess the UUID.
7. Ensure the owner is in the existing `admin_users` table (the existing `is_admin()` RPC must return true for the owner). Sign in and open `/admin`.
8. Run the project's normal build (`npm run build`) and verify login, private-profile reads, group settings, account block/unblock, and ad upload before relying on the feature.

## Important behavior and limitations
- User search matches nickname, level, and school, with results refreshed as you type. The API currently loads up to 1,000 profile rows per search; for larger communities, add server-side pagination.
- Deleting a user uses Supabase Auth admin deletion. Review your foreign-key cascade rules before using it in production.
- Group delete removes the group row and then attempts to remove its linked conversation. Review your existing cascade rules and test against a nonessential group first.
- Group settings are saved in the existing `groups` table. Premium-only settings are stored, but the app's join/send-message flows must also enforce `is_premium_only` and active Premium status before this is a complete access-control feature.
- Blocking applies an Auth ban and sets `profiles.is_blocked`; unblock removes the Auth ban. Configure the protected owner UUID first.
- The advert bucket is public-read so users can view images. Uploads and database inserts happen server-side after admin verification.
- This package has had syntax-level checks only; a full Next.js build and live Supabase integration test have not been run in this environment.
