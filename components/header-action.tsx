import type { NativeStackNavigationOptions } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SymbolViewProps } from 'expo-symbols';
import { Pressable } from 'react-native';

type SFSymbolName = Extract<SymbolViewProps['name'], string>;

interface HeaderActionConfig {
  /** SF Symbol shown on iOS. */
  sf: SFSymbolName;
  /** Material Symbol shown on Android. */
  md: AndroidSymbol;
  /** Accessibility label (also the bar button title on iOS). */
  label: string;
  onPress: () => void;
}

/**
 * Stack screen options for a single icon action on the right of the native header.
 * iOS gets a native bar button item; Android gets a Material Symbol icon button.
 */
export function headerActionOptions({
  sf,
  md,
  label,
  onPress,
}: HeaderActionConfig): NativeStackNavigationOptions {
  return {
    unstable_headerRightItems: () => [
      {
        type: 'button',
        label,
        accessibilityLabel: label,
        icon: { type: 'sfSymbol', name: sf },
        onPress,
      },
    ],
    headerRight: ({ tintColor }) => (
      <Pressable
        onPress={onPress}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={label}
        android_ripple={{ borderless: true }}
      >
        <SymbolView name={{ ios: sf, android: md }} size={24} tintColor={tintColor} />
      </Pressable>
    ),
  };
}
