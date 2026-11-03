import { Host, HStack, Menu, Picker, Spacer, Text } from '@expo/ui/swift-ui';
import { accessibilityLabel, contentShape, frame, shapes, tag } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet, View } from 'react-native';

import { LANGUAGE_OPTIONS } from '@/constants/languages';
import { useLanguage, type Locale } from '@/contexts/language';
import { k } from '@/locales/keys';

/**
 * Makes the Settings language row open a native SwiftUI pull-down menu (single tap) listing the
 * app languages, with a checkmark on the current one. The menu's label is an invisible, full-size
 * hit area laid over the row, so the row itself must not be a Pressable.
 *
 * SwiftUI via `@expo/ui`, not `react-native-context-menu-view`: that library is a legacy (Paper)
 * view, and unmounting it under Fabric aborts dev builds with "Attempt to recycle a mounted view"
 * (sign-out, reload).
 */
export function LanguageMenu({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useLanguage();

  return (
    <View>
      {children}
      <Host style={StyleSheet.absoluteFill}>
        <Menu
          label={
            <HStack
              modifiers={[
                frame({ maxWidth: Infinity, maxHeight: Infinity }),
                contentShape(shapes.rectangle()),
                accessibilityLabel(t(k.settings.selectLanguage)),
              ]}
            >
              <Spacer />
            </HStack>
          }
        >
          <Picker<Locale> selection={locale} onSelectionChange={setLocale}>
            {LANGUAGE_OPTIONS.map((option) => (
              <Text key={option.locale} modifiers={[tag(option.locale)]}>
                {t(option.labelKey)}
              </Text>
            ))}
          </Picker>
        </Menu>
      </Host>
    </View>
  );
}
