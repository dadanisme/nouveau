import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { Platform } from 'react-native';

import { en, id } from '@/locales';
import { androidOverrides } from '@/locales/android';

const i18n = new I18n({ en, id });
// Android takes Material 3's sentence-case labels over the iOS Title Case ones (deep merge).
if (Platform.OS === 'android') i18n.store(androidOverrides);

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = deviceLocale === 'id' ? 'id' : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

const DATE_LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  id: 'id-ID',
};

/** The BCP 47 tag for date/number formatting; `locale` defaults to the current app locale. */
export function getDateLocale(locale: string = i18n.locale): string {
  return DATE_LOCALE_MAP[locale] ?? 'en-US';
}

export default i18n;
