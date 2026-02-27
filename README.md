# Nouveau

A personal finance tracker built with Expo and React Native. Track your income and expenses with a clean, cartoonish UI featuring hard shadows and thick borders.

## Tech Stack

- **Expo SDK 54** with New Architecture and React Compiler
- **React Native 0.81** — iOS, Android, and Web
- **Expo Router** — file-based routing with typed routes
- **Supabase** — auth (email + Google Sign-In) and PostgreSQL database
- **TanStack React Query** — server state management
- **React Native Reanimated** — animations
- **@gorhom/bottom-sheet** — gesture-driven bottom sheets

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/)
- [Expo CLI](https://docs.expo.dev/get-started/set-up-your-environment/)
- iOS Simulator / Android Emulator (or a physical device with Expo Go)

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

3. Start the dev server:

   ```bash
   bunx expo start
   ```

   Press `i` for iOS, `a` for Android, or `w` for Web.

## Scripts

| Command                      | Description                            |
| ---------------------------- | -------------------------------------- |
| `bunx expo start`            | Start the dev server                   |
| `bunx expo run:ios`          | Build and run on iOS                   |
| `bunx expo run:android`      | Build and run on Android               |
| `bunx expo start --web`      | Start the web dev server               |
| `bunx expo lint`             | Run ESLint                             |
| `bun run format`             | Format code with Prettier              |
| `bun run supabase:gen-types` | Regenerate DB types from remote schema |

## Project Structure

```
app/
  _layout.tsx              # Root Stack navigator
  login.tsx                # Login screen
  signup.tsx               # Sign-up screen
  add-transaction.tsx      # Add/edit transaction screen
  categories.tsx           # Category management
  settings.tsx             # Settings screen
  (tabs)/
    _layout.tsx            # Tab bar layout
    index.tsx              # Home tab
    transactions.tsx       # Transactions tab
    dashboard.tsx          # Dashboard tab
components/                # Reusable UI components
hooks/                     # React Query hooks & screen logic
utils/                     # Pure utility functions
constants/                 # Design tokens & colors
lib/                       # Supabase client
types/                     # TypeScript types (incl. generated Supabase types)
```
