import type { AndroidSymbol } from 'expo-symbols';
import type { ColorValue, ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';

/**
 * A row icon for both platforms: the SF Symbol name (iOS) and a Material Symbols vector drawable
 * (Android), e.g. `{ sf: 'globe', md: require('@/assets/icons/language.xml') }`.
 */
export type FormIcon = { sf: SFSymbol; md: ImageSourcePropType };

/**
 * A row glyph drawn from the system symbol sets, for icons chosen at runtime (e.g. a category's):
 * any SF Symbol (iOS) or Material Symbol name (Android, from the Material Symbols font, so no
 * vector asset per icon), optionally tinted. Static row icons keep using {@link FormIcon}.
 */
export type FormSymbol = { sf: SFSymbol; material: AndroidSymbol; color?: ColorValue };

export type NativeFormProps = {
  /**
   * Heading for a form shown in a sheet without a native header (`(sheets)/*`).
   */
  title?: string;
  /** Pull to refresh; the indicator shows until the promise settles. */
  onRefresh?: () => Promise<void>;
  children: React.ReactNode;
};

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

export type FormListRowProps = {
  title: string;
  /** Leading glyph, e.g. a category's mapped icon in its color. */
  symbol?: FormSymbol;
  /** Current value, shown trailing (iOS) or as supporting text (Android). */
  value?: string;
  onPress: () => void;
  /**
   * Adds a destructive delete action: a trailing swipe action on iOS (full swipe allowed), a
   * long-press menu item on Android. The handler should confirm (`Alert.alert`) before deleting.
   */
  onDelete?: () => void;
  /** Title of the delete action. Required with `onDelete`. */
  deleteLabel?: string;
};

export type FormTextFieldRowProps = {
  placeholder: string;
  /** Initial text, read once on mount (the field owns its text natively afterwards). */
  defaultValue?: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
  maxLength?: number;
};

export type FormSegmentedRowProps<T extends string> = {
  /** What the control picks, for screen readers (the segments are its only visible labels). */
  label: string;
  options: readonly FormPickerOption<T>[];
  selection: T;
  onSelectionChange: (value: T) => void;
};

export type FormEmptyRowProps = {
  title: string;
  description?: string;
  symbol: FormSymbol;
};
