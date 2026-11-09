/**
 * The legal pages on nouveau-website (#81), linked from Settings, Sign Up / Login and the paywall
 * (store-required disclosures). The www host: the apex redirects there.
 */
export const LEGAL_URLS = {
  terms: 'https://www.nouveau.my.id/terms',
  privacy: 'https://www.nouveau.my.id/privacy',
  deleteAccount: 'https://www.nouveau.my.id/delete-account',
} as const;

export type LegalPage = keyof typeof LEGAL_URLS;
