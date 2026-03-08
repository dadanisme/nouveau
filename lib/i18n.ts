import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

import { en, id } from '@/locales';

const i18n = new I18n({ en, id });

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = deviceLocale === 'id' ? 'id' : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
