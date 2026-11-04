import type { AppleSignInButtonProps } from '@/components/apple-sign-in-button';

/**
 * Sign in with Apple is iOS-only (`useAppleSignInAvailable()` is false on Android), so this
 * sibling renders nothing and keeps expo-apple-authentication out of the Android bundle.
 */
export function AppleSignInButton(_props: AppleSignInButtonProps) {
  return null;
}
