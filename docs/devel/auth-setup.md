# Authentication, accounts and favorites sync

Accounts are **optional**. Visitors browse, search, favorite and click offers exactly as before; an
account only adds "my favorites on every device".

## How it works

| Piece | Where |
|---|---|
| Sessions | Supabase Auth through `@supabase/ssr` (PKCE, cookie session). No custom tokens, JWTs, cookies or password handling. |
| Browser client | `src/lib/supabase/client.ts` (publishable key only) |
| Server client | `src/lib/supabase/server.ts` (Server Components, Route Handlers) |
| Session refresh + `/conta` guard | `src/proxy.ts` + `src/lib/supabase/proxy.ts`, **only** for `/conta`, `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/auth/*` |
| Identity on the server | `supabase.auth.getClaims()` (verifies the token signature). `getSession()` is never used for authorization. |
| E-mail links | `src/app/auth/callback/route.ts` (code exchange or `token_hash`), `next` restricted to same-site paths |
| Favorites table | `supabase/migrations/20261005000000_create_favorites.sql` (RLS, see below) |
| Sync | `src/lib/favorites-sync.ts` (pure merge), `src/lib/favorites-api.ts`, `src/lib/favorites-context.tsx` |

Public pages (`/`, `/busca`, `/categorias`, `/produto/*`) never run the proxy and carry no session:
they stay statically cached (ISR). The header learns who is signed in **in the browser** after load.

### Environment

No new variables. `next.config.ts` exposes two existing server variables to the browser as
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Only the project URL and the
publishable key are exposed; `SUPABASE_SECRET_KEY` (service role) is **never** used by the website.

### Favorites table (`public.favorites`)

- Primary key `(user_id, offer_id)`: one offer per user, enforced by the database.
- `user_id` defaults to `auth.uid()`; the client never sends it.
- RLS enabled. Grants: `authenticated` has `select, insert, delete`; `anon` has nothing; nobody has `update`.
- Policies (one per command, `to authenticated`): SELECT, INSERT (`with check`), DELETE, all `auth.uid() = user_id`.

### Merge (device list + account)

Read account -> upload what the account lacks (`ON CONFLICT DO NOTHING`) -> load what the device lacks ->
only then update the device list. Any failure leaves the device list untouched and shows
"Não conseguimos sincronizar seus favoritos agora. Eles continuam salvos neste dispositivo."
Running it again changes nothing. Removals that failed are kept (`hibridlink:favorites-pending`) and
retried first, so the merge never brings a removed favorite back. Sample-data favorites (ids that are not
UUIDs) stay on the device.

Logout revokes the session and removes from the device only the favorites that are confirmed in the
account; anything that never synced stays local.

## Must be configured in the Supabase Dashboard (cannot be done from code)

1. **Authentication > URL Configuration**
   - Site URL: `https://hibridlink-promos.vercel.app`
   - Redirect URLs: `https://hibridlink-promos.vercel.app/**` and `http://localhost:3000/**`
   Without this the confirmation and recovery links are rejected.
2. **Authentication > Providers > Email**: keep "Confirm email" ON. The sign-up form respects the real
   project state: with confirmation on it shows "Verifique seu e-mail"; with it off it signs the user in.
3. **Authentication > Rate Limits**: review the defaults (sign-ins, sign-ups, e-mails per hour). The built-in
   limits are the abuse protection; the app adds none of its own.
4. **Authentication > Attack Protection**: enable CAPTCHA (Cloudflare Turnstile or hCaptcha) and, on plans that
   have it, leaked-password protection. **CAPTCHA is not implemented in the UI.** To turn it on, enable it
   in the dashboard and add the provider's widget token to the sign-in/sign-up/recovery calls
   (`options.captchaToken`); until then do not assume it is active.
5. **Authentication > Policies / Password**: set the minimum password length to at least 8 (the forms ask for
   8 with letters and numbers, but the server is the one that enforces it).
6. **E-mail sender**: the built-in sender is for testing and heavily rate limited. Configure custom SMTP
   before the public launch.

## Not done on purpose (next steps)

- **Account deletion.** It needs the service role on a trusted server. Do it as a Server Action that
  validates the session with `getClaims()` and deletes only `claims.sub`; that requires adding
  `SUPABASE_SECRET_KEY` to the web app's environment, which widens what a leaked web credential could do, so
  it is left as an explicit decision. Users cannot delete themselves from the UI yet.
- **Privacy Policy and Terms of Use** do not exist. Name, e-mail and favorites are now stored, so both must be
  written (and linked from the sign-up form) before authentication is announced publicly. The UI does not
  promise a policy that is not there.
- **MFA** is not implemented. Nothing here blocks it: Supabase MFA (TOTP) can be added with
  `supabase.auth.mfa.*` and an `aal2` check on `/conta`.
- **OAuth (Google etc.)** is not configured, so there are no such buttons.
