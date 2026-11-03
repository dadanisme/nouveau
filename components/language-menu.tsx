import ContextMenu from 'react-native-context-menu-view';

import { LANGUAGE_OPTIONS } from '@/constants/languages';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

/**
 * Wraps the Settings language row in a native pull-down menu (UIMenu, opened by a single tap)
 * listing the app languages, with a checkmark on the current one. The row itself must not be a
 * Pressable: the tap that opens the menu would also reach it.
 */
export function LanguageMenu({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useLanguage();

  return (
    <ContextMenu
      dropdownMenuMode
      title={t(k.settings.selectLanguage)}
      actions={LANGUAGE_OPTIONS.map((option) => ({
        title: t(option.labelKey),
        selected: option.locale === locale,
      }))}
      onPress={(event) => {
        const option = LANGUAGE_OPTIONS[event.nativeEvent.index];
        if (option) setLocale(option.locale);
      }}
    >
      {children}
    </ContextMenu>
  );
}
