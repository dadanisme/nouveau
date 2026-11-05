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
 *
 * A plural string is an object of i18n-js plural forms (`{ one, other }`, optionally `zero`). It is
 * one key, translated with a count: `t(k.deleteAccount.transactions, { count })`.
 */

import en from './en';

/** A plural string: the i18n-js plural forms, picked by `count`. */
type PluralForms = { one: string; other: string; zero?: string };

function isPluralForms(value: object): boolean {
  const keys = Object.keys(value);
  return (
    keys.includes('one') &&
    keys.includes('other') &&
    keys.every((key) => ['zero', 'one', 'other'].includes(key))
  );
}

type KeyTree<T> = {
  [K in keyof T]: T[K] extends (infer _)[]
    ? string
    : T[K] extends PluralForms
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
    if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      !isPluralForms(value)
    ) {
      result[key] = buildKeys(value as Record<string, unknown>, path);
    } else {
      result[key] = path;
    }
  }
  return result as KeyTree<T>;
}

export const k = buildKeys(en);
