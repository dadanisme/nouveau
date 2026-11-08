# Nouveau

A personal finance tracker built with Expo and React Native. Track your income and expenses with native platform UI: SwiftUI on iOS, Material 3 on Android.

## Tech Stack

- **Expo SDK 58** with New Architecture and React Compiler
- **React Native 0.88** — iOS and Android (the web app is a separate Vite app in `web/`)
- **@expo/ui** — SwiftUI and Jetpack Compose components
- **Expo Router** — file-based routing with typed routes
- **Supabase** — auth (email + Google Sign-In) and PostgreSQL database
- **TanStack React Query** — server state management
- **expo-localization** + **i18n-js** — internationalization (English + Bahasa Indonesia)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/)
- [Expo CLI](https://docs.expo.dev/get-started/set-up-your-environment/)
- iOS Simulator / Android Emulator (the app needs a development build, not Expo Go)

### Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a `.env.local` file with your Supabase credentials:

   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
   ```

   Optional, for Nouveau Premium (RevenueCat public SDK keys; see `.env.example`). Without any of
   them the app runs and Premium shows as unavailable:

   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
   EXPO_PUBLIC_REVENUECAT_TEST_STORE_KEY=test_xxx
   ```

3. Start the dev server:

   ```bash
   bunx expo start
   ```

   Press `i` for iOS or `a` for Android.

## Scripts

| Command                      | Description                            |
| ---------------------------- | -------------------------------------- |
| `bunx expo start`            | Start the dev server                   |
| `bunx expo run:ios`          | Build and run on iOS                   |
| `bunx expo run:android`      | Build and run on Android               |
| `bunx expo lint`             | Run ESLint                             |
| `bun run format`             | Format code with Prettier              |
| `bun run supabase:gen-types` | Regenerate DB types from remote schema |

## Project Structure

```
app/
  _layout.tsx              # Root Stack (tab shell, sheets, modals, AuthGuard)
  (tabs)/                  # NativeTabs: Transactions, Insights, Settings (each with its own Stack)
  (sheets)/                # Pickers and editors presented as form sheets
  add-transaction/         # Add/edit transaction sheet
  proof-viewer.tsx         # Receipt proof viewer
  shareintent.tsx          # Share-intent landing
  login.tsx, signup.tsx    # Auth screens
components/                # Native UI components (SwiftUI / Compose via @expo/ui)
contexts/                  # React contexts (language, workspace)
hooks/                     # React Query hooks & screen logic
locales/                   # Translation files (en, id) + auto-generated key constants (keys.ts)
modules/                   # Local Expo modules (native charts)
utils/                     # Pure utility functions
constants/                 # Accent, sheet options, platform metrics
lib/                       # Supabase client, i18n singleton, navigation helpers
types/                     # TypeScript types (incl. generated Supabase types)
web/                       # Separate Vite web app (app.nouveau.my.id)
```
