/**
 * Checks the default/fallback locale rules (`utils/locale.ts`) and native iOS localization config:
 * - Indonesian (`id`, plus legacy Android `in`) resolves to `id`;
 * - English (`en`, case-insensitive) stays `en`;
 * - any other or missing device language falls back to `id`;
 * - `resolveDateLocale` maps `en` -> `en-US`, `id` -> `id-ID`, and unknown -> `id-ID`;
 * - `i18n-js` with `defaultLocale = DEFAULT_LOCALE` falls back to Indonesian;
 * - `locales/id.ts` has every key `locales/en.ts` has, so Indonesian fallback never drops a key;
 * - `app.json` declares `CFBundleLocalizations` (`id`, `en`), `expo.locales` JSON files with
 *   localized iOS permission strings, and the `with-ios-known-regions` config plugin.
 *
 * Run: bun scripts/check-locale.ts (exits 1 on any failure).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { I18n } from 'i18n-js';

import appJson from '../app.json';
import en from '../locales/en';
import id from '../locales/id';
import {
  DEFAULT_DATE_LOCALE,
  DEFAULT_LOCALE,
  resolveAppLocale,
  resolveDateLocale,
} from '../utils/locale';

let passes = 0;
let failures = 0;

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passes += 1;
  } else {
    failures += 1;
    console.error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  }
}

function eq(name: string, actual: unknown, expected: unknown) {
  check(name, actual === expected, `got ${String(actual)}, want ${String(expected)}`);
}

eq('DEFAULT_LOCALE is id', DEFAULT_LOCALE, 'id');
eq('DEFAULT_DATE_LOCALE is id-ID', DEFAULT_DATE_LOCALE, 'id-ID');

// Supported and unsupported device language codes.
eq('Indonesian id -> id', resolveAppLocale('id'), 'id');
eq('Indonesian uppercase ID -> id', resolveAppLocale('ID'), 'id');
eq('Legacy Android Indonesian in -> id', resolveAppLocale('in'), 'id');
eq('English en -> en', resolveAppLocale('en'), 'en');
eq('English uppercase EN -> en', resolveAppLocale('EN'), 'en');
eq('Malay ms -> id fallback', resolveAppLocale('ms'), 'id');
eq('Japanese ja -> id fallback', resolveAppLocale('ja'), 'id');
eq('Chinese zh -> id fallback', resolveAppLocale('zh'), 'id');
eq('French fr -> id fallback', resolveAppLocale('fr'), 'id');
eq('Empty string -> id fallback', resolveAppLocale(''), 'id');
eq('Null -> id fallback', resolveAppLocale(null), 'id');
eq('Undefined -> id fallback', resolveAppLocale(undefined), 'id');

// Date/number BCP 47 locale tags.
eq('date locale en -> en-US', resolveDateLocale('en'), 'en-US');
eq('date locale id -> id-ID', resolveDateLocale('id'), 'id-ID');
eq('date locale unknown -> id-ID fallback', resolveDateLocale('ja'), 'id-ID');
eq('date locale empty -> id-ID fallback', resolveDateLocale(''), 'id-ID');

// i18n-js fallback behavior mirrors lib/i18n.ts.
const i18n = new I18n({ en, id });
i18n.enableFallback = true;
i18n.defaultLocale = DEFAULT_LOCALE;

i18n.locale = resolveAppLocale('ja');
eq('i18n with ja device falls back to Indonesian', i18n.t('common.cancel'), id.common.cancel);

i18n.locale = resolveAppLocale('en');
eq('i18n with en device uses English', i18n.t('common.cancel'), en.common.cancel);

i18n.locale = resolveAppLocale('id');
eq('i18n with id device uses Indonesian', i18n.t('common.cancel'), id.common.cancel);

i18n.locale = 'fr';
eq('i18n unknown runtime locale falls back to Indonesian', i18n.t('common.save'), id.common.save);

// Key parity between en and id so fallback to id is always complete.
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...collectKeys(value as Record<string, unknown>, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

const enKeys = new Set(collectKeys(en as unknown as Record<string, unknown>));
const idKeys = new Set(collectKeys(id as unknown as Record<string, unknown>));
const missingInId = [...enKeys].filter((key) => !idKeys.has(key));
const extraInId = [...idKeys].filter((key) => !enKeys.has(key));

check('id locale has all en keys', missingInId.length === 0, missingInId.join(', '));
check('id locale has no extra keys', extraInId.length === 0, extraInId.join(', '));

// Native iOS localization config in app.json and locales/native/*.json.
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const infoPlist = appJson.expo.ios.infoPlist as Record<string, unknown>;
const bundleLocalizations = infoPlist.CFBundleLocalizations;
check(
  'app.json CFBundleLocalizations includes id and en',
  Array.isArray(bundleLocalizations) &&
    bundleLocalizations.includes('id') &&
    bundleLocalizations.includes('en'),
  JSON.stringify(bundleLocalizations),
);

const nativeLocales = (appJson.expo as Record<string, unknown>).locales as
  | Record<string, string>
  | undefined;
const requiredIosPermissionKeys = [
  'NSPhotoLibraryUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
] as const;

for (const lang of ['id', 'en'] as const) {
  const relPath = nativeLocales?.[lang];
  check(`app.json expo.locales.${lang} is set`, typeof relPath === 'string' && relPath.length > 0);
  if (typeof relPath === 'string') {
    const absPath = path.resolve(rootDir, relPath);
    check(`locale file exists for ${lang}`, fs.existsSync(absPath), absPath);
    if (fs.existsSync(absPath)) {
      const parsed = JSON.parse(fs.readFileSync(absPath, 'utf8')) as {
        ios?: Record<string, unknown>;
        [key: string]: unknown;
      };
      // Keep iOS permission keys scoped under `ios` so Android Locales.js does not emit them.
      const topLevelKeys = Object.keys(parsed).filter((k) => k !== 'ios' && k !== 'android');
      check(
        `locales/native/${lang}.json scopes iOS keys under ios`,
        topLevelKeys.length === 0,
        topLevelKeys.join(', '),
      );
      for (const permKey of requiredIosPermissionKeys) {
        const val = parsed.ios?.[permKey];
        check(
          `locales/native/${lang}.json ios.${permKey} is non-empty`,
          typeof val === 'string' && val.trim().length > 0,
        );
        if (lang === 'en') {
          eq(`locales/native/en.json ios.${permKey} matches app.json`, val, infoPlist[permKey]);
        }
      }
    }
  }
}

const plugins = appJson.expo.plugins as unknown[];
check(
  'app.json registers ./plugins/with-ios-known-regions',
  plugins.includes('./plugins/with-ios-known-regions'),
);

console.log(`${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
