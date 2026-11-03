import type { ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

/**
 * A row icon for both platforms: the SF Symbol name (iOS) and a Material Symbols vector drawable
 * (Android), e.g. `{ sf: 'globe', md: require('@/assets/icons/language.xml') }`.
 */
export type FormIcon = { sf: SFSymbol; md: ImageSourcePropType };

export type NativeFormProps = { children: React.ReactNode };

export type FormSectionProps = {
  /** Section header. */
  title?: string;
  /** Explanatory text under the section. */
  footer?: string;
  children: React.ReactNode;
};

export type FormNavRowProps = {
  title: string;
  icon?: FormIcon;
  /** Current value, shown trailing (iOS) or as supporting text (Android). */
  value?: string;
  /** Count badge (e.g. pending items); hidden when 0 or undefined. */
  badge?: number;
  onPress: () => void;
};

export type FormPickerOption<T extends string> = { value: T; label: string };

export type FormPickerRowProps<T extends string> = {
  title: string;
  icon?: FormIcon;
  options: readonly FormPickerOption<T>[];
  selection: T;
  onSelectionChange: (value: T) => void;
};

export type FormButtonRowProps = {
  title: string;
  /** `destructive` renders in the system red / Material error color. */
  role?: 'default' | 'destructive';
  /** Shown on Android only: iOS action rows are text-only, centered. */
  icon?: FormIcon;
  disabled?: boolean;
  onPress: () => void;
};

export type FormNoticeRowProps = {
  /** A non-interactive warning/info line, e.g. a load error. */
  text: string;
  icon?: FormIcon;
};
