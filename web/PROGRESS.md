# Progress

Tick items as they land. Note the PR number next to each milestone when merged.

## M1 — Scaffold, auth, shell (branch `web/m1-scaffold`)

- [x] Vite + React + TS scaffold, Tailwind, shadcn/ui, TanStack Router/Query, ESLint, Prettier, Vitest
- [x] Theme tokens (CSS variables) from `constants/colors.ts`
- [x] Supabase client + typed `Database`, API client (`authenticatedFetch`)
- [x] Auth hooks, login, signup, Google OAuth, auth guard
- [x] App shell: sidebar, workspace switcher, routes (transactions, categories, profile placeholders)
- [x] Test account created (by the owner, by hand; display name "testaccount", workspace "Personal"). Credentials are NOT stored in the repo or in `web/.env.local`; verification uses the session already signed in in the owner's Chrome
- [x] Verified in Chrome, PR merged (PR #12)

## M2 — Transactions table

- [x] Query hooks (transactions by range, categories), month nav, range filter, search, type/category filters
- [x] TanStack Table with inline cell editing
- [x] Quick-add row (`N`, Tab, Enter)
- [x] Multi-select, bulk delete, bulk change category
- [x] Undo toast for deletes
- [x] Vitest: amount parsing, totals, date ranges
- [ ] Verified in Chrome, PR merged

## M3 — Side panel, currency, proofs, AI

- [x] Side panel with full record
- [x] Multi-currency parity (exchange rates, home amount) + tests
- [x] Proofs view/download
- [x] AI classify on description
- [ ] Verified in Chrome, PR merged

## M4 — Categories, summary, profile, deploy

- [x] Category management
- [x] Summary strip with category breakdown filter
- [x] Profile + sign out
- [x] Deferred delete (Undo cancels the DELETE instead of re-inserting)
- [x] `vercel.json`, `DEPLOY.md` checklist, `README.md`
- [ ] Vercel project, `app.nouveau.my.id` DNS (see `DEPLOY.md`)
- [ ] Supabase redirect URLs + Google OAuth origins
- [ ] Production verified, PR merged, final report

## External changes log

(none yet)
