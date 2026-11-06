import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { markOnboardingSeen } from '@/lib/onboarding';

/**
 * Screen hook for Welcome (#78). Reaching it marks the value pages as seen, so a later sign-out
 * (or a relaunch before choosing) opens here. Get Started goes on to the currency step (guest
 * mode, #100); Sign In pushes Login, whose Back returns here.
 */
export function useWelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    markOnboardingSeen();
  }, []);

  return {
    getStarted: () => router.push('/onboarding/currency'),
    signIn: () => router.push('/login'),
  };
}
