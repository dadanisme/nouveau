import type { FormSymbol } from '@/components/native-form-types';

/** Props shared by the iOS and Android builds of the extra form rows and the screen placeholder. */

/** A status glyph trailing a detail row. */
export type FormRowStatus = {
  tone: 'positive' | 'negative';
  /** Spoken in place of the glyph. */
  label: string;
};

export type FormDetailRowProps = {
  title: string;
  /** Secondary line under the title. */
  subtitle?: string;
  /** Leading glyph. */
  symbol?: FormSymbol;
  status?: FormRowStatus;
  /** Lets the user select and copy the title (e.g. shared text). iOS only. */
  selectable?: boolean;
};

export type FormImageRowProps = {
  /** A local `file://` image URI (iOS reads it synchronously). */
  uri: string;
  accessibilityLabel?: string;
};

/** Same shape as `FormEmptyRowProps`, for screens (or cells) that aren't a form. */
export type ScreenPlaceholderProps = {
  title: string;
  description?: string;
  symbol: FormSymbol;
};
