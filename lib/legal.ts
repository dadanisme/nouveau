import * as WebBrowser from 'expo-web-browser';

import { LEGAL_URLS, type LegalPage } from '@/constants/legal';

/**
 * Opens a legal page (#81) in the in-app browser (SFSafariViewController / Custom Tabs), so the
 * person stays in the app and closes it with Done.
 */
export function openLegalPage(page: LegalPage): void {
  void WebBrowser.openBrowserAsync(LEGAL_URLS[page]);
}
