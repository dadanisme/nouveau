# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bunx expo start              # Start dev server (press i for iOS, a for Android, w for Web)
bunx expo run:ios            # Build and run on iOS
bunx expo run:android        # Build and run on Android
bunx expo start --web        # Start web dev server
bunx expo lint               # Run ESLint
bun run format               # Run Prettier
bun run supabase:gen-types   # Regenerate DB types from remote schema
bun add <pkg>                # Install a package
```

No test framework is configured yet.

## Workflow

- **Always ask the user before making changes** — never assume intent. When instructions are ambiguous, ask clarifying questions first.
- Always run `bun run format` after finishing a task (before committing).
- **Always check Context7 for up-to-date documentation** before using any library API. Use the `Resolve Context7 Library ID` tool followed by `Query Documentation` to look up current APIs, usage patterns, and examples — never rely solely on training data for library-specific code.

## Architecture

**Expo SDK 55 + React Native 0.83 app** using file-based routing (Expo Router), New Architecture, and React Compiler.

### Routing

File-based routing via Expo Router. The app is a single-screen experience (no tab bar). Routes live in `app/`:

- `app/_layout.tsx` — Root Stack navigator
- `app/index.tsx` — Transactions screen (default landing route). Includes a profile header, a sticky month/period nav, filters, spend breakdown, transaction groups, and a floating Add button. Whole screen supports horizontal swipe for month navigation (swipe left → next month, swipe right → previous month).
- `app/add-transaction.tsx` — Add/edit Transaction (Stack push)
- `app/settings.tsx` — Settings screen (Stack push from the profile header)
- `app/categories.tsx`, `app/subscriptions.tsx`, `app/proof-viewer.tsx`, `app/shareintent.tsx`, `app/login.tsx`, `app/signup.tsx`

`AuthGuard` (in `app/_layout.tsx`) redirects authenticated users to `/` and unauthenticated users to `/login`.

### Floating Add Button

`components/floating-add-button.tsx` — bottom-centered amber FAB used in place of a tab bar. Wraps the shared `<Button variant="primary">`, applies safe-area-aware `bottom` insets, and pushes `/add-transaction` on press.

**Important**: The FAB is `position: absolute`, so scrollable screens **must** include bottom padding using `FAB_HEIGHT` (exported from `@/components/floating-add-button`) to prevent content from being hidden behind it. Example: `paddingBottom: FAB_HEIGHT + insets.bottom + design.spacing.lg`

### State Management

Uses **TanStack React Query** for all Supabase data operations. Hooks live in `hooks/`.

**Data hooks** (React Query wrappers):

- `hooks/use-auth.ts` — `useSession()`, `useUserProfile(userId)`, `useSignInWithEmail()`, `useSignUpWithEmail()`, `useSignInWithGoogle()`, `useSignOut()`
- `hooks/use-categories.ts` — `useCategories(userId)` query hook
- `hooks/use-add-transaction.ts` — `useAddTransaction()` mutation hook
- `hooks/use-auth-listener.ts` — `useAuthListener()` — Supabase `onAuthStateChange` subscription + React Query cache sync

**Screen/component hooks** (encapsulate business logic so components only render):

- `hooks/use-transactions-screen.ts` — `useTransactionsScreen()` — month nav, totals, expense breakdown, grouped transactions, filter state
- `hooks/use-transaction-form.ts` — `useTransactionForm()` — all form state, validation, key press handling, submission, picker toggling
- `hooks/use-calendar.ts` — `useCalendar(opts)` — month navigation state, grid cell computation

### Utilities

Pure functions live in `utils/`. Note: `currency.ts` and `date.ts` depend on `i18n` for locale-aware formatting.

- `utils/date.ts` — `isSameDay`, `getDaysInMonth`, `getFirstDayOfWeek`, `formatShortDate` (locale-aware)
- `utils/string.ts` — `getInitials`
- `utils/currency.ts` — `processAmountKeyPress`, `formatDisplayAmount`, `formatCompactAmount`, `formatCurrency` (use `i18n` for prefix/suffixes)

Conventions:

- **Component-Hook-Service pattern**: Components only handle rendering. Business logic lives in hooks. Pure utility functions live in `utils/`.
- **Never call Supabase directly from screens/components** — all Supabase calls must go through React Query hooks (`useQuery` for reads, `useMutation` for writes)
- **Never define business logic or utility functions inline in components** — extract to hooks or `utils/`
- Use TanStack `useQuery` for declarative data fetching — no `useEffect` + fetch patterns
- Use TanStack `useMutation` for data mutations (inserts, updates, deletes, auth actions)
- `QueryClientProvider` wraps the app in `app/_layout.tsx`

### Localization

i18n setup using `expo-localization` + `i18n-js`:

- **`lib/i18n.ts`** — Singleton `I18n` instance. Import directly from utils/hooks (no React dependency).
- **`contexts/language.tsx`** — `LanguageProvider` wraps the app (outermost provider in `_layout.tsx`). Provides `useLanguage()` hook.
- **`locales/en.ts`** / **`locales/id.ts`** — Translation files (English + Bahasa Indonesia). Nested by feature.
- **`locales/keys.ts`** — Auto-generated type-safe key constants (`k`). Derived at runtime from the English locale structure via `buildKeys()`. Never hardcode keys manually.

**`useLanguage()` hook API**: `{ locale, setLocale, t }`

**Convention**:

- **Always use `k` constants** instead of raw string keys: `t(k.common.cancel)` not `t('common.cancel')`. Import `k` from `@/locales/keys`.
- **Components** use `t(k.*)` from `useLanguage()` hook (triggers re-render on locale change)
- **Utils/hooks** import `i18n` directly from `lib/i18n.ts` and use `i18n.t(k.*)` (no React context needed)

**Adding new strings**: Add key to both `locales/en.ts` and `locales/id.ts` — the `k` constant is auto-generated from the English locale, so no manual key registration needed. Use `t(k.section.key)` in components or `i18n.t(k.section.key)` in utils/hooks. Use `%{name}` for interpolation.

Language preference is persisted to `localStorage` under key `app_language`.

**Provider hierarchy** in `app/_layout.tsx`:

```
GestureHandlerRootView
  → LanguageProvider
    → QueryClientProvider
      → ShareIntentProvider
        → BottomSheetModalProvider
          → AuthListener → AuthGuard → Stack
```

### Design System

Centralized in `constants/colors.ts`. All UI should use these tokens instead of hardcoded values.

- **Colors**: `colors.primary` (amber `#F59E0B`), `colors.background` (warm off-white `#FFF9EB`), `colors.income` (green), `colors.expense` (red), `colors.gray` (50–900 scale)
- **Borders**: `design.borderWidth` (2.5px) — thick cartoonish borders on all interactive/card elements
- **Shadows**: `design.shadow` — hard offset (`{3,3}`, radius 0) for comic-book effect. Spread via `...design.shadow`
- **Radii**: `design.radius` — sm(8), md(14), lg(20), xl(28), full(9999)
- **Spacing**: `design.spacing` — xs(4), sm(8), md(16), lg(24), xl(32)
- **Font sizes**: `design.fontSize` — xs(12) through 3xl(40)

Reusable components in `components/`:

- `bottom-sheet.tsx` — `<BottomSheet visible onDismiss snapPoints?>` gesture-enabled bottom sheet (wraps `@gorhom/bottom-sheet`'s `BottomSheetModal`). Use `BottomSheetView` or `BottomSheetScrollView` from `@gorhom/bottom-sheet` as direct children.
- `button.tsx` — `<Button variant="primary"|"outline"|"dark">` with animated press (shadow shifts on press). Always use this instead of raw `Pressable` for actions.
- `alert.tsx` — `<Alert visible title message? actions? onDismiss?>` modal dialog with animated entry/exit. Always use this instead of `Alert.alert()` from react-native.
- `card.tsx` — `<Card variant="default"|"primary">` with border + hard shadow
- `avatar.tsx` — `<Avatar uri? name? size?>` with image or initials fallback
- `overview-card.tsx` — `<OverviewCard type amount change>` for income/expense summaries
- `transaction-item.tsx` — `<TransactionItem transaction isLast?>` for transaction rows

### Key Conventions

- **Path alias**: `@/*` maps to the project root
- **TypeScript strict mode** is enabled
- **Kebab-case filenames** for components and hooks
- **Typed routes** experiment is enabled — route params are type-checked
- **Animations** use `react-native-reanimated` (worklet-based). Use `scheduleOnRN` from `react-native-worklets` instead of the deprecated `runOnJS` from `react-native-reanimated` when calling JS functions from worklets.
- **Bottom sheets** use `@gorhom/bottom-sheet` — `GestureHandlerRootView` + `BottomSheetModalProvider` wrap the app in `app/_layout.tsx`. Use the `<BottomSheet>` wrapper component (`components/bottom-sheet.tsx`) with `BottomSheetView` or `BottomSheetScrollView` as children.

### Supabase

- Client initialized in `lib/supabase.ts` with typed `Database` generic
- Types live in `types/supabase.ts` — regenerate with `bun run supabase:gen-types`
- Auth uses `expo-sqlite/localStorage` for session persistence
- Environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (in `.env.local`)

### Bundle Identifiers

- iOS: `com.muhammadramdan.nouveau`
- Android: `com.muhammadramdan.nouveau`
- URL scheme: `nouveau`

### Active Plugins

- **Context7** — Documentation lookup for libraries. Use `Resolve Context7 Library ID` + `Query Documentation` tools to fetch up-to-date API docs and examples.
- **Expo App Design** — Skills for building native UI, Expo Router, DOM components, Swift UI/Jetpack Compose, Tailwind setup, data fetching, API routes, and dev client builds.'
- **Expo Deployment** — Expertise in Expo's build and deployment processes, including EAS Build, app store submission, OTA updates, and release channels.
- **Feature Dev** — Guided feature development with codebase understanding, architecture focus, and code review.
