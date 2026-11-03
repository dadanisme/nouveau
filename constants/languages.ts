import type { Locale } from '@/contexts/language';
import { k } from '@/locales/keys';

/** The app languages, in menu order, with the key of each one's (self-named) label. */
export const LANGUAGE_OPTIONS: readonly { locale: Locale; labelKey: string }[] = [
  { locale: 'en', labelKey: k.settings.english },
  { locale: 'id', labelKey: k.settings.indonesian },
];
