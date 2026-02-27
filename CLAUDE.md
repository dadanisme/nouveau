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

- Always run `bun run format` after finishing a task (before committing).
- **Always check Context7 for up-to-date documentation** before using any library API. Use the `Resolve Context7 Library ID` tool followed by `Query Documentation` to look up current APIs, usage patterns, and examples — never rely solely on training data for library-specific code.

## Architecture

**Expo SDK 55 + React Native 0.83 app** using file-based routing (Expo Router), New Architecture, and React Compiler.

### Routing

File-based routing via Expo Router. Routes live in `app/`:

- `app/_layout.tsx` — Root Stack navigator
- `app/(tabs)/_layout.tsx` — Custom tab bar via `Tabs` + `<TabBar>` component
- `app/(tabs)/index.tsx` — Home tab
- `app/(tabs)/transactions.tsx` — Transactions tab
- `app/(tabs)/dashboard.tsx` — Dashboard tab
- `app/add-transaction.tsx` — Add Transaction (Stack push from tab bar action button)
- `app/settings.tsx` — Settings screen (Stack push from home)

Route groups use parentheses `(tabs)` — they organize routes without affecting URL paths.

### Tab Bar

Custom floating tab bar (`components/tab-bar.tsx`) — black rounded bar with:

- Icon-only tabs for Home, Transactions, Dashboard (active = amber bg)
- Always-expanded "Add" action tab with icon + label
- Absolute positioning (floats over content)

**Important**: The tab bar is `position: absolute`, so scrollable tab screens **must** include bottom padding using `TAB_BAR_HEIGHT` (exported from `@/components/tab-bar`) to prevent content from being hidden behind the bar. Example: `paddingBottom: TAB_BAR_HEIGHT + design.spacing.lg`

### State Management

Uses **TanStack React Query** for all Supabase data operations. Hooks live in `hooks/`.

**Data hooks** (React Query wrappers):

- `hooks/use-auth.ts` — `useSession()`, `useUserProfile(userId)`, `useSignInWithEmail()`, `useSignUpWithEmail()`, `useSignInWithGoogle()`, `useSignOut()`
- `hooks/use-categories.ts` — `useCategories(userId)` query hook
- `hooks/use-add-transaction.ts` — `useAddTransaction()` mutation hook
- `hooks/use-auth-listener.ts` — `useAuthListener()` — Supabase `onAuthStateChange` subscription + React Query cache sync

**Screen/component hooks** (encapsulate business logic so components only render):

- `hooks/use-home-screen.ts` — `useHomeScreen()` — user data derivation, greeting, dummy data
- `hooks/use-transaction-form.ts` — `useTransactionForm()` — all form state, validation, key press handling, submission, picker toggling
- `hooks/use-calendar.ts` — `useCalendar(opts)` — month navigation state, grid cell computation

### Utilities

Pure functions live in `utils/`. No React or side-effect dependencies.

- `utils/date.ts` — `isSameDay`, `getDaysInMonth`, `getFirstDayOfWeek`, `formatShortDate`
- `utils/string.ts` — `getInitials`
- `utils/greeting.ts` — `getGreeting`
- `utils/currency.ts` — `processAmountKeyPress`, `formatDisplayAmount`

Conventions:

- **Component-Hook-Service pattern**: Components only handle rendering. Business logic lives in hooks. Pure utility functions live in `utils/`.
- **Never call Supabase directly from screens/components** — all Supabase calls must go through React Query hooks (`useQuery` for reads, `useMutation` for writes)
- **Never define business logic or utility functions inline in components** — extract to hooks or `utils/`
- Use TanStack `useQuery` for declarative data fetching — no `useEffect` + fetch patterns
- Use TanStack `useMutation` for data mutations (inserts, updates, deletes, auth actions)
- `QueryClientProvider` wraps the app in `app/_layout.tsx`

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
