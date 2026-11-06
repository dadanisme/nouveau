import type { AndroidSymbol } from 'expo-symbols';
import type { Ref } from 'react';
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
   * Heading for a form shown in a sheet without a native header (Android `(sheets)/*`). iOS sheets
   * show their title in the native header instead, so iOS ignores it.
   */
  title?: string;
  /** Pull to refresh; the indicator shows until the promise settles. */
  onRefresh?: () => Promise<void>;
  /**
   * Extra space under the last row, e.g. `ADD_FAB_CLEARANCE` so it can scroll clear of a
   * floating action button. Android only: iOS insets come from the tab bar and safe area.
   */
  bottomInset?: number;
  /**
   * Dragging the form dismisses the keyboard interactively, for keyboards without a return key
   * (e.g. the decimal pad). iOS only: Android keyboards keep their Done action.
   */
  dismissesKeyboardOnScroll?: boolean;
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
  /**
   * `destructive`: the screen it opens leads to a destructive action (e.g. Delete Account), so the
   * title and icon are the system red (iOS) / Material error color (Android).
   */
  role?: 'default' | 'destructive';
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
  /**
   * Android only: render the action as a full-width M3 button instead of a list item, `filled`
   * for the screen's one primary action (Save on a sheet with no header), `tonal` for a
   * secondary one beside a header Save. iOS action rows are accent-tinted already.
   */
  emphasis?: 'filled' | 'tonal';
  disabled?: boolean;
  /**
   * The action is running: the row is disabled and shows an activity indicator (on Android in
   * place of the icon). Pass
   * the in-progress title (e.g. "Signing Out…") as `title`.
   */
  pending?: boolean;
  onPress: () => void;
};

export type FormNoticeRowProps = {
  /** A non-interactive warning/info line, e.g. a load error. */
  text: string;
  icon?: FormIcon;
};

/** A row action: an iOS swipe action and context-menu item, an Android row-menu item. */
export type FormRowAction = {
  title: string;
  /** `destructive` renders in the system red / Material error color. */
  role?: 'default' | 'destructive';
  icon?: FormIcon;
  /** Should confirm (`confirmDestructive`) before anything destructive. */
  onPress: () => void;
};

/**
 * The generic list row: a leading icon or symbol, title, optional subtitle and value, then a
 * chevron (tappable), a checkmark (`selected` set: single-choice lists) or nothing (static).
 * Row actions: trailing swipe actions (a full swipe runs the first) plus a long-press context menu
 * on iOS; on Android a long-press menu on tappable rows and a visible ⋮ menu on static ones.
 */
export type FormListRowProps = {
  title: string;
  /** Secondary line under the title (e.g. a role or an expiry date). */
  subtitle?: string;
  /** Static leading icon (SF Symbol + vector drawable). */
  icon?: FormIcon;
  /** Leading glyph chosen at runtime, e.g. a category's mapped icon in its color. */
  symbol?: FormSymbol;
  /**
   * Leading filled color swatch, e.g. a category color preview: a `circle.fill` symbol (iOS), a
   * filled circle as in the color picker rows (Android, whose Material Symbols `circle` is an
   * outline). Ignored when `symbol` is set.
   */
  swatch?: ColorValue;
  /**
   * Current value, shown trailing (iOS) or as supporting text (Android; trailing when there is a
   * subtitle).
   */
  value?: string;
  /**
   * Single-choice mode: the checkmark shows when true (VoiceOver says "Selected"), and the row has
   * no chevron either way.
   */
  selected?: boolean;
  /** Makes the row tappable (pushes, presents or selects). */
  onPress?: () => void;
  actions?: readonly FormRowAction[];
  /**
   * An Edit item (pencil) at the top of the long-press menu, so the menu matches the other rows'
   * Edit / Delete. Menu only: it isn't a swipe action.
   */
  onEdit?: () => void;
  /** Title of the edit item. Required with `onEdit`. */
  editLabel?: string;
  /**
   * Shorthand for a trailing destructive delete action, after `actions`. The handler should
   * confirm (`confirmDestructive`) before deleting.
   */
  onDelete?: () => void;
  /** Title of the delete action. Required with `onDelete`. */
  deleteLabel?: string;
};

/**
 * A single-line text input row: a SwiftUI `TextField` (iOS), a filled Material text field
 * (Android). Uncontrolled with `defaultValue` (read once on mount); controlled with `value`
 * (outside changes replace the text). Input traits are independent optional flags.
 */
export type FormTextFieldRowProps = {
  /** Imperative focus, e.g. to move to the next field on the return key. */
  ref?: Ref<FormTextFieldRowRef>;
  /**
   * Shown while empty, unless it repeats `label` (the field's section header or floating label
   * already names it); also the label when `label` is unset.
   */
  placeholder: string;
  /**
   * What the field holds. iOS: the accessibility label. Android: the floating label, with the
   * placeholder inside the empty field.
   */
  label?: string;
  /** Controlled text. */
  value?: string;
  /** Initial text when uncontrolled, read once on mount. */
  defaultValue?: string;
  onChangeText: (text: string) => void;
  /** `email`: email keyboard, no autocapitalization or autocorrection, email autofill. */
  keyboard?: 'default' | 'email';
  /**
   * Masked entry: a SwiftUI `SecureField` (iOS), a password field with the M3 show/hide toggle
   * (Android). No autocapitalization or autocorrection.
   */
  secure?: boolean;
  /**
   * The autofill hint, overriding the `email` keyboard's `emailAddress` (see
   * {@link FormTextFieldContentType}).
   */
  contentType?: FormTextFieldContentType;
  /** @default 'sentences' ('none' with the email keyboard) */
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoFocus?: boolean;
  maxLength?: number;
  /**
   * The keyboard's return key (unset: iOS shows Return, Android Done). Android has no `join`
   * action and shows Done.
   */
  submitLabel?: 'done' | 'send' | 'next' | 'go' | 'join';
  /** Runs when the return key is pressed. */
  onSubmit?: () => void;
  /** Read-only and dimmed, e.g. while the form submits. */
  disabled?: boolean;
};

export type FormTextFieldRowRef = { focus: () => void };

/**
 * What a text field holds, for password managers and autofill:
 *
 * | content type   | iOS `textContentType` | Android autofill `ContentType` |
 * | -------------- | --------------------- | ------------------------------ |
 * | `emailAddress` | `emailAddress`        | `EmailAddress`                 |
 * | `username`     | `username`            | `Username`                     |
 * | `newUsername`  | `username`            | `NewUsername`                  |
 * | `password`     | `password`            | `Password`                     |
 * | `newPassword`  | `newPassword`         | `NewPassword`                  |
 *
 * A sign-in form whose identifier is an email marks it `username` (with the `email` keyboard):
 * iOS pairs saved passwords and passkeys with the `username` field. `newPassword` makes iOS and
 * Google offer a generated strong password.
 */
export type FormTextFieldContentType =
  | 'emailAddress'
  | 'username'
  | 'newUsername'
  | 'password'
  | 'newPassword';

export type FormSegmentedRowProps<T extends string> = {
  /** What the control picks, for screen readers (the segments are its only visible labels). */
  label: string;
  options: readonly FormPickerOption<T>[];
  selection: T;
  onSelectionChange: (value: T) => void;
};

/**
 * Where a {@link FormSegmentedRowProps segmented control} that stands alone sits on iOS (Android
 * always keeps it as a full-width row in an untitled section, which isn't a card there):
 * - `plain`: a row with no card background, in the form's flow (a view switcher at the top of a
 *   screen, like Health's or Screen Time's D/W/M).
 * - `navigationBar`: in the sheet's navigation bar in place of the title (like Calendar's New
 *   Event / Reminder), at standard text sizes. At accessibility sizes, where a bar can't grow, it
 *   stays in the form as a `plain` row and the title comes back.
 */
export type FormSegmentedPlacement = 'plain' | 'navigationBar';

export type FormSegmentedSectionProps<T extends string> = FormSegmentedRowProps<T> & {
  placement: FormSegmentedPlacement;
  /**
   * The screen's title, which a `navigationBar` control replaces: VoiceOver names the control's
   * group with it, so the screen still announces what it is.
   */
  screenTitle?: string;
};

/**
 * How a value reads: `positive` is money coming in (iOS system green; Android keeps the
 * on-surface color, since Material 3 has no success role, and relies on the value's `+` sign).
 */
export type FormValueTone = 'default' | 'positive';

export type FormValueRowProps = {
  title: string;
  /** The value, shown trailing in the body style. */
  value: string;
  tone?: FormValueTone;
  /** Emphasizes the row, e.g. a total. */
  emphasized?: boolean;
};

/**
 * A statement row: a period's main message in a title style, an optional second line under it.
 * Static, read as one element (`accessibilityLabel` replaces both lines, e.g. with full amounts).
 */
export type FormHeadlineRowProps = {
  title: string;
  subtitle?: string;
  /** The title as spoken (e.g. with full amounts). */
  titleAccessibilityLabel?: string;
  /** The subtitle as spoken. */
  subtitleAccessibilityLabel?: string;
};

export type FormProgressRowProps = {
  title: string;
  /** Leading glyph; its color also tints the bar. */
  symbol?: FormSymbol;
  /** Trailing value, e.g. the amount. */
  value: string;
  /** Bar fill, 0–1. */
  progress: number;
  /** Makes the row tappable (with a chevron on iOS). */
  onPress?: () => void;
};

export type FormEmptyRowProps = {
  title: string;
  description?: string;
  symbol: FormSymbol;
  /**
   * A button under the description that resolves the empty state, e.g. Add Transaction: a bordered
   * button (iOS `ContentUnavailableView` actions), an M3 tonal button (Android).
   */
  action?: { title: string; onPress: () => void };
};
