/**
 * Checks the one-time AI consent's rules (#122, `utils/ai-consent.ts`) and its strings:
 * - parsing the stored `users.ai_consent` (only `granted` / `declined`; anything else is unanswered);
 * - auto-categorize per stored value: waits until loaded, classifies when granted, skips silently
 *   when declined, asks when unanswered but only once per editor session;
 * - Scan Receipt asks unless granted, a stored `declined` included;
 * - what Allow and Not Now store per source (Not Now declines only for auto-categorize);
 * - Settings' toggle: on only when granted, on asks, off declines;
 * - the server mismatch (`ai_consent_required`): auto-categorize re-asks only when the refreshed
 *   value is unanswered and it hasn't asked yet, a scan always asks; the error matcher;
 * - every `aiConsent.*` string in en and id, the Privacy Policy link, and the Android sentence-case
 *   lines for the Title Case ones.
 *
 * Run: bun scripts/check-ai-consent.ts (exits 1 on any failure).
 */
import { androidOverrides } from '../locales/android';
import en from '../locales/en';
import id from '../locales/id';
import {
  AI_CONSENT_SYMBOL,
  getAutoCategorizeDecision,
  getConsentRequiredAction,
  getConsentToStore,
  getScanDecision,
  getToggleAction,
  isAiConsentRequiredError,
  isAiProcessingOn,
  parseAiConsent,
  type AiConsent,
  type AiConsentSource,
} from '../utils/ai-consent';
import { isPremiumRequiredError } from '../utils/premium';

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

function equal(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(name, a === e, `got ${a}, expected ${e}`);
}

/** The string at a dot-path key (`aiConsent.title`), or undefined. */
function lookup(tree: unknown, key: string): string | undefined {
  let node: unknown = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * Sentence case: in each sentence, no word after the first starts with a capital, except the
 * listed proper nouns (punctuation around a word is ignored).
 */
function isSentenceCase(text: string, properNouns: readonly string[] = []): boolean {
  return text.split(/(?<=[.?!])\s+/).every((sentence) =>
    sentence
      .split(/\s+/)
      .slice(1)
      .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
      .every((word) => properNouns.includes(word) || word[0] === word[0]?.toLowerCase()),
  );
}

const CONSENTS: readonly AiConsent[] = ['granted', 'declined', null];

// --- The stored value ----------------------------------------------------------------------
equal('parse granted', parseAiConsent('granted'), 'granted');
equal('parse declined', parseAiConsent('declined'), 'declined');
equal('parse null', parseAiConsent(null), null);
equal('parse missing column', parseAiConsent(undefined), null);
equal('parse unknown text', parseAiConsent('yes'), null);
equal('parse wrong case', parseAiConsent('Granted'), null);
equal('parse a boolean', parseAiConsent(true), null);

// --- Auto-categorize ---------------------------------------------------------------------------
for (const consent of CONSENTS) {
  for (const hasAsked of [false, true]) {
    equal(
      `auto-categorize waits while loading (${consent}, asked ${hasAsked})`,
      getAutoCategorizeDecision({ consent, isKnown: false, hasAsked }),
      'wait',
    );
  }
}
equal(
  'auto-categorize classifies when granted',
  getAutoCategorizeDecision({ consent: 'granted', isKnown: true, hasAsked: false }),
  'classify',
);
equal(
  'auto-categorize classifies when granted after asking',
  getAutoCategorizeDecision({ consent: 'granted', isKnown: true, hasAsked: true }),
  'classify',
);
equal(
  'auto-categorize skips when declined (never asks again)',
  getAutoCategorizeDecision({ consent: 'declined', isKnown: true, hasAsked: false }),
  'skip',
);
equal(
  'auto-categorize asks when unanswered',
  getAutoCategorizeDecision({ consent: null, isKnown: true, hasAsked: false }),
  'ask',
);
equal(
  'auto-categorize asks once per editor session',
  getAutoCategorizeDecision({ consent: null, isKnown: true, hasAsked: true }),
  'skip',
);

// --- Scan Receipt ------------------------------------------------------------------------------
equal('scan runs when granted', getScanDecision('granted'), 'scan');
equal('scan asks when unanswered', getScanDecision(null), 'ask');
equal('scan asks again when declined', getScanDecision('declined'), 'ask');

// --- What a choice stores ----------------------------------------------------------------------
const SOURCES: readonly AiConsentSource[] = ['autoCategorize', 'scanReceipt', 'settings'];
for (const source of SOURCES) {
  equal(`Allow from ${source} grants`, getConsentToStore(source, 'allow'), 'granted');
}
equal(
  'Not Now from auto-categorize declines',
  getConsentToStore('autoCategorize', 'notNow'),
  'declined',
);
equal(
  'Not Now from a scan stores nothing (cancels that scan)',
  getConsentToStore('scanReceipt', 'notNow'),
  'unchanged',
);
equal(
  'Not Now from Settings stores nothing (stays off)',
  getConsentToStore('settings', 'notNow'),
  'unchanged',
);

// --- Settings' toggle --------------------------------------------------------------------------
equal('toggle on when granted', isAiProcessingOn('granted'), true);
equal('toggle off when declined', isAiProcessingOn('declined'), false);
equal('toggle off when unanswered', isAiProcessingOn(null), false);
equal('turning it on asks', getToggleAction(true), 'ask');
equal('turning it off declines at once', getToggleAction(false), 'decline');

// --- The server mismatch (`ai_consent_required`) -----------------------------------------------
equal(
  'mismatch: auto-categorize re-asks when now unanswered',
  getConsentRequiredAction({ source: 'autoCategorize', refreshed: null, hasAsked: false }),
  'ask',
);
equal(
  'mismatch: auto-categorize stays silent when now declined',
  getConsentRequiredAction({ source: 'autoCategorize', refreshed: 'declined', hasAsked: false }),
  'skip',
);
equal(
  'mismatch: auto-categorize stays silent when still granted (no loop)',
  getConsentRequiredAction({ source: 'autoCategorize', refreshed: 'granted', hasAsked: false }),
  'skip',
);
equal(
  'mismatch: auto-categorize stays silent once asked in this editor',
  getConsentRequiredAction({ source: 'autoCategorize', refreshed: null, hasAsked: true }),
  'skip',
);
for (const refreshed of CONSENTS) {
  for (const hasAsked of [false, true]) {
    equal(
      `mismatch: a scan always asks (${refreshed}, asked ${hasAsked})`,
      getConsentRequiredAction({ source: 'scanReceipt', refreshed, hasAsked }),
      'ask',
    );
  }
}

// The error matcher, and that it doesn't overlap Premium's.
const consentError = { status: 403, code: 'ai_consent_required' };
const premiumError = { status: 403, code: 'premium_required' };
check('consent 403 matches', isAiConsentRequiredError(consentError));
check(
  'consent code without a status matches',
  isAiConsentRequiredError({ code: 'ai_consent_required' }),
);
check(
  'consent code on a 500 does not match',
  !isAiConsentRequiredError({ status: 500, code: 'ai_consent_required' }),
);
check('premium 403 is not a consent error', !isAiConsentRequiredError(premiumError));
check('consent 403 is not a premium error', !isPremiumRequiredError(consentError));
check('null is not a consent error', !isAiConsentRequiredError(null));
check('a string is not a consent error', !isAiConsentRequiredError('ai_consent_required'));
check(
  'an Error is not a consent error',
  !isAiConsentRequiredError(new Error('ai_consent_required')),
);

check('prompt has symbols', !!AI_CONSENT_SYMBOL.sf && !!AI_CONSENT_SYMBOL.material);

// --- Strings -----------------------------------------------------------------------------------
const LOCALES = { en, id } as const;
// Proper nouns and acronyms keep their capitals in sentence case.
const NAMES = ['AI', 'Nouveau', 'OpenRouter', 'Google', 'Gemini', 'PDF'];
const PROPER_NOUNS = { en: NAMES, id: [...NAMES, 'Anda'] } as const;
const KEYS = [
  'aiConsent.title',
  'aiConsent.body',
  'aiConsent.allow',
  'aiConsent.notNow',
  'aiConsent.toggle',
  'aiConsent.footer',
  'aiConsent.saveFailed',
  'legal.privacy',
];
for (const key of KEYS) {
  for (const [locale, strings] of Object.entries(LOCALES)) {
    check(`${key} in ${locale}`, !!lookup(strings, key)?.trim());
  }
}
// Both locales have the same aiConsent keys and nothing extra.
const enKeys = Object.keys(en.aiConsent).sort();
const idKeys = Object.keys(id.aiConsent).sort();
equal('id has the same aiConsent keys as en', idKeys, enKeys);
check(
  'every aiConsent key is checked',
  enKeys.every((key) => KEYS.includes(`aiConsent.${key}`)),
  enKeys.join(', '),
);

// The Title Case labels (buttons, titles) need an Android sentence-case line; one-word ones and
// the already sentence-case body and footer don't.
const TITLE_CASE = {
  en: ['aiConsent.title', 'aiConsent.notNow', 'aiConsent.toggle', 'aiConsent.saveFailed'],
  id: ['aiConsent.title', 'aiConsent.notNow', 'aiConsent.saveFailed'],
} as const;
for (const locale of ['en', 'id'] as const) {
  for (const key of TITLE_CASE[locale]) {
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
  // Whatever Android shows, base or override, is sentence case.
  for (const key of KEYS.filter((k) => k.startsWith('aiConsent.'))) {
    const shown = lookup(androidOverrides[locale], key) ?? lookup(LOCALES[locale], key) ?? '';
    check(
      `${key} as Android shows it in ${locale} is sentence case`,
      isSentenceCase(shown, PROPER_NOUNS[locale]),
      shown,
    );
  }
}
for (const [locale, strings] of Object.entries(LOCALES)) {
  check(
    `title is a question in ${locale}`,
    (lookup(strings, 'aiConsent.title') ?? '').endsWith('?'),
  );
  const body = lookup(strings, 'aiConsent.body') ?? '';
  const footer = lookup(strings, 'aiConsent.footer') ?? '';
  // Says to whom it goes.
  for (const name of ['OpenRouter', 'Google Gemini']) {
    check(`body names ${name} in ${locale}`, body.includes(name), body);
  }
  check(`footer names OpenRouter in ${locale}`, footer.includes('OpenRouter'), footer);
}

console.log(`${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
