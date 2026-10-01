# Progress

Tick items as they land. Note the PR number next to each milestone when merged.

## M1 — Scaffold, auth, shell (branch `web/m1-scaffold`)

- [x] Vite + React + TS scaffold, Tailwind, shadcn/ui, TanStack Router/Query, ESLint, Prettier, Vitest
- [x] Theme tokens (CSS variables) from `constants/colors.ts`
- [x] Supabase client + typed `Database`, API client (`authenticatedFetch`)
- [x] Auth hooks, login, signup, Google OAuth, auth guard
- [x] App shell: sidebar, workspace switcher, routes (transactions, categories, profile placeholders)
- [ ] Test account created, creds in `web/.env.local`
- [ ] Verified in Chrome, PR merged

## M2 — Transactions table

- [ ] Query hooks (transactions by range, categories), month nav, range filter, search, type/category filters
- [ ] TanStack Table with inline cell editing
- [ ] Quick-add row (`N`, Tab, Enter)
- [ ] Multi-select, bulk delete, bulk change category
- [ ] Undo toast for deletes
- [ ] Vitest: amount parsing, totals, date ranges
- [ ] Verified in Chrome, PR merged

## M3 — Side panel, currency, proofs, AI

- [ ] Side panel with full record
- [ ] Multi-currency parity (exchange rates, home amount) + tests
- [ ] Proofs view/download
- [ ] AI classify on description
- [ ] Verified in Chrome, PR merged

## M4 — Categories, summary, profile, deploy

- [ ] Category management
- [ ] Summary strip with category breakdown filter
- [ ] Profile + sign out
- [ ] `vercel.json`, Vercel project, `app.nouveau.my.id` DNS
- [ ] Supabase redirect URLs + Google OAuth origins
- [ ] Production verified, PR merged, final report

## External changes log

(none yet)
