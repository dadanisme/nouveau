# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
expo start              # Start dev server (press i for iOS, a for Android, w for Web)
expo run:ios            # Build and run on iOS
expo run:android        # Build and run on Android
expo start --web        # Start web dev server
expo lint               # Run ESLint
```

No test framework is configured yet.

## Architecture

**Expo SDK 54 + React Native 0.81 app** using file-based routing (Expo Router), New Architecture, and React Compiler.

### Routing

File-based routing via Expo Router. Routes live in `app/`:

- `app/_layout.tsx` — Root Stack navigator with ThemeProvider
- `app/(tabs)/_layout.tsx` — Bottom tab navigator
- `app/(tabs)/index.tsx` — Home tab
- `app/(tabs)/explore.tsx` — Explore tab
- `app/modal.tsx` — Modal screen (presented as modal via Stack)

Route groups use parentheses `(tabs)` — they organize routes without affecting URL paths.

### Theme System

- `constants/theme.ts` defines `Colors` (light/dark) and `Fonts` (per-platform)
- `hooks/use-color-scheme.ts` detects device color preference (`.web.ts` variant handles SSR hydration)
- `hooks/use-theme-color.ts` resolves a color key to its themed value
- `components/themed-text.tsx` and `components/themed-view.tsx` wrap native components with theme awareness

### Platform-Specific Files

Uses React Native's platform file extensions for branching:

- `components/ui/icon-symbol.ios.tsx` — SF Symbols on iOS
- `components/ui/icon-symbol.tsx` — MaterialCommunityIcons fallback on Android/Web

### Key Conventions

- **Path alias**: `@/*` maps to the project root (e.g., `import { Colors } from '@/constants/theme'`)
- **TypeScript strict mode** is enabled
- **Kebab-case filenames** for components and hooks (e.g., `themed-text.tsx`, `use-color-scheme.ts`)
- **Typed routes** experiment is enabled — route params are type-checked
- **Animations** use `react-native-reanimated` (worklet-based)
- **Haptic feedback** via `expo-haptics` on tab presses (iOS)

### Bundle Identifiers

- iOS: `com.muhammadramdan.nouveau`
- Android: `com.muhammadramdan.nouveau`
- URL scheme: `nouveau`
