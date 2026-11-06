/**
 * Checks the guest sign-in prompt's wording (#100, `utils/sign-in-prompt.ts`):
 * - every feature has its own title, in en and id, and in Android sentence case for both;
 * - the body: the guest's line for a guest, a signed-out line with no device-data promise otherwise;
 * - the shared strings (bodies, Sign In, Not Now) and Settings' Erase Data strings exist in both
 *   locales, with the Android sentence-case lines a Title Case label needs;
 * - the `feature` route param parses, falling back to `generic`.
 *
 * Run: bun scripts/check-sign-in-prompt.ts (exits 1 on any failure).
 */
import { androidOverrides } from '../locales/android';
import en from '../locales/en';
import id from '../locales/id';
import {
  getSignInPromptBodyKey,
  getSignInPromptContent,
  parseSignInFeature,
  SIGN_IN_FEATURES,
} from '../utils/sign-in-prompt';

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

/** The string at a dot-path key (`signInPrompt.proofsTitle`), or undefined. */
function lookup(tree: unknown, key: string): string | undefined {
  let node: unknown = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Sentence case: no word after the first starts with a capital, except the listed proper nouns. */
function isSentenceCase(text: string, properNouns: readonly string[] = []): boolean {
  return text
    .split(/\s+/)
    .slice(1)
    .every((word) => properNouns.includes(word) || word[0] === word[0]?.toLowerCase());
}

const LOCALES = { en, id } as const;
const PROPER_NOUNS = { en: [], id: ['Anda'] } as const;

// Each feature: its own title, in every locale and in Android sentence case.
const titles = new Set<string>();
for (const feature of SIGN_IN_FEATURES) {
  const { titleKey, symbol } = getSignInPromptContent(feature);
  check(`${feature} has symbols`, !!symbol.sf && !!symbol.material);
  for (const [locale, strings] of Object.entries(LOCALES) as [keyof typeof LOCALES, unknown][]) {
    const title = lookup(strings, titleKey);
    check(`${feature} title in ${locale}`, !!title?.trim(), titleKey);
    const android = lookup(androidOverrides[locale], titleKey);
    check(`${feature} Android title in ${locale}`, !!android?.trim(), titleKey);
    if (android) {
      check(
        `${feature} Android title in ${locale} is sentence case`,
        isSentenceCase(android, PROPER_NOUNS[locale]),
        android,
      );
    }
  }
  const enTitle = lookup(en, titleKey) ?? '';
  check(`${feature} en title names signing in`, enTitle.startsWith('Sign In to '), enTitle);
  check(`${feature} title is its own`, !titles.has(enTitle), enTitle);
  titles.add(enTitle);
}

// Shared strings, and the Title Case ones' Android lines.
const SHARED_KEYS = [
  'signInPrompt.body',
  'signInPrompt.bodySignedOut',
  'signInPrompt.signIn',
  'signInPrompt.notNow',
];
const ERASE_KEYS = [
  'settings.eraseData',
  'settings.erasingData',
  'settings.eraseDataConfirm',
  'settings.eraseDataPrompt',
  'settings.eraseDataMessage',
  'settings.eraseDataFailed',
];
for (const key of [...SHARED_KEYS, ...ERASE_KEYS]) {
  for (const [locale, strings] of Object.entries(LOCALES)) {
    check(`${key} in ${locale}`, !!lookup(strings, key)?.trim());
  }
}
const TITLE_CASE_KEYS = [
  'signInPrompt.notNow',
  'settings.eraseData',
  'settings.erasingData',
  'settings.eraseDataConfirm',
  'settings.eraseDataFailed',
];
for (const key of TITLE_CASE_KEYS) {
  for (const locale of ['en', 'id'] as const) {
    const android = lookup(androidOverrides[locale], key);
    check(`${key} Android line in ${locale}`, !!android?.trim());
    if (android) {
      check(
        `${key} Android line in ${locale} is sentence case`,
        isSentenceCase(android, PROPER_NOUNS[locale]),
        android,
      );
    }
  }
}
// "Sign In" is "Masuk" in id, one word, so only en needs its Android line.
check(
  'signInPrompt.signIn Android line in en',
  !!lookup(androidOverrides.en, 'signInPrompt.signIn'),
);
check(
  'eraseDataPrompt is a question (the Android dialog headline)',
  (lookup(en, 'settings.eraseDataPrompt') ?? '').endsWith('?') &&
    (lookup(id, 'settings.eraseDataPrompt') ?? '').endsWith('?'),
);

// The body: a guest's promise only for a guest; the signed-out line makes none.
check('guest body', getSignInPromptBodyKey(true) === 'signInPrompt.body');
check('signed-out body', getSignInPromptBodyKey(false) === 'signInPrompt.bodySignedOut');
for (const [locale, strings] of Object.entries(LOCALES) as [keyof typeof LOCALES, unknown][]) {
  const guestBody = lookup(strings, 'signInPrompt.body') ?? '';
  const signedOutBody = lookup(strings, 'signInPrompt.bodySignedOut') ?? '';
  check(`signed-out body differs from the guest's in ${locale}`, signedOutBody !== guestBody);
  check(
    `signed-out body in ${locale} doesn't promise device data`,
    !/device|perangkat/i.test(signedOutBody),
    signedOutBody,
  );
  // Already sentence case, so Android needs no line of its own.
  check(
    `signed-out body in ${locale} is sentence case`,
    isSentenceCase(signedOutBody, PROPER_NOUNS[locale]),
    signedOutBody,
  );
}

// The `feature` param.
for (const feature of SIGN_IN_FEATURES) {
  check(`parse ${feature}`, parseSignInFeature(feature) === feature);
}
check('parse undefined', parseSignInFeature(undefined) === 'generic');
check('parse unknown', parseSignInFeature('export') === 'generic');
check('parse empty', parseSignInFeature('') === 'generic');
check('parse array', parseSignInFeature(['proofs', 'invite']) === 'proofs');
check('generic is a feature', (SIGN_IN_FEATURES as readonly string[]).includes('generic'));

console.log(`${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
