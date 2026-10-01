# Nouveau Web

Desktop web client for Nouveau, the expense tracker: a spreadsheet-like transactions table
with inline editing, quick add, bulk actions, a summary strip with a category breakdown,
category management and a profile page. It talks to the same Supabase project and API as the
mobile app in the repository root, and is a self-contained Vite + React app (TanStack Router,
Query and Table, Tailwind, shadcn/ui). Desktop only, English only, light mode only.

## Commands

Run from `web/`, with [Bun](https://bun.sh).

```bash
bun install          # install dependencies
bun run dev          # dev server at http://localhost:5173 (fixed port)
bun run typecheck    # tsc
bun run lint         # ESLint
bun run test         # Vitest (money, date, summary and delete-queue logic)
bun run build        # type-check and build to dist/
bun run preview      # serve the production build locally
bun run format       # Prettier
```

## Environment

Copy `.env.example` to `.env.local` (gitignored) and fill in:

| Variable            | What it is                                                                        |
| ------------------- | --------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL` | Supabase project URL (same value as the root `EXPO_PUBLIC_SUPABASE_URL`)          |
| `VITE_SUPABASE_KEY` | Supabase publishable/anon key (same value as the root `EXPO_PUBLIC_SUPABASE_KEY`) |

The custom API base URL (`https://goofy.nouveau.my.id`) is fixed in `src/lib/api.ts`.

## Layout

- `src/routes/` file-based routes; `src/components/` render only; `src/hooks/` logic and all
  Supabase access (through React Query); `src/utils/` pure functions with tests;
  `src/lib/` clients, constants and the pending-delete queue; `src/locales/en.ts` all copy.
- Database types come from `../types/supabase.ts` (regenerate from the repository root with
  `bun run supabase:gen-types`).

## More

- [`SPEC.md`](./SPEC.md): scope and every recorded decision (source of truth).
- [`PROGRESS.md`](./PROGRESS.md): milestone checklist and the log of external changes.
- [`DEPLOY.md`](./DEPLOY.md): Vercel, DNS, Supabase Auth and Google OAuth checklist.
