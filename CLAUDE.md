# CLAUDE.md

Guidance for Claude Code in this repo. The app uses native platform UI (SwiftUI / Material 3 through `@expo/ui`); epic #40 records the migration from the old custom UI and its decisions.

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
- SDK 58 provides stable `@expo/ui` (`@expo/ui/swift-ui`, `@expo/ui/jetpack-compose`, installed) and stable native tabs. Local Swift/Kotlin Expo modules (in `modules/`) only for gaps: `modules/native-charts` (Swift Charts, #37).
- **Targets:** iOS 17+ and Android, both first-class. The iOS deployment target is 17.0 (`app.json` build-properties + `plugins/with-ios-deployment-target.js`, which also covers the share extension).
- **Web:** the web app is a separate Vite app in `web/` (app.nouveau.my.id) that reads the same Supabase data. The app has no React Native web build (removed in #39); don't add one back.

## Architecture

### Routing

Routes live in `app/`. The root `Stack` in `app/_layout.tsx` holds the tab shell and everything presented over it:

- `(tabs)/`: `NativeTabs` with **Transactions / Insights / Settings**, each with its own native Stack (`(transactions)/index.tsx`, `(insights)/insights.tsx`, `(settings)/settings.tsx` plus `categories`, `subscriptions`, `workspaces`, `create-workspace`, `workspace-settings`, `workspace-invites`, `delete-account`, `profile` (opened from the Settings profile row: name, email, sign-in methods, Delete Account) and `profile-name` (the name editor)).
- `add-transaction/`: add/edit transaction (`?id=` edits, `?date=` presets the date), with its own nested Stack (`_layout.tsx`). A `formSheet` (one full detent, Cancel on the left, Save on the right) on iOS and a full-screen modal on Android, because Android form sheets have no header. A native form: amount field with the decimal keyboard (`components/amount-field-row`), the date as an in-form native date picker (`components/date-field-row`, no date sheet), the category through Select Category. On iOS, Select Category (`add-transaction/category-picker`) and View Proofs (`add-transaction/proofs`) push inside the sheet; Android opens the root `(sheets)/category-picker` and `proof-viewer`.
- `proof-viewer.tsx`: a `modal` (a leading `xmark` Close on iOS, back arrow on Android), opened from rows and the drill-down sheet (after it closes).
- `(sheets)/`: editors and pickers as `formSheet` routes (`category-transactions`, `workspace-switcher`, `workspace-invite`, `category-form/`, and the Android-only `category-picker`, `icon-picker`, `color-picker`). Each is registered in the root Stack with `sheetOptions(detents, { header })` from `constants/sheet-options.ts` (formSheet, grabber; `header: true` shows the native header on iOS only, since Android form sheets have none). `category-form/` has its own nested Stack (header on iOS only), and on iOS its icon and color pickers push inside it. Inputs go in as serializable params (plus a `requestId`); results come back through `lib/sheet-result.ts`: the presenter listens with `useSheetResult(key, requestId, handler)`, the sheet emits with `useSheetResponder` (`hooks/use-sheet-result.ts`) and closes itself (pops the pushed picker, or closes the sheet).
- `onboarding/` (#78): first-run flow with its own Stack: `index` (3 value pages, `components/onboarding-pager{,.android}.tsx`: a paged SwiftUI `TabView` with our own page dots / Compose `HorizontalPager`), `welcome` (logo, Get Started, "Already have an account? Sign In"), `currency` (the guest's currency before `startGuest`; `?for=account` once for a brand-new account, `hooks/use-currency-step-needed.ts`). `onboarding_seen` (`lib/onboarding.ts`) sends a signed-out launch to Welcome instead of the pages.
- `introduction.tsx`: View Introduction (Settings), the value pages again as a modal ending in Done.
- `shareintent.tsx`: incoming share intent. `+native-intent.ts` rewrites share-extension URLs to it.
- `login.tsx`, `signup.tsx`

The root Stack anchors `(tabs)` (`unstable_settings.anchor`), so a route opened cold from a deep link (add-transaction, proof-viewer, shareintent) opens over the tabs: iOS keeps its sheet/modal presentation and Android's Back returns to the tabs. Access is `Stack.Protected` groups from `useAuthRoutes()` (`hooks/use-auth-routes.ts`, #78): signed in or a guest gets `(tabs)` and the in-app routes; signed out gets `onboarding`, `login`, `signup` (also open during a sign-in's currency check and a brand-new account's currency step); `shareintent` and `introduction` are open to both. A guarded route that's focused redirects (signed out: to the value pages, or Welcome once seen; signed in: to `/`), so a cold launch's first screen is the right one, unanimated under the splash. Mid-session (sign in or out, Get Started), the screen that loses access is replaced through a handover instead: both groups stay open while `resetTo` fades in where the person now belongs, then the guards close, so the old screen never goes blank. `RootNavigator` mounts the Stack only after the first session read (a guest is known at once). `resetTo()` (`lib/navigation.ts`) makes those handover moves; the new-account currency step is a single `router.replace` (a `resetTo` into the nested onboarding Stack would slide through a blank frame).

Navigation conventions (#25–#27):

- Add action (#26, revised in #56 D-5; `utils/platform.ts` `getAddActionPlacement()`): a `+` in the Transactions header on every iOS version, an `@expo/ui` Compose FAB on Android (lists keep `ADD_FAB_CLEARANCE` bottom padding). No tab-bar Add slot: the tab bar is for navigation, not actions (HIG). Categories keeps its own toolbar `+` for New Category.
- New editors and pickers are `(sheets)/` routes with detents, never in-screen sheets. One sheet at a time: a picker opened _from an editor sheet_ is a push in the editor's nested Stack (iOS), and a sheet that opens another screen closes itself first (the drill-down's Edit Transaction). Header menus are `Stack.Toolbar.Menu`. A destructive action the person started (a Delete row, menu item or swipe, discarding edits) is confirmed with `confirmDestructive` (`lib/confirm-destructive.ts`): an action sheet with a red, specific button ("Delete Transaction") and Cancel, and no padded copy; on Android an M3 dialog headed by its `dialogTitle` question ("Delete transaction?"). Errors and unexpected consequences are alerts (a category delete that also deletes N transactions: the count, red "Delete Category and Transactions"); non-destructive confirms such as Sign Out use the default button style. Every alert, error or confirm, goes through `showAlertDialog` (`lib/alert-dialog`, same arguments as `Alert.alert`, always with a title): `Alert.alert` on iOS, a Compose M3 `AlertDialog` on Android (presented by `AlertDialogHost` in the root layout), since Android's `Alert.alert` is the legacy AppCompat dialog. ESLint (`no-restricted-properties`) flags `Alert.alert` outside `lib/alert-dialog*`.
- Sheet chrome (iOS, `components/sheet-toolbar.tsx`): editors have a leading Cancel (`SheetCancelToolbar`) and a trailing Save/Send (`FormSaveToolbar`), disabled until the required input is there, and commit from the header, not an in-form button. On iOS 26+ (`HEADER_ACTIONS_AS_SYMBOLS`) these are symbols, as in Apple's own sheets: `xmark` for Cancel, a prominent `checkmark` for Save/Create/Update (`arrow.up` for Send), with the word as the VoiceOver label; iOS 17–18 keep the words, and Android is unchanged. An editor's Income/Expense type sits in the header in place of the title (`FormSegmentedSection placement="navigationBar"`, #94), and moves into the form at accessibility text sizes or when its labels don't fit. Pickers, viewers and read-only modals have a leading `xmark` Close (`SheetCloseToolbar`) and commit on selection. Android's headerless form sheets keep the in-form heading (`NativeForm title`) and commit row. Sheets and modals leave with `goBackOrHome()` (`lib/navigation.ts`), not `router.back()`: a route opened cold from a deep link has nothing behind it, so it replaces itself with `/`.
- Unsaved changes: editors (Add/Edit Transaction, category form, invite sheet, Workspace settings, Create workspace) guard swipe-down, Cancel and Back with `useDiscardGuard(isDirty)` (`hooks/use-discard-guard.ts`, `usePreventRemove`): a Discard Changes / Keep Editing action sheet on iOS, an alert on Android. Pushed screens pass `{ pushed: true }`, which turns swipe-back off while dirty (the native swipe-back can't be held). Leave after a save or delete through the `leave(navigate)` it returns. Close the keyboard with `dismissKeyboard()` (`lib/keyboard.ts`), not `Keyboard.dismiss` (ESLint flags it): RN's dismiss can't resign a SwiftUI field, and a sheet shown while that keyboard is up sits under it. `FormTextFieldRow` reports its focus there, and the guard and `confirmDestructive` wait for it before they prompt.
- Period change (Transactions, Insights): the period is the nav title, with chevrons and a period menu in the header from `usePeriodNavigation(mode)` + `usePeriodNavToolbar(nav)` (a left toolbar on iOS, leading right-toolbar items on Android). No pan gestures.
- Charts are form rows too: `MonthlySpendingChart` (`components/monthly-spending-chart{,.android}.tsx`, Insights year mode) goes straight into a `FormSection`. Its strings (month labels, full amounts for VoiceOver/TalkBack, compact ticks, summary) come from `utils/monthly-chart.ts`.
- Insights (#91) leads with a headline row (`FormHeadlineRow`): "You spent Rp4.2M, 12% less than October" against the previous month (year mode: the previous year, read through a second query), then the top category and the biggest category change. Its strings come from `utils/insights-summary.ts`. Below it: the Income / Expense / Balance rows, the monthly chart (year mode), then "Spending by category" and "Income by category" (hidden without income), both drilling into `category-transactions`.
- Transactions shows the month's spending as one storage-style bar (#90): `CategoryBar` (`components/category-bar{,.android}.tsx`), a button row in its own `FormSection` that opens Insights. iOS draws it with the Swift Charts `CategoryBarChart` (`modules/native-charts`: interval `BarMark`s in a capsule, gaps as separators, a wrapping legend); Android with Compose `Row`/`Box` segments and a `FlowRow` legend. Top 4 categories + Others from the unfiltered query; its headline, legend percents and screen-reader summary come from `utils/category-bar.ts`. Hidden when the month has no expenses.

Provider hierarchy:

```
GestureHandlerRootView → LanguageProvider → QueryClientProvider → ShareIntentProvider
  → AuthListener → WorkspaceProvider → PeriodProvider → RootNavigator (useAuthRoutes) → Stack
```

### State management

**TanStack React Query** handles all Supabase data. Hooks live in `hooks/`.

- Data hooks: `use-auth` (session, profile, linked sign-in providers, display-name update, email/Google/Apple sign-in, sign-out), `use-profile-summary` (the profile header shown by Settings and Profile), `use-auth-listener`, `use-transactions` / `use-transaction`, `use-add-` / `use-update-` / `use-delete-transaction`, `use-categories(workspaceId)`, `use-category-mutations`, `use-subscriptions`, `use-proofs`, `use-proof-download`, `use-workspaces`, `use-workspace-members`, `use-workspace-invites`, `use-exchange-rate`, `use-classify-description`, `use-scan-receipt`.
- Screen hooks: `use-<screen>-screen` (transactions, insights, settings, profile, profile-name, subscriptions, login, signup, share-intent, workspaces, create-workspace, workspace-settings, workspace-invites, delete-account), `use-transaction-form`, `use-category-form`, `use-category-management`, and a `use-<sheet>-sheet` per sheet route.
- `contexts/workspace.tsx`: `useWorkspace()` holds the active workspace (persisted under `active_workspace_id`).
- `contexts/period.tsx`: `usePeriod()` holds the selected `{ year, month }` that Transactions and Insights share through `usePeriodNavigation` (#93). Global across workspaces, not persisted (a cold launch opens on the current month); Insights' year mode changes only the year, clamping a future month to the current one (`withPeriodYear`, `utils/date.ts`). Insights' Month/Year mode stays local to Insights; Transactions' "View insights" sends `mode=month`, read once by `use-insights-screen`.
- Guest mode (#100): someone without an account keeps their data on the device. The data hooks (transactions, categories, workspaces) read and write through a `DataSource` (`lib/data/types.ts`) picked by `useDataSource()` (`hooks/use-data-source.ts`): `remote` (Supabase, `lib/data/remote.ts`) with a session, `local` (`lib/data/local.ts`, expo-sqlite in `lib/local-db/`, plain SQL) for a guest. Query keys and invalidations are the same for both. `useGuestSession()` / `useStartGuest()` (`hooks/use-auth.ts`, `lib/guest.ts`) hold the guest id (`guest_user_id`); `useAuthRoutes` treats a guest like a signed-in user. Rows use `useCurrentUserId()` as `user_id`. Server-only features (AI classify, proofs, members, invites) are off for guests. The guest's default categories (`constants/default-categories.ts`) copy `handle_new_user` in the moneymail repo; `bun scripts/check-guest-store.ts` tests the local queries on in-memory SQLite and fails if that copy drifts.
- `lib/api.ts`: `authenticatedFetch` for the moneymail backend on Cloud Run (`https://moneymail-api-1016548251938.asia-southeast2.run.app`) (AI classification, receipt scan, proofs).

Conventions:

- **Component-Hook-Service pattern**: components only render, business logic lives in hooks, pure functions live in `utils/`.
- **Never call Supabase directly from screens/components.** Go through React Query hooks (`useQuery` for reads, `useMutation` for writes, including auth actions).
- No business logic or utility functions inline in components. No `useEffect` + fetch.
- `QueryClientProvider` wraps the app in `app/_layout.tsx`.

### Utilities

Pure functions live in `utils/`: `analytics` (totals, per-type category breakdown, monthly trend), `array`, `category-bar` (the Transactions category bar model), `currency` (formatting, decimals, symbols), `date`, `error`, `file`, `icon` (`parseIcon`), `insights-summary` (the Insights headline and its comparison), `monthly-chart` (the monthly spending chart model and axis ticks), `params`, `period-summary` (summary values and spend breakdown rows), `platform` (OS version checks, add-action placement), `promise`, `query` (`isAwaitingData`: no data yet is loading, also while a query waits disabled for the workspace), `string`, `transaction`, `workspace`. `currency.ts` and `date.ts` use `i18n` for locale-aware formatting. The DB-to-native icon/color mapping also lives here (see below).

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
- Base strings use Apple's title case for buttons and titles ("Delete Transaction"). Android shows Material 3 sentence case ("Delete transaction") from `locales/android.ts`, which `lib/i18n.ts` merges over both locales on Android only. A new Title Case button or title needs its sentence-case line there, for `en` and `id`.
- The language preference is persisted to `localStorage` under `app_language`.

## Native UI conventions

Use the platform component, not a custom look-alike. Check Context7 for the exact `@expo/ui` names before you use them. Prefer system animations; use `react-native-reanimated` only where native gives you nothing.

| Need                          | iOS                                                | Android                        |
| ----------------------------- | -------------------------------------------------- | ------------------------------ |
| Top-level navigation          | `NativeTabs` (Transactions / Insights / Settings)  | same                           |
| Title, back, header actions   | native Stack header (large titles, toolbar items)  | native Stack header            |
| Add transaction               | Transactions toolbar `+`                           | Material FAB                   |
| Buttons, toggles, segmented   | `@expo/ui/swift-ui`                                | `@expo/ui/jetpack-compose`     |
| Forms, settings, grouped rows | SwiftUI `Form`/`List` sections via `@expo/ui`      | Compose list items             |
| Sheets / pickers / editors    | `presentation: 'formSheet'` route + detents        | same                           |
| Confirm / destructive prompt  | action sheet (`confirmDestructive`); errors: alert | M3 dialog                      |
| Overflow / row actions        | native menu / context menu                         | Compose dropdown menu          |
| Amount entry                  | `TextInput` with the system decimal keyboard       | same                           |
| Date, option picking          | native DatePicker / Picker (`@expo/ui`)            | Compose date picker / picker   |
| Loading                       | native placeholders / activity indicator           | Compose progress / placeholder |
| Charts                        | Swift Charts via `modules/native-charts`           | Compose bars (`@expo/ui`)      |
| Icons                         | SF Symbols                                         | Material Symbols               |

### Forms and lists (#32)

Full-screen forms and grouped lists use the shared primitives in `components/native-form{,.android}.tsx` (same props on both platforms): `NativeForm`, `FormSection({title?, footer?})`, `FormNavRow`, `FormPickerRow`, `FormButtonRow({role?: 'destructive'})`, `FormNoticeRow`, `FormHeadlineRow` (a statement in a title style with a secondary line; one VoiceOver element on iOS, one TalkBack stop per line on Android, each with its spoken label). Icons are `{ sf: '<SF Symbol>', md: require('@/assets/icons/<name>.xml') }`.

- iOS: `Host style={{ flex: 1 }}` → SwiftUI `Form` → `Section`s, as the screen's root view. The native large title collapses with the Form scroll on iOS 18 and 27 with no workaround.
- Android: `ComposeHost` (`components/compose-host.tsx`, a `Host` with the light/dark scheme passed explicitly, so screens that were detached during a theme change don't keep the old palette; use it for every Compose host) → Compose `LazyColumn` → section header `Text` + M3 `ListItem`s; palette is the system one with only `primary` set to the accent.
- Inside an iOS `Button`, hierarchical text styles pick up the accent, so row text uses explicit `label` / `secondaryLabel` colors.
- At accessibility text sizes (`useIsAccessibilityTextSize()`, `hooks/use-accessibility-text-size.ts`) iOS rows stack: icon or symbol, then the title, then the value, left-aligned, with no line limits. Row symbols take a text-style font (`components/row-symbol.tsx`), never a fixed `size`; things that can't take a text style (bitmaps, fixed-height controls) scale with `useScaledSize`.

### Color, type, accent, icons

- **Type:** system font and system text styles only, with Dynamic Type respected. No custom font sizes.
- **Color:** semantic system colors only (iOS `PlatformColor` labels/backgrounds/separators, Material 3 color roles on Android). No hardcoded grays, whites or blacks.
- **Dark mode** follows the system (`userInterfaceStyle: automatic`). No in-app theme switch.
- **Status bar:** UIKit owns it on iOS (`UIViewControllerBasedStatusBarAppearance` is `true` in `app.json`), so it turns light over a full-height sheet's black backdrop. Don't mount `expo-status-bar` on iOS; Android keeps `<StatusBar style="auto" />`.
- **Accent:** `#E24A00` is the only brand color. Apply it as the app tint (tabs, buttons, links, FAB), not as fills. As text it is 4.03:1 on white, 3.61:1 on grouped gray and 4.22:1 on `#1C1C1E`, so it relies on the Increase Contrast fallback that accessibility#Vision allows: on iOS `ACCENT_COLOR` (`constants/accent.ts`) is a `DynamicColorIOS` with the tones UIKit derives for its own bars, `#B53B00` in light (5.85:1 on white, 5.24:1 on grouped gray) and `#FF681F` in dark (5.88:1 on `#1C1C1E`, 4.81:1 on `#2C2C2E`). Tint with `ACCENT_COLOR`, since SwiftUI doesn't adjust a plain hex; use `ACCENT_HEX` only where a hex string is required (Android, the navigation theme). The dark appearance keeps `#E24A00` (#59), so light and dark share the hex and only the Increase Contrast tones differ.
- **Launch screen:** the system one from `expo-splash-screen` (`app.json`). iOS shows only `systemGroupedBackground`, the first screen's background, with no logo (launching#Launch-screens: "Don't advertise."); `plugins/with-ios-launch-background.js` sets it, since `expo-splash-screen` only writes its color with an image. Android keeps the system splash icon on white / black. It stays up until the first screen the guards allow has appeared (`useAuthRoutes`, the root Stack's `transitionEnd` listener; `focus` fires before the native screen is drawn), with a 3 s fallback. No overlay or exit animation.
- **Icons:** SF Symbols on iOS, Material Symbols on Android. No `@expo/vector-icons` (ESLint `no-restricted-imports` blocks it).

### DB contract: category icons and colors

The web app reads the same rows, so the stored format **does not change**:

- `categories.icon`: an Ionicon name, stored as `"Ionicons/<name>"` (nullable, parsed by `utils/icon.ts` `parseIcon`).
- `categories.color`: a hex string.

The app maps both to native values in `utils/`: Ionicon name → SF Symbol / Material Symbol (with a fallback for unmapped names), and hex → the nearest of 9 system colors by hue (neutrals → gray), for display only: the edit form names that color and the picker checks it, but the stored hex is only rewritten when the user picks a color. Use `getCategorySymbol(icon)` (`utils/category-icon.ts`, returns `{ sf, material }`), `getCategoryColor(hex)` (`utils/category-color.ts`, `PlatformColor` on iOS, palette hex on Android). An icon's spoken and displayed name describes the native glyph, not the Ionicon name: `getIconLabelKey` / `findIconLabelKey` (`utils/category-icon-label.ts`, `k.categories.icons.*`). The native icon grid and color picker write Ionicon names and canonical palette hexes back. Never write SF/Material names or platform colors to the DB (#31).

### Wide layouts (deferred)

The migration targets phone-width layouts. iPhone Duo and wide layouts (list + detail, readable-width cap, sheets off the fold) are **deferred** to #38 and only picked up if needed. Until then, keep layouts width-agnostic: never branch on device model, `Platform.isPad`, orientation or fold state.

## Definition of done for UI work

A UI issue is done when it has been verified with the `device-loop` skill (`.claude/skills/device-loop/`) on every device in the matrix, **each in light and dark**:

- iPhone 17 simulator (iOS 27) and an iPhone simulator on iOS 18.5
- Pixel_9a Android emulator

At the end of each phase, also check on the physical iPhone 15. Run the matrix as parallel sub-agents (one per device), each returning a digest. Also required: `bunx expo lint` is clean, `bun run format` has been run, and new strings exist in both locales.

On iOS, the screens the issue touches must also pass the HIG review in the `device-loop` skill: the variant matrix (default, dark, AX5, Increase Contrast), a `ui-sweep` (labels, 44pt targets), and the checklist in `.claude/skills/device-loop/references/hig-checklist.md`. Every finding quotes Apple's live HIG (`slug#Anchor`), so a finding without a quote is an opinion, not a violation. Audit history is in #56.

## Supabase

- Client in `lib/supabase.ts` with the typed `Database` generic. Types in `types/supabase.ts` (regenerate with `bun run supabase:gen-types`).
- Auth persists the session with `expo-sqlite/localStorage`. Env vars: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` (in `.env.local`).

## Key conventions

- Path alias `@/*` maps to the project root. TypeScript strict mode is on.
- Kebab-case filenames for components and hooks. Typed routes are enabled, so route params are type-checked.
- From worklets, call JS with `scheduleOnRN` from `react-native-worklets`, not the deprecated `runOnJS`.
- Bundle IDs: iOS and Android `com.muhammadramdan.nouveau`. URL scheme: `nouveau`.
