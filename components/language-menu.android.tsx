import { DropdownMenu, DropdownMenuItem, Host, Icon, Text } from '@expo/ui/jetpack-compose';
import { fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LANGUAGE_OPTIONS } from '@/constants/languages';
import { useLanguage } from '@/contexts/language';
import { useSymbolIcon } from '@/hooks/use-symbol-icon';
import { k } from '@/locales/keys';

/**
 * Makes the Settings language row open a Material 3 dropdown menu listing the app languages, with
 * a check on the current one. The menu anchors to a 1dp strip at the row's trailing edge, so it
 * opens below the row, aligned to its end.
 */
export function LanguageMenu({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const checkIcon = useSymbolIcon({ sf: 'checkmark', md: 'check' });

  return (
    <View>
      <Pressable
        onPress={() => setExpanded(true)}
        android_ripple={{}}
        accessibilityRole="button"
        accessibilityLabel={t(k.settings.selectLanguage)}
      >
        {children}
      </Pressable>
      <Host pointerEvents="none" style={styles.anchor}>
        <DropdownMenu
          expanded={expanded}
          onDismissRequest={() => setExpanded(false)}
          modifiers={[fillMaxSize()]}
        >
          <DropdownMenu.Items>
            {LANGUAGE_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.locale}
                onClick={() => {
                  setExpanded(false);
                  setLocale(option.locale);
                }}
              >
                <DropdownMenuItem.Text>
                  <Text>{t(option.labelKey)}</Text>
                </DropdownMenuItem.Text>
                {option.locale === locale && checkIcon && typeof checkIcon !== 'string' ? (
                  <DropdownMenuItem.TrailingIcon>
                    <Icon source={checkIcon} />
                  </DropdownMenuItem.TrailingIcon>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 1,
  },
});
