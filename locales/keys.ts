/**
 * Auto-generated type-safe translation keys derived from the English locale.
 *
 * Usage:
 *   import { k } from '@/locales/keys';
 *   t(k.common.cancel)        // in components (via useLanguage)
 *   i18n.t(k.common.cancel)   // in utils/hooks
 *
 * Each leaf value is the dot-path string that i18n-js expects, e.g.
 *   k.common.cancel === 'common.cancel'
 */

import en from './en';

type KeyTree<T> = {
  [K in keyof T]: T[K] extends (infer _)[]
    ? string
    : T[K] extends Record<string, unknown>
      ? KeyTree<T[K]>
      : string;
};

function buildKeys<T extends Record<string, unknown>>(obj: T, prefix = ''): KeyTree<T> {
  const result = {} as Record<string, unknown>;
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = buildKeys(value as Record<string, unknown>, path);
    } else {
      result[key] = path;
    }
  }
  return result as KeyTree<T>;
}

export const k = buildKeys(en);
