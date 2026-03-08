import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import i18n from '@/lib/i18n';
import type { Scope, TranslateOptions } from 'i18n-js';

type Locale = 'en' | 'id';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (scope: Scope, options?: TranslateOptions) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(i18n.locale as Locale);

  useEffect(() => {
    const stored = localStorage.getItem('app_language');
    if (stored === 'en' || stored === 'id') {
      i18n.locale = stored;
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    i18n.locale = newLocale;
    localStorage.setItem('app_language', newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (scope: Scope, options?: TranslateOptions) => {
      return i18n.t(scope, { ...options, locale });
    },
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
