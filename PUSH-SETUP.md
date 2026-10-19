# MR RICH CONNECT: unread counts + web push setup

## 1. Apply SQL
Run `mrrich-push-subscriptions.sql` in Supabase SQL Editor. This creates per-user read timestamps, secure RPCs for unread counts, and a private push-subscription table.

## 2. Add the files
- Replace `app/page.tsx` with `page.tsx` from this package.
- Replace `app/globals.css` with `globals.css` from this package.
- Add `public/sw.js` to your site's `public` folder.
- Add `app/api/push/subscribe/route.ts` to your app.

The API route uses the existing `@supabase/supabase-js` dependency. Do not expose `SUPABASE_SERVICE_ROLE_KEY` as a `NEXT_PUBLIC_` variable.

## 3. Configure VAPID keys
Generate a VAPID key pair locally with `npx web-push generate-vapid-keys` (or a trusted VAPID generator). In Render environment variables set:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = the public key
- `VAPID_PUBLIC_KEY` = the same public key (Supabase Edge Function secret)
- `VAPID_PRIVATE_KEY` = the private key (Supabase Edge Function secret only)
- `VAPID_SUBJECT` = a contact URI such as `mailto:your-admin-email@example.com`

Never put the VAPID private key or Supabase service-role key in client-side code or a `NEXT_PUBLIC_` variable.

## 4. Deploy push sender Edge Function
Deploy `supabase/functions/send-message-push/index.ts` as a Supabase Edge Function named `send-message-push`. Set its secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `MESSAGE_PUSH_WEBHOOK_SECRET` = a long random secret

Configure a Supabase Database Webhook on `public.messages`, event **INSERT**, targeting the Edge Function URL. Send header `x-webhook-secret: <same MESSAGE_PUSH_WEBHOOK_SECRET>` and JSON body containing the inserted row (Supabase Database Webhooks default payload is compatible). Ensure the webhook is restricted to the function URL and secret.

## 5. Test
Deploy Render, sign in on each phone, open Messages, tap the bell/notification button, and allow notifications. Send a message from the other phone while the first is backgrounded. Unread counts are computed from the database and should persist across reloads and devices. Web push requires HTTPS, browser support, permission, a valid VAPID pair, the deployed Edge Function, and the Database Webhook.

## Notes
- The browser's notification permission alone does not deliver push while a page is closed; the Edge Function + Database Webhook is required.
- Some mobile browsers only support web push after the site is installed as a PWA or opened from the browser's supported context.
- Keep RLS enabled. The push subscriptions table intentionally has no client-side read policy.
