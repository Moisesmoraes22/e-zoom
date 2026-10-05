# Authentication, accounts and favorites sync

Accounts are **optional**. Visitors browse, search, favorite and click offers exactly as before; an
account only adds "my favorites on every device".

## How it works

| Piece | Where |
|---|---|
| Sessions | Supabase Auth through `@supabase/ssr` (PKCE, cookie session). No custom tokens, JWTs, cookies or password handling. |
| Browser client | `src/lib/supabase/client.ts` (publishable key only; the site runs as visitor-only if the variables are missing) |
| Server client | `src/lib/supabase/server.ts` (Server Components, Route Handlers) |
| Session refresh + `/conta` guard | `src/proxy.ts` + `src/lib/supabase/proxy.ts`, **only** for `/conta`, `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/auth/*` |
| Identity on the server | `supabase.auth.getClaims()` (verifies the token signature). `getSession()` is never used for authorization. |
| E-mail links | `src/app/auth/callback/route.ts` (code exchange or `token_hash`) |
| Redirect target (`next`) | `safeNext` / `safeLoginNext` in `src/lib/auth/validate.ts` |
| Favorites table | `supabase/migrations/20261005000000_create_favorites.sql` (RLS, see below) |
| Sync | `src/lib/favorites-sync.ts` (pure merge), `src/lib/favorites-api.ts`, `src/lib/favorites-context.tsx` |

Next.js 16 note: the file is `src/proxy.ts` (the old `middleware.ts` name is deprecated) and runs on the
Node.js runtime.

### Public pages stay public and cached

`/`, `/busca`, `/categorias`, `/categoria/*`, `/produto/*` never run the proxy, never read cookies and are
served with `s-maxage=300, stale-while-revalidate` (ISR). The header learns who is signed in **in the
browser**, after load, so no personalized HTML exists to be cached. The account routes answer with
`Cache-Control: private, no-store` and are rendered per request. Nothing in `src/` uses `unstable_cache` or
fetch caching for user data; the only cached data is the public offers catalog.

### Environment

No new variables are required. `next.config.ts` hands two existing server variables to the browser:
`SUPABASE_URL` -> `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` ->
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. If you prefer the standard names, define the two `NEXT_PUBLIC_*`
variables (Vercel and `.env.local`); they take precedence and nothing else changes. The build **fails** if the
value that would reach the browser is an `sb_secret_...` key or a `service_role` JWT. The secret key is used only
by the collector engine, never by the website.

### Favorites table (`public.favorites`)

- Primary key `(user_id, offer_id)`: one offer per user, enforced by the database.
- `offer_id` references `offers(id)` and `user_id` references `auth.users(id)`, both `ON DELETE CASCADE`.
- `user_id` defaults to `auth.uid()`; the client never sends it (`favorites-api.ts` sends only `offer_id`).
- RLS enabled. Grants: `authenticated` has `select, insert, delete`; `anon` has nothing; nobody has `update`.
- Policies (one per command, `to authenticated`): SELECT `using`, INSERT `with check`, DELETE `using`, all
  `(select auth.uid()) = user_id`.
- The id the site stores for a favorite is `offers.id` (a UUID) for real offers. Sample-data favorites (ids such as
  `d1`) are not offers and stay on the device only.

### Merge (device list + account)

Retry earlier failed removals -> read the account -> upload what the account lacks (`ON CONFLICT DO NOTHING`) ->
read the account back and require every uploaded id -> load what the device lacks -> only then update the device
list. Any failure leaves the device list untouched and shows "Não conseguimos sincronizar seus favoritos agora. Eles
continuam salvos neste dispositivo."; "Seus favoritos estão sincronizados." appears only after all steps are confirmed.
Running it again changes nothing. Removals that failed are kept (`hibridlink:favorites-pending`) and retried first.

### Logout

`signOut()` revokes the refresh token and clears the session cookies. The device then drops every favorite that is
known to belong to the account (`hibridlink:favorites-account` remembers them across reloads, so this also works if
the session expired while the site was closed). Favorites that never reached the account stay on the device.

### E-mail flows

Confirmation and recovery use the official Supabase flow: the page calls `signUp` / `resetPasswordForEmail` with
`redirectTo = <origin>/auth/callback?next=...`; Supabase e-mails its own link, which returns to the callback with a
one-time `code` (PKCE) or `token_hash`; the callback exchanges it, sets the session cookies and answers with a 302,
so the code is not left in the address bar or sent as a referrer. The callback only follows same-site `next` paths.
No token, password or e-mail address is ever put in a URL by the app.

## CHECKLIST ANTES DO LANÇAMENTO

Nothing below was done by the code; each box must be ticked by a person after doing it for real.

### Supabase Dashboard
- [x] Site URL configurada no Supabase (`https://e-zoom.vercel.app`)
- [x] Redirect URLs configuradas (`https://e-zoom.vercel.app/**` e `http://localhost:3000/**`)
- [x] confirmação de e-mail revisada ("Confirm email" ligado)
- [x] senha mínima definida (pelo menos 8; os formulários pedem 8 com letras e números, mas quem impõe é o servidor)
- [ ] Rate Limits revisados
- [ ] Attack Protection revisado
- [ ] CAPTCHA avaliado (ver "CAPTCHA")

### E-mail
- [ ] SMTP próprio configurado (o remetente padrão do Supabase é só para teste e muito limitado)
- [ ] SPF configurado
- [ ] DKIM configurado
- [ ] DMARC configurado

### Jurídico e dados
- [x] Política de Privacidade publicada (base técnica: `docs/devel/personal-data-inventory.md`)
- [x] Termos de Uso publicados
- [x] exclusão de conta definida (manual, por e-mail, até 15 dias: já descrita na Política) (ver "Exclusão de conta")

### Testes reais (precisam de uma conta de verdade, feitos por uma pessoa)
- [x] teste real de cadastro
- [x] teste real de login
- [x] teste real de confirmação
- [x] teste real de recovery
- [x] teste real de logout (conferir também que `/conta` volta a pedir login e que os favoritos da conta saem da tela)
- [x] teste real de sincronização (dois navegadores, favoritos diferentes em cada um)

## CAPTCHA

Not implemented and **not active**. The project is ready to add it without restructuring: every credential call is
a single `supabase.auth.*` call in `login-form.tsx`, `signup-form.tsx` and `recover-form.tsx`, and Supabase accepts
`options: { captchaToken }` on `signInWithPassword`, `signUp` and `resetPasswordForEmail`.

- **When to add it:** as soon as there is public traffic, or earlier if the Auth logs show bursts of sign-ups, many
  failed sign-ins from one address, or a spike in e-mails sent (each sign-up/recovery sends an e-mail).
- **Where it is configured:** Dashboard > Authentication > Attack Protection (Cloudflare Turnstile or hCaptcha, with
  the secret key stored in the Dashboard, never in this repo). Then render the provider's widget in the three forms and
  pass its token as `captchaToken`. With CAPTCHA enabled in the Dashboard but no token sent, the calls fail: enable
  it only together with the code.
- **What already protects the project without it:** Supabase Auth's built-in rate limits (per IP and per e-mail send
  limits), neutral responses that do not reveal whether an address has an account, and the fact that a password is
  only accepted after Supabase verifies it. These limits are reviewed in the checklist above.

## Exclusão de conta

Not implemented on purpose. Deleting a user needs the Admin API (service role), which must only run on a trusted
server:

- It would be a **Server Action** (or Route Handler) that first validates the session with `getClaims()`, requires a
  fresh password/confirmation step, and deletes **only** `claims.sub` with `auth.admin.deleteUser(claims.sub)`.
  Never accept a user id from the request, and never call the Admin API from the browser.
- It requires adding `SUPABASE_SECRET_KEY` to the web app's environment (today only the collector engine has it).
  That widens what a leaked web credential could do, so it is a deliberate decision, not a side effect.
- Data removal: `favorites` rows disappear automatically (`ON DELETE CASCADE` from `auth.users`). Nothing else in
  `public` references a user. Supabase removes the Auth record, sessions and refresh tokens.
- The confirmation must state clearly that the action is permanent and what is deleted; the device list is kept (it
  is the visitor's own local data) unless the user also clears it.
- Until it exists, the only path is a manual deletion by the project owner in the Dashboard (Authentication > Users),
  and the Privacy Policy must say how to request it.

## Not done on purpose

- **MFA** is not implemented. Nothing blocks it: Supabase MFA (TOTP) can be added with `supabase.auth.mfa.*` and an
  `aal2` check in the proxy/`/conta`.
- **OAuth (Google etc.)** is not configured, so there are no such buttons.
- **Privacy Policy and Terms** are not written here; the UI does not promise a policy that does not exist.
