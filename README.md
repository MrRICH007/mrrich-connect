# MR RICH CONNECT — production starter

A Next.js + Supabase starter for the dark navy / blue campus-community chat product. It includes an interactive shell and an initial database model with row-level security. **This is not yet a complete production chat service**: the conversation picker, request acceptance workflow, media storage, robust online-time accounting, admin dashboard, payment checkout/webhooks, moderation, and end-to-end QA still need implementation before public launch.

## Stack
- Next.js 14 + TypeScript
- Supabase Auth, Postgres, Realtime, and Storage
- Dark navy and electric-blue responsive UI

## 1. Create the managed backend
1. Create a Supabase project at https://supabase.com/.
2. In **Project Settings → API**, copy the Project URL and anon/public key.
3. Copy `.env.example` to `.env.local` and fill in those two values. The anon key is designed for browser use with correctly configured RLS. Never put a service-role key in `NEXT_PUBLIC_*` or commit secrets.
4. Open Supabase **SQL Editor**, paste and run `supabase/schema.sql`.
5. In **Authentication → URL Configuration**, set your local redirect URL (`http://localhost:3000/**`) and later your deployed domain. Configure email confirmation and SMTP appropriate for your expected traffic.
6. Register your own account, then copy its Auth user UUID from the dashboard. Run the final `insert into public.admin_users...` statement from the schema with that UUID to grant yourself super-admin access. Do this only for an account you control.

## 2. Run locally
Requires Node.js 20 or later.

```bash
npm install
cp .env.example .env.local
# edit .env.local
npm run dev
```

Open http://localhost:3000.

## 3. Deploy with managed hosting
1. Push this folder to a private GitHub repository.
2. Import the repository into Vercel (https://vercel.com/).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project environment variables.
4. Deploy, then add the production domain to Supabase Auth's allowed redirect URLs.
5. Test account creation, email confirmation, sign-in, profile privacy, RLS, and session expiry on the deployed URL before inviting members.

Vercel and Supabase each require the account owner to create/connect their own account and accept their terms. No credentials are included in this project.

## Registration and privacy design
The requested registration fields are: name, phone number, nickname, department, level, college, email, and school. The public `profiles` table intentionally contains only nickname, level, college, school, avatar, bio, premium state, and online-time totals. Name, phone, department, and email should be captured in a separate private signup flow / protected server endpoint or appropriate Auth user metadata with strict server-side access controls. Do not copy them into the public profile table or expose them through directory queries. For phone verification, enable an OTP provider only if/when you choose to require it; current requested default is email/password.

## Important next implementation steps
- Build a complete signup form for all requested fields while keeping private fields private.
- Add a server-side profile creation trigger or verified server action, nickname collision handling, avatar upload and moderation.
- Add a private conversation creation RPC that only creates a one-to-one conversation after a request is accepted. Add recipient accept/decline UI and ensure users cannot add themselves to arbitrary private conversations. Review/tighten the illustrative membership policies before launch.
- Add a conversation list, realtime message subscription, read receipts, typing indicators, block/report, rate limiting and anti-spam controls.
- Add secure group invitations, membership changes, group realtime chat, and role enforcement.
- Track online presence using Supabase Realtime Presence for live counts; record online-time using a trusted server/Edge Function heartbeat with rate limits and idle cutoff. Never let clients freely write arbitrary rank totals.
- Create a server-protected `/admin` dashboard. Only admin users may upload campaigns, set start/expiry dates, disable campaigns or review premium requests. Keep ad expiry enforced in database queries as well as the UI.
- Create private Storage buckets and storage RLS policies for avatars and admin-uploaded media. Serve ad media via signed URLs or a deliberately public ads bucket.
- For paid premium, choose a payment provider available to your business and region. Create checkout sessions server-side and verify signed payment webhooks before activating `premium_entitlements`. Never trust a client success redirect as proof of payment. Admin approvals should be audit logged.
- Add email verification, password reset, account deletion/export, terms, privacy notice, abuse reports, rate limiting, backups, error monitoring and accessibility/mobile QA.

## Advertising
`ad_campaigns` supports image/video type, storage path, start time, expiry, enable/disable, and admin ownership. The expiry policy prevents expired campaigns from being selected as active by authenticated users. Build the public landing-page query to select only campaigns where `is_enabled = true`, `starts_at <= now()`, and `expires_at > now()`; decide whether ads should be visible to logged-out visitors before choosing a public read policy.

## Ranks and premium
Ranks should be derived from server-verified online seconds (e.g. Newcomer, Active, Connector, Community Star) rather than user-editable labels. Premium status and title should be changed only by an admin workflow or a verified payment webhook.

## Production warning
The included SQL is a strong starting point, not a security audit. Before public launch, review every RLS policy and all RPC/Edge Function authorization with at least two test accounts and an admin account. Do not launch payments or collect real users' personal data until those tests, privacy disclosures, retention rules, and abuse controls are complete.
