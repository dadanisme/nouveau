# Deploying Nouveau Web

Checklist for putting the web client on Vercel at `https://app.nouveau.my.id`. Nothing here has
been done yet; tick the matching items in `PROGRESS.md` and list every change in its "External
changes log" as you go. **Add entries only: never edit or remove existing Supabase, Google or
DNS entries** (the mobile app depends on them).

`<project-ref>` below is the subdomain of the Supabase project URL, i.e. the host part of
`VITE_SUPABASE_URL` (`https://<project-ref>.supabase.co`).

## 1. Vercel project

Import the Git repository as a new project with these settings.

| Setting                                                              | Value                                                      |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| Root Directory                                                       | `web`                                                      |
| Include source files outside of the Root Directory in the Build Step | **Enabled** (the build type-checks `../types/supabase.ts`) |
| Framework Preset                                                     | Vite                                                       |
| Install Command                                                      | `bun install --frozen-lockfile`                            |
| Build Command                                                        | `bun run build`                                            |
| Output Directory                                                     | `dist`                                                     |
| Production Branch                                                    | `main`                                                     |

The install, build and output values are also in `web/vercel.json`, which wins over the
dashboard. `vercel.json` also rewrites every non-asset path to `index.html` (client-side
routing), caches `/assets/*` (hashed file names) for a year as `immutable`, and makes
everything else revalidate.

Environment variables (Production, and Preview if previews should work). Names only; copy the
values from the root `.env.local` (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`
hold the same values). They are compiled into the bundle at build time, so redeploy after
changing them.

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_KEY` (the publishable/anon key, never the service-role key)

## 2. Domain and DNS

- [ ] Vercel → Project → Settings → Domains → add `app.nouveau.my.id`.
- [ ] At the DNS provider for `nouveau.my.id`, add one record:

  | Type    | Name  | Value                                                                             | TTL  |
  | ------- | ----- | --------------------------------------------------------------------------------- | ---- |
  | `CNAME` | `app` | the target Vercel shows for the domain (generic fallback: `cname.vercel-dns.com`) | Auto |

  If the zone is on Cloudflare, set the record to **DNS only** (grey cloud) so Vercel can issue
  the certificate.

- [ ] Wait for Vercel to show the domain as valid with a certificate.

## 3. Supabase Auth URL configuration

Supabase dashboard → Authentication → URL Configuration → **Redirect URLs** → add:

- [ ] `https://app.nouveau.my.id`
- [ ] `http://localhost:5173`

The app passes `window.location.origin` as `redirectTo` (Google sign-in) and `emailRedirectTo`
(sign-up confirmation). Supabase only honours a redirect target that is in this list; anything
else silently falls back to the Site URL. Leave the **Site URL** as it is: mobile sign-up emails
rely on it.

## 4. Google Cloud OAuth client

How the web flow works: `signInWithOAuth({ provider: 'google' })` sends the browser to
`https://<project-ref>.supabase.co/auth/v1/authorize`, Supabase redirects to Google, Google
redirects back **to Supabase** (`/auth/v1/callback`), and Supabase then redirects to the app
(step 3's allow-list). Google never redirects to the app itself, so the app's own origins are
not what Google checks. The mobile app does not use this flow (it signs in natively and hands
Supabase an ID token), so the pieces below may not exist yet.

Check, and add only what is missing:

- [ ] Supabase → Authentication → Providers → Google is enabled and has the **Client ID and
      Client Secret of a Google OAuth client of type "Web application"**. If "Client IDs"
      lists several ids (web, iOS, Android), the web client's id must stay first. Without a
      secret, the redirect flow fails at the callback even though mobile's ID-token sign-in works.
- [ ] Google Cloud Console → APIs & Services → Credentials → that Web application client →
      **Authorized redirect URIs** → add `https://<project-ref>.supabase.co/auth/v1/callback`
      (Supabase shows this exact "Callback URL" on the Google provider page).
- [ ] **Authorized JavaScript origins**: nothing is required for this flow. They only matter for
      Google's in-page sign-in (One Tap / Google Identity Services), which the app does not use.
      Adding `https://app.nouveau.my.id` and `http://localhost:5173` is harmless and saves a
      trip if that is added later.
- [ ] If the OAuth consent screen is still in "Testing", only listed test users can sign in on
      the web; publish it (or add the users) when ready.

## 5. After the first deploy

- [ ] Open `https://app.nouveau.my.id/categories` directly (deep link served by the rewrite).
- [ ] Sign in with email and with Google; both land back on `app.nouveau.my.id`.
- [ ] Transactions load; open a row's side panel so the proofs request to
      `https://goofy.nouveau.my.id` runs (CORS must allow the new origin).
- [ ] Response headers: `/assets/*.js` is `immutable`, `/` is `max-age=0, must-revalidate`.
