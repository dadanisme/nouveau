import type { AppleCredential } from '@/lib/apple-auth';

// Sign in with Apple is iOS-only here: this sibling keeps expo-apple-authentication (an iOS
// native module) out of the Android bundle.

export function isAppleSignInAvailable(): Promise<boolean> {
  return Promise.resolve(false);
}

export function requestAppleCredential(): Promise<AppleCredential | 'cancelled'> {
  return Promise.reject(new Error('Sign in with Apple is not available on Android'));
}
