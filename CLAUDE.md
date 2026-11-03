# CLAUDE.md

Guidance for Claude Code in this repo. The app is migrating from a custom neo-brutalist UI to native platform UI (SwiftUI / Material 3), epic #40. This file states the **target** conventions. Code that contradicts them is listed under [Legacy](#legacy-being-removed-dont-extend). Don't copy its patterns.

## Commands

```bash
bunx expo start              # Dev server (press i for iOS, a for Android)
bunx expo run:ios            # Build and run on iOS
bunx expo run:android        # Build and run on Android
bunx expo lint               # ESLint
bun run format               # Prettier
bun run supabase:gen-types   # Regenerate DB types from remote schema
bun add <pkg>                # Install a package
```

No test framework is configured. The web app in `web/` has its own scripts (`cd web && bun run dev`).

## Workflow

- **Always ask the user before making changes.** Never assume intent; ask when instructions are ambiguous.
- Run `bun run format` when a task is finished (before committing).
- **Check Context7 before using any library API** (`Resolve Context7 Library ID`, then `Query Documentation`). This matters most for `@expo/ui`, expo-router native tabs and sheet options, which change between SDKs.
- Plugins: Context7 (docs), Expo App Design (native UI, Expo Router, SwiftUI / Jetpack Compose), Expo Deployment (EAS, store submission, OTA), Feature Dev.

## Agent workflow

- The main session orchestrates and keeps its context thin: it plans, decides, makes small known edits, and does git/PR bookkeeping.
- Sub-agents do the bulky work in parallel, each with a narrow brief: device-loop runs (one per device/appearance), screenshot comparisons, per-screen builds, research, long file or log reads.
- Each sub-agent returns a digest of ≤30 lines: result, file paths, open issues. No raw logs, HTML or screenshots.
- The main window reads only digests, diffs and the lines it is about to edit.

## Branching

- Epic #40 records every decision. Read the relevant sub-issue before starting.
- UI work goes in per-issue PRs into the `native-ui` integration branch. `native-ui` merges to `main` once, in #39, so no release mixes old and new UI.
- The SDK upgrade (#24) merges to `main` on its own and is then brought into `native-ui`.

## Platform and stack

- **Installed:** Expo SDK 58, React Native 0.88, React 19.3, New Architecture, React Compiler (`experiments.reactCompiler`), Expo Router with typed routes, UIScene lifecycle (required on iOS 27).
- SDK 58 provides stable `@expo/ui` (`@expo/ui/swift-ui`, `@expo/ui/jetpack-compose`, installed) and stable native tabs. Local Swift/Kotlin Expo modules only for gaps (Swift Charts, #37).
- **Targets:** iOS 17+ and Android, both first-class. The iOS deployment target is 17.0 (`app.json` build-properties + `plugins/with-ios-deployment-target.js`, which also covers the share extension).
- **Web:** the web app is a separate Vite app in `web/` (app.nouveau.my.id) that reads the same Supabase data. The RN web build (`react-native-web`, the `web` script and `app.json` `web` block) is unused and will be removed. Don't maintain it.

## Architecture

### Routing

Routes live in `app/`. **Current** state: one root `Stack` in `app/_layout.tsx`, every screen `headerShown: false` with a custom header.

- `index.tsx`: Transactions (month nav with pan gesture, filters, spend breakdown, grouped list, FAB)
- `insights.tsx`: Insights (month/year mode, trend chart, category breakdown)
- `add-transaction.tsx`: add/edit transaction (`?id=` edits, `?date=` presets the date)
- `settings.tsx`, `categories.tsx`, `subscriptions.tsx`, `proof-viewer.tsx`
- `workspaces.tsx`, `create-workspace.tsx`, `workspace-settings.tsx`, `workspace-invites.tsx`
- `shareintent.tsx`: incoming share intent. `+native-intent.ts` rewrites share-extension URLs to it.
- `login.tsx`, `signup.tsx`

`AuthGuard` (in `_layout.tsx`) sends signed-out users to `/login` (except on `shareintent`) and signed-in users on login/signup to `/`.

**Target** (#25–#27):

- `NativeTabs` (expo-router native tabs) with three tabs: **Transactions / Insights / Settings**. Each tab has its own native Stack with native headers.
- Add action (#26, `utils/platform.ts` `getAddActionPlacement()`): the tab-bar slot on iOS 26.1+ (a `role="search"` trigger, `disabled`, whose `tabPress` pushes `/add-transaction`; the `add-action` route is an inert placeholder), a header `+` on iOS 17–26.0, an `@expo/ui` Compose FAB on Android (lists keep `ADD_FAB_CLEARANCE` bottom padding).
- `add-transaction` is a `formSheet` (one full detent, Cancel on the left) on iOS and a full-screen modal on Android, because Android form sheets have no header.
- Editors and pickers are `presentation: 'formSheet'` routes with detents, not in-screen sheets.
- Month change: header picker + chevrons. The custom pan gesture goes.

Current provider hierarchy (`BottomSheetModalProvider` goes with the legacy sheets):

```
GestureHandlerRootView → LanguageProvider → QueryClientProvider → ShareIntentProvider
  → BottomSheetModalProvider → AuthListener → WorkspaceProvider → AuthGuard → Stack
```

### State management

**TanStack React Query** handles all Supabase data. Hooks live in `hooks/`.

- Data hooks: `use-auth` (session, profile, email/Google sign-in, sign-out), `use-auth-listener`, `use-transactions` / `use-transaction`, `use-add-` / `use-update-` / `use-delete-transaction`, `use-categories(workspaceId)`, `use-category-mutations`, `use-subscriptions`, `use-proofs`, `use-proof-download`, `use-workspaces`, `use-workspace-members`, `use-workspace-invites`, `use-exchange-rate`, `use-classify-description`, `use-scan-receipt`.
- Screen hooks: `use-transactions-screen`, `use-insights-screen`, `use-transaction-form`, `use-category-form`, `use-category-management`, `use-share-intent-screen`.
- `contexts/workspace.tsx`: `useWorkspace()` holds the active workspace (persisted under `active_workspace_id`).
- `lib/api.ts`: `authenticatedFetch` for the backend at `goofy.nouveau.my.id` (AI classification, receipt scan, proofs).

Conventions:

- **Component-Hook-Service pattern**: components only render, business logic lives in hooks, pure functions live in `utils/`.
- **Never call Supabase directly from screens/components.** Go through React Query hooks (`useQuery` for reads, `useMutation` for writes, including auth actions).
- No business logic or utility functions inline in components. No `useEffect` + fetch.
- `QueryClientProvider` wraps the app in `app/_layout.tsx`.

### Utilities

Pure functions live in `utils/`: `analytics` (totals, breakdown, monthly trend), `currency` (formatting, decimals, symbols), `date`, `file`, `icon` (`parseIcon`), `params`, `string`, `transaction`. `currency.ts` and `date.ts` use `i18n` for locale-aware formatting. The DB-to-native icon/color mapping also lives here (see below).

### Localization

`expo-localization` + `i18n-js`:

- `lib/i18n.ts`: singleton `I18n` instance, imported directly from utils/hooks.
- `contexts/language.tsx`: `LanguageProvider` (outermost provider) and `useLanguage()` → `{ locale, setLocale, t }`.
- `locales/en.ts`, `locales/id.ts`: English and Bahasa Indonesia, nested by feature.
- `locales/keys.ts`: type-safe key constants `k`, generated at runtime from the English locale by `buildKeys()`. Never hand-write keys.

Rules:

- Always use `k`: `t(k.common.cancel)`, not `t('common.cancel')`. Import `k` from `@/locales/keys`.
- Components use `t(k.*)` from `useLanguage()` (it re-renders on locale change). Utils/hooks use `i18n.t(k.*)`.
- New strings go in **both** `en.ts` and `id.ts`. Use `%{name}` for interpolation.
- The language preference is persisted to `localStorage` under `app_language`.

## Native UI conventions

Use the platform component, not a custom look-alike. Check Context7 for the exact `@expo/ui` names before you use them. Prefer system animations; use `react-native-reanimated` only where native gives you nothing.

| Need                          | iOS                                                | Android                        |
| ----------------------------- | -------------------------------------------------- | ------------------------------ |
| Top-level navigation          | `NativeTabs` (Transactions / Insights / Settings)  | same                           |
| Title, back, header actions   | native Stack header (large titles, toolbar items)  | native Stack header            |
| Add transaction               | tab-bar action slot (26.1+), toolbar `+` (17–26.0) | Material FAB                   |
| Buttons, toggles, segmented   | `@expo/ui/swift-ui`                                | `@expo/ui/jetpack-compose`     |
| Forms, settings, grouped rows | SwiftUI `Form`/`List` sections via `@expo/ui`      | Compose list items             |
| Sheets / pickers / editors    | `presentation: 'formSheet'` route + detents        | same                           |
| Confirm / destructive prompt  | native alert (`Alert.alert`)                       | same                           |
| Overflow / row actions        | native menu / context menu                         | Compose dropdown menu          |
| Amount entry                  | `TextInput` with the system decimal keyboard       | same                           |
| Date, option picking          | native DatePicker / Picker (`@expo/ui`)            | Compose date picker / picker   |
| Loading                       | native placeholders / activity indicator           | Compose progress / placeholder |
| Charts                        | Swift Charts via a local Expo module (#37)         | Compose (#37)                  |
| Icons                         | SF Symbols                                         | Material Symbols               |

### Color, type, accent, icons

- **Type:** system font and system text styles only, with Dynamic Type respected. No custom font sizes.
- **Color:** semantic system colors only (iOS `PlatformColor` labels/backgrounds/separators, Material 3 color roles on Android). No hardcoded grays, whites or blacks.
- **Dark mode** follows the system (`userInterfaceStyle: automatic`). No in-app theme switch.
- **Accent:** `#E24A00` is the only brand color. Apply it as the app tint (tabs, buttons, links, FAB), not as fills. **Dark variant: TBD.** Don't invent one; record it here once it's chosen.
- **Icons:** SF Symbols on iOS, Material Symbols on Android. No `@expo/vector-icons` in new UI.

### DB contract: category icons and colors

The web app reads the same rows, so the stored format **does not change**:

- `categories.icon`: an Ionicon name, stored as `"Ionicons/<name>"` (nullable, parsed by `utils/icon.ts` `parseIcon`).
- `categories.color`: a hex string.

The app maps both to native values in `utils/`: Ionicon name → SF Symbol / Material Symbol (with a fallback for unmapped names), and hex → one of ~8 dynamic system colors. The native icon grid and color picker write Ionicon names and canonical hexes back. Never write SF/Material names or platform colors to the DB (#31).

### Wide layouts (deferred)

The migration targets phone-width layouts. iPhone Duo and wide layouts (list + detail, readable-width cap, sheets off the fold) are **deferred** to #38 and only picked up if needed. Until then, keep layouts width-agnostic: never branch on device model, `Platform.isPad`, orientation or fold state.

## Legacy (being removed, don't extend)

Removed in #39. Don't add new uses. Only touch these to delete them or to keep a screen working until its issue lands.

| Legacy                                                                                                         | Native replacement                                       |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `constants/colors.ts` (`colors`, `design`: borders, hard shadows, radii, spacing, font sizes)                  | semantic system colors + accent, platform metrics        |
| `button.tsx`                                                                                                   | `@expo/ui` buttons, header/toolbar items                 |
| `card.tsx`, `overview-card.tsx`, `summary-card.tsx`                                                            | native grouped list / form sections                      |
| `alert.tsx`, `hooks/use-delete-confirmation.tsx`                                                               | native alert                                             |
| `bottom-sheet.tsx`, `@gorhom/bottom-sheet`, `BottomSheetModalProvider`                                         | `formSheet` routes with detents                          |
| `action-menu.tsx`                                                                                              | native menus                                             |
| `category-picker.tsx`, `workspace-switcher-sheet.tsx`, `workspace-invite-sheet.tsx`                            | `formSheet` routes with native lists                     |
| `screen-header.tsx`                                                                                            | native Stack header                                      |
| `segmented-toggle.tsx`, `type-toggle.tsx`                                                                      | native segmented picker                                  |
| `number-pad.tsx`, `processAmountKeyPress`                                                                      | system decimal keyboard                                  |
| `date-picker.tsx`, `hooks/use-calendar.ts`                                                                     | native DatePicker                                        |
| `icon-picker.tsx`, `color-picker.tsx`, `constants/category-icons.ts`, `constants/category-colors.ts`           | native icon grid + ~8 system colors via `utils/` mapping |
| `skeleton.tsx`, `summary-card-skeleton.tsx`, `transaction-group-skeleton.tsx`, `transaction-item-skeleton.tsx` | native placeholders                                      |
| `monthly-trend-chart.tsx`, `category-bar-list.tsx`                                                             | Swift Charts / Compose (#37)                             |
| `transaction-item.tsx`, `avatar.tsx`, `workspace-members-section.tsx`, `workspace-invites-section.tsx`         | native rows, rebuilt in their screen issue               |
| Month pan gesture on Transactions                                                                              | header picker + chevrons                                 |
| `@expo/vector-icons` (Ionicons) in UI                                                                          | SF Symbols / Material Symbols                            |
| `<StatusBar style="dark" />`, cream splash background `#FFF9EB`                                                | system appearance                                        |
| RN web build (`react-native-web`, `web` script, `app.json` `web`)                                              | removed; the web app is `web/`                           |

## Definition of done for UI work

A UI issue is done when it has been verified with the `device-loop` skill (`.claude/skills/device-loop/`) on every device in the matrix, **each in light and dark**:

- iPhone 17 simulator (iOS 27) and an iPhone simulator on iOS 18.5
- Pixel_9a Android emulator

At the end of each phase, also check on the physical iPhone 15. Run the matrix as parallel sub-agents (one per device), each returning a digest. Also required: `bunx expo lint` is clean, `bun run format` has been run, and new strings exist in both locales.

## Supabase

- Client in `lib/supabase.ts` with the typed `Database` generic. Types in `types/supabase.ts` (regenerate with `bun run supabase:gen-types`).
- Auth persists the session with `expo-sqlite/localStorage`. Env vars: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` (in `.env.local`).

## Key conventions

- Path alias `@/*` maps to the project root. TypeScript strict mode is on.
- Kebab-case filenames for components and hooks. Typed routes are enabled, so route params are type-checked.
- From worklets, call JS with `scheduleOnRN` from `react-native-worklets`, not the deprecated `runOnJS`.
- Bundle IDs: iOS and Android `com.muhammadramdan.nouveau`. URL scheme: `nouveau`.
