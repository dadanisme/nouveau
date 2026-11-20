export type AppLocale = 'en' | 'id';

/** Default app language and i18n fallback (primary market is Indonesia). */
export const DEFAULT_LOCALE: AppLocale = 'id';

/** Default BCP 47 tag for date and number formatting. */
export const DEFAULT_DATE_LOCALE = 'id-ID';

const DATE_LOCALE_MAP: Record<AppLocale, string> = {
  en: 'en-US',
  id: 'id-ID',
};

/**
 * Maps the device's primary language code to a supported app locale.
 * English stays English; Indonesian (including legacy Android `in`) and any other or missing
 * language fall back to Indonesian.
 */
export function resolveAppLocale(languageCode: string | null | undefined): AppLocale {
  return languageCode?.toLowerCase() === 'en' ? 'en' : DEFAULT_LOCALE;
}

/** The BCP 47 tag for date/number formatting; unknown locales fall back to Indonesian (`id-ID`). */
export function resolveDateLocale(locale: string): string {
  return DATE_LOCALE_MAP[locale as AppLocale] ?? DEFAULT_DATE_LOCALE;
}
