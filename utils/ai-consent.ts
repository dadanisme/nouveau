import type { FormSymbol } from '@/components/native-form-types';

/**
 * The one-time consent before Nouveau sends anything to a third-party AI (#122), the pure part.
 * One stored answer (`users.ai_consent`) covers both AI features, auto-categorize and receipt
 * scan, and is asked for just in time, at first use. `scripts/check-ai-consent.ts` tests these
 * rules.
 */

/** What `users.ai_consent` holds; null until the person has answered. */
export type AiConsent = 'granted' | 'declined' | null;

/** Where the prompt was opened from: the rules differ per feature. */
export type AiConsentSource = 'autoCategorize' | 'scanReceipt' | 'settings';

/** The prompt's two buttons. */
export type AiConsentChoice = 'allow' | 'notNow';

/** The prompt's symbol: the sparkles of AI features (Material's `auto_awesome`). */
export const AI_CONSENT_SYMBOL: FormSymbol = { sf: 'sparkles', material: 'auto_awesome' };

/** The stored column as a consent: anything but the two answers (or a missing column) is null. */
export function parseAiConsent(value: unknown): AiConsent {
  return value === 'granted' || value === 'declined' ? value : null;
}

/**
 * What the debounced auto-categorize does for a description:
 * - `wait`: the stored answer isn't known yet, so nothing is sent (it decides once it loads);
 * - `classify`: allowed, it runs as before;
 * - `ask`: never answered, and not asked yet in this editor: the prompt opens;
 * - `skip`: declined (turned back on in Settings), or already asked in this editor: nothing is
 *   sent and nothing is said.
 */
export type AutoCategorizeDecision = 'wait' | 'classify' | 'ask' | 'skip';

export function getAutoCategorizeDecision(input: {
  consent: AiConsent;
  /** The stored answer has loaded. */
  isKnown: boolean;
  /** The prompt has opened once in this editor session. */
  hasAsked: boolean;
}): AutoCategorizeDecision {
  if (!input.isKnown) return 'wait';
  if (input.consent === 'granted') return 'classify';
  if (input.consent === 'declined' || input.hasAsked) return 'skip';
  return 'ask';
}

/**
 * Scan Receipt is always a deliberate tap, so it asks whenever consent isn't granted, a stored
 * `declined` included.
 */
export function getScanDecision(consent: AiConsent): 'scan' | 'ask' {
  return consent === 'granted' ? 'scan' : 'ask';
}

/**
 * What a choice on the prompt stores, or `unchanged`. Allow always grants. Not Now declines only
 * for auto-categorize (so it never asks again); for a scan it just cancels that scan, and in
 * Settings the toggle stays off as it was.
 */
export function getConsentToStore(
  source: AiConsentSource,
  choice: AiConsentChoice,
): 'granted' | 'declined' | 'unchanged' {
  if (choice === 'allow') return 'granted';
  return source === 'autoCategorize' ? 'declined' : 'unchanged';
}

/** Settings' AI Processing toggle is on only while consent is granted. */
export function isAiProcessingOn(consent: AiConsent): boolean {
  return consent === 'granted';
}

/** Flipping the toggle: on opens the prompt; off declines at once, with no prompt. */
export function getToggleAction(isOn: boolean): 'ask' | 'decline' {
  return isOn ? 'ask' : 'decline';
}

/**
 * After the server refused an AI call with `ai_consent_required` (consent changed on another
 * device), with the stored answer read again: auto-categorize asks only when it's now unanswered
 * and it hasn't asked in this editor (declined, or granted again, stays silent); a scan always
 * asks.
 */
export function getConsentRequiredAction(input: {
  source: AiConsentSource;
  refreshed: AiConsent;
  hasAsked: boolean;
}): 'ask' | 'skip' {
  if (input.source !== 'autoCategorize') return 'ask';
  return input.refreshed === null && !input.hasAsked ? 'ask' : 'skip';
}

/**
 * A moneymail 403 for an AI feature without consent (`code: "ai_consent_required"`), the
 * counterpart of `isPremiumRequiredError` (`utils/premium.ts`), matched on the `ApiError`
 * (`lib/api.ts`) by shape so this stays pure.
 */
export function isAiConsentRequiredError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { status, code } = error as { status?: unknown; code?: unknown };
  return code === 'ai_consent_required' && (status === undefined || status === 403);
}
