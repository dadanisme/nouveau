# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
expo start              # Start dev server (press i for iOS, a for Android, w for Web)
expo run:ios            # Build and run on iOS
expo run:android        # Build and run on Android
expo start --web        # Start web dev server
expo lint               # Run ESLint
npm run format          # Run Prettier
npm run supabase:gen-types  # Regenerate DB types from remote schema
```

No test framework is configured yet.

## Workflow

- Always run `npm run format` after finishing a task (before committing).

## Architecture

**Expo SDK 54 + React Native 0.81 app** using file-based routing (Expo Router), New Architecture, and React Compiler.

### Routing

File-based routing via Expo Router. Routes live in `app/`:

- `app/_layout.tsx` — Root Stack navigator
- `app/(tabs)/_layout.tsx` — Native tab navigator (using `NativeTabs` from `expo-router/unstable-native-tabs`)
- `app/(tabs)/index.tsx` — Home tab
- `app/(tabs)/transactions.tsx` — Transactions tab
- `app/(tabs)/dashboard.tsx` — Dashboard tab

Route groups use parentheses `(tabs)` — they organize routes without affecting URL paths.

### Tab Icons

Tab icons use `NativeTabs.Trigger` with `Icon` and `Label` children:

- **iOS**: SF Symbols via the `sf` prop
- **Android**: `MaterialCommunityIcons` via `VectorIcon` passed to `androidSrc`
- **Web**: Text-only labels (built-in NativeTabs web behavior)

### Key Conventions

- **Path alias**: `@/*` maps to the project root
- **TypeScript strict mode** is enabled
- **Kebab-case filenames** for components and hooks
- **Typed routes** experiment is enabled — route params are type-checked
- **Animations** use `react-native-reanimated` (worklet-based)

### Supabase

- Client initialized in `lib/supabase.ts` with typed `Database` generic
- Types live in `types/supabase.ts` — regenerate with `npm run supabase:gen-types`
- Auth uses `expo-sqlite/localStorage` for session persistence
- Environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (in `.env.local`)

### Bundle Identifiers

- iOS: `com.muhammadramdan.nouveau`
- Android: `com.muhammadramdan.nouveau`
- URL scheme: `nouveau`
