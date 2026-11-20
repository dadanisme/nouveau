import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { Platform } from 'react-native';

import { en, id } from '@/locales';
import { androidOverrides } from '@/locales/android';
import { DEFAULT_LOCALE, resolveAppLocale, resolveDateLocale } from '@/utils/locale';

const i18n = new I18n({ en, id });
// Android takes Material 3's sentence-case labels over the iOS Title Case ones (deep merge).
if (Platform.OS === 'android') i18n.store(androidOverrides);

i18n.locale = resolveAppLocale(getLocales()[0]?.languageCode);
i18n.enableFallback = true;
i18n.defaultLocale = DEFAULT_LOCALE;

/** The BCP 47 tag for date/number formatting; `locale` defaults to the current app locale. */
export function getDateLocale(locale: string = i18n.locale): string {
  return resolveDateLocale(locale);
}

export default i18n;
