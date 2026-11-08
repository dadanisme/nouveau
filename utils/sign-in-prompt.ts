import type { FormSymbol } from '@/components/native-form-types';
import { k } from '@/locales/keys';

/**
 * The account-only features a guest (#100) can see but not use, each opening the sign-in prompt
 * (`(sheets)/sign-in-prompt`) with its own title. `generic` is for an entry point with no wording
 * of its own.
 */
export const SIGN_IN_FEATURES = [
  'scanReceipt',
  'proofs',
  'createWorkspace',
  'joinWorkspace',
  'invite',
  'premium',
  'generic',
] as const;

export type SignInFeature = (typeof SIGN_IN_FEATURES)[number];

/** What the prompt shows for a feature: its title and the symbol above it. */
export interface SignInPromptContent {
  /** "Sign In to Scan Receipts". */
  titleKey: string;
  symbol: FormSymbol;
}

const CONTENT: Record<SignInFeature, SignInPromptContent> = {
  scanReceipt: {
    titleKey: k.signInPrompt.scanReceiptTitle,
    symbol: { sf: 'doc.viewfinder', material: 'document_scanner' },
  },
  proofs: {
    titleKey: k.signInPrompt.proofsTitle,
    symbol: { sf: 'paperclip', material: 'attach_file' },
  },
  createWorkspace: {
    titleKey: k.signInPrompt.createWorkspaceTitle,
    symbol: { sf: 'person.2', material: 'group' },
  },
  joinWorkspace: {
    titleKey: k.signInPrompt.joinWorkspaceTitle,
    symbol: { sf: 'envelope', material: 'mail' },
  },
  invite: {
    titleKey: k.signInPrompt.inviteTitle,
    symbol: { sf: 'person.badge.plus', material: 'person_add' },
  },
  // Settings' Premium row (#79): buying Premium needs an account.
  premium: {
    titleKey: k.signInPrompt.premiumTitle,
    symbol: { sf: 'sparkles', material: 'workspace_premium' },
  },
  generic: {
    titleKey: k.signInPrompt.genericTitle,
    symbol: { sf: 'person.crop.circle', material: 'account_circle' },
  },
};

function isSignInFeature(value: string): value is SignInFeature {
  return (SIGN_IN_FEATURES as readonly string[]).includes(value);
}

/** The `feature` route param as a feature; anything unknown (or missing) is `generic`. */
export function parseSignInFeature(value: string | string[] | undefined): SignInFeature {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && isSignInFeature(raw) ? raw : 'generic';
}

export function getSignInPromptContent(feature: SignInFeature): SignInPromptContent {
  return CONTENT[feature];
}

/**
 * The prompt's body line. A guest's device data comes with them when they sign in, so they're told
 * so; with no guest (signed out, a share intent before onboarding) there's nothing to bring.
 */
export function getSignInPromptBodyKey(isGuest: boolean): string {
  return isGuest ? k.signInPrompt.body : k.signInPrompt.bodySignedOut;
}
