import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

/** Supabase auth provider ids the app signs in with, in the order Profile lists them. */
const KNOWN_PROVIDERS = {
  apple: k.profile.providers.apple,
  google: k.profile.providers.google,
  email: k.profile.providers.email,
} as const;

const ORDER = Object.keys(KNOWN_PROVIDERS);

export type SignInMethod = { provider: string; label: string };

/**
 * The account's sign-in methods for display, from its linked auth providers: each provider once,
 * Apple, Google and Email first (localized), then any other provider by its id, capitalized.
 */
export function getSignInMethods(providers: readonly string[]): SignInMethod[] {
  const unique = [...new Set(providers.filter(Boolean))];
  const rank = (provider: string) => {
    const index = ORDER.indexOf(provider);
    return index === -1 ? ORDER.length : index;
  };

  return unique
    .sort((a, b) => rank(a) - rank(b))
    .map((provider) => ({
      provider,
      label:
        provider in KNOWN_PROVIDERS
          ? i18n.t(KNOWN_PROVIDERS[provider as keyof typeof KNOWN_PROVIDERS])
          : provider.charAt(0).toUpperCase() + provider.slice(1),
    }));
}
